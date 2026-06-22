export type WeekNumber = 1 | 2 | 3 | 4;

export function getSuggestedWeekOfMonth(date = new Date()): WeekNumber {
  const day = date.getDate();
  if (day <= 7) return 1;
  if (day <= 14) return 2;
  if (day <= 21) return 3;
  return 4;
}
