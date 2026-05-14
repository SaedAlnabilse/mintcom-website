import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
    KeyRound,
    Users,
    AlertTriangle,
    Lock,
    Zap,
    Trash2,
    AlertCircle,
    X,
    XCircle,
    BookOpen,
    Download,
    Settings,
    PlayCircle,
    ExternalLink,
    Scale,
    Landmark,
    CreditCard,
} from 'lucide-react';
import api from '../../config/api';
import { CURRENCIES } from '../../context/CurrencyContext';
import { useAuth } from '../../context/AuthContext';
import { PasswordResetOtpModal } from '../../components/PasswordResetOtpModal';
import toast from 'react-hot-toast';
import { getBusinessTypeIcon } from '../../utils/businessTypeIcons';
import { SectionLoader } from '../../components/LoadingState';
import { formatInputPlaceholder } from '../../utils/textCase';

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

interface AdminUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
}

const MAX_OWNER_PROFILE_NAME_LENGTH = 100;
const MAX_OWNER_PROFILE_EMAIL_LENGTH = 254;

const sanitizeOwnerProfileText = (value: unknown, maxLength: number) =>
    String(value ?? '').slice(0, maxLength);

export function OwnerAccountManagementPage() {
    const { t } = useTranslation();
    const { account, establishments, logout, updateAccount } = useAuth();
    const navigate = useNavigate();
    const [accountDetails, setAccountDetails] = useState<AccountDetails | null>(null);
    const [brands, setBrands] = useState<BrandCredential[]>([]);
    const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRestoring, setIsRestoring] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Active establishments blocking deletion modal
    const [showActiveEstBlockModal, setShowActiveEstBlockModal] = useState(false);
    const [activeBlockingEsts, setActiveBlockingEsts] = useState<any[]>([]);

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
    const [deleteReason, setDeleteReason] = useState('');
    const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
    const [deletePassword, setDeletePassword] = useState('');

    // Global Currency state
    const [globalCurrency, setGlobalCurrency] = useState('AED');
    const [isUpdatingCurrency, setIsUpdatingCurrency] = useState(false);

    const handleUpdateGlobalCurrency = async (newCurrency: string) => {
        try {
            setIsUpdatingCurrency(true);
            const response = await api.put('/api/accounts/currency', { currency: newCurrency });
            if (response.data?.success) {
                setGlobalCurrency(newCurrency);
                toast.success(`Global currency updated to ${newCurrency}`);
                
                // Update local establishments data
                if (accountDetails?.establishments) {
                    setAccountDetails(prev => prev ? ({
                        ...prev,
                        establishments: prev.establishments!.map(e => ({ ...e, currency: newCurrency }))
                    }) : prev);
                }
            }
        } catch (err: any) {
            console.error('Failed to update currency:', err);
            toast.error(err.response?.data?.message || 'Failed to update global currency');
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
            toast.error(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const deleteReasons = [
        "It's too expensive",
        "I found a better alternative",
        "Missing features I need",
        "Too difficult to use",
        "Closing my business",
        "Other"
    ];

    useEffect(() => {
        if (!showDeleteConfirm) {
            setDeleteStep(1);
            setDeleteReason('');
            setDeleteConfirmationText('');
            setDeletePassword('');
        }
    }, [showDeleteConfirm]);

    const fetchAccountData = useCallback(async () => {
        try {
            setIsLoading(true);

            // Fetch both profile and employees to get accurate stats
            const [profileRes, employeesRes] = await Promise.all([
                api.get('/api/accounts/profile'),
                api.get('/api/accounts/all-employees').catch(err => {
                    console.error('Failed to fetch employees for admin count:', err);
                    return { data: [] };
                })
            ]);

            const data = profileRes.data;
            const employees = employeesRes.data || [];
            const adminsFromEmployees = employees.filter((e: any) => e.role === 'ADMIN');

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
            
            // Sync adminUsers with the employees list to ensure consistency with the Staff page
            if (adminsFromEmployees.length > 0) {
                setAdminUsers(adminsFromEmployees);
            } else {
                setAdminUsers(data.adminUsers || []);
            }
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
        // Check for active establishments in either accountDetails or establishments from context
        const establishmentsToCheck = accountDetails?.establishments || establishments || [];
        const activeEsts = establishmentsToCheck.filter(
            (est: any) => est.subscriptionStatus === 'ACTIVE' || est.isActive === true
        );

        if (activeEsts.length > 0) {
            setActiveBlockingEsts(activeEsts);
            setShowActiveEstBlockModal(true);
            return;
        }

        setShowDeleteConfirm(true);
    };

    const handleDeleteAccount = async () => {
        try {
            setIsDeletingAccount(true);
            // Call the correct endpoint for account deletion
            await api.delete('/api/accounts/me', {
                data: {
                    reason: deleteReason,
                    password: deletePassword
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
            toast.error(t('owner.account.deletionFailed'));
        } finally {
            setIsDeletingAccount(false);
        }
    };

    const handleRestoreAccount = async () => {
        try {
            setIsRestoring(true);
            const response = await api.post('/api/accounts/me/restore');

            if (response.data.success) {
                toast.success(t('owner.account.accountRestored'));
                updateAccount({ deletionRequestedAt: undefined });
                setAccountDetails(prev => prev ? { ...prev, deletionRequestedAt: undefined } : null);
            }
        } catch (err: any) {
            console.error('Failed to restore account:', err);
            toast.error(err.response?.data?.message || t('owner.account.restoreFailed'));
        } finally {
            setIsRestoring(false);
        }
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
            return date.toLocaleDateString(t('common.language') === 'Arabic' ? 'ar-SA' : 'en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch {
            return t('common.na');
        }
    };



    const getStatusBadge = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'ACTIVE':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-paymint-green/ border border-paymint-green/ rounded-lg text-xs font-bold tracking-widest text-paymint-green">
                        <CheckCircle2 size={12} />
                        {t('common.status.active')}
                    </span>
                );
            case 'TRIAL':
            case 'TRIALING':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs font-bold tracking-widest text-blue-500">
                        <Zap size={12} />
                        {t('common.status.trial')}
                    </span>
                );
            case 'PAST_DUE':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 border border-red-500/20 rounded-lg text-xs font-bold tracking-widest text-red-500">
                        <AlertTriangle size={12} />
                        {t('common.status.pastDue')}
                    </span>
                );
            case 'CANCELED':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 border border-red-500/20 rounded-lg text-xs font-bold tracking-widest text-red-500">
                        <XCircle size={12} />
                        {t('common.status.canceled')}
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-500/10 border border-gray-500/20 rounded-lg text-xs font-bold tracking-widest text-gray-500">
                        {status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : ''}
                    </span>
                );
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

    return (
        <div className="space-y-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-paymint-green to-emerald-600 flex items-center justify-center shadow-lg shadow-paymint-green/20">
                        <KeyRound className="w-7 h-7 text-black" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                            {t('owner.account.title')}
                        </h1>
                        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2">
                            {t('owner.account.subtitle')}
                        </p>
                    </div>
                </div>

            </motion.div>

            {/* Quick Stats */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="grid grid-cols-2 md:grid-cols-3 gap-4"
            >
                {/* Locations Card */}
                <div className="group relative bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.03] p-4 sm:p-5 transition-all duration-300 overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                    <div className="relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                            <Store className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <p className="dashboard-stat-title mb-1 truncate">
                                {t('owner.account.stats.locations')}
                            </p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                                {establishments?.length || 0}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Brands Card */}
                <div className="group relative bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.03] p-4 sm:p-5 transition-all duration-300 overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                    <div className="relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                            <Building2 className="w-5 h-5 text-purple-500" />
                        </div>
                        <div>
                            <p className="dashboard-stat-title mb-1 truncate">
                                {t('owner.account.stats.brands')}
                            </p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                                {brands.length}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Admin Users Card */}
                <div className="group relative bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.03] p-4 sm:p-5 transition-all duration-300 overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                    <div className="relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                            <Users className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <p className="dashboard-stat-title mb-1 truncate">
                                {t('owner.account.stats.admins')}
                            </p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                                {adminUsers.length}
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Account Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Account Information Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="relative bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.05] p-6 shadow-sm transition-all duration-300 overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-40 h-40 bg-paymint-green/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-paymint-green/10 flex items-center justify-center">
                                        <User className="w-5 h-5 text-paymint-green" />
                                    </div>
                                    <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Owner Account</h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    {isEditing ? (
                                        <>
                                            <button
                                                onClick={handleCancelEdit}
                                                className="px-4 py-2 bg-gray-100 dark:bg-white/[0.05] hover:bg-gray-200 dark:hover:bg-white/[0.1] text-gray-600 dark:text-gray-300 rounded-xl text-sm font-bold transition-all"
                                                disabled={isSaving}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSaveProfile}
                                                className="flex items-center gap-2 px-4 py-2 bg-paymint-green hover:bg-[#68B390] text-black rounded-xl text-sm font-bold transition-all disabled:opacity-70"
                                                disabled={isSaving}
                                            >
                                                {isSaving ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                                        Saving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle2 size={16} />
                                                        Save
                                                    </>
                                                )}
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={handleEditClick}
                                                className="px-4 py-2 bg-gray-100 dark:bg-white/[0.05] hover:bg-gray-200 dark:hover:bg-white/[0.1] text-gray-600 dark:text-gray-300 rounded-xl text-sm font-bold transition-all"
                                            >
                                                Edit Profile
                                            </button>
                                            <button
                                                onClick={() => openPasswordModal('account')}
                                                className="flex items-center gap-2 px-4 py-2 bg-paymint-green/10 hover:bg-paymint-green/20 text-paymint-green rounded-xl text-sm font-bold transition-all"
                                            >
                                                <Key size={16} />
                                                Reset Password
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="label-strong capitalize-none flex items-center gap-2">
                                        <User size={12} />
                                        {t('owner.account.fullName')}
                                    </label>
                                    {isEditing ? (
                                        <div className="flex gap-2">
                                            <input maxLength={MAX_OWNER_PROFILE_NAME_LENGTH}
                                                type="text"
                                                value={editForm.firstName}
                                                onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                                                placeholder={formatInputPlaceholder(t('owner.account.firstName'), t('common.locale'))}
                                                className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F172A] border border-gray-200 dark:border-white/[0.1] rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-paymint-green/50"
                                            />
                                            <input maxLength={MAX_OWNER_PROFILE_NAME_LENGTH}
                                                type="text"
                                                value={editForm.lastName}
                                                onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                                                placeholder={formatInputPlaceholder(t('owner.account.lastName'), t('common.locale'))}
                                                className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F172A] border border-gray-200 dark:border-white/[0.1] rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-paymint-green/50"
                                            />
                                        </div>
                                    ) : (
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                                            {accountDetails?.firstName} {accountDetails?.lastName}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="label-strong capitalize-none flex items-center gap-2">
                                        <Mail size={12} />
                                        {t('owner.account.email')}
                                    </label>
                                    {isEditing ? (
                                        <input maxLength={MAX_OWNER_PROFILE_EMAIL_LENGTH}
                                            type="email"
                                            value={editForm.email}
                                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                            placeholder={formatInputPlaceholder(t('owner.account.email'), t('common.locale'))}
                                            className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F172A] border border-gray-200 dark:border-white/[0.1] rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-paymint-green/50"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                                                {accountDetails?.email}
                                            </p>
                                            {accountDetails?.emailVerified && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-paymint-green/ border border-paymint-green/ rounded-md text-xs font-bold tracking-widest text-paymint-green">
                                                    <Shield size={10} />
                                                    {t('owner.account.verified')}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="label-strong capitalize-none flex items-center gap-2">
                                        <Calendar size={12} />
                                        {t('owner.account.joined')}
                                    </label>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                                        {formatDate(accountDetails?.createdAt || '')}
                                    </p>
                                </div>
                            </div>

                            {/* Profile Completion Bar */}
                            {profileCompletion < 100 && (
                                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/[0.05]">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="label-strong">Profile Completion</span>
                                        <span className="text-sm font-bold text-paymint-green">{profileCompletion}%</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 dark:bg-white/[0.05] rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-paymint-green to-emerald-500 rounded-full transition-all duration-500"
                                            style={{ width: `${profileCompletion}%` }}
                                        />
                                    </div>
                                    <p className="text-sm font-bold text-gray-500 mt-2">
                                        Complete your profile to unlock all features
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Location Logins */}
                    {locationLoginEstablishments && locationLoginEstablishments.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.05] p-6 shadow-sm"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                    <Store className="w-5 h-5 text-blue-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                                        {t('owner.account.locationLogins', { count: locationLoginEstablishments.length })}
                                    </h2>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('owner.account.locationLoginsSubtitle')}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {locationLoginEstablishments.map((est: any) => {
                                    const slug = (est.establishmentLoginId || est.loginId || est.locationLoginId || est.id || '').trim();
                                    const Icon = getBusinessTypeIcon(est.type);
                                    return (
                                        <div
                                            key={est.id}
                                            className="relative bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.05] p-5 shadow-sm transition-all duration-300 overflow-hidden flex flex-col justify-between h-full"
                                        >
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                            <div className="relative z-10 flex flex-col h-full">
                                                {/* Header Section */}
                                                <div className="flex items-start justify-between gap-3 mb-4">
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                                                            <Icon className="w-5 h-5 text-blue-500" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h3 className="text-sm font-bold tracking-tight text-gray-900 dark:text-white truncate pr-1" title={est.name}>
                                                                {est.name}
                                                            </h3>
                                                            <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1.5">
                                                                {getStatusBadge(est.subscriptionStatus)}
                                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.05] text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">
                                                                    {est.currency?.toUpperCase() || 'JOD'}
                                                                </span>
                                                                {est.createdAt && (
                                                                    <>
                                                                        <span className="text-gray-300 dark:text-gray-600 text-[10px]">&bull;</span>
                                                                        <span className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                                                                            <Calendar size={12} className="opacity-70" />
                                                                            {t('owner.account.createdDate', { date: formatDate(est.createdAt) })}
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => window.open(`/dashboard/${slug}`, '_blank')}
                                                        className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all ml-auto shrink-0"
                                                        title="View Dashboard"
                                                    >
                                                        <ExternalLink size={16} />
                                                    </button>
                                                </div>

                                                {/* Login ID Section */}
                                                <div className="mt-auto">
                                                    <div className="p-3 bg-blue-50/70 dark:bg-blue-500/10 rounded-xl border border-blue-100 dark:border-blue-500/20 transition-colors">
                                                        <div className="flex items-center justify-between gap-2 mb-2">
                                                            <label className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 tracking-wide flex items-center gap-1">
                                                                <Key size={10} />
                                                                {t('owner.account.locationLoginId', { defaultValue: 'Location Login ID' })}
                                                            </label>
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-500/15 px-2 py-1 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                                                                <Shield size={10} />
                                                                {t('owner.account.locationLoginBadge', { defaultValue: 'Location' })}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between gap-2">
                                                            <button
                                                                onClick={() => copyToClipboard(slug, `est-login-${est.id}`)}
                                                                disabled={!slug}
                                                                className="text-xs font-bold text-blue-500 hover:text-blue-600 transition-colors flex items-center gap-1"
                                                            >
                                                                {copiedId === `est-login-${est.id}` ? (
                                                                    <span className="flex items-center gap-1 text-paymint-green"><CheckCircle2 size={10} /> {t('common.copied')}</span>
                                                                ) : (
                                                                    <span className="flex items-center gap-1"><Copy size={10} /> {t('common.copy')}</span>
                                                                )}
                                                            </button>
                                                        </div>
                                                        <code className="mt-2 block text-xs font-mono font-bold text-gray-900 dark:text-white truncate select-all">
                                                            {slug || t('common.na')}
                                                        </code>
                                                        <p className="mt-2 text-[11px] font-medium text-blue-700/80 dark:text-blue-200/80 leading-relaxed">
                                                            {t('owner.account.locationLoginHint', { defaultValue: 'Use this ID to sign in to this location dashboard.' })}
                                                        </p>
                                                    </div>

                                                    <div className="mt-3 flex justify-end">
                                                        <button
                                                            onClick={() => openPasswordModal('establishment', est.id, est.name)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all ml-auto"
                                                        >
                                                            <Lock size={12} />
                                                            {t('owner.account.resetPassword')}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </motion.div>
                    )}

                    {/* Brand Logins */}
                    {brands.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                            className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.05] p-6 shadow-sm"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                    <Building2 className="w-5 h-5 text-purple-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                                        {t('owner.account.brandLogins', { count: brands.length })}
                                    </h2>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('owner.account.brandLoginsSubtitle')}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {brands.map((brand) => {
                                    // Robust counting logic
                                    let count = brand.establishmentCount || brand._count?.establishments || (brand.establishments ? brand.establishments.length : 0);

                                    // If count is missing from profile, try to calculate from global establishments
                                    if (!count && establishments) {
                                        const directMatches = establishments.filter((e: any) => e.brandId === brand.id || e.brand?.id === brand.id).length;
                                        if (directMatches > 0) {
                                            count = directMatches;
                                        } else if (brands.length === 1 && establishments.length > 0) {
                                            // Fallback: If owner has only 1 brand and we can't link, assume all establishments belong to this brand
                                            count = establishments.length;
                                        }
                                    }

                                    return (
                                        <div
                                            key={brand.id}
                                            className="relative bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.05] p-5 shadow-sm transition-all duration-300 overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                                            <div className="relative z-10 space-y-5">
                                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shrink-0">
                                                            <Building2 className="w-6 h-6 text-purple-500" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">{brand.name}</h3>
                                                            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                                                                <span className="font-medium bg-gray-100 dark:bg-white/[0.05] px-2 py-0.5 rounded-md border border-gray-200 dark:border-white/[0.05]">
                                                                    {t('owner.account.locationsCount', { count })}
                                                                </span>
                                                                <span className="text-gray-300 dark:text-gray-600">&bull;</span>
                                                                <span className={`font-bold ${brand.isActive ? 'text-paymint-green' : 'text-gray-400'}`}>
                                                                    {brand.isActive ? t('common.status.active') : t('common.status.inactive')}
                                                                </span>
                                                                <span className="text-gray-300 dark:text-gray-600">&bull;</span>
                                                                <span className="flex items-center gap-1.5 font-medium">
                                                                    <Calendar size={12} className="opacity-70" />
                                                                    {t('owner.account.createdDate', { date: formatDate(brand.createdAt) })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => openPasswordModal('brand', brand.id, brand.name)}
                                                        className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.1] hover:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-900/10 text-gray-600 dark:text-gray-300 hover:text-red-500 rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 self-start sm:self-center"
                                                    >
                                                        <Lock size={14} />
                                                        {t('owner.account.resetPassword')}
                                                    </button>
                                                </div>

                                                <div className="mt-5 p-4 bg-blue-50/70 dark:bg-blue-500/10 rounded-xl border border-blue-100 dark:border-blue-500/20 transition-colors">
                                                    <div className="flex items-center justify-between gap-2 mb-2">
                                                        <label className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 tracking-wide flex items-center gap-1.5">
                                                            <Key size={10} />
                                                            {t('owner.account.brandLoginId')}
                                                        </label>
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-500/15 px-2 py-1 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                                                            <Shield size={10} />
                                                            {t('owner.account.brandLoginBadge', { defaultValue: 'Brand' })}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-2">
                                                        <button
                                                            onClick={() => copyToClipboard(brand.establishmentLoginId, `brand-${brand.id}`)}
                                                            className="text-xs font-bold text-blue-500 hover:text-blue-600 transition-colors flex items-center gap-1"
                                                        >
                                                            {copiedId === `brand-${brand.id}` ? (
                                                                <span className="flex items-center gap-1 text-paymint-green"><CheckCircle2 size={10} /> {t('common.copied')}</span>
                                                            ) : (
                                                                <span className="flex items-center gap-1"><Copy size={10} /> {t('common.copy')}</span>
                                                            )}
                                                        </button>
                                                    </div>
                                                    <code className="mt-2 block text-sm font-mono font-bold text-gray-900 dark:text-white tracking-wide truncate select-all">
                                                        {brand.establishmentLoginId}
                                                    </code>
                                                    <p className="mt-2 text-[11px] font-medium text-blue-700/80 dark:text-blue-200/80 leading-relaxed">
                                                        {t('owner.account.brandLoginHint', { defaultValue: 'Use this ID to sign in to the brand dashboard.' })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Right Column - Security & Info */}
                <div className="space-y-6">

                    {/* Global System Currency */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="relative bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.05] p-6 shadow-sm transition-all duration-300 overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                    <Landmark className="w-5 h-5 text-amber-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">System Currency</h2>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Updates currency for all your locations.</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="relative">
                                    <select
                                        value={globalCurrency}
                                        onChange={(e) => handleUpdateGlobalCurrency(e.target.value)}
                                        disabled={isUpdatingCurrency}
                                        className="w-full h-12 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/[0.08] rounded-xl px-4 font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all appearance-none cursor-pointer disabled:opacity-50"
                                    >
                                        {CURRENCIES.map((c) => (
                                            <option key={c.code} value={c.code} className="bg-white dark:bg-gray-800">
                                                {c.name} ({c.symbol})
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                                {isUpdatingCurrency && (
                                    <p className="text-xs font-bold text-amber-500 animate-pulse text-center">
                                        Applying changes to all locations...
                                    </p>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* Resources & Help */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="relative bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.05] p-6 shadow-sm transition-all duration-300 overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                    <BookOpen className="w-5 h-5 text-blue-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">{t('owner.account.resources.title')}</h2>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('owner.account.resources.subtitle')}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {/* User Manual */}
                                <a
                                    href="/docs/paymint-user-manual.pdf"
                                    download="Paymint_User_Manual.pdf"
                                    className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/[0.05] transition-all"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-white/[0.05] flex items-center justify-center shadow-sm border border-gray-100 dark:border-white/[0.05]">
                                        <BookOpen size={20} className="text-blue-500 group-hover/item:scale-110 transition-transform" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-bold tracking-tight text-gray-900 dark:text-white">{t('owner.account.resources.userManual.title')}</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('owner.account.resources.userManual.desc')}</p>
                                    </div>
                                    <Download size={16} className="text-gray-400 group-hover/item:text-blue-500 transition-colors" />
                                </a>

                                {/* Setup Manual */}
                                <a
                                    href="/docs/paymint-setup-manual.pdf"
                                    download="Paymint_Setup_Manual.pdf"
                                    className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/[0.05] transition-all"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-white/[0.05] flex items-center justify-center shadow-sm border border-gray-100 dark:border-white/[0.05]">
                                        <Settings size={20} className="text-amber-500 group-hover/item:scale-110 transition-transform" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-bold tracking-tight text-gray-900 dark:text-white">{t('owner.account.resources.setupManual.title')}</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('owner.account.resources.setupManual.desc')}</p>
                                    </div>
                                    <Download size={16} className="text-gray-400 group-hover/item:text-amber-500 transition-colors" />
                                </a>

                                {/* Video Tutorial */}
                                <a
                                    href="https://vimeo.com/1158972798"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/[0.05] transition-all"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-white/[0.05] flex items-center justify-center shadow-sm border border-gray-100 dark:border-white/[0.05]">
                                        <PlayCircle size={20} className="text-red-500 group-hover/item:scale-110 transition-transform" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-bold tracking-tight text-gray-900 dark:text-white">{t('owner.account.resources.videoTutorial.title')}</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('owner.account.resources.videoTutorial.desc')}</p>
                                    </div>
                                    <ExternalLink size={16} className="text-gray-400 group-hover/item:text-red-500 transition-colors" />
                                </a>

                                {/* Q&A */}
                                <a
                                    href="/qa"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/[0.05] transition-all"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-white/[0.05] flex items-center justify-center shadow-sm border border-gray-100 dark:border-white/[0.05]">
                                        <BookOpen size={20} className="text-purple-500 group-hover/item:scale-110 transition-transform" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-bold tracking-tight text-gray-900 dark:text-white">{t('owner.account.resources.qa.title')}</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('owner.account.resources.qa.desc')}</p>
                                    </div>
                                    <ExternalLink size={16} className="text-gray-400 group-hover/item:text-purple-500 transition-colors" />
                                </a>

                                {/* Privacy Policy */}
                                <a
                                    href="/legal/privacy"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/[0.05] transition-all"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-white/[0.05] flex items-center justify-center shadow-sm border border-gray-100 dark:border-white/[0.05]">
                                        <Shield size={20} className="text-paymint-green group-hover/item:scale-110 transition-transform" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-bold tracking-tight text-gray-900 dark:text-white">{t('owner.account.resources.privacyPolicy.title')}</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('owner.account.resources.privacyPolicy.desc')}</p>
                                    </div>
                                    <ExternalLink size={16} className="text-gray-400 group-hover/item:text-paymint-green transition-colors" />
                                </a>

                                {/* Terms of Use */}
                                <a
                                    href="/legal/terms"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/[0.05] transition-all"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-white/[0.05] flex items-center justify-center shadow-sm border border-gray-100 dark:border-white/[0.05]">
                                        <Scale size={20} className="text-blue-500 group-hover/item:scale-110 transition-transform" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-bold tracking-tight text-gray-900 dark:text-white">{t('owner.account.resources.termsOfUse.title')}</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('owner.account.resources.termsOfUse.desc')}</p>
                                    </div>
                                    <ExternalLink size={16} className="text-gray-400 group-hover/item:text-blue-500 transition-colors" />
                                </a>

                                {/* About Us */}
                                <a
                                    href="/about"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/[0.05] transition-all"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-white/[0.05] flex items-center justify-center shadow-sm border border-gray-100 dark:border-white/[0.05]">
                                        <Info size={20} className="text-paymint-green group-hover/item:scale-110 transition-transform" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-bold tracking-tight text-gray-900 dark:text-white">{t('owner.account.resources.aboutUs.title')}</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('owner.account.resources.aboutUs.desc')}</p>
                                    </div>
                                    <ExternalLink size={16} className="text-gray-400 group-hover/item:text-paymint-green transition-colors" />
                                </a>
                            </div>
                        </div>
                    </motion.div>




                    {/* Quick Tips */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="relative bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.05] p-6 shadow-sm transition-all duration-300 overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-40 h-40 bg-paymint-green/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-paymint-green/20 flex items-center justify-center">
                                    <Info className="w-5 h-5 text-paymint-green" />
                                </div>
                                <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">{t('owner.account.securityTips.title')}</h2>
                            </div>

                            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 size={16} className="text-paymint-green mt-0.5 shrink-0" />
                                    <span>{t('owner.account.securityTips.uniquePasswords')}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 size={16} className="text-paymint-green mt-0.5 shrink-0" />
                                    <span>{t('owner.account.securityTips.updatePeriodically')}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 size={16} className="text-paymint-green mt-0.5 shrink-0" />
                                    <span>{t('owner.account.securityTips.neverShareOtp')}</span>
                                </li>
                            </ul>
                        </div>
                    </motion.div>

                    {/* Danger Zone / Restoration Zone */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className={`relative bg-white dark:bg-[#1E293B] rounded-2xl border p-6 shadow-sm transition-all duration-300 overflow-hidden ${accountDetails?.deletionRequestedAt ? 'border-paymint-green/20' : 'border-red-500/20'}`}
                    >
                        <div className={`absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${accountDetails?.deletionRequestedAt ? 'bg-paymint-green/10' : 'bg-red-500/10'}`} />
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`w-10 h-10 rounded-xl ${accountDetails?.deletionRequestedAt ? 'bg-paymint-green/10' : 'bg-red-500/10'} flex items-center justify-center`}>
                                    {accountDetails?.deletionRequestedAt ? (
                                        <div className="w-5 h-5 border-2 border-paymint-green/30 border-t-paymint-green rounded-full" />
                                    ) : (
                                        <AlertCircle className="w-5 h-5 text-red-500" />
                                    )}
                                </div>
                                <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                                    {accountDetails?.deletionRequestedAt ? t('owner.account.restoreAccount') : t('owner.account.dangerZone')}
                                </h2>
                            </div>

                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                {accountDetails?.deletionRequestedAt
                                    ? t('owner.account.deletionScheduledHint')
                                    : t('owner.account.dangerZoneHint')}
                            </p>

                            {accountDetails?.deletionRequestedAt ? (
                                <button
                                    onClick={handleRestoreAccount}
                                    disabled={isRestoring}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-paymint-green hover:bg-[#68B390] text-black rounded-xl text-sm font-black transition-all shadow-lg shadow-paymint-green/20 disabled:opacity-70"
                                >
                                    {isRestoring ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                            {t('common.restoring')}
                                        </>
                                    ) : (
                                        <>
                                            {t('owner.account.restoreMyAccount')}
                                        </>
                                    )}
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
                    </motion.div>
                </div>
            </div>

            {/* Empty State */}
            {(!establishments || establishments.length === 0) && brands.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.05] p-12 shadow-sm text-center"
                >
                    <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-white/[0.05] flex items-center justify-center mx-auto mb-4">
                        <Store className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white mb-2">
                        {t('owner.account.noLocationsOrBrands')}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto">
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
            {showDeleteConfirm && createPortal(
                <div className="fixed inset-0 z-[9999] popup-surface flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-[#1E293B] rounded-3xl border border-gray-200 dark:border-white/[0.05] p-8 max-w-md w-full shadow-2xl"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5 text-red-500" />
                                </div>
                                <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                                    {t('owner.account.deleteAccountModal.title')}
                                </h3>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex gap-1">
                                    {[1, 2, 3].map((step) => (
                                        <div
                                            key={step}
                                            className={`w-2 h-2 rounded-full transition-colors ${deleteStep >= step ? 'bg-red-500' : 'bg-gray-200 dark:bg-white/10'
                                                }`}
                                        />
                                    ))}
                                </div>
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {deleteStep === 1 && (
                            <div className="space-y-6">
                                <div>
                                    <p className="text-gray-900 dark:text-white font-bold mb-1">{t('owner.account.deleteAccountModal.whyLeaving')}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('owner.account.deleteAccountModal.feedbackHint')}</p>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                    {deleteReasons.map((reason) => (
                                        <button
                                            key={reason}
                                            onClick={() => setDeleteReason(reason)}
                                            className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm font-medium ${deleteReason === reason
                                                ? 'bg-paymint-green/10 border-paymint-green text-paymint-green'
                                                : 'bg-gray-50 dark:bg-white/[0.02] border-gray-100 dark:border-white/[0.05] text-gray-600 dark:text-gray-400 hover:border-gray-300'
                                                }`}
                                        >
                                            {t(`owner.account.deleteAccountModal.reasons.${reason.toLowerCase().replace(/ /g, '_').replace("'", '')}`, { defaultValue: reason })}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setDeleteStep(2)}
                                    disabled={!deleteReason}
                                    className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-black rounded-2xl text-sm font-black disabled:opacity-50 transition-all"
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
                                <div className="space-y-3">
                                    <label className="text-sm font-normal text-gray-700 dark:text-gray-300">
                                        {t('owner.account.deleteAccountModal.confirmDeletePrompt', { keyword: t('common.delete') })}
                                    </label>
                                    <input maxLength={255}
                                        type="text"
                                        value={deleteConfirmationText}
                                        onChange={(e) => setDeleteConfirmationText(e.target.value)}
                                        placeholder={t('owner.account.deleteAccountModal.typeDeletePlaceholder', { keyword: t('common.delete') })}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0F172A] border border-gray-200 dark:border-white/[0.1] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setDeleteStep(1)}
                                        className="flex-1 py-4 bg-gray-100 dark:bg-white/[0.05] text-gray-600 dark:text-gray-300 rounded-2xl text-sm font-bold"
                                    >
                                        {t('common.back')}
                                    </button>
                                    <button
                                        onClick={() => setDeleteStep(3)}
                                        disabled={deleteConfirmationText !== t('common.delete')}
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
                                    <label className="text-sm font-normal text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                        <Lock size={14} />
                                        {t('owner.account.deleteAccountModal.confirmPassword')}
                                    </label>
                                    <input maxLength={255}
                                        type="password"
                                        value={deletePassword}
                                        onChange={(e) => setDeletePassword(e.target.value)}
                                        placeholder={formatInputPlaceholder(t('owner.account.deleteAccountModal.passwordPlaceholder'), t('common.locale'))}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0F172A] border border-gray-200 dark:border-white/[0.1] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                                    />
                                </div>
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={handleDeleteAccount}
                                        disabled={!deletePassword || isDeletingAccount}
                                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-2xl text-sm font-black transition-all shadow-lg shadow-red-500/20"
                                    >
                                        {isDeletingAccount ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                                {t('owner.account.deleteAccountModal.deleting')}
                                            </>
                                        ) : (
                                            t('owner.account.deleteAccountModal.confirmFinal')
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setDeleteStep(2)}
                                        disabled={isDeletingAccount}
                                        className="w-full px-6 py-4 bg-gray-100 dark:bg-white/[0.05] hover:bg-gray-200 dark:hover:bg-white/[0.1] text-gray-600 dark:text-gray-300 rounded-2xl text-sm font-bold transition-all"
                                    >
                                        {t('common.back')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>,
                document.body
            )}
            {/* Active Establishments Block Modal */}
            <AnimatePresence>
                {showActiveEstBlockModal && createPortal(
                    <div className="fixed inset-0 z-[9999] popup-surface flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-[#1E293B] rounded-3xl border border-gray-200 dark:border-white/[0.05] p-8 max-w-md w-full shadow-2xl"
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
                                    <AlertCircle className="w-6 h-6 text-amber-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white leading-tight">
                                        {t('owner.account.activeEstBlockModal.title')}
                                    </h3>
                                </div>
                            </div>

                            <div className="space-y-6">

                                <div className="bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/[0.05] overflow-hidden">
                                    <div className="px-4 py-3 border-b border-gray-100 dark:border-white/[0.05] bg-gray-100/50 dark:bg-white/[0.02]">
                                        <p className="label-strong">{t('owner.account.activeEstBlockModal.activeLocations')}</p>
                                    </div>
                                    <div className="max-h-40 overflow-y-auto p-2 space-y-1">
                                        {activeBlockingEsts.map((est) => {
                                            const Icon = getBusinessTypeIcon(est.type);
                                            return (
                                                <div key={est.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white dark:hover:bg-white/[0.05] transition-colors">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                                                        <Icon className="w-4 h-4 text-blue-500" />
                                                    </div>
                                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">
                                                        {est.name}
                                                    </span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={() => navigate('/owner/billing')}
                                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-paymint-green hover:bg-[#68B390] text-black rounded-2xl text-sm font-black transition-all shadow-lg shadow-paymint-green/20"
                                    >
                                        <CreditCard size={18} />
                                        {t('owner.account.activeEstBlockModal.goToBilling')}
                                    </button>
                                    <button
                                        onClick={() => setShowActiveEstBlockModal(false)}
                                        className="w-full px-6 py-4 bg-gray-100 dark:bg-white/[0.05] hover:bg-gray-200 dark:hover:bg-white/[0.1] text-gray-600 dark:text-gray-300 rounded-2xl text-sm font-bold transition-all"
                                    >
                                        {t('common.close')}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>,
                    document.body
                )}
            </AnimatePresence>
        </div>
    );
}




