import {
  FALLBACK_RESPONSES,
  FALLBACK_RESPONSES_AR,
  MINTCOM_KNOWLEDGE,
} from '../../data/chatbotKnowledge';
import type { KnowledgeEntry } from '../../data/chatbotKnowledge';
import type {
  ChatbotNavigationContext,
  ResolvedChatAction,
  ResolvedChatbotPageContext,
} from './chatbotTypes';

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
  /^(?:hi|hello|hey|good morning|good afternoon|good evening|howdy|what'?s up|sup|yo|مرحبا|مرحباً|أهلاً|أهلاً|هاي|السلام عليكم|سلام|صباح الخير|مساء الخير|هلا)[!.,؟?\s]*$/i;

const SMALL_TALK_PATTERN =
  /^(?:how are you(?: doing)?|how's it going|how is it going|how have you been|كيفك|كيف حالك|كيف الحال|شلونك|كيف أمورك|كيف امورك)[!.,؟?\s]*$/i;

const SEARCH_TOKEN_ALIASES = new Map([
  ['hwo', 'how'],
  ['breand', 'brand'],
  ['brnad', 'brand'],
  ['brandd', 'brand'],
  ['emplloy', 'employee'],
  ['employe', 'employee'],
  ['emplyee', 'employee'],
  ['empolyee', 'employee'],
  ['emploe', 'employee'],
  ['employ', 'employee'],
]);

const STAFF_INTENT_TOKENS = new Set(['staff', 'employee', 'team', 'worker', 'hire']);
const BRAND_LOCATION_INTENT_TOKENS = new Set(['brand', 'location', 'store', 'branch', 'establishment']);
const BRAND_LOCATION_ENTRY_IDS = new Set([
  'establishments',
  'add-owner-location',
  'create-brand',
  'link-location-brand',
]);

export function isArabicText(text: string): boolean {
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

const GREETING_CANONICAL_PHRASES = [
  'hi',
  'hello',
  'hey',
  'good morning',
  'good afternoon',
  'good evening',
  'howdy',
  "what's up",
  'sup',
  'yo',
  'مرحبا',
  'مرحباً',
  'أهلاً',
  'هاي',
  'السلام عليكم',
  'سلام',
  'صباح الخير',
  'مساء الخير',
  'هلا',
];

const SMALL_TALK_CANONICAL_PHRASES = [
  'how are you',
  'how are you doing',
  "how's it going",
  'how is it going',
  'how have you been',
  'كيفك',
  'كيف حالك',
  'كيف الحال',
  'شلونك',
  'كيف أمورك',
  'كيف امورك',
];

function normalizeCompactText(text: string): string {
  return normalizeText(text).replace(/\s+/g, '');
}

function normalizeSearchToken(token: string): string {
  const alias = SEARCH_TOKEN_ALIASES.get(token);
  if (alias) {
    return alias;
  }

  if (token.startsWith('empl') && token.length >= 5) {
    return 'employee';
  }

  return token;
}

function matchesCanonicalPhrase(input: string, phrases: string[]): boolean {
  const normalized = normalizeText(input);
  const compact = normalizeCompactText(input);

  return phrases.some((phrase) => {
    const normalizedPhrase = normalizeText(phrase);
    const compactPhrase = normalizeCompactText(phrase);

    return normalized === normalizedPhrase || compact === compactPhrase;
  });
}

export function isGreeting(text: string): boolean {
  return GREETING_PATTERN.test(text.trim()) || matchesCanonicalPhrase(text, GREETING_CANONICAL_PHRASES);
}

export function isSmallTalk(text: string): boolean {
  return SMALL_TALK_PATTERN.test(text.trim()) || matchesCanonicalPhrase(text, SMALL_TALK_CANONICAL_PHRASES);
}

function getMeaningfulTokens(text: string): string[] {
  const tokens = normalizeText(text)
    .split(' ')
    .map(normalizeSearchToken)
    .filter((token) => {
      if (token.length <= 2) {
        return false;
      }

      return !ENGLISH_STOP_WORDS.has(token) && !ARABIC_STOP_WORDS.has(token);
    });

  return Array.from(new Set(tokens));
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

function getScopedSection(path: string): string {
  const parts = path.split('/').filter(Boolean);

  if (parts[0] === 'dashboard') {
    return `dashboard/${parts[2] ?? 'index'}`;
  }

  if (parts[0] === 'brand') {
    return `brand/${parts[2] ?? 'index'}`;
  }

  if (parts[0] === 'owner') {
    return `owner/${parts[1] ?? 'index'}`;
  }

  return parts[0] ?? 'public';
}

export function resolveKnowledgeNavigationPath(
  entry: KnowledgeEntry,
  context: Pick<ChatbotNavigationContext, 'currentLocationSlug' | 'currentBrandSlug'>,
): string | undefined {
  const resolvePlaceholders = (value?: string) => {
    if (!value) {
      return undefined;
    }

    const resolved = value
      .replace(/:locationSlug/g, context.currentLocationSlug ?? ':locationSlug')
      .replace(/:location/g, context.currentLocationSlug ?? ':location')
      .replace(/:brandId/g, context.currentBrandSlug ?? ':brandId')
      .replace(/:brand/g, context.currentBrandSlug ?? ':brand');

    return resolved.includes(':') ? undefined : resolved;
  };

  return resolvePlaceholders(entry.navigationPath) ?? resolvePlaceholders(entry.navigationFallbackPath);
}

function calculateRelevance(query: string, entry: KnowledgeEntry, context: ChatbotNavigationContext): number {
  const queryText = normalizeText(query);
  const queryTokens = getMeaningfulTokens(queryText);

  if (!queryText) {
    return 0;
  }

  const hasStaffIntent = queryTokens.some((token) => STAFF_INTENT_TOKENS.has(token));
  const hasBrandLocationIntent = queryTokens.some((token) => BRAND_LOCATION_INTENT_TOKENS.has(token));
  const scoredKeywordTokens = new Set<string>();
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

      for (const token of keywordTokens) {
        if (queryTokens.includes(token) && !scoredKeywordTokens.has(token)) {
          score += 4;
          scoredKeywordTokens.add(token);
        }
      }
    }
  }

  if (entry.id === 'add-staff' && hasStaffIntent) {
    score += 20;
  }

  if (hasStaffIntent && !hasBrandLocationIntent && BRAND_LOCATION_ENTRY_IDS.has(entry.id)) {
    score -= 40;
  }

  score += scoreTextMatch(queryText, queryTokens, entry.question, 3);
  score += scoreTextMatch(queryText, queryTokens, entry.questionAr, 3);
  score += scoreTextMatch(queryText, queryTokens, entry.answer, 1);
  score += scoreTextMatch(queryText, queryTokens, entry.answerAr, 1);

  if (entry.contexts?.includes(context.pageContextId)) {
    score += 20;
  }

  const resolvedPath = resolveKnowledgeNavigationPath(entry, context);
  if (resolvedPath) {
    if (resolvedPath === context.pathname) {
      score += 18;
    } else if (getScopedSection(resolvedPath) === getScopedSection(context.pathname)) {
      score += 10;
    }
  }

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
      ['create-brand', 'add-owner-location', 'establishments', 'link-location-brand', 'billing'].includes(entry.id)
    ) {
      score += 8;
    }
  } else if (context.pathname.startsWith('/dashboard/') && entry.navigationPath?.startsWith('/dashboard/')) {
    score += 6;
  }

  return score;
}

export function findBestMatch(query: string, context: ChatbotNavigationContext): KnowledgeEntry | null {
  if (isGreeting(query) || isSmallTalk(query)) {
    return null;
  }

  const scored = MINTCOM_KNOWLEDGE.map((entry) => ({
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

export function getRelatedSuggestions(
  entry: KnowledgeEntry | null,
  defaultSuggestions: string[],
  useArabic: boolean,
): string[] {
  if (!entry) {
    return defaultSuggestions;
  }

  const suggestions: string[] = [];

  if (entry.relatedTopics) {
    for (const topic of entry.relatedTopics) {
      const related = MINTCOM_KNOWLEDGE.find((item) => item.id === topic);
      if (!related) {
        continue;
      }

      const question = getLocalizedQuestion(related, useArabic);
      if (!suggestions.includes(question)) {
        suggestions.push(question);
      }
    }
  }

  const sameCategory = MINTCOM_KNOWLEDGE.filter(
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

export function getGreetingMessage(pageContext: ResolvedChatbotPageContext, useArabic: boolean): string {
  if (useArabic) {
    return `أهلاً، أنا مينتو. ${pageContext.welcomeMessage} ما الذي تريد إنجازه الآن؟`;
  }

  return `Hi, I'm Minto. ${pageContext.welcomeMessage} What would you like to do right now?`;
}

export function getSmallTalkResponse(pageContext: ResolvedChatbotPageContext, useArabic: boolean): string {
  if (useArabic) {
    return `أنا بخير، شكراً لسؤالك. ${pageContext.welcomeMessage} قل لي ما الذي تريد إنجازه وسأرشدك.`;
  }

  return `I'm doing well, thanks. ${pageContext.welcomeMessage} Tell me what you're trying to do and I'll guide you.`;
}

export function getFallbackResponse(pageContext: ResolvedChatbotPageContext, useArabic: boolean): string {
  const fallbacks = useArabic ? FALLBACK_RESPONSES_AR : FALLBACK_RESPONSES;
  const fallback = fallbacks[0];

  if (useArabic) {
    return `${fallback} أنت الآن في ${pageContext.title}، ويمكنني مساعدتك في ${pageContext.defaultSuggestions
      .slice(0, 3)
      .join('، ')}.`;
  }

  return `${fallback} You're on ${pageContext.title}, and I can still help with ${pageContext.defaultSuggestions
    .slice(0, 3)
    .join(', ')}.`;
}

export function getContextActions(
  pageContext: ResolvedChatbotPageContext,
  limit = 2,
): ResolvedChatAction[] {
  return pageContext.quickActions.slice(0, limit);
}

export function buildKnowledgeActions(
  entry: KnowledgeEntry,
  context: ChatbotNavigationContext,
  useArabic: boolean,
): ResolvedChatAction[] {
  const path = resolveKnowledgeNavigationPath(entry, context);

  if (!path) {
    return [];
  }

  return [
    {
      id: `${entry.id}-navigate`,
      label: useArabic ? 'خذني إلى هناك' : 'Take me there',
      icon: 'lightbulb',
      type: 'navigate',
      path,
    },
  ];
}
