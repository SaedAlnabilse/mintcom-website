import { useState } from 'react';
import { DualLauncher } from './Chat/DualLauncher';
import { FAQModal } from './Chat/FAQModal';
import { SmartChatbot } from './Chat/SmartChatbot';

export const ChatWidgetEnhancer = () => {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isFAQOpen, setIsFAQOpen] = useState(false);

    const handleOpenChat = () => {
        setIsChatOpen(true);
        setIsFAQOpen(false);
    };

    const handleOpenFAQ = () => {
        setIsFAQOpen(true);
        setIsChatOpen(false);
    };

    const handleCloseAll = () => {
        setIsChatOpen(false);
        setIsFAQOpen(false);
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
            <SmartChatbot
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
            />
            <FAQModal
                isOpen={isFAQOpen}
                onClose={() => setIsFAQOpen(false)}
            />
        </>
    );
};
