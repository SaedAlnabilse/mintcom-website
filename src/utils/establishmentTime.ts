import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Establishment } from '../types';
import {
  getCountryTimeZones,
  getDeviceTimeZone,
  normalizeTimeZone,
} from '../data/globalLocaleOptions';

// Single source of truth for worldwide date/time in the web backoffice.
// Mirrors mintcom-pos/src/utils/timezone.ts:
//   1. Active establishment.timezone (chosen at onboarding, per location)
//   2. Device timezone (pre-login fallback)
//   3. 'UTC'

export const FALLBACK_TIMEZONE = 'UTC';

export function resolveEstablishmentTimeZone(
  establishment?: Establishment | null,
  fallback?: string | null,
): string {
  const fromEst = normalizeTimeZone(establishment?.timezone);
  if (fromEst) return fromEst;
  const fromFallback = normalizeTimeZone(fallback);
  if (fromFallback) return fromFallback;
  try {
    return getDeviceTimeZone() || FALLBACK_TIMEZONE;
  } catch {
    return FALLBACK_TIMEZONE;
  }
}

export function useEstablishmentTimeZone(): string {
  const { currentEstablishment } = useAuth();
  const establishmentTimeZone = currentEstablishment?.timezone;
  return useMemo(
    () => resolveEstablishmentTimeZone({ timezone: establishmentTimeZone } as Establishment),
    [establishmentTimeZone],
  );
}

export function getTimezoneQueryParam(establishment?: Establishment | null): string {
  return resolveEstablishmentTimeZone(establishment);
}

// Format an ISO instant in the establishment's wall time.
// Always pass timeZone explicitly — bare toLocaleString() renders in the
// viewer's browser zone and breaks worldwide SaaS (London owner vs Dubai store).
export function formatInEstablishmentTimezone(
  date: Date | string | number | null | undefined,
  locale: string,
  options?: Intl.DateTimeFormatOptions,
  establishmentOrTz?: Establishment | string | null,
): string {
  if (date === null || date === undefined || date === '') return '';
  const tz =
    typeof establishmentOrTz === 'string'
      ? normalizeTimeZone(establishmentOrTz) || getDeviceTimeZone()
      : resolveEstablishmentTimeZone(
          establishmentOrTz as Establishment | null | undefined,
        );
  try {
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) return String(date);
    return new Intl.DateTimeFormat(locale, { ...options, timeZone: tz }).format(d);
  } catch {
    try {
      const d = date instanceof Date ? date : new Date(date as string);
      return new Intl.DateTimeFormat(locale, options).format(d);
    } catch {
      return String(date);
    }
  }
}

export function formatDateTimeInEstablishmentTimezone(
  date: Date | string | number | null | undefined,
  locale: string,
  establishmentOrTz?: Establishment | string | null,
): string {
  return formatInEstablishmentTimezone(
    date,
    locale,
    { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' },
    establishmentOrTz,
  );
}

// ---- Wall-time <-> UTC helpers (no extra deps) ----

function getTimeZoneOffsetMs(timeZone: string, date: Date): number {
  try {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const parts = dtf.formatToParts(date);
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '0';
    const asUTC = Date.UTC(
      Number(get('year')),
      Number(get('month')) - 1,
      Number(get('day')),
      Number(get('hour')),
      Number(get('minute')),
      Number(get('second')),
    );
    return asUTC - date.getTime();
  } catch {
    return 0;
  }
}

// Interpret a wall time ("2026-09-09" + "00:00") as seen on the store's wall
// clock in `timeZone`, returning the matching UTC instant for API queries.
export function zonedWallTimeToUtc(
  dateStr: string,
  timeStr: string,
  timeZone: string,
): Date {
  const tz = normalizeTimeZone(timeZone) || FALLBACK_TIMEZONE;
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh = 0, mm = 0] = (timeStr || '00:00').split(':').map(Number);
  if (!y || !m || !d) return new Date(`${dateStr}T${timeStr || '00:00'}`);
  // Guess UTC, then correct by the zone offset at that instant (2 passes converge DST).
  let utc = new Date(Date.UTC(y, m - 1, d, hh, mm, 0));
  for (let i = 0; i < 2; i++) {
    const offset = getTimeZoneOffsetMs(tz, utc);
    utc = new Date(Date.UTC(y, m - 1, d, hh, mm, 0) - offset);
  }
  return utc;
}

// Current wall-clock parts in a zone, for building "today in store time".
function getZonedParts(timeZone: string, at: Date = new Date()): { y: number; m: number; d: number } {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(at);
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '0';
    return { y: Number(get('year')), m: Number(get('month')), d: Number(get('day')) };
  } catch {
    const f = new Date(at);
    return { y: f.getFullYear(), m: f.getMonth() + 1, d: f.getDate() };
  }
}

function toDateInput(y: number, m: number, d: number): string {
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// "Today" inputs (YYYY-MM-DD) in store time, so quick ranges never shift a day
// for viewers west/east of the store.
export function getTodayInputInTimezone(timeZone: string, at: Date = new Date()): string {
  const tz = normalizeTimeZone(timeZone) || FALLBACK_TIMEZONE;
  const p = getZonedParts(tz, at);
  return toDateInput(p.y, p.m, p.d);
}

export function shiftDateInput(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return toDateInput(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

export function getTimezonesForCountry(countryCode: string | null | undefined): string[] {
  return getCountryTimeZones(countryCode);
}

// Calendar-day comparison in store time (not viewer time).
function ymdInTimezone(date: Date, timeZone: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00';
    return `${get('year')}-${get('month')}-${get('day')}`;
  } catch {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }
}

export function isTodayInTimezone(date: Date, timeZone: string): boolean {
  return ymdInTimezone(date, timeZone) === ymdInTimezone(new Date(), timeZone);
}

export function isYesterdayInTimezone(date: Date, timeZone: string): boolean {
  const tz = normalizeTimeZone(timeZone) || FALLBACK_TIMEZONE;
  const todayInput = getTodayInputInTimezone(tz);
  const yesterdayInput = shiftDateInput(todayInput, -1);
  return ymdInTimezone(date, tz) === yesterdayInput;
}

export { normalizeTimeZone, getDeviceTimeZone };
