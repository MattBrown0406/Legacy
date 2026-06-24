import { supabase } from '@/lib/supabase';
import { Invite, InviteTarget } from '@/types';

export const INVITE_LINKS: Record<
  InviteTarget,
  { label: string; description: string; url: string }
> = {
  sober_helpline: {
    label: 'Sober Helpline',
    description: 'Weekly Monday Zoom registration',
    url: 'https://soberhelpline.com/monday-zoom-registration',
  },
  family_bridge: {
    label: 'FamilyBridge Recovery',
    description: 'App Store download',
    url: 'https://apps.apple.com/us/app/family-bridge-recovery/id6757375159',
  },
};

export const INVITE_TARGETS: InviteTarget[] = ['sober_helpline', 'family_bridge'];

export async function listInvites(caseId: string): Promise<Invite[]> {
  const { data, error } = await supabase
    .from('invites')
    .select('*')
    .eq('case_id', caseId)
    .order('sent_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Invite[];
}

/** Most recent sent_at per target for a case. */
export async function lastInvitedByTarget(
  caseId: string,
): Promise<Partial<Record<InviteTarget, string>>> {
  const rows = await listInvites(caseId);
  const map: Partial<Record<InviteTarget, string>> = {};
  for (const r of rows) {
    if (!map[r.target]) map[r.target] = r.sent_at; // rows are sorted desc
  }
  return map;
}

export async function logInvite(caseId: string, target: InviteTarget): Promise<Invite> {
  const { data, error } = await supabase
    .from('invites')
    .insert({ case_id: caseId, target })
    .select('*')
    .single();
  if (error) throw error;
  return data as Invite;
}
