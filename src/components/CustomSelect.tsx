import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { formatInputLabel, formatInputPlaceholder } from '../utils/textCase';

interface Option {
    label: string;
    value: string | number;
}

interface CustomSelectProps {
    label?: string;
    value: string | number;
    onChange: (value: string | number) => void;
    options: (Option | string)[];
    placeholder?: string;
    className?: string;
    buttonClassName?: string;
    error?: string;
    required?: boolean;
    direction?: 'up' | 'down';
    disabled?: boolean;
    scrollIntoViewOnOpen?: boolean; // Only scroll into view when inside modals/popups
    /** Match denser form inputs (h-11, px-3, rounded-xl). Default keeps existing large control. */
    size?: 'default' | 'compact';
}

export function CustomSelect({
    label,
    value,
    onChange,
    options = [],
    placeholder,
    className = '',
    buttonClassName = '',
    error,
    required,
    direction = 'down',
    disabled = false,
    scrollIntoViewOnOpen = false,
    size = 'default',
}: CustomSelectProps) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    // Default placeholder from translation
    const defaultPlaceholder = t('common.select');
    const displayPlaceholder = formatInputPlaceholder(placeholder || defaultPlaceholder, t('common.locale'));
    const containerRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const [smartDirection, setSmartDirection] = useState<'up' | 'down'>(direction);
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({
        opacity: 0,
        pointerEvents: 'none',
        position: 'fixed'
    });

    // Calculate dropdown position
    const updateDropdownPosition = () => {
        if (!buttonRef.current) return;

        const rect = buttonRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const dropdownHeight = 320; // Approx max height (max-h-80 is 20rem = 320px)

        const shouldGoUp = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;
        setSmartDirection(shouldGoUp ? 'up' : 'down');

        setDropdownStyle({
            position: 'fixed',
            left: rect.left,
            width: rect.width,
            top: shouldGoUp ? 'auto' : rect.bottom + 8,
            bottom: shouldGoUp ? window.innerHeight - rect.top + 8 : 'auto',
            zIndex: 9999,
            opacity: 1,
            pointerEvents: 'auto'
        });
    };

    useLayoutEffect(() => {
        if (isOpen) {
            requestAnimationFrame(() => {
                updateDropdownPosition();
            });
        }
    }, [isOpen]);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node) &&
                listRef.current &&
                !listRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', updateDropdownPosition, true);
            window.addEventListener('resize', updateDropdownPosition);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', updateDropdownPosition, true);
            window.removeEventListener('resize', updateDropdownPosition);
        };
    }, [isOpen]);

    // Effect to scroll active option into view
    useEffect(() => {
        if (isOpen && listRef.current) {
            const activeItem = listRef.current.querySelector('[data-active="true"]');
            if (activeItem) {
                activeItem.scrollIntoView({ behavior: 'auto', block: 'center' });
            }
        }

        // Auto-scroll container into view when opening (only for modals/popups)
        if (isOpen && scrollIntoViewOnOpen && containerRef.current) {
            setTimeout(() => {
                containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }, [isOpen, scrollIntoViewOnOpen]);

    // Normalize options
    const formattedOptions: Option[] = options.map(opt =>
        typeof opt === 'string' ? { label: opt, value: opt } : opt
    );

    const selectedOption = formattedOptions.find(opt => opt.value === value);
    const hasAllOption = formattedOptions.some((opt) => String(opt.value).toLowerCase() === 'all');
    const isFilterActive = hasAllOption && String(value).toLowerCase() !== 'all';

    const dropdownContent = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={listRef}
                    initial={{ opacity: 0, y: smartDirection === 'up' ? 5 : -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: smartDirection === 'up' ? 5 : -5 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    style={dropdownStyle}
                    className={`bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-stone-100 dark:border-zinc-800 rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden max-h-80 overflow-y-auto custom-scrollbar ring-1 ring-stone-200`}
                >
                    {formattedOptions.length === 0 ? (
                        <div className="px-5 py-4 text-sm font-normal text-stone-500 italic text-center">{t('common.noOptions')}</div>
                    ) : (
                        formattedOptions.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                data-active={value === opt.value}
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full px-5 py-3.5 text-left flex items-center justify-between hover:bg-stone-50 dark:hover:bg-zinc-800/40 transition-colors ${value === opt.value ? 'bg-mintcom-green/10 text-mintcom-green' : 'text-stone-900 dark:text-zinc-200'
                                    }`}
                            >
                                <span className={`text-sm ${value === opt.value ? 'font-normal' : 'font-normal'}`}>{opt.label}</span>
                                {value === opt.value && (
                                    <motion.div
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                    >
                                        <Check size={16} className="text-mintcom-green" />
                                    </motion.div>
                                )}
                            </button>
                        ))
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <div className={`relative min-w-0 ${className}`.trim()} ref={containerRef}>
            {label && (
                <label className="block label-strong font-sans mb-3 px-1">
                    {formatInputLabel(label, t('common.locale'))} {required && <span className="text-mintcom-red">*</span>}
                </label>
            )}

            <button
                ref={buttonRef}
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full min-w-0 border text-left flex items-center justify-between transition-[color,background-color,border-color,box-shadow,ring] outline-none
                    ${size === 'compact'
                        ? 'h-11 px-3.5 py-0 rounded-xl shadow-sm bg-white dark:bg-zinc-900/60 border-stone-200 dark:border-zinc-800'
                        : 'px-5 py-3.5 rounded-2xl shadow-sm bg-white dark:bg-zinc-800/40 backdrop-blur-sm border-stone-200 dark:border-zinc-800'}
                    ${disabled
                        ? 'cursor-not-allowed opacity-70 bg-stone-50 dark:bg-zinc-800/40 text-stone-500'
                        : 'hover:border-mintcom-green/50 hover:bg-stone-50/50 dark:hover:bg-zinc-800'}
                    ${error
                        ? 'ring-2 ring-mintcom-red border-mintcom-red'
                        : !disabled && (isOpen || isFilterActive)
                            ? 'ring-[3px] ring-mintcom-green/10 border-mintcom-green bg-mintcom-green/5 dark:bg-mintcom-green/10 !ring-[3px] !ring-mintcom-green/10 !border-mintcom-green !bg-mintcom-green/5 dark:!bg-mintcom-green/10'
                            : ''
                    } ${buttonClassName}`.trim()}
            >
                <span className={`text-sm ${size === 'compact' ? 'font-semibold' : 'font-normal'} truncate pr-2 ${selectedOption ? (disabled ? 'text-stone-700 dark:text-zinc-300' : 'text-stone-900 dark:text-zinc-100') : 'text-stone-400'}`}>
                    {selectedOption ? selectedOption.label : displayPlaceholder}
                </span>
                <ChevronDown
                    size={size === 'compact' ? 16 : 18}
                    className={`transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''} ${!disabled && (isOpen || isFilterActive) ? 'text-mintcom-green' : 'text-stone-400'}`}
                />
            </button>

            {/* Portal the dropdown to body to escape overflow:hidden containers */}
            {typeof document !== 'undefined' && createPortal(dropdownContent, document.body)}

            {error && <p className="mt-1 text-xs font-normal text-mintcom-red px-1">{error}</p>}
        </div>
    );
}

