import { describe, expect, it } from 'vitest';
import { resolveChatbotPageContext } from '../../data/chatbotPageContexts';
import { MINTCOM_KNOWLEDGE } from '../../data/chatbotKnowledge';
import {
  findBestMatch,
  getFallbackResponse,
  getGreetingMessage,
  getSmallTalkResponse,
  isSmallTalk,
  resolveKnowledgeNavigationPath,
} from './chatbotEngine';

describe('chatbot page context', () => {
  it('resolves dashboard products context and action path', () => {
    const context = resolveChatbotPageContext('/dashboard/amman/products', false);

    expect(context.id).toBe('dashboard-products');
    expect(context.quickActions[0]).toMatchObject({
      id: 'products-add',
      path: '/dashboard/amman/products',
      state: { openCreateModal: true },
    });
  });

  it('resolves owner billing context in arabic', () => {
    const context = resolveChatbotPageContext('/owner/billing', true);

    expect(context.id).toBe('owner-billing');
    expect(context.title).toBe('فوترة المالك');
    expect(context.quickActions[1].path).toBe('/owner/establishments');
  });

  it('replaces guest actions on the public site for signed-in users', () => {
    const context = resolveChatbotPageContext('/', false, {
      isAuthenticated: true,
      dashboardPath: '/dashboard/amman',
      canAccessOwnerPortal: true,
    });

    expect(context.quickActions.map((action) => action.label)).toEqual([
      'Open dashboard',
      'Products',
      'Reports',
      'Owner portal',
    ]);
    expect(context.welcomeMessage).toContain('already signed in');
  });
});

describe('chatbot engine', () => {
  it('prefers the contextual billing article on owner billing', () => {
    const match = findBestMatch('How does billing work?', {
      pathname: '/owner/billing',
      currentLocationSlug: null,
      currentBrandSlug: null,
      pageContextId: 'owner-billing',
    });

    expect(match?.id).toBe('billing');
  });

  it('matches typo-heavy employee questions to staff instead of brand linking', () => {
    const match = findBestMatch('hwo can i add emplloy ...', {
      pathname: '/owner/brands',
      currentLocationSlug: null,
      currentBrandSlug: null,
      pageContextId: 'owner-brands',
    });

    expect(match?.id).toBe('add-staff');
  });

  it('still answers brand questions when the user asks about a brand typo', () => {
    const match = findBestMatch('hwo can i add breand', {
      pathname: '/owner/brands',
      currentLocationSlug: null,
      currentBrandSlug: null,
      pageContextId: 'owner-brands',
    });

    expect(match?.id).toBe('create-brand');
  });

  it('resolves dashboard knowledge navigation with the active location slug', () => {
    const entry = MINTCOM_KNOWLEDGE.find((item) => item.id === 'add-product');

    expect(entry).toBeTruthy();
    expect(
      resolveKnowledgeNavigationPath(entry!, {
        currentLocationSlug: 'amman',
        currentBrandSlug: null,
      }),
    ).toBe('/dashboard/amman/products');
  });

  it('builds page-aware greeting and fallback copy', () => {
    const pageContext = resolveChatbotPageContext('/dashboard/amman/products', false);

    expect(getGreetingMessage(pageContext, false)).toContain('Products');
    expect(getSmallTalkResponse(pageContext, false)).toContain('Products');
    expect(getFallbackResponse(pageContext, false)).toContain('Products');
  });

  it('treats spacing mistakes in small talk as small talk', () => {
    expect(isSmallTalk('how ar eyou')).toBe(true);
  });
});
