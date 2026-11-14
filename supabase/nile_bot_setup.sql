-- Nile Bot: secure AI learning assistant
-- Run once in Supabase Dashboard > SQL Editor.
-- Chat writes and rate limiting are performed by the authenticated Edge Function.
-- Learners can read only their own conversations and messages.

BEGIN;

CREATE TABLE IF NOT EXISTS public.nile_bot_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New conversation',
  course_slug text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS nile_bot_conversations_user_updated_idx
  ON public.nile_bot_conversations (user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.nile_bot_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.nile_bot_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 12000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS nile_bot_messages_conversation_created_idx
  ON public.nile_bot_messages (conversation_id, created_at);

ALTER TABLE public.nile_bot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nile_bot_messages ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE
  public.nile_bot_conversations,
  public.nile_bot_messages
FROM PUBLIC, anon, authenticated;

GRANT ALL PRIVILEGES ON TABLE
  public.nile_bot_conversations,
  public.nile_bot_messages
TO service_role;

GRANT SELECT ON TABLE
  public.nile_bot_conversations,
  public.nile_bot_messages
TO authenticated;

DROP POLICY IF EXISTS "Learners read own Nile Bot conversations"
  ON public.nile_bot_conversations;
CREATE POLICY "Learners read own Nile Bot conversations"
  ON public.nile_bot_conversations
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Learners read own Nile Bot messages"
  ON public.nile_bot_messages;
CREATE POLICY "Learners read own Nile Bot messages"
  ON public.nile_bot_messages
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.nile_bot_conversations c
      WHERE c.id = conversation_id
        AND c.user_id = (SELECT auth.uid())
    )
  );

-- Internal daily request counter. No direct client access is granted.
CREATE TABLE IF NOT EXISTS public.nile_bot_usage (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date date NOT NULL DEFAULT CURRENT_DATE,
  request_count integer NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  PRIMARY KEY (user_id, usage_date)
);

ALTER TABLE public.nile_bot_usage ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public.nile_bot_usage
FROM PUBLIC, anon, authenticated;

GRANT ALL PRIVILEGES ON TABLE public.nile_bot_usage TO service_role;

CREATE OR REPLACE FUNCTION public.consume_nile_bot_request(
  p_user_id uuid,
  p_daily_limit integer DEFAULT 25
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_request_count integer;
BEGIN
  IF p_user_id IS NULL
     OR p_daily_limit IS NULL
     OR p_daily_limit < 1
     OR p_daily_limit > 100 THEN
    RAISE EXCEPTION 'Invalid Nile Bot usage request.';
  END IF;

  INSERT INTO public.nile_bot_usage (user_id, usage_date, request_count)
  VALUES (p_user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, usage_date)
  DO UPDATE
    SET request_count = public.nile_bot_usage.request_count + 1
    WHERE public.nile_bot_usage.request_count < p_daily_limit
  RETURNING request_count INTO v_request_count;

  RETURN FOUND;
END;
$function$;

REVOKE ALL ON FUNCTION public.consume_nile_bot_request(uuid, integer)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_nile_bot_request(uuid, integer)
TO service_role;

-- Full-text search over published lesson content. The generated search column
-- stays in sync whenever an administrator edits a lesson.
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A')
    || setweight(to_tsvector('english', coalesce(content, '')), 'B')
  ) STORED;

CREATE INDEX IF NOT EXISTS lessons_search_vector_idx
  ON public.lessons USING GIN (search_vector);

CREATE OR REPLACE FUNCTION public.search_nile_bot_lessons(
  p_query text,
  p_course_slug text DEFAULT NULL,
  p_limit integer DEFAULT 6
)
RETURNS TABLE (
  course_title text,
  course_slug text,
  module_title text,
  lesson_title text,
  lesson_content text,
  resource_url text
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $function$
  WITH query_data AS (
    SELECT websearch_to_tsquery(
      'english',
      left(coalesce(p_query, ''), 500)
    ) AS query
  )
  SELECT
    c.title::text,
    c.slug::text,
    m.title::text,
    l.title::text,
    left(l.content, 5000)::text,
    l.resource_url::text
  FROM public.lessons l
  JOIN public.course_modules m ON m.id = l.module_id
  JOIN public.courses c ON c.id = m.course_id
  CROSS JOIN query_data q
  WHERE l.is_published = true
    AND c.is_published = true
    AND (p_course_slug IS NULL OR c.slug = p_course_slug)
    AND (
      l.search_vector @@ q.query
      OR (
        p_course_slug IS NOT NULL
        AND NOT EXISTS (
          SELECT 1
          FROM public.lessons matched_l
          JOIN public.course_modules matched_m ON matched_m.id = matched_l.module_id
          JOIN public.courses matched_c ON matched_c.id = matched_m.course_id
          WHERE matched_c.slug = p_course_slug
            AND matched_l.is_published = true
            AND matched_c.is_published = true
            AND matched_l.search_vector @@ q.query
        )
      )
    )
  ORDER BY
    CASE
      WHEN l.search_vector @@ q.query
      THEN ts_rank_cd(l.search_vector, q.query)
      ELSE 0
    END DESC,
    m.sort_order ASC,
    l.sort_order ASC
  LIMIT CASE
    WHEN p_limit IS NULL THEN 6
    WHEN p_limit < 1 THEN 1
    WHEN p_limit > 8 THEN 8
    ELSE p_limit
  END;
$function$;

REVOKE ALL ON FUNCTION public.search_nile_bot_lessons(text, text, integer)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_nile_bot_lessons(text, text, integer)
TO authenticated;

COMMIT;
