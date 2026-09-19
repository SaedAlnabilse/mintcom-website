import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';

export function QuickInfo({ text }: { text: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const iconRef = useRef<HTMLButtonElement>(null);

  const updatePosition = () => {
    if (iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      const tooltipWidth = 208;
      const halfWidth = tooltipWidth / 2;
      let left = rect.left + rect.width / 2;
      const padding = 12;

      if (typeof window !== 'undefined') {
        if (left - halfWidth < padding) {
          left = halfWidth + padding;
        } else if (left + halfWidth > window.innerWidth - padding) {
          left = window.innerWidth - halfWidth - padding;
        }
      }

      setCoords({
        top: Math.max(padding, rect.top - 8),
        left,
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

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updatePosition();
    setIsVisible((prev) => !prev);
  };

  useEffect(() => {
    if (isVisible) {
      // Update position on scroll to prevent detachment
      const handleScroll = () => {
        updatePosition();
      };
      const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
        if (iconRef.current && !iconRef.current.contains(e.target as Node)) {
          setIsVisible(false);
        }
      };
      // Capture capture phase to handle scrolling of parent containers
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleScroll);
      document.addEventListener('click', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);

      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleScroll);
        document.removeEventListener('click', handleOutsideClick);
        document.removeEventListener('touchstart', handleOutsideClick);
      };
    }
  }, [isVisible]);

  return (
    <>
      <button
        ref={iconRef}
        type="button"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        aria-label="Info"
        className="inline-flex items-center justify-center ms-1.5 shrink-0 align-middle cursor-help text-stone-400 dark:text-zinc-500 hover:text-mintcom-green transition-colors group p-0.5 rounded focus:outline-none focus-visible:ring-1 focus-visible:ring-mintcom-green"
      >
        <Info size={14} />
      </button>
      {isVisible && typeof document !== 'undefined' && createPortal(
        <div
          role="tooltip"
          className="fixed z-[999999] w-52 p-2.5 bg-stone-900 dark:bg-white text-white dark:text-black text-xs font-bold text-center rounded-xl shadow-md pointer-events-none leading-relaxed tracking-wide animate-in fade-in zoom-in-95 duration-150"
          style={{
            top: coords.top,
            left: coords.left,
            transform: 'translate(-50%, -100%)',
          }}
        >
          {text}
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-stone-900 dark:border-t-white"></div>
        </div>,
        document.body
      )}
    </>
  );
}

