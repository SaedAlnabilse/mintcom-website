import { useState, useRef, useEffect, useMemo, useCallback, type ComponentType } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Building2,
  ClipboardList,
  CreditCard,
  Lightbulb,
  LayoutDashboard,
  MapPinned,
  MessageCircle,
  Package,
  Receipt,
  Send,
  Settings,
  Shield,
  ShoppingBag,
  Star,
  Store,
  Tag,
  User,
  Users,
  Wallet,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MintcomLeafIcon from '../../assets/small-logo.svg';
import { useAuth } from '../../context/AuthContext';
import type { KnowledgeEntry } from '../../data/chatbotKnowledge';
import type { ChatIconName, ResolvedChatAction } from './chatbotTypes';
import {
  buildKnowledgeActions,
  findBestMatch,
  getContextActions,
  getFallbackResponse,
  getGreetingMessage,
  getRelatedSuggestions,
  getSmallTalkResponse,
  isArabicText,
  isGreeting,
  isSmallTalk,
} from './chatbotEngine';
import { useChatPageContext } from '../../hooks/useChatPageContext';
import { resolveChatbotPageContext } from '../../data/chatbotPageContexts';
import { formatInputPlaceholder } from '../../utils/textCase';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  actions?: ResolvedChatAction[];
}

interface SmartChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

const ACTION_ICON_MAP: Record<ChatIconName, ComponentType<{ size?: number; className?: string }>> = {
  package: Package,
  clipboardList: ClipboardList,
  barChart3: BarChart3,
  lightbulb: Lightbulb,
  store: Store,
  creditCard: CreditCard,
  receipt: Receipt,
  users: Users,
  building2: Building2,
  mapPinned: MapPinned,
  tag: Tag,
  settings: Settings,
  shield: Shield,
  star: Star,
  shoppingBag: ShoppingBag,
  layoutDashboard: LayoutDashboard,
  wallet: Wallet,
};

function getCurrentLocationSlug(pathname: string): string | null {
  const match = pathname.match(/\/dashboard\/([^/]+)/);
  return match ? match[1] : null;
}

function getCurrentBrandSlug(pathname: string): string | null {
  const match = pathname.match(/\/brand\/([^/]+)/);
  return match ? match[1] : null;
}

export function SmartChatbot({ isOpen, onClose }: SmartChatbotProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  const location = useLocation();
  const { account, currentEstablishment } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeEntry, setActiveEntry] = useState<KnowledgeEntry | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const latestMessageRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  const chatContextOptions = useMemo(() => {
    const dashboardSlug = currentEstablishment?.establishmentLoginId || currentEstablishment?.id;

    return {
      isAuthenticated: Boolean(account),
      dashboardPath: dashboardSlug ? `/dashboard/${dashboardSlug}` : '/select-establishment',
      canAccessOwnerPortal: Boolean(account && !account.isSecondaryAdmin),
    };
  }, [account, currentEstablishment?.establishmentLoginId, currentEstablishment?.id]);

  const pageContext = useChatPageContext(location.pathname, isRTL, chatContextOptions);

  const navigationContext = useMemo(
    () => ({
      pathname: location.pathname,
      currentLocationSlug: getCurrentLocationSlug(location.pathname),
      currentBrandSlug: getCurrentBrandSlug(location.pathname),
      pageContextId: pageContext.id,
    }),
    [location.pathname, pageContext.id],
  );

  const quickActions = useMemo(() => {
    if (!activeEntry) {
      return pageContext.quickActions;
    }

    const knowledgeActions = buildKnowledgeActions(activeEntry, navigationContext, isRTL);
    const actionIds = new Set(knowledgeActions.map((action) => action.id));

    return [...knowledgeActions, ...pageContext.quickActions.filter((action) => !actionIds.has(action.id))].slice(0, 4);
  }, [activeEntry, isRTL, navigationContext, pageContext.quickActions]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (chatRef.current && !chatRef.current.contains(event.target as Node)) {
        const isSwitcher = (event.target as Element).closest('#mintcom-launcher-switcher');
        if (!isSwitcher) {
          onClose();
        }
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          type: 'bot',
          content: getGreetingMessage(pageContext, isRTL),
          timestamp: new Date(),
          suggestions: pageContext.defaultSuggestions,
          actions: getContextActions(pageContext, 2),
        },
      ]);
    }
  }, [isOpen, isRTL, messages.length, pageContext]);

  useEffect(() => {
    if (messages.length === 0) {
      return;
    }

    const latestMessage = messages[messages.length - 1];

    if (latestMessage.type === 'bot') {
      latestMessageRef.current?.scrollIntoView({
        behavior: messages.length > 1 ? 'smooth' : 'auto',
        block: 'start',
      });
      return;
    }

    scrollToBottom(messages.length > 1 ? 'smooth' : 'auto');
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 300);
    const scrollTimer = window.setTimeout(() => scrollToBottom('auto'), 350);

    return () => {
      window.clearTimeout(focusTimer);
      window.clearTimeout(scrollTimer);
    };
  }, [isOpen, scrollToBottom]);

  const handleNavigate = useCallback(
    (path: string, state?: Record<string, unknown>) => {
      navigate(path, state ? { state } : undefined);
      onClose();
    },
    [navigate, onClose],
  );

  const processMessage = useCallback(
    async (userMessage: string) => {
      const useArabic = isArabicText(userMessage) || isRTL;
      const localizedPageContext =
        useArabic === isRTL
          ? pageContext
          : resolveChatbotPageContext(location.pathname, useArabic, chatContextOptions);
      const defaultSuggestions = localizedPageContext.defaultSuggestions;

      const userMsg: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: userMessage,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setIsTyping(true);

      await new Promise((resolve) => window.setTimeout(resolve, 400 + Math.random() * 300));

      if (isGreeting(userMessage)) {
        setActiveEntry(null);
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            type: 'bot',
            content: getGreetingMessage(localizedPageContext, useArabic),
            timestamp: new Date(),
            suggestions: defaultSuggestions,
            actions: getContextActions(localizedPageContext, 2),
          },
        ]);
        setIsTyping(false);
        return;
      }

      if (isSmallTalk(userMessage)) {
        setActiveEntry(null);
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            type: 'bot',
            content: getSmallTalkResponse(localizedPageContext, useArabic),
            timestamp: new Date(),
            suggestions: defaultSuggestions,
            actions: getContextActions(localizedPageContext, 2),
          },
        ]);
        setIsTyping(false);
        return;
      }

      const contextualNavigation = {
        ...navigationContext,
        pageContextId: localizedPageContext.id,
      };

      const match = findBestMatch(userMessage, contextualNavigation);

      if (match) {
        setActiveEntry(match);

        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            type: 'bot',
            content: useArabic && match.answerAr ? match.answerAr : match.answer,
            timestamp: new Date(),
            suggestions: getRelatedSuggestions(match, defaultSuggestions, useArabic),
            actions: buildKnowledgeActions(match, contextualNavigation, useArabic),
          },
        ]);
      } else {
        setActiveEntry(null);

        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            type: 'bot',
            content: getFallbackResponse(localizedPageContext, useArabic),
            timestamp: new Date(),
            suggestions: defaultSuggestions,
            actions: getContextActions(localizedPageContext, 2),
          },
        ]);
      }

      setIsTyping(false);
    },
    [chatContextOptions, isRTL, location.pathname, navigationContext, pageContext],
  );

  const handleAction = useCallback(
    (action: ResolvedChatAction) => {
      if (action.type === 'navigate' && action.path) {
        handleNavigate(action.path, action.state);
        return;
      }

      if (action.type === 'ask' && action.query) {
        void processMessage(action.query);
      }
    },
    [handleNavigate, processMessage],
  );

  const handleSend = () => {
    if (input.trim() && !isTyping) {
      void processMessage(input.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderActionIcon = (iconName: ChatIconName, className?: string) => {
    const Icon = ACTION_ICON_MAP[iconName] ?? Lightbulb;
    return <Icon size={14} className={className} />;
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
          className={`fixed bottom-[100px] ${isRTL ? 'left-[30px]' : 'right-[30px]'} z-[950] flex h-[600px] max-h-[calc(100vh-150px)] w-[400px] max-w-[calc(100vw-60px)] flex-col overflow-hidden rounded-3xl border border-gray-200/50 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0F172A]`}
        >
          <div className="relative overflow-hidden bg-gradient-to-r from-[#7dc6a2] to-[#5BA882] px-5 py-4">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 blur-xl" />
              <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-black/5 blur-xl" />
            </div>

            <div className="relative flex items-center gap-3">
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center">
                  <img src={MintcomLeafIcon} alt="" className="h-10 w-10 scale-x-[-1] object-contain drop-shadow-md" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-tight text-white">{t('chat.botName')}</h3>
                <p className="text-xs font-medium text-white/80">{t('chat.assistantTitle')}</p>
                <p className="mt-0.5 text-[11px] font-medium text-white/80">{pageContext.title}</p>
              </div>
            </div>
          </div>

          <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-4">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                ref={message.id === messages[messages.length - 1]?.id ? latestMessageRef : null}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex max-w-[88%] gap-2 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center">
                    {message.type === 'user' ? (
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/10">
                        <User size={16} className="text-gray-600 dark:text-gray-300" />
                      </div>
                    ) : (
                      <img src={MintcomLeafIcon} alt="" className="h-7 w-7 scale-x-[-1] object-contain" />
                    )}
                  </div>

                  <div className={`space-y-2 ${message.type === 'user' ? 'text-right' : ''}`}>
                    <div
                      className={`inline-block rounded-2xl px-4 py-3 ${
                        message.type === 'user'
                          ? 'rounded-tr-sm bg-[#7dc6a2] text-black'
                          : 'rounded-tl-sm bg-gray-100 text-gray-800 dark:bg-white/5 dark:text-gray-200'
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                    </div>

                    {message.actions && message.actions.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {message.actions.map((action) => (
                          <motion.button
                            key={action.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleAction(action)}
                            className="inline-flex items-center gap-2 rounded-full bg-[#7dc6a2]/10 px-3 py-1.5 text-xs font-bold text-[#3C8E4C] transition-colors hover:bg-[#7dc6a2]/20"
                          >
                            {renderActionIcon(action.icon)}
                            <span>{action.label}</span>
                            {action.type === 'navigate' && (
                              <ArrowRight size={12} className={isRTL ? 'rotate-180' : ''} />
                            )}
                          </motion.button>
                        ))}
                      </div>
                    )}

                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {message.suggestions.map((suggestion, index) => (
                          <motion.button
                            key={`${message.id}-${index}`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => void processMessage(suggestion)}
                            className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:border-[#7dc6a2] hover:text-[#7dc6a2] dark:border-white/10 dark:bg-white/5 dark:text-gray-300"
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

            {isTyping && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                <div className="flex gap-2">
                  <div className="flex h-8 w-8 items-center justify-center">
                    <img src={MintcomLeafIcon} alt="" className="h-7 w-7 scale-x-[-1] object-contain" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-3 dark:bg-white/5">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                          className="h-2 w-2 rounded-full bg-[#7dc6a2]"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-gray-100 px-4 py-2 dark:border-white/5">
            <div className="scrollbar-none flex gap-2 overflow-x-auto">
              {quickActions.map((action) => (
                <motion.button
                  key={action.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleAction(action)}
                  className="flex flex-shrink-0 items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-600 transition-colors hover:bg-[#7dc6a2]/10 hover:text-[#7dc6a2] dark:bg-white/5 dark:text-gray-400"
                >
                  {renderActionIcon(action.icon)}
                  <span>{action.label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 bg-gray-50 p-4 dark:border-white/5 dark:bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  maxLength={255}
                  ref={inputRef}
                  dir={isRTL ? 'rtl' : 'ltr'}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={formatInputPlaceholder(t('chat.inputPlaceholder'), t('common.locale'))}
                  disabled={isTyping}
                  className={`w-full rounded-2xl border border-gray-200 bg-white py-3 text-sm text-gray-900 transition-all placeholder:text-gray-400 focus:border-[#7dc6a2] focus:outline-none focus:ring-2 focus:ring-[#7dc6a2]/30 disabled:opacity-50 dark:border-white/10 dark:bg-[#1E293B] dark:text-white ${
                    isRTL ? 'pl-10 pr-4 text-right' : 'pl-4 pr-10 text-left'
                  }`}
                />
                <MessageCircle
                  size={16}
                  className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${isRTL ? 'left-4' : 'right-4'}`}
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7dc6a2] text-black shadow-lg shadow-[#7dc6a2]/30 transition-all hover:brightness-110 disabled:opacity-50 disabled:hover:brightness-100 ${isRTL ? 'rotate-180' : ''}`}
              >
                <Send size={18} />
              </motion.button>
            </div>
            <p className="mt-2 text-center text-[10px] text-gray-400">{t('chat.poweredBy')}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
