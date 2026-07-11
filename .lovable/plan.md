## Ziel

Freigabe-Flow für kuratierte Speaker-Profile: Redaktion kuratiert → Speaker prüft & gibt frei → Modul 4 (Leitfaden) öffnet. Statuswechsel laufen atomar über eine Edge Function; RLS auf `speaker_profiles` bleibt eng.

## Ablauf aus Nutzersicht

**Redaktion (Admin) in Modul 3**
- „Als kuratiert markieren" ruft Edge Function `speaker-profile-decision` mit `action: 'kuratieren'` auf → setzt `speaker_profiles.status='kuratiert'` und `posts.status='profil_review'` atomar.
- Editor bleibt bis zur Freigabe editierbar.

**Speaker in Modul 3**
- Posts mit Status `profil_review` erscheinen in „Meine Anfragen" mit neuem blauen Badge „Zur Freigabe".
- Klick öffnet **Read-only-Profilansicht** (`ProfilReadonly.tsx`) mit allen kuratierten Feldern.
- Zwei Aktionen (beide via Edge Function):
  - **„Profil freigeben"** → `action: 'freigeben'` → `speaker_profiles.status='freigegeben'` + `posts.status='leitfaden'`.
  - **„Änderungen erbitten"** → `action: 'aenderung'` + `feedback`-Text → hängt Feedback an `speaker_profiles.notes` (mit Prefix und Timestamp), setzt `speaker_profiles.status='entwurf'` + `posts.status='in_bearbeitung'`.

**Redaktion nach Freigabe**
- Editor: Formularfelder disabled, „Neu generieren" bleibt verfügbar, Status-Badge „freigegeben".
- Post fällt aus der Modul-3-Queue (Status ist jetzt `leitfaden`).

## Technische Details

### Migration (Blocker 1)

`posts_status_check` DROP + ADD mit erweiterter Whitelist um `profil_review`. Restliche Werte unverändert.

### Edge Function `speaker-profile-decision` (Blocker 2)

- Payload: `{ profile_id, action: 'kuratieren' | 'freigeben' | 'aenderung', feedback?: string }`.
- Authentifiziert via JWT (`verify_jwt = false`, Prüfung in Code analog `generate-speaker-profile`).
- Autorisierung:
  - `kuratieren` → nur Admin (via `has_role`).
  - `freigeben` / `aenderung` → nur der Speaker, dessen `speakers.user_id = auth.uid()` mit dem Profil verknüpft ist (Join über `speaker_profiles.speaker_id`).
- Führt beide Updates mit Service-Role aus (atomar aus Client-Sicht, kein RLS-Blocker).
- Response: `{ ok: true, profile, post_status }` oder `{ error }` (immer 200, gemäß Projekt-Konvention).
- Kein RLS-Update auf `speaker_profiles` nötig — Schreibweg läuft komplett über die Function.
- `supabase/config.toml`: Eintrag `[functions.speaker-profile-decision] verify_jwt = false`.

### Frontend-Änderungen

1. `src/components/profil/ProfilEditor.tsx`
   - „Als kuratiert markieren" ruft Function statt direktem `.update()`.
   - Bei `profile.status === 'freigegeben'`: alle Formfelder disabled, „Speichern" ausgeblendet, „Neu generieren" bleibt.

2. `src/components/profil/ProfilReadonly.tsx` (neu)
   - Zeigt Kurzbio, Langbio, Positionierung, Zielgruppe, Chip-Listen (Themen, Kernaussagen, Hooks, kritische Punkte), Score, Notes.
   - Buttons „Profil freigeben" (direkt) und „Änderungen erbitten" (öffnet Textarea, dann Submit).
   - Beide Aktionen → `supabase.functions.invoke('speaker-profile-decision', …)`.

3. `src/pages/modules/Module3Profil.tsx`
   - Queue-Filter: `['redaktion_angefragt', 'in_bearbeitung', 'profil', 'profil_review']`.
   - `StatusBadge`: neuer Case `profil_review` → blau, Label „Zur Freigabe".
   - Kontext-Ansicht für Speaker: bei `post.status === 'profil_review'` und vorhandenem `profile` → `ProfilReadonly` rendern statt Platzhalter-Card.

4. `src/pages/MyPosts.tsx` (falls Interviews dort gelistet werden)
   - Badge „Zur Freigabe" + Deep-Link auf `/module/profil?post_id=…&speaker_id=…`.

## Nicht Teil dieses Schritts

- Sprechermappe / PDF-Export.
- Modul-4-Leitfaden-Generator selbst.
- E-Mail-Benachrichtigung bei Statuswechsel.

## Reihenfolge

1. Migration (`profil_review` in Constraint).
2. Edge Function `speaker-profile-decision` + `config.toml`.
3. Frontend (`ProfilEditor`-Anpassung, neue `ProfilReadonly`, `Module3Profil`-Queue, `MyPosts`-Badge).
4. Smoke-Test: Admin kuratiert → Speaker sieht Read-only → Freigabe → Post-Status `leitfaden`.
