import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  User,
  ArrowRight,
  Package,
  ClipboardList,
  BarChart3,
  Zap,
  MessageCircle,
  Lightbulb,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PaymintLeafIcon from '../../assets/small-logo.svg';
import {
  PAYMINT_KNOWLEDGE,
  GREETINGS,
  GREETINGS_AR,
  FALLBACK_RESPONSES,
  FALLBACK_RESPONSES_AR,
} from '../../data/chatbotKnowledge';
import type { KnowledgeEntry } from '../../data/chatbotKnowledge';
import { formatInputPlaceholder } from '../../utils/textCase';

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

interface ChatbotNavigationContext {
  pathname: string;
  currentLocationSlug: string | null;
  currentBrandSlug: string | null;
}

const ENGLISH_STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'can',
  'do',
  'for',
  'from',
  'how',
  'i',
  'in',
  'is',
  'it',
  'me',
  'my',
  'of',
  'on',
  'or',
  'the',
  'to',
  'what',
  'where',
  'which',
  'with',
  'you',
  'your',
]);

const ARABIC_STOP_WORDS = new Set([
  'الى',
  'إلى',
  'في',
  'من',
  'على',
  'عن',
  'كيف',
  'ما',
  'ماذا',
  'هل',
  'هذا',
  'هذه',
  'هناك',
  'لدي',
  'عندي',
  'اريد',
  'أريد',
  'لو',
  'مع',
  'او',
  'أو',
  'و',
]);

const GREETING_PATTERN =
  /^(?:hi|hello|hey|good morning|good afternoon|good evening|howdy|what'?s up|sup|yo|مرحبا|مرحباً|أهلاً|أهلا|هاي|السلام عليكم|سلام|صباح الخير|مساء الخير|هلا)[!.,؟?\s]*$/i;

const SMALL_TALK_PATTERN =
  /^(?:how are you(?: doing)?|how's it going|how is it going|how have you been|كيفك|كيف حالك|كيف الحال|شلونك|كيف أمورك|كيف امورك)[!.,؟?\s]*$/i;

function isArabicText(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getMeaningfulTokens(text: string): string[] {
  return normalizeText(text)
    .split(' ')
    .filter((token) => {
      if (token.length <= 2) {
        return false;
      }

      return !ENGLISH_STOP_WORDS.has(token) && !ARABIC_STOP_WORDS.has(token);
    });
}

function scoreTextMatch(queryText: string, queryTokens: string[], sourceText?: string, baseWeight = 1): number {
  if (!sourceText) {
    return 0;
  }

  const normalizedSource = normalizeText(sourceText);
  if (!normalizedSource) {
    return 0;
  }

  let score = 0;

  if (queryText === normalizedSource) {
    score += baseWeight * 8;
  } else if (queryText.includes(normalizedSource) || normalizedSource.includes(queryText)) {
    score += baseWeight * 4;
  }

  const sourceTokens = getMeaningfulTokens(normalizedSource);
  if (sourceTokens.length === 0) {
    return score;
  }

  const matchedTokens = sourceTokens.filter((token) => queryTokens.includes(token)).length;

  if (matchedTokens === sourceTokens.length) {
    score += sourceTokens.length > 1 ? baseWeight * 5 : baseWeight * 3;
  }

  score += matchedTokens * baseWeight;

  return score;
}

function calculateRelevance(query: string, entry: KnowledgeEntry, context: ChatbotNavigationContext): number {
  const queryText = normalizeText(query);
  const queryTokens = getMeaningfulTokens(queryText);

  if (!queryText) {
    return 0;
  }

  let score = entry.priority ?? 0;

  for (const keyword of entry.keywords) {
    const normalizedKeyword = normalizeText(keyword);
    if (!normalizedKeyword) {
      continue;
    }

    const keywordTokens = getMeaningfulTokens(normalizedKeyword);

    if (queryText === normalizedKeyword) {
      score += 36;
    } else if (queryText.includes(normalizedKeyword)) {
      score += 22;
    }

    if (keywordTokens.length > 0) {
      const matchedKeywordTokens = keywordTokens.filter((token) => queryTokens.includes(token)).length;

      if (matchedKeywordTokens === keywordTokens.length) {
        score += keywordTokens.length > 1 ? 18 : 10;
      }

      score += matchedKeywordTokens * 4;
    }
  }

  score += scoreTextMatch(queryText, queryTokens, entry.question, 3);
  score += scoreTextMatch(queryText, queryTokens, entry.questionAr, 3);
  score += scoreTextMatch(queryText, queryTokens, entry.answer, 1);
  score += scoreTextMatch(queryText, queryTokens, entry.answerAr, 1);

  if (context.pathname.startsWith('/brand/')) {
    if (
      entry.id === 'link-location-brand' ||
      entry.navigationPath?.startsWith('/brand/') ||
      entry.navigationFallbackPath?.startsWith('/brand/')
    ) {
      score += 8;
    }
  } else if (context.pathname.startsWith('/owner/')) {
    if (
      entry.navigationPath?.startsWith('/owner/') ||
      entry.navigationFallbackPath?.startsWith('/owner/') ||
      ['create-brand', 'add-owner-location', 'establishments', 'link-location-brand'].includes(entry.id)
    ) {
      score += 8;
    }
  } else if (context.pathname.startsWith('/dashboard/') && entry.navigationPath?.startsWith('/dashboard/')) {
    score += 6;
  }

  return score;
}

function findBestMatch(query: string, context: ChatbotNavigationContext): KnowledgeEntry | null {
  if (GREETING_PATTERN.test(query.trim()) || SMALL_TALK_PATTERN.test(query.trim())) {
    return null;
  }

  const scored = PAYMINT_KNOWLEDGE.map((entry) => ({
    entry,
    score: calculateRelevance(query, entry, context),
  })).filter((item) => item.score > 0);

  scored.sort((a, b) => b.score - a.score || (b.entry.priority ?? 0) - (a.entry.priority ?? 0));

  if (scored.length > 0 && scored[0].score >= 8) {
    return scored[0].entry;
  }

  return null;
}

function getLocalizedQuestion(entry: KnowledgeEntry, useArabic: boolean): string {
  return useArabic && entry.questionAr ? entry.questionAr : entry.question;
}

function getKnowledgeQuestionById(id: string, useArabic: boolean): string | undefined {
  const entry = PAYMINT_KNOWLEDGE.find((item) => item.id === id);
  return entry ? getLocalizedQuestion(entry, useArabic) : undefined;
}

function getDefaultSuggestions(pathname: string, useArabic: boolean, t: (key: string) => string): string[] {
  const ownerSuggestions = [
    getKnowledgeQuestionById('create-brand', useArabic),
    getKnowledgeQuestionById('add-owner-location', useArabic),
    getKnowledgeQuestionById('link-location-brand', useArabic),
    getKnowledgeQuestionById('establishments', useArabic),
  ].filter((value): value is string => Boolean(value));

  if (pathname.startsWith('/owner/')) {
    return ownerSuggestions;
  }

  if (pathname.startsWith('/brand/')) {
    return [
      getKnowledgeQuestionById('link-location-brand', useArabic),
      getKnowledgeQuestionById('add-owner-location', useArabic),
      getKnowledgeQuestionById('establishments', useArabic),
      t('chat.suggestions.view_reports'),
    ].filter((value): value is string => Boolean(value));
  }

  return [
    t('chat.suggestions.add_product'),
    t('chat.suggestions.view_orders'),
    t('chat.suggestions.manage_staff'),
    t('chat.suggestions.view_reports'),
  ];
}

function getRelatedSuggestions(entry: KnowledgeEntry | null, defaultSuggestions: string[], useArabic: boolean): string[] {
  if (!entry) {
    return defaultSuggestions;
  }

  const suggestions: string[] = [];

  if (entry.relatedTopics) {
    for (const topic of entry.relatedTopics) {
      const related = PAYMINT_KNOWLEDGE.find((item) => item.id === topic);
      if (!related) {
        continue;
      }

      const question = getLocalizedQuestion(related, useArabic);
      if (!suggestions.includes(question)) {
        suggestions.push(question);
      }
    }
  }

  const sameCategory = PAYMINT_KNOWLEDGE.filter(
    (item) => item.category === entry.category && item.id !== entry.id,
  ).slice(0, 2);

  for (const related of sameCategory) {
    const question = getLocalizedQuestion(related, useArabic);
    if (!suggestions.includes(question)) {
      suggestions.push(question);
    }
  }

  return (suggestions.length > 0 ? suggestions : defaultSuggestions).slice(0, 3);
}

function resolveNavigationPath(entry: KnowledgeEntry, context: ChatbotNavigationContext): string | undefined {
  let resolvedPath = entry.navigationPath;

  if (resolvedPath) {
    if (context.currentLocationSlug) {
      resolvedPath = resolvedPath.replace(':location', context.currentLocationSlug);
    }

    if (context.currentBrandSlug) {
      resolvedPath = resolvedPath.replace(':brand', context.currentBrandSlug);
    }

    if (!resolvedPath.includes(':')) {
      return resolvedPath;
    }
  }

  return entry.navigationFallbackPath;
}

function getSmallTalkResponse(useArabic: boolean): string {
  if (useArabic) {
    return 'أنا بخير، شكراً لسؤالك. أنا هنا لمساعدتك في PayMint، مثل المنتجات والطلبات والموظفين والتقارير والعلامات التجارية والمواقع. اكتب لي ما تريد إنجازه وسأرشدك.';
  }

  return "I'm doing well, thanks. I'm here to help with PayMint, like products, orders, staff, reports, brands, and locations. Tell me what you'd like to do and I'll guide you.";
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

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (chatRef.current && !chatRef.current.contains(event.target as Node)) {
        const isSwitcher = (event.target as Element).closest('#paymint-launcher-switcher');
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

  const currentLocationSlug = useMemo(() => {
    const match = location.pathname.match(/\/dashboard\/([^/]+)/);
    return match ? match[1] : null;
  }, [location.pathname]);

  const currentBrandSlug = useMemo(() => {
    const match = location.pathname.match(/\/brand\/([^/]+)/);
    return match ? match[1] : null;
  }, [location.pathname]);

  const navigationContext = useMemo<ChatbotNavigationContext>(
    () => ({
      pathname: location.pathname,
      currentLocationSlug,
      currentBrandSlug,
    }),
    [location.pathname, currentLocationSlug, currentBrandSlug],
  );

  const welcomeSuggestions = useMemo(() => {
    return getDefaultSuggestions(location.pathname, isRTL, t);
  }, [location.pathname, isRTL, t]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const index = Math.floor(Math.random() * 3);
      const greeting = t(`chat.greetings.${index}`);
      setMessages([
        {
          id: '1',
          type: 'bot',
          content: greeting,
          timestamp: new Date(),
          suggestions: welcomeSuggestions,
        },
      ]);
    }
  }, [isOpen, messages.length, t, welcomeSuggestions]);

  useEffect(() => {
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

  const processMessage = useCallback(
    async (userMessage: string) => {
      const useArabic = isArabicText(userMessage) || isRTL;
      const defaultSuggestions = getDefaultSuggestions(location.pathname, useArabic, t);

      const userMsg: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: userMessage,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setIsTyping(true);

      await new Promise((resolve) => window.setTimeout(resolve, 500 + Math.random() * 500));

      if (GREETING_PATTERN.test(userMessage.trim())) {
        const greetings = useArabic ? GREETINGS_AR : GREETINGS;
        const greeting = greetings[Math.floor(Math.random() * greetings.length)];
        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: greeting,
          timestamp: new Date(),
          suggestions: defaultSuggestions,
        };

        setMessages((prev) => [...prev, botMsg]);
        setIsTyping(false);
        return;
      }

      if (SMALL_TALK_PATTERN.test(userMessage.trim())) {
        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: getSmallTalkResponse(useArabic),
          timestamp: new Date(),
          suggestions: defaultSuggestions,
        };

        setMessages((prev) => [...prev, botMsg]);
        setIsTyping(false);
        return;
      }

      const match = findBestMatch(userMessage, navigationContext);

      let botResponse: Message;

      if (match) {
        const answer = useArabic && match.answerAr ? match.answerAr : match.answer;

        botResponse = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: answer,
          timestamp: new Date(),
          suggestions: getRelatedSuggestions(match, defaultSuggestions, useArabic),
          navigationPath: resolveNavigationPath(match, navigationContext),
        };
      } else {
        const fallbacks = useArabic ? FALLBACK_RESPONSES_AR : FALLBACK_RESPONSES;
        const fallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];

        botResponse = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: fallback,
          timestamp: new Date(),
          suggestions: defaultSuggestions,
        };
      }

      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    },
    [isRTL, location.pathname, navigationContext, t],
  );

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
          className={`fixed bottom-[100px] ${isRTL ? 'left-[30px]' : 'right-[30px]'} z-[950] flex h-[600px] max-h-[calc(100vh-150px)] w-[400px] max-w-[calc(100vw-60px)] flex-col overflow-hidden rounded-3xl border border-gray-200/50 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0F172A]`}
        >
          <div className="relative overflow-hidden bg-gradient-to-r from-[#7CC39F] to-[#5BA882] px-5 py-4">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 blur-xl" />
              <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-black/5 blur-xl" />
            </div>

            <div className="relative flex items-center gap-3">
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center">
                  <img src={PaymintLeafIcon} alt="" className="w-10 h-10 object-contain drop-shadow-md scale-x-[-1]" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-tight text-white">{t('chat.botName')}</h3>
                <p className="text-xs font-medium text-white/80">{t('chat.assistantTitle')}</p>
              </div>
            </div>
          </div>

          <div className="custom-scrollbar flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex max-w-[85%] gap-2 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center"
                  >
                    {message.type === 'user' ? (
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/10">
                        <User size={16} className="text-gray-600 dark:text-gray-300" />
                      </div>
                    ) : (
                      <img src={PaymintLeafIcon} alt="" className="w-7 h-7 object-contain scale-x-[-1]" />
                    )}
                  </div>

                  <div className={`space-y-2 ${message.type === 'user' ? 'text-right' : ''}`}>
                    <div
                      className={`inline-block rounded-2xl px-4 py-3 ${
                        message.type === 'user'
                          ? 'rounded-tr-sm bg-[#7CC39F] text-black'
                          : 'rounded-tl-sm bg-gray-100 text-gray-800 dark:bg-white/5 dark:text-gray-200'
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                    </div>

                    {message.navigationPath && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleNavigate(message.navigationPath!)}
                        className="inline-flex items-center gap-2 rounded-full bg-[#7CC39F]/10 px-3 py-1.5 text-xs font-bold text-[#7CC39F] transition-colors hover:bg-[#7CC39F]/20"
                      >
                        <Zap size={12} />
                        {t('chat.navigation.takeMe')}
                        <ArrowRight size={12} className={isRTL ? 'rotate-180' : ''} />
                      </motion.button>
                    )}

                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {message.suggestions.map((suggestion, index) => (
                          <motion.button
                            key={index}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:border-[#7CC39F] hover:text-[#7CC39F] dark:border-white/10 dark:bg-white/5 dark:text-gray-300"
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
                    <img src={PaymintLeafIcon} alt="" className="w-7 h-7 object-contain scale-x-[-1]" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-3 dark:bg-white/5">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                          className="h-2 w-2 rounded-full bg-[#7CC39F]"
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
                  className="flex flex-shrink-0 items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-600 transition-colors hover:bg-[#7CC39F]/10 hover:text-[#7CC39F] dark:bg-white/5 dark:text-gray-400"
                >
                  {action.icon}
                  {action.label}
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
                  className={`w-full rounded-2xl border border-gray-200 bg-white py-3 text-sm text-gray-900 transition-all placeholder:text-gray-400 focus:border-[#7CC39F] focus:outline-none focus:ring-2 focus:ring-[#7CC39F]/30 disabled:opacity-50 dark:border-white/10 dark:bg-[#1E293B] dark:text-white ${
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
                className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7CC39F] text-black shadow-lg shadow-[#7CC39F]/30 transition-all hover:brightness-110 disabled:opacity-50 disabled:hover:brightness-100 ${isRTL ? 'rotate-180' : ''}`}
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
