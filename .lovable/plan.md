# Modul 3 – Profil-Generator (AI)  — GEPARKT

Status: geparkt. Zuerst offene Bugs fixen, danach hier weitermachen.

Ziel: In der Kontext-Ansicht von Modul 3 (`?post_id=…&speaker_id=…`) erzeugt der Admin per Knopfdruck einen strukturierten **Profil-Entwurf** für den Interviewgast, kann ihn kuratieren und speichern. Basis: Speaker-Stammdaten (Modul 1), Interview-Details (Modul 1), optional Transcript/Sources und die Wissensbasis (Compliance-Regeln, Banned Words, Prompt „profil_generator").

## Umfang dieses Schritts

1. Backend (Tabelle + Edge Function + Prompt-Seed)
2. UI in `Module3Profil.tsx` (nur Kontext-Ansicht, Listen-Ansicht bleibt unverändert)
3. Speaker-Freigabe/Sprechermappe **nicht** in diesem Schritt

## Daten & Schema

Neue Tabelle `speaker_profiles` (1:1 pro Post):

```
id uuid pk
post_id uuid fk posts unique
speaker_id uuid fk speakers
generated_at timestamptz
generated_by uuid
model text                 -- z. B. google/gemini-2.5-pro
prompt_version text        -- Referenz auf knowledge_prompts.version
status text                -- 'entwurf' | 'kuratiert' | 'freigegeben'
-- generierte Felder
kurzbio text
langbio text
themen jsonb               -- string[]
kernaussagen jsonb         -- string[]
expertise_score int        -- 1-10
positionierung text
zielgruppe text
mediale_hooks jsonb        -- string[]
kritische_punkte jsonb     -- string[] (aus Vorab-Scan + Wissensbasis)
raw_json jsonb             -- vollständige LLM-Antwort
notes text                 -- Admin-Kommentar
created_at, updated_at
```

- RLS: Admin voll; Speaker nur SELECT wenn `posts.speaker_id.user_id = auth.uid()` UND `status = 'freigegeben'`.
- GRANTs für `authenticated` + `service_role`.

Neuer Prompt-Eintrag in `knowledge_prompts`: `key = 'profil_generator'` per Seed, damit Admin ihn in `/admin/wissensbasis` editieren kann.

Post-Status-Übergang: nach Speichern `posts.status = 'profil_entwurf'`.

## Edge Function `generate-speaker-profile`

- Input: `{ post_id, speaker_id }`.
- Lädt: Speaker-Stammdaten, Post (Interview-Felder + Transcript/Source), letzten `post_scan` + `speaker_scan`, Wissensbasis (`compliance_rules`, `banned_words`, Prompt `profil_generator`).
- Baut System-Prompt aus Wissensbasis + festem Rahmen.
- Ruft **Lovable AI Gateway** über AI SDK (`@ai-sdk/openai-compatible` via `npm:ai`) mit `google/gemini-2.5-pro`.
- Strukturierte Ausgabe via `generateText({ output: Output.object({ schema }) })` mit flachem Zod-Schema. Bounds nur im Prompt, nicht im Schema.
- Fehlerpfad: 200 OK mit `{ error: "..." }` (Projekt-Konvention).
- Upsert in `speaker_profiles` (unique `post_id`), Post-Status auf `profil_entwurf` setzen.

## UI in `Module3Profil.tsx` (Kontext-Ansicht)

Neue Sektion **Profil-Entwurf** zwischen Kontext-Karten und Platzhalter:

- Kein Eintrag → Card mit Button **„Profil generieren"** (Loader).
- Eintrag vorhanden → editierbare Felder:
  - Kurzbio, Langbio, Positionierung, Zielgruppe (Input/Textarea)
  - Themen, Kernaussagen, Mediale Hooks, Kritische Punkte (Chips + Add/Remove)
  - Expertise-Score (Slider 1–10)
  - Meta: Modell, Prompt-Version, generated_at
  - Buttons: **„Neu generieren"**, **„Speichern"**, **„Als kuratiert markieren"**

Speaker sieht in der Listen-Ansicht weiterhin nur Hinweistext.

## Files

- Migration: neue Tabelle + GRANTs + RLS + Seed `knowledge_prompts.profil_generator`.
- `supabase/functions/generate-speaker-profile/index.ts` (neu).
- `supabase/functions/_shared/ai-gateway.ts` (falls noch nicht vorhanden).
- `src/pages/modules/Module3Profil.tsx`: Kontext-Ansicht erweitern.
- `src/components/profil/ProfilEditor.tsx` (neu, hält Formularlogik).
- `src/integrations/supabase/types.ts` regeneriert sich automatisch.

## Offene Punkte (bewusst später)

- Sprechermappe (Layout + PDF/Share-Link).
- Speaker-Freigabe-Flow und Statusübergang → Modul 4.
- Sidebar-Badges für Post-Status `profil_entwurf` / `profil_freigegeben`.
