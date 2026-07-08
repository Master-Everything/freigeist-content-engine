ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS hub_post_id uuid,
  ADD COLUMN IF NOT EXISTS hub_slug text,
  ADD COLUMN IF NOT EXISTS hub_pushed_at timestamptz,
  ADD COLUMN IF NOT EXISTS hub_last_error text;