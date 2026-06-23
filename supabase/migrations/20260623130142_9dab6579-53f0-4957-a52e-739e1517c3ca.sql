
CREATE TABLE public.speaker_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  speaker_id UUID NOT NULL REFERENCES public.speakers(id) ON DELETE CASCADE,
  triggered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','done','error')),
  verdict TEXT CHECK (verdict IN ('green','yellow','red')),
  score INTEGER CHECK (score >= 0 AND score <= 100),
  summary TEXT,
  findings JSONB NOT NULL DEFAULT '[]'::jsonb,
  model_used TEXT,
  prompt_key_used TEXT,
  prompt_version_used INTEGER,
  tokens_in INTEGER,
  tokens_out INTEGER,
  duration_ms INTEGER,
  error_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_speaker_scans_speaker ON public.speaker_scans(speaker_id, created_at DESC);
CREATE INDEX idx_speaker_scans_verdict ON public.speaker_scans(verdict) WHERE verdict IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.speaker_scans TO authenticated;
GRANT ALL ON public.speaker_scans TO service_role;

ALTER TABLE public.speaker_scans ENABLE ROW LEVEL SECURITY;

-- Speaker sieht eigene Scans, Admin sieht alle
CREATE POLICY "Speaker sees own scans, admin sees all"
ON public.speaker_scans
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.speakers s
    WHERE s.id = speaker_scans.speaker_id AND s.user_id = auth.uid()
  )
);

-- Insert: nur Owner des Speakers oder Admin
CREATE POLICY "Owner or admin can insert scans"
ON public.speaker_scans
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.speakers s
    WHERE s.id = speaker_scans.speaker_id AND s.user_id = auth.uid()
  )
);

-- Update: nur Admin (Edge Function läuft mit service_role und umgeht RLS)
CREATE POLICY "Admin can update scans"
ON public.speaker_scans
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Delete: nur Admin
CREATE POLICY "Admin can delete scans"
ON public.speaker_scans
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_speaker_scans_updated_at
BEFORE UPDATE ON public.speaker_scans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
