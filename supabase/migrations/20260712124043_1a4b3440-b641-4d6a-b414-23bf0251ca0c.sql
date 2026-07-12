
ALTER TABLE public.interview_guides
  ADD COLUMN IF NOT EXISTS ki_instruktionen text;

DO $$
DECLARE
  col text;
BEGIN
  FOREACH col IN ARRAY ARRAY['hauptfragen','vertiefungsfragen','kritische_fragen']
  LOOP
    EXECUTE format($f$
      UPDATE public.interview_guides
      SET %I = COALESCE((
        SELECT jsonb_agg(
          CASE
            WHEN jsonb_typeof(elem) = 'string' THEN
              jsonb_build_object(
                'id', gen_random_uuid()::text,
                'text', elem #>> '{}',
                'active', true
              )
            WHEN jsonb_typeof(elem) = 'object' AND elem ? 'text' THEN
              jsonb_build_object(
                'id', COALESCE(elem->>'id', gen_random_uuid()::text),
                'text', elem->>'text',
                'active', COALESCE((elem->>'active')::boolean, true)
              )
            ELSE NULL
          END
        )
        FROM jsonb_array_elements(%I) elem
        WHERE elem IS NOT NULL
      ), '[]'::jsonb)
      WHERE %I IS NOT NULL
        AND jsonb_typeof(%I) = 'array';
    $f$, col, col, col, col);
  END LOOP;
END $$;
