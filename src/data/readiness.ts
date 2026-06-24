import { supabase } from '@/lib/supabase';
import {
  CaseNote,
  Participant,
  ParticipantStatus,
  ReadinessStatus,
  ReadinessStep,
} from '@/types';

/* ---------- readiness steps ---------- */

export async function listReadinessSteps(caseId: string): Promise<ReadinessStep[]> {
  const { data, error } = await supabase
    .from('readiness_steps')
    .select('*')
    .eq('case_id', caseId);
  if (error) throw error;
  return (data ?? []) as ReadinessStep[];
}

export async function setReadinessStatus(
  caseId: string,
  stepKey: string,
  status: ReadinessStatus,
): Promise<void> {
  const { error } = await supabase
    .from('readiness_steps')
    .upsert({ case_id: caseId, step_key: stepKey, status }, { onConflict: 'case_id,step_key' });
  if (error) throw error;
}

/* ---------- participants ---------- */

export async function listParticipants(caseId: string): Promise<Participant[]> {
  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .eq('case_id', caseId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Participant[];
}

export async function addParticipant(
  caseId: string,
  input: { name: string; role?: string | null },
): Promise<Participant> {
  const { data, error } = await supabase
    .from('participants')
    .insert({ case_id: caseId, name: input.name, role: input.role ?? null })
    .select('*')
    .single();
  if (error) throw error;
  return data as Participant;
}

export async function updateParticipant(
  id: string,
  fields: Partial<Pick<Participant, 'name' | 'role' | 'status' | 'letter_in'>>,
): Promise<void> {
  const { error } = await supabase.from('participants').update(fields).eq('id', id);
  if (error) throw error;
}

export async function deleteParticipant(id: string): Promise<void> {
  const { error } = await supabase.from('participants').delete().eq('id', id);
  if (error) throw error;
}

export function toggleParticipantStatus(s: ParticipantStatus): ParticipantStatus {
  return s === 'ready' ? 'prep' : 'ready';
}

/* ---------- case notes ---------- */

export async function listCaseNotes(caseId: string): Promise<CaseNote[]> {
  const { data, error } = await supabase
    .from('case_notes')
    .select('*')
    .eq('case_id', caseId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as CaseNote[];
}

export async function addCaseNote(caseId: string, body: string): Promise<CaseNote> {
  const { data, error } = await supabase
    .from('case_notes')
    .insert({ case_id: caseId, body })
    .select('*')
    .single();
  if (error) throw error;
  return data as CaseNote;
}

export async function deleteCaseNote(id: string): Promise<void> {
  const { error } = await supabase.from('case_notes').delete().eq('id', id);
  if (error) throw error;
}
