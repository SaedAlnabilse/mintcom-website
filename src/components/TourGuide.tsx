import { useCallback, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface TourStep {
  targetId: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface TourGuideProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const TOOLTIP_TARGET_WIDTH = 420;
const TOOLTIP_PADDING = 20;
const HIGHLIGHT_PADDING = 12;

export const TourGuide = ({ steps, isOpen, onClose, onComplete }: TourGuideProps) => {
  const { t } = useTranslation();
  const isRTL = t('common.locale') === 'ar';
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipHeight, setTooltipHeight] = useState(200);
  const [tooltipWidth, setTooltipWidth] = useState(TOOLTIP_TARGET_WIDTH);

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;

  // Ref to measure tooltip dimensions
  const tooltipRef = useCallback((node: HTMLDivElement | null) => {
    if (node !== null) {
      const rect = node.getBoundingClientRect();
      setTooltipHeight(rect.height);
      setTooltipWidth(rect.width);
    }
  }, []);

  // Function to update the target element's position
  const updateTargetPosition = useCallback(() => {
    if (!isOpen) return;

    const element = document.getElementById(currentStep?.targetId);
    if (element) {
      // Scroll element into view if needed with some padding
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
    }
  }, [isOpen, currentStep?.targetId]);

  // Update position on step change, resize, or scroll
  useLayoutEffect(() => {
    requestAnimationFrame(() => updateTargetPosition());
    window.addEventListener('resize', updateTargetPosition);
    window.addEventListener('scroll', updateTargetPosition, true);

    const timer = setTimeout(updateTargetPosition, 100);

    return () => {
      window.removeEventListener('resize', updateTargetPosition);
      window.removeEventListener('scroll', updateTargetPosition, true);
      clearTimeout(timer);
    };
  }, [updateTargetPosition]);

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStepIndex(prev => Math.max(0, prev - 1));
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div id="mintcom-tour-guide-active" className="fixed inset-0 z-[9999] overflow-hidden font-sans">
          {/* Backdrop with cutout using SVG mask */}
          <div className="absolute inset-0 w-full h-full pointer-events-none">
            {targetRect && (
              <svg className="w-full h-full">
                <defs>
                  <mask id="tour-mask" x="0" y="0" width="100%" height="100%">
                    <rect x="0" y="0" width="100%" height="100%" fill="white" />
                    <rect
                      x={targetRect.left - HIGHLIGHT_PADDING}
                      y={targetRect.top - HIGHLIGHT_PADDING}
                      width={targetRect.width + (HIGHLIGHT_PADDING * 2)}
                      height={targetRect.height + (HIGHLIGHT_PADDING * 2)}
                      rx="20"
                      fill="black"
                    />
                  </mask>
                </defs>
                <rect
                  x="0"
                  y="0"
                  width="100%"
                  height="100%"
                  fill="rgba(0,0,0,0.6)"
                  mask="url(#tour-mask)"
                />
                {/* Highlight Border */}
                <rect
                  x={targetRect.left - HIGHLIGHT_PADDING}
                  y={targetRect.top - HIGHLIGHT_PADDING}
                  width={targetRect.width + (HIGHLIGHT_PADDING * 2)}
                  height={targetRect.height + (HIGHLIGHT_PADDING * 2)}
                  rx="20"
                  fill="none"
                  stroke="#00D084" // mintcom-green
                  strokeWidth="2"
                  className="animate-pulse"
                />
              </svg>
            )}
            {!targetRect && <div className="absolute inset-0 bg-black/60" />}
          </div>

          {/* Interactive Tooltip Card */}
          {targetRect && (
            <motion.div
              ref={tooltipRef}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              key={currentStepIndex}
              dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}
              className="absolute z-[10000] w-[420px] max-w-[calc(100vw-40px)] bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 p-5"
              style={{
                // Enhanced positioning logic
                top: (() => {
                  if (currentStep.position === 'left' || currentStep.position === 'right') {
                    return Math.min(Math.max(TOOLTIP_PADDING, targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2)), window.innerHeight - tooltipHeight - TOOLTIP_PADDING);
                  }
                  
                  const pos = currentStep.position as string;
                  const targetBottom = targetRect.bottom + tooltipHeight + TOOLTIP_PADDING + HIGHLIGHT_PADDING;
                  const showAtTop = pos === 'top' || 
                                   (pos !== 'left' && 
                                    pos !== 'right' && 
                                    !(targetBottom < window.innerHeight));
                  
                  if (showAtTop) {
                    return Math.max(TOOLTIP_PADDING, targetRect.top - tooltipHeight - HIGHLIGHT_PADDING - 12);
                  }
                  
                  return targetRect.bottom + HIGHLIGHT_PADDING + 12;
                })(),
                left: (() => {
                  if (currentStep.position === 'left') {
                    return Math.max(TOOLTIP_PADDING, targetRect.left - tooltipWidth - HIGHLIGHT_PADDING - 20);
                  }
                  if (currentStep.position === 'right') {
                    return Math.min(window.innerWidth - tooltipWidth - TOOLTIP_PADDING, targetRect.right + HIGHLIGHT_PADDING + 20);
                  }
                  // Default, 'top', or 'bottom'
                  return Math.min(Math.max(TOOLTIP_PADDING, targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2)), window.innerWidth - tooltipWidth - TOOLTIP_PADDING);
                })()
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 text-mintcom-green">
                  <HelpCircle size={18} />
                  <span className="text-xs font-sans font-bold">{t('common.guide')}</span>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <h3 className="text-lg font-sans font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                {currentStep.title}
              </h3>

              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium leading-relaxed">
                {currentStep.description}
              </p>

              <div className="flex items-center justify-between mt-auto">
                <div className="flex gap-1">
                  {steps.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentStepIndex ? 'w-6 bg-mintcom-green' : 'w-1.5 bg-gray-200 dark:bg-white/10'
                        }`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  {currentStepIndex > 0 && (
                    <button
                      onClick={handleBack}
                      className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                    >
                      {isRTL ? null : <ChevronLeft size={20} />}
                      {/* Back button logic in RTL: Arrow on Left means Text on Right, but here it's just an icon. 
                          If it's just an icon, standard RTL behavior is to flip the icon direction if it's a directional arrow. 
                          Wait, original was <ChevronLeft size={20} />. 
                          In RTL, a back arrow should point Right. So <ChevronRight />. 
                      */}
                      {isRTL ? <ChevronRight size={20} /> : null}
                    </button>
                  )}
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-2 px-4 py-2 bg-mintcom-green text-black font-bold text-sm rounded-xl hover:bg-mintcom-green/90 transition-all shadow-lg shadow-mintcom-green/20"
                  >
                    {isRTL && !isLastStep && <ChevronLeft size={16} />}
                    {isLastStep ? t('common.finish') : t('common.next')}
                    {!isRTL && !isLastStep && <ChevronRight size={16} />}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

