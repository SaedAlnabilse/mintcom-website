import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CustomTimePickerProps {
    value: string;
    onChange: (time: string) => void;
    className?: string;
    showIcon?: boolean;
    align?: 'left' | 'right';
    isActive?: boolean;
    buttonClassName?: string;
}

export function CustomTimePicker({ value, onChange, className = '', showIcon = false, align = 'left', isActive = false, buttonClassName = '' }: CustomTimePickerProps) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Parse 24h string to 12h components
    const parseTime = (timeStr: string) => {
        if (!timeStr) return { hour: 12, minute: 0, period: 'AM' };
        const [h, m] = timeStr.split(':').map(Number);
        const period = h >= 12 ? 'PM' : 'AM';
        const hour = h % 12 || 12;
        return { hour, minute: m, period };
    };

    const { hour, minute, period } = parseTime(value);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const updateTime = (newHour: number, newMinute: number, newPeriod: string) => {
        let h = newHour;
        if (newPeriod === 'PM' && h !== 12) h += 12;
        if (newPeriod === 'AM' && h === 12) h = 0;

        onChange(`${h.toString().padStart(2, '0')}:${newMinute.toString().padStart(2, '0')}`);
    };

    const hours = Array.from({ length: 12 }, (_, i) => i + 1);
    const minutes = Array.from({ length: 60 }, (_, i) => i);

    return (
        <div className={`relative ${className}`} ref={containerRef} dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`
          flex items-center gap-2 w-full bg-transparent p-0 text-sm font-bold border-none focus:ring-0 cursor-pointer transition-colors
          ${(isOpen || isActive) ? 'text-[#7CC39F]' : 'text-gray-600 dark:text-white/60'}
          ${buttonClassName}
        `}
            >
                {showIcon && <Clock size={14} className={(isOpen || isActive) ? 'text-[#7CC39F]' : 'text-gray-400'} />}
                <span>
                    {hour.toLocaleString(t('common.locale'), { minimumIntegerDigits: 2 })}:{minute.toLocaleString(t('common.locale'), { minimumIntegerDigits: 2 })} <span className="text-xs ml-0.5">{period === 'AM' ? t('common.time.am') : t('common.time.pm')}</span>
                </span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.1 }}
                        style={{ opacity: 1 }}
                        className={`absolute top-full ${align === 'right' ? 'right-0' : 'left-0'} mt-2 z-[9999] !bg-white dark:!bg-[#0F172A] !bg-opacity-100 !opacity-100 !backdrop-blur-none border border-gray-100 dark:border-white/10 rounded-2xl shadow-2xl w-[200px] p-2 flex gap-1 h-[200px] overflow-hidden`}
                    >
                        {/* Hours */}
                        <div className="flex-1 overflow-y-auto scrollbar-none hover:scrollbar-thin">
                            <div className="text-[10px] !bg-gray-50 dark:!bg-[#0F172A] !bg-opacity-100 text-center py-1 font-bold sticky top-0 z-10 text-gray-500 border-b border-gray-100 dark:border-white/5">{t('common.time.hourAbbr')}</div>
                            {hours.map(h => (
                                <div
                                    key={h}
                                    onClick={() => updateTime(h, minute, period)}
                                    className={`
                    text-center py-1.5 text-sm cursor-pointer rounded-md transition-colors
                    ${h === hour ? 'bg-[#7CC39F] text-white font-bold' : 'hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200'}
                  `}
                                >
                                    {h.toLocaleString(t('common.locale'))}
                                </div>
                            ))}
                        </div>

                        {/* Minutes */}
                        <div className="flex-1 overflow-y-auto scrollbar-none hover:scrollbar-thin border-l border-r border-gray-100 dark:border-white/5">
                            <div className="text-[10px] !bg-gray-50 dark:!bg-[#0F172A] !bg-opacity-100 text-center py-1 font-bold sticky top-0 z-10 text-gray-500 border-b border-gray-100 dark:border-white/5">{t('common.time.minuteAbbr')}</div>
                            {minutes.map(m => (
                                <div
                                    key={m}
                                    onClick={() => updateTime(hour, m, period)}
                                    className={`
                    text-center py-1.5 text-sm cursor-pointer rounded-md transition-colors
                    ${m === minute ? 'bg-[#7CC39F] text-white font-bold' : 'hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200'}
                  `}
                                >
                                    {m.toLocaleString(t('common.locale'), { minimumIntegerDigits: 2 })}
                                </div>
                            ))}
                        </div>

                        {/* AM/PM */}
                        <div className="w-[50px] flex flex-col justify-center gap-1">
                            {['AM', 'PM'].map(p => (
                                <div
                                    key={p}
                                    onClick={() => updateTime(hour, minute, p)}
                                    className={`
                     text-center py-2 text-xs font-bold cursor-pointer rounded-md transition-colors
                     ${p === period ? 'bg-[#7CC39F] text-white' : 'bg-gray-50 dark:bg-white/5 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10'}
                   `}
                                >
                                    {p === 'AM' ? t('common.time.am') : t('common.time.pm')}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
