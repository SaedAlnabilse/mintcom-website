import { ArrowUpRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    className?: string;
}

export function Pagination({ currentPage, totalPages, onPageChange, className = "" }: PaginationProps) {
    if (totalPages <= 1) return null;

    return (
        <div className={`bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 px-6 py-4 flex items-center justify-between shadow-sm ${className}`}>
            <p className="text-xs font-black text-gray-400 tracking-widest">
                Page <span className="text-gray-900 dark:text-white">{currentPage}</span> of {totalPages}
            </p>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 hover:text-paymint-green disabled:opacity-30 transition-all"
                    title="Previous Page"
                >
                    <ArrowUpRight size={18} className="rotate-[225deg]" />
                </button>
                <div className="flex gap-1.5">
                    {[...Array(totalPages)].map((_, i) => (
                        <button
                            key={i}
                            onClick={() => onPageChange(i + 1)}
                            className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${currentPage === i + 1
                                ? 'bg-paymint-green text-black shadow-lg shadow-paymint-green/20'
                                : 'bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 hover:text-paymint-green disabled:opacity-30 transition-all"
                    title="Next Page"
                >
                    <ArrowUpRight size={18} className="rotate-45" />
                </button>
            </div>
        </div>
    );
}
