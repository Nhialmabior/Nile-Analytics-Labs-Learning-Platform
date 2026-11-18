# Production Phase 1 Security Rollout

## Scope and safety boundary

This plan covers database authorization and application security for Nile Analytics Labs. It does **not** authorize an automatic production database migration. The production project must remain unchanged until the preflight results, backup/restore readiness, staging validation, and rollout window have been reviewed and explicitly approved.

- Production Supabase project: `nile-analytics-labs`
- Staging Supabase project: `nile-analytics-labs-staging`
- Never copy production learner records, credentials, voucher hashes, or secrets into staging.
- Never place a service-role/secret key in a `VITE_*` variable.
- Do not run `supabase db push` against production. Production currently has no recorded Supabase migration history, so a CLI push is not a safe deployment mechanism until schema history is reconciled.

## Audit findings to resolve before rollout

1. Production's `public.is_admin()` currently checks `role = 'admin'` but does not check `profiles.access_enabled`. UI route protection is not sufficient: database policies and privileged RPCs also rely on this function. The hardening script now updates it to require an enabled administrator.
2. Production's lesson, module, progress, assessment-submission, quiz and quiz-question policies include legacy rules that do not consistently require an active enrolment and published content. PostgreSQL permissive policies are ORed, so replacing only one policy while leaving an older permissive policy can preserve the access path.
3. Production has no recorded Supabase migration history. Treat the SQL files as reviewed manual scripts, not a reconciled migration chain.
4. Production security advisors report leaked-password protection disabled, and several authenticated SECURITY DEFINER RPCs. Some RPC execution is intentional (RLS helpers and guarded operations); each must be checked for an internal authorization check.
5. The production voucher-redemption Edge Function is configured with JWT verification disabled because it is a public one-time voucher activation endpoint. Its body uses a service-role client and validates voucher format/password length, but the endpoint needs explicit abuse/rate-limit review before broad rollout.
6. Staging is not currently a complete production mirror: it has three recorded migrations, its advisors still report security/performance warnings, and no Edge Functions were listed there. Do not treat staging tests of the database alone as proof that voucher activation or Nile Bot have been validated.

## Required rollout sequence

### A. Capture baseline

1. Confirm the production project identity in Supabase Dashboard before running anything.
2. Take/confirm a restorable database backup or point-in-time recovery window.
3. Run `supabase/production_phase1_preflight.sql` in read-only mode against production and save the results securely.
4. Review the current policies, grants, SECURITY DEFINER functions, triggers, views, and Edge Function settings against the live app code.
5. Confirm the single active administrator account and a separate learner test account are available. Do not create or alter accounts as part of the preflight.

### B. Validate in staging

1. Confirm staging schema and Edge Function configuration. The staging project must have the required functions and test-only secrets before testing those flows.
2. Apply the reviewed hardening SQL to staging only, after taking a staging backup.
3. Re-run the read-only preflight and Supabase Security Advisors.
4. Test with separate administrator and learner sessions:
   - enabled admin can manage content and learners;
   - disabled admin cannot access admin routes, admin RPCs, or admin-only rows;
   - learner sees only published content for active/completed enrolments as intended;
   - learner cannot read another learner's profile, progress, submissions, quiz attempts, responses, or conversations;
   - learner cannot access quiz answer keys or change marks/feedback/ownership;
   - learner cannot submit progress or assessment work for an unpublished or non-enrolled course;
   - voucher activation is single-use and does not expose voucher hashes;
   - Nile Bot verifies the signed-in user and enforces its daily quota.
5. Check browser console, Supabase logs, and all existing learner/admin workflows. Do not proceed if any critical workflow regresses.

### C. Production release gate

Production SQL must be run manually in a planned maintenance window only after:
- a current backup/restore point is confirmed;
- staging validation has passed;
- the exact SQL diff and rollback approach have been reviewed;
- the owner explicitly approves the production change.

Apply the reviewed SQL as one controlled change, then run the read-only preflight and Security Advisors again. Keep the previous policy/function definitions from the baseline as the environment-specific rollback reference. Do not use a generic rollback script that guesses the previous grants or policies.

### D. Dashboard-only Auth setting

Enable Supabase Auth leaked-password protection after reviewing the current Auth password policy and communicating any impact to learners. This is a Dashboard Auth setting, not part of the SQL script.

## References

- Supabase database security: https://supabase.com/docs/guides/database/secure-data
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase password security: https://supabase.com/docs/guides/auth/password-security
- Supabase CLI v3 migration notes: https://supabase.com/changelog?types=breaking-change
