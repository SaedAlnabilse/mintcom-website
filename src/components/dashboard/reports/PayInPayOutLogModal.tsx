import React, { useState, useEffect } from 'react';
import { X, ArrowUpRight, ArrowDownLeft, Clock, User, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import api from '../../../config/api';
import { QuickInfo } from '../../QuickInfo';

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

            const params: any = { startDate: start, endDate: end, limit };
            if (employeeId) {
                params.employeeId = employeeId;
            }

            const response = await api.get('/reports/pay-in-pay-out', {
                params,
            });

            const entries = response.data.entries || [];
            setLogs(entries);

            // Calculate totals using absolute values to avoid sign confusion
            // PAY_IN adds to cash, PAY_OUT subtracts
            const payIn = entries
                .filter((l: CashLog) => l.type === 'PAY_IN')
                .reduce((sum: number, l: CashLog) => sum + Math.abs(Number(l.amount)), 0);

            const payOut = entries
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
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'Jod',
        }).format(value).replace('Jod', '').trim() + ' Jod';
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full max-w-4xl bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/5 overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="p-8 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                                    Cash Management Log
                                </h2>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-[10px] font-black text-gray-500 tracking-widest bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-md border border-gray-200 dark:border-white/10">
                                        {format(new Date(startDate), 'MMM dd')} - {format(new Date(endDate), 'MMM dd, yyyy')}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 transition-all border border-gray-200 dark:border-white/5 shadow-sm"
                            >
                                <X size={20} className="text-gray-900 dark:text-white" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                            {/* Summary Side */}
                            <div className="w-full md:w-1/3 p-8 bg-gray-50 dark:bg-black/20 border-r border-gray-100 dark:border-white/5 space-y-6">
                                <div className="p-6 rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/5 shadow-sm">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-8 h-8 rounded-lg bg-paymint-green/10 flex items-center justify-center text-paymint-green">
                                            <ArrowDownLeft size={16} className="text-paymint-green" />
                                        </div>
                                        <div className="flex items-center">
                                            <span className="text-xs font-black text-gray-400 tracking-widest">Total Pay In</span>
                                            <QuickInfo text="Total cash added to the drawer manually (e.g. Opening Float, Change)." />
                                        </div>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tighter">
                                        {formatCurrency(totals.payIn)}
                                    </p>
                                </div>

                                <div className="p-6 rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/5 shadow-sm">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
                                            <ArrowUpRight size={16} className="text-red-500" />
                                        </div>
                                        <div className="flex items-center">
                                            <span className="text-xs font-black text-gray-400 tracking-widest">Total Pay Out</span>
                                            <QuickInfo text="Total cash removed manually (e.g. Vendor Payments, Safe Drops)." />
                                        </div>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tighter">
                                        {formatCurrency(totals.payOut)}
                                    </p>
                                </div>


                            </div>

                            {/* Logs List */}
                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                {isLoading ? (
                                    <div className="flex flex-col items-center justify-center h-full space-y-4">
                                        <div className="w-8 h-8 border-2 border-paymint-green border-t-transparent rounded-full animate-spin" />
                                        <p className="text-xs font-bold text-gray-400 tracking-widest">Loading Records...</p>
                                    </div>
                                ) : logs.length > 0 ? (
                                    <div className="space-y-4">
                                        {logs.map((log) => (
                                            <div
                                                key={log.id}
                                                className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-white/5 hover:border-paymint-green/20 transition-colors group"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start gap-4">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${log.type === 'PAY_IN'
                                                            ? 'bg-paymint-green/10 text-paymint-green'
                                                            : 'bg-red-500/10 text-red-500'
                                                            }`}>
                                                            {log.type === 'PAY_IN' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className={`text-[10px] font-black tracking-widest px-2 py-0.5 rounded-md ${log.type === 'PAY_IN'
                                                                    ? 'bg-paymint-green/10 text-paymint-green'
                                                                    : 'bg-red-500/10 text-red-500'
                                                                    }`}>
                                                                    {log.type.replace('_', ' ')}
                                                                </span>
                                                                <span className="text-[10px] font-black text-gray-400 flex items-center gap-1">
                                                                    <Clock size={10} />
                                                                    {format(new Date(log.createdAt), 'HH:mm')}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-paymint-green transition-colors">
                                                                {log.reason}
                                                            </p>
                                                            {log.note && (
                                                                <p className="text-xs text-gray-500 mt-1 flex items-start gap-1">
                                                                    <FileText size={10} className="mt-0.5" />
                                                                    {log.note}
                                                                </p>
                                                            )}
                                                            <div className="flex items-center gap-1.5 mt-2">
                                                                <User size={10} className="text-gray-400" />
                                                                <span className="text-[10px] font-black text-gray-400 tracking-widest">
                                                                    {log.userName}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <p className={`text-lg font-bold tracking-tighter ${log.type === 'PAY_IN' ? 'text-paymint-green' : 'text-red-500'
                                                        }`}>
                                                        {log.type === 'PAY_IN' ? '+' : '-'}{formatCurrency(log.amount)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
                                        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-4 border border-gray-200 dark:border-white/10">
                                            <FileText size={32} className="text-gray-400" />
                                        </div>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white tracking-widest">No Records Found</p>
                                        <p className="text-xs text-gray-500 mt-1">No cash movements recorded for this period</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
