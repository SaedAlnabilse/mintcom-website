import { ArrowUpRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    className?: string;
    totalItems?: number;
    itemsPerPage?: number;
}

export function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    className = "",
    totalItems,
    itemsPerPage = 10
}: PaginationProps) {
    if (totalPages <= 1) return null;

    // Calculate which page numbers to show
    const getPageNumbers = () => {
        const pages: (number | 'ellipsis')[] = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages + 2) {
            // Show all pages if there aren't many
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);

            // Calculate start and end of visible range
            let startPage = Math.max(2, currentPage - 1);
            let endPage = Math.min(totalPages - 1, currentPage + 1);

            // Adjust to show at least 3 middle pages
            if (currentPage <= 3) {
                endPage = Math.min(maxVisiblePages, totalPages - 1);
            } else if (currentPage >= totalPages - 2) {
                startPage = Math.max(2, totalPages - maxVisiblePages + 1);
            }

            // Add ellipsis before middle pages if needed
            if (startPage > 2) {
                pages.push('ellipsis');
            }

            // Add middle pages
            for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
            }

            // Add ellipsis after middle pages if needed
            if (endPage < totalPages - 1) {
                pages.push('ellipsis');
            }

            // Always show last page
            pages.push(totalPages);
        }

        return pages;
    };

    const pageNumbers = getPageNumbers();

    // Calculate showing range
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems || currentPage * itemsPerPage);

    return (
        <div className={`bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm ${className}`}>
            <div className="flex items-center gap-3">
                <p className="text-xs font-black text-gray-400 tracking-widest">
                    Page <span className="text-gray-900 dark:text-white">{currentPage}</span> of {totalPages}
                </p>
                {totalItems !== undefined && (
                    <p className="text-xs font-medium text-gray-400">
                        (Showing {startItem}-{endItem} of {totalItems})
                    </p>
                )}
            </div>
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
                    {pageNumbers.map((pageNum, index) => (
                        pageNum === 'ellipsis' ? (
                            <span
                                key={`ellipsis-${index}`}
                                className="w-10 h-10 flex items-center justify-center text-gray-400"
                            >
                                ...
                            </span>
                        ) : (
                            <button
                                key={pageNum}
                                onClick={() => onPageChange(pageNum)}
                                className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${currentPage === pageNum
                                    ? 'bg-paymint-green text-black shadow-lg shadow-paymint-green/20'
                                    : 'bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                {pageNum}
                            </button>
                        )
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
