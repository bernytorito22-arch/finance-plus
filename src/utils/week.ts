import { CycleRange, WeekRange, WeekRangeStatus } from "../types";

export type WeekNumber = 1 | 2 | 3 | 4;

const MONTH_LABELS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export function clampMonthStartDay(day: number): number {
  if (!Number.isFinite(day)) return 1;
  return Math.min(28, Math.max(1, Math.round(day)));
}

export function toDateOnlyString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateOnly(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function daysBetweenInclusive(start: Date, end: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((startOfDay(end).getTime() - startOfDay(start).getTime()) / msPerDay) + 1;
}

export function formatShortDateLabel(date: Date): string {
  return `${date.getDate()} ${MONTH_LABELS[date.getMonth()]}`;
}

export function formatDateRangeLabel(start: Date, end: Date): string {
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  if (sameMonth) {
    return `${start.getDate()}-${end.getDate()} ${MONTH_LABELS[start.getMonth()]}`;
  }
  return `${formatShortDateLabel(start)} - ${formatShortDateLabel(end)}`;
}

export function formatWeekRangeLabel(range: Pick<WeekRange, "startDate" | "endDate">): string {
  return formatDateRangeLabel(parseDateOnly(range.startDate), parseDateOnly(range.endDate));
}

export function getFinanceCycleRange(
  referenceDate = new Date(),
  monthStartDay = 1
): CycleRange {
  const startDay = clampMonthStartDay(monthStartDay);
  const ref = startOfDay(referenceDate);
  const year = ref.getFullYear();
  const month = ref.getMonth();
  const day = ref.getDate();

  let cycleStart: Date;
  if (day >= startDay) {
    cycleStart = new Date(year, month, startDay);
  } else {
    cycleStart = new Date(year, month - 1, startDay);
  }

  const nextCycleStart = new Date(cycleStart.getFullYear(), cycleStart.getMonth() + 1, startDay);
  const cycleEnd = addDays(nextCycleStart, -1);

  const startDate = toDateOnlyString(cycleStart);
  const endDate = toDateOnlyString(cycleEnd);

  return {
    startDate,
    endDate,
    label: formatDateRangeLabel(cycleStart, cycleEnd),
    fileSlug: `${startDate}_${endDate}`,
  };
}

function getWeekRangeStatus(startDate: string, endDate: string, referenceDate = new Date()): WeekRangeStatus {
  const ref = startOfDay(referenceDate);
  const start = startOfDay(parseDateOnly(startDate));
  const end = startOfDay(parseDateOnly(endDate));

  if (ref > end) return "completed";
  if (ref < start) return "upcoming";
  return "current";
}

export function getFinanceWeekRanges(
  cycleRange: CycleRange,
  referenceDate = new Date()
): WeekRange[] {
  const cycleStart = parseDateOnly(cycleRange.startDate);
  const cycleEnd = parseDateOnly(cycleRange.endDate);
  const ranges: WeekRange[] = [];
  let cursor = cycleStart;

  for (let week = 1; week <= 4; week++) {
    let weekEnd: Date;
    if (week < 4) {
      weekEnd = addDays(cursor, 6);
      if (weekEnd > cycleEnd) {
        weekEnd = cycleEnd;
      }
    } else {
      weekEnd = cycleEnd;
    }

    const startDate = toDateOnlyString(cursor);
    const endDate = toDateOnlyString(weekEnd);

    ranges.push({
      week: week as WeekNumber,
      startDate,
      endDate,
      label: formatDateRangeLabel(cursor, weekEnd),
      status: getWeekRangeStatus(startDate, endDate, referenceDate),
    });

    if (weekEnd >= cycleEnd) {
      break;
    }

    cursor = addDays(weekEnd, 1);
  }

  while (ranges.length < 4) {
    const lastRange = ranges[ranges.length - 1];
    const fillerWeek = (ranges.length + 1) as WeekNumber;
    ranges.push({
      week: fillerWeek,
      startDate: lastRange.endDate,
      endDate: lastRange.endDate,
      label: lastRange.label,
      status: "completed",
    });
  }

  return ranges;
}

export function getSuggestedWeekOfMonth(
  referenceDate = new Date(),
  monthStartDay = 1
): WeekNumber {
  const cycleRange = getFinanceCycleRange(referenceDate, monthStartDay);
  const weekRanges = getFinanceWeekRanges(cycleRange, referenceDate);
  const ref = startOfDay(referenceDate);

  for (const range of weekRanges) {
    const start = startOfDay(parseDateOnly(range.startDate));
    const end = startOfDay(parseDateOnly(range.endDate));
    if (ref >= start && ref <= end) {
      return range.week;
    }
  }

  return 4;
}

export function isDateInRange(
  dateInput: string | Date,
  startDate: string,
  endDate: string
): boolean {
  const date = typeof dateInput === "string"
    ? startOfDay(new Date(dateInput))
    : startOfDay(dateInput);
  const start = startOfDay(parseDateOnly(startDate));
  const end = startOfDay(parseDateOnly(endDate));
  return date >= start && date <= end;
}

export function getDaysRemainingInRange(
  range: Pick<WeekRange, "startDate" | "endDate">,
  referenceDate = new Date()
): number {
  const ref = startOfDay(referenceDate);
  const end = startOfDay(parseDateOnly(range.endDate));
  if (ref > end) return 0;
  return daysBetweenInclusive(ref, end);
}

export function getCurrentWeekRange(
  cycleRange: CycleRange,
  referenceDate = new Date(),
  monthStartDay = 1
): WeekRange {
  const weekRanges = getFinanceWeekRanges(cycleRange, referenceDate);
  const suggested = getSuggestedWeekOfMonth(referenceDate, monthStartDay);
  return weekRanges.find((range) => range.week === suggested) ?? weekRanges[0];
}
