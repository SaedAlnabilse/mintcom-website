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
}

export function CustomSelect({
    label,
    value,
    onChange,
    options = [],
    placeholder = 'Select...',
    className = '',
    error,
    required
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

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

    // Normalize options
    const formattedOptions: Option[] = options.map(opt =>
        typeof opt === 'string' ? { label: opt, value: opt } : opt
    );

    const selectedOption = formattedOptions.find(opt => opt.value === value);

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && (
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 px-1">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}

            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full px-5 py-4 bg-gray-50 dark:bg-white/5 rounded-2xl text-left flex items-center justify-between transition-all outline-none ${error ? 'ring-2 ring-red-500' : isOpen ? 'ring-2 ring-paymint-green/20' : ''
                    }`}
            >
                <span className={`font-black ${selectedOption ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown
                    size={20}
                    className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 5, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.98 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute top-full left-0 right-0 mt-2 z-[100] bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto custom-scrollbar ring-1 ring-black/5"
                    >
                        {formattedOptions.length === 0 ? (
                            <div className="px-5 py-4 text-sm text-gray-400 font-bold italic text-center">No options available</div>
                        ) : (
                            formattedOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(opt.value);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full px-5 py-3.5 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${value === opt.value ? 'bg-paymint-green/10 text-paymint-green' : 'text-gray-900 dark:text-gray-200'
                                        }`}
                                >
                                    <span className={`text-sm ${value === opt.value ? 'font-black' : 'font-bold'}`}>{opt.label}</span>
                                    {value === opt.value && <Check size={16} className="text-paymint-green" />}
                                </button>
                            ))
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {error && <p className="mt-1 text-xs font-bold text-red-500 px-1">{error}</p>}
        </div>
    );
}
