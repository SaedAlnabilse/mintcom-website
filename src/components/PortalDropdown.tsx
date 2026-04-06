import { useRef, useEffect, useLayoutEffect, useState, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface PortalDropdownProps {
    isOpen: boolean;
    onClose: () => void;
    triggerRef: React.RefObject<HTMLElement | null>;
    children: ReactNode;
    className?: string;
    maxHeight?: string;
    width?: string;
    align?: 'left' | 'right';
    offset?: number;
}

export function PortalDropdown({
    isOpen,
    onClose,
    triggerRef,
    children,
    className = '',
    maxHeight = 'max-h-60',
    width = 'w-48',
    align = 'left',
    offset = 8
}: PortalDropdownProps) {
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [style, setStyle] = useState<React.CSSProperties>({
        opacity: 0,
        pointerEvents: 'none',
        position: 'fixed'
    });
    const [shouldGoUp, setShouldGoUp] = useState(false);

    const updatePosition = useCallback(() => {
        if (!triggerRef.current) return;

        const rect = triggerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const dropdownHeight = 240; // Approximate max height

        const up = spaceBelow < dropdownHeight && rect.top > spaceBelow;
        setShouldGoUp(up);

        const newStyle: React.CSSProperties = {
            position: 'fixed',
            zIndex: 9999,
            opacity: 1,
            pointerEvents: 'auto'
        };

        if (align === 'left') {
            newStyle.left = rect.left;
        } else {
            newStyle.right = window.innerWidth - rect.right;
        }

        if (up) {
            newStyle.bottom = window.innerHeight - rect.top + offset;
            newStyle.top = 'auto';
        } else {
            newStyle.top = rect.bottom + offset;
            newStyle.bottom = 'auto';
        }

        setStyle(newStyle);
    }, [triggerRef, align, offset]);

    useLayoutEffect(() => {
        if (isOpen) {
            updatePosition();
        }
    }, [isOpen, updatePosition]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                triggerRef.current &&
                !triggerRef.current.contains(event.target as Node) &&
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside, true);
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside, true);
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isOpen, onClose, updatePosition, triggerRef]);

    const dropdownContent = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={dropdownRef}
                    initial={{ opacity: 0, y: shouldGoUp ? 4 : -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: shouldGoUp ? 4 : -4 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    style={style}
                    className={`bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden ${width} ${maxHeight} ${className}`}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );

    if (typeof document === 'undefined') return null;

    return createPortal(dropdownContent, document.body);
}
