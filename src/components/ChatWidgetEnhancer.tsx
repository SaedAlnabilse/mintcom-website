import { useState } from 'react';
import { DualLauncher } from './Chat/DualLauncher';
import { FAQModal } from './Chat/FAQModal';
import { SmartChatbot } from './Chat/SmartChatbot';
import { TasksModal } from './Chat/TasksModal';

export const ChatWidgetEnhancer = () => {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isFAQOpen, setIsFAQOpen] = useState(false);
    const [isTasksOpen, setIsTasksOpen] = useState(false);

    const handleOpenChat = () => {
        setIsChatOpen(true);
        setIsFAQOpen(false);
        setIsTasksOpen(false);
    };

    const handleOpenFAQ = () => {
        setIsFAQOpen(true);
        setIsChatOpen(false);
        setIsTasksOpen(false);
    };

    const handleOpenTasks = () => {
        setIsTasksOpen(true);
        setIsChatOpen(false);
        setIsFAQOpen(false);
    };

    const handleCloseAll = () => {
        setIsChatOpen(false);
        setIsFAQOpen(false);
        setIsTasksOpen(false);
    };

    return (
        <>
            <DualLauncher
                onOpenChat={handleOpenChat}
                onOpenFAQ={handleOpenFAQ}
                onOpenTasks={handleOpenTasks}
                isChatOpen={isChatOpen}
                isFAQOpen={isFAQOpen}
                isTasksOpen={isTasksOpen}
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
            <TasksModal
                isOpen={isTasksOpen}
                onClose={() => setIsTasksOpen(false)}
            />
        </>
    );
};
