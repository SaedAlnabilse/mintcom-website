import { useCallback, useEffect, useMemo, useState, type ElementType } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
    User,
    Mail,
    Calendar,
    Key,
    Store,
    Building2,
    Copy,
    CheckCircle2,
    Shield,
    Info,
    AlertTriangle,
    Lock,
    Trash2,
    AlertCircle,
    X,
    Users,
    BookOpen,
    Download,
    Settings,
    PlayCircle,
    ExternalLink,
    Scale,
    Landmark,
    CreditCard,
    Library,
    HelpCircle,
    Search,
} from 'lucide-react';
import api from '../../config/api';
import { ONBOARDING_VIDEO_URL } from '../../config/downloads';
import { CURRENCIES, useCurrency } from '../../context/CurrencyContext';
import { useAuth } from '../../context/AuthContext';
import { PasswordResetOtpModal } from '../../components/PasswordResetOtpModal';
import { ChangeCurrencyModal } from '../../components/ChangeCurrencyModal';
import { BusyOverlay } from '../../components/BusyOverlay';
import toast from 'react-hot-toast';
import { getBusinessTypeIcon } from '../../utils/businessTypeIcons';
import { SectionLoader } from '../../components/LoadingState';
import { Pagination, Modal, ModalHeader, ModalBody, Badge, avatarClass, primaryButtonClass } from '../../components/ui';
import { formatInputPlaceholder } from '../../utils/textCase';
import { StepUpVerifier } from '../../components/StepUpVerifier';
import { reauthHeaders } from '../../services/stepUp';
import { getLocalizedManual } from '../../utils/localizedDocs';
import { ACCOUNT_RECOVERY_PATH } from '../../utils/deletionRecovery';

const CRED_ITEMS_PER_PAGE = 3;

interface AccountDetails {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    emailVerified: boolean;
    createdAt: string;
    lastLoginAt?: string;
    trialUsed: boolean;
    trialEndDate?: string;
    defaultCardId?: string;
    deletionRequestedAt?: string;
    establishments?: any[];
}

interface BrandCredential {
    id: string;
    name: string;
    establishmentLoginId: string;
    logo?: string;
    isActive: boolean;
    createdAt: string;
    establishmentCount?: number;
    establishments?: any[];
    _count?: {
        establishments: number;
    };
}

const MAX_OWNER_PROFILE_NAME_LENGTH = 100;
const MAX_OWNER_PROFILE_EMAIL_LENGTH = 254;

/**
 * Experimental Account Management layout: desktop fits the viewport (no page scroll).
 * Set to false for classic scrollable page (full Resources, paginated credentials).
 */
const ACCOUNT_MGMT_VIEWPORT_FIT = false;

const sanitizeOwnerProfileText = (value: unknown, maxLength: number) =>
    String(value ?? '').slice(0, maxLength);

const DELETE_REASON_OPTIONS = [
    { key: 'its_too_expensive', value: "It's too expensive" },
    { key: 'i_found_a_better_alternative', value: 'I found a better alternative' },
    { key: 'missing_features_i_need', value: 'Missing features I need' },
    { key: 'too_difficult_to_use', value: 'Too difficult to use' },
    { key: 'closing_my_business', value: 'Closing my business' },
    { key: 'other', value: 'Other' },
] as const;

export function OwnerAccountManagementPage() {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir(i18n.language) === 'rtl';
    const { account, establishments, logout, updateAccount, updateEstablishmentsCurrency } = useAuth();
    const { updateCurrency } = useCurrency();
    const navigate = useNavigate();
    const hasOnboardingVideo = Boolean(ONBOARDING_VIDEO_URL);
    const userManualDoc = getLocalizedManual('user', i18n.language);
    const setupManualDoc = getLocalizedManual('setup', i18n.language);
    const [accountDetails, setAccountDetails] = useState<AccountDetails | null>(null);
    const [brands, setBrands] = useState<BrandCredential[]>([]);
    const [totalStaff, setTotalStaff] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Password reset modal state
    const [passwordModal, setPasswordModal] = useState<{
        isOpen: boolean;
        type: 'account' | 'establishment' | 'brand';
        targetId?: string;
        targetName?: string;
    }>({
        isOpen: false,
        type: 'account',
    });

    // Profile Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editForm, setEditForm] = useState({
        firstName: '',
        lastName: '',
        email: ''
    });

    const [isDeletingAccount, setIsDeletingAccount] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteStep, setDeleteStep] = useState(1);
    // Stable reason key (locale-independent for analysis) — display text is
    // resolved via i18n reasons.<key>. Sent as reasonKey + reason + locale.
    const [deleteReasonKey, setDeleteReasonKey] = useState('');
    const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

    // Global Currency state
    const [globalCurrency, setGlobalCurrency] = useState('AED');
    const [isUpdatingCurrency, setIsUpdatingCurrency] = useState(false);
    // Currency awaiting confirmation (warning popup) before it is applied.
    const [pendingCurrency, setPendingCurrency] = useState<string | null>(null);

    // Access credentials hub (locations + brands) — compact list for large counts
    const [credTab, setCredTab] = useState<'locations' | 'brands'>('locations');
    const [credSearch, setCredSearch] = useState('');
    const [credPage, setCredPage] = useState(1);

    const handleUpdateGlobalCurrency = async (newCurrency: string) => {
        try {
            setIsUpdatingCurrency(true);
            const response = await api.put('/api/accounts/currency', { currency: newCurrency });
            if (response.data?.success) {
                const currency = newCurrency.toUpperCase();
                setGlobalCurrency(currency);
                updateCurrency(currency);
                updateEstablishmentsCurrency(currency);
                toast.success(t('owner.account.currencyUpdated', { currency }));

                // Update local establishments data
                if (accountDetails?.establishments) {
                    setAccountDetails(prev => prev ? ({
                        ...prev,
                        establishments: prev.establishments!.map(e => ({ ...e, currency }))
                    }) : prev);
                }
            }
        } catch (err: any) {
            console.error('Failed to update currency:', err);
            toast.error(err.response?.data?.message || t('owner.account.currencyUpdateFailed'));
        } finally {
            setIsUpdatingCurrency(false);
        }
    };

    const locationLoginEstablishments = useMemo(() => {
        const profileEstablishments = accountDetails?.establishments || [];
        const contextEstablishments = establishments || [];

        // Prefer profile payload (usually richer), then fill missing fields from context.
        if (profileEstablishments.length > 0) {
            return profileEstablishments.map((profileEst: any) => {
                const contextMatch = contextEstablishments.find((ctxEst: any) => ctxEst.id === profileEst.id);
                return { ...contextMatch, ...profileEst };
            });
        }

        return contextEstablishments;
    }, [accountDetails?.establishments, establishments]);

    const brandLoginRows = useMemo(() => {
        return brands.map((brand) => {
            let count = brand.establishmentCount || brand._count?.establishments || (brand.establishments ? brand.establishments.length : 0);
            if (!count && establishments) {
                const directMatches = establishments.filter((e: any) => e.brandId === brand.id || e.brand?.id === brand.id).length;
                if (directMatches > 0) {
                    count = directMatches;
                } else if (brands.length === 1 && establishments.length > 0) {
                    count = establishments.length;
                }
            }
            return { ...brand, locationCount: count || 0 };
        });
    }, [brands, establishments]);

    const filteredLocationLogins = useMemo(() => {
        const q = credSearch.trim().toLowerCase();
        if (!q) return locationLoginEstablishments;
        return locationLoginEstablishments.filter((est: any) => {
            const slug = String(est.establishmentLoginId || est.loginId || est.locationLoginId || est.id || '').toLowerCase();
            const name = String(est.name || '').toLowerCase();
            const currency = String(est.currency || '').toLowerCase();
            return name.includes(q) || slug.includes(q) || currency.includes(q);
        });
    }, [locationLoginEstablishments, credSearch]);

    const filteredBrandLogins = useMemo(() => {
        const q = credSearch.trim().toLowerCase();
        if (!q) return brandLoginRows;
        return brandLoginRows.filter((brand) => {
            const slug = String(brand.establishmentLoginId || '').toLowerCase();
            const name = String(brand.name || '').toLowerCase();
            return name.includes(q) || slug.includes(q);
        });
    }, [brandLoginRows, credSearch]);

    const hasAccessCredentials = locationLoginEstablishments.length > 0 || brands.length > 0;
    const showCredTabs = locationLoginEstablishments.length > 0 && brands.length > 0;

    // Prefer the tab that has items; keep user choice when both exist.
    useEffect(() => {
        if (credTab === 'locations' && locationLoginEstablishments.length === 0 && brands.length > 0) {
            setCredTab('brands');
        } else if (credTab === 'brands' && brands.length === 0 && locationLoginEstablishments.length > 0) {
            setCredTab('locations');
        }
    }, [credTab, locationLoginEstablishments.length, brands.length]);

    // Reset credentials page when filters change (same pattern as locations table)
    useEffect(() => {
        setCredPage(1);
    }, [credTab, credSearch]);

    // Clamp page if the filtered list shrinks
    useEffect(() => {
        const total =
            credTab === 'locations' ? filteredLocationLogins.length : filteredBrandLogins.length;
        const pages = Math.max(1, Math.ceil(total / CRED_ITEMS_PER_PAGE));
        setCredPage((p) => Math.min(p, pages));
    }, [credTab, filteredLocationLogins.length, filteredBrandLogins.length]);

    const handleEditClick = () => {
        if (accountDetails) {
            setEditForm({
                firstName: accountDetails.firstName || '',
                lastName: accountDetails.lastName || '',
                email: accountDetails.email || ''
            });
            setIsEditing(true);
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditForm({
            firstName: '',
            lastName: '',
            email: ''
        });
    };

    const handleSaveProfile = async () => {
        try {
            setIsSaving(true);

            const normalizedEditForm = {
                firstName: sanitizeOwnerProfileText(editForm.firstName, MAX_OWNER_PROFILE_NAME_LENGTH).trim(),
                lastName: sanitizeOwnerProfileText(editForm.lastName, MAX_OWNER_PROFILE_NAME_LENGTH).trim(),
                email: sanitizeOwnerProfileText(editForm.email, MAX_OWNER_PROFILE_EMAIL_LENGTH).trim(),
            };

            if (!normalizedEditForm.firstName || !normalizedEditForm.lastName || !normalizedEditForm.email) {
                toast.error(t('owner.account.validation.requiredFields'));
                setIsSaving(false);
                return;
            }

            const response = await api.put('/api/accounts/profile', normalizedEditForm);

            // Backend returns the updated user object directly (check for id)
            if (response.data && response.data.id) {
                const updatedData = response.data;
                const emailChangedButNotVerified = normalizedEditForm.email.toLowerCase() !== updatedData.email.toLowerCase();

                if (emailChangedButNotVerified) {
                    toast.success(t('owner.account.profileUpdatedVerifyEmail'), { duration: 5000 });
                } else {
                    toast.success(t('owner.account.profileUpdated'));
                }

                // Update local state immediately with the fresh data from the response
                setAccountDetails(prev => prev ? ({
                    ...prev,
                    firstName: updatedData.firstName,
                    lastName: updatedData.lastName,
                    email: updatedData.email,
                    emailVerified: updatedData.emailVerified
                }) : null);

                // Update global context for other components
                updateAccount({
                    firstName: updatedData.firstName,
                    lastName: updatedData.lastName,
                    email: updatedData.email,
                    emailVerified: updatedData.emailVerified
                });

                setIsEditing(false);
            }
        } catch (err: any) {
            console.error('Failed to update profile:', err);
            toast.error(err.response?.data?.message || t('owner.account.updateFailed'));
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        if (!showDeleteConfirm) {
            setDeleteStep(1);
            setDeleteReasonKey('');
            setDeleteConfirmationText('');
            }
    }, [showDeleteConfirm]);

    const fetchAccountData = useCallback(async () => {
        try {
            setIsLoading(true);

            const [profileRes, employeesRes] = await Promise.all([
                api.get('/api/accounts/profile'),
                api.get('/api/accounts/all-employees').catch((err) => {
                    console.error('Failed to fetch staff count:', err);
                    return { data: [] };
                }),
            ]);

            const data = profileRes.data;
            const employees = Array.isArray(employeesRes.data) ? employeesRes.data : [];

            setAccountDetails({
                id: data.id,
                email: data.email,
                firstName: data.firstName,
                lastName: data.lastName,
                avatar: data.avatar,
                emailVerified: data.emailVerified,
                createdAt: data.createdAt,
                trialUsed: data.trialUsed,
                trialEndDate: data.trialEndDate,
                defaultCardId: data.defaultCardId,
                deletionRequestedAt: data.deletionRequestedAt,
                establishments: data.establishments || [],
            });

            if (data.establishments && data.establishments.length > 0) {
                setGlobalCurrency(data.establishments[0].currency || 'AED');
            }

            setBrands(data.brands || []);
            // Unique staff across the owner account (exclude pure owners if tagged)
            setTotalStaff(employees.length);
        } catch (err) {
            console.error('Failed to fetch account data:', err);
            // Use context data as fallback
            if (account) {
                setAccountDetails({
                    id: account.id,
                    email: account.email,
                    firstName: account.firstName,
                    lastName: account.lastName,
                    emailVerified: account.emailVerified || false,
                    createdAt: new Date().toISOString(),
                    trialUsed: false,
                });
            }
        } finally {
            setIsLoading(false);
        }
    }, [account]);

    useEffect(() => {
        fetchAccountData();
    }, [fetchAccountData]);

    const handleDeleteClick = () => {
        // Any active establishments and subscriptions will be locked and scheduled for gateway cancellation upon deletion.
        setShowDeleteConfirm(true);
    };

    /**
     * Runs once StepUpVerifier has produced a single-use reauth token. The
     * proof already establishes the owner is present, so no password travels
     * with the deletion itself.
     */
    const handleDeleteAccount = async (reauthToken: string) => {
        try {
            setIsDeletingAccount(true);
            // Send the stable reason key (for analysis) plus the English label
            // and locale. Backend persists both; analytics aggregates on the key.
            const selectedReason = DELETE_REASON_OPTIONS.find((r) => r.key === deleteReasonKey);
            await api.delete('/api/accounts/me', {
                headers: reauthHeaders(reauthToken),
                data: {
                    reason: selectedReason?.value,
                    reasonKey: deleteReasonKey || undefined,
                    locale: i18n.language,
                }
            });

            toast.success(t('owner.account.deletionInitiated'));
            setShowDeleteConfirm(false);

            // Use the logout method from AuthContext to clear session and redirect
            setTimeout(async () => {
                await logout();
            }, 3000);
        } catch (err) {
            console.error('Failed to delete account:', err);
            const responseMessage = (err as any)?.response?.data?.message;
            toast.error(
                Array.isArray(responseMessage)
                    ? responseMessage.join(' ')
                    : responseMessage || t('owner.account.deletionFailed')
            );
        } finally {
            setIsDeletingAccount(false);
        }
    };

    const handleRestoreAccount = () => {
        navigate(ACCOUNT_RECOVERY_PATH);
    };

    const copyToClipboard = async (text: string, id: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(id);
            toast.success(t('common.copied'));
            setTimeout(() => setCopiedId(null), 2000);
        } catch {
            toast.error(t('common.copyFailed'));
        }
    };

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            const lang = (i18n.language || 'en').toLowerCase();
            const locale = lang.startsWith('ar')
                ? 'ar-SA'
                : lang.startsWith('zh')
                    ? 'zh-CN'
                    : 'en-US';
            return date.toLocaleDateString(locale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch {
            return t('common.na');
        }
    };



    const getProfileCompletion = () => {
        if (!accountDetails) return 0;
        let completed = 0;
        const total = 3;

        if (accountDetails.firstName && accountDetails.lastName) completed++;
        if (accountDetails.email) completed++;
        if (accountDetails.emailVerified) completed++;

        return Math.round((completed / total) * 100);
    };

    const openPasswordModal = (
        type: 'account' | 'establishment' | 'brand',
        targetId?: string,
        targetName?: string
    ) => {
        setPasswordModal({
            isOpen: true,
            type,
            targetId,
            targetName,
        });
    };

    if (isLoading) {
        return <SectionLoader message={t('owner.account.loading')} />;
    }

    const profileCompletion = getProfileCompletion();

    const fit = ACCOUNT_MGMT_VIEWPORT_FIT;

    return (
        <div
            className={
                fit
                    ? 'flex flex-col gap-3 lg:h-[calc(100dvh-5.25rem)] lg:min-h-0 lg:overflow-hidden'
                    : 'space-y-8'
            }
        >
            {/* Full-screen blocker while data loads, so no second action can
                be stacked on an in-flight request. */}
            <BusyOverlay visible={isLoading} />

            {/* Header — compact in viewport-fit mode */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center justify-between shrink-0 ${fit ? 'gap-3' : ''}`}
            >
                <div className="min-w-0">
                    <h1 className={`${fit ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'} font-bold text-stone-900 dark:text-zinc-100 tracking-tight truncate`}>
                        {t('owner.account.title')}
                    </h1>
                    <p className={`${fit ? 'text-xs mt-0.5 line-clamp-1' : 'text-sm sm:text-base mt-2'} text-stone-500 dark:text-zinc-400`}>
                        {t('owner.account.subtitle')}
                    </p>
                </div>

            </motion.div>

            <div className={fit ? 'flex-1 min-h-0 flex flex-col gap-3' : 'space-y-6'}>
            {/* Row 1: Owner Account + System Currency — same height, right column width matches Resources/Danger */}
            <div className={`flex flex-col lg:items-stretch ${isRtl ? 'lg:flex-row-reverse' : 'lg:flex-row'} ${fit ? 'gap-3 shrink-0' : 'gap-6'}`}>
                    {/* Account Information Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className={`flex-1 min-w-0 bg-white dark:bg-zinc-900/60 rounded-2xl border border-stone-200 dark:border-zinc-800 shadow-sm overflow-hidden ${fit ? 'lg:max-h-[11.5rem]' : ''}`}
                    >
                        {/* Top bar — shared metrics with System Currency header (padding / icon / title) */}
                        <div className={`flex flex-col sm:items-center justify-between gap-2 border-b border-stone-100 dark:border-zinc-800 ${isRtl ? 'sm:flex-row-reverse' : 'sm:flex-row'} ${fit ? 'px-4 py-2.5' : 'px-5 sm:px-6 py-3.5 gap-3'}`}>
                            <div className="flex items-center min-w-0">
                                <h2 className="text-lg font-bold tracking-tight text-stone-900 dark:text-zinc-100 leading-none">
                                    {t('owner.account.ownerAccountTitle')}
                                </h2>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                {isEditing ? (
                                    <>
                                        <button
                                            onClick={handleCancelEdit}
                                            className="px-3.5 py-2 bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 text-stone-600 dark:text-zinc-300 rounded-xl text-sm font-semibold transition-colors"
                                            disabled={isSaving}
                                        >
                                            {t('owner.account.cancel')}
                                        </button>
                                        <button
                                            onClick={handleSaveProfile}
                                            className="flex items-center gap-2 px-3.5 py-2 bg-mintcom-green hover:bg-mintcom-green/90 active:bg-mintcom-green/80 text-black rounded-xl text-sm font-semibold transition-colors disabled:opacity-70"
                                            disabled={isSaving}
                                        >
                                            {isSaving ? (
                                                <>
                                                    {/* design-token-exempt: spinner track must match the CTA's own text-black on mintcom-green */}
                                                    <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                                    {t('owner.account.saving')}
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 size={16} />
                                                    {t('owner.account.save')}
                                                </>
                                            )}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={handleEditClick}
                                            className="px-3.5 py-2 bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 text-stone-600 dark:text-zinc-300 rounded-xl text-sm font-semibold transition-colors"
                                        >
                                            {t('owner.account.editProfile')}
                                        </button>
                                        <button
                                            onClick={() => openPasswordModal('account')}
                                            className="flex items-center gap-2 px-3.5 py-2 bg-mintcom-green/10 hover:bg-mintcom-green/20 text-emerald-700 dark:text-mintcom-green rounded-lg text-sm font-semibold transition-colors"
                                        >
                                            <Key size={15} />
                                            {t('owner.account.resetPassword')}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className={fit ? 'p-3 sm:p-4' : 'p-5 sm:p-6'}>
                            {isEditing ? (
                                <div className={`grid grid-cols-1 sm:grid-cols-2 ${fit ? 'gap-2.5' : 'gap-4'}`}>
                                    <div className="space-y-1.5 sm:col-span-1">
                                        <label className="text-[11px] font-bold text-stone-500 flex items-center gap-1.5">
                                            <User size={12} />
                                            {t('owner.account.firstName')}
                                        </label>
                                        <input
                                            maxLength={MAX_OWNER_PROFILE_NAME_LENGTH}
                                            type="text"
                                            value={editForm.firstName}
                                            onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                                            placeholder={formatInputPlaceholder(t('owner.account.firstName'), t('common.locale'))}
                                            className="w-full h-11 px-3 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl text-sm font-semibold text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-mintcom-green/30 focus:border-mintcom-green"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-stone-500 flex items-center gap-1.5">
                                            <User size={12} />
                                            {t('owner.account.lastName')}
                                        </label>
                                        <input
                                            maxLength={MAX_OWNER_PROFILE_NAME_LENGTH}
                                            type="text"
                                            value={editForm.lastName}
                                            onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                                            placeholder={formatInputPlaceholder(t('owner.account.lastName'), t('common.locale'))}
                                            className="w-full h-11 px-3 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl text-sm font-semibold text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-mintcom-green/30 focus:border-mintcom-green"
                                        />
                                    </div>
                                    <div className="space-y-1.5 sm:col-span-2">
                                        <label className="text-[11px] font-bold text-stone-500 flex items-center gap-1.5">
                                            <Mail size={12} />
                                            {t('owner.account.email')}
                                        </label>
                                        <input
                                            maxLength={MAX_OWNER_PROFILE_EMAIL_LENGTH}
                                            type="email"
                                            value={editForm.email}
                                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                            placeholder={formatInputPlaceholder(t('owner.account.email'), t('common.locale'))}
                                            className="w-full h-11 px-3 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl text-sm font-semibold text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-mintcom-green/30 focus:border-mintcom-green"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className={`flex flex-col sm:items-center gap-5 ${isRtl ? 'sm:flex-row-reverse' : 'sm:flex-row'}`}>
                                    {/* Avatar + identity */}
                                    <div className="flex items-center gap-4 min-w-0 flex-1">
                                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 text-lg ${avatarClass}`}>
                                            {(accountDetails?.firstName?.[0] || accountDetails?.email?.[0] || 'O').toUpperCase()}
                                            {(accountDetails?.lastName?.[0] || '').toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-lg font-bold text-stone-900 dark:text-zinc-100 truncate">
                                                {accountDetails?.firstName} {accountDetails?.lastName}
                                            </h3>
                                            <div className="flex items-center flex-wrap gap-2 mt-1">
                                                <span dir="ltr" className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-600 dark:text-zinc-300 truncate">
                                                    <Mail size={13} className="text-stone-400 shrink-0" />
                                                    <span className="truncate">{accountDetails?.email}</span>
                                                </span>
                                                {accountDetails?.emailVerified ? (
                                                    <Badge tone="green">
                                                        <Shield size={10} />
                                                        {t('owner.account.verified')}
                                                    </Badge>
                                                ) : (
                                                    <Badge tone="amber">
                                                        {t('owner.account.unverified', { defaultValue: 'Unverified' })}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Meta chips */}
                                    <div className={`flex flex-wrap items-center gap-2 shrink-0 ${isRtl ? 'sm:justify-start' : 'sm:justify-end'}`}>
                                        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-stone-100 dark:border-zinc-800">
                                            <Calendar size={14} className="text-stone-400 shrink-0" />
                                            <div className="leading-tight">
                                                <p className="text-[10px] font-bold uppercase tracking-wide text-stone-400">
                                                    {t('owner.account.joined')}
                                                </p>
                                                <p className="text-xs font-bold text-stone-900 dark:text-zinc-100">
                                                    {formatDate(accountDetails?.createdAt || '')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-stone-100 dark:border-zinc-800">
                                            <Shield size={14} className="text-mintcom-green shrink-0" />
                                            <div className="leading-tight">
                                                <p className="text-[10px] font-bold uppercase tracking-wide text-stone-400">
                                                    {t('owner.account.badge', { defaultValue: 'Role' })}
                                                </p>
                                                <p className="text-xs font-bold text-stone-900 dark:text-zinc-100">
                                                    {t('owner.account.owner', { defaultValue: 'Owner' })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Profile Completion Bar — hide in viewport-fit to save vertical space */}
                            {profileCompletion < 100 && !fit && (
                                <div className="mt-5 pt-4 border-t border-stone-100 dark:border-zinc-800">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-stone-500">{t('owner.account.profileCompletion')}</span>
                                        <span className="text-xs font-bold text-mintcom-green">{profileCompletion}%</span>
                                    </div>
                                    <div className="h-1.5 bg-stone-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-mintcom-green to-emerald-500 rounded-full transition-all duration-500"
                                            style={{ width: `${profileCompletion}%` }}
                                        />
                                    </div>
                                    <p className="text-xs font-medium text-stone-500 mt-2">
                                        {t('owner.account.completeProfileHint')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Global System Currency — header matches Owner Account (same padding, icon, title row) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className={`relative w-full lg:w-[24rem] shrink-0 flex flex-col bg-white dark:bg-zinc-900/60 rounded-2xl border border-stone-200 dark:border-zinc-800 shadow-sm overflow-hidden ${fit ? 'lg:max-h-[11.5rem]' : ''}`}
                    >
                                                {/* Top bar — same structure as Owner Account */}
                        <div className={`relative z-10 flex items-center border-b border-stone-100 dark:border-zinc-800 ${fit ? 'px-4 py-2.5' : 'px-5 sm:px-6 py-3.5'}`}>
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                                    <Landmark className="w-5 h-5 text-amber-500" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-lg font-bold tracking-tight text-stone-900 dark:text-zinc-100 leading-none">
                                        {t('owner.account.systemCurrency')}
                                    </h2>
                                    <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1 line-clamp-1">
                                        {t('owner.account.systemCurrencySubtitle')}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className={`relative z-10 flex-1 flex flex-col justify-center ${fit ? 'p-4' : 'p-5 sm:p-6'}`}>
                            <div className="relative">
                                <select
                                    value={globalCurrency}
                                    onChange={(e) => {
                                        const next = e.target.value;
                                        if (next !== globalCurrency) setPendingCurrency(next);
                                    }}
                                    disabled={isUpdatingCurrency}
                                    className="w-full h-12 bg-white dark:bg-zinc-900/60 border border-stone-200 dark:border-zinc-800 rounded-xl px-4 font-bold text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all appearance-none cursor-pointer disabled:opacity-50"
                                >
                                    {CURRENCIES.filter((c) => c.code !== 'ALL').map((c) => (
                                        <option key={c.code} value={c.code} className="bg-white dark:bg-zinc-800">
                                            {c.code}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                            {isUpdatingCurrency && (
                                <p className="text-xs font-bold text-amber-500 animate-pulse text-center mt-2">
                                    {t('owner.account.applyingCurrencyChanges')}
                                </p>
                            )}
                        </div>
                    </motion.div>
            </div>

            {/* Credentials — full width (locations-style). Avoids empty gap when list has < 8 rows. */}
            {hasAccessCredentials && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.15 }}
                            className={
                                fit
                                    ? 'flex flex-col min-h-0 max-h-[min(28rem,55vh)] lg:max-h-[min(36rem,60vh)] bg-white dark:bg-zinc-900/60 rounded-2xl border border-stone-200 dark:border-zinc-800 shadow-sm overflow-hidden'
                                    : 'w-full flex flex-col bg-white dark:bg-zinc-900/60 rounded-2xl border border-stone-200 dark:border-zinc-800 shadow-sm overflow-hidden'
                            }
                        >
                            {/* Header */}
                            <div className={`shrink-0 border-b border-stone-100 dark:border-zinc-800 ${fit ? 'p-3 sm:p-4' : 'p-5 sm:p-6'}`}>
                                <div className={`flex flex-col lg:items-center lg:justify-between gap-4 ${isRtl ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}>
                                    <div className="flex items-center min-w-0">
                                        <div className="min-w-0">
                                            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-stone-900 dark:text-zinc-100">
                                                {t('owner.account.accessCredentials', {
                                                    defaultValue: 'Access Credentials',
                                                })}
                                            </h2>
                                            <p className="text-xs text-stone-500 dark:text-zinc-400 mt-0.5">
                                                {t('owner.account.accessCredentialsSubtitle', {
                                                    defaultValue: 'Login IDs for establishment and brand dashboards. Search, copy, open, or reset.',
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="relative w-full lg:w-72 shrink-0">
                                        <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none ${isRtl ? 'right-3' : 'left-3'}`} />
                                        <input
                                            type="text"
                                            value={credSearch}
                                            onChange={(e) => setCredSearch(e.target.value)}
                                            placeholder={formatInputPlaceholder(
                                                t('owner.account.searchCredentials', {
                                                    defaultValue: 'Search name or Login ID…',
                                                }),
                                                t('common.locale'),
                                            )}
                                            className={`w-full h-10 rounded-xl bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-800 text-sm font-semibold text-stone-900 dark:text-zinc-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-mintcom-green/20 focus:border-mintcom-green transition-all ${isRtl ? 'pr-9 pl-9 text-right' : 'pl-9 pr-9'}`}
                                        />
                                        {credSearch && (
                                            <button
                                                type="button"
                                                onClick={() => setCredSearch('')}
                                                className={`absolute top-1/2 -translate-y-1/2 p-1 rounded-md text-stone-400 hover:text-stone-600 dark:hover:text-zinc-200 ${isRtl ? 'left-2.5' : 'right-2.5'}`}
                                                aria-label={t('common.clearSearch', { defaultValue: 'Clear search' })}
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Tabs (only when both types exist) + Staff */}
                                <div className={`mt-4 flex flex-col sm:items-center gap-2 sm:gap-3 ${isRtl ? 'sm:flex-row-reverse' : 'sm:flex-row'}`}>
                                    {showCredTabs ? (
                                    <div className="flex items-center gap-1 p-1 rounded-xl bg-stone-100/80 dark:bg-zinc-800 w-full sm:w-auto min-w-0">
                                        {([
                                            {
                                                id: 'locations' as const,
                                                show: locationLoginEstablishments.length > 0,
                                                count: locationLoginEstablishments.length,
                                                icon: Store,
                                                label: t('owner.account.locations', { defaultValue: 'Establishments' }),
                                            },
                                            {
                                                id: 'brands' as const,
                                                show: brands.length > 0,
                                                count: brands.length,
                                                icon: Building2,
                                                label: t('owner.account.brands', { defaultValue: 'Brands' }),
                                            },
                                        ]).filter((tab) => tab.show).map((tab) => {
                                            const active = credTab === tab.id;
                                            const TabIcon = tab.icon;
                                            const isBrandTab = tab.id === 'brands';
                                            return (
                                                <button
                                                    key={tab.id}
                                                    type="button"
                                                    onClick={() => setCredTab(tab.id)}
                                                    className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 h-9 px-3.5 rounded-lg text-xs font-bold transition-all ${
                                                        active
                                                            ? isBrandTab
                                                                ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-blue-500/20'
                                                                : 'bg-white dark:bg-zinc-900 text-mintcom-green shadow-sm'
                                                            : 'text-stone-500 hover:text-stone-800 dark:hover:text-zinc-200'
                                                    }`}
                                                >
                                                    <TabIcon size={14} className="shrink-0" />
                                                    <span className="truncate">{tab.label}</span>
                                                    <span
                                                        className={`min-w-[1.25rem] h-5 px-1.5 rounded-md text-[10px] font-black flex items-center justify-center tabular-nums ${
                                                            active
                                                                ? isBrandTab
                                                                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                                                    : 'bg-mintcom-green/10 text-mintcom-green'
                                                                : 'bg-stone-200/80 dark:bg-zinc-800 text-stone-500'
                                                        }`}
                                                    >
                                                        {tab.count}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    ) : (
                                        <div
                                            className={`inline-flex items-center gap-2 h-9 px-3 rounded-xl text-xs font-bold ${
                                                brands.length > 0 && locationLoginEstablishments.length === 0
                                                    ? 'bg-blue-500/10 border border-blue-500/15 text-blue-600 dark:text-blue-400'
                                                    : 'bg-mintcom-green/10 border border-mintcom-green/15 text-mintcom-green'
                                            }`}
                                        >
                                            {locationLoginEstablishments.length > 0 ? (
                                                <Store size={14} className="shrink-0" />
                                            ) : (
                                                <Building2 size={14} className="shrink-0" />
                                            )}
                                            <span>
                                                {locationLoginEstablishments.length > 0
                                                    ? t('owner.account.locations', { defaultValue: 'Establishments' })
                                                    : t('owner.account.brands', { defaultValue: 'Brands' })}
                                            </span>
                                            <span
                                                className={`min-w-[1.25rem] h-5 px-1.5 rounded-md text-[10px] font-black flex items-center justify-center tabular-nums ${
                                                    brands.length > 0 && locationLoginEstablishments.length === 0
                                                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                                        : 'bg-mintcom-green/10 text-mintcom-green'
                                                }`}
                                            >
                                                {locationLoginEstablishments.length > 0
                                                    ? locationLoginEstablishments.length
                                                    : brands.length}
                                            </span>
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => navigate('/owner/employees')}
                                        className="inline-flex items-center justify-center gap-2 h-11 sm:h-11 px-3.5 rounded-xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-xs font-bold text-stone-700 dark:text-zinc-200 hover:border-mintcom-green/40 hover:text-mintcom-green hover:bg-mintcom-green/5 transition-all shrink-0"
                                        title={t('owner.overview.staffManagement', { defaultValue: 'Staff management' })}
                                    >
                                        <Users size={14} className="shrink-0 text-stone-500 dark:text-zinc-400" />
                                        <span>{t('owner.account.totalStaff', { defaultValue: 'Staff' })}</span>
                                        <span className="min-w-[1.25rem] h-5 px-1.5 rounded-md text-[10px] font-black flex items-center justify-center tabular-nums bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300">
                                            {totalStaff}
                                        </span>
                                        <ExternalLink size={12} className="text-stone-400 shrink-0" />
                                    </button>
                                </div>
                            </div>

                            {/* Column header — fixed outside scroll so nothing can appear above it */}
                            <div className="shrink-0 hidden sm:grid grid-cols-[minmax(0,1fr)_13.5rem_5.25rem] gap-0 table-header-row bg-white dark:bg-zinc-900/60 border-b border-stone-200 dark:border-zinc-800">
                                <div className={`${isRtl ? 'text-right' : 'text-left'} font-semibold px-5 lg:px-6 py-3.5`}>
                                    {credTab === 'locations'
                                        ? t('owner.account.locations', { defaultValue: 'Establishments' })
                                        : t('owner.account.brands', { defaultValue: 'Brands' })}
                                </div>
                                <div className="text-center font-semibold px-2 py-3.5">
                                    {t('owner.account.loginId', { defaultValue: 'Login ID' })}
                                </div>
                                <div className="text-center font-semibold px-1 py-3.5">
                                    {t('common.actions', { defaultValue: 'Actions' })}
                                </div>
                            </div>

                            {/* Rows grow with page (locations-style); no internal table scroll when not viewport-fit */}
                            <div
                                className={
                                    fit
                                        ? 'flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar [scrollbar-gutter:stable]'
                                        : 'min-h-0'
                                }
                            >
                                {(() => {
                                    type CredRow = {
                                        key: string;
                                        name: string;
                                        meta: string;
                                        loginId: string;
                                        copyKey: string;
                                        isActive: boolean;
                                        statusLabel: string;
                                        icon: ElementType;
                                        onOpen?: () => void;
                                        onReset: () => void;
                                        kind: 'location' | 'brand';
                                    };

                                    const locationRows: CredRow[] = filteredLocationLogins.map((est: any) => {
                                        const slug = (est.establishmentLoginId || est.loginId || est.locationLoginId || est.id || '').trim();
                                        const status = String(est.subscriptionStatus || '').toUpperCase();
                                        const isActive = status === 'ACTIVE' || status === 'TRIAL' || status === 'TRIALING';
                                        let statusLabel = t('common.status.inactive');
                                        if (status === 'ACTIVE') statusLabel = t('common.status.active');
                                        else if (status === 'TRIAL' || status === 'TRIALING') statusLabel = t('common.status.trial');
                                        else if (status === 'PAST_DUE') statusLabel = t('common.status.pastDue');
                                        else if (status === 'CANCELED' || status === 'CANCELLED') statusLabel = t('common.status.canceled', { defaultValue: 'Canceled' });

                                        const metaParts = [
                                            est.currency?.toUpperCase() || 'JOD',
                                            est.createdAt ? formatDate(est.createdAt) : null,
                                        ].filter(Boolean);

                                        return {
                                            key: est.id,
                                            name: est.name,
                                            meta: metaParts.join(' · '),
                                            loginId: slug,
                                            copyKey: `est-login-${est.id}`,
                                            isActive,
                                            statusLabel,
                                            icon: getBusinessTypeIcon(est.type),
                                            onOpen: slug ? () => window.open(`/dashboard/${slug}`, '_blank') : undefined,
                                            onReset: () => openPasswordModal('establishment', est.id, est.name),
                                            kind: 'location' as const,
                                        };
                                    });

                                    const brandRows: CredRow[] = filteredBrandLogins.map((brand) => {
                                        const slug = (brand.establishmentLoginId || '').trim();
                                        const metaParts = [
                                            t('owner.account.locationsCount', { count: brand.locationCount }),
                                            brand.createdAt ? formatDate(brand.createdAt) : null,
                                        ].filter(Boolean);

                                        return {
                                            key: brand.id,
                                            name: brand.name,
                                            meta: metaParts.join(' · '),
                                            loginId: slug,
                                            copyKey: `brand-${brand.id}`,
                                            isActive: Boolean(brand.isActive),
                                            statusLabel: brand.isActive ? t('common.status.active') : t('common.status.inactive'),
                                            icon: Building2,
                                            // Same as brands page: open brand dashboard in a new tab
                                            onOpen: slug
                                                ? () => window.open(`/brand/${slug}`, '_blank')
                                                : undefined,
                                            onReset: () => openPasswordModal('brand', brand.id, brand.name),
                                            kind: 'brand' as const,
                                        };
                                    });

                                    const allRows = credTab === 'locations' ? locationRows : brandRows;

                                    if (allRows.length === 0) {
                                        return (
                                            <div className="py-12 px-6 text-center">
                                                <p className="text-sm font-bold text-stone-500">
                                                    {credSearch.trim()
                                                        ? t('common.noResults', { defaultValue: 'No results found' })
                                                        : t('owner.account.noLocationsOrBrands')}
                                                </p>
                                            </div>
                                        );
                                    }

                                    // Paginate like locations table (3 per page)
                                    const totalPages = Math.max(1, Math.ceil(allRows.length / CRED_ITEMS_PER_PAGE));
                                    const page = Math.min(Math.max(1, credPage), totalPages);
                                    const pageStart = (page - 1) * CRED_ITEMS_PER_PAGE;
                                    const rows = allRows.slice(pageStart, pageStart + CRED_ITEMS_PER_PAGE);

                                    // Rows only (column header is fixed above this scroll area)
                                    return (
                                        <div className="divide-y divide-stone-100 dark:divide-zinc-800">
                                            {rows.map((row) => {
                                                const RowIcon = row.icon;
                                                return (
                                                    <div
                                                        key={row.key}
                                                        className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_13.5rem_5.25rem] gap-3 sm:gap-0 items-center px-5 lg:px-0 py-4 hover:bg-stone-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0 sm:px-5 lg:px-6">
                                                            <div
                                                                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                                                    row.kind === 'brand'
                                                                        ? 'bg-mintcom-green/10 text-mintcom-green'
                                                                        : 'bg-stone-100 dark:bg-zinc-800 text-stone-400'
                                                                }`}
                                                            >
                                                                <RowIcon className="w-5 h-5" />
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center gap-2 min-w-0">
                                                                    <h3 className="text-sm font-bold tracking-tight text-stone-900 dark:text-zinc-100 truncate" title={row.name}>
                                                                        {row.name}
                                                                    </h3>
                                                                    <Badge
                                                                        tone={
                                                                            !row.isActive
                                                                                ? 'gray'
                                                                                : row.kind === 'brand'
                                                                                    ? 'blue'
                                                                                    : 'green'
                                                                        }
                                                                    >
                                                                        {row.statusLabel}
                                                                    </Badge>
                                                                </div>
                                                                {row.meta && (
                                                                    <p className="text-sm text-stone-500 dark:text-zinc-400 mt-0.5 truncate">
                                                                        {row.meta}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="min-w-0 w-full sm:px-2 flex items-center">
                                                            <div className="min-w-0 w-full flex items-center gap-1.5 h-9 rounded-xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 px-2.5">
                                                                <code className="flex-1 min-w-0 text-sm font-bold text-stone-900 dark:text-zinc-100 truncate select-all font-mono" title={row.loginId}>
                                                                    {row.loginId || t('common.na')}
                                                                </code>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => copyToClipboard(row.loginId, row.copyKey)}
                                                                    disabled={!row.loginId}
                                                                    className={`shrink-0 p-1 rounded-md text-stone-500 transition-colors disabled:opacity-40 ${
                                                                        row.kind === 'brand'
                                                                            ? 'hover:text-blue-600 hover:bg-blue-500/10'
                                                                            : 'hover:text-mintcom-green hover:bg-mintcom-green/10'
                                                                    }`}
                                                                    title={t('common.copy')}
                                                                >
                                                                    {copiedId === row.copyKey ? (
                                                                        <CheckCircle2
                                                                            size={14}
                                                                            className={row.kind === 'brand' ? 'text-blue-500' : 'text-mintcom-green'}
                                                                        />
                                                                    ) : (
                                                                        <Copy size={14} />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-center sm:px-1">
                                                            <div className="inline-flex items-center justify-center gap-0.5">
                                                                <div className="relative group/action">
                                                                    <button
                                                                        type="button"
                                                                        onClick={row.onOpen}
                                                                        disabled={!row.onOpen}
                                                                        className={`w-7 h-7 rounded-xl inline-flex items-center justify-center text-stone-400 transition-all disabled:opacity-0 disabled:pointer-events-none sm:disabled:opacity-30 sm:disabled:pointer-events-none sm:disabled:hover:bg-transparent sm:disabled:hover:text-stone-400 ${
                                                                            row.kind === 'brand'
                                                                                ? 'hover:text-blue-600 hover:bg-blue-500/10'
                                                                                : 'hover:text-mintcom-green hover:bg-mintcom-green/10'
                                                                        }`}
                                                                        aria-label={
                                                                            row.onOpen
                                                                                ? row.kind === 'brand'
                                                                                    ? t('owner.brands.viewDashboard', { defaultValue: 'View brand dashboard' })
                                                                                    : t('owner.brands.viewDashboard', { defaultValue: 'Open dashboard' })
                                                                                : undefined
                                                                        }
                                                                        aria-hidden={!row.onOpen}
                                                                    >
                                                                        <ExternalLink size={14} />
                                                                    </button>
                                                                    {row.onOpen && (
                                                                        <span
                                                                            role="tooltip"
                                                                            className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-2 z-30 whitespace-nowrap rounded-lg bg-stone-900 dark:bg-zinc-800 border border-stone-800 dark:border-zinc-700 px-2.5 py-1.5 text-[11px] font-bold text-stone-100 dark:text-zinc-100 opacity-0 translate-x-1 group-hover/action:opacity-100 group-hover/action:translate-x-0 transition-all shadow-lg"
                                                                        >
                                                                            {row.kind === 'brand'
                                                                                ? t('owner.brands.viewDashboard', { defaultValue: 'View brand dashboard' })
                                                                                : t('owner.brands.viewDashboard', { defaultValue: 'Open dashboard' })}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="relative group/action">
                                                                    <button
                                                                        type="button"
                                                                        onClick={row.onReset}
                                                                        className="w-7 h-7 rounded-xl inline-flex items-center justify-center text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                                                                        aria-label={t('owner.account.resetPassword')}
                                                                    >
                                                                        <Lock size={14} />
                                                                    </button>
                                                                    <span
                                                                        role="tooltip"
                                                                        className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-2 z-30 whitespace-nowrap rounded-lg bg-stone-900 dark:bg-zinc-800 border border-stone-800 dark:border-zinc-700 px-2.5 py-1.5 text-[11px] font-bold text-stone-100 dark:text-zinc-100 opacity-0 translate-x-1 group-hover/action:opacity-100 group-hover/action:translate-x-0 transition-all shadow-lg"
                                                                    >
                                                                        {t('owner.account.resetPassword')}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Hint + pagination (same Pagination component as locations table) */}
                            <div className="shrink-0 border-t border-stone-100 dark:border-zinc-800">
                                <div className="px-5 py-2.5 bg-white dark:bg-zinc-900/40">
                                    <p className="text-[11px] font-medium text-stone-500 dark:text-zinc-400 leading-relaxed">
                                        {credTab === 'locations'
                                            ? t('owner.account.locationLoginHint', {
                                                defaultValue: 'Use this ID to sign in to this establishment dashboard.',
                                            })
                                            : t('owner.account.brandLoginHint', {
                                                defaultValue: 'Use this ID to sign in to the brand dashboard.',
                                            })}
                                    </p>
                                </div>
                                <Pagination
                                    currentPage={credPage}
                                    totalPages={Math.max(
                                        1,
                                        Math.ceil(
                                            (credTab === 'locations'
                                                ? filteredLocationLogins.length
                                                : filteredBrandLogins.length) / CRED_ITEMS_PER_PAGE,
                                        ),
                                    )}
                                    onPageChange={setCredPage}
                                    variant="footer"
                                    totalItems={
                                        credTab === 'locations'
                                            ? filteredLocationLogins.length
                                            : filteredBrandLogins.length
                                    }
                                    itemsPerPage={CRED_ITEMS_PER_PAGE}
                                    className={fit ? '!py-2.5 !px-4' : undefined}
                                />
                            </div>
                        </motion.div>
            )}

            {/* Resources | Safety column (security tips + danger) — equal height, no dead space under danger */}
            <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch ${fit ? 'flex-1 min-h-0' : ''}`}>
                    {/* Resources & Help */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.15 }}
                        className={`lg:col-span-2 bg-white dark:bg-zinc-900/60 rounded-2xl border border-stone-200 dark:border-zinc-800 shadow-sm overflow-hidden h-full ${
                            fit ? 'min-h-0 flex flex-col' : ''
                        }`}
                    >
                        <div className={`${fit ? 'p-3 sm:p-4 flex-1 min-h-0 overflow-y-auto custom-scrollbar' : 'p-5 sm:p-6'} flex h-full flex-col`}>
                            {/* Header — same icon/title metrics as Security Tips & Owner Account cards */}
                            <div className={`flex items-center gap-3 ${fit ? 'mb-3' : 'mb-5'}`}>
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                                    <Library className="w-5 h-5 text-blue-500" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-lg font-bold tracking-tight text-stone-900 dark:text-zinc-100 leading-none">
                                        {t('owner.account.resources.title')}
                                    </h2>
                                    <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1 line-clamp-1">
                                        {t('owner.account.resources.subtitle')}
                                    </p>
                                </div>
                            </div>

                            {/* Guides — 3-column tiles (stacks on phones) */}
                            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2.5 px-0.5">
                                {t('owner.account.resources.guides', { defaultValue: 'Guides' })}
                            </p>
                            <div className={`grid grid-cols-1 md:grid-cols-3 gap-2.5 ${fit ? 'mb-3' : 'mb-5'}`}>
                                <a
                                    href={userManualDoc.path}
                                    download={userManualDoc.filename}
                                    className="group relative flex flex-col gap-3 p-3.5 rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-stone-300 dark:hover:border-zinc-700 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="w-9 h-9 rounded-xl bg-mintcom-green/10 text-mintcom-green flex items-center justify-center">
                                            <BookOpen size={16} />
                                        </div>
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-stone-400 opacity-70 group-hover:opacity-100 transition-opacity">
                                            <Download size={12} />
                                            PDF
                                        </span>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-stone-900 dark:text-zinc-100 leading-tight">
                                            {t('owner.account.resources.userManual.title')}
                                        </h4>
                                        <p className="text-[11px] text-stone-500 dark:text-zinc-400 mt-0.5 leading-snug line-clamp-2">
                                            {t('owner.account.resources.userManual.desc')}
                                        </p>
                                    </div>
                                </a>

                                <a
                                    href={setupManualDoc.path}
                                    download={setupManualDoc.filename}
                                    className="group relative flex flex-col gap-3 p-3.5 rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-stone-300 dark:hover:border-zinc-700 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="w-9 h-9 rounded-xl bg-mintcom-green/10 text-mintcom-green flex items-center justify-center">
                                            <Settings size={16} />
                                        </div>
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-stone-400 opacity-70 group-hover:opacity-100 transition-opacity">
                                            <Download size={12} />
                                            PDF
                                        </span>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-stone-900 dark:text-zinc-100 leading-tight">
                                            {t('owner.account.resources.setupManual.title')}
                                        </h4>
                                        <p className="text-[11px] text-stone-500 dark:text-zinc-400 mt-0.5 leading-snug line-clamp-2">
                                            {t('owner.account.resources.setupManual.desc')}
                                        </p>
                                    </div>
                                </a>

                                {/* Same vertical tile shape as the two manuals so all three
                                    sit on one row and share a height. */}
                                {hasOnboardingVideo ? (
                                    <a
                                        href={ONBOARDING_VIDEO_URL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group relative flex flex-col gap-3 p-3.5 rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-stone-300 dark:hover:border-zinc-700 transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="w-9 h-9 rounded-xl bg-mintcom-green/10 text-mintcom-green flex items-center justify-center">
                                                <PlayCircle size={16} />
                                            </div>
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-stone-400 opacity-70 group-hover:opacity-100 transition-opacity">
                                                <ExternalLink size={12} />
                                                {t('common.view')}
                                            </span>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-stone-900 dark:text-zinc-100 leading-tight">
                                                {t('owner.account.resources.videoTutorial.title')}
                                            </h4>
                                            <p className="text-[11px] text-stone-500 dark:text-zinc-400 mt-0.5 leading-snug line-clamp-2">
                                                {t('owner.account.resources.videoTutorial.desc')}
                                            </p>
                                        </div>
                                    </a>
                                ) : (
                                    <div
                                        aria-label={t('owner.account.videoGuideComingSoon')}
                                        className="flex flex-col gap-3 p-3.5 rounded-2xl border border-stone-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-800 opacity-60"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-zinc-800 text-stone-500 flex items-center justify-center">
                                                <PlayCircle size={16} />
                                            </div>
                                            <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 whitespace-nowrap">
                                                {t('common.comingSoon', { defaultValue: 'Coming soon' })}
                                            </span>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-stone-900 dark:text-zinc-100 leading-tight">
                                                {t('owner.account.resources.videoTutorial.title')}
                                            </h4>
                                            <p className="text-[11px] text-stone-500 dark:text-zinc-400 mt-0.5 leading-snug line-clamp-2">
                                                {t('owner.account.resources.videoTutorial.desc')}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Company / legal — fills the remaining panel height. */}
                            <div className="flex min-h-0 flex-1 flex-col">
                                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2.5 px-0.5 shrink-0">
                                    {t('owner.account.resources.company', { defaultValue: 'Company & legal' })}
                                </p>
                                <div className="grid min-h-[12rem] flex-1 grid-cols-1 auto-rows-fr gap-3 sm:grid-cols-2">
                                {[
                                    {
                                        href: '/qa',
                                        icon: HelpCircle,
                                        title: t('owner.account.resources.qa.title'),
                                        description: t('owner.account.resources.qa.desc'),
                                        tone: 'text-blue-500 bg-blue-500/10 border-blue-500/10 hover:border-blue-400/40',
                                    },
                                    {
                                        href: '/legal/privacy',
                                        icon: Shield,
                                        title: t('owner.account.resources.privacyPolicy.title'),
                                        description: t('owner.account.resources.privacyPolicy.desc'),
                                        tone: 'text-mintcom-green bg-mintcom-green/10 border-mintcom-green/10 hover:border-mintcom-green/40',
                                    },
                                    {
                                        href: '/legal/terms',
                                        icon: Scale,
                                        title: t('owner.account.resources.termsOfUse.title'),
                                        description: t('owner.account.resources.termsOfUse.desc'),
                                        tone: 'text-blue-500 bg-blue-500/10 border-blue-500/10 hover:border-blue-400/40',
                                    },
                                    {
                                        href: '/about',
                                        icon: Info,
                                        title: t('owner.account.resources.aboutUs.title'),
                                        description: t('owner.account.resources.aboutUs.desc'),
                                        tone: 'text-mintcom-green border-mintcom-green/10 hover:border-mintcom-green/40',
                                    },
                                ].map((item) => (
                                    <a
                                        key={item.href}
                                        href={item.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`group flex min-h-[5.5rem] items-center gap-4 rounded-2xl border bg-white p-4 transition-all hover:shadow-sm dark:bg-zinc-900/40 sm:p-5 ${item.tone}`}
                                    >
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-800">
                                            <item.icon size={20} className="shrink-0" />
                                        </div>
                                        <div className="min-w-0 flex-1 self-center">
                                            <h3 className="text-sm font-bold leading-tight text-stone-900 dark:text-zinc-100 sm:text-base">
                                                {item.title}
                                            </h3>
                                            <p className="mt-1 text-xs font-medium leading-relaxed text-stone-500 dark:text-zinc-400">
                                                {item.description}
                                            </p>
                                        </div>
                                        <ExternalLink size={15} className="shrink-0 self-start text-stone-300 transition-colors group-hover:text-stone-500" />
                                    </a>
                                ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right safety column — fills full height of Resources (no empty under Danger) */}
                    <div className="flex flex-col gap-4 h-full min-h-0">
                        {/* Security tips */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.18 }}
                            className="flex-1 min-h-0 rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 sm:p-6 shadow-sm flex flex-col"
                        >
                            {/* Header — matches Useful Resources (same padding, icon size, title row) */}
                            <div className="flex items-center gap-3 mb-5 shrink-0">
                                <div className="w-10 h-10 rounded-xl bg-mintcom-green/20 dark:bg-mintcom-green/25 flex items-center justify-center shrink-0">
                                    <Shield className="w-5 h-5 text-mintcom-green" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-lg font-bold tracking-tight text-stone-900 dark:text-zinc-100 leading-none">
                                        {t('owner.account.securityTips.title')}
                                    </h2>
                                    <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1 line-clamp-1">
                                        {t('owner.account.securityTips.subtitle', {
                                            defaultValue: 'Keep your account and logins safe',
                                        })}
                                    </p>
                                </div>
                            </div>
                            {/* Indent to match title/subtitle text column (icon is w-10 + gap-3) */}
                            <ul className="space-y-2 flex-1 text-xs font-medium text-stone-600 dark:text-zinc-300 ps-[3.25rem]">
                                {[
                                    t('owner.account.securityTips.uniquePasswords'),
                                    t('owner.account.securityTips.updatePeriodically'),
                                    t('owner.account.securityTips.neverShareOtp'),
                                    t('owner.account.securityTips.enable2fa', {
                                        defaultValue: 'Enable two-factor authentication when available',
                                    }),
                                ].map((tip) => (
                                    <li key={tip} className="flex items-start gap-2 leading-snug">
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-mintcom-green shrink-0" />
                                        <span>{tip}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>

                        {/* Danger Zone — full panel, action pinned to bottom */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.22 }}
                            className={`relative flex flex-col rounded-2xl border shadow-sm overflow-hidden min-h-[14rem] ${
                                accountDetails?.deletionRequestedAt
                                    ? 'border-mintcom-green/25 bg-mintcom-green/5 dark:bg-mintcom-green/5'
                                    : 'border-red-500/25 bg-white dark:bg-zinc-900/60'
                            }`}
                        >
                            <div className="relative z-10 flex flex-col flex-1 p-5 sm:p-6">
                                {/* Header — same icon/title metrics as Resources & Security Tips */}
                                <div className="flex items-center gap-3 mb-5 shrink-0">
                                    <div
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                            accountDetails?.deletionRequestedAt ? 'bg-mintcom-green/15' : 'bg-red-500/10'
                                        }`}
                                    >
                                        {accountDetails?.deletionRequestedAt ? (
                                            <div className="w-5 h-5 border-2 border-mintcom-green/30 border-t-mintcom-green rounded-full" />
                                        ) : (
                                            <AlertCircle className="w-5 h-5 text-red-500" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-lg font-bold tracking-tight text-stone-900 dark:text-zinc-100 leading-none">
                                            {accountDetails?.deletionRequestedAt
                                                ? t('owner.account.restoreAccount')
                                                : t('owner.account.dangerZone')}
                                        </h2>
                                        <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1 line-clamp-2">
                                            {accountDetails?.deletionRequestedAt
                                                ? t('owner.account.deletionScheduledHint')
                                                : t('owner.account.dangerZoneHint')}
                                        </p>
                                    </div>
                                </div>

                                {!accountDetails?.deletionRequestedAt && (
                                    /* Indent to match title/subtitle text column (icon is w-10 + gap-3) */
                                    <ul className="mb-4 space-y-2 text-xs font-medium text-stone-600 dark:text-zinc-300 ps-[3.25rem]">
                                        {[
                                            t('owner.account.dangerZoneBullet1', {
                                                defaultValue: 'All establishments and brands will be scheduled for removal',
                                            }),
                                            t('owner.account.dangerZoneBullet2', {
                                                defaultValue: 'Staff access and Login IDs stop working',
                                            }),
                                            t('owner.account.dangerZoneBullet3', {
                                                defaultValue: 'You can cancel during the grace period if offered',
                                            }),
                                        ].map((line) => (
                                            <li key={line} className="flex items-start gap-2">
                                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                                                <span>{line}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                <div className="mt-auto pt-2">
                                    {accountDetails?.deletionRequestedAt ? (
                                        <button
                                            onClick={handleRestoreAccount}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-mintcom-green hover:bg-mintcom-green/90 active:bg-mintcom-green/80 text-black rounded-xl text-sm font-semibold transition-colors"
                                        >
                                            {t('owner.account.restoreMyAccount')}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleDeleteClick}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-red-500/20"
                                        >
                                            <Trash2 size={18} />
                                            {t('owner.account.deleteAccount')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
            </div>
            </div>

            {/* Empty State */}
            {(!establishments || establishments.length === 0) && brands.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white dark:bg-zinc-900/60 rounded-2xl border border-stone-200 dark:border-zinc-800 p-12 shadow-sm text-center"
                >
                    <div className="w-20 h-20 rounded-2xl bg-stone-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                        <Store className="w-10 h-10 text-stone-400" />
                    </div>
                    <h3 className="text-lg font-bold tracking-tight text-stone-900 dark:text-zinc-100 mb-2">
                        {t('owner.account.noLocationsOrBrands')}
                    </h3>
                    <p className="text-stone-500 dark:text-zinc-400 text-sm max-w-md mx-auto">
                        {t('owner.account.noLocationsOrBrandsHint')}
                    </p>
                </motion.div>
            )}

            {/* Password Reset Modal */}
            <PasswordResetOtpModal
                isOpen={passwordModal.isOpen}
                onClose={() => setPasswordModal({ ...passwordModal, isOpen: false })}
                onSuccess={() => {
                    fetchAccountData();
                }}
                type={passwordModal.type}
                targetId={passwordModal.targetId}
                targetName={passwordModal.targetName}
            />

            {/* Delete Account Confirmation Modal */}
            <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} size="sm">
                <ModalHeader
                    title={t('owner.account.deleteAccountModal.title')}
                    icon={<AlertTriangle size={24} />}
                    onClose={() => setShowDeleteConfirm(false)}
                />

                <ModalBody>
                    <div className="flex justify-center gap-1 mb-6">
                        {[1, 2, 3].map((step) => (
                            <div
                                key={step}
                                className={`w-2 h-2 rounded-full transition-colors ${deleteStep >= step ? 'bg-red-500' : 'bg-stone-200 dark:bg-zinc-800'
                                    }`}
                            />
                        ))}
                    </div>

                        {deleteStep === 1 && (
                            <div className="space-y-6">
                                <div>
                                    <p className="text-stone-900 dark:text-zinc-100 font-bold mb-1">{t('owner.account.deleteAccountModal.whyLeaving')}</p>
                                    <p className="text-sm text-stone-500 dark:text-zinc-400">{t('owner.account.deleteAccountModal.feedbackHint')}</p>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                    {DELETE_REASON_OPTIONS.map((reason) => (
                                        <button
                                            key={reason.key}
                                            onClick={() => setDeleteReasonKey(reason.key)}
                                            className={`w-full text-start px-4 py-3 rounded-xl border transition-all text-sm font-medium ${deleteReasonKey === reason.key
                                                ? 'bg-mintcom-green/10 border-mintcom-green text-mintcom-green'
                                                : 'bg-white dark:bg-zinc-900/40 border-stone-100 dark:border-zinc-800 text-stone-600 dark:text-stone-400 hover:border-stone-300'
                                                }`}
                                        >
                                            {t(`owner.account.deleteAccountModal.reasons.${reason.key}`, reason.value)}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setDeleteStep(2)}
                                    disabled={!deleteReasonKey}
                                    className={primaryButtonClass}
                                >
                                    {t('common.continue')}
                                </button>
                            </div>
                        )}

                        {deleteStep === 2 && (
                            <div className="space-y-6">
                                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                                        {t('owner.account.deleteAccountModal.warning')}
                                    </p>
                                </div>
                                {/* Option A: explicit preview of what gets locked so one
                                    click doesn't nuke a live business by surprise. */}
                                <div className="bg-white dark:bg-zinc-900/40 border border-stone-100 dark:border-zinc-800 rounded-2xl p-4">
                                    <p className="text-sm font-bold text-stone-900 dark:text-zinc-100 mb-1">
                                        {t('owner.account.deleteAccountModal.affectedLocationsTitle', 'This will lock {{count}} location(s)', { count: locationLoginEstablishments.length })}
                                    </p>
                                    {locationLoginEstablishments.length === 0 ? (
                                        <p className="text-sm text-stone-500 dark:text-zinc-400">
                                            {t('owner.account.deleteAccountModal.noActiveLocations', 'No active locations on this account.')}
                                        </p>
                                    ) : (
                                        <ul className="space-y-1 max-h-32 overflow-y-auto">
                                            {locationLoginEstablishments.slice(0, 5).map((est: any) => (
                                                <li key={est.id || est.establishmentLoginId || est.name} className="text-sm text-stone-600 dark:text-zinc-300 flex items-center gap-2">
                                                    <Store size={14} className="shrink-0 text-stone-400" />
                                                    <span className="truncate">{est.name || est.establishmentLoginId || est.id}</span>
                                                    {est.subscriptionStatus === 'ACTIVE' && (
                                                        <span className="text-xs text-stone-400">· {t('owner.account.deleteAccountModal.activeSubscription', 'active subscription')}</span>
                                                    )}
                                                </li>
                                            ))}
                                            {locationLoginEstablishments.length > 5 && (
                                                <li className="text-sm text-stone-400">
                                                    {t('owner.account.deleteAccountModal.andMoreLocations', '+{{count}} more', { count: locationLoginEstablishments.length - 5 })}
                                                </li>
                                            )}
                                        </ul>
                                    )}
                                    <p className="text-xs text-stone-500 dark:text-zinc-400 mt-2">
                                        {t('owner.account.deleteAccountModal.stopRenewalsNote', 'Staff access stops and subscription renewals are cancelled. You can restore everything during the grace period.')}
                                    </p>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-sm font-normal text-stone-700 dark:text-zinc-200">
                                        {t('owner.account.deleteAccountModal.confirmDeletePrompt', { keyword: t('common.delete') })}
                                    </label>
                                    <input maxLength={255}
                                        type="text"
                                        value={deleteConfirmationText}
                                        onChange={(e) => setDeleteConfirmationText(e.target.value)}
                                        placeholder={t('owner.account.deleteAccountModal.typeDeletePlaceholder', { keyword: t('common.delete') })}
                                        className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setDeleteStep(1)}
                                        className="flex-1 py-4 bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 rounded-2xl text-sm font-bold"
                                    >
                                        {t('common.back')}
                                    </button>
                                    <button
                                        onClick={() => setDeleteStep(3)}
                                        disabled={deleteConfirmationText.trim().toLocaleLowerCase(i18n.language) !== t('common.delete').toLocaleLowerCase(i18n.language)}
                                        className="flex-1 py-4 bg-red-500 text-white rounded-2xl text-sm font-black disabled:opacity-50 transition-all"
                                    >
                                        {t('common.next')}
                                    </button>
                                </div>
                            </div>
                        )}

                        {deleteStep === 3 && (
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-sm font-normal text-stone-700 dark:text-zinc-200 flex items-center gap-2">
                                        <Lock size={14} />
                                        {t('owner.account.deleteAccountModal.confirmPassword')}
                                    </label>
                                    {/* Offers whichever proof this owner can actually produce —
                                        a Google/Apple owner has no password to type here. */}
                                    <StepUpVerifier
                                        action="delete-account"
                                        onVerified={handleDeleteAccount}
                                        onError={(message) => toast.error(message)}
                                        submitLabel={t('owner.account.deleteAccountModal.confirmFinal')}
                                        disabled={isDeletingAccount}
                                    />
                                </div>
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={() => setDeleteStep(2)}
                                        disabled={isDeletingAccount}
                                        className="w-full px-6 py-4 bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 text-stone-600 dark:text-zinc-300 rounded-2xl text-sm font-bold transition-all"
                                    >
                                        {t('common.back')}
                                    </button>
                                </div>
                            </div>
                        )}
                </ModalBody>
            </Modal>

            {/* Warning before changing the system currency for all locations. */}
            <ChangeCurrencyModal
                isOpen={pendingCurrency !== null}
                onClose={() => setPendingCurrency(null)}
                onConfirm={() => {
                    const next = pendingCurrency;
                    setPendingCurrency(null);
                    if (next) handleUpdateGlobalCurrency(next);
                }}
                fromCurrency={globalCurrency}
                toCurrency={pendingCurrency || ''}
                isSubmitting={isUpdatingCurrency}
            />
        </div>
    );
}

