import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
const SCOPE = 'https://www.googleapis.com/auth/calendar.events';
const RETURN_URL = 'legacy://gcal-connected';

export const isGcalConfigured =
  !!GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_ID.includes('YOUR-GOOGLE');

function callbackUrl(): string {
  return `${SUPABASE_URL}/functions/v1/gcal-oauth-callback`;
}

export type ConnectResult = 'connected' | 'dismissed' | 'unsupported' | 'unconfigured';

/**
 * Start the Google OAuth consent flow. The Supabase access token is passed as
 * `state` so the callback edge function can verify the user before storing the
 * refresh token. Returns once the in-app browser closes; the caller should then
 * refresh the practitioner profile to read the new gcal_email.
 */
export async function connectGoogleCalendar(): Promise<ConnectResult> {
  if (!isGcalConfigured) return 'unconfigured';
  if (Platform.OS === 'web') return 'unsupported';

  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return 'dismissed';

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID!,
    redirect_uri: callbackUrl(),
    response_type: 'code',
    scope: SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state: token,
  });
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  const result = await WebBrowser.openAuthSessionAsync(authUrl, RETURN_URL);
  return result.type === 'success' ? 'connected' : 'dismissed';
}

export async function disconnectGoogleCalendar(): Promise<void> {
  await supabase.functions.invoke('gcal-sync', { body: { action: 'disconnect' } });
}

/** Push (create or update) an appointment to Google Calendar. Safe no-op if not connected. */
export async function syncAppointmentToGcal(appointmentId: string): Promise<void> {
  try {
    await supabase.functions.invoke('gcal-sync', {
      body: { action: 'upsert', appointment_id: appointmentId },
    });
  } catch (e) {
    console.warn('[Legacy] gcal upsert failed', e);
  }
}

/** Remove an appointment's event from Google Calendar. */
export async function removeAppointmentFromGcal(gcalEventId: string | null): Promise<void> {
  if (!gcalEventId) return;
  try {
    await supabase.functions.invoke('gcal-sync', {
      body: { action: 'delete', gcal_event_id: gcalEventId },
    });
  } catch (e) {
    console.warn('[Legacy] gcal delete failed', e);
  }
}
