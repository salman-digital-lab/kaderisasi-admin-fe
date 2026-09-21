import type { CalendarEvent } from "../types/model/calendar";

const DAY = 86_400_000;
export const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

export function wibDate(value: string | Date = new Date()): string {
  return new Date(new Date(value).getTime() + 7 * 3_600_000)
    .toISOString()
    .slice(0, 10);
}

export function addDays(date: string, amount: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + amount * DAY)
    .toISOString()
    .slice(0, 10);
}

export function monthStart(date: string): string {
  return `${date.slice(0, 7)}-01`;
}

export function shiftMonth(date: string, amount: number): string {
  const at = new Date(`${monthStart(date)}T00:00:00Z`);
  at.setUTCMonth(at.getUTCMonth() + amount);
  return at.toISOString().slice(0, 10);
}

export function monthDays(month: string, grid: boolean): string[] {
  const first = monthStart(month);
  const next = shiftMonth(first, 1);
  const offset = (new Date(`${first}T00:00:00Z`).getUTCDay() + 6) % 7;
  const count = (Date.parse(next) - Date.parse(first)) / DAY;
  const start = grid ? addDays(first, -offset) : first;
  return Array.from(
    { length: grid ? Math.ceil((offset + count) / 7) * 7 : count },
    (_, index) => addDays(start, index),
  );
}

export function midnight(date: string): string {
  return `${date}T00:00:00+07:00`;
}

export function eventsOnDay(
  events: CalendarEvent[],
  date: string,
): CalendarEvent[] {
  const start = Date.parse(midnight(date));
  return events.filter(
    (event) =>
      Date.parse(event.starts_at) < start + DAY &&
      Date.parse(event.ends_at) > start,
  );
}

export function monthLabel(month: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(midnight(month)));
}

export function dateLabel(date: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(midnight(date)));
}

export function eventSchedule(event: CalendarEvent): string {
  const format = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
  const end = new Date(Date.parse(event.ends_at) - 1);
  const startLabel = format.format(new Date(event.starts_at));
  const endLabel = format.format(end);
  return startLabel === endLabel ? startLabel : `${startLabel} – ${endLabel}`;
}
