# Abgleich `.lovable/plan.md` ↔ aktueller Stand

Der geparkte Plan „Fix: Migration `speaker_profiles` nachziehen" ist **komplett abgearbeitet**. Nichts davon steht noch offen.

## Was der Plan gefordert hat — und wo es liegt

| Punkt aus plan.md | Status | Beleg |
|---|---|---|
| Tabelle `public.speaker_profiles` anlegen (Spalten wie spezifiziert) | erledigt | Migration `20260711080221_…sql` |
| `GRANT SELECT/INSERT/UPDATE/DELETE … TO authenticated`, `ALL TO service_role`, kein `anon` | erledigt | selbe Migration |
| RLS aufgesplittet: `admin_select/insert/update/delete` + `speaker_select` (nur eigener Post, Status `freigegeben`) | erledigt | selbe Migration |
| `generated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL` | erledigt | selbe Migration |
| `BEFORE UPDATE` Trigger → `update_updated_at_column()` | erledigt | selbe Migration |
| Seed Prompt `profil_generator` (v1, active, `google/gemini-2.5-flash`) | erledigt (bereits vorher via `supabase--insert`) | wird von Edge Function geladen |
| Kein Umbau an `posts.status` CHECK — `'profil'` bereits erlaubt | erledigt | Constraint enthält `'profil'` |
| Edge Function `generate-speaker-profile` (fetch-Pattern, tool_calls, upsert on `post_id`, `posts.status = 'profil'`) | erledigt | `supabase/functions/generate-speaker-profile/index.ts` |
| `ProfilEditor` + Kontext-Ansicht in Modul 3 | erledigt | `src/components/profil/ProfilEditor.tsx`, `src/pages/modules/Module3Profil.tsx` |

## Was der Plan als „nicht Teil dieses Fixes" markiert hat
- Sprechermappe
- Speaker-Freigabe-Flow (Speaker sieht Profil-Entwurf, kommentiert, gibt frei)
- Weitere Statusübergänge nach `profil` (Richtung Modul 4)

Das sind die nächsten sinnvollen Bausteine für Modul 3 — aber nicht Bestandteil des geparkten Fix-Plans.

## Empfehlung

1. **Smoke-Test** aus dem Plan noch durchziehen, falls nicht geschehen: Modul 2 → „Profil anlegen" → Modul 3 → „Profil generieren". Prüfen: Zeile in `speaker_profiles`, `posts.status = 'profil'`, Editor zeigt Entwurf.
2. `.lovable/plan.md` **löschen oder als erledigt markieren**, damit der geparkte Zustand nicht später verwirrt.
3. Danach entscheiden, welcher der drei „nicht Teil dieses Fixes"-Punkte als Nächstes drankommt (Vorschlag: Speaker-Freigabe-Flow, weil er den Statusübergang zu Modul 4 vorbereitet).

Sag mir, ob ich (a) den Smoke-Test skripten und die geparkte Datei aufräumen soll, oder (b) direkt in den Speaker-Freigabe-Flow einsteigen soll.
