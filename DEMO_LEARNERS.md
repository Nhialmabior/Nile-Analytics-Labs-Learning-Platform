# Demo learner accounts — Nile Analytics Labs

These are **test-only identities** for checking the learner experience. They are not real people and must not be used for production learners.

Supabase Auth users cannot be created safely by the public website or by ordinary SQL. Create the two accounts manually in **Supabase Dashboard → Authentication → Users → Add user**:

| Field | Demo learner A | Demo learner B |
|---|---|---|
| Email | demo.learner.one@example.com | demo.learner.two@example.com |
| Password | NileDemo!2026 | NileDemo!2026 |
| Email confirmed | Yes | Yes |
| User metadata full_name | Demo Learner One | Demo Learner Two |

After creation, the existing auth trigger should create each matching `profiles` row with the learner role. If your project does not have that trigger, run the profile setup SQL in `supabase/setup.sql` first.

Then:
1. Sign in at the live LMS using either demo email and password.
2. Open Courses and enrol in **Excel for Data Analysis**.
3. Open the course learning page. The first visit creates the enrollment automatically if the course is published.
4. Complete lessons, take the three formative quizzes, and submit the Excel practical assignment.
5. Sign in with the second demo learner to verify that progress, attempts and submissions are isolated by account.
6. Use the admin account to inspect learners, enrollments and assignment submissions.

The passwords are intentionally identical and publicly documented for a disposable demo. Change or delete these Auth users before using the project with real learners. Never reuse these credentials elsewhere.
