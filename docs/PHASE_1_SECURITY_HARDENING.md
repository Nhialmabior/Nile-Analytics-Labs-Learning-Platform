# Phase 1 production security hardening

## Scope

This branch prepares the first security-hardening pass for the Nile Analytics Labs LMS. It does not change the public website layout or frontend behavior.

## Important deployment warning

The repository currently uses legacy, manually-run SQL setup files and does not yet have a reconciled Supabase migration history. Therefore:

- Do not run `supabase db push` against production yet.
- Do not execute the hardening SQL until a current database backup has been confirmed.
- First compare the SQL with the live schema and installed policies in Supabase.
- Apply the reviewed SQL in a staging project first, then verify with learner and administrator test accounts.
- Run `phase1_security_hardening.sql` only after all schema, access-control and course-seed scripts (including `seed_excel_course.sql`) have finished. The Excel seed script recreates legacy lesson/progress policies, so applying hardening before it would leave those policies in place.
- Only apply to production after staging tests pass and a rollback/restore plan is ready.

## Files in this phase

- `supabase/phase1_security_hardening.sql`: repeatable SQL intended to remove known permissive learner policies, require active enrolment for lesson/assessment/quiz content, and restrict learner writes to progress/submission fields.
- `.gitignore`: excludes local Supabase temporary metadata and environment files.

## Security behavior intended by the SQL

1. Learners with enabled LMS access can read published modules, lessons, assessments and quizzes only for courses in which they have an active or completed enrolment; cancelled enrolments do not grant content access.
2. Administrators retain access to drafts and all learning content through the existing `public.is_admin()` helper.
3. Lesson progress can be inserted only for the signed-in learner, for a published lesson in a published course with an active enrolment. Completed learners retain read access to their course content.
4. Learners can submit and revise only their own ungraded assessment response and resource URL.
5. Learners cannot directly write assessment marks, feedback, grading timestamps, progress IDs or completion timestamps.
6. Quiz questions are visible only to enrolled learners; answer keys remain administrator-only.

## Important compatibility checks before applying

The SQL expects the existing objects established by the repository's setup scripts:

- `public.has_lms_access()` from `voucher_access_security.sql`
- `public.is_admin()` from `setup.sql`
- Existing LMS tables and columns from `lms_schema.sql` and `quizzes_and_demo_learners.sql`

Confirm that the deployed database contains these exact objects and that the administrator UI does not depend on direct learner-table INSERT/UPDATE access beyond the policies described above.

## Manual verification checklist

- [ ] Confirm a recent Supabase backup exists and can be restored.
- [ ] Run the SQL in a staging Supabase project.
- [ ] Confirm an enrolled learner can read published course modules, lessons, assessments and quizzes.
- [ ] Confirm a learner without an active enrolment cannot read lesson bodies or quiz questions through direct API requests.
- [ ] Confirm a cancelled enrolment loses access.
- [ ] Confirm a learner cannot insert progress for another learner or an unpublished lesson.
- [ ] Confirm a learner cannot submit work for another learner or an unpublished assessment.
- [ ] Confirm a learner cannot set or change score, feedback, graded_at, submitted_at or learner_id after submission.
- [ ] Confirm an administrator can still manage courses, lessons, assessments, quizzes and grading.
- [ ] Confirm the existing frontend flows still work.
- [ ] Apply to production only after all staging checks pass.

## Deferred items

The voucher redemption Edge Function still needs server-side abuse/rate limiting. CORS restrictions alone do not prevent non-browser requests. Do not treat the browser's Origin header as authentication. Implement rate limiting with an atomic server-side counter before considering voucher activation production-ready.

A proper timestamped Supabase migration history also remains a separate task. The existing SQL setup scripts must first be reconciled into a baseline; do not simply rename the current setup files as migrations.


## Live database review (2026-11-18)

The connected `nile-analytics-labs` project was inspected read-only. The current policies confirmed these access gaps:

- `course_modules`, `lessons`, and `assessments` expose published content to any account with LMS access, without checking enrolment.
- `quizzes` and `quiz_questions` have multiple permissive policies. One policy grants published content without enrolment; the older enrolment policies also omit the LMS-access check. Because permissive policies are ORed, the older policy must be dropped when replacing it.
- `lesson_progress` INSERT checks account access and row ownership, but not active enrolment or published course/lesson state.
- `assessment_submissions` INSERT and UPDATE similarly need active enrolment and published course/assessment checks.
- The profile table already uses column-level grants to prevent learners from changing `role` and `access_enabled`. Preserve these grants.
- `learner_vouchers` and `nile_bot_usage` have RLS enabled and no user-facing policies; current grants deny direct authenticated-client access. Their service-side use must continue to be tested.
- The database reports no migration records. Reconcile the manually applied SQL baseline before using the CLI migration workflow.

The learner assessment editor was adjusted on this branch to update only `submission_text` and `resource_url`, matching the restricted column grants. Initial submission still supplies the learner and assessment IDs.

## Additional production follow-up

- Enable leaked-password protection in Supabase Auth.
- Add rate limiting/abuse controls to the public voucher redemption Edge Function. Its wildcard CORS header is not an abuse-control mechanism.
- Review the SECURITY DEFINER functions individually. The grading and voucher-issuing functions contain administrator checks; quiz submission validates the signed-in learner and active enrolment; the LMS helper functions return only the caller's own access/admin status. Do not revoke function execution indiscriminately because policies and application RPC calls may depend on it.
- Confirm backup retention and a tested restore process in the Supabase Dashboard; this inspection did not verify backup availability.

The GitHub Actions build validation for the latest branch commit completed successfully. This validates the frontend build only; it does not execute or validate the SQL against a staging database.
