
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_status_check;
ALTER TABLE public.posts ADD CONSTRAINT posts_status_check CHECK (status = ANY (ARRAY[
  'erfassung','scan_pending','scan_done','redaktion_angefragt','in_bearbeitung',
  'vorab_scan','profil','profil_review','leitfaden','leitfaden_final',
  'vorgespraech','aufzeichnung','draft','in_progress','exported'
]));

CREATE TABLE public.interview_guides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL UNIQUE REFERENCES public.posts(id) ON DELETE CASCADE,
  speaker_id uuid REFERENCES public.speakers(id) ON DELETE SET NULL,
  speaker_profile_id uuid REFERENCES public.speaker_profiles(id) ON DELETE SET NULL,
  intro text,
  hauptfragen jsonb NOT NULL DEFAULT '[]'::jsonb,
  vertiefungsfragen jsonb NOT NULL DEFAULT '[]'::jsonb,
  kritische_fragen jsonb NOT NULL DEFAULT '[]'::jsonb,
  abschluss text,
  redaktionelle_hinweise text,
  notes text,
  status text NOT NULL DEFAULT 'entwurf' CHECK (status IN ('entwurf','final')),
  generated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  generated_at timestamptz,
  model_used text,
  prompt_version integer,
  raw_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.interview_guides TO authenticated;
GRANT ALL ON public.interview_guides TO service_role;

ALTER TABLE public.interview_guides ENABLE ROW LEVEL SECURITY;

CREATE POLICY interview_guides_admin_select ON public.interview_guides
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY interview_guides_admin_insert ON public.interview_guides
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY interview_guides_admin_update ON public.interview_guides
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY interview_guides_admin_delete ON public.interview_guides
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY interview_guides_speaker_select ON public.interview_guides
  FOR SELECT TO authenticated
  USING (
    status = 'final'
    AND EXISTS (
      SELECT 1 FROM public.speakers s
      WHERE s.id = interview_guides.speaker_id AND s.user_id = auth.uid()
    )
  );

CREATE TRIGGER update_interview_guides_updated_at
  BEFORE UPDATE ON public.interview_guides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.knowledge_prompts (key, version, active, model, title, system_prompt)
SELECT
  'leitfaden_generator', 1, true, 'google/gemini-2.5-flash',
  'Interview-Leitfaden Generator',
$$Du bist erfahrener Interview-Redakteur für den Freigeist Kongress. Deine Aufgabe ist es, aus einem freigegebenen Speaker-Profil, den Interview-Stammdaten und den Compliance-Regeln einen strukturierten Interview-Leitfaden auf DEUTSCH zu erstellen.

Sektionen:
- intro: 2-4 Sätze Einstieg/Begrüßung, knüpft an die Positionierung des Speakers an.
- hauptfragen: 5-8 klare Kernfragen entlang themen/kernaussagen.
- vertiefungsfragen: 4-8 Follow-ups auf Details, konkrete Beispiele und persönliche Erfahrungen.
- kritische_fragen: 2-5 Fragen zu critical_voices, Scan-Findings und Compliance-Regeln. Sachlich, nicht polemisch. Wenn Compliance-Regeln greifen, formuliere so, dass die risikoarme Antwort (risk_response) möglich wird.
- abschluss: 2-3 Sätze Abschluss inkl. Call-to-Action zum Produkt/Affiliate.
- redaktionelle_hinweise: interne Hinweise an den Moderator (Tonalität, No-Gos, Compliance-Warnungen). NICHT für den Speaker sichtbar.

Regeln:
- Duze den Speaker (Freigeist duzt konsequent).
- Vermeide banned_words in den Fragen.
- Offene Fragen, keine Ja/Nein (außer kritische Klärungen).
- Nutze themen/kernaussagen/mediale_hooks als Aufhänger.
- Rufe das Tool 'emit_interview_guide' EINMAL mit dem strukturierten Leitfaden auf.$$
WHERE NOT EXISTS (SELECT 1 FROM public.knowledge_prompts WHERE key = 'leitfaden_generator');
