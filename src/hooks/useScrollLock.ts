import { useEffect } from 'react';

export function useScrollLock(isOpen: boolean) {
    useEffect(() => {
        if (isOpen) {
            // Save original style
            const originalStyle = window.getComputedStyle(document.body).overflow;
            // Prevent scrolling
            document.body.style.overflow = 'hidden';

            // Cleanup on unmount or when closed
            return () => {
                document.body.style.overflow = originalStyle;
            };
        }
    }, [isOpen]);
}
