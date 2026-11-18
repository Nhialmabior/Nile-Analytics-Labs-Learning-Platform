# Nile Analytics Labs — Learning Platform

**Motto:** Analyze today, solve tomorrow.

Nile Analytics Labs is a learning platform for practical data analysis and statistical computing education. Its course catalogue focuses on **Excel, Stata, R Programming and SPSS**.

**Live website:** https://nhialmabior.github.io/Nile-Analytics-Labs-Learning-Platform/

## Platform capabilities

### Public learning website
- Responsive home, about, course catalogue, course detail and contact pages.
- Searchable course catalogue with category filters.
- Public sample lesson previews for prospective learners.
- Responsive navigation and mobile layouts.
- Site metadata, favicon, web manifest, robots file and sitemap.

### Learner experience
- Login using an administrator-issued Login ID or administrator email.
- Voucher-based learner account activation; vouchers are issued by an administrator and are single-use.
- Protected learner dashboard and enrolled-course workspace.
- Lesson viewer with course-aware navigation and progress tracking.
- Resume learning from the last opened lesson.
- Assessment submissions and quiz attempts.
- Learner profile management and assessment feedback.
- Session inactivity timeout with a warning before automatic sign-out.

### Administrator workspace
- Protected administrator dashboard and overview metrics.
- Course and curriculum management.
- Create, edit, publish, unpublish and organize modules and lessons.
- Manage learners and administrator-issued activation vouchers.
- Manage assessments and review learner submissions.
- View learner and course reporting information.

### Nile Bot
- An authenticated AI learning assistant for data analysis and statistics questions.
- Conversation history and course-related references.
- Uses a Supabase Edge Function; the OpenAI API secret belongs in server-side Edge Function secrets and must never be placed in frontend environment variables.

## Technology

- React 18, Vite 6 and React Router 7
- Supabase Authentication, PostgreSQL, Row Level Security and Edge Functions
- Lucide React
- GitHub Actions and GitHub Pages

## Run locally

Requirements: Node.js 20 or later and npm.

```bash
git clone https://github.com/Nhialmabior/Nile-Analytics-Labs-Learning-Platform.git
cd Nile-Analytics-Labs-Learning-Platform
npm ci
npm run dev
```

Open the local URL printed by Vite. For this repository it is normally:

`http://localhost:5173/Nile-Analytics-Labs-Learning-Platform/`

Build and preview the production bundle locally:

```bash
npm run build
npm run preview
```

## Environment configuration

The frontend Supabase client reads these Vite variables when they are provided:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

For local staging work, create a local `.env.local` file using the staging project's URL and publishable key. Do not commit `.env.local` or other secret-bearing environment files.

The repository retains a public production fallback for the deployed GitHub Pages site. Local environment variables override that fallback during local development. Verify the project URL before testing so that staging work is not accidentally directed at production.

**Never put a Supabase service-role key, secret API key or OpenAI key in a `VITE_*` variable.** Vite exposes `VITE_*` values to browser users. Keep privileged credentials in Supabase Edge Function secrets.

## Authentication and learner activation

Learners do not self-register with an unrestricted sign-up form. An administrator issues a Login ID and one-time voucher; the learner activates the account using those details and creates a private password.

The voucher activation flow depends on the `redeem-learner-voucher` Supabase Edge Function. Nile Bot depends on the `nile-bot` Edge Function and a separately configured server-side OpenAI API key. These functions and their secrets must be configured in each Supabase environment where the features are expected to work.

## Security and environments

- Database access is protected by Supabase Row Level Security policies.
- Learner access is controlled by account status, enrolment and course publication rules.
- Administrator-only operations are protected by role checks and database permissions.
- Keep staging and production Supabase projects separate.
- Do not copy production users, learner records or privileged secrets into staging.
- Review and test database changes in staging before considering production rollout.

The `security/phase-1-hardening` branch and its draft pull request are for review and staging validation. Changes on that branch do not update the live GitHub Pages site unless they are merged and deployed through the production workflow.

## Deployment

The public site is published through GitHub Actions to GitHub Pages. The Vite base path is:

`/Nile-Analytics-Labs-Learning-Platform/`

The production deployment workflow builds the application and publishes the `dist` directory from the configured deployment branch. Keep GitHub Pages configured to use **GitHub Actions** as its deployment source.

## Current limitations and follow-up work

The platform is under active development. Before a production rollout, complete browser-level testing of administrator and learner workflows, verify voucher activation and Nile Bot in the intended environment, review Auth security settings (including leaked-password protection), and confirm backups and restore procedures.

Certificate generation and verified credential downloads are not yet implemented. Contact messages currently use an email-client handoff rather than a server-backed message inbox. Payment processing and public self-enrolment are not part of the current learner activation flow.
