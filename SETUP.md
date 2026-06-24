# Legacy — setup & launch checklist

Everything you need to take Legacy from the repo to TestFlight. The app code is
done; the items below are the accounts/secrets only you can create.

Supabase project: `https://awaufyiedyhtlagelmru.supabase.co`
EAS project id: `bd4894d6-5010-4203-94fa-caa33d756425`

---

## 1. Run it locally (do this first)

```bash
cd /Users/mattbrown/Legacy
npm install
# .env already has your Supabase URL + publishable key.
npx expo start            # press i for iOS simulator, w for web
```

The app will load but **show errors until the database tables exist** — do step 2.

---

## 2. Supabase — apply the schema (REQUIRED)

The migrations in `supabase/migrations/` are the source of truth. There's no
GitHub→Supabase integration on this project, so apply them once. Two options:

**Option A — Supabase CLI (recommended)**
```bash
brew install supabase/tap/supabase     # if not installed
supabase login
supabase link --project-ref awaufyiedyhtlagelmru
supabase db push                        # applies all migrations in order
```

**Option B — Dashboard SQL editor**
Open each file in `supabase/migrations/` in ascending order and run it in the
SQL editor:
1. `20260623000001_practitioners.sql`
2. `20260623000002_cases.sql`
3. `20260623000003_readiness.sql`
4. `20260623000004_appointments.sql`
5. `20260623000005_invites_documents_invoices.sql`
6. `20260623000006_gcal.sql`

Also confirm **Auth → Email** is enabled (it is by default). If you want to skip
the email-confirmation step during the pilot, turn off "Confirm email" under
Auth → Providers → Email.

After this, sign up in the app with your email + a password and create your
practitioner profile.

---

## 3. Google Calendar sync (Phase 6) — optional, do when ready

One-way push: appointments created in Legacy appear on your Google Calendar.
Nothing here is needed for the rest of the app to work.

### 3a. Create the Google OAuth client
1. Go to <https://console.cloud.google.com> → create a project (e.g. "Legacy").
2. **APIs & Services → Library →** enable **Google Calendar API**.
3. **OAuth consent screen:** User type **External**. Add your email as a **Test
   user**. Add the scope `https://www.googleapis.com/auth/calendar.events`.
4. **Credentials → Create credentials → OAuth client ID → Web application.**
   - **Authorized redirect URI:**
     `https://awaufyiedyhtlagelmru.supabase.co/functions/v1/gcal-oauth-callback`
5. Copy the **Client ID** and **Client secret**.

### 3b. Put the client ID in the app
Edit `.env`:
```
EXPO_PUBLIC_GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
```
(The client ID is public. The **secret never goes in the repo** — see next step.)

### 3c. Set Supabase secrets + deploy the edge functions
```bash
supabase secrets set GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
supabase secrets set GOOGLE_CLIENT_SECRET=<your-client-secret>
# SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically.

supabase functions deploy gcal-sync
supabase functions deploy gcal-oauth-callback --no-verify-jwt
```
`--no-verify-jwt` is required on the callback because Google (not the app) calls it.

### 3d. Connect
In the app: **Settings → Connect Google Calendar.** After consent you'll see your
connected account and a **"Push full detail" vs "Busy"** privacy toggle (default:
full detail). Google Calendar connect runs from the **iOS app**, not web.

> Note: this uses a Web OAuth client because the refresh token is exchanged and
> stored server-side (in `gcal_accounts`, which the app can never read). That's
> the secure pattern for one-way server-side sync.

---

## 4. EAS build → TestFlight

Requires an **Apple Developer Program** membership ($99/yr) and the EAS CLI
(`npm i -g eas-cli`, then `eas login`).

### 4a. Make the public env vars available to cloud builds
`.env` is gitignored, so set the `EXPO_PUBLIC_*` values as EAS env vars so the
built binary can reach Supabase:
```bash
eas env:create --environment production --name EXPO_PUBLIC_SUPABASE_URL --value https://awaufyiedyhtlagelmru.supabase.co
eas env:create --environment production --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value sb_publishable_zc21CoLLE5R5F89Viy__Nw_7q4O4SyT
# Only if using Google Calendar:
eas env:create --environment production --name EXPO_PUBLIC_GOOGLE_CLIENT_ID --value <your-client-id>.apps.googleusercontent.com
```

### 4b. Add an app icon (recommended)
Drop a 1024×1024 PNG at `assets/icon.png` and add `"icon": "./assets/icon.png"`
under `expo` in `app.json`. Without it, EAS uses a default icon.

### 4c. Build & submit
```bash
eas build --platform ios --profile production
# EAS will walk you through Apple login and create certificates/profiles.

eas submit --platform ios --profile production
# Creates the App Store Connect app (if needed) and uploads to TestFlight.
```
Then in App Store Connect → TestFlight, add yourself as an internal tester.

### 4d. Sign in with Apple note
The app ships with **Sign in with Apple** (per the spec). EAS will add the
"Sign in with Apple" capability automatically. If you'd rather not deal with it
(Sober Helpline hit an App Store rejection around it), you can remove it: set
`"usesAppleSignIn": false` in `app.json`, drop `"expo-apple-authentication"`
from `plugins`, and remove the Apple button in `app/sign-in.tsx`.

---

## 5. What's already wired vs. pending you

| Item | Status |
|------|--------|
| App code (all 7 build sections) | ✅ done, `tsc` clean, web build green |
| Supabase URL + publishable key in `.env` | ✅ done |
| EAS project id in `app.json` | ✅ done |
| Apply DB migrations | ⏳ you (step 2) |
| Google OAuth client + secrets + deploy functions | ⏳ you (step 3) |
| EAS env vars + Apple build/submit | ⏳ you (step 4) |
