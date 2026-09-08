/**
 * Brand date params — UTC building for brand dashboard queries.
 *
 * Duplicated deliberately with headers naming all three copies, per
 * mintcom-pos/src/utils/shiftDuration.ts convention:
 * - mintcom-api/src/common/utils/brandDateParams.ts (authoritative parse rule)
 * - mintcom-website/src/utils/brandDateParams.ts
 * - mintcom-admin-portal/src/utils/brandDateParams.ts
 *
 * Clients build ISO-Z strings; the API (authoritative) asserts no-Z parses as UTC.
 */

export function buildBrandDateParams(args: {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
}): { timeRange: string; startDate: string; endDate: string } {
  const { startDate, endDate, startTime, endTime } = args;
  return {
    timeRange: 'custom',
    startDate: `${startDate}T${startTime}:00Z`,
    endDate: `${endDate}T${endTime}:59Z`,
  };
}
