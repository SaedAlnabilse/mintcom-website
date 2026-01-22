import { useState, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, HelpCircle } from 'lucide-react';

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

export const TourGuide = ({ steps, isOpen, onClose, onComplete }: TourGuideProps) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;

  // Function to update the target element's position
  const updateTargetPosition = () => {
    if (!isOpen) return;

    const element = document.getElementById(currentStep?.targetId);
    if (element) {
      // Scroll element into view if needed with some padding
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
    } else {
        // If element not found, move to next step or nullify
        // console.warn(`Tour target #${currentStep?.targetId} not found`);
    }
  };

  // Update position on step change, resize, or scroll
  useLayoutEffect(() => {
    updateTargetPosition();
    window.addEventListener('resize', updateTargetPosition);
    window.addEventListener('scroll', updateTargetPosition, true); // true for capture phase to catch all scrolls

    // Small timeout to allow for any layout shifts/animations to finish
    const timer = setTimeout(updateTargetPosition, 100);

    return () => {
      window.removeEventListener('resize', updateTargetPosition);
      window.removeEventListener('scroll', updateTargetPosition, true);
      clearTimeout(timer);
    };
  }, [currentStepIndex, isOpen, currentStep?.targetId]);

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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] overflow-hidden">
          {/* Backdrop with cutout using SVG mask */}
          <div className="absolute inset-0 w-full h-full pointer-events-none">
             {targetRect && (
                 <svg className="w-full h-full">
                     <defs>
                         <mask id="tour-mask" x="0" y="0" width="100%" height="100%">
                             <rect x="0" y="0" width="100%" height="100%" fill="white" />
                             <rect
                                x={targetRect.left - 8}
                                y={targetRect.top - 8}
                                width={targetRect.width + 16}
                                height={targetRect.height + 16}
                                rx="12"
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
                        x={targetRect.left - 8}
                        y={targetRect.top - 8}
                        width={targetRect.width + 16}
                        height={targetRect.height + 16}
                        rx="12"
                        fill="none"
                        stroke="#00D084" // paymint-green
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
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              key={currentStepIndex}
              className="absolute z-[101] w-80 bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 p-5"
              style={{
                // Simple positioning logic - can be enhanced with Popper.js if needed
                top: targetRect.bottom + 20 < window.innerHeight - 200
                     ? targetRect.bottom + 20
                     : targetRect.top - 200, // Flip to top if not enough space below
                left: Math.min(Math.max(20, targetRect.left + (targetRect.width / 2) - 160), window.innerWidth - 340)
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 text-paymint-green">
                    <HelpCircle size={18} />
                    <span className="text-xs font-black uppercase tracking-widest">Guide</span>
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                    <X size={16} />
                </button>
              </div>

              <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2 leading-tight">
                {currentStep.title}
              </h3>

              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                {currentStep.description}
              </p>

              <div className="flex items-center justify-between mt-auto">
                <div className="flex gap-1">
                  {steps.map((_, idx) => (
                    <div
                        key={idx}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                            idx === currentStepIndex ? 'w-6 bg-paymint-green' : 'w-1.5 bg-gray-200 dark:bg-white/10'
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
                      <ChevronLeft size={20} />
                    </button>
                  )}
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-2 px-4 py-2 bg-paymint-green text-black font-bold text-sm rounded-xl hover:bg-paymint-green/90 transition-all shadow-lg shadow-paymint-green/20"
                  >
                    {isLastStep ? 'Finish' : 'Next'}
                    {!isLastStep && <ChevronRight size={16} />}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
};
