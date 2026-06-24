# Legacy

Practice-management app for professional interventionists — a solo-practitioner
tool by Freedom Interventions. Universal Expo app (iOS + web).

## Sections
- **Cases** — two pipelines (Intervention, Coaching); create, move between
  pipelines, case detail.
- **Family Readiness** — 7-step workflow checklist, participant tracker, notes.
- **Schedule** — appointments (source of truth) with local push reminders and
  one-way push to Google Calendar.
- **Invites** — send & log the Sober Helpline and FamilyBridge links per case.
- **Documents** — shareable templates (letter guidelines, boundaries, agreement).
- **Billing** — manual invoices, mark paid.
- **Settings** — profile, Google Calendar connection, invite code.

## Stack
Expo SDK 54 · TypeScript · expo-router · Supabase (auth + Postgres + edge
functions) · expo-notifications.

## Develop
```bash
npm install
npx expo start        # i = iOS, w = web
npm run typecheck     # tsc --noEmit
npx expo export --platform web   # web build
```

Brand: navy `#142A47`, gold `#E9A13B`, ivory `#F5EFE3`; Georgia serif headings.

## Setup & launch
See **[SETUP.md](SETUP.md)** for the database, Google Calendar, and
EAS/TestFlight steps.
