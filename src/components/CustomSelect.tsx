import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

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
    error?: string;
    required?: boolean;
    direction?: 'up' | 'down';
    disabled?: boolean;
    scrollIntoViewOnOpen?: boolean; // Only scroll into view when inside modals/popups
}

export function CustomSelect({
    label,
    value,
    onChange,
    options = [],
    placeholder,
    className = '',
    error,
    required,
    direction = 'down',
    disabled = false,
    scrollIntoViewOnOpen = false
}: CustomSelectProps) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    // Default placeholder from translation
    const defaultPlaceholder = t('common.select');
    const displayPlaceholder = placeholder || defaultPlaceholder;
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
                    className={`bg-white/95 dark:bg-[#1E293B]/95 backdrop-blur-xl border border-gray-100 dark:border-white/[0.08] rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden max-h-80 overflow-y-auto custom-scrollbar ring-1 ring-black/5`}
                >
                    {formattedOptions.length === 0 ? (
                        <div className="px-5 py-4 text-sm font-bold text-gray-500 italic text-center">{t('common.noOptions')}</div>
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
                                className={`w-full px-5 py-3.5 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors ${value === opt.value ? 'bg-paymint-green/10 text-paymint-green' : 'text-gray-900 dark:text-gray-200'
                                    }`}
                            >
                                <span className={`text-sm ${value === opt.value ? 'font-black' : 'font-bold'}`}>{opt.label}</span>
                                {value === opt.value && (
                                    <motion.div
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                    >
                                        <Check size={16} className="text-paymint-green" />
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
        <div className={`relative ${className}`} ref={containerRef}>
            {label && (
                <label className="block text-xs font-black text-gray-400 tracking-widest mb-3 px-1">
                    {label} {required && <span className="text-paymint-red">*</span>}
                </label>
            )}

            <button
                ref={buttonRef}
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full px-5 py-3.5 bg-white dark:bg-white/[0.03] backdrop-blur-sm border border-gray-200 dark:border-white/[0.08] rounded-2xl text-left flex items-center justify-between transition-[color,background-color,border-color,box-shadow,ring] outline-none shadow-sm
                    ${disabled
                        ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-white/[0.01]'
                        : 'hover:border-paymint-green/50 hover:bg-gray-50/50 dark:hover:bg-white/[0.06]'}
                    ${error ? 'ring-2 ring-paymint-red border-paymint-red' : isOpen ? 'ring-[3px] ring-paymint-green/10 border-paymint-green bg-gray-50 dark:bg-white/[0.08]' : ''
                    }`}
            >
                <span className={`text-sm font-bold truncate pr-2 ${selectedOption ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                    {selectedOption ? selectedOption.label : displayPlaceholder}
                </span>
                <ChevronDown
                    size={18}
                    className={`text-gray-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Portal the dropdown to body to escape overflow:hidden containers */}
            {typeof document !== 'undefined' && createPortal(dropdownContent, document.body)}

            {error && <p className="mt-1 text-xs font-bold text-paymint-red px-1">{error}</p>}
        </div>
    );
}

