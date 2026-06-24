// Legacy — one-way appointment sync (Legacy -> Google Calendar).
// Called by the app after an appointment is created/updated/deleted. Uses the
// caller's Supabase JWT to resolve the practitioner, then the server-side
// refresh token to talk to Google. Never exposes the refresh token.
//
// Deploy (JWT verification ON, the default):
//   supabase functions deploy gcal-sync

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  buildEvent,
  createEvent,
  deleteEvent,
  patchEvent,
  refreshAccessToken,
} from '../_shared/google.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) return json({ error: 'Missing authorization' }, 401);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData.user) return json({ error: 'Invalid session' }, 401);

  const { data: practitioner } = await admin
    .from('practitioners')
    .select('id, gcal_detail_mode')
    .eq('user_id', userData.user.id)
    .single();
  if (!practitioner) return json({ error: 'No practitioner profile' }, 404);

  let body: { action?: string; appointment_id?: string; gcal_event_id?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid body' }, 400);
  }

  // Disconnect removes the server-side token and clears the connected email.
  if (body.action === 'disconnect') {
    await admin.from('gcal_accounts').delete().eq('practitioner_id', practitioner.id);
    await admin.from('practitioners').update({ gcal_email: null }).eq('id', practitioner.id);
    return json({ ok: true });
  }

  const { data: account } = await admin
    .from('gcal_accounts')
    .select('refresh_token')
    .eq('practitioner_id', practitioner.id)
    .maybeSingle();
  if (!account) return json({ connected: false });

  try {
    const accessToken = await refreshAccessToken(account.refresh_token);

    if (body.action === 'delete') {
      if (body.gcal_event_id) await deleteEvent(accessToken, body.gcal_event_id);
      return json({ ok: true });
    }

    if (body.action === 'upsert') {
      if (!body.appointment_id) return json({ error: 'appointment_id required' }, 400);
      const { data: appt } = await admin
        .from('appointments')
        .select('*')
        .eq('id', body.appointment_id)
        .eq('practitioner_id', practitioner.id)
        .single();
      if (!appt) return json({ error: 'Appointment not found' }, 404);

      const event = buildEvent(appt, practitioner.gcal_detail_mode);

      if (appt.gcal_event_id) {
        await patchEvent(accessToken, appt.gcal_event_id, event);
        return json({ ok: true, gcal_event_id: appt.gcal_event_id });
      } else {
        const eventId = await createEvent(accessToken, event);
        await admin.from('appointments').update({ gcal_event_id: eventId }).eq('id', appt.id);
        return json({ ok: true, gcal_event_id: eventId });
      }
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'sync failed' }, 500);
  }
});
