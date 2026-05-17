import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../config/api';

export interface SupportArticleMetric {
  articleId: string;
  totalViews: number;
  usefulCount: number;
  notUsefulCount: number;
}

type MetricsById = Record<string, SupportArticleMetric>;

const VISITOR_KEY_STORAGE = 'mintcom_support_article_visitor';
const VIEW_SESSION_PREFIX = 'mintcom_support_article_viewed:';

const parseSeedViews = (value: string): number => {
  const normalized = value.trim().toLowerCase();
  const numeric = Number.parseFloat(normalized.replace(/k$/, ''));

  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return normalized.endsWith('k') ? Math.round(numeric * 1000) : Math.round(numeric);
};

export const formatSupportArticleViews = (value: number): string => {
  if (value >= 1000) {
    const rounded = value / 1000;
    return `${rounded >= 10 ? Math.round(rounded) : rounded.toFixed(1)}k`;
  }

  return String(value);
};

export const getSupportArticleVisitorKey = () => {
  const existing = localStorage.getItem(VISITOR_KEY_STORAGE);
  if (existing) return existing;

  const generated =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const visitorKey = generated.replace(/[^a-zA-Z0-9_-]/g, '');
  localStorage.setItem(VISITOR_KEY_STORAGE, visitorKey);
  return visitorKey;
};

export const getArticleViews = (
  metrics: MetricsById,
  articleId: string,
  fallbackViews: string,
) => {
  const metric = metrics[articleId];
  return formatSupportArticleViews(metric ? metric.totalViews : parseSeedViews(fallbackViews));
};

export const getArticleViewsNumber = (
  metrics: MetricsById,
  articleId: string,
  fallbackViews: string,
) => {
  const metric = metrics[articleId];
  return metric ? metric.totalViews : parseSeedViews(fallbackViews);
};

export const useSupportArticleMetrics = (articleIds: string[]) => {
  const [metrics, setMetrics] = useState<MetricsById>({});
  const idsKey = useMemo(
    () => Array.from(new Set(articleIds.filter(Boolean))).sort().join(','),
    [articleIds],
  );

  useEffect(() => {
    if (!idsKey) return;

    let cancelled = false;
    api
      .get<{ metrics: SupportArticleMetric[] }>('/api/support/articles/metrics', {
        params: { ids: idsKey },
      })
      .then((res) => {
        if (cancelled) return;
        setMetrics((current) => {
          const next = { ...current };
          const requestedIds = idsKey.split(',').filter(Boolean);
          for (const articleId of requestedIds) {
            next[articleId] = {
              articleId,
              totalViews: 0,
              usefulCount: 0,
              notUsefulCount: 0,
            };
          }
          for (const metric of res.data.metrics || []) {
            next[metric.articleId] = metric;
          }
          return next;
        });
      })
      .catch(() => {
        // Keep seeded article counts visible if metrics cannot be loaded.
      });

    return () => {
      cancelled = true;
    };
  }, [idsKey]);

  const recordView = useCallback(async (articleId: string) => {
    const sessionKey = `${VIEW_SESSION_PREFIX}${articleId}`;
    if (sessionStorage.getItem(sessionKey)) {
      return;
    }
    sessionStorage.setItem(sessionKey, '1');

    try {
      const res = await api.post<SupportArticleMetric>(
        `/api/support/articles/${articleId}/view`,
        { pageUrl: window.location.href },
      );
      setMetrics((current) => ({ ...current, [articleId]: res.data }));
    } catch {
      sessionStorage.removeItem(sessionKey);
    }
  }, []);

  const submitFeedback = useCallback(
    async (articleId: string, vote: 'useful' | 'not_useful') => {
      const res = await api.post<SupportArticleMetric>(
        `/api/support/articles/${articleId}/feedback`,
        {
          vote,
          visitorKey: getSupportArticleVisitorKey(),
          pageUrl: window.location.href,
        },
      );
      setMetrics((current) => ({ ...current, [articleId]: res.data }));
      return res.data;
    },
    [],
  );

  return { metrics, recordView, submitFeedback };
};
