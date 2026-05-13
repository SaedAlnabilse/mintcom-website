import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
    Trash2,
    AlertTriangle,
    Download,
    Mail,
    Calendar,
    Package,
    Users,
    User,
    ShoppingCart,
    Clock,
    X,
    Check,
    FileSpreadsheet,
    ChevronRight,
    Shield,
    Loader2,
    Eye,
    EyeOff,
    Lock,
} from 'lucide-react';
import api from '../config/api';
import toast from 'react-hot-toast';
import { QuickInfo } from './QuickInfo';

interface ApiError {
    response?: {
        data?: {
            message?: string;
        };
    };
}

interface EstablishmentStats {
    establishment: {
        id: string;
        name: string;
        currency: string;
        createdAt: string;
        deletionRequestedAt: string | null;
        deletionScheduledFor: string | null;
    };
    stats: {
        orders: number;
        customers: number;
        products: number;
        categories: number;
        employees: number;
        shifts: number;
        addons: number;
        rawMaterials: number;
        recipes: number;
        totalRevenue: number;
    };
    dataRange: {
        start: string | null;
        end: string | null;
        age: string;
    };
}

interface DeletionStatus {
    id: string;
    name: string;
    status: 'active' | 'pending_deletion' | 'deleted';
    deletionRequestedAt: string | null;
    deletionScheduledFor: string | null;
    deletionExportSentTo: string | null;
    canCancel: boolean;
    daysRemaining: number | null;
}

interface EstablishmentDeletionWizardProps {
    establishmentId: string;
    establishmentName: string;
    onClose: () => void;
    onDeletionRequested: () => void;
}

type WizardStep = 'warning' | 'export' | 'confirm';

export function EstablishmentDeletionWizard({
    establishmentId,
    establishmentName,
    onClose,
    onDeletionRequested,
}: EstablishmentDeletionWizardProps) {
    const { t } = useTranslation();
    const [step, setStep] = useState<WizardStep>('warning');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [stats, setStats] = useState<EstablishmentStats | null>(null);
    const [establishmentLoginId, setEstablishmentLoginId] = useState('');
    const [establishmentPassword, setEstablishmentPassword] = useState('');
    const [showEstablishmentPassword, setShowEstablishmentPassword] = useState(false);
    const [accountEmail, setAccountEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Export options
    const [exportOptions, setExportOptions] = useState({
        exportFinancial: true,
        exportCustomers: true,
        exportInventory: true,
        exportEmployees: false,
        exportShifts: false,
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setIsLoading(true);
                const response = await api.get(`/api/establishments/${establishmentId}/stats`);
                setStats(response.data);
            } catch (err) {
                toast.error((err as ApiError).response?.data?.message || t('security.deletion.loadFailed'));
                onClose();
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, [establishmentId, onClose, t]);

    const handleRequestDeletion = async () => {
        if (!establishmentLoginId) {
            toast.error(t('owner.brands.wizard.adminLoginId'));
            return;
        }

        if (establishmentPassword.length < 6) {
            toast.error(t('security.deletion.confirm.locationPassword'));
            return;
        }

        if (!accountEmail || !accountEmail.includes('@')) {
            toast.error(t('security.deletion.confirm.yourEmail'));
            return;
        }

        if (password.length < 6) {
            toast.error(t('security.deletion.confirm.yourPassword'));
            return;
        }

        try {
            setIsSubmitting(true);
            await api.post(`/api/establishments/${establishmentId}/request-deletion`, {
                ...exportOptions,
                exportFinancial: true, // Always mandatory
                establishmentLoginId,
                establishmentPassword,
                accountEmail,
                password,
            });
            toast.success(t('security.deletion.confirm.success'));
            onDeletionRequested();
            onClose();
        } catch (err) {
            toast.error((err as ApiError).response?.data?.message || t('security.deletion.confirm.fail'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDownloadExport = async (
        exportType: 'financial' | 'customers' | 'inventory' | 'employees' | 'shifts'
    ) => {
        try {
            const response = await api.get(
                `/api/establishments/${establishmentId}/export/${exportType}`,
                { responseType: 'blob' }
            );
            const blob = new Blob([response.data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${establishmentName}_${exportType}_export.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            toast.success(t('security.deletion.export.downloaded', { type: t(`security.deletion.export.${exportType}`) }));
        } catch {
            toast.error(t('security.deletion.export.fail'));
        }
    };

    if (isLoading) {
        return createPortal(
            <div className="fixed inset-0 z-[9999] popup-surface flex items-center justify-center bg-black/30 dark:bg-black/80 backdrop-blur-sm font-sans p-4">
                <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-8 border border-gray-200 dark:border-white/5 shadow-xl">
                    <div className="w-12 h-12 border-4 border-paymint-red/10 border-t-paymint-red rounded-full animate-spin mx-auto" />
                    <p className="label-strong font-outfit mt-4 text-center">{t('security.deletion.loading')}</p>
                </div>
            </div>,
            document.body
        );
    }

    return createPortal(
        <div
            dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}
            className="fixed inset-0 z-[9999] popup-surface flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/30 dark:bg-black/80 backdrop-blur-sm font-sans"
        >
            <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
                className="bg-white dark:bg-[#1E293B] w-full sm:w-[90vw] sm:max-w-2xl rounded-t-3xl sm:rounded-2xl overflow-hidden h-[92vh] sm:h-auto sm:max-h-[85vh] flex flex-col transition-colors duration-300 border border-gray-200 dark:border-white/5 relative"
            >
                {/* Mobile drag handle */}
                <div className="sm:hidden flex justify-center pt-2 pb-1">
                    <div className="w-10 h-1 bg-gray-300 dark:bg-white/20 rounded-full" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-6 sm:px-8 py-4 sm:py-5 relative isolate border-b border-gray-200 dark:border-white/10 flex-shrink-0">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-paymint-red/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 -z-10" />
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-paymint-red/10 flex items-center justify-center text-paymint-red">
                            <Trash2 size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight">
                                {t('security.deletion.title')}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{establishmentName}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm active:scale-90"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Step Indicator */}
                <div className="px-6 sm:px-8 py-4 border-b border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] flex-shrink-0">
                    <div className="flex items-center gap-2">
                        {['warning', 'export', 'confirm'].map((s, i) => (
                            <div key={s} className="flex items-center">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-colors ${step === s
                                        ? 'bg-paymint-red text-white shadow-sm'
                                        : ['warning', 'export', 'confirm'].indexOf(step) > i
                                            ? 'bg-paymint-red/20 text-paymint-red'
                                            : 'bg-gray-200 dark:bg-white/10 text-gray-400 dark:text-gray-500'
                                        }`}
                                >
                                    {i + 1}
                                </div>
                                {i < 2 && (
                                    <div
                                        className={`w-12 h-0.5 mx-2 ${['warning', 'export', 'confirm'].indexOf(step) > i
                                            ? 'bg-paymint-red/30'
                                            : 'bg-gray-200 dark:bg-white/10'
                                            }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-8 pt-6 pb-safe custom-scrollbar">
                    <AnimatePresence mode="wait">
                        {/* Step 1: Warning */}
                        {step === 'warning' && (
                            <motion.div
                                key="warning"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="bg-paymint-red/10 dark:bg-paymint-red/10 border border-red-200 dark:border-paymint-red/20 rounded-2xl p-4">
                                    <div className="flex items-center gap-3">
                                        <AlertTriangle className="text-paymint-red flex-shrink-0" size={20} />
                                        <div>
                                            <h3 className="font-bold text-red-700 dark:text-paymint-red leading-none">
                                                {t('security.deletion.warning.title')}
                                            </h3>
                                            <p className="text-paymint-red dark:text-red-300 text-sm mt-1.5 leading-none">
                                                {t('security.deletion.warning.subtitle')}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4 px-1">
                                        {t('security.deletion.warning.summary')}
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <StatCard
                                            icon={ShoppingCart}
                                            label={t('dashboard.stats.totalOrders')}
                                            value={stats?.stats.orders || 0}
                                        />
                                        <StatCard
                                            icon={User}
                                            label={t('dashboard.menu.customers')}
                                            value={stats?.stats.customers || 0}
                                        />
                                        <StatCard
                                            icon={Package}
                                            label={t('dashboard.menu.products')}
                                            value={stats?.stats.products || 0}
                                        />
                                        <StatCard
                                            icon={Users}
                                            label={t('dashboard.menu.team')}
                                            value={stats?.stats.employees || 0}
                                        />
                                    </div>
                                </div>

                                {stats?.dataRange.age && stats.dataRange.age !== t('common.noData') && (
                                    <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4">
                                        <div className="flex items-center gap-3">
                                            <Clock className="text-amber-500" size={20} />
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className="font-bold text-amber-700 dark:text-amber-400">
                                                    {stats.dataRange.age.trim()}
                                                </span>
                                                <span className="text-amber-600 dark:text-amber-300 text-sm">
                                                    {t('owner.overview.managed')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Step 2: Export Options */}
                        {step === 'export' && (
                            <motion.div
                                key="export"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-2xl p-4">
                                    <div className="flex items-center gap-3">
                                        <Mail className="text-blue-500 flex-shrink-0" size={20} />
                                        <div>
                                            <h3 className="font-bold text-blue-700 dark:text-blue-400 leading-none">
                                                {t('security.deletion.export.title')}
                                            </h3>
                                            <p className="text-blue-600 dark:text-blue-300 text-sm mt-1.5 leading-none">
                                                {t('security.deletion.export.subtitle')}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <ExportOption
                                        label={t('security.deletion.export.financial')}
                                        description={t('security.deletion.export.financialDesc')}
                                        checked={true}
                                        onChange={() => {}}
                                        disabled={true}
                                        onDownload={() => handleDownloadExport('financial')}
                                        count={stats?.stats.orders || 0}
                                        countLabel={t('dashboard.stats.totalOrders')}
                                    />
                                    <ExportOption
                                        label={t('security.deletion.export.customers')}
                                        description={t('security.deletion.export.customersDesc')}
                                        checked={exportOptions.exportCustomers}
                                        onChange={(v) => setExportOptions({ ...exportOptions, exportCustomers: v })}
                                        onDownload={() => handleDownloadExport('customers')}
                                        count={stats?.stats.customers || 0}
                                        countLabel={t('dashboard.menu.customers')}
                                    />
                                    <ExportOption
                                        label={t('security.deletion.export.inventory')}
                                        description={t('security.deletion.export.inventoryDesc')}
                                        checked={exportOptions.exportInventory}
                                        onChange={(v) => setExportOptions({ ...exportOptions, exportInventory: v })}
                                        onDownload={() => handleDownloadExport('inventory')}
                                        count={stats?.stats.products || 0}
                                        countLabel={t('dashboard.menu.products')}
                                    />
                                    <ExportOption
                                        label={t('security.deletion.export.staff')}
                                        description={t('security.deletion.export.staffDesc')}
                                        checked={exportOptions.exportEmployees}
                                        onChange={(v) => setExportOptions({ ...exportOptions, exportEmployees: v })}
                                        onDownload={() => handleDownloadExport('employees')}
                                        count={stats?.stats.employees || 0}
                                        countLabel={t('dashboard.menu.team')}
                                    />
                                    <ExportOption
                                        label={t('security.deletion.export.shifts')}
                                        description={t('security.deletion.export.shiftsDesc')}
                                        checked={exportOptions.exportShifts}
                                        onChange={(v) => setExportOptions({ ...exportOptions, exportShifts: v })}
                                        onDownload={() => handleDownloadExport('shifts')}
                                        count={stats?.stats.shifts || 0}
                                        countLabel={t('dashboard.menu.shiftsReports')}
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* Step 3: Confirmation */}
                        {step === 'confirm' && (
                            <motion.div
                                key="confirm"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 rounded-2xl p-4">
                                    <div className="flex items-start gap-3">
                                        <Calendar className="text-purple-500 flex-shrink-0 mt-0.5" size={20} />
                                        <div>
                                            <h3 className="font-bold text-purple-700 dark:text-purple-400">
                                                {t('security.deletion.confirm.gracePeriod')}
                                            </h3>
                                            <p className="text-purple-600 dark:text-purple-300 text-sm mt-1">
                                                {t('security.deletion.confirm.gracePeriodDesc')}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-100 dark:bg-white/5 rounded-2xl p-6 text-center">
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
                                        {t('security.deletion.confirm.deletionDate')}
                                    </p>
                                    <p className="text-2xl font-bold text-paymint-red">
                                        {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(t('common.locale') === 'ar' ? 'ar-EG' : 'en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-normal text-gray-900 dark:text-white tracking-tight mb-2 flex items-center">
                                        {t('security.deletion.confirm.locationId')}
                                        <QuickInfo text={t('security.deletion.confirm.locationIdTip')} />
                                    </label>
                                    <input maxLength={255}
                                        type="text"
                                        value={establishmentLoginId}
                                        onChange={(e) => setEstablishmentLoginId(e.target.value)}
                                        className="w-full px-4 py-3 bg-white dark:bg-[#2a2a2a] border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white font-medium focus:outline-none focus:border-paymint-red transition-colors"
                                    />
                                </div>

                                {/* Establishment Password */}
                                <div>
                                    <label className="block text-sm font-normal text-gray-900 dark:text-white tracking-tight mb-2 flex items-center gap-2">
                                        <div className="flex items-center gap-2">
                                            <Lock size={14} className="text-paymint-red" />
                                            {t('security.deletion.confirm.locationPassword')}
                                        </div>
                                    </label>
                                    <div className="relative">
                                        <input maxLength={255}
                                            type={showEstablishmentPassword ? 'text' : 'password'}
                                            value={establishmentPassword}
                                            onChange={(e) => setEstablishmentPassword(e.target.value)}
                                            className="w-full px-4 py-3 pr-12 bg-white dark:bg-[#2a2a2a] border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white font-medium focus:outline-none focus:border-paymint-red transition-colors"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowEstablishmentPassword(!showEstablishmentPassword)}
                                            className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                        >
                                            {showEstablishmentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Account Email */}
                                <div>
                                    <label className="block text-sm font-normal text-gray-900 dark:text-white tracking-tight mb-2 flex items-center gap-2">
                                        <div className="flex items-center gap-2">
                                            <Mail size={14} className="text-paymint-red" />
                                            {t('security.deletion.confirm.yourEmail')}
                                        </div>
                                    </label>
                                    <input maxLength={255}
                                        type="email"
                                        value={accountEmail}
                                        onChange={(e) => setAccountEmail(e.target.value)}
                                        className="w-full px-4 py-3 bg-white dark:bg-[#2a2a2a] border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white font-medium focus:outline-none focus:border-paymint-red transition-colors"
                                    />
                                </div>

                                {/* Password Input */}
                                <div>
                                    <label className="block text-sm font-normal text-gray-900 dark:text-white tracking-tight mb-2 flex items-center gap-2">
                                        <div className="flex items-center gap-2">
                                            <Lock size={14} className="text-paymint-red" />
                                            {t('security.deletion.confirm.yourPassword')}
                                        </div>
                                        <QuickInfo text={t('security.deletion.confirm.confirmYou')} />
                                    </label>
                                    <div className="relative">
                                        <input maxLength={255}
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className={`w-full px-4 py-3 pr-12 bg-white dark:bg-[#2a2a2a] border rounded-xl text-gray-900 dark:text-white font-medium focus:outline-none transition-colors ${password.length >= 6
                                                ? 'border-paymint-green focus:border-paymint-green'
                                                : 'border-gray-300 dark:border-gray-700 focus:border-paymint-red'
                                                }`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    {password.length >= 6 && (
                                        <p className="text-paymint-green text-sm mt-2 flex items-center gap-1">
                                            <Check size={14} /> {t('security.deletion.confirm.passwordEntered')}
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-white/5 flex gap-3">
                    {step !== 'warning' && (
                        <button
                            onClick={() =>
                                setStep(step === 'confirm' ? 'export' : 'warning')
                            }
                            className="px-6 py-3 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                        >
                            {t('common.back')}
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-100 dark:hover:bg-white/10 transition-colors ml-auto"
                    >
                        {t('common.cancel')}
                    </button>
                    {step !== 'confirm' ? (
                        <button
                            onClick={() =>
                                setStep(step === 'warning' ? 'export' : 'confirm')
                            }
                            className="px-6 py-3 bg-paymint-red text-white rounded-xl font-bold hover:bg-paymint-red transition-colors flex items-center gap-2"
                        >
                            {t('common.continue')}
                            <ChevronRight size={18} />
                        </button>
                    ) : (
                        <button
                            onClick={handleRequestDeletion}
                            disabled={
                                !establishmentLoginId ||
                                establishmentPassword.length < 6 ||
                                !accountEmail ||
                                password.length < 6 ||
                                isSubmitting
                            }
                            className="px-6 py-3 bg-paymint-red text-white rounded-xl font-bold hover:bg-paymint-red transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    {t('security.deletion.confirm.processing')}
                                </>
                            ) : (
                                <>
                                    <Trash2 size={18} />
                                    {t('security.deletion.confirm.button')}
                                </>
                            )}
                        </button>
                    )}
                </div>
            </motion.div>
        </div>,
        document.body
    );
}

// Helper Components
function StatCard({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ElementType;
    label: string;
    value: number;
}) {
    const { t } = useTranslation();
    return (
        <div className="bg-gray-100 dark:bg-white/5 rounded-xl p-4 text-center">
            <Icon size={20} className="text-paymint-red mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white tracking-tighter">
                {value.toLocaleString(t('common.locale') === 'ar' ? 'ar-EG' : 'en-US')}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-black tracking-widest mt-1">
                {label}
            </div>
        </div>
    );
}

function ExportOption({
    label,
    description,
    checked,
    onChange,
    onDownload,
    count,
    countLabel,
    disabled = false,
}: {
    label: string;
    description: string;
    checked: boolean;
    onChange: (v: boolean) => void;
    onDownload: () => void;
    count: number;
    countLabel: string;
    disabled?: boolean;
}) {
    const { t } = useTranslation();
    return (
        <div className={`rounded-xl p-4 flex items-center gap-4 ${disabled ? 'bg-gray-50 dark:bg-white/5 opacity-80' : 'bg-gray-100 dark:bg-white/5'}`}>
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => !disabled && onChange(e.target.checked)}
                disabled={disabled}
                className={`w-5 h-5 rounded border-gray-300 text-paymint-green focus:ring-paymint-green ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
            />
            <FileSpreadsheet size={20} className="text-gray-400" />
            <div className="flex-1">
                <div className="font-bold text-gray-900 dark:text-white text-sm">{label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{description}</div>
            </div>
            <div className="text-right">
                <div className="text-sm font-bold text-gray-900 dark:text-white">
                    {count.toLocaleString(t('common.locale') === 'ar' ? 'ar-EG' : 'en-US')}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{countLabel}</div>
            </div>
            <button
                onClick={onDownload}
                className="p-2 bg-white dark:bg-white/10 rounded-lg hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                title={t('security.deletion.export.download')}
            >
                <Download size={16} className="text-gray-600 dark:text-gray-300" />
            </button>
        </div>
    );
}

// Pending Deletion Banner Component
interface PendingDeletionBannerProps {
    deletionStatus: DeletionStatus;
    onCancelDeletion: () => void;
    isCancelling: boolean;
}

export function PendingDeletionBanner({
    deletionStatus,
    onCancelDeletion,
    isCancelling,
}: PendingDeletionBannerProps) {
    const { t } = useTranslation();
    if (deletionStatus.status !== 'pending_deletion') return null;

    const scheduledDate = deletionStatus.deletionScheduledFor
        ? new Date(deletionStatus.deletionScheduledFor).toLocaleDateString(t('common.locale') === 'ar' ? 'ar-EG' : 'en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
        : t('common.unknown');

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-paymint-red to-paymint-red rounded-2xl p-6 text-white mb-8"
        >
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                        <AlertTriangle size={28} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">{t('security.deletion.banner.title')}</h3>
                        <p className="text-white/80 text-sm">
                            {t('security.deletion.banner.desc', { date: scheduledDate })}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-center">
                        <div className="text-2xl sm:text-3xl font-bold">{(deletionStatus.daysRemaining || 0).toLocaleString(t('common.locale'))}</div>
                        <div className="text-xs text-white/80">{t('security.deletion.banner.daysLeft')}</div>
                    </div>
                    <button
                        onClick={onCancelDeletion}
                        disabled={isCancelling}
                        className="px-6 py-3 bg-white text-paymint-red font-bold rounded-xl hover:bg-white/90 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {isCancelling ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                {t('security.deletion.banner.cancelling')}
                            </>
                        ) : (
                            <>
                                <Shield size={18} />
                                {t('security.deletion.banner.cancel')}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

