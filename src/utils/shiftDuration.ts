/**
 * UI locale for Intl narrow units. Callers pass their i18next language
 * (e.g. `i18n.language`); the default keeps pure-logic consumers free of
 * the app's i18n singleton.
 *
 * Bare "ar" falls back to Western digits in ICU, so it is normalized to
 * ar-EG (Eastern Arabic digits), matching the rest of the Arabic UI.
 * Region variants (ar-SA, ar-EG, …) already use Eastern digits untouched.
 */
const normalizeDurationLocale = (locale: string): string => {
    if (!locale) return 'en-US';
    const low = locale.toLowerCase();
    if (low === 'ar') return 'ar-EG';
    return locale;
};

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
 * Human duration ("142h 19m" / "4h" / "45m"). Anything under a minute
 * collapses to "<1m" so a one-second shift doesn't read as a zero-length
 * one. Zero minutes are dropped ("4h", not "4h 0m").
 *
 * Units come from Intl.NumberFormat (narrow), so digits and unit labels
 * follow the UI locale (incl. RTL) instead of hardcoded "h"/"m".
 * Times are raw elapsed wall-time — never UTC-converted.
 */
const hourPart = (value: number, locale: string): string =>
    new Intl.NumberFormat(locale, {
        style: 'unit',
        unit: 'hour',
        unitDisplay: 'narrow',
    }).format(value);

const minutePart = (value: number, locale: string): string =>
    new Intl.NumberFormat(locale, {
        style: 'unit',
        unit: 'minute',
        unitDisplay: 'narrow',
    }).format(value);

export const formatDurationMs = (ms: number | null, locale: string = 'en-US'): string => {
    const resolved = normalizeDurationLocale(locale);
    if (ms === null || ms === undefined) return '-';

    const totalMinutes = Math.floor(Math.max(ms, 0) / 60_000);
    if (totalMinutes < 1) {
        return `<${minutePart(1, resolved)}`;
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0) {
        return minutePart(minutes, resolved);
    }
    if (minutes === 0) {
        return hourPart(hours, resolved);
    }
    const h = hourPart(hours, resolved);
    const m = minutePart(minutes, resolved);
    return resolved.toLowerCase().startsWith('zh') ? `${h}${m}` : `${h} ${m}`;
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
