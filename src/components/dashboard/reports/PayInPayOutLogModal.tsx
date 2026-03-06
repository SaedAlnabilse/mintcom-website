import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowUpRight, ArrowDownLeft, User, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import api from '../../../config/api';
import { useScrollLock } from '../../../hooks/useScrollLock';
import { useTranslation } from 'react-i18next';
import { getDateLocale } from '../../../utils/dateLocale';
import { useCurrency } from '../../../context/CurrencyContext';

interface PayInPayOutLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    startDate: string;
    endDate: string;
    employeeId?: string | null;
}

interface CashLog {
    id: string;
    type: 'PAY_IN' | 'PAY_OUT';
    amount: number;
    reason: string;
    note?: string;
    createdAt: string;
    userName: string;
}

export const PayInPayOutLogModal: React.FC<PayInPayOutLogModalProps> = ({
    isOpen,
    onClose,
    startDate,
    endDate,
    employeeId,
}) => {
    const { t } = useTranslation();
    const { formatAmount } = useCurrency();
    const [logs, setLogs] = useState<CashLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totals, setTotals] = useState({ payIn: 0, payOut: 0 });
    const [sidebarOffset, setSidebarOffset] = useState(0);

    useScrollLock(isOpen);

    useEffect(() => {
        const updateOffset = () => {
            // Only apply offset on desktop layout (lg breakpoint = 1024px)
            if (window.innerWidth >= 1024) {
                const aside = document.querySelector('aside');
                if (aside) {
                    setSidebarOffset(aside.getBoundingClientRect().width);
                }
            } else {
                setSidebarOffset(0);
            }
        };

        updateOffset();

        // Watch for window resizes
        window.addEventListener('resize', updateOffset);

        // Watch for sidebar width changes (animation)
        const aside = document.querySelector('aside');
        let observer: ResizeObserver;

        if (aside) {
            observer = new ResizeObserver(updateOffset);
            observer.observe(aside);
        } else {
            // If aside not found immediately, poll briefly or rely on window resize
            // In most cases aside exists as layout wraps this
        }

        return () => {
            window.removeEventListener('resize', updateOffset);
            if (observer) observer.disconnect();
        };
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            fetchLogs();
        }
    }, [isOpen, startDate, endDate, employeeId]);

    const fetchLogs = async () => {
        try {
            setIsLoading(true);
            const limit = "100"; // Fetch enough logs
            const start = new Date(startDate).toISOString();
            const end = new Date(endDate).toISOString();

            const params: Record<string, string> = { startDate: start, endDate: end, limit };
            if (employeeId) {
                params.employeeId = employeeId;
            }

            const response = await api.get('/reports/pay-in-pay-out', {
                params,
            });

            const entries = response.data.entries || [];
            
            // Only show PAY_IN and PAY_OUT types in the log
            const filteredLogs = entries.filter((l: any) => l.type === 'PAY_IN' || l.type === 'PAY_OUT');
            setLogs(filteredLogs);

            // Calculate totals using absolute values to avoid sign confusion
            // PAY_IN adds to cash, PAY_OUT subtracts
            const payIn = filteredLogs
                .filter((l: CashLog) => l.type === 'PAY_IN')
                .reduce((sum: number, l: CashLog) => sum + Math.abs(Number(l.amount)), 0);

            const payOut = filteredLogs
                .filter((l: CashLog) => l.type === 'PAY_OUT')
                .reduce((sum: number, l: CashLog) => sum + Math.abs(Number(l.amount)), 0);

            console.log('Cash Logs:', entries); // Debug logs
            console.log('Calculated Totals:', { payIn, payOut });

            setTotals({ payIn, payOut });
        } catch (error) {
            console.error('Failed to fetch cash logs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return formatAmount(value);
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div
                    dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-[padding] duration-300 ease-in-out font-sans"
                    style={{ paddingLeft: t('common.locale') === 'ar' ? '1rem' : `calc(1rem + ${sidebarOffset}px)`, paddingRight: t('common.locale') === 'ar' ? `calc(1rem + ${sidebarOffset}px)` : '1rem' }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full max-w-2xl bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/5 overflow-hidden flex flex-col max-h-[85vh]"
                    >
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between shrink-0 bg-white dark:bg-[#1E293B] z-10">
                            <div>
                                <h2 className="text-xl font-outfit font-bold text-gray-900 dark:text-white tracking-tight">
                                    {t('orders.reports.sales.cashManagementLog')}
                                </h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs font-bold text-gray-500 tracking-wide">
                                        {format(new Date(startDate), 'MMM dd', { locale: getDateLocale(t('common.locale')) })} - {format(new Date(endDate), 'MMM dd, yyyy', { locale: getDateLocale(t('common.locale')) })}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 transition-all text-gray-400 hover:text-gray-900 dark:hover:text-white"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Content Area - Scrollable */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">

                            {/* 1. Summary Cards Row */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* PAY-IN Card */}
                                <div className="relative overflow-hidden rounded-2xl bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/5 p-5 group">
                                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                                        <ArrowUpRight size={60} className="text-paymint-green" />
                                    </div>
                                    <div className="relative z-10 flex flex-col">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-8 h-8 rounded-lg bg-white dark:bg-white/5 flex items-center justify-center shadow-sm">
                                                <ArrowUpRight size={16} className={`text-paymint-green ${t('common.locale') === 'ar' ? '-rotate-90' : ''}`} />
                                            </div>
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('orders.reports.sales.payIn')}</span>
                                        </div>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                                            {formatCurrency(totals.payIn)}
                                        </p>
                                    </div>
                                </div>

                                {/* PAY-OUT Card */}
                                <div className="relative overflow-hidden rounded-2xl bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/5 p-5 group">
                                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                                        <ArrowDownLeft size={60} className="text-red-500" />
                                    </div>
                                    <div className="relative z-10 flex flex-col">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-8 h-8 rounded-lg bg-white dark:bg-white/5 flex items-center justify-center shadow-sm">
                                                <ArrowDownLeft size={16} className={`text-red-500 ${t('common.locale') === 'ar' ? '-rotate-90' : ''}`} />
                                            </div>
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('orders.reports.sales.payOut')}</span>
                                        </div>
                                        <p className="text-xl font-outfit font-bold text-gray-900 dark:text-white tracking-tight">
                                            {formatCurrency(totals.payOut)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Divider */}
                            <div className="flex items-center gap-4">
                                <div className="h-px bg-gray-100 dark:bg-white/5 flex-1" />
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('orders.reports.sales.transactionHistory')}</span>
                                <div className="h-px bg-gray-100 dark:bg-white/5 flex-1" />
                            </div>

                            {/* 3. Transactions List */}
                            <div>
                                {isLoading ? (
                                    <div className="py-12 flex flex-col items-center justify-center space-y-3 opacity-50">
                                        <div className="w-6 h-6 border-2 border-paymint-green border-t-transparent rounded-full animate-spin" />
                                        <p className="text-xs font-bold text-gray-400 tracking-widest uppercase">{t('common.loading')}</p>
                                    </div>
                                ) : logs.length > 0 ? (
                                    <div className="space-y-3">
                                        {logs.map((log) => (
                                            <div
                                                key={log.id}
                                                className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 transition-colors group"
                                            >
                                                <div className="flex items-center gap-4">
                                                    {/* Icon Box */}
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-colors ${log.type === 'PAY_IN'
                                                        ? 'bg-paymint-green/10 text-paymint-green border-paymint-green/20 group-hover:bg-paymint-green group-hover:text-white'
                                                        : 'bg-red-500/10 text-red-500 border-red-500/20 group-hover:bg-red-500 group-hover:text-white'
                                                        }`}>
                                                        {log.type === 'PAY_IN' ? <ArrowUpRight size={20} className={t('common.locale') === 'ar' ? '-rotate-90' : ''} /> : <ArrowDownLeft size={20} className={t('common.locale') === 'ar' ? '-rotate-90' : ''} />}
                                                    </div>

                                                    {/* Details */}
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                                                                {log.reason}
                                                            </h4>
                                                            <span className="text-xs font-medium text-gray-400 bg-gray-100 dark:bg-white/5 px-1.5 py-0.5 rounded border border-gray-200 dark:border-white/10">
                                                                {format(new Date(log.createdAt), 'MMM dd, HH:mm', { locale: getDateLocale(t('common.locale')) })}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex items-center gap-1">
                                                                <User size={10} className="text-gray-400" />
                                                                <span className="text-xs text-gray-500">{log.userName}</span>
                                                            </div>
                                                            {log.note && (
                                                                <>
                                                                    <div className="w-0.5 h-0.5 rounded-full bg-gray-300 dark:bg-white/20" />
                                                                    <span className="text-xs text-gray-500 truncate max-w-[150px]">{log.note}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Amount */}
                                                <div className={`text-right font-bold tabular-nums ${log.type === 'PAY_IN' ? 'text-paymint-green' : 'text-red-500'
                                                    }`} dir="ltr">
                                                    {log.type === 'PAY_IN' ? '+' : '-'}{formatCurrency(Math.abs(log.amount))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-12 flex flex-col items-center justify-center text-center opacity-40">
                                        <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-3">
                                            <FileText size={20} className="text-gray-400" />
                                        </div>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">{t('common.noRecordsFound')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};


