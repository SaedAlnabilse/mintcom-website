import { useMemo } from 'react';
import { resolveChatbotPageContext } from '../data/chatbotPageContexts';
import type { ChatbotPageContextOptions } from '../components/Chat/chatbotTypes';

export function useChatPageContext(
  pathname: string,
  useArabic: boolean,
  options?: ChatbotPageContextOptions,
) {
  return useMemo(
    () => resolveChatbotPageContext(pathname, useArabic, options),
    [pathname, useArabic, options?.canAccessOwnerPortal, options?.dashboardPath, options?.isAuthenticated],
  );
}
