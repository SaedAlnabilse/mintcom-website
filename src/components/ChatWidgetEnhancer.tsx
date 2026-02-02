import { useEffect, useState } from 'react';
import { DualLauncher } from './Chat/DualLauncher';
import { FAQModal } from './Chat/FAQModal';

export const ChatWidgetEnhancer = () => {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isFAQOpen, setIsFAQOpen] = useState(false);

    useEffect(() => {
        // 1. Listen for messages from the HF widget
        const handleMessage = (event: MessageEvent) => {
            if (event.origin.includes('hf.space')) {
                if (event.data.type === 'chat-open' || event.data.event === 'open') {
                    setIsChatOpen(true);
                    setIsFAQOpen(false);
                } else if (event.data.type === 'chat-closed' || event.data.event === 'close') {
                    setIsChatOpen(false);
                }
            }
        };

        window.addEventListener('message', handleMessage);

        // 2. Inject Styles for the "Transparent Overlay" strategy
        const style = document.createElement('style');
        style.innerHTML = `
            /* 
               TARGET: The Widget Launcher (Closed State - Collapsed Orb)
               Aligned with the Sparkles Orb at Bottom Right.
               IMPORTANT: pointer-events: none so the underlying React button receives the click to EXPAND the menu.
            */
            iframe[src*="hf.space"]:not([style*="height: 600px"]),
            iframe[src*="hf.space"][style*="height: 0"], 
            #gradio-chat-launcher,
            .gradio-chat-launcher {
                position: fixed !important;
                bottom: 24px !important;
                right: 24px !important;
                width: 50px !important;
                height: 50px !important;
                opacity: 0.001 !important;
                z-index: 9999999 !important;
                pointer-events: none !important; /* Let React handle the expand click */
                border: none !important;
                transform: none !important;
                border-radius: 9999px !important;
                display: block !important;
                transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            }

            /* 
               TARGET: The Widget Launcher (Expanded State)
               When the menu is expanded, the "Ask AI" button shifts to the left.
               We move the invisible overlay to match it and ENABLE clicks so it opens the chat.
               
               MEGA OVERLAY STRATEGY:
               We make it huge (300px wide) and anchor it to the left of the 'Help' button (approx 105px).
               This ensures it covers the 'Ask AI' button regardless of minor layout shifts.
            */
            body.launcher-expanded iframe[src*="hf.space"]:not([style*="height: 600px"]) {
                right: 105px !important; /* Starts to the left of the divider */
                width: 300px !important; /* Extends far left */
                height: 120px !important; /* Covers top/bottom well */
                bottom: 0px !important; /* Anchored to bottom edge */
                pointer-events: auto !important;
            }

            /* 
               TARGET: The Widget Window (Open State)
               Pops up from the bottom right.
            */
            body.chat-open iframe[src*="hf.space"] {
                position: fixed !important;
                bottom: 100px !important;
                right: 24px !important;
                width: 400px !important;
                max-width: 90vw !important;
                height: 600px !important;
                max-height: 80vh !important;
                opacity: 1 !important;
                z-index: 999999 !important;
                border-radius: 24px !important;
                box-shadow: 0 20px 50px -12px rgba(0, 0, 0, 0.25) !important;
                background: white !important;
                pointer-events: auto !important;
                display: block !important;
            }

            /* Hide the separate launcher button if it exists when chat is open */
            body.chat-open #gradio-chat-launcher,
            body.chat-open .gradio-chat-launcher {
                display: none !important;
                pointer-events: none !important;
            }

            /* 
               TARGET: FAQ Mode
               When FAQ is open, hide the widget completely to prevent interference.
            */
            body.faq-open iframe[src*="hf.space"],
            body.faq-open #gradio-chat-launcher {
                display: none !important;
                pointer-events: none !important;
            }
        `;
        document.head.appendChild(style);

        return () => {
            window.removeEventListener('message', handleMessage);
            document.head.removeChild(style);
            document.body.classList.remove('chat-open', 'faq-open');
        };
    }, []);

    // Sync body classes
    useEffect(() => {
        document.body.classList.toggle('chat-open', isChatOpen);
        document.body.classList.toggle('faq-open', isFAQOpen);
    }, [isChatOpen, isFAQOpen]);

    const handleOpenChat = () => {
        setIsChatOpen(true);
        
        // Try multiple selectors for the native launcher
        const selectors = [
            '#gradio-chat-launcher',
            '.gradio-chat-launcher',
            'button[aria-label="Open Chat"]',
            'button[aria-label="Open chat"]',
            '#hf-chat-launcher'
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element instanceof HTMLElement) {
                element.click();
                return; // Found and clicked
            }
        }
        
        // If not found in main DOM, checking if we can postMessage to iframe
        const iframe = document.querySelector('iframe[src*="hf.space"]') as HTMLIFrameElement;
        if (iframe?.contentWindow) {
            iframe.contentWindow.postMessage({ type: 'open-chat' }, '*');
        }
    };

    const handleOpenFAQ = () => {
        setIsFAQOpen(true);
        setIsChatOpen(false);
    };

    const handleCloseAll = () => {
        setIsChatOpen(false);
        setIsFAQOpen(false);
        const iframe = document.querySelector('iframe[src*="hf.space"]') as HTMLIFrameElement;
        if (iframe?.contentWindow) {
            iframe.contentWindow.postMessage({ type: 'close-chat' }, '*');
        }
    };

    return (
        <>
            <DualLauncher
                onOpenChat={handleOpenChat}
                onOpenFAQ={handleOpenFAQ}
                isChatOpen={isChatOpen}
                isFAQOpen={isFAQOpen}
                onCloseAll={handleCloseAll}
            />
            <FAQModal
                isOpen={isFAQOpen}
                onClose={() => setIsFAQOpen(false)}
            />
        </>
    );
};
