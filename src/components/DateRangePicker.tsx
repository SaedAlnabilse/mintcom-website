import { useState, useRef, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, parseISO, isWithinInterval, isBefore } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { getDateLocale } from '../utils/dateLocale';

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
    allowFutureDates?: boolean;
    align?: 'left' | 'right' | 'center';
    buttonClassName?: string;
}

type SelectionState = 'start' | 'end';

export function DateRangePicker({
    startDate,
    endDate,
    onRangeChange,
    onClear,
    isActive = false,
    className = '',
    placeholder,
    minDate,
    maxDate,
    allowFutureDates = false,
    align = 'center',
    buttonClassName = ''
}: DateRangePickerProps) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    // Stop at today's date by default unless allowFutureDates is true or a specific maxDate is provided
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const effectiveMaxDate = maxDate !== undefined ? maxDate : (allowFutureDates ? undefined : todayStr);

    const [currentMonth, setCurrentMonth] = useState(() => {
        if (startDate) {
            const parsed = parseISO(startDate);
            if (effectiveMaxDate && startDate > effectiveMaxDate) {
                return parseISO(effectiveMaxDate);
            }
            return parsed;
        }
        return new Date();
    });
    const [selectionState, setSelectionState] = useState<SelectionState>('start');
    const [tempStartDate, setTempStartDate] = useState<string>(startDate);
    const [tempEndDate, setTempEndDate] = useState<string>(endDate);
    const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (startDate) {
            const targetMonth = (effectiveMaxDate && startDate > effectiveMaxDate)
                ? parseISO(effectiveMaxDate)
                : parseISO(startDate);
            setCurrentMonth(targetMonth);
            setTempStartDate(startDate);
        }
        if (endDate) {
            setTempEndDate(endDate);
        }
    }, [startDate, endDate, effectiveMaxDate]);

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

    const isNextDisabled = Boolean(
        effectiveMaxDate && format(startOfMonth(addMonths(currentMonth, 1)), 'yyyy-MM-dd') > effectiveMaxDate
    );
    const isPrevDisabled = Boolean(
        minDate && format(endOfMonth(subMonths(currentMonth, 1)), 'yyyy-MM-dd') < minDate
    );

    const handleDateClick = (day: Date) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        if (minDate && dateStr < minDate) return;
        if (effectiveMaxDate && dateStr > effectiveMaxDate) return;

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

    const nextMonth = () => {
        if (isNextDisabled) return;
        setCurrentMonth(addMonths(currentMonth, 1));
    };

    const prevMonth = () => {
        if (isPrevDisabled) return;
        setCurrentMonth(subMonths(currentMonth, 1));
    };

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
                    type="button"
                    onClick={prevMonth}
                    disabled={isPrevDisabled}
                    aria-label={t('common.aria.previousMonth')}
                    className={`p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg transition-colors ${
                        isPrevDisabled
                            ? 'opacity-40 cursor-not-allowed bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500'
                            : 'bg-mintcom-green text-white hover:bg-mintcom-green/90'
                    }`}
                >
                    <ChevronLeft size={18} className={t('common.locale') === 'ar' ? 'rotate-180' : ''} />
                </button>
                <span className="text-base font-bold text-gray-800 dark:text-white">
                    {format(currentMonth, 'MMMM yyyy', { locale: getDateLocale(t('common.locale')) })}
                </span>
                <button
                    type="button"
                    onClick={nextMonth}
                    disabled={isNextDisabled}
                    aria-label={t('common.aria.nextMonth')}
                    className={`p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg transition-colors ${
                        isNextDisabled
                            ? 'opacity-40 cursor-not-allowed bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500'
                            : 'bg-mintcom-green text-white hover:bg-mintcom-green/90'
                    }`}
                >
                    <ChevronRight size={18} className={t('common.locale') === 'ar' ? 'rotate-180' : ''} />
                </button>
            </div>
        );
    };

    const renderDays = () => {
        const days = [];
        const dayNames = [
            t('common.days.mon'),
            t('common.days.tue'),
            t('common.days.wed'),
            t('common.days.thu'),
            t('common.days.fri'),
            t('common.days.sat'),
            t('common.days.sun')
        ];

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
        const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

        const rows = [];
        let days = [];
        let day = startDate;

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                const cloneDay = day;
                const isCurrentMonth = isSameMonth(day, monthStart);
                const formattedDay = format(day, 'yyyy-MM-dd');
                const isFuture = Boolean(effectiveMaxDate && formattedDay > effectiveMaxDate);
                const isPastMin = Boolean(minDate && formattedDay < minDate);
                const isDisabled = isPastMin || isFuture;

                const inRange = !isDisabled && isInRange(day);
                const rangeStart = !isDisabled && isRangeStart(day);
                const rangeEnd = !isDisabled && isRangeEnd(day);
                const isToday = isSameDay(day, new Date());

                // Determine cell styling
                const cellClass = 'relative py-2 text-center text-sm transition-all duration-150 ';
                let bgClass = '';
                let textClass = '';
                let roundedClass = '';

                if (!isCurrentMonth) {
                    textClass = 'text-gray-300 dark:text-gray-600 cursor-default';
                } else if (isDisabled) {
                    textClass = 'text-gray-300 dark:text-gray-600 cursor-not-allowed select-none opacity-40';
                } else {
                    textClass = 'text-gray-700 dark:text-gray-200 cursor-pointer';
                }

                // Range styling
                if (inRange && !rangeStart && !rangeEnd) {
                    bgClass = 'bg-mintcom-green/20 dark:bg-mintcom-green/30';
                }

                if (rangeStart || rangeEnd) {
                    bgClass = 'bg-mintcom-green';
                    textClass = 'text-white font-bold cursor-pointer';
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
                if (isToday && !rangeStart && !rangeEnd && !isDisabled) {
                    textClass += ' font-bold';
                }

                days.push(
                    <div
                        key={day.toString()}
                        className={`${cellClass} ${bgClass} ${textClass} ${roundedClass} ${!isDisabled && isCurrentMonth ? 'hover:bg-mintcom-green/10' : ''}`}
                        onClick={() => !isDisabled && isCurrentMonth && handleDateClick(cloneDay)}
                        onMouseEnter={() => selectionState === 'end' && isCurrentMonth && !isDisabled && setHoveredDate(cloneDay)}
                        onMouseLeave={() => setHoveredDate(null)}
                    >
                        <span className={`relative z-10 ${rangeStart || rangeEnd ? 'inline-flex items-center justify-center w-8 h-8 rounded-lg' : ''}`}>
                            {Number(format(day, 'd')).toLocaleString(t('common.locale'))}
                        </span>
                        {isToday && !rangeStart && !rangeEnd && (
                            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-mintcom-green rounded-full" />
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
            const locale = getDateLocale(t('common.locale'));
            return `${format(parseISO(startDate), 'MMM d', { locale })} - ${format(parseISO(endDate), 'MMM d, yyyy', { locale })}`;
        }
        if (startDate) {
            const locale = getDateLocale(t('common.locale'));
            return format(parseISO(startDate), 'MMM d, yyyy', { locale });
        }
        return placeholder || t('common.selectDateRange');
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                aria-label={t('common.aria.selectDateRange')}
                aria-expanded={isOpen}
                className={`
                    flex items-center gap-3 w-full h-12 px-4 text-sm font-bold rounded-xl border transition-all shadow-sm
                    ${(isOpen || isActive)
                        ? 'border-mintcom-green bg-mintcom-green/5 text-mintcom-green'
                        : 'border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E293B] text-gray-900 dark:text-white hover:border-mintcom-green/50'
                    }
                    ${buttonClassName}
                `}
            >
                <CalendarIcon size={18} className={(isOpen || isActive) ? 'text-mintcom-green' : 'text-gray-400'} />
                <span className="truncate">{displayValue()}</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className={`absolute top-full ${getAlignClass()} mt-2 z-[9999] bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl w-[min(320px,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] p-4`}
                    >
                        {renderHeader()}
                        {renderDays()}
                        {renderCells()}

                        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5 flex justify-center">
                            <button
                                type="button"
                                onClick={() => {
                                    if (onClear) {
                                        onClear();
                                    } else {
                                        const today = new Date();
                                        const todayFormatted = format(today, 'yyyy-MM-dd');
                                        const targetDate = effectiveMaxDate && todayFormatted > effectiveMaxDate ? effectiveMaxDate : todayFormatted;
                                        setTempStartDate(targetDate);
                                        setTempEndDate(targetDate);
                                        onRangeChange(targetDate, targetDate);
                                        setCurrentMonth(parseISO(targetDate));
                                    }
                                    setIsOpen(false);
                                    setSelectionState('start');
                                }}
                                className="px-6 py-2 text-[10px] font-black tracking-widest uppercase text-gray-400 hover:text-mintcom-green bg-gray-100 dark:bg-white/5 hover:bg-mintcom-green/10 rounded-xl transition-all"
                            >
                                {t('common.clear')}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

