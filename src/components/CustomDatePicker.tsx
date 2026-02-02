import { useState, useRef, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CustomDatePickerProps {
    value: string;
    onChange: (date: string) => void;
    className?: string;
    placeholder?: string;
    minDate?: string;
    maxDate?: string;
    showIcon?: boolean;
}

export function CustomDatePicker({
    value,
    onChange,
    className = '',
    placeholder = 'Select Date',
    minDate,
    maxDate,
    showIcon = false
}: CustomDatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (value) {
            setCurrentMonth(parseISO(value));
        }
    }, [value]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDateClick = (day: Date) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        if (minDate && dateStr < minDate) return;
        if (maxDate && dateStr > maxDate) return;
        onChange(dateStr);
        setIsOpen(false);
    };

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const renderHeader = () => {
        return (
            <div className="flex items-center justify-between mb-4 px-1">
                <button onClick={prevMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
                    <ChevronLeft size={16} className="text-gray-600 dark:text-gray-300" />
                </button>
                <span className="text-sm font-bold text-gray-800 dark:text-white">
                    {format(currentMonth, 'MMMM yyyy')}
                </span>
                <button onClick={nextMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
                    <ChevronRight size={16} className="text-gray-600 dark:text-gray-300" />
                </button>
            </div>
        );
    };

    const renderDays = () => {
        const days = [];
        const dateFormat = "EEEEE"; // M, T, W, T, F, S, S
        const startDate = startOfWeek(currentMonth);

        for (let i = 0; i < 7; i++) {
            days.push(
                <div key={i} className="text-xs font-medium text-gray-400 text-center py-1">
                    {format(addDays(startDate, i), dateFormat)}
                </div>
            );
        }
        return <div className="grid grid-cols-7 mb-1">{days}</div>;
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const rows = [];
        let days = [];
        let day = startDate;
        let formattedDate = "";

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                formattedDate = format(day, "d");
                const cloneDay = day;
                const isSelected = value ? isSameDay(day, parseISO(value)) : false;
                const isCurrentMonth = isSameMonth(day, monthStart);

                const formattedDay = format(day, 'yyyy-MM-dd');
                const isDisabled = (minDate && formattedDay < minDate) || (maxDate && formattedDay > maxDate);

                days.push(
                    <div
                        key={day.toString()}
                        className={`
              relative p-1 text-center text-sm rounded-lg transition-all duration-200
              ${!isCurrentMonth ? "text-gray-300 dark:text-gray-600" : "text-gray-700 dark:text-gray-200"}
              ${isSelected ? "!bg-[#7CC39F] !text-white font-bold shadow-md shadow-[#7CC39F]/20" :
                                isDisabled ? "opacity-20 cursor-not-allowed" : "hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer"}
            `}
                        onClick={() => !isDisabled && handleDateClick(cloneDay)}
                    >
                        {formattedDate}
                    </div>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <div className="grid grid-cols-7 gap-1" key={day.toString()}>
                    {days}
                </div>
            );
            days = [];
        }
        return <div className="space-y-1">{rows}</div>;
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`
          flex items-center gap-2 w-full bg-transparent p-0 text-sm font-bold border-none focus:ring-0 cursor-pointer transition-colors
          ${isOpen ? 'text-[#7CC39F]' : 'text-gray-600 dark:text-white/60'}
        `}
            >
                {showIcon && <CalendarIcon size={14} className={isOpen ? 'text-[#7CC39F]' : 'text-gray-400'} />}
                <span>{value ? format(parseISO(value), 'MM/dd/yyyy') : placeholder}</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.1 }}
                        className="absolute top-full left-0 mt-2 z-50 bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-white/10 rounded-2xl shadow-xl w-[280px] p-4"
                    >
                        {renderHeader()}
                        {renderDays()}
                        {renderCells()}

                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/5 flex justify-between">
                            <button
                                onClick={() => { onChange(''); setIsOpen(false); }}
                                className="text-xs font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                Clear
                            </button>
                            <button
                                onClick={() => { onChange(format(new Date(), 'yyyy-MM-dd')); setIsOpen(false); }}
                                className="text-xs font-bold text-[#7CC39F] hover:text-[#6ab38b]"
                            >
                                Today
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
