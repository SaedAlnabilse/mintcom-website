import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface Option {
    label: string;
    value: string;
}

interface MultiSelectProps {
    label?: string;
    value: string[];
    onChange: (value: string[]) => void;
    options: Option[];
    placeholder?: string;
    className?: string;
}

export function MultiSelect({
    label,
    value = [], // Default to empty array
    onChange,
    options = [],
    placeholder,
    className = ''
}: MultiSelectProps) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const effectivePlaceholder = placeholder || t('common.select');

    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

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
            
            // Focus input when opening
            const timer = setTimeout(() => {
                searchInputRef.current?.focus();
            }, 100);
            return () => clearTimeout(timer);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', updateDropdownPosition, true);
            window.removeEventListener('resize', updateDropdownPosition);
        };
    }, [isOpen]);

    const toggleOpen = () => {
        if (!isOpen) {
            setSearchQuery('');
        }
        setIsOpen(!isOpen);
    };

    const handleSelect = (optionValue: string) => {
        if (value.includes(optionValue)) {
            onChange(value.filter(v => v !== optionValue));
        } else {
            onChange([...value, optionValue]);
        }
    };

    const getDisplayValue = () => {
        if (value.length === 0) return effectivePlaceholder;
        if (value.length === 1) {
            return options.find(o => o.value === value[0])?.label || effectivePlaceholder;
        }
        return `${value.length.toLocaleString(t('common.locale'))} ${t('common.selected')}`;
    };

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const dropdownContent = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={dropdownRef}
                    initial={{ opacity: 0, y: 5, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    style={dropdownStyle}
                    className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden ring-1 ring-black/5 flex flex-col max-h-[18rem]"
                >
                    {/* Search Bar */}
                    <div className="p-2 border-b border-gray-50 dark:border-white/5 sticky top-0 bg-white dark:bg-[#111111] z-10">
                        <div className="relative flex items-center">
                            <Search size={14} className="absolute left-3 text-gray-400" />
                            <input maxLength={255}
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
                        {filteredOptions.length === 0 ? (
                            <div className="px-5 py-8 text-sm font-bold text-gray-500 italic text-center">
                                {searchQuery ? t('common.noResults') : t('common.noOptions')}
                            </div>
                        ) : (
                            filteredOptions.map((opt) => {
                                const isSelected = value.includes(opt.value);
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => handleSelect(opt.value)}
                                        className={`w-full px-4 py-3 text-start flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${isSelected ? 'bg-paymint-green/5' : ''
                                            }`}
                                    >
                                        <span className={`text-xs ${isSelected ? 'font-black text-paymint-green' : 'font-bold text-gray-700 dark:text-gray-300'}`}>{opt.label}</span>
                                        {isSelected && <Check size={14} className="text-paymint-green" />}
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
                <label className="block label-strong font-outfit mb-2 px-1">
                    {label}
                </label>
            )}

            <button
                ref={buttonRef}
                type="button"
                onClick={toggleOpen}
                className={`w-full px-4 py-3 bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-white/5 rounded-xl text-start flex items-center justify-between transition-all outline-none ${isOpen ? 'ring-2 ring-paymint-green/20 border-paymint-green/50' : ''
                    }`}
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    <span className={`font-bold text-xs truncate ${value.length > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                        {getDisplayValue()}
                    </span>
                    {value.length > 0 && (
                        <div
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                onChange([]);
                            }}
                            className="bg-gray-100 dark:bg-white/10 p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                        >
                            <X size={10} className="text-gray-500 dark:text-gray-400" />
                        </div>
                    )}
                </div>
                <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Portal the dropdown to body to escape overflow:hidden containers */}
            {typeof document !== 'undefined' && createPortal(dropdownContent, document.body)}
        </div>
    );
}

