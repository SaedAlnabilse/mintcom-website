import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Option {
    label: string;
    value: string | number;
}

interface CustomSelectProps {
    label?: string;
    value: string | number;
    onChange: (value: any) => void;
    options: (Option | string)[];
    placeholder?: string;
    className?: string;
    error?: string;
    required?: boolean;
    direction?: 'up' | 'down';
}

export function CustomSelect({
    label,
    value,
    onChange,
    options = [],
    placeholder = 'Select...',
    className = '',
    error,
    required,
    direction = 'down'
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const [smartDirection, setSmartDirection] = useState<'up' | 'down'>(direction);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen && containerRef.current) {
            // Smart positioning logic
            const rect = containerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            const dropdownHeight = 320; // Approx max height (max-h-80 is 20rem = 320px)

            if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
                setSmartDirection('up');
            } else {
                setSmartDirection('down');
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Effect to scroll active option into view
    const listRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (isOpen && listRef.current) {
            const activeItem = listRef.current.querySelector('[data-active="true"]');
            if (activeItem) {
                activeItem.scrollIntoView({ behavior: 'auto', block: 'center' });
            }
        }
    }, [isOpen]);

    // Normalize options
    const formattedOptions: Option[] = options.map(opt =>
        typeof opt === 'string' ? { label: opt, value: opt } : opt
    );

    const selectedOption = formattedOptions.find(opt => opt.value === value);

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && (
                <label className="block text-[10px] font-black text-gray-400 tracking-[0.2em] mb-3 px-1">
                    {label} {required && <span className="text-paymint-red">*</span>}
                </label>
            )}

            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full px-5 py-3.5 bg-white dark:bg-white/[0.03] backdrop-blur-sm border border-gray-200 dark:border-white/[0.08] rounded-2xl text-left flex items-center justify-between transition-all outline-none shadow-sm hover:border-paymint-green/50 hover:bg-gray-50/50 dark:hover:bg-white/[0.06] hover:shadow-lg hover:shadow-black/10 ${error ? 'ring-2 ring-paymint-red border-paymint-red' : isOpen ? 'ring-2 ring-paymint-green/20 border-paymint-green bg-gray-50 dark:bg-white/[0.08] shadow-inner shadow-black/20' : ''
                    }`}
            >
                <span className={`text-sm font-bold truncate pr-2 ${selectedOption ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown
                    size={18}
                    className={`text-gray-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        ref={listRef}
                        initial={{ opacity: 0, y: smartDirection === 'up' ? 5 : -5, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: smartDirection === 'up' ? 5 : -5, scale: 0.98 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className={`absolute ${smartDirection === 'up' ? 'bottom-full mb-2 origin-bottom' : 'top-full mt-2 origin-top'} left-0 right-0 z-[100] bg-white/95 dark:bg-[#0B1120]/95 backdrop-blur-xl border border-gray-100 dark:border-white/[0.08] rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden max-h-80 overflow-y-auto custom-scrollbar ring-1 ring-black/5`}
                    >
                        {formattedOptions.length === 0 ? (
                            <div className="px-5 py-4 text-sm text-gray-400 font-bold italic text-center">No options available</div>
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

            {error && <p className="mt-1 text-xs font-bold text-paymint-red px-1">{error}</p>}
        </div>
    );
}
