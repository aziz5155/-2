import { Task } from '@/types/models';

/** Returns whether a task is due on the given date, based on its recurrence rule. */
export function isTaskDueOn(task: Task, date: Date): boolean {
  const iso = toDateOnly(date);
  if (iso < task.start_date) return false;
  if (task.end_date && iso > task.end_date) return false;

  switch (task.recurrence_type) {
    case 'once':
      return iso === task.start_date;
    case 'daily':
      return true;
    case 'weekly':
      return date.getDay() === new Date(task.start_date).getDay();
    case 'custom_days':
      return task.recurrence_days.includes(date.getDay());
    case 'monthly':
      return date.getDate() === (task.recurrence_day_of_month ?? new Date(task.start_date).getDate());
    default:
      return false;
  }
}

export function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function todayDateOnly(): string {
  return toDateOnly(new Date());
}
