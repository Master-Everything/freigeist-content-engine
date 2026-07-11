## Modul 4 — Interview-Leitfaden

Neubau analog Modul 3. Input: freigegebenes `speaker_profile` + Interview-Kontext auf `posts`. Output: strukturierter Leitfaden, den die Redaktion kuratiert und dem Speaker read-only zur Vorbereitung freigibt.

## Workflow

```text
posts.status = 'leitfaden'          → Admin sieht Post in Modul-4-Queue
  → "Leitfaden generieren"          → interview_guides.status = 'entwurf'
  → Admin kuratiert & finalisiert   → interview_guides.status = 'final'
                                    → posts.status = 'leitfaden_final'
  → Speaker sieht Read-only         → nächster Schritt (Modul 5)
```

Kein Speaker-Feedback-Loop — Leitfaden ist redaktionsintern, Speaker sieht ihn nur zur Vorbereitung.

## Datenbank (eine Migration)

**`interview_guides`** (1:1 zu `posts`):
- `id`, `post_id` UNIQUE (FK → posts, ON DELETE CASCADE)
- `speaker_id` (FK → speakers)
- `speaker_profile_id` **FK → public.speaker_profiles(id) ON DELETE SET NULL**
- `intro` text — Einstieg/Begrüßung
- `hauptfragen` jsonb — Array Kernfragen
- `vertiefungsfragen` jsonb — Array Follow-ups
- `kritische_fragen` jsonb — aus `critical_voices` + Compliance
- `abschluss` text
- `redaktionelle_hinweise` text — nur intern, Speaker sieht das NICHT
- `notes` text, `status` text ('entwurf' | 'final')
- `generated_by` uuid **REFERENCES auth.users(id) ON DELETE SET NULL**
- `model_used`, `prompt_version`, `raw_json` jsonb
- `created_at`, `updated_at` + Update-Trigger

**Grants (in derselben Migration):**
```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interview_guides TO authenticated;
GRANT ALL ON public.interview_guides TO service_role;
```

**RLS — vier Einzel-Policies für Admin + eine für Speaker, exakt wie bei `speaker_profiles` (KEIN `FOR ALL`):**
- `interview_guides_admin_select` — `has_role(auth.uid(),'admin')`
- `interview_guides_admin_insert` — `has_role(auth.uid(),'admin')`
- `interview_guides_admin_update` — `has_role(auth.uid(),'admin')`
- `interview_guides_admin_delete` — `has_role(auth.uid(),'admin')`
- `interview_guides_speaker_select` — Speaker sieht eigenen Post UND `status = 'final'`
  (`EXISTS (SELECT 1 FROM speakers WHERE id = interview_guides.speaker_id AND user_id = auth.uid()) AND status = 'final'`)

**`posts_status_check`** in derselben Migration erweitern um `'leitfaden_final'`.

**Prompt seeden** (`knowledge_prompts`): `key='leitfaden_generator'`, nutzt Profil + Interview-Kontext + Compliance-Regeln.

## Edge Functions

**`generate-interview-guide`** — analog `generate-speaker-profile`:
- Admin-only. Lädt Post, Profil, `knowledge_compliance_rules`, `knowledge_banned_words`, aktiven Prompt
- Ruft Lovable AI (`google/gemini-2.5-flash`) via direktem `fetch` mit `tool_choice`
- Upsert in `interview_guides` (onConflict `post_id`), Status `entwurf`

**`interview-guide-decision`** — analog `speaker-profile-decision`:
- `finalisieren` (Admin): `guide.status='final'` + `posts.status='leitfaden_final'`
- `zurueck_entwurf` (Admin): `guide.status='entwurf'` + `posts.status='leitfaden'`

Reine Inhaltsbearbeitung (Speichern der Felder) läuft direkt per `supabase.from('interview_guides').update()` über die Admin-RLS — keine Function nötig.

## Frontend

**`src/pages/modules/Module4Leitfaden.tsx`** — Neubau (aktuell nur 13-Zeilen-Placeholder), Struktur wie `Module3Profil.tsx`:
- Admin-Queue: Posts mit Status `leitfaden` oder `leitfaden_final`
- Speaker-Queue: eigene Posts mit `leitfaden_final` → öffnet Read-only-Ansicht
- Detail-Ansicht rendert Editor (Admin) oder Reader (Speaker)

**`src/components/leitfaden/LeitfadenEditor.tsx`** (Admin):
- Felder für alle Sektionen, Fragen als Listen (add/remove/edit/reorder)
- Buttons: „Generieren" / „Neu generieren", „Speichern", „Als final markieren" / „Zurück zu Entwurf"
- Amber-Hinweis wenn `leitfaden_final` (Speaker sieht mit — `redaktionelle_hinweise` bleibt trotzdem intern)

**`src/components/leitfaden/LeitfadenReadonly.tsx`** (Speaker):
- Read-only, ohne `redaktionelle_hinweise`
- Hinweistext: „Zur Vorbereitung auf dein Vorgespräch/Interview"

**`src/pages/MyPosts.tsx`** — Status-Badge + Link für `leitfaden_final` („Leitfaden ansehen").

**`src/components/AppSidebar.tsx`** — Modul 4 auf `active`.

## Nicht-Ziele

- Kein Speaker-Feedback-Loop auf den Leitfaden.
- Kein Export/PDF in diesem Schritt.
- Keine Änderungen an Modul 5+.
