# Nile Bot setup

Nile Bot is the AI learning assistant for Excel, Stata, R Programming and SPSS.

## Architecture

- React widget: `src/components/NileBot.jsx`
- Styling: `src/styles/nile-bot.css`
- Secure API: Supabase Edge Function `nile-bot`
- AI provider: OpenAI Responses API
- Course retrieval: PostgreSQL full-text search over published lesson content
- Conversation history: Supabase tables with learner-owned read policies
- Rate limit: 25 requests per authenticated user per UTC database day

The OpenAI API key and Supabase secret key are read only by the Edge Function. Never put either key in React, Vite environment variables, GitHub Pages, or source control.

## 1. Apply the database setup

Open Supabase Dashboard > SQL Editor and run the complete file:

`supabase/nile_bot_setup.sql`

This creates the conversation, message and usage tables; adds a full-text search index to published lesson content; and creates the restricted RPC functions.

The migration is designed to be re-runnable. Review any SQL error before continuing.

## 2. Configure Edge Function secrets

In Supabase Dashboard, open Edge Functions > Secrets and add:

- `OPENAI_API_KEY`: your OpenAI API key
- `OPENAI_MODEL`: `gpt-6-luna` (optional; this is the default)

OpenAI API usage is billed separately from a ChatGPT subscription. Set an API spending limit in your OpenAI platform account and monitor usage.

Do not commit a real key or paste it into GitHub. The local `supabase/functions/.env` file is ignored by Git.

## 3. Deploy the Edge Function

From the repository root, after installing and signing in to the Supabase CLI:

```bash
supabase login
supabase link --project-ref seonmdfmdajmktsfvvvt
supabase functions deploy nile-bot
```

The repository's `supabase/config.toml` keeps JWT verification enabled. Do not deploy this function with `--no-verify-jwt`.

## 4. Build and deploy the frontend

Install dependencies and run:

```bash
npm install
npm run build
```

Test locally with:

```bash
npm run dev
```

Only merge the feature branch into `main` after the database migration, Edge Function deployment, and browser tests are successful. The GitHub Pages workflow deploys the frontend from `main`.

## 5. Security properties

- The Edge Function requires a valid Supabase user JWT.
- The server verifies the caller with Supabase Auth.
- OpenAI credentials remain server-side.
- Each request is limited to 4,000 characters and 25 requests per user per day.
- Only published lesson content is retrieved.
- Conversation history is readable only by its owner.
- Browser users cannot insert assistant messages or change usage counters directly.
- Quiz answer keys and assessment grading records are not included in the AI context.
- OpenAI Responses are requested with `store: false`; the LMS stores its own conversation history in Supabase.

## 6. Initial test checklist

- Guest opens Nile Bot and is prompted to sign in.
- Signed-in learner can open the chat widget on public, dashboard and learning pages.
- Learner can ask a general question and receive an answer.
- Learner can select each of the four courses and receive lesson-grounded help.
- Code examples display in readable code blocks.
- Conversation history survives page refresh.
- One learner cannot read another learner's conversations.
- Invalid or expired sessions are rejected.
- The 25-message daily limit is enforced.
- No OpenAI or Supabase secret appears in the built frontend.
