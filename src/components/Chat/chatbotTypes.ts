export type ChatIconName =
  | 'package'
  | 'clipboardList'
  | 'barChart3'
  | 'lightbulb'
  | 'store'
  | 'creditCard'
  | 'receipt'
  | 'users'
  | 'building2'
  | 'mapPinned'
  | 'tag'
  | 'settings'
  | 'shield'
  | 'star'
  | 'shoppingBag'
  | 'layoutDashboard'
  | 'wallet';

export interface LocalizedChatText {
  en: string;
  ar: string;
}

export interface ChatActionDefinition {
  id: string;
  label: LocalizedChatText;
  icon: ChatIconName;
  type: 'ask' | 'navigate';
  query?: LocalizedChatText;
  path?: string;
  fallbackPath?: string;
  state?: Record<string, unknown>;
}

export interface ResolvedChatAction {
  id: string;
  label: string;
  icon: ChatIconName;
  type: 'ask' | 'navigate';
  query?: string;
  path?: string;
  state?: Record<string, unknown>;
}

export interface ChatbotPageContextOptions {
  isAuthenticated?: boolean;
  dashboardPath?: string | null;
  canAccessOwnerPortal?: boolean;
}

export interface ChatbotPageContextDefinition {
  id: string;
  match: string[];
  title: LocalizedChatText;
  launcherPrompt: LocalizedChatText;
  welcomeMessage: LocalizedChatText;
  defaultSuggestions: LocalizedChatText[];
  quickActions: ChatActionDefinition[];
}

export interface ResolvedChatbotPageContext {
  id: string;
  title: string;
  launcherPrompt: string;
  welcomeMessage: string;
  defaultSuggestions: string[];
  quickActions: ResolvedChatAction[];
  params: Record<string, string | undefined>;
}

export interface ChatbotNavigationContext {
  pathname: string;
  currentLocationSlug: string | null;
  currentBrandSlug: string | null;
  pageContextId: string;
}
