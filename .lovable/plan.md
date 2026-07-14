# Kontext-Panel für Modul 4, 5 und 6

Ziel: Interviewer und Speaker können in M4, M5 und M6 jederzeit das freigegebene Sprecher-Profil und die Interview-Eckdaten einblenden, ohne das Modul zu verlassen.

## 1. Neue Komponente `ProfilContextView`

`src/components/profil/ProfilContextView.tsx` — neue read-only Komponente.
- Props: `profile: SpeakerProfile`, `role: "admin" | "speaker"`
- Rendert dieselben Profil-Felder wie `ProfilReadonly` (Kurzbio, Langbio, Positionierung, Zielgruppe, Themen, Kernaussagen, mediale Hooks, Expertise-Score) — **rein lesend**.
- **Kein** „Zur Freigabe"-Badge, **keine** Buttons, **kein** Aufruf von `speaker-profile-decision`.
- `ProfilReadonly` bleibt unverändert und weiter nur für Modul 3 zuständig.

## 2. Rollenlogik `kritische_punkte`

In `ProfilContextView` wird das Feld für Speaker per Conditional komplett ausgeblendet:
```tsx
{role === "admin" && <ChipRow label="Kritische Punkte" items={profile.kritische_punkte} />}
```
Alle anderen Profil-Felder sind für beide Rollen sichtbar.

## 3. Interview-Eckdaten — Feldherkunft

Faktencheck bestätigt: Die Migration hat die Interview-Felder von `speakers` nach `posts` verschoben. `src/components/context/InterviewContextView.tsx` zeigt:

| Anzeige | Quelle |
|---|---|
| Titel | `posts.interview_title` |
| Thema | `posts.interview_topic` |
| Produkt | `posts.product` |
| Marktdauer | `posts.product_market_since` |
| Bisherige Interviews | `posts.previous_interviews` |
| Kritische Stimmen | `posts.critical_voices` |
| Affiliate-Produkte | `speakers.top_affiliate_products`, gefiltert über `posts.selected_affiliate_indices` |

Sichtbar für Admin und Speaker.

## 4. `ContextSheet.tsx`

`src/components/context/ContextSheet.tsx`
- shadcn `Sheet` rechts, `sm:max-w-xl`, Trigger vom Modul-Header.
- Props: `postId: string`.
- Lädt parallel per `Promise.all`:
  - `posts` — benötigte Felder inkl. `speaker_id`
  - `speakers` — `first_name, last_name, top_affiliate_products`
  - `speaker_profiles` — **per `post_id`** (analog Modul 3):
    ```ts
    supabase.from("speaker_profiles")
      .select("*")
      .eq("post_id", postId)
      .eq("status", "freigegeben")
      .maybeSingle()
    ```
    Grund: `post_id` ist UNIQUE auf `speaker_profiles`; Abfrage per `speaker_id` würde bei Wiederholungsgästen ein Profil aus einem anderen Interview treffen.
- Tabs (`shadcn Tabs`): **Profil** | **Interview**.
- Rolle via `useAuth()`.
- Loading-Skeleton + Fehler-Fallback.
- Kein freigegebenes Profil vorhanden → Hinweis + Deep-Link `/module/profil?post_id=…` (Admin) bzw. Text „Profil noch nicht freigegeben" (Speaker).

## 5. Integration in Modul-Header

Trigger-Button (Ghost, `BookOpen`-Icon, Label „Kontext") in den Headerbereich von:
- `src/pages/modules/Module4Leitfaden.tsx`
- `src/pages/modules/Module5Vorgespraech.tsx`
- `src/pages/modules/Module6Aufzeichnung.tsx`

Position: rechts neben Rolle/Status-Anzeige, vor bestehenden Action-Buttons.

## Out of Scope

- Keine Änderungen an Datenmodell, Edge Functions oder RLS-Policies.
- Keine Änderung an `ProfilReadonly` (Modul 3 unverändert).
- Keine Änderung an M7.
