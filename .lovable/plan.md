# Fix: Migration `speaker_profiles` nachziehen

## Befund
- `SELECT to_regclass('public.speaker_profiles')` → `NULL` → Tabelle fehlt in der DB.
- Prompt `profil_generator` (v1, active, `google/gemini-2.5-flash`) ist bereits geseedet.
- Ohne Tabelle crasht der erste Klick auf „Profil generieren".

## Claudes Konsistenz-Hinweise — übernommen
1. **RLS-Policies aufsplitten** statt `FOR ALL` (analog `speaker_scans`): je eine Policy für SELECT / INSERT / UPDATE / DELETE für Admins. Speaker-SELECT bleibt separat.
2. **`generated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL`** (statt loser uuid) — analog `speaker_scans.triggered_by`.
3. Arrays bleiben `text[]` (Function liefert String-Arrays, kein Handlungsbedarf).

## Migration (eine Datei)

Reihenfolge: CREATE TABLE → GRANT → ENABLE RLS → POLICIES → TRIGGER.

**Spalten**
- `id uuid pk default gen_random_uuid()`
- `post_id uuid NOT NULL UNIQUE REFERENCES posts(id) ON DELETE CASCADE`
- `speaker_id uuid NOT NULL REFERENCES speakers(id) ON DELETE CASCADE`
- `status text NOT NULL DEFAULT 'entwurf'` CHECK in (`entwurf`, `kuratiert`, `freigegeben`)
- Inhalte: `kurzbio text`, `langbio text`, `positionierung text`, `zielgruppe text`, `notes text`
- Arrays default `'{}'`: `themen text[]`, `kernaussagen text[]`, `mediale_hooks text[]`, `kritische_punkte text[]`
- `expertise_score int` CHECK 1..10
- Meta: `model text`, `prompt_version int`, `generated_at timestamptz`, `generated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL`, `raw_json jsonb`
- `created_at`, `updated_at timestamptz NOT NULL DEFAULT now()`

**Grants**
```
GRANT SELECT, INSERT, UPDATE, DELETE ON public.speaker_profiles TO authenticated;
GRANT ALL ON public.speaker_profiles TO service_role;
```
(kein `anon` — alle Policies scopen auf `auth.uid()`)

**RLS-Policies** (Stil analog `speaker_scans`, `has_role(auth.uid(),'admin')`)
- `speaker_profiles_admin_select` — SELECT, USING admin
- `speaker_profiles_admin_insert` — INSERT, WITH CHECK admin
- `speaker_profiles_admin_update` — UPDATE, USING/WITH CHECK admin
- `speaker_profiles_admin_delete` — DELETE, USING admin
- `speaker_profiles_speaker_select` — SELECT für eigenen Post nur wenn `status='freigegeben'`:
  ```
  EXISTS (
    SELECT 1 FROM posts p
    JOIN speakers s ON s.id = p.speaker_id
    WHERE p.id = speaker_profiles.post_id
      AND s.user_id = auth.uid()
  ) AND status = 'freigegeben'
  ```

**Trigger**
- `BEFORE UPDATE` → bestehende Funktion `public.update_updated_at_column()`.

**Kein CHECK-Umbau an `posts.status`** — `'profil'` ist bereits erlaubt.

## Smoke-Test danach
Modul 2 → „Profil anlegen" → Modul 3 → „Profil generieren". Erwartet: Zeile in `speaker_profiles`, `posts.status = 'profil'`, Editor zeigt Entwurf. Types werden auto-regeneriert; die `(supabase as any)`-Casts im `ProfilEditor` können bleiben.

## Nicht Teil dieses Fixes
Sprechermappe, Speaker-Freigabe-Flow, weitere Statusübergänge.
