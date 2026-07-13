
-- Add aufzeichnung_done to posts status check
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_status_check;
ALTER TABLE public.posts ADD CONSTRAINT posts_status_check CHECK (status = ANY (ARRAY[
  'erfassung','scan_pending','scan_done','redaktion_angefragt','in_bearbeitung',
  'vorab_scan','profil','profil_review','leitfaden','leitfaden_final',
  'vorgespraech','vorgespraech_done','aufzeichnung','aufzeichnung_done',
  'draft','in_progress','exported'
]));

-- Recording sessions table
CREATE TABLE public.recording_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL UNIQUE REFERENCES public.posts(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'nicht_gestartet'
    CHECK (status IN ('nicht_gestartet','laeuft','pausiert','beendet')),
  accumulated_seconds integer NOT NULL DEFAULT 0,
  resumed_at timestamptz NULL,
  question_order jsonb NOT NULL DEFAULT '[]'::jsonb,
  asked_question_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  interviewer_notiz text NULL,
  recording_markers jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.recording_sessions TO authenticated;
GRANT ALL ON public.recording_sessions TO service_role;

ALTER TABLE public.recording_sessions ENABLE ROW LEVEL SECURITY;

-- Admin: vier explizite Einzel-Policies
CREATE POLICY recording_sessions_admin_select ON public.recording_sessions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY recording_sessions_admin_insert ON public.recording_sessions
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY recording_sessions_admin_update ON public.recording_sessions
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY recording_sessions_admin_delete ON public.recording_sessions
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Speaker: nur lesen, wenn der Post seinem Speaker-Datensatz zugeordnet ist
CREATE POLICY recording_sessions_speaker_select ON public.recording_sessions
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.posts p
      JOIN public.speakers s ON s.id = p.speaker_id
      WHERE p.id = recording_sessions.post_id
        AND s.user_id = auth.uid()
    )
  );

CREATE TRIGGER update_recording_sessions_updated_at
  BEFORE UPDATE ON public.recording_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
