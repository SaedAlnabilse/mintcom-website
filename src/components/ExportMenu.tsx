import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, ChevronDown, FileSpreadsheet, FileText, FileDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import type { ExportFormat } from '../utils/export';

interface ExportMenuProps {
  onExport: (format: ExportFormat) => void | Promise<void>;
  /** Which formats to offer. Defaults to Excel + PDF. */
  formats?: ExportFormat[];
  disabled?: boolean;
  /** Override the button label (defaults to the localized "Export"). */
  label?: string;
  className?: string;
}

const FORMAT_META: Record<ExportFormat, { icon: typeof FileSpreadsheet; i18nKey: string }> = {
  xlsx: { icon: FileSpreadsheet, i18nKey: 'common.exportTo.xlsx' },
  pdf: { icon: FileText, i18nKey: 'common.exportTo.pdf' },
  csv: { icon: FileDown, i18nKey: 'common.exportTo.csv' },
};

export function ExportMenu({
  onExport,
  formats = ['xlsx', 'pdf'],
  disabled = false,
  label,
  className = '',
}: ExportMenuProps) {
  const { t } = useTranslation();
  const isRTL = t('common.locale') === 'ar';
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Position the portal menu under the button.
  // Prefer right-edge alignment (opens toward the left) so top-right Export
  // buttons never clip labels off the viewport edge.
  const updateCoords = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;

    const viewportPad = 8;
    const minWidth = 220;
    const menuWidth = Math.max(rect.width, minWidth);
    // Anchor menu's right edge to the button's right edge (opens leftward).
    let left = rect.right - menuWidth;

    // Keep fully inside the viewport if possible.
    const maxLeft = window.innerWidth - menuWidth - viewportPad;
    left = Math.min(Math.max(left, viewportPad), Math.max(viewportPad, maxLeft));

    setCoords({
      top: rect.bottom + 8,
      left,
      width: menuWidth,
    });
  };

  useEffect(() => {
    if (!open) return;
    updateCoords();

    // After paint, expand width to fit real labels, then re-anchor to the right.
    const raf = requestAnimationFrame(() => {
      const menu = menuRef.current;
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!menu || !rect) return;

      const contentWidth = Math.ceil(menu.scrollWidth);
      const menuWidth = Math.max(rect.width, contentWidth, 220);
      const viewportPad = 8;
      let left = rect.right - menuWidth;
      const maxLeft = window.innerWidth - menuWidth - viewportPad;
      left = Math.min(Math.max(left, viewportPad), Math.max(viewportPad, maxLeft));

      setCoords({
        top: rect.bottom + 8,
        left,
        width: menuWidth,
      });
    });

    const handlePointer = (e: MouseEvent) => {
      if (
        buttonRef.current?.contains(e.target as Node) ||
        menuRef.current?.contains(e.target as Node)
      ) {
        return;
      }
      setOpen(false);
    };
    const handleScrollOrResize = () => updateCoords();
    document.addEventListener('mousedown', handlePointer);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('mousedown', handlePointer);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [open]);

  const handleSelect = (format: ExportFormat) => {
    setOpen(false);
    Promise.resolve(onExport(format)).catch((err: any) => {
      toast.error(err?.message || t('common.error', { defaultValue: 'Something went wrong' }));
    });
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        title={label || t('common.export')}
        className={`flex items-center gap-2 px-5 py-3 rounded-xl bg-white dark:bg-zinc-800 text-stone-900 dark:text-zinc-100 font-bold text-sm border border-stone-200 dark:border-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${open ? 'ring-[3px] ring-mintcom-green/10 border-mintcom-green' : ''} ${className}`}
      >
        <Download size={18} className="text-stone-900 dark:text-zinc-100" />
        <span>{label || t('common.export')}</span>
        <ChevronDown size={16} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              ref={menuRef}
              dir={isRTL ? 'rtl' : 'ltr'}
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.12 }}
              style={{
                position: 'fixed',
                top: coords.top,
                left: coords.left,
                width: coords.width,
                minWidth: 220,
                zIndex: 9999,
              }}
              className="bg-white dark:bg-zinc-900/60 rounded-xl border border-stone-200 dark:border-zinc-800 shadow-md overflow-hidden py-1"
            >
              {formats.map(format => {
                const meta = FORMAT_META[format];
                const Icon = meta.icon;
                return (
                  <button
                    key={format}
                    type="button"
                    onClick={() => handleSelect(format)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-stone-700 dark:text-zinc-200 hover:bg-stone-50 dark:hover:bg-zinc-800 transition-colors text-start whitespace-nowrap"
                  >
                    <Icon size={16} className="text-mintcom-green flex-shrink-0" />
                    <span>{t(meta.i18nKey)}</span>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
