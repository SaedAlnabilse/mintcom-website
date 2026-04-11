import { ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    className?: string;
    totalItems?: number;
    itemsPerPage?: number;
    variant?: 'default' | 'footer';
}

export function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    className = "",
    totalItems,
    itemsPerPage = 10,
    variant = 'default'
}: PaginationProps) {
    const { t } = useTranslation();
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

    const baseStyles = variant === 'footer'
        ? "px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.03]"
        : `bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm`;

    return (
        <div className={`${baseStyles} ${className}`}>
            <div className="flex items-center gap-3">
                <p className="text-sm text-gray-400 flex items-center font-normal">
                    <span className="lowercase mr-1.5">{t('common.page')}</span>
                    <span className="text-gray-700 dark:text-gray-200">{currentPage.toLocaleString(t('common.locale'))}</span>
                    <span className="lowercase mx-1.5 text-[10px] opacity-70">{t('common.of')}</span>
                    <span className="text-gray-700 dark:text-gray-200">{totalPages.toLocaleString(t('common.locale'))}</span>
                </p>
                {totalItems !== undefined && variant === 'default' && (
                    <p className="text-xs font-medium text-gray-400">
                        ({t('common.showing')} {startItem.toLocaleString(t('common.locale'))}-{endItem.toLocaleString(t('common.locale'))} {t('common.of')} {totalItems.toLocaleString(t('common.locale'))})
                    </p>
                )}
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 hover:text-paymint-green disabled:opacity-30 transition-all shadow-sm"
                    title={t('common.previous')}
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
                                className={`w-10 h-10 rounded-xl text-xs font-medium transition-all ${currentPage === pageNum
                                    ? 'bg-paymint-green text-black shadow-lg shadow-paymint-green/20'
                                    : 'bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-400 hover:text-gray-900 dark:hover:text-white shadow-sm'
                                    }`}
                            >
                                {pageNum.toLocaleString(t('common.locale'))}
                            </button>
                        )
                    ))}
                </div>
                <button
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 hover:text-paymint-green disabled:opacity-30 transition-all shadow-sm"
                    title={t('common.next')}
                >
                    <ArrowUpRight size={18} className="rotate-45" />
                </button>
            </div>
        </div>
    );
}

