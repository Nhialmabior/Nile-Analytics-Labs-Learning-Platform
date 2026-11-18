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
7. Anonymous users cannot execute the administrator grading, quiz submission or admin-check RPCs; trigger-only `handle_new_user()` is not exposed as a client RPC.

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
- Re-run the security advisors after applying the SQL. In particular, verify anonymous execution is revoked for `grade_assessment_submission`, `is_admin`, `submit_quiz_attempt` and trigger-only `handle_new_user`; authenticated access remains where policies or the frontend need it.
- Review the SECURITY DEFINER functions individually. The grading and voucher-issuing functions contain administrator checks; quiz submission validates the signed-in learner and active enrolment; the LMS helper functions return only the caller's own access/admin status. Do not revoke function execution indiscriminately because policies and application RPC calls may depend on it.
- Confirm backup retention and a tested restore process in the Supabase Dashboard; this inspection did not verify backup availability.

The GitHub Actions build validation for the latest branch commit completed successfully. This validates the frontend build only; it does not execute or validate the SQL against a staging database.


## Staging validation (2026-11-18)

A separate free-tier Supabase project, `nile-analytics-labs-staging`, was created in the same region as production. It was initialized from the repository's SQL setup files and course seed scripts, then the Phase 1 hardening script was applied **after** the seeds. No production users, enrolments, submissions, learner records or secrets were copied.

Staging contains the four course catalogue entries, 30 modules, 142 lessons, four assessment records, 12 quizzes and 60 quiz questions. Course publication flags were changed only inside rollback-only test transactions.

The hardening SQL was applied twice successfully, confirming repeatability after the policy cleanup was corrected.

### Rollback-only RLS and workflow tests

Synthetic users were created inside SQL transactions and all test data was rolled back. Final staging counts confirm zero auth users, profiles, enrolments, progress rows, submissions and quiz attempts remain.

| Test identity | Modules | Lessons | Assessments | Quizzes | Questions |
|---|---:|---:|---:|---:|---:|
| Active learner enrolled in Excel | 8 | 32 | 1 | 3 | 15 |
| Completed learner | 8 | 32 | 1 | 3 | 15 |
| Cancelled learner | 0 | 0 | 0 | 0 | 0 |
| Non-enrolled learner | 0 | 0 | 0 | 0 | 0 |
| LMS access disabled | 0 | 0 | 0 | 0 | 0 |
| Administrator | 30 | 142 | 4 | 12 | 60 |

Additional successful tests:
- Active learner lesson-progress insertion.
- Active learner initial assessment submission and update using only the permitted response/link columns.
- Quiz submission RPC created a quiz attempt and returned a score.
- Administrator grading RPC updated the score, feedback and grading timestamp.
- The assessment submission and progress rows remained visible only to their owner and administrator.

### Remaining staging/production work

- The Edge Functions have not yet been deployed to staging; the OpenAI secret has not been copied. End-to-end Nile Bot and voucher activation tests remain pending.
- Leaked-password protection remains disabled in Auth settings and should be enabled.
- The security advisor no longer reports anonymous access to the reviewed SECURITY DEFINER RPCs. It still reports authenticated execution for functions intentionally used by signed-in app workflows, plus informational no-policy findings for internal tables with no direct client grants.
- Performance advisor warnings remain for unindexed foreign keys and multiple permissive policies where an administrator-only `ALL` policy coexists with learner-specific policies. These should be reviewed as performance/maintainability work; the learner policy predicates were tested independently.
- Backup retention and restore capability have not been verified.

The staging tests validate database policy behavior under simulated authenticated roles. They are not a substitute for browser-level testing with real test accounts or a restore rehearsal.
