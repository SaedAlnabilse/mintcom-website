import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User,
    Mail,
    Phone,
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
    RefreshCw,
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
} from 'lucide-react';
import api from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { PasswordResetOtpModal } from '../../components/PasswordResetOtpModal';
import toast from 'react-hot-toast';

interface AccountDetails {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
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

export function OwnerAccountManagementPage() {
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

    const [isDeletingAccount, setIsDeletingAccount] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteStep, setDeleteStep] = useState(1);
    const [deleteReason, setDeleteReason] = useState('');
    const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
    const [deletePassword, setDeletePassword] = useState('');

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

    useEffect(() => {
        fetchAccountData();
    }, []);

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
            // In a real implementation, this would call the API
            await api.delete('/api/accounts/profile', {
                data: {
                    reason: deleteReason,
                    password: deletePassword
                }
            });

            toast.success('Account deletion process initiated. Your account will be permanently deleted in 30 days.');
            setShowDeleteConfirm(false);

            // Use the logout method from AuthContext to clear session and redirect
            setTimeout(async () => {
                await logout();
            }, 3000);
        } catch (err) {
            console.error('Failed to delete account:', err);
            toast.error('Failed to initiate account deletion. Please contact support.');
        } finally {
            setIsDeletingAccount(false);
        }
    };

    const fetchAccountData = async () => {
        try {
            setIsLoading(true);

            const response = await api.get('/api/accounts/profile');
            const data = response.data;

            setAccountDetails({
                id: data.id,
                email: data.email,
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone,
                avatar: data.avatar,
                emailVerified: data.emailVerified,
                createdAt: data.createdAt,
                trialUsed: data.trialUsed,
                trialEndDate: data.trialEndDate,
                defaultCardId: data.defaultCardId,
                deletionRequestedAt: data.deletionRequestedAt,
                establishments: data.establishments || [],
            });

            setBrands(data.brands || []);
            setAdminUsers(data.adminUsers || []);
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
    };

    const handleRestoreAccount = async () => {
        try {
            setIsRestoring(true);
            const response = await api.post('/api/accounts/me/restore');

            if (response.data.success) {
                toast.success('Account successfully restored!');
                updateAccount({ deletionRequestedAt: undefined });
                setAccountDetails(prev => prev ? { ...prev, deletionRequestedAt: undefined } : null);
            }
        } catch (err: any) {
            console.error('Failed to restore account:', err);
            toast.error(err.response?.data?.message || 'Failed to restore account. Please contact support.');
        } finally {
            setIsRestoring(false);
        }
    };

    const copyToClipboard = async (text: string, id: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(id);
            toast.success('Copied to clipboard');
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            toast.error('Failed to copy');
        }
    };

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch {
            return 'N/A';
        }
    };



    const getStatusBadge = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'ACTIVE':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[10px] font-bold tracking-widest text-emerald-500">
                        <CheckCircle2 size={12} />
                        Active
                    </span>
                );
            case 'TRIAL':
            case 'TRIALING':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[10px] font-bold tracking-widest text-blue-500">
                        <Zap size={12} />
                        Trial
                    </span>
                );
            case 'PAST_DUE':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 border border-red-500/20 rounded-lg text-[10px] font-bold tracking-widest text-red-500">
                        <AlertTriangle size={12} />
                        Past Due
                    </span>
                );
            case 'CANCELED':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 border border-red-500/20 rounded-lg text-[10px] font-bold tracking-widest text-red-500">
                        <XCircle size={12} />
                        Canceled
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-500/10 border border-gray-500/20 rounded-lg text-[10px] font-bold tracking-widest text-gray-500">
                        {status}
                    </span>
                );
        }
    };

    const getProfileCompletion = () => {
        if (!accountDetails) return 0;
        let completed = 0;
        const total = 4;

        if (accountDetails.firstName && accountDetails.lastName) completed++;
        if (accountDetails.email) completed++;
        if (accountDetails.emailVerified) completed++;
        if (accountDetails.phone) completed++;

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
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-paymint-green/30 border-t-paymint-green rounded-full animate-spin" />
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Loading account information...</p>
                </div>
            </div>
        );
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
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                            Account Management
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                            Manage your credentials, security, and account settings
                        </p>
                    </div>
                </div>
                <button
                    onClick={fetchAccountData}
                    className="p-3 rounded-xl bg-gray-100 dark:bg-white/[0.05] hover:bg-gray-200 dark:hover:bg-white/[0.1] text-gray-600 dark:text-gray-400 transition-all"
                >
                    <RefreshCw size={20} />
                </button>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="grid grid-cols-2 md:grid-cols-3 gap-4"
            >
                {/* Establishments Card */}
                <div className="group relative bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.05] p-5 shadow-sm hover:shadow-lg hover:border-blue-500/30 transition-all duration-300 overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                    <div className="relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                            <Store className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 tracking-widest mb-1">
                                Establishments
                            </p>
                            <p className="text-3xl font-black text-gray-900 dark:text-white">
                                {establishments?.length || 0}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Brands Card */}
                <div className="group relative bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.05] p-5 shadow-sm hover:shadow-lg hover:border-purple-500/30 transition-all duration-300 overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                    <div className="relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                            <Building2 className="w-6 h-6 text-purple-500" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 tracking-widest mb-1">
                                Brands
                            </p>
                            <p className="text-3xl font-black text-gray-900 dark:text-white">
                                {brands.length}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Admin Users Card */}
                <div className="group relative bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.05] p-5 shadow-sm hover:shadow-lg hover:border-amber-500/30 transition-all duration-300 overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                    <div className="relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                            <Users className="w-6 h-6 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 tracking-widest mb-1">
                                Admin Users
                            </p>
                            <p className="text-3xl font-black text-gray-900 dark:text-white">
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
                        className="group relative bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.05] p-6 shadow-sm hover:shadow-lg hover:border-paymint-green/30 transition-all duration-300 overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-40 h-40 bg-paymint-green/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-paymint-green/10 flex items-center justify-center">
                                        <User className="w-5 h-5 text-paymint-green" />
                                    </div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Account Information</h2>
                                </div>
                                <button
                                    onClick={() => openPasswordModal('account')}
                                    className="flex items-center gap-2 px-4 py-2 bg-paymint-green/10 hover:bg-paymint-green/20 text-paymint-green rounded-xl text-sm font-bold transition-all"
                                >
                                    <Key size={16} />
                                    Reset Password
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 tracking-widest flex items-center gap-2">
                                        <User size={12} />
                                        Full Name
                                    </label>
                                    <p className="text-gray-900 dark:text-white font-semibold">
                                        {accountDetails?.firstName} {accountDetails?.lastName}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 tracking-widest flex items-center gap-2">
                                        <Mail size={12} />
                                        Email
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <p className="text-gray-900 dark:text-white font-semibold">
                                            {accountDetails?.email}
                                        </p>
                                        {accountDetails?.emailVerified && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-[9px] font-bold tracking-widest text-emerald-500">
                                                <Shield size={10} />
                                                Verified
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 tracking-widest flex items-center gap-2">
                                        <Phone size={12} />
                                        Phone
                                    </label>
                                    <p className="text-gray-900 dark:text-white font-semibold">
                                        {accountDetails?.phone || <span className="text-gray-400 italic">Not set</span>}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 tracking-widest flex items-center gap-2">
                                        <Calendar size={12} />
                                        Member Since
                                    </label>
                                    <p className="text-gray-900 dark:text-white font-semibold">
                                        {formatDate(accountDetails?.createdAt || '')}
                                    </p>
                                </div>
                            </div>

                            {/* Profile Completion Bar */}
                            {profileCompletion < 100 && (
                                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/[0.05]">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Profile Completion</span>
                                        <span className="text-sm font-bold text-paymint-green">{profileCompletion}%</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 dark:bg-white/[0.05] rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-paymint-green to-emerald-500 rounded-full transition-all duration-500"
                                            style={{ width: `${profileCompletion}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Complete your profile to unlock all features
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Establishments Credentials */}
                    {establishments && establishments.length > 0 && (
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
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                        Establishments ({establishments.length})
                                    </h2>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Login credentials for each location</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {establishments.map((est: any) => (
                                    <div
                                        key={est.id}
                                        className="group relative bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.05] p-5 shadow-sm hover:shadow-lg hover:border-blue-500/30 transition-all duration-300 overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                                        <div className="relative z-10 space-y-5">
                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shrink-0">
                                                        <Store className="w-6 h-6 text-blue-500" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center flex-wrap gap-2">
                                                            <h3 className="text-base font-bold text-gray-900 dark:text-white">{est.name}</h3>
                                                            {getStatusBadge(est.subscriptionStatus)}
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                                                            <span className="capitalize px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.05]">
                                                                {est.type?.toLowerCase()}
                                                            </span>
                                                            <span>•</span>
                                                            <span>{est.currency}</span>
                                                        </div>
                                                        <p className="text-[10px] text-gray-400 mt-1">
                                                            Created {formatDate(est.createdAt || new Date().toISOString())}
                                                        </p>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => openPasswordModal('establishment', est.id, est.name)}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.1] hover:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-900/10 text-gray-600 dark:text-gray-300 hover:text-red-500 rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 self-start sm:self-center"
                                                >
                                                    <Lock size={14} />
                                                    Reset Password
                                                </button>
                                            </div>

                                            <div className="mt-5 p-4 bg-white dark:bg-[#020617] rounded-xl border border-gray-200 dark:border-white/[0.05] group-hover:border-paymint-green/20 transition-colors">
                                                <label className="text-[10px] font-bold text-gray-400 tracking-widest mb-2 flex items-center gap-1.5">
                                                    <Key size={10} />
                                                    Login ID
                                                </label>
                                                <div className="flex items-center justify-between gap-3">
                                                    <code className="text-sm font-mono font-bold text-gray-900 dark:text-white tracking-wide truncate">
                                                        {est.establishmentLoginId}
                                                    </code>
                                                    <button
                                                        onClick={() => copyToClipboard(est.establishmentLoginId, `est-login-${est.id}`)}
                                                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.1] text-gray-400 hover:text-paymint-green transition-colors"
                                                    >
                                                        {copiedId === `est-login-${est.id}` ? <CheckCircle2 size={18} className="text-paymint-green" /> : <Copy size={18} />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Brands Credentials */}
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
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                        Brands ({brands.length})
                                    </h2>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Login credentials for each brand</p>
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
                                            className="group relative bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.05] p-5 shadow-sm hover:shadow-lg hover:border-purple-500/30 transition-all duration-300 overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                                            <div className="relative z-10 space-y-5">
                                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shrink-0">
                                                            <Building2 className="w-6 h-6 text-purple-500" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-base font-bold text-gray-900 dark:text-white">{brand.name}</h3>
                                                            <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                                                                <span className="font-medium bg-gray-100 dark:bg-white/[0.05] px-2 py-0.5 rounded-md border border-gray-200 dark:border-white/[0.05]">
                                                                    {count} establishment{count !== 1 ? 's' : ''}
                                                                </span>
                                                                <span>•</span>
                                                                <span className={`font-bold ${brand.isActive ? 'text-emerald-500' : 'text-gray-400'}`}>
                                                                    {brand.isActive ? 'Active' : 'Inactive'}
                                                                </span>
                                                            </div>
                                                            <p className="text-[10px] text-gray-400 mt-1">
                                                                Created {formatDate(brand.createdAt)}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => openPasswordModal('brand', brand.id, brand.name)}
                                                        className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.1] hover:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-900/10 text-gray-600 dark:text-gray-300 hover:text-red-500 rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 self-start sm:self-center"
                                                    >
                                                        <Lock size={14} />
                                                        Reset Password
                                                    </button>
                                                </div>

                                                <div className="mt-5 p-4 bg-white dark:bg-[#020617] rounded-xl border border-gray-200 dark:border-white/[0.05] group-hover:border-purple-500/20 transition-colors">
                                                    <label className="text-[10px] font-bold text-gray-400 tracking-widest mb-2 flex items-center gap-1.5">
                                                        <Key size={10} />
                                                        Brand Login ID
                                                    </label>
                                                    <div className="flex items-center justify-between gap-3">
                                                        <code className="text-sm font-mono font-bold text-gray-900 dark:text-white tracking-wide truncate">
                                                            {brand.establishmentLoginId}
                                                        </code>
                                                        <button
                                                            onClick={() => copyToClipboard(brand.establishmentLoginId, `brand-${brand.id}`)}
                                                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.1] text-gray-400 hover:text-purple-500 transition-colors"
                                                        >
                                                            {copiedId === `brand-${brand.id}` ? <CheckCircle2 size={18} className="text-purple-500" /> : <Copy size={18} />}
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
                </div>

                {/* Right Column - Security & Info */}
                <div className="space-y-6">

                    {/* Resources & Help */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="group relative bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.05] p-6 shadow-sm hover:shadow-lg hover:border-paymint-green/30 transition-all duration-300 overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                    <BookOpen className="w-5 h-5 text-blue-500" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Resources & Help</h2>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Guides and tutorials to help you succeed</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {/* User Manual */}
                                <a
                                    href="/docs/paymint-user-manual.pdf"
                                    download="Paymint_User_Manual.pdf"
                                    className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 dark:bg-black/20 hover:bg-gray-100 dark:hover:bg-white/[0.05] border border-gray-100 dark:border-white/[0.05] transition-all group/item"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-white/[0.05] flex items-center justify-center shadow-sm border border-gray-100 dark:border-white/[0.05]">
                                        <BookOpen size={20} className="text-blue-500 group-hover/item:scale-110 transition-transform" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">User Manual</h4>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400">Complete software guide</p>
                                    </div>
                                    <Download size={16} className="text-gray-400 group-hover/item:text-blue-500 transition-colors" />
                                </a>

                                {/* Setup Manual */}
                                <a
                                    href="/docs/paymint-setup-manual.pdf"
                                    download="Paymint_Setup_Manual.pdf"
                                    className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 dark:bg-black/20 hover:bg-gray-100 dark:hover:bg-white/[0.05] border border-gray-100 dark:border-white/[0.05] transition-all group/item"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-white/[0.05] flex items-center justify-center shadow-sm border border-gray-100 dark:border-white/[0.05]">
                                        <Settings size={20} className="text-amber-500 group-hover/item:scale-110 transition-transform" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">Setup Manual</h4>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400">Hardware & printer setup</p>
                                    </div>
                                    <Download size={16} className="text-gray-400 group-hover/item:text-amber-500 transition-colors" />
                                </a>

                                {/* Video Tutorial */}
                                <a
                                    href="/demo-video.mp4"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 dark:bg-black/20 hover:bg-gray-100 dark:hover:bg-white/[0.05] border border-gray-100 dark:border-white/[0.05] transition-all group/item"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-white/[0.05] flex items-center justify-center shadow-sm border border-gray-100 dark:border-white/[0.05]">
                                        <PlayCircle size={20} className="text-red-500 group-hover/item:scale-110 transition-transform" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">Video Tutorial</h4>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400">7-min quick start guide</p>
                                    </div>
                                    <ExternalLink size={16} className="text-gray-400 group-hover/item:text-red-500 transition-colors" />
                                </a>
                            </div>
                        </div>
                    </motion.div>




                    {/* Quick Tips */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="group relative bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.05] p-6 shadow-sm hover:shadow-lg hover:border-paymint-green/30 transition-all duration-300 overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-40 h-40 bg-paymint-green/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-paymint-green/20 flex items-center justify-center">
                                    <Info className="w-5 h-5 text-paymint-green" />
                                </div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Security Tips</h2>
                            </div>

                            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 size={16} className="text-paymint-green mt-0.5 shrink-0" />
                                    <span>Use unique passwords for each establishment</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 size={16} className="text-paymint-green mt-0.5 shrink-0" />
                                    <span>Reset credentials periodically for security</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 size={16} className="text-paymint-green mt-0.5 shrink-0" />
                                    <span>Never share your OTP codes with anyone</span>
                                </li>
                            </ul>
                        </div>
                    </motion.div>

                    {/* Danger Zone / Restoration Zone */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className={`group relative bg-white dark:bg-[#1E293B] rounded-2xl border p-6 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden ${accountDetails?.deletionRequestedAt ? 'border-paymint-green/20 hover:border-paymint-green/50' : 'border-red-500/20 hover:border-red-500/50'}`}
                    >
                        <div className={`absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${accountDetails?.deletionRequestedAt ? 'bg-paymint-green/10' : 'bg-red-500/10'}`} />
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`w-10 h-10 rounded-xl ${accountDetails?.deletionRequestedAt ? 'bg-paymint-green/10' : 'bg-red-500/10'} flex items-center justify-center`}>
                                    {accountDetails?.deletionRequestedAt ? (
                                        <RefreshCw className="w-5 h-5 text-paymint-green" />
                                    ) : (
                                        <AlertCircle className="w-5 h-5 text-red-500" />
                                    )}
                                </div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                    {accountDetails?.deletionRequestedAt ? 'Restore Account' : 'Danger Zone'}
                                </h2>
                            </div>

                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                {accountDetails?.deletionRequestedAt
                                    ? 'Your account is currently scheduled for deletion. You can restore it at any time before the 30-day period ends.'
                                    : 'Once you delete your account, there is no going back. Please be certain.'}
                            </p>

                            {accountDetails?.deletionRequestedAt ? (
                                <button
                                    onClick={handleRestoreAccount}
                                    disabled={isRestoring}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-paymint-green hover:bg-emerald-500 text-black rounded-xl text-sm font-black transition-all shadow-lg shadow-paymint-green/20 disabled:opacity-70"
                                >
                                    {isRestoring ? (
                                        <>
                                            <RefreshCw size={18} className="animate-spin" />
                                            Restoring...
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw size={18} />
                                            Restore My Account
                                        </>
                                    )}
                                </button>
                            ) : (
                                <button
                                    onClick={handleDeleteClick}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-red-500/20"
                                >
                                    <Trash2 size={18} />
                                    Delete Account
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
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        No establishments or brands yet
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto">
                        Create your first establishment to start managing your business with PayMint.
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
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
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
                                <h3 className="text-xl font-black text-gray-900 dark:text-white">
                                    Delete Account
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
                                    <p className="text-gray-900 dark:text-white font-bold mb-1">Why are you leaving?</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Your feedback helps us improve PayMint.</p>
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
                                            {reason}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setDeleteStep(2)}
                                    disabled={!deleteReason}
                                    className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-black rounded-2xl text-sm font-black disabled:opacity-50 transition-all"
                                >
                                    Continue
                                </button>
                            </div>
                        )}

                        {deleteStep === 2 && (
                            <div className="space-y-6">
                                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                                        This action is permanent and will delete all your establishments, brands, and history.
                                    </p>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                        Type <span className="text-red-500 font-black">DELETE</span> to confirm
                                    </label>
                                    <input
                                        type="text"
                                        value={deleteConfirmationText}
                                        onChange={(e) => setDeleteConfirmationText(e.target.value)}
                                        placeholder="Type Delete"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0F172A] border border-gray-200 dark:border-white/[0.1] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setDeleteStep(1)}
                                        className="flex-1 py-4 bg-gray-100 dark:bg-white/[0.05] text-gray-600 dark:text-gray-300 rounded-2xl text-sm font-bold"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={() => setDeleteStep(3)}
                                        disabled={deleteConfirmationText !== 'DELETE'}
                                        className="flex-1 py-4 bg-red-500 text-white rounded-2xl text-sm font-black disabled:opacity-50 transition-all"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}

                        {deleteStep === 3 && (
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                        <Lock size={14} />
                                        Confirm Password
                                    </label>
                                    <input
                                        type="password"
                                        value={deletePassword}
                                        onChange={(e) => setDeletePassword(e.target.value)}
                                        placeholder="Enter your password"
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
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                Deleting Account...
                                            </>
                                        ) : (
                                            'Permanently Delete Account'
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setDeleteStep(2)}
                                        disabled={isDeletingAccount}
                                        className="w-full px-6 py-4 bg-gray-100 dark:bg-white/[0.05] hover:bg-gray-200 dark:hover:bg-white/[0.1] text-gray-600 dark:text-gray-300 rounded-2xl text-sm font-bold transition-all"
                                    >
                                        Back
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
            {/* Active Establishments Block Modal */}
            <AnimatePresence>
                {showActiveEstBlockModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
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
                                    <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight">
                                        Cannot Delete Account Yet
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        Action Required
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                                    You still have <span className="font-bold text-gray-900 dark:text-white">{activeBlockingEsts.length} active establishment{activeBlockingEsts.length !== 1 ? 's' : ''}</span>. Please cancel or delete them first to proceed with account deletion.
                                </p>

                                <div className="bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/[0.05] overflow-hidden">
                                    <div className="px-4 py-3 border-b border-gray-100 dark:border-white/[0.05] bg-gray-100/50 dark:bg-white/[0.02]">
                                        <p className="text-[10px] font-bold text-gray-400 tracking-widest">Active Establishments</p>
                                    </div>
                                    <div className="max-h-40 overflow-y-auto p-2 space-y-1">
                                        {activeBlockingEsts.map((est) => (
                                            <div key={est.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white dark:hover:bg-white/[0.05] transition-colors">
                                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                                                    <Store className="w-4 h-4 text-blue-500" />
                                                </div>
                                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">
                                                    {est.name}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={() => navigate('/owner/establishments')}
                                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-paymint-green hover:bg-emerald-500 text-black rounded-2xl text-sm font-black transition-all shadow-lg shadow-paymint-green/20"
                                    >
                                        <Store size={18} />
                                        Go to Establishments
                                    </button>
                                    <button
                                        onClick={() => setShowActiveEstBlockModal(false)}
                                        className="w-full px-6 py-4 bg-gray-100 dark:bg-white/[0.05] hover:bg-gray-200 dark:hover:bg-white/[0.1] text-gray-600 dark:text-gray-300 rounded-2xl text-sm font-bold transition-all"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
