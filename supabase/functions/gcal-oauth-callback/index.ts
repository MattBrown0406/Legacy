// Legacy — Google OAuth callback. Google redirects here with ?code & ?state,
// where state is the user's Supabase access token (JWT). We verify the user,
// exchange the code for tokens, store the refresh token server-side ONLY, and
// bounce back into the app via the legacy:// deep link.
//
// Deploy with --no-verify-jwt (this endpoint is hit by Google, not the app):
//   supabase functions deploy gcal-oauth-callback --no-verify-jwt

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { exchangeCode, getUserEmail } from '../_shared/google.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const APP_RETURN_URL = Deno.env.get('APP_RETURN_URL') ?? 'legacy://gcal-connected';

function page(message: string, redirect: string | null): Response {
  const html = `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${redirect ? `<meta http-equiv="refresh" content="0;url=${redirect}">` : ''}
<style>body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#142A47;color:#F5EFE3;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;padding:24px}</style>
</head><body><div><h2>Legacy</h2><p>${message}</p>${
    redirect ? `<p><a style="color:#E9A13B" href="${redirect}">Return to Legacy</a></p>` : ''
  }</div></body></html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html' } });
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const oauthError = url.searchParams.get('error');

  if (oauthError) return page(`Google sign-in was cancelled (${oauthError}).`, APP_RETURN_URL);
  if (!code || !state) return page('Missing authorization code.', APP_RETURN_URL);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
  });

  try {
    // Verify the user from the state JWT.
    const { data: userData, error: userErr } = await admin.auth.getUser(state);
    if (userErr || !userData.user) return page('Your session could not be verified.', APP_RETURN_URL);

    const { data: practitioner, error: pErr } = await admin
      .from('practitioners')
      .select('id')
      .eq('user_id', userData.user.id)
      .single();
    if (pErr || !practitioner) return page('No practitioner profile found.', APP_RETURN_URL);

    const redirectUri = `${SUPABASE_URL}/functions/v1/gcal-oauth-callback`;
    const tokens = await exchangeCode(code, redirectUri);
    if (!tokens.refresh_token) {
      return page(
        'Google did not return a refresh token. Disconnect the app in your Google account and try again.',
        APP_RETURN_URL,
      );
    }

    const email = await getUserEmail(tokens.access_token);

    await admin.from('gcal_accounts').upsert({
      practitioner_id: practitioner.id,
      google_email: email,
      refresh_token: tokens.refresh_token,
      updated_at: new Date().toISOString(),
    });
    await admin.from('practitioners').update({ gcal_email: email }).eq('id', practitioner.id);

    return page('Google Calendar connected. You can return to the app.', APP_RETURN_URL);
  } catch (e) {
    return page(`Something went wrong: ${e instanceof Error ? e.message : 'unknown error'}`, APP_RETURN_URL);
  }
});
