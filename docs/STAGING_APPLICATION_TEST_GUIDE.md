# Staging application test guide

This guide connects a local copy of the LMS frontend to the separate Supabase staging project. It does not change the public GitHub Pages deployment or production Supabase project.

## Staging project

- Supabase project: `nile-analytics-labs-staging`
- Project ref: `vcwlzvbelgvlgezetnkn`
- API URL: `https://vcwlzvbelgvlgezetnkn.supabase.co`
- Region: Europe West (same region as production)

## 1. Get the staging publishable key

Open the [staging API keys page](https://supabase.com/dashboard/project/vcwlzvbelgvlgezetnkn/settings/api-keys). Copy the **publishable** key (or legacy anon key if the dashboard only presents that option). Never use a service-role or secret key in the browser.

## 2. Prepare the local frontend

Check out the `security/phase-1-hardening` branch, then run:

```bash
npm install
```

Copy `.env.staging.example` to `.env.local` and replace `YOUR_STAGING_PUBLISHABLE_KEY` with the staging publishable key.

For PowerShell:

```powershell
Copy-Item .env.staging.example .env.local
notepad .env.local
npm run dev
```

Vite reads `.env.local` automatically. The existing client uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` as overrides, so no production URL or key needs to be edited in source code.

Do not commit `.env.local`. It is ignored by Git.

## 3. Create staging test identities

Use only synthetic test identities and addresses. Do not copy production learners.

- Create an administrator account in Supabase Auth for staging only.
- Set that staging account's `public.profiles.role` to `admin` and `access_enabled` to `true` using the staging SQL editor.
- Sign in as the staging administrator and issue a test learner voucher.
- Redeem the voucher through the learner registration/activation flow.
- Create further test users for active, completed, cancelled and disabled-access scenarios as needed.

Never make a real learner an administrator. Do not expose the staging service-role key.

## 4. Manual browser test checklist

- [ ] Administrator can sign in and open the admin dashboard.
- [ ] Administrator can view courses, modules, lessons, assessments and quizzes.
- [ ] Administrator can issue a learner voucher.
- [ ] A learner can redeem a valid voucher and sign in.
- [ ] A learner enrolled in a course can open its published modules and lessons.
- [ ] A learner can mark a lesson complete and see saved progress.
- [ ] A learner can submit an assessment and edit it before grading.
- [ ] A learner can take a quiz and see the result.
- [ ] A learner cannot open content for a course they are not enrolled in.
- [ ] A cancelled or access-disabled learner cannot access course content.
- [ ] A learner cannot access the admin dashboard or change their role/access flag.
- [ ] An administrator can grade a submission and the learner can see the result.

## 5. Edge Functions

The voucher redemption function is intentionally configured with `verify_jwt = false` because account activation happens before a learner has a session. Its function body validates the voucher and uses the server-side service-role key. The Supabase deployment connector did not permit this deployment in this run, so the function is **not yet deployed to staging**. Deploy it through the Supabase CLI or dashboard after reviewing the function.

Nile Bot also needs an OpenAI API key configured as an Edge Function secret in staging. Do not copy the production secret automatically; add a separate staging secret if you want to test AI requests.

## Safety

- The live website and production database remain unchanged.
- The frontend fallback still points to production when no local environment override is present. This is intentional to avoid breaking GitHub Pages.
- Always confirm the staging URL in the browser console/network requests before creating test records.
- Do not enter real learner data into staging.
