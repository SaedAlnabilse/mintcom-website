import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays, FileText, History } from 'lucide-react';

import {
  ACTION_TONE_CLASSES,
  getActionTone,
  getActorInitial,
  getActorName,
  getMetadataEntries,
  getRelativeDayKey,
  getVisibleMetadataEntries,
  groupLogsByDay,
} from '../../../utils/activityLog';
import type { ActivityLogEntry, MetadataFormatOptions } from '../../../utils/activityLog';

/** Metadata fields shown inline before the rest collapse into "+N more". */
const INLINE_METADATA_LIMIT = 3;

interface ActivityTimelineProps {
  logs: ActivityLogEntry[];
  isLoading: boolean;
  /** Current search term, only used to word the empty state. */
  searchQuery: string;
  /** BCP-47 tag for time/date formatting, e.g. `en-US`. */
  dateLocale: string;
  metadataOptions: MetadataFormatOptions;
  getActionLabel: (action: string) => string;
  onSelect: (log: ActivityLogEntry) => void;
}

/**
 * Day-grouped feed of activity entries.
 *
 * Replaces the previous five-column table: with the date lifted into a day
 * header and the description and metadata on their own lines, nothing has to be
 * clipped to fit a cell.
 */
export function ActivityTimeline({
  logs,
  isLoading,
  searchQuery,
  dateLocale,
  metadataOptions,
  getActionLabel,
  onSelect,
}: ActivityTimelineProps) {
  const { t } = useTranslation();
  const ownerLabel = t('activity.owner');
  const systemLabel = t('activity.system');

  const groups = useMemo(() => groupLogsByDay(logs), [logs]);

  const formatTime = (timestamp: string) =>
    new Date(timestamp).toLocaleTimeString(dateLocale, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

  /** "Today" / "Yesterday" for recent days, otherwise a full weekday + date. */
  const formatDayHeading = (date: Date) => {
    const relative = getRelativeDayKey(date);
    if (relative === 'today') return t('activity.today');
    if (relative === 'yesterday') return t('activity.yesterday');
    return date.toLocaleDateString(dateLocale, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex-1 py-32 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-mintcom-green/10 border-t-mintcom-green rounded-full animate-spin" />
          <p className="label-strong font-sans">{t('activity.loading')}</p>
        </div>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="flex-1 py-32 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center">
            <History size={24} className="text-gray-300" />
          </div>
          {searchQuery.trim() ? (
            <>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('common.noResults')}</h3>
              <p className="text-sm font-bold text-gray-500">
                {t('common.noMatchingResults', {
                  entity: 'logs',
                  query: searchQuery.trim(),
                })}
              </p>
            </>
          ) : (
            <p className="text-gray-500 font-bold text-xs tracking-widest">{t('activity.noLogs')}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1">
      {groups.map((group) => (
        <section key={group.key}>
          {/* Day separator — the date moves out of every row, so each entry
              only has to carry its time. */}
          <div className="flex items-center gap-2 px-5 sm:px-7 py-2.5 bg-gray-50 dark:bg-white/[0.03] border-y border-gray-100 dark:border-white/5">
            <CalendarDays size={13} className="text-gray-400 shrink-0" />
            <span className="label-strong font-sans">{formatDayHeading(group.date)}</span>
          </div>

          <ol className="divide-y divide-gray-100 dark:divide-white/5">
            {group.items.map((log) => {
              const inlineEntries = getVisibleMetadataEntries(log.metadata, metadataOptions).slice(
                0,
                INLINE_METADATA_LIMIT,
              );
              const totalFields = getMetadataEntries(log.metadata, metadataOptions).length;
              const hiddenFields = totalFields - inlineEntries.length;

              return (
                <li
                  key={log.id}
                  className="px-5 sm:px-7 py-5 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex gap-4">
                    <div className="w-9 h-9 shrink-0 rounded-xl bg-mintcom-green/10 text-mintcom-green flex items-center justify-center text-sm font-black">
                      {getActorInitial(log, ownerLabel, systemLabel)}
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                        <span className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">
                          {getActorName(log, ownerLabel, systemLabel)}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-lg label-strong font-sans whitespace-nowrap border ${
                            ACTION_TONE_CLASSES[getActionTone(log.action)]
                          }`}
                        >
                          {getActionLabel(log.action)}
                        </span>
                        <span className="ms-auto text-xs font-bold text-gray-400 tabular-nums whitespace-nowrap">
                          {formatTime(log.timestamp)}
                        </span>
                      </div>

                      <p className="text-sm font-medium leading-relaxed text-gray-600 dark:text-gray-300 break-words">
                        {log.description}
                      </p>

                      {totalFields > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          {inlineEntries.map((entry) => (
                            <span
                              key={entry.key}
                              title={`${entry.label}: ${entry.value}`}
                              className="inline-flex max-w-full items-baseline gap-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-2.5 py-1"
                            >
                              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 whitespace-nowrap">
                                {entry.label}
                              </span>
                              <span className="text-xs font-bold text-gray-700 dark:text-gray-200 truncate">
                                {entry.value}
                              </span>
                            </span>
                          ))}
                          <button
                            type="button"
                            onClick={() => onSelect(log)}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold text-gray-500 hover:text-mintcom-green hover:bg-mintcom-green/5 transition-colors"
                          >
                            <FileText size={13} />
                            {hiddenFields > 0
                              ? t('activity.moreFields', { count: hiddenFields })
                              : t('activity.viewData')}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
