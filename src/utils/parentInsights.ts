import { ChildAnalytics } from '@/services/analytics.service';

export interface ChildInsightInput {
  childName: string;
  current: ChildAnalytics;
  previous: ChildAnalytics;
  goals?: { name: string; target_points: number; is_achieved: boolean }[];
  pointsBalance?: number;
}

/** Rule-based notes only — every one below is a direct read of the numbers, never a guess. */
export function generateChildInsights(input: ChildInsightInput): string[] {
  const { childName, current, previous, goals, pointsBalance } = input;
  const notes: string[] = [];

  if (current.completion_rate !== null && previous.completion_rate !== null) {
    const diff = Math.round(current.completion_rate - previous.completion_rate);
    if (diff >= 10) notes.push(`ارتفع التزام ${childName} مقارنة بالفترة السابقة (+${diff}%)`);
    else if (diff <= -10) notes.push(`انخفض التزام ${childName} مقارنة بالفترة السابقة (${diff}%)`);
  }

  if (current.most_missed_tasks.length > 0) {
    const top = current.most_missed_tasks[0];
    notes.push(`هناك ${current.most_missed_tasks.length} مهام تتكرر دون إنجاز لدى ${childName}، أبرزها "${top.title}"`);
  }

  if (current.most_consistent_program) {
    notes.push(`"${current.most_consistent_program.name}" هو البرنامج الأكثر انتظامًا لدى ${childName}`);
  }

  if (goals && pointsBalance !== undefined) {
    for (const g of goals) {
      if (g.is_achieved) continue;
      const progress = pointsBalance / g.target_points;
      if (progress >= 0.8) notes.push(`اقترب ${childName} من هدفه "${g.name}"`);
    }
  }

  if (current.completions_approved === 0 && current.completions_recorded === 0) {
    notes.push(`لا توجد مهام مسجلة لـ${childName} خلال هذه الفترة`);
  }

  return notes;
}
