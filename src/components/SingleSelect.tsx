import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Option {
    label: string;
    value: string;
}

interface SingleSelectProps {
    label?: string;
    value: string | null;
    onChange: (value: string | null) => void;
    options: Option[];
    placeholder?: string;
    className?: string;
    allOptionLabel?: string; // Label for the "All" option
}

export function SingleSelect({
    label,
    value = null,
    onChange,
    options = [],
    placeholder = 'All',
    className = '',
    allOptionLabel = 'All',
    buttonClassName = ''
}: SingleSelectProps & { buttonClassName?: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Clear search and focus input when opening
    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
            const timer = setTimeout(() => {
                searchInputRef.current?.focus();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const handleSelect = (optionValue: string | null) => {
        if (optionValue === null) {
            onChange(null);
        } else if (value === optionValue) {
            onChange(null);
        } else {
            onChange(optionValue);
        }
        setIsOpen(false);
    };

    const getDisplayValue = () => {
        if (!value) return placeholder;
        return options.find(o => o.value === value)?.label || placeholder;
    };

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && (
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-1">
                    {label}
                </label>
            )}

            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full px-4 py-3 bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-white/5 rounded-xl text-left flex items-center justify-between transition-all outline-none ${isOpen ? 'ring-2 ring-paymint-green/20 border-paymint-green/50' : ''
                    } ${buttonClassName}`}
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    <span className={`font-bold text-sm truncate ${value ? 'text-paymint-green' : 'text-gray-400'}`}>
                        {getDisplayValue()}
                    </span>
                    {value && (
                        <div
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                onChange(null);
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

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 5, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.98 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute top-full left-0 right-0 mt-2 z-[100] bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden ring-1 ring-black/5 flex flex-col max-h-[18rem]"
                    >
                        {/* Search Bar */}
                        <div className="p-2 border-b border-gray-50 dark:border-white/5 sticky top-0 bg-white dark:bg-[#111111] z-10">
                            <div className="relative flex items-center">
                                <Search size={14} className="absolute left-3 text-gray-400" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search..."
                                    className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-white/5 border-none rounded-lg text-sm font-bold text-gray-700 dark:text-gray-300 placeholder-gray-400 outline-none focus:ring-1 focus:ring-paymint-green/30 transition-all"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {/* "All" Option */}
                            {!searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => handleSelect(null)}
                                    className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${!value ? 'bg-paymint-green/5' : ''
                                        }`}
                                >
                                    <span className={`text-sm ${!value ? 'font-black text-paymint-green' : 'font-bold text-gray-700 dark:text-gray-300'}`}>
                                        {allOptionLabel}
                                    </span>
                                    {!value && <Check size={14} className="text-paymint-green" />}
                                </button>
                            )}

                            {filteredOptions.length === 0 ? (
                                <div className="px-5 py-8 text-xs text-gray-400 font-bold italic text-center">
                                    {searchQuery ? 'No results found' : 'No options available'}
                                </div>
                            ) : (
                                filteredOptions.map((opt) => {
                                    const isSelected = value === opt.value;
                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => handleSelect(opt.value)}
                                            className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${isSelected ? 'bg-paymint-green/5' : ''
                                                }`}
                                        >
                                            <span className={`text-sm ${isSelected ? 'font-black text-paymint-green' : 'font-bold text-gray-700 dark:text-gray-300'}`}>{opt.label}</span>
                                            {isSelected && <Check size={14} className="text-paymint-green" />}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
