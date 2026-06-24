import { supabase } from '@/lib/supabase';
import { Case, Pipeline, Stage, stagesForPipeline } from '@/types';

export async function listCases(practitionerId: string): Promise<Case[]> {
  const { data, error } = await supabase
    .from('cases')
    .select('*')
    .eq('practitioner_id', practitionerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Case[];
}

export async function getCase(id: string): Promise<Case | null> {
  const { data, error } = await supabase.from('cases').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data as Case) ?? null;
}

export interface NewCaseInput {
  family_name: string;
  loved_one?: string | null;
  substance?: string | null;
  pipeline: Pipeline;
}

export async function createCase(
  practitionerId: string,
  input: NewCaseInput,
): Promise<Case> {
  const { data, error } = await supabase
    .from('cases')
    .insert({
      practitioner_id: practitionerId,
      family_name: input.family_name,
      loved_one: input.loved_one ?? null,
      substance: input.substance ?? null,
      pipeline: input.pipeline,
      stage: 'inquiry',
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as Case;
}

export async function updateCaseStage(id: string, stage: Stage): Promise<void> {
  const { error } = await supabase.from('cases').update({ stage }).eq('id', id);
  if (error) throw error;
}

export async function updateCaseFields(
  id: string,
  fields: Partial<Pick<Case, 'family_name' | 'loved_one' | 'substance'>>,
): Promise<void> {
  const { error } = await supabase.from('cases').update(fields).eq('id', id);
  if (error) throw error;
}

/**
 * Move a case to the other pipeline. The case carries its file (notes,
 * participants, readiness, etc.) because those rows are keyed by case_id and
 * are untouched here. The stage is preserved if still valid for the target
 * pipeline, otherwise reset to 'inquiry'.
 */
export async function moveCasePipeline(c: Case, target: Pipeline): Promise<void> {
  const validStages = stagesForPipeline(target);
  const nextStage: Stage = validStages.includes(c.stage) ? c.stage : 'inquiry';
  const { error } = await supabase
    .from('cases')
    .update({ pipeline: target, stage: nextStage })
    .eq('id', c.id);
  if (error) throw error;
}

export async function deleteCase(id: string): Promise<void> {
  const { error } = await supabase.from('cases').delete().eq('id', id);
  if (error) throw error;
}
