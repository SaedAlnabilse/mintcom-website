import { ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { activePageClass, inactivePageClass } from './sharedStyles';

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

    const handlePageChange = (newPage: number) => {
        onPageChange(newPage);
        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            const mainContainer = document.querySelector('main > div.overflow-y-auto') || document.querySelector('main');
            if (mainContainer) {
                mainContainer.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }
    };

    const pageNumbers = getPageNumbers();

    // Calculate showing range
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems || currentPage * itemsPerPage);

    const baseStyles = variant === 'footer'
        ? "px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-stone-100 dark:border-zinc-800 bg-stone-50/50 dark:bg-zinc-800/40"
        : `bg-white dark:bg-zinc-900/60 rounded-2xl border border-stone-200 dark:border-zinc-800 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm`;

    return (
        <div className={`${baseStyles} ${className}`}>
            <div className="flex items-center gap-3">
                <p className="text-sm text-stone-400 flex items-center font-normal">
                    <span className="mr-1.5">{t('common.pages', { defaultValue: 'Pages' })}</span>
                    <span className="text-stone-700 dark:text-zinc-200 font-semibold">{currentPage.toLocaleString(t('common.locale'))}</span>
                    <span className="mx-1 text-stone-400 font-light">/</span>
                    <span className="text-stone-700 dark:text-zinc-200 font-semibold">{totalPages.toLocaleString(t('common.locale'))}</span>
                </p>
                {totalItems !== undefined && variant === 'default' && (
                    <p className="text-xs font-medium text-stone-400">
                        ({t('common.showing')} {startItem.toLocaleString(t('common.locale'))}-{endItem.toLocaleString(t('common.locale'))} / {totalItems.toLocaleString(t('common.locale'))})
                    </p>
                )}
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-3 rounded-lg bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-800 text-stone-500 hover:text-emerald-700 dark:hover:text-mintcom-green disabled:opacity-30 transition-colors"
                    title={t('common.previous')}
                >
                    <ArrowUpRight size={18} className="rotate-[225deg]" />
                </button>
                <div className="flex gap-1.5">
                    {pageNumbers.map((pageNum, index) => (
                        pageNum === 'ellipsis' ? (
                            <span
                                key={`ellipsis-${index}`}
                                className="w-10 h-10 flex items-center justify-center text-stone-400"
                            >
                                ...
                            </span>
                        ) : (
                            <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                className={`w-10 h-10 rounded-lg text-sm transition-colors ${currentPage === pageNum ? activePageClass : inactivePageClass}`}
                            >
                                {pageNum.toLocaleString(t('common.locale'))}
                            </button>
                        )
                    ))}
                </div>
                <button
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-3 rounded-lg bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-800 text-stone-500 hover:text-emerald-700 dark:hover:text-mintcom-green disabled:opacity-30 transition-colors"
                    title={t('common.next')}
                >
                    <ArrowUpRight size={18} className="rotate-45" />
                </button>
            </div>
        </div>
    );
}

