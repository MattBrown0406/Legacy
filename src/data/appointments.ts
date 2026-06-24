import { supabase } from '@/lib/supabase';
import { Appointment, AppointmentKind } from '@/types';

export async function listAppointments(practitionerId: string): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('practitioner_id', practitionerId)
    .order('starts_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Appointment[];
}

export async function getAppointment(id: string): Promise<Appointment | null> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as Appointment) ?? null;
}

export interface AppointmentInput {
  title: string;
  kind: AppointmentKind;
  starts_at: string; // ISO
  ends_at: string | null;
  location: string | null;
  case_id: string | null;
  reminder_minutes: number | null;
}

export async function createAppointment(
  practitionerId: string,
  input: AppointmentInput,
): Promise<Appointment> {
  const { data, error } = await supabase
    .from('appointments')
    .insert({ practitioner_id: practitionerId, ...input })
    .select('*')
    .single();
  if (error) throw error;
  return data as Appointment;
}

export async function updateAppointment(
  id: string,
  input: AppointmentInput,
): Promise<Appointment> {
  const { data, error } = await supabase
    .from('appointments')
    .update(input)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as Appointment;
}

export async function deleteAppointment(id: string): Promise<void> {
  const { error } = await supabase.from('appointments').delete().eq('id', id);
  if (error) throw error;
}

export const KIND_LABELS: Record<AppointmentKind, string> = {
  session: 'Session',
  call: 'Call',
  intervention: 'Intervention',
  other: 'Other',
};

export const REMINDER_OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: 'None' },
  { value: 15, label: '15 min before' },
  { value: 60, label: '1 hour before' },
  { value: 1440, label: '1 day before' },
];
