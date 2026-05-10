import { useEffect } from 'react';

function isNumberInput(element: EventTarget | null): HTMLInputElement | null {
  if (!(element instanceof HTMLElement)) {
    return null;
  }

  const input = element.closest('input[type="number"]');
  return input instanceof HTMLInputElement ? input : null;
}

export function usePreventNumberInputScroll() {
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      const input = isNumberInput(event.target);
      if (!input || document.activeElement !== input) {
        return;
      }

      input.blur();
    };

    window.addEventListener('wheel', handleWheel, { capture: true, passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel, true);
    };
  }, []);
}
