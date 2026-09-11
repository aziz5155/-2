import { supabase } from '@/lib/supabase';
import { Task, TaskAssignment, TaskCompletion } from '@/types/models';
import { isTaskDueOn, todayDateOnly } from '@/utils/recurrence';

export type NewTaskInput = Omit<Task, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'is_active'>;

export interface FamilyTodayStats {
  dueToday: number;
  completedToday: number;
  pointsToday: number;
}

/** Approximate today's family-wide task progress, computed client-side from tasks + assignments + completions. */
export async function getFamilyTodayStats(familyId: string): Promise<FamilyTodayStats> {
  const today = new Date();
  const todayISO = todayDateOnly();

  const { data, error } = await supabase
    .from('tasks')
    .select('*, assignments:task_assignments(id, completions:task_completions(status, occurrence_date, points_awarded))')
    .eq('family_id', familyId)
    .eq('is_active', true);
  if (error) throw error;

  type Row = Task & { assignments: { id: string; completions: TaskCompletion[] }[] };
  const rows = data as unknown as Row[];

  let dueToday = 0;
  let completedToday = 0;
  let pointsToday = 0;

  for (const task of rows) {
    if (!isTaskDueOn(task, today)) continue;
    for (const assignment of task.assignments) {
      dueToday += 1;
      const completion = assignment.completions.find((c) => c.occurrence_date === todayISO);
      if (completion && (completion.status === 'approved' || completion.status === 'auto_approved')) {
        completedToday += 1;
        pointsToday += completion.points_awarded;
      }
    }
  }

  return { dueToday, completedToday, pointsToday };
}

export async function listFamilyTasks(familyId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('family_id', familyId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Task[];
}

export async function createTask(input: NewTaskInput, assignedChildIds: string[]): Promise<Task> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('not authenticated');

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({ ...input, created_by: user.id })
    .select()
    .single();
  if (error) throw error;

  if (assignedChildIds.length > 0) {
    const { error: assignErr } = await supabase
      .from('task_assignments')
      .insert(assignedChildIds.map((child_id) => ({ task_id: task.id, child_id })));
    if (assignErr) throw assignErr;
  }

  return task as Task;
}

export async function updateTask(taskId: string, patch: Partial<NewTaskInput>) {
  const { data, error } = await supabase.from('tasks').update(patch).eq('id', taskId).select().single();
  if (error) throw error;
  return data as Task;
}

export async function deleteTask(taskId: string) {
  const { error } = await supabase.from('tasks').update({ is_active: false }).eq('id', taskId);
  if (error) throw error;
}

export async function listAssignmentsForTask(taskId: string): Promise<TaskAssignment[]> {
  const { data, error } = await supabase.from('task_assignments').select('*').eq('task_id', taskId);
  if (error) throw error;
  return data as TaskAssignment[];
}

export interface ChildTaskWithAssignment extends Task {
  assignment_id: string;
  completion: TaskCompletion | null;
}

/** Tasks assigned to a child that are due on the given date, joined with that date's completion row, if any. */
export async function listChildTasksForDate(childId: string, dateISO: string): Promise<ChildTaskWithAssignment[]> {
  const { data, error } = await supabase
    .from('task_assignments')
    .select('id, task:tasks(*), completions:task_completions(*)')
    .eq('child_id', childId);
  if (error) throw error;

  type Row = { id: string; task: Task; completions: TaskCompletion[] };
  const date = new Date(`${dateISO}T00:00:00`);
  return (data as unknown as Row[])
    .filter((row) => row.task?.is_active && isTaskDueOn(row.task, date))
    .map((row) => ({
      ...row.task,
      assignment_id: row.id,
      completion: row.completions.find((c) => c.occurrence_date === dateISO) ?? null,
    }));
}

export interface DaySchedule {
  dateISO: string;
  tasks: ChildTaskWithAssignment[];
}

/** The next `days` days (including today) of due tasks for a child, computed client-side from one fetch. */
export async function listChildWeekSchedule(childId: string, days = 7): Promise<DaySchedule[]> {
  const { data, error } = await supabase
    .from('task_assignments')
    .select('id, task:tasks(*), completions:task_completions(*)')
    .eq('child_id', childId);
  if (error) throw error;

  type Row = { id: string; task: Task; completions: TaskCompletion[] };
  const rows = (data as unknown as Row[]).filter((row) => row.task?.is_active);

  const schedule: DaySchedule[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dateISO = date.toISOString().slice(0, 10);

    const tasks = rows
      .filter((row) => isTaskDueOn(row.task, date))
      .map((row) => ({
        ...row.task,
        assignment_id: row.id,
        completion: row.completions.find((c) => c.occurrence_date === dateISO) ?? null,
      }));

    schedule.push({ dateISO, tasks });
  }
  return schedule;
}

export async function completeTask(assignmentId: string, occurrenceDateISO: string, notes?: string): Promise<TaskCompletion> {
  const { data, error } = await supabase.rpc('complete_task', {
    p_assignment_id: assignmentId,
    p_occurrence_date: occurrenceDateISO,
    p_notes: notes ?? null,
  });
  if (error) throw error;
  return data as TaskCompletion;
}

/** Parent marks a task done on behalf of a child and approves it in one step. */
export async function parentQuickComplete(assignmentId: string, occurrenceDateISO: string): Promise<TaskCompletion> {
  const completion = await completeTask(assignmentId, occurrenceDateISO);
  if (completion.status === 'pending_approval') {
    return decideTaskCompletion(completion.id, true);
  }
  return completion;
}

export async function decideTaskCompletion(completionId: string, approve: boolean, note?: string): Promise<TaskCompletion> {
  const { data, error } = await supabase.rpc('decide_task_completion', {
    p_completion_id: completionId,
    p_approve: approve,
    p_note: note ?? null,
  });
  if (error) throw error;
  return data as TaskCompletion;
}

export interface PendingApproval extends TaskCompletion {
  task_title: string;
  task_icon: string;
  task_points: number;
  child_id: string;
  child_name: string;
}

export async function listPendingApprovals(familyId: string): Promise<PendingApproval[]> {
  const { data, error } = await supabase
    .from('task_completions')
    .select(
      'id, occurrence_date, status, completed_at, notes, task_assignment_id, assignment:task_assignments(child_id, child:children(name), task:tasks(title, icon, points, family_id))',
    )
    .eq('status', 'pending_approval');
  if (error) throw error;

  type Row = {
    id: string;
    occurrence_date: string;
    status: string;
    completed_at: string;
    notes: string | null;
    task_assignment_id: string;
    assignment: {
      child_id: string;
      child: { name: string };
      task: { title: string; icon: string; points: number; family_id: string };
    };
  };

  return (data as unknown as Row[])
    .filter((row) => row.assignment?.task?.family_id === familyId)
    .map((row) => ({
      id: row.id,
      task_assignment_id: row.task_assignment_id,
      occurrence_date: row.occurrence_date,
      status: row.status as TaskCompletion['status'],
      points_awarded: 0,
      notes: row.notes,
      completed_at: row.completed_at,
      decided_at: null,
      decided_by: null,
      point_transaction_id: null,
      created_at: row.completed_at,
      task_title: row.assignment.task.title,
      task_icon: row.assignment.task.icon,
      task_points: row.assignment.task.points,
      child_id: row.assignment.child_id,
      child_name: row.assignment.child.name,
    }));
}
