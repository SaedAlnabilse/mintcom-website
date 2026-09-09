/**
 * Presentation helpers for the Activity Log.
 *
 * The API stores metadata as a flat `key: value` bag using the backend's own
 * field names (`inputType`, `attributeGroup`, …) and raw enum values
 * (`MULTI_SELECT`). Rendering that bag verbatim reads like a debug dump, so
 * everything here turns it into label/value pairs a non-developer can read.
 */

export interface ActivityLogEntry {
  id: string;
  userId?: string;
  performedBy?: {
    username?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
  };
  action: string;
  description: string;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string;
  timestamp: string;
}

export interface ActivityMetadataEntry {
  /** Original metadata key, used as a React key. */
  key: string;
  /** Human readable field name, e.g. `inputType` -> "Input type". */
  label: string;
  /** Formatted value, e.g. `MULTI_SELECT` -> "Multi select". */
  value: string;
  /** Internal identifier — hidden from the inline summary, kept in details. */
  isIdentifier: boolean;
}

export interface MetadataFormatOptions {
  locale?: string;
  yesLabel?: string;
  noLabel?: string;
  timeZone?: string;
}

/** Longest value shown inline before it is cut at a word boundary. */
const INLINE_VALUE_LENGTH = 48;

/** Fields the operator never needs inline (opaque cuids, plumbing ids). */
const IDENTIFIER_KEYS = new Set(['id', 'establishmentid', 'ipaddress', 'module']);

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
const ENUM_PATTERN = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/;

export function isIdentifierKey(key: string): boolean {
  const normalized = key.toLowerCase();
  return IDENTIFIER_KEYS.has(normalized) || /(?:_id|id)$/.test(normalized);
}

/** `inputType` / `input_type` / `INPUT_TYPE` -> "Input type". */
export function humanizeMetadataKey(key: string): string {
  const words = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase();

  if (!words) return key;
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Cut at the last whole word so a chip never ends mid-word. */
export function truncateAtWord(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  const clipped = value.slice(0, maxLength);
  const lastSpace = clipped.lastIndexOf(' ');
  const safe = lastSpace > maxLength * 0.5 ? clipped.slice(0, lastSpace) : clipped;
  return `${safe.trimEnd()}…`;
}

export function formatMetadataValue(
  value: unknown,
  options: MetadataFormatOptions = {},
): string {
  const { locale = 'en', yesLabel = 'Yes', noLabel = 'No', timeZone } = options;

  if (typeof value === 'boolean') return value ? yesLabel : noLabel;
  if (typeof value === 'number') return value.toLocaleString(locale);

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === 'true') return yesLabel;
    if (trimmed === 'false') return noLabel;

    if (ISO_DATE_PATTERN.test(trimmed)) {
      const parsed = new Date(trimmed);
      if (!Number.isNaN(parsed.getTime())) {
        try {
          return new Intl.DateTimeFormat(locale, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            ...(timeZone ? { timeZone } : {}),
          }).format(parsed);
        } catch {
          return parsed.toLocaleString(locale, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
        }
      }
    }

    // Backend enums (MULTI_SELECT) read as shouting in a UI chip.
    if (trimmed.length > 2 && ENUM_PATTERN.test(trimmed)) {
      const words = trimmed.replace(/_/g, ' ').toLowerCase();
      return words.charAt(0).toUpperCase() + words.slice(1);
    }

    return trimmed;
  }

  if (value === null || value === undefined) return '';
  return JSON.stringify(value);
}

/**
 * Flatten a log's metadata into readable entries, business fields first and
 * identifiers last so the inline summary shows what changed, not which row.
 */
export function getMetadataEntries(
  metadata: Record<string, unknown> | null | undefined,
  options: MetadataFormatOptions = {},
): ActivityMetadataEntry[] {
  if (!metadata || typeof metadata !== 'object') return [];

  const entries: ActivityMetadataEntry[] = [];
  for (const [key, rawValue] of Object.entries(metadata)) {
    if (rawValue === null || rawValue === undefined || rawValue === '') continue;
    const value = formatMetadataValue(rawValue, options);
    if (!value) continue;
    entries.push({
      key,
      label: humanizeMetadataKey(key),
      value,
      isIdentifier: isIdentifierKey(key),
    });
  }

  return entries.sort((a, b) => Number(a.isIdentifier) - Number(b.isIdentifier));
}

/** Entries worth showing next to the description (identifiers excluded). */
export function getVisibleMetadataEntries(
  metadata: Record<string, unknown> | null | undefined,
  options: MetadataFormatOptions = {},
): ActivityMetadataEntry[] {
  return getMetadataEntries(metadata, options)
    .filter((entry) => !entry.isIdentifier)
    .map((entry) => ({ ...entry, value: truncateAtWord(entry.value, INLINE_VALUE_LENGTH) }));
}

/** Single-line "Label: value" summary for CSV/PDF export. */
export function formatMetadataForExport(
  metadata: Record<string, unknown> | null | undefined,
  options: MetadataFormatOptions = {},
): string {
  return getMetadataEntries(metadata, options)
    .filter((entry) => !entry.isIdentifier)
    .map((entry) => `${entry.label}: ${entry.value}`)
    .join(' · ');
}

/**
 * Backend action string -> `activity.actions.*` translation key.
 */
export const ACTION_TRANSLATION_KEYS: Record<string, string> = {
  'Added product': 'addProduct',
  'Updated product': 'updateProduct',
  'Deleted product': 'deleteProduct',
  'Archived product': 'archiveProduct',
  'Reactivated product': 'reactivateProduct',
  'Removed product image': 'removeProductImage',
  'Deleted all products': 'deleteAllProducts',
  'Archived all products': 'archiveAllProducts',
  'Added category': 'addCategory',
  'Updated category': 'updateCategory',
  'Deleted category': 'deleteCategory',
  'Archived category': 'archiveCategory',
  'Added attribute group': 'addAttributeGroup',
  'Updated attribute group': 'updateAttributeGroup',
  'Deleted attribute group': 'deleteAttributeGroup',
  'Archived attribute group': 'archiveAttributeGroup',
  'Reactivated attribute group': 'reactivateAttributeGroup',
  'Added sub-attribute': 'addSubAttribute',
  'Updated sub-attribute': 'updateSubAttribute',
  'Deleted sub-attribute': 'deleteSubAttribute',
  'Archived sub-attribute': 'archiveSubAttribute',
  'Reactivated sub-attribute': 'reactivateSubAttribute',
  'Moved archived items': 'moveArchivedItems',
  'Auto-closed extra cash drawers': 'autoClosedShifts',
  'Updated multiple shifts setting': 'updateMultipleShifts',
  'Changed farewell message': 'updateMessage',
  'Uploaded new restaurant logo': 'updateLogo',
  'Added employee': 'addEmployee',
  'Updated employee': 'updateEmployee',
  'Deleted employee': 'deleteEmployee',
  'Deactivated employee': 'deactivateEmployee',
  'Updated restaurant name': 'updateName',
  'Updated working hours': 'updateHours',
  'Updated farewell message': 'updateMessage',
  'Updated restaurant logo': 'updateLogo',
  'Updated tax rate': 'updateTax',
  'Updated loyalty program': 'updateLoyalty',
  'Added discount': 'addDiscount',
  'Updated discount': 'updateDiscount',
  'Deleted discount': 'deleteDiscount',
  'Deactivated discount': 'deactivateDiscount',
  'Added payment method': 'addPayment',
  'Updated payment method': 'updatePayment',
  'Deleted payment method': 'deletePayment',
  'Deactivated payment method': 'deactivatePayment',
  'Added card type': 'addCardType',
  'Updated card type': 'updateCardType',
  'Deleted card type': 'deleteCardType',
  'Deactivated card type': 'deactivateCardType',
  'Setup guide shown': 'setupGuideShown',
  'Setup guide completed': 'setupGuideCompleted',
  'Moderated community content': 'moderateCommunity',
  // Access & administration — recorded by the API's audit trail.
  'Signed in': 'signedIn',
  'Signed out': 'signedOut',
  'Assigned employee to location': 'assignEmployee',
  'Updated employee assignment': 'updateAssignment',
  'Removed employee from location': 'removeEmployeeFromLocation',
  'Added custom role': 'addRole',
  'Updated custom role': 'updateRole',
  'Deleted custom role': 'deleteRole',
  'Added location': 'addLocation',
  'Updated location': 'updateLocation',
  'Deleted location': 'deleteLocation',
  'Added brand': 'addBrand',
  'Updated brand': 'updateBrand',
  'Deleted brand': 'deleteBrand',
  'Updated account profile': 'updateAccountProfile',
  'Changed account password': 'changeAccountPassword',
  'Requested email change': 'requestEmailChange',
};

/**
 * Unknown actions still resolve to a clean key ("Added add-on" -> added_add_on)
 * instead of one carrying hyphens the locale files can never match.
 */
export function getActionTranslationKey(action: string): string {
  return (
    ACTION_TRANSLATION_KEYS[action] ||
    action.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
  );
}

export type ActivityTone = 'create' | 'update' | 'destructive' | 'restore' | 'neutral';

/**
 * Tone is derived from the verb rather than a hard-coded list of actions, so a
 * new backend action still gets a sensible colour instead of falling back to
 * grey.
 */
export function getActionTone(action: string): ActivityTone {
  const normalized = action.toLowerCase();
  // Sign-in/out is bookkeeping, not a change — keep it visually quiet.
  if (/^signed /.test(normalized)) return 'neutral';
  if (/^(added|created|uploaded|assigned)/.test(normalized)) return 'create';
  if (/^(deleted|archived|removed|deactivated|disabled|auto-closed)/.test(normalized)) {
    return 'destructive';
  }
  if (/^(reactivated|restored|enabled|moved)/.test(normalized)) return 'restore';
  if (/^(updated|changed|modified|renamed|requested)/.test(normalized)) return 'update';
  return 'neutral';
}

/**
 * The `dark:` colours are repeated on purpose: `.label-strong` sets its own
 * `dark:text-gray-500`, which outranks a bare `text-*` utility in dark mode and
 * turned every badge grey.
 */
export const ACTION_TONE_CLASSES: Record<ActivityTone, string> = {
  create:
    'bg-mintcom-green/10 text-mintcom-green dark:text-mintcom-green border-mintcom-green/20',
  update:
    'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  destructive:
    'bg-mintcom-red/10 text-mintcom-red dark:text-mintcom-red border-mintcom-red/20',
  restore:
    'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  neutral:
    'bg-gray-500/10 text-gray-600 dark:text-gray-300 border-gray-500/20',
};

export interface ActivityDayGroup<T> {
  /** Local `YYYY-MM-DD` key for the day. */
  key: string;
  /** First timestamp of the day, for locale-aware header formatting. */
  date: Date;
  items: T[];
}

const dayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;

/**
 * Group entries by local calendar day, preserving the order the API returned
 * them in (newest first).
 */
export function groupLogsByDay<T extends { timestamp: string }>(
  logs: T[],
): ActivityDayGroup<T>[] {
  const groups: ActivityDayGroup<T>[] = [];

  for (const log of logs) {
    const date = new Date(log.timestamp);
    if (Number.isNaN(date.getTime())) continue;
    const key = dayKey(date);
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.items.push(log);
    } else {
      groups.push({ key, date, items: [log] });
    }
  }

  return groups;
}

/** Display name for whoever performed the action. */
export function getActorName(log: ActivityLogEntry, ownerLabel: string): string {
  const fullName =
    `${log.performedBy?.firstName || ''} ${log.performedBy?.lastName || ''}`.trim();
  return (
    log.performedBy?.name?.trim() ||
    fullName ||
    log.performedBy?.username?.trim() ||
    ownerLabel
  );
}

export function getActorInitial(log: ActivityLogEntry, ownerLabel: string): string {
  return getActorName(log, ownerLabel).charAt(0).toUpperCase() || 'A';
}

/** `today` / `yesterday` / null when the day needs a full date label. */
export function getRelativeDayKey(date: Date, now = new Date()): 'today' | 'yesterday' | null {
  const today = dayKey(now);
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);

  if (dayKey(date) === today) return 'today';
  if (dayKey(date) === dayKey(yesterdayDate)) return 'yesterday';
  return null;
}
