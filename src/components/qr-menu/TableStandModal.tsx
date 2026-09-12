import React from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, Sparkles, Wifi } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { RESTAURANT_INFO } from './menuData';

interface TableStandModalProps {
  tableNumber: string;
  qrUrl: string;
  isOpen: boolean;
  onClose: () => void;
  wifiName?: string;
  wifiPass?: string;
}

export const TableStandModal: React.FC<TableStandModalProps> = ({
  tableNumber,
  qrUrl,
  isOpen,
  onClose,
  wifiName,
  wifiPass,
}) => {
  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const effectiveWifiName = wifiName?.trim() || RESTAURANT_INFO.wifiName;
  const effectiveWifiPass = wifiPass?.trim() || RESTAURANT_INFO.wifiPass;

  const handlePrint = () => {
    window.print();
  };

  return createPortal(
    <div
      id="table-stand-print-portal"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Print Stylesheet to isolate ONLY #printable-table-stand */}
      <style>{`
        @media print {
          @page {
            size: auto;
            margin: 12mm;
          }

          /* Hide all page content outside this print portal */
          #root,
          body > *:not(#table-stand-print-portal) {
            display: none !important;
          }

          /* Hide modal chrome, buttons, headers */
          .print-hide {
            display: none !important;
          }

          /* Clean white sheet */
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: 100% !important;
          }

          /* Portal container */
          #table-stand-print-portal {
            position: static !important;
            inset: auto !important;
            background: transparent !important;
            padding: 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            min-height: 100vh !important;
          }

          /* Modal box becomes transparent */
          #table-stand-modal-box {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            max-width: none !important;
            width: 100% !important;
          }

          /* Print ONLY the physical card, centered and crisp */
          #printable-table-stand {
            margin: 0 auto !important;
            box-shadow: none !important;
            border: 2px solid #f59e0b !important;
            background: #ffffff !important;
            color: #0f172a !important;
            width: 320px !important;
            max-width: 320px !important;
            border-radius: 24px !important;
            padding: 24px 20px !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      <div
        id="table-stand-modal-box"
        className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col items-center animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Actions (Hidden when printing) */}
        <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-white/10 print-hide">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Table Stand Print Preview</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Physical Table Stand Card (ONLY this prints) */}
        <div
          id="printable-table-stand"
          className="w-full max-w-xs bg-white border-2 border-amber-300 rounded-3xl p-6 text-center shadow-xl relative overflow-hidden my-2"
        >
          {/* Restaurant Logo & Header */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-xs flex items-center justify-center text-2xl mb-2">
              {RESTAURANT_INFO.logo}
            </div>
            <h4 className="text-base sm:text-lg font-extrabold text-slate-800 tracking-tight">
              {RESTAURANT_INFO.name.en}
            </h4>
            <p className="text-[11px] text-amber-700 font-serif italic mt-0.5">
              {RESTAURANT_INFO.tagline.en}
            </p>
          </div>

          {/* Table Number Ribbon */}
          <div className="my-3 py-1 px-5 rounded-full bg-emerald-50 border border-emerald-400/60 inline-flex items-center gap-1.5 shadow-2xs">
            <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-widest">
              {tableNumber}
            </span>
          </div>

          {/* Real QR Code */}
          <div className="bg-white p-2.5 rounded-2xl inline-block my-2 border-4 border-slate-900 shadow-xs">
            <QRCodeSVG
              value={qrUrl}
              size={160}
              level="H"
              includeMargin={false}
              bgColor="#ffffff"
              fgColor="#0F172A"
            />
          </div>

          {/* Instructions */}
          <div className="mt-2 space-y-1">
            <p className="text-xs font-bold text-slate-700 tracking-wider">
              SCAN TO VIEW DIGITAL MENU
            </p>
            <p className="text-[10px] text-slate-500">
              Point your phone camera • No app download required
            </p>
            <p className="text-[10px] text-slate-500 font-arabic pt-0.5">
              امسح الرمز بكاميرا هاتفك لتصفح قائمة الطعام
            </p>
          </div>

          {/* Wi-Fi Info Footer */}
          <div className="mt-4 pt-2.5 border-t border-slate-200 flex items-center justify-center gap-1.5 text-[10px] text-slate-600">
            <Wifi className="w-3 h-3 text-emerald-600 shrink-0" />
            <span>Wi-Fi: <strong className="text-slate-800 font-semibold">{effectiveWifiName}</strong></span>
            <span>•</span>
            <span>Pass: <strong className="text-emerald-700 font-semibold font-mono">{effectiveWifiPass}</strong></span>
          </div>
        </div>

        {/* Footer actions (Hidden when printing) */}
        <div className="w-full flex items-center gap-2 mt-4 print-hide">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-950/20 active:scale-[0.98]"
          >
            <Printer className="w-4 h-4" />
            <span>Print Table Card</span>
          </button>
          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
