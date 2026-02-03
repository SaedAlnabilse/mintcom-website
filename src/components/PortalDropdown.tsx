import { useRef, useEffect, useLayoutEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface PortalDropdownProps {
    isOpen: boolean;
    onClose: () => void;
    triggerRef: React.RefObject<HTMLElement | null>;
    children: ReactNode;
    className?: string;
    maxHeight?: string;
}

export function PortalDropdown({
    isOpen,
    onClose,
    triggerRef,
    children,
    className = '',
    maxHeight = 'max-h-60'
}: PortalDropdownProps) {
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [style, setStyle] = useState<React.CSSProperties>({
        opacity: 0,
        pointerEvents: 'none',
        position: 'fixed'
    });

    const updatePosition = () => {
        if (!triggerRef.current) return;

        const rect = triggerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const dropdownHeight = 240; // Approximate max height

        const shouldGoUp = spaceBelow < dropdownHeight && rect.top > spaceBelow;

        setStyle({
            position: 'fixed',
            left: rect.left,
            width: rect.width,
            top: shouldGoUp ? 'auto' : rect.bottom + 8,
            bottom: shouldGoUp ? window.innerHeight - rect.top + 8 : 'auto',
            zIndex: 9999,
            opacity: 1,
            pointerEvents: 'auto'
        });
    };

    useLayoutEffect(() => {
        if (isOpen) {
            updatePosition();
        }
    }, [isOpen]);

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
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isOpen, onClose]);

    const dropdownContent = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={dropdownRef}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    style={style}
                    className={`bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden ${maxHeight} ${className}`}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );

    if (typeof document === 'undefined') return null;

    return createPortal(dropdownContent, document.body);
}
