import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface Option {
    label: string;
    value: string;
    icon?: React.ReactNode;
    subtitle?: string;
}

interface SingleSelectProps {
    label?: string;
    value: string | null;
    onChange: (value: string | null) => void;
    options: Option[];
    placeholder?: string;
    className?: string;
    allOptionLabel?: string; // Label for the "All" option
    showAllOption?: boolean;
    buttonClassName?: string;
    allowClear?: boolean;
    scrollIntoViewOnOpen?: boolean; // Only scroll into view when inside modals/popups
    disabled?: boolean;
}

export function SingleSelect({
    label,
    value = null,
    onChange,
    options = [],
    placeholder,
    allOptionLabel,
    showAllOption = true,
    buttonClassName = '',
    allowClear = true,
    scrollIntoViewOnOpen = false,
    disabled = false,
    className = ''
}: SingleSelectProps) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const effectivePlaceholder = placeholder || t('common.all');
    const effectiveAllLabel = allOptionLabel || t('common.all');

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
        const dropdownHeight = 288; // max-h-[18rem] = 288px

        const shouldGoUp = spaceBelow < dropdownHeight && rect.top > spaceBelow;

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
            updateDropdownPosition();
        }
    }, [isOpen]);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node) &&
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', updateDropdownPosition, true);
            window.addEventListener('resize', updateDropdownPosition);
            
            // Focus input
            const timer = setTimeout(() => {
                searchInputRef.current?.focus();
            }, 100);

            // Auto-scroll container into view when opening (only for modals/popups)
            if (scrollIntoViewOnOpen && containerRef.current) {
                setTimeout(() => {
                    containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 150);
            }

            return () => clearTimeout(timer);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', updateDropdownPosition, true);
            window.removeEventListener('resize', updateDropdownPosition);
        };
    }, [isOpen, scrollIntoViewOnOpen]);

    const toggleOpen = () => {
        if (disabled) return;
        if (!isOpen) {
            setSearchQuery('');
        }
        setIsOpen(!isOpen);
    };

    const handleSelect = (optionValue: string | null) => {
        if (optionValue === null) {
            onChange(null);
        } else if (value === optionValue) {
            if (allowClear) onChange(null);
        } else {
            onChange(optionValue);
        }
        setIsOpen(false);
    };

    const selectedOption = options.find(o => o.value === value);

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const dropdownContent = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={dropdownRef}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    style={dropdownStyle}
                    className={`bg-white/95 dark:bg-[#1E293B]/95 backdrop-blur-xl border border-gray-100 dark:border-white/[0.08] rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden max-h-80 overflow-y-auto custom-scrollbar ring-1 ring-black/5 flex flex-col`}
                >
                    {/* Search Bar */}
                    <div className="p-2 border-b border-gray-50 dark:border-white/5 sticky top-0 bg-white/95 dark:bg-[#1E293B]/95 backdrop-blur-xl z-10">
                        <div className="relative flex items-center">
                            <Search size={14} className="absolute left-3 text-gray-400" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t('common.searchPlaceholder')}
                                className="w-full pl-9 pr-9 py-2 bg-gray-50 dark:bg-white/5 border-none rounded-lg text-sm font-bold text-gray-700 dark:text-gray-300 placeholder-gray-400 outline-none transition-all"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    aria-label={t('common.clearSearch', 'Clear search')}
                                    className="absolute right-1.5 inline-flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
                                >
                                    <X size={12} strokeWidth={2.75} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {/* "All" Option */}
                        {showAllOption && !searchQuery && (
                            <button
                                type="button"
                                onClick={() => handleSelect(null)}
                                className={`w-full px-5 py-3.5 text-start flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors ${!value ? 'bg-paymint-green/10 text-paymint-green' : 'text-gray-900 dark:text-gray-200'
                                    }`}
                            >
                                <span className={`text-sm ${!value ? 'font-black' : 'font-bold'}`}>
                                    {effectiveAllLabel}
                                </span>
                                {!value && <Check size={16} className="text-paymint-green" />}
                            </button>
                        )}

                        {filteredOptions.length === 0 ? (
                            <div className="px-5 py-8 text-sm font-bold text-gray-500 italic text-center">
                                {searchQuery ? t('common.noResults') : t('common.noOptions')}
                            </div>
                        ) : (
                            filteredOptions.map((opt) => {
                                const isSelected = value === opt.value;
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => handleSelect(opt.value)}
                                        className={`w-full px-5 py-3.5 text-start flex items-start justify-between hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors ${isSelected ? 'bg-paymint-green/10 text-paymint-green' : 'text-gray-900 dark:text-gray-200'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            {opt.icon && (
                                                <div className={`p-2 rounded-lg shrink-0 ${isSelected ? 'bg-paymint-green/20' : 'bg-gray-100 dark:bg-white/5'}`}>
                                                    {opt.icon}
                                                </div>
                                            )}
                                            <div className="flex flex-col">
                                                <span className={`text-sm ${isSelected ? 'font-black' : 'font-bold'}`}>{opt.label}</span>
                                                {opt.subtitle && (
                                                    <span className={`text-xs mt-0.5 ${isSelected ? 'text-paymint-green/80' : 'text-gray-500 dark:text-gray-400'}`}>{opt.subtitle}</span>
                                                )}
                                            </div>
                                        </div>
                                        {isSelected && <Check size={16} className="text-paymint-green shrink-0 mt-1" />}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <div className={`relative ${className}`} ref={containerRef} dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
            {label && (
                <label className="block text-xs font-black text-gray-400 tracking-widest mb-2 px-1">
                    {label}
                </label>
            )}

            <button
                ref={buttonRef}
                type="button"
                onClick={toggleOpen}
                className={`w-full px-5 py-3.5 bg-white dark:bg-white/[0.03] backdrop-blur-sm border border-gray-200 dark:border-white/[0.08] rounded-2xl text-start flex items-center transition-[color,background-color,border-color,box-shadow,ring] outline-none shadow-sm
                    ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:border-paymint-green/50 hover:bg-gray-50/50 dark:hover:bg-white/[0.06]'}
                    ${isOpen ? 'ring-[3px] ring-paymint-green/10 border-paymint-green bg-gray-50 dark:bg-white/[0.08]' : ''
                    } ${buttonClassName} ${buttonClassName.includes('justify-center') ? 'justify-center' : 'justify-between'}`}
            >
                <div className={`flex items-center gap-2 overflow-hidden ${buttonClassName.includes('justify-center') ? 'flex-none' : 'flex-1'}`}>
                     {selectedOption?.icon && (
                         <div className="text-gray-500 dark:text-gray-400 shrink-0">
                             {selectedOption.icon}
                         </div>
                    )}
                    <span className={`font-bold text-sm truncate ${value ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                        {selectedOption?.label || effectivePlaceholder}
                    </span>
                    {value && allowClear && (
                        <div
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                onChange(null);
                            }}
                            className="bg-gray-100 dark:bg-white/10 p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-white/20 transition-colors mx-1"
                        >
                            <X size={10} className="text-gray-500 dark:text-gray-400" />
                        </div>
                    )}
                </div>
                <ChevronDown
                    size={18}
                    className={`text-gray-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''} ${buttonClassName.includes('justify-center') ? 'absolute right-5' : ''}`}
                />
            </button>

            {/* Portal the dropdown to body to escape overflow:hidden containers */}
            {typeof document !== 'undefined' && createPortal(dropdownContent, document.body)}
        </div>
    );
}
