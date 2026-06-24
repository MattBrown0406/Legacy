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
  gcal_email: string | null; // connected Google account email, null if not connected
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
  phone: string | null;
  email: string | null;
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

/**
 * The 7-step Family Readiness workflow for an intervention case. step_key is
 * stored in the DB; keep these keys stable.
 */
export const READINESS_WORKFLOW: { key: string; title: string; detail: string }[] = [
  { key: 'contract_sent', title: 'Contract Sent', detail: 'Engagement contract sent to the family.' },
  { key: 'contract_signed_paid', title: 'Contract Signed and Payment Received', detail: 'Signed contract returned and payment received.' },
  { key: 'prep_call', title: 'Prep Call Completed', detail: 'Pre-intervention prep call completed.' },
  { key: 'date_set', title: 'Intervention Date Set', detail: 'Intervention date confirmed with the team.' },
  { key: 'letters_received', title: 'Letters Received', detail: 'All participant letters received.' },
  { key: 'travel_arranged', title: 'Travel Arrangements Made', detail: 'Flights, lodging, and transport booked.' },
  { key: 'intervention_completed', title: 'Intervention Completed', detail: 'Intervention held.' },
];

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

export interface CaseFile {
  id: string;
  case_id: string;
  name: string;
  mime_type: string | null;
  size_bytes: number | null;
  storage_path: string;
  created_at: string;
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
