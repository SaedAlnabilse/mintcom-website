import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Bot,
  User,
  Sparkles,
  ArrowRight,
  Package,
  ClipboardList,
  BarChart3,
  Zap,
  MessageCircle,
  Lightbulb
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  PAYMINT_KNOWLEDGE,
  GREETINGS,
  GREETINGS_AR,
  FALLBACK_RESPONSES,
  FALLBACK_RESPONSES_AR,
} from '../../data/chatbotKnowledge';
import type { KnowledgeEntry } from '../../data/chatbotKnowledge';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  navigationPath?: string;
  isTyping?: boolean;
}

interface SmartChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}


// Detect if text contains Arabic characters
function isArabicText(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

// Simple but effective fuzzy matching
function calculateRelevance(query: string, entry: KnowledgeEntry): number {
  const queryLower = query.toLowerCase().trim();
  const words = queryLower.split(/\s+/).filter(w => w.length > 2);

  let score = 0;

  // Check keywords (highest weight) - includes both EN and AR keywords
  for (const keyword of entry.keywords) {
    if (queryLower.includes(keyword.toLowerCase())) {
      score += 10;
    }
    for (const word of words) {
      if (keyword.toLowerCase().includes(word)) {
        score += 5;
      }
    }
  }

  // Check question text (both EN and AR)
  const questionLower = entry.question.toLowerCase();
  for (const word of words) {
    if (questionLower.includes(word)) {
      score += 3;
    }
  }
  if (entry.questionAr) {
    for (const word of words) {
      if (entry.questionAr.includes(word)) {
        score += 3;
      }
    }
  }

  // Check answer text (lower weight, both EN and AR)
  const answerLower = entry.answer.toLowerCase();
  for (const word of words) {
    if (answerLower.includes(word)) {
      score += 1;
    }
  }
  if (entry.answerAr) {
    for (const word of words) {
      if (entry.answerAr.includes(word)) {
        score += 1;
      }
    }
  }

  return score;
}

function findBestMatch(query: string): KnowledgeEntry | null {
  // Check for greetings first (EN and AR)
  const greetingPatterns = /^(hi|hello|hey|good morning|good afternoon|good evening|howdy|what's up|sup|مرحبا|مرحباً|أهلاً|أهلا|هاي|السلام عليكم|سلام|صباح الخير|مساء الخير|كيف حالك|كيفك|هلا)/i;
  if (greetingPatterns.test(query.trim())) {
    return null; // Will trigger greeting response
  }

  const scored = PAYMINT_KNOWLEDGE.map(entry => ({
    entry,
    score: calculateRelevance(query, entry)
  })).filter(item => item.score > 0);

  scored.sort((a, b) => b.score - a.score);

  if (scored.length > 0 && scored[0].score >= 5) {
    return scored[0].entry;
  }

  return null;
}

function getRelatedSuggestions(entry: KnowledgeEntry | null, defaultSuggestions: string[]): string[] {
  if (!entry) {
    return defaultSuggestions;
  }

  const suggestions: string[] = [];

  // Get related topics
  if (entry.relatedTopics) {
    for (const topic of entry.relatedTopics) {
      const related = PAYMINT_KNOWLEDGE.find(e => e.id === topic);
      if (related) {
        suggestions.push(related.question);
      }
    }
  }

  // Add category-related suggestions
  const sameCategory = PAYMINT_KNOWLEDGE.filter(
    e => e.category === entry.category && e.id !== entry.id
  ).slice(0, 2);

  for (const e of sameCategory) {
    if (!suggestions.includes(e.question)) {
      suggestions.push(e.question);
    }
  }

  return suggestions.slice(0, 3);
}

export function SmartChatbot({ isOpen, onClose }: SmartChatbotProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  const location = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (chatRef.current && !chatRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Get current location slug for navigation
  const currentLocationSlug = useMemo(() => {
    const match = location.pathname.match(/\/dashboard\/([^/]+)/);
    return match ? match[1] : null;
  }, [location.pathname]);

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const index = Math.floor(Math.random() * 3);
      const greeting = t(`chat.greetings.${index}`);
      setMessages([{
        id: '1',
        type: 'bot',
        content: greeting,
        timestamp: new Date(),
        suggestions: [
          t('chat.suggestions.0'),
          t('chat.suggestions.1'),
          t('chat.suggestions.2'),
          t('chat.suggestions.3')
        ]
      }]);
    }
  }, [isOpen, messages.length, t]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const processMessage = useCallback(async (userMessage: string) => {
    // Default suggestions for when no match is found
    const defaultSuggestions = [
      t('chat.suggestions.add_product'),
      t('chat.suggestions.view_orders'),
      t('chat.suggestions.manage_staff'),
      t('chat.suggestions.view_reports')
    ];

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate thinking delay for natural feel
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));

    // Check for greetings (EN and AR)
    const greetingPatterns = /^(hi|hello|hey|good morning|good afternoon|good evening|howdy|what's up|sup|yo|مرحبا|مرحباً|أهلاً|أهلا|هاي|السلام عليكم|سلام|صباح الخير|مساء الخير|كيف حالك|كيفك|هلا)$/i;
    if (greetingPatterns.test(userMessage.trim())) {
      // Detect if the user typed in Arabic or if locale is Arabic
      const useArabic = isArabicText(userMessage) || isRTL;
      const greetings = useArabic ? GREETINGS_AR : GREETINGS;
      const greeting = greetings[Math.floor(Math.random() * greetings.length)];
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: greeting,
        timestamp: new Date(),
        suggestions: defaultSuggestions
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
      return;
    }

    // Find best matching knowledge entry
    const match = findBestMatch(userMessage);

    let botResponse: Message;

    if (match) {
      // Resolve navigation path with current location
      let resolvedPath = match.navigationPath;
      if (resolvedPath && currentLocationSlug) {
        resolvedPath = resolvedPath.replace(':location', currentLocationSlug);
      }

      // Detect if user typed in Arabic or if locale is Arabic
      const useArabic = isArabicText(userMessage) || isRTL;
      const answer = useArabic && match.answerAr ? match.answerAr : match.answer;

      botResponse = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: answer,
        timestamp: new Date(),
        suggestions: getRelatedSuggestions(match, defaultSuggestions),
        navigationPath: resolvedPath
      };
    } else {
      // Fallback response - detect language
      const useArabic = isArabicText(userMessage) || isRTL;
      const fallbacks = useArabic ? FALLBACK_RESPONSES_AR : FALLBACK_RESPONSES;
      const fallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      botResponse = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: fallback,
        timestamp: new Date(),
        suggestions: [
          t('chat.suggestions.get_started'),
          t('chat.suggestions.add_product'),
          t('chat.suggestions.view_orders'),
          t('chat.suggestions.contact_support')
        ]
      };
    }

    setMessages(prev => [...prev, botResponse]);
    setIsTyping(false);
  }, [currentLocationSlug, t, isRTL]);

  const handleSend = () => {
    if (input.trim() && !isTyping) {
      processMessage(input.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    processMessage(suggestion);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
          <motion.div
            ref={chatRef}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            dir={isRTL ? 'rtl' : 'ltr'}
            className={`fixed bottom-[100px] ${isRTL ? 'left-[30px]' : 'right-[30px]'} z-[999999] w-[400px] max-w-[calc(100vw-60px)] h-[600px] max-h-[calc(100vh-150px)] bg-white dark:bg-[#0F172A] rounded-3xl shadow-2xl border border-gray-200/50 dark:border-white/10 flex flex-col overflow-hidden`}
          >
          {/* Header */}
          <div className="relative px-5 py-4 bg-gradient-to-r from-[#7CC39F] to-[#5BA882] overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-black/5 rounded-full blur-xl" />
            </div>

            <div className="relative flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Bot size={24} className="text-white" />
                </div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center"
                >
                  <Sparkles size={10} className="text-yellow-800" />
                </motion.div>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg tracking-tight">{t('chat.botName')}</h3>
                <p className="text-white/80 text-xs font-medium">{t('chat.assistantTitle')}</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-2 max-w-[85%] ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${
                    message.type === 'user'
                      ? 'bg-gray-100 dark:bg-white/10'
                      : 'bg-[#7CC39F]/10'
                  }`}>
                    {message.type === 'user'
                      ? <User size={16} className="text-gray-600 dark:text-gray-300" />
                      : <Bot size={16} className="text-[#7CC39F]" />
                    }
                  </div>

                  {/* Message Content */}
                  <div className={`space-y-2 ${message.type === 'user' ? 'text-right' : ''}`}>
                    <div className={`inline-block px-4 py-3 rounded-2xl ${
                      message.type === 'user'
                        ? 'bg-[#7CC39F] text-black rounded-tr-sm'
                        : 'bg-gray-100 dark:bg-white/5 text-gray-800 dark:text-gray-200 rounded-tl-sm'
                    }`}>
                                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    </div>

                    {/* Navigation Button */}
                    {message.navigationPath && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleNavigate(message.navigationPath!)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#7CC39F]/10 hover:bg-[#7CC39F]/20 text-[#7CC39F] text-xs font-bold rounded-full transition-colors"
                      >
                        <Zap size={12} />
                        {t('chat.navigation.takeMe')}
                        <ArrowRight size={12} className={isRTL ? 'rotate-180' : ''} />
                      </motion.button>
                    )}

                    {/* Suggestions */}
                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {message.suggestions.map((suggestion, index) => (
                          <motion.button
                            key={index}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="px-3 py-1.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-full hover:border-[#7CC39F] hover:text-[#7CC39F] transition-colors"
                          >
                            {suggestion}
                          </motion.button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#7CC39F]/10 flex items-center justify-center">
                    <Bot size={16} className="text-[#7CC39F]" />
                  </div>
                  <div className="px-4 py-3 bg-gray-100 dark:bg-white/5 rounded-2xl rounded-tl-sm">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                          className="w-2 h-2 bg-[#7CC39F] rounded-full"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          <div className="px-4 py-2 border-t border-gray-100 dark:border-white/5">
            <div className="flex gap-2 overflow-x-auto scrollbar-none">
              {[
                { icon: <Package size={14} />, label: t('chat.actions.products'), query: t('chat.queries.howToAddProduct') },
                { icon: <ClipboardList size={14} />, label: t('chat.actions.orders'), query: t('chat.queries.whereAreOrders') },
                { icon: <BarChart3 size={14} />, label: t('chat.actions.reports'), query: t('chat.queries.showMeReports') },
                { icon: <Lightbulb size={14} />, label: t('chat.actions.tips'), query: t('chat.queries.giveMeTips') },
              ].map((action, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSuggestionClick(action.query)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-white/5 hover:bg-[#7CC39F]/10 text-gray-600 dark:text-gray-400 hover:text-[#7CC39F] text-xs font-bold rounded-full transition-colors"
                >
                  {action.icon}
                  {action.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 bg-gray-50 dark:bg-white/[0.02] border-t border-gray-100 dark:border-white/5">
            <div className="flex gap-2 items-center">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('chat.inputPlaceholder')}
                  disabled={isTyping}
                  className="w-full px-4 py-3 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 rounded-2xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7CC39F]/30 focus:border-[#7CC39F] transition-all disabled:opacity-50"
                />
                <MessageCircle size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className={`w-12 h-12 bg-[#7CC39F] hover:brightness-110 disabled:opacity-50 disabled:hover:brightness-100 text-black rounded-2xl flex items-center justify-center transition-all shadow-lg shadow-[#7CC39F]/30 ${isRTL ? 'rotate-180' : ''}`}
              >
                <Send size={18} />
              </motion.button>
            </div>
            <p className="text-center text-[10px] text-gray-400 mt-2">
              {t('chat.poweredBy')}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
