## Ziel

Saubere Trennung von Admin- und Speaker-Bereich in einer gemeinsamen App-Shell. Speaker sehen nur, was sie brauchen (eigenes Profil + eigene Beiträge read-only). Admins behalten den vollen Workflow.

## 1. Route-Guard mit Rollenprüfung

`ProtectedRoute` bekommt ein optionales `requiredRole`-Prop:

```tsx
<ProtectedRoute requiredRole="admin"> ... </ProtectedRoute>
```

- Nicht eingeloggt → Redirect `/auth`.
- Eingeloggt, aber Rolle reicht nicht → Redirect auf die Startseite der eigenen Rolle (Speaker → `/speaker`, Admin → `/`).
- Rolle ok → Inhalt rendern.

Sicherheit bleibt serverseitig durch RLS gewahrt; der Guard ist reine UX.

## 2. Routenstruktur

Gemeinsame Shell (`AppLayout`), aber Routen werden nach Rolle gegated:

```text
/auth                                  public
/                                      Admin  → Workflow-Dashboard (heute)
/speaker                               Speaker → schlankes Speaker-Dashboard (neu)
/module/erfassung                      Speaker + Admin
/module/erfassung/danke                Speaker + Admin
/module/vorab-scan ... /module/news    Admin only
/module/interview-beitraege            Admin (Liste, Edit, Preview)
/module/interview-beitraege/mine       Speaker (read-only Liste eigener Beiträge, neu)
/module/interview-beitraege/view/:id   Speaker (read-only Preview, neu)
/tech-stack                            Admin only
```

Nach Login Redirect je nach Rolle: Admin → `/`, Speaker → `/speaker`.

## 3. Speaker-Dashboard (`/speaker`, neu)

Schlanke Seite mit:
- Begrüßung + Status-Karte „Mein Profil" (ausgefüllt / unvollständig) mit Button „Profil bearbeiten" → `/module/erfassung`.
- Karte „Meine Interview-Beiträge" mit Liste eigener Posts (RLS filtert ohnehin auf `speaker_id = auth.uid()`-Logik). Klick → `/module/interview-beitraege/view/:id` (read-only).
- Kein 8-Modul-Workflow, keine Filter, keine „Neuer Post"-Aktion.

## 4. Read-only Beitrags-Ansicht für Speaker

Neue Route `/module/interview-beitraege/view/:id`, die `PostPreview` nutzt — keine Edit-Buttons, kein Export. RLS sorgt dafür, dass Speaker nur eigene Posts laden können.

## 5. Sidebar rollenbasiert

`AppSidebar` rendert je nach `role` aus `useAuth()`:

- **Admin:** komplette 8-Module-Navigation wie heute + „Tech-Stack".
- **Speaker:** zwei Einträge — „Mein Profil" (`/module/erfassung`) und „Meine Beiträge" (`/module/interview-beitraege/mine`). Plus „Übersicht" → `/speaker`.

Solange `role` noch lädt, Skelett/leere Sidebar zeigen (kein Flackern).

## 6. Login-Redirect

In `Auth.tsx` nach erfolgreichem Sign-in einmalig Rolle laden und entsprechend redirecten (`/` für Admin, `/speaker` für Speaker). Fallback: `/speaker`.

## 7. Was NICHT geändert wird

- Keine Änderungen an RLS-Policies, `user_roles`, `has_role()` — das Fundament steht.
- Kein neues Layout, keine neuen Provider.
- Keine Schemaänderungen.

## Technische Details

- `AuthContext` liefert bereits `role: "admin" | "speaker" | null` — wird in Guard und Sidebar konsumiert.
- Neue Dateien:
  - `src/pages/SpeakerDashboard.tsx`
  - `src/pages/modules/interview-beitraege/MyPosts.tsx` (oder direkt in `Index.tsx` einen `mine`-Modus)
  - `src/pages/modules/interview-beitraege/ViewPost.tsx` (read-only Wrapper um `PostPreview`)
- Geänderte Dateien:
  - `src/components/ProtectedRoute.tsx` (Prop `requiredRole`)
  - `src/App.tsx` (Routen-Gating, neue Routen)
  - `src/components/AppSidebar.tsx` (rollenbasierte Items)
  - `src/pages/Auth.tsx` (rollenbasierter Redirect)

## Testfall mit deinen Accounts

- Login `ai@master-everything.com` (Admin) → landet auf `/`, sieht volle Sidebar und alle Module.
- Login `thomas@master-everything.com` (Speaker) → landet auf `/speaker`, sieht nur Profil + eigene Beiträge, kann Modul 2–8 nicht aufrufen (Redirect zurück auf `/speaker`).
