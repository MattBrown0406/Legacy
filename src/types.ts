/**
 * Shared domain types for Legacy. These mirror the Supabase schema
 * (see supabase/migrations). RLS is owner-only on every table.
 */

export type Pipeline = 'intervention' | 'coaching';

export const INTERVENTION_STAGES = [
  'inquiry',
  'readiness',
  'intervention',
  'aftercare',
] as const;
export type InterventionStage = (typeof INTERVENTION_STAGES)[number];

export const COACHING_STAGES = ['inquiry', 'active_coaching', 'aftercare'] as const;
export type CoachingStage = (typeof COACHING_STAGES)[number];

export type Stage = InterventionStage | CoachingStage;

export const STAGE_LABELS: Record<Stage, string> = {
  inquiry: 'Inquiry',
  readiness: 'Readiness',
  intervention: 'Intervention',
  active_coaching: 'Active Coaching',
  aftercare: 'Aftercare',
};

export function stagesForPipeline(pipeline: Pipeline): readonly Stage[] {
  return pipeline === 'intervention' ? INTERVENTION_STAGES : COACHING_STAGES;
}

export interface Practitioner {
  id: string;
  user_id: string;
  name: string;
  credential: string | null;
  practice_name: string | null;
  gcal_detail_mode: boolean; // true = full detail, false = "Busy"
  created_at: string;
}

export interface Case {
  id: string;
  practitioner_id: string;
  family_name: string;
  loved_one: string | null;
  substance: string | null;
  pipeline: Pipeline;
  stage: Stage;
  created_at: string;
}

export interface CaseNote {
  id: string;
  case_id: string;
  body: string;
  created_at: string;
}

export type ParticipantStatus = 'prep' | 'ready';

export interface Participant {
  id: string;
  case_id: string;
  name: string;
  role: string | null;
  status: ParticipantStatus;
  letter_in: boolean;
}

export type ReadinessStatus = 'todo' | 'in_progress' | 'done';

export interface ReadinessStep {
  id: string;
  case_id: string;
  step_key: string;
  status: ReadinessStatus;
}

export type AppointmentKind = 'session' | 'call' | 'intervention' | 'other';

export interface Appointment {
  id: string;
  practitioner_id: string;
  case_id: string | null;
  title: string;
  kind: AppointmentKind;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  reminder_minutes: number | null;
  gcal_event_id: string | null;
}

export type InviteTarget = 'sober_helpline' | 'family_bridge';

export interface Invite {
  id: string;
  case_id: string;
  target: InviteTarget;
  sent_at: string;
}

export type DocumentKind = 'letter_guidelines' | 'boundaries' | 'services_agreement' | 'other';

export interface DocumentTemplate {
  id: string;
  practitioner_id: string;
  title: string;
  kind: DocumentKind;
  body_md: string;
}

export type InvoiceStatus = 'unpaid' | 'paid';

export interface Invoice {
  id: string;
  practitioner_id: string;
  case_id: string | null;
  item: string;
  amount_cents: number;
  status: InvoiceStatus;
  created_at: string;
}
