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
    Eye,
    EyeOff,
    Lock,
} from 'lucide-react';
import api from '../config/api';
import toast from 'react-hot-toast';
import { QuickInfo } from './QuickInfo';

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
        if (!establishmentLoginId) {
            toast.error('Please enter Establishment Id');
            return;
        }

        if (establishmentPassword.length < 6) {
            toast.error('Please enter Establishment Password');
            return;
        }

        if (!accountEmail || !accountEmail.includes('@')) {
            toast.error('Please enter a valid Account Email');
            return;
        }

        if (password.length < 6) {
            toast.error('Please enter your account password');
            return;
        }

        try {
            setIsSubmitting(true);
            await api.post(`/api/establishments/${establishmentId}/request-deletion`, {
                ...exportOptions,
                establishmentLoginId,
                establishmentPassword,
                accountEmail,
                password,
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
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-8 border border-gray-200 dark:border-white/5 shadow-xl">
                <div className="w-12 h-12 border-4 border-paymint-red/10 border-t-paymint-red rounded-full animate-spin mx-auto" />
                <p className="text-[10px] font-black tracking-widest text-gray-400 mt-4 text-center">Loading Establishment Metadata...</p>
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
                className="bg-white dark:bg-[#1E293B] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-white/5 shadow-2xl"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-paymint-red to-paymint-red p-6 text-white relative">
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
                            <h2 className="text-xl font-bold">Delete Location</h2>
                            <p className="text-white/80 text-sm">{establishmentName}</p>
                        </div>
                    </div>

                    {/* Step Indicator */}
                    <div className="flex items-center gap-2 mt-6">
                        {['warning', 'export', 'confirm'].map((s, i) => (
                            <div key={s} className="flex items-center">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-colors ${step === s
                                        ? 'bg-white text-paymint-red shadow-sm'
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
                                <div className="bg-paymint-red/10 dark:bg-paymint-red/10 border border-red-200 dark:border-paymint-red/20 rounded-2xl p-4">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="text-paymint-red flex-shrink-0 mt-0.5" size={20} />
                                        <div>
                                            <h3 className="font-bold text-red-700 dark:text-paymint-red">
                                                This cannot be undone
                                            </h3>
                                            <p className="text-paymint-red dark:text-red-300 text-sm mt-1">
                                                All data will be gone forever after 30 days.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 tracking-[0.2em] mb-4 flex items-center gap-2 px-1">
                                        <Package size={14} className="text-paymint-red" />
                                        Data to be Deleted
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
                                                Save your data first
                                            </h3>
                                            <p className="text-blue-600 dark:text-blue-300 text-sm mt-1">
                                                We'll email you these files.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <ExportOption
                                        label="Sales & Revenue"
                                        description="Sales, revenue, and tax info"
                                        checked={exportOptions.exportFinancial}
                                        onChange={(v) => setExportOptions({ ...exportOptions, exportFinancial: v })}
                                        onDownload={() => handleDownloadExport('financial')}
                                        count={stats?.stats.orders || 0}
                                        countLabel="orders"
                                    />
                                    <ExportOption
                                        label="Customers"
                                        description="Customer lists and points"
                                        checked={exportOptions.exportCustomers}
                                        onChange={(v) => setExportOptions({ ...exportOptions, exportCustomers: v })}
                                        onDownload={() => handleDownloadExport('customers')}
                                        count={stats?.stats.customers || 0}
                                        countLabel="customers"
                                    />
                                    <ExportOption
                                        label="Products"
                                        description="Menu items and inventory"
                                        checked={exportOptions.exportInventory}
                                        onChange={(v) => setExportOptions({ ...exportOptions, exportInventory: v })}
                                        onDownload={() => handleDownloadExport('inventory')}
                                        count={stats?.stats.products || 0}
                                        countLabel="products"
                                    />
                                    <ExportOption
                                        label="Staff"
                                        description="Team members and roles"
                                        checked={exportOptions.exportEmployees}
                                        onChange={(v) => setExportOptions({ ...exportOptions, exportEmployees: v })}
                                        onDownload={() => handleDownloadExport('employees')}
                                        count={stats?.stats.employees || 0}
                                        countLabel="employees"
                                    />
                                    <ExportOption
                                        label="Shifts"
                                        description="Work shifts and cash logs"
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
                                                30 Days to Cancel
                                            </h3>
                                            <p className="text-purple-600 dark:text-purple-300 text-sm mt-1">
                                                You can stop this anytime in the next 30 days.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-100 dark:bg-white/5 rounded-2xl p-6 text-center">
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
                                        Deletion date:
                                    </p>
                                    <p className="text-2xl font-bold text-paymint-red">
                                        {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2 flex items-center">
                                        Location Id
                                        <QuickInfo text="The Id used for Pos login." />
                                    </label>
                                    <input
                                        type="text"
                                        value={establishmentLoginId}
                                        onChange={(e) => setEstablishmentLoginId(e.target.value)}
                                        placeholder="Enter location Id"
                                        className="w-full px-4 py-3 bg-white dark:bg-[#2a2a2a] border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white font-medium focus:outline-none focus:border-paymint-red transition-colors"
                                    />
                                </div>

                                {/* Establishment Password */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
                                        <div className="flex items-center gap-2">
                                            <Lock size={14} className="text-paymint-red" />
                                            Location Password
                                        </div>
                                        <QuickInfo text="The main password for this location." />
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showEstablishmentPassword ? 'text' : 'password'}
                                            value={establishmentPassword}
                                            onChange={(e) => setEstablishmentPassword(e.target.value)}
                                            placeholder="Location password"
                                            className="w-full px-4 py-3 pr-12 bg-white dark:bg-[#2a2a2a] border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white font-medium focus:outline-none focus:border-paymint-red transition-colors"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowEstablishmentPassword(!showEstablishmentPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                        >
                                            {showEstablishmentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Account Email */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
                                        <div className="flex items-center gap-2">
                                            <Mail size={14} className="text-paymint-red" />
                                            Your Email
                                        </div>
                                        <QuickInfo text="Your login email." />
                                    </label>
                                    <input
                                        type="email"
                                        value={accountEmail}
                                        onChange={(e) => setAccountEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        className="w-full px-4 py-3 bg-white dark:bg-[#2a2a2a] border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white font-medium focus:outline-none focus:border-paymint-red transition-colors"
                                    />
                                </div>

                                {/* Password Input */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
                                        <div className="flex items-center gap-2">
                                            <Lock size={14} className="text-paymint-red" />
                                            Your Password
                                        </div>
                                        <QuickInfo text="To confirm it's you." />
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Your account password"
                                            className={`w-full px-4 py-3 pr-12 bg-white dark:bg-[#2a2a2a] border rounded-xl text-gray-900 dark:text-white font-medium focus:outline-none transition-colors ${password.length >= 6
                                                ? 'border-green-500 focus:border-green-500'
                                                : 'border-gray-300 dark:border-gray-700 focus:border-paymint-red'
                                                }`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    {password.length >= 6 && (
                                        <p className="text-green-500 text-sm mt-2 flex items-center gap-1">
                                            <Check size={14} /> Password entered
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
                            Back
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-100 dark:hover:bg-white/10 transition-colors ml-auto"
                    >
                        Cancel
                    </button>
                    {step !== 'confirm' ? (
                        <button
                            onClick={() =>
                                setStep(step === 'warning' ? 'export' : 'confirm')
                            }
                            className="px-6 py-3 bg-paymint-red text-white rounded-xl font-bold hover:bg-paymint-red transition-colors flex items-center gap-2"
                        >
                            Continue
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
            <Icon size={20} className="text-paymint-red mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white tracking-tighter">
                {value.toLocaleString()}
            </div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 font-black tracking-widest mt-1">
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
            className="bg-gradient-to-r from-paymint-red to-paymint-red rounded-2xl p-6 text-white mb-8"
        >
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                        <AlertTriangle size={28} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">Deletion Scheduled</h3>
                        <p className="text-white/80 text-sm">
                            This establishment will be permanently deleted on{' '}
                            <span className="font-bold">{scheduledDate}</span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-center">
                        <div className="text-3xl font-bold">{deletionStatus.daysRemaining}</div>
                        <div className="text-xs text-white/80">Days Left</div>
                    </div>
                    <button
                        onClick={onCancelDeletion}
                        disabled={isCancelling}
                        className="px-6 py-3 bg-white text-paymint-red font-bold rounded-xl hover:bg-white/90 transition-colors flex items-center gap-2 disabled:opacity-50"
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
