-- Hub-Migration: Ingest-Support für Interviews aus der Content-Engine
-- Im HUB-Projekt ausführen (nicht in der Engine!)

-- 1) Rück-Referenz auf die Herkunft in der Engine
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS source_engine_post_id uuid,
  ADD COLUMN IF NOT EXISTS source_engine_pushed_at timestamptz;

CREATE INDEX IF NOT EXISTS posts_source_engine_post_id_idx
  ON public.posts (source_engine_post_id);

-- 2) Kategorie „Interview" sicherstellen (Slug: interview)
--    Passe Spaltennamen bei Bedarf an dein Hub-categories-Schema an.
INSERT INTO public.categories (name, slug)
VALUES ('Interview', 'interview')
ON CONFLICT (slug) DO NOTHING;
