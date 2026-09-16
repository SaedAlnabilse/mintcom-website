import api from '../config/api';
import type { ActivityLogEntry } from '../utils/activityLog';

/** One page of the audit trail, keyset-paginated. */
export interface ActivityLogPage {
  logs: ActivityLogEntry[];
  /** Opaque; pass back for the next page. Null at the end of the list. */
  nextCursor: string | null;
  hasNextPage: boolean;
  /** True when this page came from the pre-cursor endpoint. */
  fromLegacyEndpoint: boolean;
}

export interface ActivityLogQuery {
  search?: string;
  action?: string;
  resource?: string;
  performedById?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

/**
 * Map an `AuditEvent` row onto the shape the dashboard already renders.
 *
 * `targetType` is the server's own classification and is used as-is: deriving
 * the resource a second time on the client is what made rows disappear from
 * their own filter before (plan §2.11).
 */
function fromAuditEvent(event: Record<string, any>): ActivityLogEntry {
  return {
    id: event.id,
    userId: event.actorId ?? undefined,
    actorId: event.actorId ?? null,
    actorType: (event.actorType ?? '').toLowerCase() || null,
    actorName: event.actorName ?? null,
    actorEmail: event.actorEmail ?? null,
    action: event.action,
    description: event.summary ?? '',
    metadata: event.metadata ?? null,
    timestamp: event.occurredAt ?? event.recordedAt,
    module: event.targetType ?? null,
  } as ActivityLogEntry;
}

function buildParams(query: ActivityLogQuery): Record<string, unknown> {
  const params: Record<string, unknown> = {};
  if (query.search) params.search = query.search;
  if (query.action) params.action = query.action;
  if (query.resource) params.resource = query.resource;
  if (query.startDate) params.startDate = query.startDate;
  if (query.endDate) params.endDate = query.endDate;
  return params;
}

/**
 * Fetch one page of activity, newest first.
 *
 * Prefers the cursor endpoint and falls back to the legacy offset endpoint when
 * it is unavailable, so a dashboard pointed at an older API keeps working
 * instead of showing an error for something the merchant did not cause.
 *
 * Filters are sent exactly as the UI produces them — the server translates its
 * own vocabulary, so the taxonomy lives in one place rather than four.
 */
export async function fetchActivityPage(
  query: ActivityLogQuery,
  cursor?: string | null,
): Promise<ActivityLogPage> {
  const limit = query.limit ?? 10;

  try {
    const params = buildParams(query);
    params.limit = limit;
    if (cursor) params.cursor = cursor;
    if (query.performedById) params.actorId = query.performedById;

    const response = await api.get('/audit-events', { params });
    const items = Array.isArray(response.data?.items) ? response.data.items : [];

    return {
      logs: items.map(fromAuditEvent),
      nextCursor: response.data?.nextCursor ?? null,
      hasNextPage: Boolean(response.data?.hasNextPage),
      fromLegacyEndpoint: false,
    };
  } catch {
    // Cursors are endpoint-specific, so a legacy page can only ever be the
    // first one; callers read `fromLegacyEndpoint` as "nothing more to load".
    const legacyParams = buildParams(query);
    legacyParams.page = 1;
    legacyParams.limit = limit;
    if (query.performedById) legacyParams.performedById = query.performedById;

    const response = await api.get('/activity-log', { params: legacyParams });
    const batch = response.data?.logs || response.data;

    return {
      logs: Array.isArray(batch) ? batch : [],
      nextCursor: null,
      hasNextPage: false,
      fromLegacyEndpoint: true,
    };
  }
}
