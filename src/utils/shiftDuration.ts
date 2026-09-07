import type { TFunction } from 'i18next';

/**
 * Elapsed time of a shift in milliseconds.
 *
 * An open shift has no endTime, so it is measured against `now` — pass a
 * ticking value when the result is rendered so a live shift keeps counting up
 * instead of freezing at first paint.
 *
 * Returns null when the shift has no usable start/end, so callers can render a
 * placeholder rather than "0m" for missing data.
 */
export const getShiftDurationMs = (
    startTime?: string | Date | null,
    endTime?: string | Date | null,
    now: number = Date.now(),
): number | null => {
    if (!startTime) return null;

    const start = new Date(startTime).getTime();
    if (!Number.isFinite(start)) return null;

    const end = endTime ? new Date(endTime).getTime() : now;
    if (!Number.isFinite(end)) return null;

    // Clock skew between POS devices and the server can push endTime slightly
    // before startTime; a negative duration is never meaningful to an owner.
    return Math.max(end - start, 0);
};

/**
 * Human duration ("2h 15m" / "45m"). Anything under a minute collapses to
 * "<1m" so a one-second shift doesn't read as a zero-length one.
 */
export const formatDurationMs = (t: TFunction, ms: number | null): string => {
    if (ms === null) return '-';

    const totalMinutes = Math.floor(ms / 60_000);
    if (totalMinutes < 1) {
        return t('orders.reports.shifts.durationUnderMinute', { defaultValue: '<1m' });
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0) {
        return t('orders.reports.shifts.durationMinutes', { minutes, defaultValue: '{{minutes}}m' });
    }
    return t('orders.reports.shifts.durationHoursMinutes', {
        hours,
        minutes,
        defaultValue: '{{hours}}h {{minutes}}m',
    });
};

/**
 * "Now" for an open shift, never running past the end of the window being
 * reported on. Without this a shift someone left open days ago contributes
 * every hour since to a single-day report, inflating hours worked and
 * cratering the sales-per-hour figures. Mirrors the clamp the API applies to
 * its own hours-worked total.
 *
 * Every report that measures an open shift has to use the same cutoff, or two
 * tabs over the same shifts disagree.
 */
export const clampNowToRangeEnd = (now: number, rangeEnd?: string | Date | null): number => {
    if (!rangeEnd) return now;
    const end = new Date(rangeEnd).getTime();
    return Number.isFinite(end) ? Math.min(now, end) : now;
};

/**
 * Decimal hours (what the reports API returns for aggregate "hours worked") as
 * milliseconds, so those totals render in the same "2h 15m" shape as a single
 * shift's duration instead of a bare "7.5".
 */
export const hoursToMs = (hours?: number | null): number | null => {
    const numeric = Number(hours);
    if (!Number.isFinite(numeric)) return null;
    return Math.max(numeric, 0) * 3_600_000;
};
