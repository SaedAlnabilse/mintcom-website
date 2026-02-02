import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Star, CheckCircle2 } from 'lucide-react';

export const FeedbackWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isVisible, setIsVisible] = useState(true);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setIsSubmitting(false);
        setIsSubmitted(true);
        
        // Reset and close after a delay
        setTimeout(() => {
            setIsOpen(false);
            // After modal closes, hide the tab entirely
            setTimeout(() => {
                setIsVisible(false);
            }, 300);
        }, 3000);
    };

    if (!isVisible && !isOpen) return null;

    return (
        <>
            {/* 1. Vertical Feedback Tab (Side Sticky) */}
            <AnimatePresence>
                {!isOpen && isVisible && (
                    <motion.button
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 100, opacity: 0 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed right-0 top-[40%] -translate-y-1/2 z-[9998] bg-white dark:bg-[#1E293B] border-y border-l border-gray-200 dark:border-white/10 py-4 px-2 rounded-l-2xl shadow-[-5px_0_15px_rgba(0,0,0,0.05)] hover:bg-gray-50 dark:hover:bg-white/5 transition-all flex flex-col items-center gap-3 group ring-1 ring-black/5"
                    >
                        <MessageSquare size={18} className="text-paymint-green group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-black text-gray-800 dark:text-gray-100 tracking-widest uppercase [writing-mode:vertical-rl] rotate-180">Feedback</span>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* 2. Feedback Side Drawer */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop (Invisible/Transparent to allow clicking behind? Or standard dim?) 
                            The user said "interact with everything", so we should make the backdrop pointer-events-none 
                            or remove it entirely so they can see the screen. 
                            Let's use a clear backdrop that closes on click but lets you see.
                        */}
                        <div className="fixed inset-0 z-[9999]" onClick={() => setIsOpen(false)} />
                        
                        <motion.div
                            initial={{ x: '100%', opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: '100%', opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 h-full w-[350px] bg-white dark:bg-[#0F172A] shadow-[-10px_0_30px_rgba(0,0,0,0.1)] border-l border-gray-200 dark:border-white/10 z-[10000] flex flex-col"
                            onClick={(e) => e.stopPropagation()} // Prevent click from closing when clicking inside drawer
                        >
                            {/* Drawer Header */}
                            <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.02]">
                                <div>
                                    <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Feedback</h3>
                                    <p className="text-xs font-bold text-gray-500 mt-1">Help us improve</p>
                                </div>
                                <button 
                                    onClick={() => setIsOpen(false)} 
                                    className="p-2 bg-gray-100 dark:bg-white/5 rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                                {isSubmitted ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                                        <div className="w-16 h-16 bg-paymint-green/10 text-paymint-green rounded-2xl flex items-center justify-center shadow-inner">
                                            <CheckCircle2 size={32} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-black text-gray-900 dark:text-white">Sent!</h4>
                                            <p className="text-xs font-medium text-gray-500 mt-2 leading-relaxed max-w-[200px] mx-auto">
                                                Thanks for helping us build a better product.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Rate Experience</label>
                                            <div className="flex justify-between gap-2">
                                                {[1, 2, 3, 4, 5].map((s) => (
                                                    <button
                                                        key={s}
                                                        type="button"
                                                        onClick={() => setRating(s)}
                                                        className={`flex-1 aspect-square rounded-xl flex items-center justify-center transition-all duration-200 ${
                                                            rating >= s 
                                                            ? 'bg-paymint-green text-black shadow-md shadow-paymint-green/20' 
                                                            : 'bg-gray-50 dark:bg-white/5 text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'
                                                        }`}
                                                    >
                                                        <Star size={20} fill={rating >= s ? "currentColor" : "none"} strokeWidth={2.5} />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Comments</label>
                                            <textarea
                                                required
                                                value={comment}
                                                onChange={(e) => setComment(e.target.value)}
                                                rows={6}
                                                className="w-full px-4 py-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all resize-none placeholder-gray-400"
                                                placeholder="What can we do better?"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={!rating || !comment || isSubmitting}
                                            className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-xs tracking-[0.15em] uppercase shadow-lg hover:opacity-90 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                                        >
                                            {isSubmitting ? (
                                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <Send size={14} />
                                                    Send Feedback
                                                </>
                                            )}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};
