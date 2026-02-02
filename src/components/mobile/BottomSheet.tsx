import { useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showHandle?: boolean;
  height?: 'auto' | 'half' | 'full';
  showCloseButton?: boolean;
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  showHandle = true,
  height = 'auto',
  showCloseButton = true,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.velocity.y > 500 || info.offset.y > 100) {
      onClose();
    }
  };

  const getHeightClass = () => {
    switch (height) {
      case 'full':
        return 'h-[90vh]';
      case 'half':
        return 'h-[50vh]';
      default:
        return 'max-h-[85vh]';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            className={`fixed bottom-0 left-0 right-0 z-[101] bg-white dark:bg-paymint-surface rounded-t-3xl shadow-2xl flex flex-col ${getHeightClass()}`}
            style={{ touchAction: 'none' }}
          >
            {/* Handle bar (drag indicator) */}
            {showHandle && (
              <div
                className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
                onPointerDown={(e) => dragControls.start(e)}
              >
                <div className="w-10 h-1 bg-gray-300 dark:bg-white/20 rounded-full" />
              </div>
            )}

            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-white/5">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {title || ''}
                </h3>
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="p-2 -mr-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors touch-target"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-safe">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
