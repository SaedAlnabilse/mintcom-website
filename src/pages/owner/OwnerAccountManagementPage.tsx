import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
    const { account, establishments } = useAuth();
    const [accountDetails, setAccountDetails] = useState<AccountDetails | null>(null);
    const [brands, setBrands] = useState<BrandCredential[]>([]);
    const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
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

    useEffect(() => {
        fetchAccountData();
    }, []);

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
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[10px] font-bold uppercase tracking-widest text-emerald-500">
                        <CheckCircle2 size={12} />
                        Active
                    </span>
                );
            case 'TRIAL':
            case 'TRIALING':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[10px] font-bold uppercase tracking-widest text-blue-500">
                        <Zap size={12} />
                        Trial
                    </span>
                );
            case 'PAST_DUE':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 border border-red-500/20 rounded-lg text-[10px] font-bold uppercase tracking-widest text-red-500">
                        <AlertTriangle size={12} />
                        Past Due
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-500/10 border border-gray-500/20 rounded-lg text-[10px] font-bold uppercase tracking-widest text-gray-500">
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
                <div className="bg-white dark:bg-[#111111] rounded-xl border border-gray-200 dark:border-white/[0.05] p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <Store className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">
                                {establishments?.length || 0}
                            </p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                Establishments
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#111111] rounded-xl border border-gray-200 dark:border-white/[0.05] p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-purple-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">
                                {brands.length}
                            </p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                Brands
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#111111] rounded-xl border border-gray-200 dark:border-white/[0.05] p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                            <Users className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">
                                {adminUsers.length}
                            </p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                Admin Users
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
                        className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-white/[0.05] p-6 shadow-sm"
                    >
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
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <User size={12} />
                                    Full Name
                                </label>
                                <p className="text-gray-900 dark:text-white font-semibold">
                                    {accountDetails?.firstName} {accountDetails?.lastName}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <Mail size={12} />
                                    Email
                                </label>
                                <div className="flex items-center gap-2">
                                    <p className="text-gray-900 dark:text-white font-semibold">
                                        {accountDetails?.email}
                                    </p>
                                    {accountDetails?.emailVerified && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-[9px] font-bold uppercase tracking-widest text-emerald-500">
                                            <Shield size={10} />
                                            Verified
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <Phone size={12} />
                                    Phone
                                </label>
                                <p className="text-gray-900 dark:text-white font-semibold">
                                    {accountDetails?.phone || <span className="text-gray-400 italic">Not set</span>}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
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
                    </motion.div>

                    {/* Establishments Credentials */}
                    {establishments && establishments.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-white/[0.05] p-6 shadow-sm"
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
                                        className="group relative bg-gray-50 dark:bg-white/[0.02] hover:bg-white dark:hover:bg-white/[0.05] rounded-2xl p-5 border border-gray-100 dark:border-white/[0.05] hover:border-paymint-green/30 transition-all duration-300 hover:shadow-lg hover:shadow-paymint-green/5"
                                    >
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

                                        <div className="mt-5 p-4 bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-white/[0.05] group-hover:border-paymint-green/20 transition-colors">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
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
                            className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-white/[0.05] p-6 shadow-sm"
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
                                    const establishmentCount = brand.establishmentCount || brand._count?.establishments || (brand.establishments ? brand.establishments.length : 0);

                                    return (
                                        <div
                                            key={brand.id}
                                            className="group relative bg-gray-50 dark:bg-white/[0.02] hover:bg-white dark:hover:bg-white/[0.05] rounded-2xl p-5 border border-gray-100 dark:border-white/[0.05] hover:border-purple-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/5"
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shrink-0">
                                                        <Building2 className="w-6 h-6 text-purple-500" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-base font-bold text-gray-900 dark:text-white">{brand.name}</h3>
                                                        <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                                                            <span className="font-medium bg-gray-100 dark:bg-white/[0.05] px-2 py-0.5 rounded-md border border-gray-200 dark:border-white/[0.05]">
                                                                {establishmentCount} establishment{establishmentCount !== 1 ? 's' : ''}
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

                                            <div className="mt-5 p-4 bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-white/[0.05] group-hover:border-purple-500/20 transition-colors">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
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
                                    )
                                })}
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Right Column - Security & Info */}
                <div className="space-y-6">




                    {/* Quick Tips */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="bg-gradient-to-br from-paymint-green/10 to-emerald-500/10 rounded-2xl border border-paymint-green/20 p-6"
                    >
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
                    </motion.div>
                </div>
            </div>

            {/* Empty State */}
            {(!establishments || establishments.length === 0) && brands.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-white/[0.05] p-12 shadow-sm text-center"
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
        </div>
    );
}
