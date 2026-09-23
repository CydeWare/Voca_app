import { describeRepeat, formatDuration, getNextOccurrence } from '../src/utils/dateUtils';
import { wakeUpDelayMs } from '../src/store/selectors/historySelectors';

// Wed 17 Sep 2025, 08:00 local time
const now = new Date(2025, 8, 17, 8, 0, 0);

describe('getNextOccurrence', () => {
  it('one-shot later today', () => {
    const d = getNextOccurrence({ hour: 9, minute: 30, repeatDays: [] }, now);
    expect(d.getDate()).toBe(17);
    expect(d.getHours()).toBe(9);
  });
  it('one-shot already passed rolls to tomorrow', () => {
    const d = getNextOccurrence({ hour: 7, minute: 0, repeatDays: [] }, now);
    expect(d.getDate()).toBe(18);
  });
  it('exactly now rolls forward', () => {
    expect(getNextOccurrence({ hour: 8, minute: 0, repeatDays: [] }, now).getDate()).toBe(18);
  });
  it('repeating picks the next matching weekday', () => {
    const d = getNextOccurrence({ hour: 7, minute: 0, repeatDays: [1] }, now); // Monday
    expect(d.getDay()).toBe(1);
    expect(d.getDate()).toBe(22);
  });
  it('repeating today, later', () => {
    expect(getNextOccurrence({ hour: 10, minute: 0, repeatDays: [3] }, now).getDate()).toBe(17);
  });
  it('repeating today, already passed -> next week', () => {
    expect(getNextOccurrence({ hour: 7, minute: 0, repeatDays: [3] }, now).getDate()).toBe(24);
  });
});

describe('formatting', () => {
  it('describes repeat patterns', () => {
    expect(describeRepeat([])).toBe('Once');
    expect(describeRepeat([1, 2, 3, 4, 5])).toBe('Weekdays');
    expect(describeRepeat([0, 6])).toBe('Weekends');
    expect(describeRepeat([0, 1, 2, 3, 4, 5, 6])).toBe('Every day');
  });
  it('formats wake-up delay', () => {
    expect(formatDuration(134000)).toBe('2m 14s');
    expect(formatDuration(9000)).toBe('9s');
    expect(
      wakeUpDelayMs({ scheduledAt: '2025-09-17T00:00:00.000Z', dismissedAt: '2025-09-17T00:02:14.000Z' }),
    ).toBe(134000);
  });
});
