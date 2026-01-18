import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        // 1. Scroll main window
        window.scrollTo(0, 0);

        // 2. Clear any scrolling containers in layouts
        // We look for common layout container classes or just scroll all overflow-y-auto elements
        const scrollContainers = document.querySelectorAll('.overflow-y-auto');
        scrollContainers.forEach(container => {
            container.scrollTo(0, 0);
        });
    }, [pathname]);

    return null;
}
