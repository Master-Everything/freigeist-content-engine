
CREATE TABLE public.post_scans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  triggered_by uuid,
  status text NOT NULL DEFAULT 'pending',
  verdict text,
  score integer,
  summary text,
  findings jsonb NOT NULL DEFAULT '[]'::jsonb,
  model_used text,
  prompt_key_used text,
  prompt_version_used integer,
  tokens_in integer,
  tokens_out integer,
  duration_ms integer,
  error_text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_post_scans_post_id ON public.post_scans(post_id);
CREATE INDEX idx_post_scans_created_at ON public.post_scans(created_at DESC);

GRANT SELECT ON public.post_scans TO authenticated;
GRANT ALL ON public.post_scans TO service_role;

ALTER TABLE public.post_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all post scans"
  ON public.post_scans FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Speakers can view own post scans"
  ON public.post_scans FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.posts p
      JOIN public.speakers s ON s.id = p.speaker_id
      WHERE p.id = post_scans.post_id AND s.user_id = auth.uid()
    )
  );

CREATE TRIGGER update_post_scans_updated_at
  BEFORE UPDATE ON public.post_scans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
