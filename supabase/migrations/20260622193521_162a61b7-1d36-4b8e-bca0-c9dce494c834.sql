ALTER TABLE public.speakers
  DROP COLUMN IF EXISTS interview_topic,
  DROP COLUMN IF EXISTS product,
  DROP COLUMN IF EXISTS product_market_since,
  DROP COLUMN IF EXISTS previous_interviews,
  DROP COLUMN IF EXISTS critical_voices;

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS interview_topic text,
  ADD COLUMN IF NOT EXISTS product text,
  ADD COLUMN IF NOT EXISTS product_market_since text,
  ADD COLUMN IF NOT EXISTS previous_interviews text,
  ADD COLUMN IF NOT EXISTS critical_voices text,
  ADD COLUMN IF NOT EXISTS selected_affiliate_indices integer[] NOT NULL DEFAULT '{}';