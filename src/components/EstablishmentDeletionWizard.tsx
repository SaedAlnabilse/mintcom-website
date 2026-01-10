import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trash2,
    AlertTriangle,
    Download,
    Mail,
    Calendar,
    Package,
    Users,
    ShoppingCart,
    Clock,
    X,
    Check,
    FileSpreadsheet,
    ChevronRight,
    Shield,
    Loader2,
} from 'lucide-react';
import api from '../config/api';
import toast from 'react-hot-toast';

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
    const [step, setStep] = useState<WizardStep>('warning');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [stats, setStats] = useState<EstablishmentStats | null>(null);
    const [confirmationName, setConfirmationName] = useState('');

    // Export options
    const [exportOptions, setExportOptions] = useState({
        exportFinancial: true,
        exportCustomers: true,
        exportInventory: true,
        exportEmployees: false,
        exportShifts: false,
    });

    useEffect(() => {
        fetchStats();
    }, [establishmentId]);

    const fetchStats = async () => {
        try {
            setIsLoading(true);
            const response = await api.get(`/api/establishments/${establishmentId}/stats`);
            setStats(response.data);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to load establishment data');
            onClose();
        } finally {
            setIsLoading(false);
        }
    };

    const handleRequestDeletion = async () => {
        if (confirmationName.toLowerCase() !== establishmentName.toLowerCase()) {
            toast.error('Please type the exact establishment name to confirm');
            return;
        }

        try {
            setIsSubmitting(true);
            await api.post(`/api/establishments/${establishmentId}/request-deletion`, {
                ...exportOptions,
                confirmationName,
            });
            toast.success('Deletion scheduled. Check your email for data exports.');
            onDeletionRequested();
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to request deletion');
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
            toast.success(`${exportType} export downloaded`);
        } catch (err: any) {
            toast.error('Failed to download export');
        }
    };

    if (isLoading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl p-8 shadow-2xl">
                    <div className="w-12 h-12 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin mx-auto" />
                    <p className="text-gray-500 dark:text-gray-400 mt-4 text-center">Loading establishment data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-xl transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                            <Trash2 size={28} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black">Delete Establishment</h2>
                            <p className="text-white/80 text-sm">{establishmentName}</p>
                        </div>
                    </div>

                    {/* Step Indicator */}
                    <div className="flex items-center gap-2 mt-6">
                        {['warning', 'export', 'confirm'].map((s, i) => (
                            <div key={s} className="flex items-center">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step === s
                                        ? 'bg-white text-red-500'
                                        : ['warning', 'export', 'confirm'].indexOf(step) > i
                                            ? 'bg-white/30 text-white'
                                            : 'bg-white/10 text-white/50'
                                        }`}
                                >
                                    {i + 1}
                                </div>
                                {i < 2 && (
                                    <div
                                        className={`w-12 h-0.5 mx-1 ${['warning', 'export', 'confirm'].indexOf(step) > i
                                            ? 'bg-white/30'
                                            : 'bg-white/10'
                                            }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
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
                                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl p-4">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                                        <div>
                                            <h3 className="font-bold text-red-700 dark:text-red-400">
                                                This action is irreversible
                                            </h3>
                                            <p className="text-red-600 dark:text-red-300 text-sm mt-1">
                                                After the 30-day grace period, all data will be permanently deleted.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <Package size={18} className="text-red-500" />
                                        Data that will be deleted
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <StatCard
                                            icon={ShoppingCart}
                                            label="Orders"
                                            value={stats?.stats.orders || 0}
                                        />
                                        <StatCard
                                            icon={Users}
                                            label="Customers"
                                            value={stats?.stats.customers || 0}
                                        />
                                        <StatCard
                                            icon={Package}
                                            label="Products"
                                            value={stats?.stats.products || 0}
                                        />
                                        <StatCard
                                            icon={Users}
                                            label="Employees"
                                            value={stats?.stats.employees || 0}
                                        />
                                    </div>
                                </div>

                                {stats?.dataRange.age && stats.dataRange.age !== 'No data' && (
                                    <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4">
                                        <div className="flex items-center gap-3">
                                            <Clock className="text-amber-500" size={20} />
                                            <div>
                                                <span className="font-bold text-amber-700 dark:text-amber-400">
                                                    {stats.dataRange.age}
                                                </span>
                                                <span className="text-amber-600 dark:text-amber-300 text-sm ml-2">
                                                    of business data
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
                                    <div className="flex items-start gap-3">
                                        <Mail className="text-blue-500 flex-shrink-0 mt-0.5" size={20} />
                                        <div>
                                            <h3 className="font-bold text-blue-700 dark:text-blue-400">
                                                Export your data before deletion
                                            </h3>
                                            <p className="text-blue-600 dark:text-blue-300 text-sm mt-1">
                                                Selected exports will be sent to your email as CSV files.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <ExportOption
                                        label="Financial Report"
                                        description="All orders, revenue, tax summary"
                                        checked={exportOptions.exportFinancial}
                                        onChange={(v) => setExportOptions({ ...exportOptions, exportFinancial: v })}
                                        onDownload={() => handleDownloadExport('financial')}
                                        count={stats?.stats.orders || 0}
                                        countLabel="orders"
                                    />
                                    <ExportOption
                                        label="Customer Data"
                                        description="Names, points, contact info"
                                        checked={exportOptions.exportCustomers}
                                        onChange={(v) => setExportOptions({ ...exportOptions, exportCustomers: v })}
                                        onDownload={() => handleDownloadExport('customers')}
                                        count={stats?.stats.customers || 0}
                                        countLabel="customers"
                                    />
                                    <ExportOption
                                        label="Product Catalog"
                                        description="Items, categories, recipes"
                                        checked={exportOptions.exportInventory}
                                        onChange={(v) => setExportOptions({ ...exportOptions, exportInventory: v })}
                                        onDownload={() => handleDownloadExport('inventory')}
                                        count={stats?.stats.products || 0}
                                        countLabel="products"
                                    />
                                    <ExportOption
                                        label="Employee Records"
                                        description="Staff, roles, permissions"
                                        checked={exportOptions.exportEmployees}
                                        onChange={(v) => setExportOptions({ ...exportOptions, exportEmployees: v })}
                                        onDownload={() => handleDownloadExport('employees')}
                                        count={stats?.stats.employees || 0}
                                        countLabel="employees"
                                    />
                                    <ExportOption
                                        label="Shift History"
                                        description="Shifts, cash logs, discrepancies"
                                        checked={exportOptions.exportShifts}
                                        onChange={(v) => setExportOptions({ ...exportOptions, exportShifts: v })}
                                        onDownload={() => handleDownloadExport('shifts')}
                                        count={stats?.stats.shifts || 0}
                                        countLabel="shifts"
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
                                                30-Day Grace Period
                                            </h3>
                                            <p className="text-purple-600 dark:text-purple-300 text-sm mt-1">
                                                You can cancel the deletion at any time during this period.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-100 dark:bg-white/5 rounded-2xl p-6 text-center">
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
                                        Permanent deletion scheduled for:
                                    </p>
                                    <p className="text-2xl font-black text-red-500">
                                        {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">
                                        Type <span className="text-red-500">"{establishmentName}"</span> to confirm
                                    </label>
                                    <input
                                        type="text"
                                        value={confirmationName}
                                        onChange={(e) => setConfirmationName(e.target.value)}
                                        placeholder="Enter establishment name"
                                        className={`w-full px-4 py-3 bg-white dark:bg-[#2a2a2a] border rounded-xl text-gray-900 dark:text-white font-medium focus:outline-none transition-colors ${confirmationName.toLowerCase() === establishmentName.toLowerCase()
                                            ? 'border-green-500 focus:border-green-500'
                                            : 'border-gray-300 dark:border-gray-700 focus:border-red-500'
                                            }`}
                                    />
                                    {confirmationName.toLowerCase() === establishmentName.toLowerCase() && (
                                        <p className="text-green-500 text-sm mt-2 flex items-center gap-1">
                                            <Check size={14} /> Name confirmed
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-white/10 flex gap-3">
                    {step !== 'warning' && (
                        <button
                            onClick={() =>
                                setStep(step === 'confirm' ? 'export' : 'warning')
                            }
                            className="px-6 py-3 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                        >
                            Back
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-colors ml-auto"
                    >
                        Cancel
                    </button>
                    {step !== 'confirm' ? (
                        <button
                            onClick={() =>
                                setStep(step === 'warning' ? 'export' : 'confirm')
                            }
                            className="px-6 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors flex items-center gap-2"
                        >
                            Continue
                            <ChevronRight size={18} />
                        </button>
                    ) : (
                        <button
                            onClick={handleRequestDeletion}
                            disabled={
                                confirmationName.toLowerCase() !== establishmentName.toLowerCase() ||
                                isSubmitting
                            }
                            className="px-6 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Trash2 size={18} />
                                    Schedule Deletion
                                </>
                            )}
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
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
        <div className="bg-gray-100 dark:bg-white/5 rounded-xl p-4 text-center">
            <Icon size={20} className="text-red-500 mx-auto mb-2" />
            <div className="text-2xl font-black text-gray-900 dark:text-white">
                {value.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
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
}: {
    label: string;
    description: string;
    checked: boolean;
    onChange: (v: boolean) => void;
    onDownload: () => void;
    count: number;
    countLabel: string;
}) {
    return (
        <div className="bg-gray-100 dark:bg-white/5 rounded-xl p-4 flex items-center gap-4">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-paymint-green focus:ring-paymint-green cursor-pointer"
            />
            <FileSpreadsheet size={20} className="text-gray-400" />
            <div className="flex-1">
                <div className="font-bold text-gray-900 dark:text-white text-sm">{label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{description}</div>
            </div>
            <div className="text-right">
                <div className="text-sm font-bold text-gray-900 dark:text-white">
                    {count.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{countLabel}</div>
            </div>
            <button
                onClick={onDownload}
                className="p-2 bg-white dark:bg-white/10 rounded-lg hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                title="Download now"
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
    if (deletionStatus.status !== 'pending_deletion') return null;

    const scheduledDate = deletionStatus.deletionScheduledFor
        ? new Date(deletionStatus.deletionScheduledFor).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
        : 'Unknown';

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-6 text-white mb-8"
        >
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                        <AlertTriangle size={28} />
                    </div>
                    <div>
                        <h3 className="font-black text-lg">Deletion Scheduled</h3>
                        <p className="text-white/80 text-sm">
                            This establishment will be permanently deleted on{' '}
                            <span className="font-bold">{scheduledDate}</span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-center">
                        <div className="text-3xl font-black">{deletionStatus.daysRemaining}</div>
                        <div className="text-xs text-white/80 uppercase">days left</div>
                    </div>
                    <button
                        onClick={onCancelDeletion}
                        disabled={isCancelling}
                        className="px-6 py-3 bg-white text-red-500 font-bold rounded-xl hover:bg-white/90 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {isCancelling ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Cancelling...
                            </>
                        ) : (
                            <>
                                <Shield size={18} />
                                Cancel Deletion
                            </>
                        )}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
