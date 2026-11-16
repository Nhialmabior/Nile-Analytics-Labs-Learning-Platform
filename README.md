# Nile Analytics Labs — Learning Platform

**Motto:** Analyze today, solve tomorrow.

A responsive React + Vite learning-platform frontend for Nile Analytics Labs, a data analysis and statistical computing learning initiative based at the University of Juba in Juba, South Sudan.

## Live website

https://nhialmabior.github.io/Nile-Analytics-Labs-Learning-Platform/

## Current features

### Public website
- Home page and introduction to Nile Analytics Labs
- About page
- Course catalogue with search and category filters
- Course detail pages for Excel, Stata, R Programming and SPSS
- Contact page with an email-client handoff
- Responsive navigation and mobile layout
- Site metadata, SVG favicon, web manifest, robots file and sitemap

### Learner interface preview
- Login and registration screens (not connected to authentication)
- Student dashboard with sample metrics
- My Courses and lesson-player previews
- Profile and certificate screens (sample content only)
- Responsive learner navigation

## Important project status

This release is a **frontend prototype**. It currently uses sample course and learner data. There is no production authentication, database, enrolment service, payment processing, lesson-video hosting, progress persistence, profile saving, or certificate generation. The login and registration controls are intentionally disabled so visitors are not led to believe that real accounts can be created.

The contact form prepares an email in the visitor's default email application; it does not submit data to or store messages on a server.

## Technology

- React 18
- Vite 6
- React Router
- Lucide React
- CSS

## Run locally

Requirements: Node.js 20 or later and npm.

```bash
git clone https://github.com/Nhialmabior/Nile-Analytics-Labs-Learning-Platform.git
cd Nile-Analytics-Labs-Learning-Platform
npm install
npm run dev
```

Open the local URL printed by Vite, usually http://localhost:5173.

To test the production build locally:

```bash
npm run build
npm run preview
```

## Deployment

The project is published through GitHub Actions to GitHub Pages. The Vite base path is configured for this repository:

`/Nile-Analytics-Labs-Learning-Platform/`

The workflow builds the application and deploys the `dist` directory whenever changes are pushed to `main`. GitHub Pages should remain configured to use **GitHub Actions** as its deployment source.

## Recommended next phase

Connect a backend and PostgreSQL database to support:
1. Secure registration, login, password reset and role-based access.
2. Course management, enrolment and instructor administration.
3. Real lesson content, resources, quizzes and assessments.
4. Persisted learner progress and dashboard metrics.
5. Verified certificate generation and downloads.
6. A server-backed contact form with spam protection.

Before enabling those features, add privacy and terms pages, define data-retention practices, and configure secure secrets on the backend.


## Learner progress and session security

- Lesson completion is recorded against the signed-in learner in Supabase.
- The learning space remembers the last lesson opened in each course so learners can resume their studies.
- Signed-in learner and administrator sessions expire after 30 minutes without activity.
- A warning appears two minutes before automatic sign-out, allowing the user to continue the session or sign out immediately.
- Activity in another open LMS tab also keeps the browser session active.
