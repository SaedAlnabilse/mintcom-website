import { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownLeft, User, FileText } from 'lucide-react';
import { format } from 'date-fns';
import api from '../../../config/api';
import { useTranslation } from 'react-i18next';
import { getDateLocale } from '../../../utils/dateLocale';
import { useCurrency } from '../../../context/CurrencyContext';
import { AnalyticsEmptyState } from './AnalyticsEmptyState';
import { Modal, ModalHeader, ModalBody } from '../../ui';

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

export function PayInPayOutLogModal({
    isOpen,
    onClose,
    startDate,
    endDate,
    employeeId,
}: PayInPayOutLogModalProps) {
    const { t } = useTranslation();
    const { formatAmount } = useCurrency();
    const [logs, setLogs] = useState<CashLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totals, setTotals] = useState({ payIn: 0, payOut: 0 });

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

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
            <ModalHeader
                title={t('orders.reports.sales.cashManagementLog')}
                subtitle={`${format(new Date(startDate), 'MMM dd', { locale: getDateLocale(t('common.locale')) })} - {format(new Date(endDate), 'MMM dd, yyyy', { locale: getDateLocale(t('common.locale')) })}`}
                onClose={onClose}
            />

            <ModalBody>
                <div className="space-y-6">
                    {/* 1. Summary Cards Row */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* PAY-IN Card */}
                        <div className="relative overflow-hidden rounded-2xl bg-stone-50 dark:bg-black/20 border border-stone-100 dark:border-zinc-800 p-5">
                            <div className="relative z-10 flex flex-col">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm">
                                        <ArrowUpRight size={16} className={`text-mintcom-green ${t('common.locale') === 'ar' ? '-rotate-90' : ''}`} />
                                    </div>
                                    <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">{t('orders.reports.sales.payIn')}</span>
                                </div>
                                <p className="text-2xl font-bold text-stone-900 dark:text-zinc-100 tracking-tight">
                                    {formatCurrency(totals.payIn)}
                                </p>
                            </div>
                        </div>

                        {/* PAY-OUT Card */}
                        <div className="relative overflow-hidden rounded-2xl bg-stone-50 dark:bg-black/20 border border-stone-100 dark:border-zinc-800 p-5">
                            <div className="relative z-10 flex flex-col">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm">
                                        <ArrowDownLeft size={16} className={`text-red-500 ${t('common.locale') === 'ar' ? '-rotate-90' : ''}`} />
                                    </div>
                                    <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">{t('orders.reports.sales.payOut')}</span>
                                </div>
                                <p className="text-xl font-bold text-stone-900 dark:text-zinc-100 tracking-tight">
                                    {formatCurrency(totals.payOut)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 2. Divider */}
                    <div className="flex items-center gap-4">
                        <div className="h-px bg-stone-100 dark:bg-zinc-800 flex-1" />
                        <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">{t('orders.reports.sales.transactionHistory')}</span>
                        <div className="h-px bg-stone-100 dark:bg-zinc-800 flex-1" />
                    </div>

                    {/* 3. Transactions List */}
                    <div>
                        {isLoading ? (
                            <div className="py-12 flex flex-col items-center justify-center space-y-3 opacity-50">
                                <div className="w-6 h-6 border-2 border-mintcom-green border-t-transparent rounded-full animate-spin" />
                                <p className="text-xs font-bold text-stone-400 tracking-widest uppercase">{t('common.loading')}</p>
                            </div>
                        ) : logs.length > 0 ? (
                            <div className="space-y-3">
                                {logs.map((log) => (
                                    <div
                                        key={log.id}
                                        className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-zinc-800/40 border border-stone-100 dark:border-zinc-800"
                                    >
                                        <div className="flex items-center gap-4">
                                            {/* Icon Box */}
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${log.type === 'PAY_IN'
                                                ? 'bg-mintcom-green/10 text-mintcom-green border-mintcom-green/20'
                                                : 'bg-red-500/10 text-red-500 border-red-500/20'
                                                }`}>
                                                {log.type === 'PAY_IN' ? <ArrowUpRight size={20} className={t('common.locale') === 'ar' ? '-rotate-90' : ''} /> : <ArrowDownLeft size={20} className={t('common.locale') === 'ar' ? '-rotate-90' : ''} />}
                                            </div>

                                            {/* Details */}
                                            <div className="flex flex-col gap-1.5">
                                                <span className="text-[10px] font-bold text-stone-400 bg-stone-50 dark:bg-zinc-800 px-2 py-0.5 rounded-md border border-stone-200 dark:border-zinc-800 w-fit">
                                                    {format(new Date(log.createdAt), 'MMM dd, HH:mm', { locale: getDateLocale(t('common.locale')) })}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-1.5">
                                                        <User size={12} className="text-stone-400" />
                                                        <span className="text-xs font-bold text-stone-500">{log.userName}</span>
                                                    </div>
                                                    {(log.reason || log.note) && (
                                                        <>
                                                            <span className="text-stone-300 dark:text-zinc-700 font-bold">•</span>
                                                            <span className="text-xs font-bold text-stone-400 truncate max-w-[150px] sm:max-w-[250px]">
                                                                {log.reason || log.note}
                                                                {log.reason && log.note && log.reason !== log.note ? ` (${log.note})` : ''}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Amount */}
                                        <div className={`text-xl font-bold tabular-nums shrink-0 ${log.type === 'PAY_IN' ? 'text-mintcom-green' : 'text-red-500'
                                            }`} dir="ltr">
                                            {log.type === 'PAY_IN' ? '+' : '-'}{formatCurrency(Math.abs(log.amount))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <AnalyticsEmptyState
                                icon={FileText}
                                title={t('common.noRecordsFound')}
                                description={t('orders.reports.sales.nonSales')}
                                compact
                                className="py-12 opacity-70"
                            />
                        )}
                    </div>
                </div>
            </ModalBody>
        </Modal>
    );
}
