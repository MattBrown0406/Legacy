// Shared Google OAuth + Calendar helpers for Legacy edge functions (Deno).

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';
const CALENDAR_BASE = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

export const GOOGLE_SCOPE = 'https://www.googleapis.com/auth/calendar.events';

function clientId(): string {
  const v = Deno.env.get('GOOGLE_CLIENT_ID');
  if (!v) throw new Error('GOOGLE_CLIENT_ID secret is not set');
  return v;
}
function clientSecret(): string {
  const v = Deno.env.get('GOOGLE_CLIENT_SECRET');
  if (!v) throw new Error('GOOGLE_CLIENT_SECRET secret is not set');
  return v;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  expires_in: number;
}

/** Exchange an authorization code for tokens (includes refresh_token). */
export async function exchangeCode(code: string, redirectUri: string): Promise<TokenResponse> {
  const body = new URLSearchParams({
    code,
    client_id: clientId(),
    client_secret: clientSecret(),
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`);
  return (await res.json()) as TokenResponse;
}

/** Get a fresh access token from a stored refresh token. */
export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const body = new URLSearchParams({
    client_id: clientId(),
    client_secret: clientSecret(),
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${await res.text()}`);
  const json = (await res.json()) as TokenResponse;
  return json.access_token;
}

export async function getUserEmail(accessToken: string): Promise<string | null> {
  const res = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { email?: string };
  return json.email ?? null;
}

export interface AppointmentRow {
  title: string;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
}

/** Build the Google Calendar event body, honoring the privacy (detail) mode. */
export function buildEvent(appt: AppointmentRow, detailMode: boolean) {
  const start = appt.starts_at;
  const end = appt.ends_at ?? new Date(new Date(appt.starts_at).getTime() + 3_600_000).toISOString();
  if (detailMode) {
    return {
      summary: appt.title,
      location: appt.location ?? undefined,
      description: 'Scheduled via Legacy',
      start: { dateTime: start },
      end: { dateTime: end },
    };
  }
  // Privacy mode: opaque "Busy" block.
  return {
    summary: 'Busy',
    start: { dateTime: start },
    end: { dateTime: end },
  };
}

export async function createEvent(accessToken: string, event: unknown): Promise<string> {
  const res = await fetch(CALENDAR_BASE, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });
  if (!res.ok) throw new Error(`Calendar create failed: ${await res.text()}`);
  const json = (await res.json()) as { id: string };
  return json.id;
}

export async function patchEvent(
  accessToken: string,
  eventId: string,
  event: unknown,
): Promise<void> {
  const res = await fetch(`${CALENDAR_BASE}/${encodeURIComponent(eventId)}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });
  if (!res.ok) throw new Error(`Calendar patch failed: ${await res.text()}`);
}

export async function deleteEvent(accessToken: string, eventId: string): Promise<void> {
  const res = await fetch(`${CALENDAR_BASE}/${encodeURIComponent(eventId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  // 410 Gone / 404 = already deleted; treat as success.
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    throw new Error(`Calendar delete failed: ${await res.text()}`);
  }
}
