# Modul 3 – Profil-Generator (überarbeitet)

## Review von Claudes Einschätzung

Alle 6 Punkte am Repo verifiziert und relevant:

| # | Punkt | Verifiziert | Übernehmen? |
|---|---|---|---|
| 1 | Kein `ai`/`@ai-sdk` im Repo, kein `_shared/`, alle Functions nutzen direkten `fetch` | ✅ | **Ja** — bestehendes Pattern beibehalten |
| 2 | Tabellen heißen `post_scans`/`speaker_scans` (Plural) | ✅ | **Ja** |
| 3 | `posts_status_check` erlaubt `profil_entwurf` nicht, aber `profil` ist frei | ✅ | **Ja** — `profil` wiederverwenden |
| 4 | `gemini-2.5-pro` weicht vom Repo-Default `gemini-2.5-flash` ab | ✅ | **Ja** — bewusst wählen |
| 5 | `knowledge_prompts.version` ist `integer`, nicht `text` | ✅ | **Ja** — `integer` |
| 6 | RLS-Konvention ist `has_role(auth.uid(),'admin')` | ✅ | **Ja** |

## Angepasster Umsetzungsplan

### 1. Migration
- Neue Tabelle `speaker_profiles` (1:1 pro Post, `post_id unique`).
- Felder wie im geparkten Plan, aber:
  - `prompt_version integer` (statt text)
  - `status text check (status in ('entwurf','kuratiert','freigegeben'))`
- GRANT SELECT/INSERT/UPDATE/DELETE auf `authenticated`, ALL auf `service_role`.
- RLS enable + Policies mit `public.has_role(auth.uid(),'admin')` für Vollzugriff; Speaker SELECT nur wenn Post gehört und `status='freigegeben'`.
- `updated_at`-Trigger via bestehender `update_updated_at_column()`.
- Kein CHECK-Constraint-Umbau nötig: Post-Status-Übergang nutzt vorhandenes **`'profil'`** statt neuem `profil_entwurf`.
- Seed `knowledge_prompts` mit `key='profil_generator'`, `model='google/gemini-2.5-flash'`, `version=1`.

### 2. Edge Function `generate-speaker-profile`
- Style analog zu `vorab-scan/index.ts`: direkter `fetch` an `https://ai.gateway.lovable.dev/v1/chat/completions`, kein AI SDK, keine neue Dependency.
- Optional (leichte Aufräumaktion): kleinen Helper `_shared/ai-gateway.ts` mit `callLovableGateway({model, messages, tools})` extrahieren und in dieser Function nutzen. Refactor der bestehenden Functions ist **nicht** Teil dieses Schritts.
- Modell: **`google/gemini-2.5-flash`** (Repo-Default). Kein Pro. Modellname aus `knowledge_prompts.model` lesen (Fallback flash), damit Admin es später in der Wissensbasis-UI wechseln kann.
- Strukturierte Ausgabe via `tool_calls` mit flachem JSON-Schema (kein `min`/`max`/Enum-Zwänge, Limits nur im Prompt). Selber Fehlerpfad wie im Rest: 200 OK mit `{ error: "..." }`.
- Verify JWT bleibt Default (an), Function ruft mit Service-Role-Client Wissensbasis + Scans.
- Upsert in `speaker_profiles` (`onConflict: post_id`), Post-Status auf **`'profil'`** setzen.
- Anschließend im Frontend: Filter in Modul 3 Liste um `'profil'` erweitern, damit Post nach Generierung dort weiter sichtbar bleibt.

### 3. Frontend
- `Module3Profil.tsx` Kontext-Ansicht bekommt Sektion **Profil-Entwurf**:
  - Kein Datensatz → Button „Profil generieren" (ruft Function).
  - Vorhanden → editierbare Felder (Kurzbio, Langbio, Positionierung, Zielgruppe, Themen-Chips, Kernaussagen, Mediale Hooks, Kritische Punkte, Expertise-Slider), Meta-Zeile, Buttons „Neu generieren"/„Speichern"/„Als kuratiert markieren".
- Neue Datei `src/components/profil/ProfilEditor.tsx` hält Formularlogik.
- Listen-Ansicht Modul 3: `.in('status', ['redaktion_angefragt','in_bearbeitung','profil'])`.
- Speaker-Freigabe/Sprechermappe/Status `freigegeben` bleiben wie im geparkten Plan explizit **out of scope**.

### 4. Technische Punkte

- Kein neues npm-Package.
- Keine Änderung an bestehenden Scan-Functions.
- `posts.status`-CHECK-Constraint unverändert.
- Types-Regeneration erfolgt automatisch nach Migration.

## Antwort auf Claudes Schlussfrage

Ja, die sechs Korrekturen sind übernommen. Der ursprüngliche `.lovable/plan.md` wird durch diesen Plan ersetzt, sobald du zustimmst.
