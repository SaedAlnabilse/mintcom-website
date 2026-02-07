import { useState, useRef, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, parseISO, isWithinInterval, isBefore } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DateRangePickerProps {
    startDate: string;
    endDate: string;
    onRangeChange: (startDate: string, endDate: string) => void;
    onClear?: () => void;
    isActive?: boolean;
    className?: string;
    placeholder?: string;
    minDate?: string;
    maxDate?: string;
    align?: 'left' | 'right' | 'center';
}

type SelectionState = 'start' | 'end';

export function DateRangePicker({
    startDate,
    endDate,
    onRangeChange,
    onClear,
    isActive = false,
    className = '',
    placeholder = 'Select Date Range',
    minDate,
    maxDate,
    align = 'center'
}: DateRangePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(() => startDate ? parseISO(startDate) : new Date());
    const [selectionState, setSelectionState] = useState<SelectionState>('start');
    const [tempStartDate, setTempStartDate] = useState<string>(startDate);
    const [tempEndDate, setTempEndDate] = useState<string>(endDate);
    const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (startDate) {
            setCurrentMonth(parseISO(startDate));
            setTempStartDate(startDate);
        }
        if (endDate) {
            setTempEndDate(endDate);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                // Reset temp values on close without applying
                setTempStartDate(startDate);
                setTempEndDate(endDate);
                setSelectionState('start');
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [startDate, endDate]);

    const handleDateClick = (day: Date) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        if (minDate && dateStr < minDate) return;
        if (maxDate && dateStr > maxDate) return;

        if (selectionState === 'start') {
            setTempStartDate(dateStr);
            setTempEndDate('');
            setSelectionState('end');
        } else {
            // If clicking before start date, swap them
            if (tempStartDate && dateStr < tempStartDate) {
                setTempEndDate(tempStartDate);
                setTempStartDate(dateStr);
            } else {
                setTempEndDate(dateStr);
            }
            // Apply the range
            const finalStart = tempStartDate && dateStr < tempStartDate ? dateStr : tempStartDate;
            const finalEnd = tempStartDate && dateStr < tempStartDate ? tempStartDate : dateStr;
            onRangeChange(finalStart, finalEnd);
            setSelectionState('start');
            setIsOpen(false);
        }
    };

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const isInRange = (day: Date) => {
        if (!tempStartDate) return false;
        const start = parseISO(tempStartDate);

        // During selection (hovering)
        if (selectionState === 'end' && hoveredDate) {
            const hoverDate = hoveredDate;
            if (isBefore(hoverDate, start)) {
                return isWithinInterval(day, { start: hoverDate, end: start });
            }
            return isWithinInterval(day, { start, end: hoverDate });
        }

        // After selection
        if (tempEndDate) {
            const end = parseISO(tempEndDate);
            return isWithinInterval(day, { start, end });
        }

        return false;
    };

    const isRangeStart = (day: Date) => {
        if (!tempStartDate) return false;
        return isSameDay(day, parseISO(tempStartDate));
    };

    const isRangeEnd = (day: Date) => {
        if (selectionState === 'end' && hoveredDate) {
            return isSameDay(day, hoveredDate);
        }
        if (!tempEndDate) return false;
        return isSameDay(day, parseISO(tempEndDate));
    };

    const renderHeader = () => {
        return (
            <div className="flex items-center justify-between mb-4 px-1">
                <button
                    onClick={prevMonth}
                    aria-label="Previous month"
                    className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center bg-paymint-green text-white rounded-lg hover:bg-paymint-green/90 transition-colors"
                >
                    <ChevronLeft size={18} />
                </button>
                <span className="text-base font-bold text-gray-800 dark:text-white">
                    {format(currentMonth, 'MMMM yyyy')}
                </span>
                <button
                    onClick={nextMonth}
                    aria-label="Next month"
                    className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center bg-paymint-green text-white rounded-lg hover:bg-paymint-green/90 transition-colors"
                >
                    <ChevronRight size={18} />
                </button>
            </div>
        );
    };

    const renderDays = () => {
        const days = [];
        const dayNames = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

        for (let i = 0; i < 7; i++) {
            days.push(
                <div key={i} className="text-sm font-bold text-gray-500 dark:text-gray-400 text-center py-2">
                    {dayNames[i]}
                </div>
            );
        }
        return <div className="grid grid-cols-7">{days}</div>;
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        // Start from Monday
        let startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

        const rows = [];
        let days = [];
        let day = startDate;

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                const cloneDay = day;
                const isCurrentMonth = isSameMonth(day, monthStart);
                const formattedDay = format(day, 'yyyy-MM-dd');
                const isDisabled = (minDate && formattedDay < minDate) || (maxDate && formattedDay > maxDate);

                const inRange = isInRange(day);
                const rangeStart = isRangeStart(day);
                const rangeEnd = isRangeEnd(day);
                const isToday = isSameDay(day, new Date());

                // Determine cell styling
                let cellClass = 'relative py-2 text-center text-sm transition-all duration-150 cursor-pointer ';
                let bgClass = '';
                let textClass = '';
                let roundedClass = '';

                if (!isCurrentMonth) {
                    textClass = 'text-gray-300 dark:text-gray-600';
                } else if (isDisabled) {
                    textClass = 'text-gray-300 dark:text-gray-600 cursor-not-allowed';
                } else {
                    textClass = 'text-gray-700 dark:text-gray-200';
                }

                // Range styling
                if (inRange && !rangeStart && !rangeEnd) {
                    bgClass = 'bg-paymint-green/20 dark:bg-paymint-green/30';
                }

                if (rangeStart || rangeEnd) {
                    bgClass = 'bg-paymint-green';
                    textClass = 'text-white font-bold';
                }

                // Rounded corners for range
                if (rangeStart && !rangeEnd) {
                    roundedClass = 'rounded-l-lg';
                } else if (rangeEnd && !rangeStart) {
                    roundedClass = 'rounded-r-lg';
                } else if (rangeStart && rangeEnd) {
                    roundedClass = 'rounded-lg';
                }

                // Today indicator
                if (isToday && !rangeStart && !rangeEnd) {
                    textClass += ' font-bold';
                }

                days.push(
                    <div
                        key={day.toString()}
                        className={`${cellClass} ${bgClass} ${textClass} ${roundedClass} ${!isDisabled && isCurrentMonth ? 'hover:bg-paymint-green/10' : ''}`}
                        onClick={() => !isDisabled && isCurrentMonth && handleDateClick(cloneDay)}
                        onMouseEnter={() => selectionState === 'end' && isCurrentMonth && !isDisabled && setHoveredDate(cloneDay)}
                        onMouseLeave={() => setHoveredDate(null)}
                    >
                        <span className={`relative z-10 ${rangeStart || rangeEnd ? 'inline-flex items-center justify-center w-8 h-8 rounded-lg' : ''}`}>
                            {format(day, 'd')}
                        </span>
                        {isToday && !rangeStart && !rangeEnd && (
                            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-paymint-green rounded-full" />
                        )}
                    </div>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <div className="grid grid-cols-7" key={day.toString()}>
                    {days}
                </div>
            );
            days = [];
        }
        return <div className="space-y-0.5">{rows}</div>;
    };

    const getAlignClass = () => {
        switch (align) {
            case 'right': return 'right-0';
            case 'center': return 'left-1/2 -translate-x-1/2';
            default: return 'left-0';
        }
    };

    const displayValue = () => {
        if (startDate && endDate) {
            return `${format(parseISO(startDate), 'MMM d')} - ${format(parseISO(endDate), 'MMM d, yyyy')}`;
        }
        if (startDate) {
            return format(parseISO(startDate), 'MMM d, yyyy');
        }
        return placeholder;
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Select date range"
                aria-expanded={isOpen}
                className={`
                    flex items-center gap-3 w-full h-12 px-4 text-sm font-bold rounded-xl border transition-all shadow-sm
                    ${(isOpen || isActive)
                        ? 'border-paymint-green ring-2 ring-paymint-green bg-paymint-green/5 text-paymint-green shadow-lg shadow-paymint-green/10'
                        : 'border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E293B] text-gray-900 dark:text-white hover:border-paymint-green/50'
                    }
                `}
            >
                <CalendarIcon size={18} className={(isOpen || isActive) ? 'text-paymint-green' : 'text-gray-400'} />
                <span className="truncate">{displayValue()}</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className={`absolute top-full ${getAlignClass()} mt-2 z-[9999] bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl w-[320px] p-4`}
                    >
                        {renderHeader()}
                        {renderDays()}
                        {renderCells()}

                        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5 flex justify-center">
                            <button
                                onClick={() => {
                                    if (onClear) {
                                        onClear();
                                    } else {
                                        const today = new Date();
                                        const todayStr = format(today, 'yyyy-MM-dd');
                                        setTempStartDate(todayStr);
                                        setTempEndDate(todayStr);
                                        onRangeChange(todayStr, todayStr);
                                        setCurrentMonth(today);
                                    }
                                    setIsOpen(false);
                                    setSelectionState('start');
                                }}
                                className="px-6 py-2 text-[10px] font-black tracking-widest uppercase text-gray-400 hover:text-paymint-green bg-gray-100 dark:bg-white/5 hover:bg-paymint-green/10 rounded-xl transition-all"
                            >
                                Clear
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
