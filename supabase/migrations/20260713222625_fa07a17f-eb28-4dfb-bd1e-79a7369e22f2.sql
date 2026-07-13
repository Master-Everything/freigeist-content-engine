ALTER TABLE public.recording_sessions
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS stream_url text NULL,
  ADD COLUMN IF NOT EXISTS stream_platform text NULL;