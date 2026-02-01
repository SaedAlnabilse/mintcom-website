import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Bot, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ChatWidgetEnhancer = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [showBubble, setShowBubble] = useState(true);
    const [isWidgetLoaded, setIsWidgetLoaded] = useState(false);
    const location = useLocation();

    // Reset bubble on route change
    useEffect(() => {
        if (!isOpen) {
            setShowBubble(true);
        }
    }, [location.pathname, isOpen]);

    useEffect(() => {
        // 1. Check if widget is loaded and handle entrance animation
        const checkWidget = () => {
            const iframe = document.querySelector('iframe[src*="sa3d100-paymint-test.hf.space"]') as HTMLIFrameElement;
            if (iframe) {
                // Handle manual fade-in to avoid CSS animation resets
                if (!iframe.dataset.hasFadedIn) {
                    iframe.style.opacity = '0';
                    iframe.style.transition = 'opacity 0.5s ease';

                    // Force reflow
                    void iframe.offsetWidth;

                    iframe.style.opacity = '1';
                    iframe.dataset.hasFadedIn = 'true';
                }
                setIsWidgetLoaded(true);
            } else {
                setIsWidgetLoaded(false);
            }
        };

        // Initial check
        checkWidget();

        // Poll for it briefly - keep polling to detect if it disappears
        const interval = setInterval(checkWidget, 500);

        // 2. Move the iframe using CSS injection to override inline styles
        // We removed the CSS animation to prevent the widget from disappearing (resetting to opacity 0)
        // when its style/dimensions change upon opening.
        const style = document.createElement('style');
        style.innerHTML = `
            iframe[src*="sa3d100-paymint-test.hf.space"] {
                right: 30px !important;
                bottom: 30px !important;
            }
        `;
        document.head.appendChild(style);

        // 3. Listen for open/close events from the widget to toggle bubble visibility
        const handleMessage = (event: MessageEvent) => {
            if (event.data.type === 'chat-open') {
                setIsOpen(true);
                setShowBubble(false);
            } else if (event.data.type === 'chat-closed') {
                setIsOpen(false);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => {
            clearInterval(interval);
            document.head.removeChild(style);
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    const closeBubble = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowBubble(false);
    };

    return (
        <AnimatePresence mode='wait'>
            {isWidgetLoaded && !isOpen && showBubble && (
                <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0 } }}
                    transition={{ duration: 0.5, delay: 1.5 }}
                    className="fixed bottom-[130px] right-[40px] z-[999998] max-w-[280px]"
                >
                    <div className="bg-white dark:bg-[#1E293B] p-4 rounded-t-2xl rounded-bl-2xl rounded-br-sm shadow-xl border border-gray-100 dark:border-white/10 relative group cursor-pointer" onClick={() => {
                        // Attempt to open chat by clicking bubble? 
                        // We can't easily click into the iframe, but we can catch the user's attention.
                        // Ideally we would send a postMessage to open it, but the widget.js might not listen for it.
                    }}>
                        {/* Close button */}
                        <button
                            onClick={closeBubble}
                            className="absolute -top-2 -left-2 bg-gray-100 dark:bg-white/10 p-1 rounded-full text-gray-400 hover:text-paymint-red hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100"
                        >
                            <X size={12} />
                        </button>

                        <div className="flex gap-4 items-start">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-paymint-green to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-paymint-green/20">
                                <Bot className="text-white" size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-gray-900 dark:text-white mb-1">
                                    Hi! I'm here to help...
                                </h4>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 leading-relaxed">
                                    Do you have any questions?
                                </p>
                            </div>
                        </div>

                        {/* Speech Bubble Pointer */}
                        <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white dark:bg-[#1E293B] transform rotate-45 border-b border-r border-gray-100 dark:border-white/10" />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
