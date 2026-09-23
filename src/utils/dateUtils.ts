import type { Alarm, Weekday } from '../types/alarm';

export const WEEKDAYS: { day: Weekday; short: string; letter: string }[] = [
  { day: 1, short: 'Mon', letter: 'M' },
  { day: 2, short: 'Tue', letter: 'T' },
  { day: 3, short: 'Wed', letter: 'W' },
  { day: 4, short: 'Thu', letter: 'T' },
  { day: 5, short: 'Fri', letter: 'F' },
  { day: 6, short: 'Sat', letter: 'S' },
  { day: 0, short: 'Sun', letter: 'S' },
];

const LONG_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const pad2 = (n: number) => String(n).padStart(2, '0');

export function formatTime(hour: number, minute: number): string {
  return `${pad2(hour)}:${pad2(minute)}`;
}

/** Next trigger time strictly after `now`. Mirrors AlarmScheduler.nextTrigger in Kotlin. */
export function getNextOccurrence(
  alarm: Pick<Alarm, 'hour' | 'minute' | 'repeatDays'>,
  now: Date = new Date(),
): Date {
  const base = new Date(now);
  base.setHours(alarm.hour, alarm.minute, 0, 0);
  if (alarm.repeatDays.length === 0) {
    if (base.getTime() <= now.getTime()) base.setDate(base.getDate() + 1);
    return base;
  }
  for (let offset = 0; offset <= 7; offset++) {
    const c = new Date(base);
    c.setDate(base.getDate() + offset);
    c.setHours(alarm.hour, alarm.minute, 0, 0);
    if ((alarm.repeatDays as number[]).includes(c.getDay()) && c.getTime() > now.getTime()) {
      return c;
    }
  }
  const fallback = new Date(base);
  fallback.setDate(base.getDate() + 7);
  return fallback;
}

export function describeRepeat(days: Weekday[]): string {
  if (days.length === 0) return 'Once';
  if (days.length === 7) return 'Every day';
  const sorted = [...days].sort();
  const key = sorted.join(',');
  if (key === '1,2,3,4,5') return 'Weekdays';
  if (key === '0,6') return 'Weekends';
  return WEEKDAYS.filter(w => days.includes(w.day)).map(w => w.short).join(' ');
}

/** "in 7 h 20 min", "in 45 min", "in less than a minute" */
export function describeTimeUntil(target: Date, now: Date = new Date()): string {
  const totalMin = Math.round((target.getTime() - now.getTime()) / 60000);
  if (totalMin < 1) return 'in less than a minute';
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const mins = totalMin % 60;
  const parts: string[] = [];
  if (days) parts.push(`${days} d`);
  if (hours) parts.push(`${hours} h`);
  if (mins && !days) parts.push(`${mins} min`);
  return `in ${parts.join(' ')}`;
}

export function describeDay(target: Date, now: Date = new Date()): string {
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOf(target) - startOf(now)) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  return LONG_DAYS[target.getDay()];
}

/** Milliseconds -> "2m 14s" */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatDateShort(iso: string): string {
  const d = new Date(iso);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${LONG_DAYS[d.getDay()].slice(0, 3)}, ${d.getDate()} ${months[d.getMonth()]}`;
}
