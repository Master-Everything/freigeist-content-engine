-- =========================================================
-- pre_interview_calls
-- =========================================================
CREATE TABLE public.pre_interview_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL UNIQUE REFERENCES public.posts(id) ON DELETE CASCADE,
  scheduled_at timestamptz,
  meeting_link text,
  status text NOT NULL DEFAULT 'geplant' CHECK (status IN ('geplant','durchgefuehrt','abgesagt')),
  flow_notes text,
  clarifications jsonb NOT NULL DEFAULT '[]'::jsonb,
  internal_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pre_interview_calls TO authenticated;
GRANT ALL ON public.pre_interview_calls TO service_role;

ALTER TABLE public.pre_interview_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pre_interview_calls_admin_select" ON public.pre_interview_calls
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "pre_interview_calls_admin_insert" ON public.pre_interview_calls
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "pre_interview_calls_admin_update" ON public.pre_interview_calls
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "pre_interview_calls_admin_delete" ON public.pre_interview_calls
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "pre_interview_calls_speaker_select" ON public.pre_interview_calls
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.posts p
      JOIN public.speakers s ON s.id = p.speaker_id
      WHERE p.id = pre_interview_calls.post_id
        AND s.user_id = auth.uid()
    )
  );

CREATE TRIGGER update_pre_interview_calls_updated_at
  BEFORE UPDATE ON public.pre_interview_calls
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- knowledge_guides
-- =========================================================
CREATE TABLE public.knowledge_guides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  title text NOT NULL,
  body_md text NOT NULL,
  quick_tips jsonb NOT NULL DEFAULT '[]'::jsonb,
  version int NOT NULL DEFAULT 1,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.knowledge_guides TO authenticated;
GRANT ALL ON public.knowledge_guides TO service_role;

ALTER TABLE public.knowledge_guides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "knowledge_guides_read_all_auth" ON public.knowledge_guides
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "knowledge_guides_admin_insert" ON public.knowledge_guides
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "knowledge_guides_admin_update" ON public.knowledge_guides
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "knowledge_guides_admin_delete" ON public.knowledge_guides
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_knowledge_guides_updated_at
  BEFORE UPDATE ON public.knowledge_guides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- posts.status: vorgespraech_done ergänzen
-- =========================================================
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_status_check;
ALTER TABLE public.posts ADD CONSTRAINT posts_status_check CHECK (status = ANY (ARRAY[
  'erfassung','scan_pending','scan_done','redaktion_angefragt','in_bearbeitung',
  'vorab_scan','profil','profil_review','leitfaden','leitfaden_final',
  'vorgespraech','vorgespraech_done','aufzeichnung','draft','in_progress','exported'
]));

-- =========================================================
-- Seed: Speaker-Medientraining (Modul 5 & 6)
-- Quelle: docs/knowledge/speaker_medientraining.md (Repo-Referenz)
-- =========================================================
INSERT INTO public.knowledge_guides (key, title, body_md, quick_tips, version, active) VALUES (
  'speaker_medientraining',
  'Der Freigeist-Speaker-Guide — Medientraining für Interviews (M5 & M6)',
  $md$# Der Freigeist-Speaker-Guide
### Medientraining für Interviews im Freigeist-Format (Module 5 & 6)

*Erstellt auf Basis von freigeistkongress.com und des YouTube-Kanals @FREIGEISTKONGRESS.*

## 0. Das Format verstehen, bevor man coacht

Jeder gute Medientrainer coacht auf das *tatsächliche* Format hin, nicht auf ein generisches Interview. Das Freigeist-Format hat einige Besonderheiten, die die Tipps unten prägen:

- **Live Calls, jeden Donnerstag 19:00 Uhr**, mit anschließender **interaktiver Live-F&A** – der Speaker steht nicht nur der Moderation, sondern danach auch direkt der Community Rede und Antwort.
- **Positionierung „unzensiert, unabhängig, unverblümt"** und „auf Augenhöhe" – die Zielgruppe erwartet explizit *keine* geglättete PR-Sprache, sondern Klartext und persönliche Haltung.
- **Themenspektrum**: Bewusstsein, Gesundheit, Frequenzmedizin, Recht/Souveränität, Finanzen, alternative Medien.
- **Community-Charakter**: Die Zuschauer sind wiederkehrende Mitglieder eines geschlossenen Netzwerks. Vertrauen und Wiedererkennbarkeit zählen mehr als einmalige Schlagzeilen-Momente.
- **Aufzeichnung mit Nachnutzung**: Die Calls landen im Experten-Archiv und werden später als Profile/Content weiterverwendet (M7/M8).

## 1. Mindset: Die drei Fragen vor jedem Interview

1. **Was ist die EINE Botschaft, die auch dann hängen bleiben soll, wenn jemand nur 3 Minuten zuschaut?**
2. **Was ist mein Beweis dafür** – eine Geschichte, ein Fall, eine Zahl, ein persönliches Erlebnis?
3. **Was will ich, dass die Zuschauer danach konkret TUN** (nicht nur denken)?

Wer diese drei Punkte nicht in einem Satz beantworten kann, ist noch nicht interviewreif – unabhängig davon, wie viel Fachwissen vorhanden ist.

## 2. Vorbereitung / Vorgespräch (Modul 5)

Das Vorgespräch ist der wichtigste Hebel für ein gutes Interview – hier wird die Qualität zu 80% entschieden.

### 2.1 Struktur statt Skript
- **Kein Wort-für-Wort-Skript.** Skripte klingen vorgelesen. Stattdessen: 3–5 Kernbotschaften + dazugehörige Geschichten/Belege, in Stichworten.
- **Bridging-Sätze vorbereiten**: kurze, geübte Formulierungen, mit denen man von einer schwierigen Frage zur eigenen Kernbotschaft zurückfindet.
- **Die W-Fragen des Gastgebers antizipieren**: Auf Basis der Hauptfragen/Vertiefungsfragen die wahrscheinlichen Nachfragen durchspielen.

### 2.2 Der Ein-Satz-Test
Jede Kernaussage sollte in einem Satz ohne Fachjargon verständlich sein.

### 2.3 Die „Drei Anekdoten"-Regel
Für jedes Thema mindestens eine konkrete, persönliche Geschichte vorbereiten. Fakten überzeugen den Kopf, Geschichten bleiben im Gedächtnis.

### 2.4 Rote Linien klären
Beim Vorgespräch aktiv ansprechen: Gibt es Themen, Formulierungen oder Behauptungen, die bewusst vermieden werden sollen (z. B. konkrete Heilversprechen, Anlageempfehlungen, Aussagen mit rechtlichem Risiko)?

### 2.5 Technik-Check
Kamera auf Augenhöhe, gutes Licht (Lichtquelle vor dem Gesicht), stabiles Internet, externes Mikrofon falls möglich, ruhiger Hintergrund.

## 3. Performance im Live-Interview (Modul 6)

### 3.1 Energie & Präsenz
- **Status zeigen, nicht Status behaupten.** Aufrechte Haltung, offene Gestik, ruhiges Tempo. Bewusst 10–15% langsamer sprechen als im Alltag.
- **Pausen sind Stärke, keine Schwäche.**
- **Lächeln und Energie auch bei ernsten Themen** in der Anmoderation.

### 3.2 Antwortstruktur: Die PREP-Methode
- **P**oint – Kernaussage zuerst, in einem Satz.
- **R**eason – kurze Begründung.
- **E**xample – Beleg, Geschichte oder Zahl.
- **P**oint – Kernaussage wiederholen, ggf. mit Handlungsaufforderung.

### 3.3 Umgang mit kontroversen Fragen
- **Nie defensiv werden.**
- **Unterscheiden zwischen Meinung, Erfahrung und Fakt** – und das auch sprachlich kennzeichnen.
- **Bridging statt Ausweichen.**
- **Nie über Dritte in einer Weise sprechen, die nicht auch vor deren Gesicht gesagt würde.**

### 3.4 Sprache: Klartext statt Worthülsen
- Aktive Sprache statt Passiv-Konstruktionen.
- Konkrete Beispiele statt abstrakter Prinzipien.
- Eigene Haltung klar benennen.

### 3.5 Blickkontakt & Kamera-Präsenz
Blick regelmäßig in die Kamera richten, wenn eine zentrale Aussage direkt an die Zuschauer geht.

## 4. Die Live-F&A-Runde danach

- **Antworten kürzer halten** als im Hauptinterview.
- **Ungeplante/unbequeme Fragen aus der Community sind wahrscheinlich.**
- **Bei Unsicherheit lieber ehrlich „Das kann ich nicht seriös beantworten, aber…" sagen.**

## 5. Kurz-Checkliste

**Vor dem Call:**
- Eine Kernbotschaft pro Thema in einem Satz formuliert
- Mindestens eine persönliche Geschichte pro Thema vorbereitet
- Rote Linien mit dem Team abgestimmt
- Technik getestet (Licht, Ton, Internet)

**Während des Calls:**
- PREP-Struktur bei Antworten im Kopf
- Bewusst Pausen setzen, Tempo drosseln
- Meinung/Erfahrung/Fakt sprachlich unterscheiden
- Bei Kritik: anerkennen, dann brücken

**In der F&A:**
- Antworten kurzhalten
- Bei Unsicherheit ehrlich bleiben statt improvisieren$md$,
  '[
    "Eine Kernbotschaft in einem Satz — ohne Fachjargon.",
    "Für jedes Thema eine persönliche Geschichte parat haben.",
    "Rote Linien (Heilversprechen, Anlageempfehlungen, Rechtliches) vorab klären.",
    "PREP: Point – Reason – Example – Point.",
    "Bewusst 10–15% langsamer sprechen, Pausen setzen.",
    "Meinung, Erfahrung und Fakt sprachlich unterscheiden.",
    "Bei Kritik anerkennen, dann brücken — nie defensiv werden.",
    "Technik-Check: Licht vorn, Kamera auf Augenhöhe, stabiles Netz."
  ]'::jsonb,
  1,
  true
);