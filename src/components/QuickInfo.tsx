import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';

export function QuickInfo({ text }: { text: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const iconRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top - 8, // Position above the icon
        left: rect.left + rect.width / 2
      });
    }
  };

  const handleMouseEnter = () => {
    updatePosition();
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  useEffect(() => {
    if (isVisible) {
      // Update position on scroll to prevent detachment
      const handleScroll = () => {
        updatePosition();
      };
      // Capture capture phase to handle scrolling of parent containers
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleScroll);
      
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleScroll);
      };
    }
  }, [isVisible]);

  return (
    <>
      <div
        ref={iconRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-flex items-center justify-center ml-1.5 align-middle cursor-help text-gray-400 dark:text-gray-500 hover:text-mintcom-green transition-colors group"
      >
        <Info size={14} />
      </div>
      {isVisible && createPortal(
        <div
          className="fixed z-[9999] w-48 p-2.5 bg-gray-900 dark:bg-white text-white dark:text-black text-xs font-bold text-center rounded-xl shadow-2xl pointer-events-none leading-relaxed tracking-wide animate-in fade-in zoom-in-95 duration-150"
          style={{
            top: coords.top,
            left: coords.left,
            transform: 'translate(-50%, -100%)'
          }}
        >
          {text}
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-white"></div>
        </div>,
        document.body
      )}
    </>
  );
}

