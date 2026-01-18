import React, { useState, useEffect } from 'react';
import { X, Clock, User, LogIn, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInMinutes } from 'date-fns';
import api from '../../../config/api';
import { QuickInfo } from '../../QuickInfo';

interface StaffHoursLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    startDate: string;
    endDate: string;
}

interface ShiftLog {
    id: string;
    startTime: string;
    endTime: string | null;
    status: 'OPEN' | 'CLOSED';
    userName: string;
    user: {
        name: string;
        username: string;
    };
    totalSales: number;
    cashSales: number;
    cardSales: number;
    openingBalance: number;
    closingBalance: number | null;
}

export const StaffHoursLogModal: React.FC<StaffHoursLogModalProps> = ({
    isOpen,
    onClose,
    startDate,
    endDate,
}) => {
    const [shifts, setShifts] = useState<ShiftLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalHours, setTotalHours] = useState(0);

    useEffect(() => {
        if (isOpen) {
            fetchShifts();
        }
    }, [isOpen, startDate, endDate]);

    const fetchShifts = async () => {
        try {
            setIsLoading(true);
            const start = new Date(startDate).toISOString();
            const endObj = new Date(endDate);
            endObj.setHours(23, 59, 59, 999);
            const end = endObj.toISOString();

            const response = await api.get('/reports/shifts', {
                params: { startDate: start, endDate: end, limit: 100 },
            });

            const shiftEntries = response.data || [];
            setShifts(shiftEntries);

            // Calculate total hours
            const total = shiftEntries.reduce((acc: number, shift: ShiftLog) => {
                const end = shift.endTime ? new Date(shift.endTime) : new Date();
                const start = new Date(shift.startTime);
                const minutes = differenceInMinutes(end, start);
                return acc + minutes / 60;
            }, 0);

            setTotalHours(total);
        } catch (error) {
            console.error('Failed to fetch shifts:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'JOD',
        }).format(value).replace('JOD', '').trim() + ' JOD';
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full max-w-5xl bg-white dark:bg-[#1E293B] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="p-8 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                                    Staff Hours & Shift Logs
                                </h2>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                                        {format(new Date(startDate), 'MMM dd')} - {format(new Date(endDate), 'MMM dd, yyyy')}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                            >
                                <X size={20} className="text-gray-900 dark:text-white" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                            {/* Summary Side */}
                            <div className="w-full md:w-1/4 p-8 bg-gray-50 dark:bg-white/[0.02] border-r border-gray-100 dark:border-white/5 space-y-6">
                                <div className="p-6 rounded-[1.5rem] bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-white/5 shadow-sm">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-8 h-8 rounded-full bg-paymint-green/10 flex items-center justify-center">
                                            <Clock size={16} className="text-paymint-green" />
                                        </div>
                                        <div className="flex items-center">
                                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Time</span>
                                            <QuickInfo text="Sum of all hours worked by staff within the selected date range." />
                                        </div>
                                    </div>
                                    <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">
                                        {totalHours.toFixed(1)} <span className="text-sm text-gray-400">HRS</span>
                                    </p>
                                </div>

                                <div className="p-6 rounded-[1.5rem] bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-white/5 shadow-sm">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                                            <User size={16} className="text-blue-500" />
                                        </div>
                                        <div className="flex items-center">
                                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Shifts</span>
                                            <QuickInfo text="Total number of shift sessions opened and closed." />
                                        </div>
                                    </div>
                                    <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">
                                        {shifts.length}
                                    </p>
                                </div>
                            </div>

                            {/* Shifts Table-like List */}
                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                {isLoading ? (
                                    <div className="flex flex-col items-center justify-center h-full space-y-4">
                                        <div className="w-8 h-8 border-2 border-paymint-green border-t-transparent rounded-full animate-spin" />
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Analytics...</p>
                                    </div>
                                ) : shifts.length > 0 ? (
                                    <div className="space-y-4">
                                        {shifts.map((shift) => {
                                            const shiftEnd = shift.endTime ? new Date(shift.endTime) : new Date();
                                            const shiftStart = new Date(shift.startTime);
                                            const durationMinutes = differenceInMinutes(shiftEnd, shiftStart);
                                            const hours = Math.floor(durationMinutes / 60);
                                            const minutes = durationMinutes % 60;

                                            return (
                                                <div
                                                    key={shift.id}
                                                    className="p-6 rounded-[2rem] bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-white/5 hover:border-paymint-green/20 transition-all group"
                                                >
                                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 group-hover:bg-paymint-green group-hover:text-black transition-all duration-500 group-hover:rotate-6">
                                                                <User size={24} />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{shift.userName}</span>
                                                                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${shift.status === 'OPEN'
                                                                        ? 'bg-paymint-green/10 text-paymint-green'
                                                                        : 'bg-gray-100 dark:bg-white/5 text-gray-400'
                                                                        }`}>
                                                                        {shift.status}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                                    <span className="flex items-center gap-1"><LogIn size={10} /> {format(shiftStart, 'HH:mm')}</span>
                                                                    <span>-</span>
                                                                    <span className="flex items-center gap-1"><LogOut size={10} /> {shift.endTime ? format(shiftEnd, 'HH:mm') : 'Active'}</span>
                                                                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-white/20" />
                                                                    <span className="text-paymint-green">{hours}h {minutes}m</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                                                            <div>
                                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Shift Sales</p>
                                                                <p className="text-sm font-black text-gray-900 dark:text-white">{formatCurrency(shift.totalSales)}</p>
                                                            </div>
                                                            <div className="hidden lg:block">
                                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Cash / Card</p>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[10px] font-black text-paymint-green">{formatCurrency(shift.cashSales).replace(' JOD', '')}</span>
                                                                    <span className="text-[10px] font-black text-blue-500">{formatCurrency(shift.cardSales).replace(' JOD', '')}</span>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Opening</p>
                                                                <p className="text-xs font-bold text-gray-500">{formatCurrency(shift.openingBalance)}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Closing</p>
                                                                <p className="text-xs font-bold text-gray-500">{shift.closingBalance ? formatCurrency(shift.closingBalance) : 'Pending'}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
                                        <div className="w-16 h-16 rounded-3xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-4">
                                            <Clock size={32} className="text-gray-400" />
                                        </div>
                                        <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">No Shifts Found</p>
                                        <p className="text-xs text-gray-500 mt-1">No staff activity recorded for this period</p>
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
