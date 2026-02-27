import { addDays, format, startOfWeek } from "date-fns";

export function isoDate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function weekStartMonday(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 }); // Monday
}

export function weekDays(date: Date): { start: Date; days: Date[] } {
  const start = weekStartMonday(date);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  return { start, days };
}
