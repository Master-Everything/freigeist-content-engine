## Ziel
Admin kann ein `kuratiert`es Speaker-Profil selbst freigeben, damit `posts.status = 'leitfaden'` wird und der Post in Modul 4 erscheint — ohne den regulären Speaker-Freigabe-Weg zu ersetzen.

## Claude-Feedback-Validierung
- **Audit-Eintrag nur wenn `isAdmin && !isOwner`** → übernommen. Fällt der Admin zufällig auch mit dem Speaker-Owner zusammen, ist es eine reguläre Selbstfreigabe, keine „im Auftrag"-Aktion.
- `postStatus`-Prop im `ProfilEditor` ist schon da → keine neue Verdrahtung nötig, bestätigt.
- Button-Sichtbarkeit über den bestehenden `profile.status !== "freigegeben"`-Wrapper reicht → bestätigt.
- Admin-E-Mail aus `userData.user.email` verfügbar → keine Extra-Query.
- Kein Regex-Kollisionsrisiko mit `[Speaker-Feedback ...]` → Präfix `[Admin-Freigabe · ...]` bleibt reiner Notizen-Text (ok für Audit).

## Umsetzung

### 1. `supabase/functions/speaker-profile-decision/index.ts`
- Autorisierung für `freigeben` erweitern: `isOwner || isAdmin` (statt nur `isOwner`).
- Falls **`isAdmin && !isOwner`** ist:
  - Vor dem `speaker_profiles`-Update `notes` um Audit-Zeile ergänzen:
    `\n\n[Admin-Freigabe · <de-DE-timestamp> · <admin-email>] Profil im Auftrag freigegeben.`
  - `profileUpdate.notes` mitschreiben.
- Sonst (Speaker-Owner) unverändert: nur `status: 'freigegeben'`.
- Wirkung ansonsten identisch: `posts.status = 'leitfaden'`.
- `aenderung` bleibt Speaker-only (kein Admin-Pfad).

### 2. `src/components/profil/ProfilEditor.tsx`
- `useAuth()` einbinden, `role` lesen.
- Neue Handler-Funktion `adminFreigeben()`:
  - Ruft `supabase.functions.invoke("speaker-profile-decision", { body: { profile_id, action: "freigeben" } })`.
  - Toast: „Profil im Auftrag freigegeben".
- Neuer Button neben „Speichern" / „Als kuratiert markieren":
  - **Sichtbar nur wenn** `role === "admin"` UND `profile.status` in (`entwurf`, `kuratiert`).
  - Label: „Für Speaker freigeben (Shortcut)"
  - Variante: `outline`, Icon `ShieldCheck`.
  - `onClick` öffnet `window.confirm("Damit überspringst du die Speaker-Freigabe. Der Post geht direkt zu Modul 4. Fortfahren?")`; bei Bestätigung → `adminFreigeben()`.

### 3. Kein Migration-/RLS-/Sidebar-Change nötig
- Nutzt bestehende `leitfaden`-Transition und `posts_status_check`.
- Function läuft mit Service-Role, RLS bleibt unangetastet.

## Nach dem Build
Für „Duale Intelligenz" öffnest du Modul 3 → Editor → „Für Speaker freigeben (Shortcut)" → bestätigen. Post erscheint in Modul 4, du kannst „Leitfaden generieren".
