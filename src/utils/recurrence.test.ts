import { isTaskDueOn } from './recurrence';
import { Task } from '@/types/models';

function makeTask(overrides: Partial<Task>): Task {
  return {
    id: 't1',
    family_id: 'f1',
    created_by: 'u1',
    title: 'Test task',
    description: null,
    icon: 'star',
    category: null,
    points: 10,
    priority: 'medium',
    recurrence_type: 'once',
    recurrence_days: [],
    recurrence_day_of_month: null,
    start_date: '2026-01-01',
    end_date: null,
    time_of_day: null,
    approval_mode: 'manual',
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('isTaskDueOn', () => {
  it('a "once" task is only due on its start date', () => {
    const task = makeTask({ recurrence_type: 'once', start_date: '2026-03-10' });
    expect(isTaskDueOn(task, new Date('2026-03-10T12:00:00'))).toBe(true);
    expect(isTaskDueOn(task, new Date('2026-03-11T12:00:00'))).toBe(false);
  });

  it('a "daily" task is due every day within its range', () => {
    const task = makeTask({ recurrence_type: 'daily', start_date: '2026-03-01' });
    expect(isTaskDueOn(task, new Date('2026-03-05T12:00:00'))).toBe(true);
    expect(isTaskDueOn(task, new Date('2026-02-28T12:00:00'))).toBe(false);
  });

  it('respects end_date', () => {
    const task = makeTask({ recurrence_type: 'daily', start_date: '2026-03-01', end_date: '2026-03-05' });
    expect(isTaskDueOn(task, new Date('2026-03-05T12:00:00'))).toBe(true);
    expect(isTaskDueOn(task, new Date('2026-03-06T12:00:00'))).toBe(false);
  });

  it('a "custom_days" task only matches its selected weekdays', () => {
    // 2026-03-02 is a Monday (day 1)
    const task = makeTask({ recurrence_type: 'custom_days', start_date: '2026-03-01', recurrence_days: [1, 3, 5] });
    expect(isTaskDueOn(task, new Date('2026-03-02T12:00:00'))).toBe(true); // Monday
    expect(isTaskDueOn(task, new Date('2026-03-03T12:00:00'))).toBe(false); // Tuesday
  });

  it('a "monthly" task matches the same day-of-month', () => {
    const task = makeTask({ recurrence_type: 'monthly', start_date: '2026-01-15', recurrence_day_of_month: 15 });
    expect(isTaskDueOn(task, new Date('2026-04-15T12:00:00'))).toBe(true);
    expect(isTaskDueOn(task, new Date('2026-04-16T12:00:00'))).toBe(false);
  });
});
