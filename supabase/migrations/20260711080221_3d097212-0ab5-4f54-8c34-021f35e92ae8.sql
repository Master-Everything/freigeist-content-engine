
CREATE TABLE public.speaker_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL UNIQUE REFERENCES public.posts(id) ON DELETE CASCADE,
  speaker_id uuid NOT NULL REFERENCES public.speakers(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'entwurf' CHECK (status IN ('entwurf','kuratiert','freigegeben')),
  kurzbio text,
  langbio text,
  positionierung text,
  zielgruppe text,
  notes text,
  themen text[] NOT NULL DEFAULT '{}',
  kernaussagen text[] NOT NULL DEFAULT '{}',
  mediale_hooks text[] NOT NULL DEFAULT '{}',
  kritische_punkte text[] NOT NULL DEFAULT '{}',
  expertise_score integer CHECK (expertise_score BETWEEN 1 AND 10),
  model text,
  prompt_version integer,
  generated_at timestamptz,
  generated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  raw_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.speaker_profiles TO authenticated;
GRANT ALL ON public.speaker_profiles TO service_role;

ALTER TABLE public.speaker_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY speaker_profiles_admin_select ON public.speaker_profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY speaker_profiles_admin_insert ON public.speaker_profiles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY speaker_profiles_admin_update ON public.speaker_profiles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY speaker_profiles_admin_delete ON public.speaker_profiles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY speaker_profiles_speaker_select ON public.speaker_profiles
  FOR SELECT TO authenticated
  USING (
    status = 'freigegeben'
    AND EXISTS (
      SELECT 1 FROM public.posts p
      JOIN public.speakers s ON s.id = p.speaker_id
      WHERE p.id = speaker_profiles.post_id
        AND s.user_id = auth.uid()
    )
  );

CREATE TRIGGER update_speaker_profiles_updated_at
  BEFORE UPDATE ON public.speaker_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
