import { supabase } from '@/lib/supabase';
import { Program, ProgramTask, ProgramTemplate, ProgramTemplateTask, Task } from '@/types/models';

export async function listPrograms(familyId: string): Promise<Program[]> {
  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .eq('family_id', familyId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Program[];
}

export async function listProgramTemplates(): Promise<ProgramTemplate[]> {
  const { data, error } = await supabase.from('program_templates').select('*').order('sort_order');
  if (error) throw error;
  return data as ProgramTemplate[];
}

export async function listTemplateTasks(templateId: string): Promise<ProgramTemplateTask[]> {
  const { data, error } = await supabase
    .from('program_template_tasks')
    .select('*')
    .eq('template_id', templateId)
    .order('sort_order');
  if (error) throw error;
  return data as ProgramTemplateTask[];
}

export async function createProgramFromTemplate(familyId: string, templateId: string): Promise<Program> {
  const { data, error } = await supabase.rpc('create_program_from_template', {
    p_family_id: familyId,
    p_template_id: templateId,
  });
  if (error) throw error;
  return data as Program;
}

export async function enrollChildInProgram(programId: string, childId: string) {
  const { error } = await supabase.rpc('enroll_child_in_program', {
    p_program_id: programId,
    p_child_id: childId,
  });
  if (error) throw error;
}

export interface ProgramWithTasks extends Program {
  tasks: (ProgramTask & { task: Task })[];
}

export async function getProgramWithTasks(programId: string): Promise<ProgramWithTasks> {
  const { data, error } = await supabase
    .from('programs')
    .select('*, tasks:program_tasks(*, task:tasks(*))')
    .eq('id', programId)
    .single();
  if (error) throw error;
  return data as unknown as ProgramWithTasks;
}

export async function createProgram(
  familyId: string,
  name: string,
  icon: string,
  completionBonusPoints: number,
): Promise<Program> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('not authenticated');

  const { data, error } = await supabase
    .from('programs')
    .insert({
      family_id: familyId,
      created_by: user.id,
      name,
      icon,
      completion_bonus_points: completionBonusPoints,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Program;
}

export async function addTaskToProgram(programId: string, taskId: string, sortOrder: number) {
  const { error } = await supabase
    .from('program_tasks')
    .insert({ program_id: programId, task_id: taskId, sort_order: sortOrder });
  if (error) throw error;
}

export async function updateProgramBonus(programId: string, completionBonusPoints: number) {
  const { error } = await supabase
    .from('programs')
    .update({ completion_bonus_points: completionBonusPoints })
    .eq('id', programId);
  if (error) throw error;
}

export async function getProgramEnrolledChildIds(programId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('program_tasks')
    .select('task:tasks(assignments:task_assignments(child_id))')
    .eq('program_id', programId);
  if (error) throw error;

  type Row = { task: { assignments: { child_id: string }[] } };
  const ids = new Set<string>();
  (data as unknown as Row[]).forEach((row) => row.task.assignments.forEach((a) => ids.add(a.child_id)));
  return Array.from(ids);
}
