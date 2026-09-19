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
import { Modal, ModalCloseButton } from './ui';
import { StepUpVerifier } from './StepUpVerifier';
import { reauthHeaders } from '../services/stepUp';
import { StatValue } from './ui/StatValue';

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
    status: 'active' | 'pending_deletion' | 'deleting' | 'deleted';
    reason?: string | null;
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
    onDeletionRequested: () => void | Promise<void>;
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

    /**
     * Runs once StepUpVerifier has produced a single-use reauth token. That
     * proof replaces the owner password; the location credential below is a
     * separate factor and is still sent and checked.
     */
    const handleRequestDeletion = async (reauthToken: string) => {
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

        try {
            setIsSubmitting(true);
            await api.post(
                `/api/establishments/${establishmentId}/request-deletion`,
                {
                    ...exportOptions,
                    exportFinancial: true, // Always mandatory
                    establishmentLoginId,
                    establishmentPassword,
                    accountEmail,
                },
                { headers: reauthHeaders(reauthToken) },
            );
            toast.success(t('security.deletion.confirm.success'));
            try {
                await onDeletionRequested();
            } catch (refreshError) {
                // The destructive request already succeeded. A follow-up UI
                // refresh must never turn that into a false "deletion failed"
                // message or encourage the owner to submit it again.
                console.error('Deletion scheduled, but recovery state refresh failed:', refreshError);
            }
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
                <div className="bg-white dark:bg-zinc-900/60 rounded-2xl p-8 border border-stone-200 dark:border-zinc-800 shadow-xl">
                    <div className="w-12 h-12 border-4 border-mintcom-red/10 border-t-mintcom-red rounded-full animate-spin mx-auto" />
                    <p className="label-strong font-sans mt-4 text-center">{t('security.deletion.loading')}</p>
                </div>
            </div>,
            document.body
        );
    }

    return (
        <Modal isOpen={true} onClose={onClose} size="xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 sm:px-8 py-4 sm:py-5 relative isolate border-b border-stone-200 dark:border-zinc-800 flex-shrink-0">
                <div className="absolute top-0 right-0 w-48 h-48 bg-mintcom-red/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 -z-10" />
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-mintcom-red/10 flex items-center justify-center text-mintcom-red">
                        <Trash2 size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-stone-900 dark:text-zinc-100 tracking-tight leading-tight">
                            {t('security.deletion.title')}
                        </h2>
                        <p className="text-sm text-stone-500 dark:text-zinc-400">{establishmentName}</p>
                    </div>
                </div>
                <ModalCloseButton onClose={onClose} />
            </div>

            {/* Step Indicator */}
            <div className="px-6 sm:px-8 py-4 border-b border-stone-200 dark:border-zinc-800 bg-stone-50/50 dark:bg-zinc-800/40 flex-shrink-0">
                <div className="flex items-center gap-2">
                    {['warning', 'export', 'confirm'].map((s, i) => (
                        <div key={s} className="flex items-center">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-colors ${step === s
                                    ? 'bg-mintcom-red text-white shadow-sm'
                                    : ['warning', 'export', 'confirm'].indexOf(step) > i
                                        ? 'bg-mintcom-red/20 text-mintcom-red'
                                        : 'bg-stone-200 dark:bg-zinc-800 text-stone-400 dark:text-zinc-500'
                                    }`}
                            >
                                {i + 1}
                            </div>
                            {i < 2 && (
                                <div
                                    className={`w-12 h-0.5 mx-2 ${['warning', 'export', 'confirm'].indexOf(step) > i
                                        ? 'bg-mintcom-red/30'
                                        : 'bg-stone-200 dark:bg-zinc-800'
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
                            <div className="bg-mintcom-red/10 dark:bg-mintcom-red/10 border border-red-200 dark:border-mintcom-red/20 rounded-2xl p-4">
                                <div className="flex items-center gap-3">
                                    <AlertTriangle className="text-mintcom-red flex-shrink-0" size={20} />
                                    <div>
                                        <h3 className="font-bold text-red-700 dark:text-mintcom-red leading-none">
                                            {t('security.deletion.warning.title')}
                                        </h3>
                                        <p className="text-mintcom-red dark:text-red-300 text-sm mt-1.5 leading-none">
                                            {t('security.deletion.warning.subtitle')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-stone-500 dark:text-zinc-400 mb-4 px-1">
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
                            <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-2xl p-4">
                                <div className="flex items-start gap-3">
                                    <Calendar className="text-blue-500 flex-shrink-0 mt-0.5" size={20} />
                                    <div>
                                        <h3 className="font-bold text-blue-700 dark:text-blue-400">
                                            {t('security.deletion.confirm.gracePeriod')}
                                        </h3>
                                        <p className="text-blue-600 dark:text-blue-300 text-sm mt-1">
                                            {t('security.deletion.confirm.gracePeriodDesc')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-stone-100 dark:bg-zinc-800 rounded-2xl p-6 text-center">
                                <p className="text-stone-500 dark:text-zinc-400 text-sm mb-2">
                                    {t('security.deletion.confirm.deletionDate')}
                                </p>
                                <p className="text-2xl font-bold text-mintcom-red">
                                    {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(t('common.locale') === 'ar' ? 'ar-EG' : 'en-US', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-normal text-stone-900 dark:text-zinc-100 tracking-tight mb-2 flex items-center">
                                    {t('security.deletion.confirm.locationId')}
                                    <QuickInfo text={t('security.deletion.confirm.locationIdTip')} />
                                </label>
                                <input maxLength={255}
                                    type="text"
                                    value={establishmentLoginId}
                                    onChange={(e) => setEstablishmentLoginId(e.target.value)}
                                    className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-stone-300 dark:border-zinc-700 rounded-xl text-stone-900 dark:text-zinc-100 font-medium focus:outline-none focus:border-mintcom-red transition-colors"
                                />
                            </div>

                            {/* Establishment Password */}
                            <div>
                                <label className="block text-sm font-normal text-stone-900 dark:text-zinc-100 tracking-tight mb-2 flex items-center gap-2">
                                    <div className="flex items-center gap-2">
                                        <Lock size={14} className="text-mintcom-red" />
                                        {t('security.deletion.confirm.locationPassword')}
                                    </div>
                                </label>
                                <div className="relative">
                                    <input maxLength={255}
                                        type={showEstablishmentPassword ? 'text' : 'password'}
                                        value={establishmentPassword}
                                        onChange={(e) => setEstablishmentPassword(e.target.value)}
                                        className="w-full px-4 py-3 pr-12 bg-white dark:bg-zinc-800 border border-stone-300 dark:border-zinc-700 rounded-xl text-stone-900 dark:text-zinc-100 font-medium focus:outline-none focus:border-mintcom-red transition-colors"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowEstablishmentPassword(!showEstablishmentPassword)}
                                        className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600 dark:hover:text-zinc-300"
                                    >
                                        {showEstablishmentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Account Email */}
                            <div>
                                <label className="block text-sm font-normal text-stone-900 dark:text-zinc-100 tracking-tight mb-2 flex items-center gap-2">
                                    <div className="flex items-center gap-2">
                                        <Mail size={14} className="text-mintcom-red" />
                                        {t('security.deletion.confirm.yourEmail')}
                                    </div>
                                </label>
                                <input maxLength={255}
                                    type="email"
                                    value={accountEmail}
                                    onChange={(e) => setAccountEmail(e.target.value)}
                                    className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-stone-300 dark:border-zinc-700 rounded-xl text-stone-900 dark:text-zinc-100 font-medium focus:outline-none focus:border-mintcom-red transition-colors"
                                />
                            </div>

                            {/* Owner identity */}
                            <div>
                                <label className="block text-sm font-normal text-stone-900 dark:text-zinc-100 tracking-tight mb-2 flex items-center gap-2">
                                    <div className="flex items-center gap-2">
                                        <Lock size={14} className="text-mintcom-red" />
                                        {t('security.deletion.confirm.yourPassword')}
                                    </div>
                                    <QuickInfo text={t('security.deletion.confirm.confirmYou')} />
                                </label>
                                <StepUpVerifier
                                    action="request-establishment-deletion"
                                    targetId={establishmentId}
                                    onVerified={handleRequestDeletion}
                                    onError={(message) => toast.error(message)}
                                    submitLabel={t('security.deletion.confirm.button')}
                                    disabled={isSubmitting}
                                    canSubmit={
                                        !!establishmentLoginId &&
                                        establishmentPassword.length >= 6 &&
                                        !!accountEmail &&
                                        accountEmail.includes('@')
                                    }
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-stone-200 dark:border-zinc-800 flex gap-3">
                {step !== 'warning' && (
                    <button
                        onClick={() =>
                            setStep(step === 'confirm' ? 'export' : 'warning')
                        }
                        className="px-6 py-3 bg-stone-50 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 rounded-xl font-bold hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        {t('common.back')}
                    </button>
                )}
                <button
                    onClick={onClose}
                    className="px-6 py-3 bg-stone-50 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 rounded-xl font-bold hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors ml-auto"
                >
                    {t('common.cancel')}
                </button>
                {step !== 'confirm' ? (
                    <button
                        onClick={() =>
                            setStep(step === 'warning' ? 'export' : 'confirm')
                        }
                        className="px-6 py-3 bg-mintcom-red text-white rounded-xl font-bold hover:bg-mintcom-red transition-colors flex items-center gap-2"
                    >
                        {t('common.continue')}
                        <ChevronRight size={18} />
                    </button>
                ) : (
                    // The confirm action lives inside StepUpVerifier, which only
                    // enables it once the owner has proven presence.
                    isSubmitting && (
                        <span className="px-6 py-3 text-mintcom-red font-bold flex items-center gap-2">
                            <Loader2 size={18} className="animate-spin" />
                            {t('security.deletion.confirm.processing')}
                        </span>
                    )
                )}
            </div>
        </Modal>
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
    return (
        <div className="bg-stone-100 dark:bg-zinc-800 rounded-xl p-4 text-center">
            <Icon size={20} className="text-mintcom-red mx-auto mb-2" />
            <StatValue value={value} isInteger={true} className="text-2xl" containerClassName="justify-center" />
            <div className="text-xs text-stone-500 dark:text-zinc-400 font-black tracking-widest mt-1">
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
        <div className={`rounded-xl p-4 flex items-center gap-4 ${disabled ? 'bg-stone-50 dark:bg-zinc-800 opacity-80' : 'bg-stone-100 dark:bg-zinc-800'}`}>
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => !disabled && onChange(e.target.checked)}
                disabled={disabled}
                className={`w-5 h-5 rounded border-stone-300 text-mintcom-green focus:ring-mintcom-green ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
            />
            <FileSpreadsheet size={20} className="text-stone-400" />
            <div className="flex-1">
                <div className="font-bold text-stone-900 dark:text-zinc-100 text-sm">{label}</div>
                <div className="text-xs text-stone-500 dark:text-zinc-400">{description}</div>
            </div>
            <div className="text-right">
                <StatValue value={count} isInteger={true} className="text-sm" containerClassName="justify-end" />
                <div className="text-xs text-stone-500 dark:text-zinc-400">{countLabel}</div>
            </div>
            <button
                onClick={onDownload}
                className="p-2 bg-white dark:bg-zinc-800 rounded-lg hover:bg-stone-200 dark:hover:bg-zinc-800 transition-colors"
                title={t('security.deletion.export.download')}
            >
                <Download size={16} className="text-stone-600 dark:text-zinc-300" />
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
    if (!['pending_deletion', 'deleting'].includes(deletionStatus.status)) return null;

    const isDeleting = deletionStatus.status === 'deleting';
    const reason = (deletionStatus.reason || '').toUpperCase();
    const isAccountDeletion = reason === 'ACCOUNT_PENDING_DELETION';
    const isBillingDeletion = [
        'SUBSCRIPTION_CANCELED',
        'PAYMENT_PAST_DUE',
        'TRIAL_EXPIRED',
        'NO_PAYMENT_METHOD',
    ].includes(reason);

    const handleRecoveryAction = () => {
        if (deletionStatus.canCancel) {
            onCancelDeletion();
        } else if (isAccountDeletion) {
            window.location.href = '/account-restore';
        } else if (isBillingDeletion) {
            window.location.href = '/owner/billing';
        }
    };

    const actionLabel = isDeleting
        ? t('security.deletion.banner.deleting')
        : deletionStatus.canCancel
          ? t('security.deletion.banner.cancel')
          : isAccountDeletion
            ? t('security.deletion.banner.restoreAccount')
            : isBillingDeletion
              ? t('security.deletion.banner.reactivateSubscription')
              : t('security.deletion.banner.cannotCancelAction');

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
            className="bg-gradient-to-r from-mintcom-red to-mintcom-red rounded-2xl p-6 text-white mb-8"
        >
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                        <AlertTriangle size={28} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">{t('security.deletion.banner.title')}</h3>
                        <p className="text-zinc-300 text-sm">
                            {t('security.deletion.banner.desc', { date: scheduledDate })}
                        </p>
                        {!deletionStatus.canCancel && (
                            <p className="mt-2 text-xs font-bold text-white">
                                {isDeleting
                                    ? t('security.deletion.banner.deletingMessage')
                                    : t('security.deletion.banner.cannotCancel')}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-center">
                        <StatValue value={deletionStatus.daysRemaining || 0} isInteger={true} className="text-2xl sm:text-3xl text-white" containerClassName="justify-center" />
                        <div className="text-xs text-zinc-300">{t('security.deletion.banner.daysLeft')}</div>
                    </div>
                    <button
                        onClick={handleRecoveryAction}
                        disabled={
                            isCancelling ||
                            isDeleting ||
                            (!deletionStatus.canCancel && !isAccountDeletion && !isBillingDeletion)
                        }
                        className="px-6 py-3 bg-white text-mintcom-red font-bold rounded-xl hover:bg-white/90 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {isCancelling ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                {t('security.deletion.banner.cancelling')}
                            </>
                        ) : (
                            <>
                                <Shield size={18} />
                                {actionLabel}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
