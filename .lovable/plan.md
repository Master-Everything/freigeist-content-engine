# Plan: Freigeist Content Engine – Workflow-Dashboard

## Ziel

Ein neues Top-Level-Dashboard mit Sidebar-Navigation, das die 8 Workflow-Module der Freigeist Content Engine abbildet. Modul 7 (Interview-Beiträge) ist bereits gebaut und wird angedockt; die übrigen 7 Module bekommen Platzhalterseiten mit Deinen Modulbeschreibungen.

## Routen-Struktur

```text
/                              → Dashboard-Übersicht (zentrale Liste Gäste/Interviews)
/module/erfassung              → Modul 1: Erfassung Interviewgast
/module/vorab-scan             → Modul 2: Vorab-Scan
/module/profil                 → Modul 3: Profil & Sprechermappe
/module/leitfaden              → Modul 4: Interview-Leitfaden
/module/vorgespraech           → Modul 5: Vorgespräch
/module/aufzeichnung           → Modul 6: Aufzeichnung / Live
/module/interview-beitraege    → Modul 7: bestehende Beitragsverwaltung (Liste)
/module/interview-beitraege/new
/module/interview-beitraege/edit/:id
/module/interview-beitraege/preview/:id
/tech-stack                    → bleibt
```

Die bisherige Startseite (`Index.tsx`, Beiträge-Liste) wandert nach `/module/interview-beitraege`. Alle internen Navigationsziele (`/new`, `/edit/:id`, `/preview/:id`) werden entsprechend nachgezogen.

## App-Shell mit Sidebar

Neues Layout-Component `AppLayout.tsx` mit `SidebarProvider`:

- Linke `Sidebar` (`collapsible="icon"`) mit allen 8 Modulen als `NavLink`-Items, jedes mit Lucide-Icon und Statusbadge ("Aktiv" für Modul 7, "Geplant" für die anderen).
- Header oben mit `SidebarTrigger`, Titel "Freigeist Content Engine" und `ThemeToggle`.
- Hauptbereich rendert `<Outlet />` für die jeweilige Route.

Sidebar-Items (Reihenfolge = Workflow):


| #   | Titel                  | Icon           | Status  |
| --- | ---------------------- | -------------- | ------- |
| 1   | Erfassung              | ClipboardList  | Geplant |
| 2   | Vorab-Scan             | ScanSearch     | Geplant |
| 3   | Profil & Sprechermappe | UserCheck      | Geplant |
| 4   | Interview-Leitfaden    | BookOpen       | Geplant |
| 5   | Vorgespräch            | MessagesSquare | Geplant |
| 6   | Aufzeichnung / Live    | Video          | Geplant |
| 7   | Interview-Beiträge     | FileText       | Aktiv   |
| 8   | News-Plattform         | Newspaper      | Geplant |


## Dashboard-Startseite (`/`)

Neue `DashboardHome.tsx`:

- Kurzer Header "Workflow-Übersicht".
- Workflow-Strip: 8 nummerierte Modul-Kacheln in Reihe (klickbar zur jeweiligen Modulseite), aktives Modul visuell hervorgehoben.
- Darunter zentrale, filterbare Liste **aller Interviewgäste / Interviews** mit Spalten: Gast, Interview-Titel, aktueller Workflow-Schritt, Status, zuletzt geändert. Vorerst gespeist aus `posts` (jeder Post entspricht einem Interview); der Workflow-Schritt wird aus `status` abgeleitet (`erfassung` → Schritt 1, `draft`/`in_progress` → Schritt 7, `exported` → Schritt 8). Filter: Modul/Schritt + Status + Suche.
- Diese Liste löst die bisherige Startseiten-Liste konzeptionell auf höherer Ebene ab; die modul-spezifische Liste bleibt zusätzlich unter `/module/interview-beitraege` erhalten.

## Modul-Platzhalterseiten

Eine wiederverwendbare `ModulePage.tsx`-Komponente, die per Props Titel, Icon, Status-Badge, Modul-Nummer und Beschreibungstext erhält. Inhalt jeder Platzhalterseite:

- Großer Header mit Modulnummer + Titel + "Coming soon"-Badge.
- Card mit Deiner originalen Modulbeschreibung als formatierter Text.
- Hinweisbox: "Funktionalität folgt. Vorlagen und Prompts werden bei der Entwicklung dieses Moduls eingebunden."

Sieben dünne Wrapper-Komponenten (`Module1Erfassung.tsx` … `Module8NewsPlattform.tsx`) reichen Inhalte an `ModulePage` durch. Modulbeschreibungen werden 1:1 aus Deinem Prompt übernommen.

## Modul 7 – Anbindung

- `Index.tsx` wird umbenannt zu `InterviewPostsList.tsx` und unter `/module/interview-beitraege` gemountet (innerhalb `AppLayout`).
- Header der bestehenden Seite wird vereinfacht (Sidebar/ThemeToggle liegen jetzt im Layout, lokaler Header entfällt bzw. wird auf Modul-Header reduziert).
- "Neuer Beitrag"-Button zeigt auf `/module/interview-beitraege/new`.
- `NewPost`, `EditPost`, `PreviewPost` werden auf neue Pfade umgezogen; alle `navigate(...)`-Aufrufe innerhalb dieser Dateien werden angepasst.
- `TechStack`-Link wandert in die Sidebar als Footer-Eintrag.

## Was NICHT Teil dieses Plans ist

- Keine Schema-Änderungen. `guests`-Tabelle wird erst bei Modul 1 angelegt.
- Keine Funktionalität in Modulen 1–6 und 8.
- Keine Anbindung an die externe News-Plattform.
- Keine Änderungen an bestehenden Edge Functions oder am Block-Editor.

## Technische Details

- `react-router-dom`: verschachtelte Routen mit `<Route element={<AppLayout />}>` als Parent für alle Modul-Routen; `/tech-stack` und 404 bleiben außerhalb.
- Sidebar nutzt vorhandene shadcn-Komponenten (`src/components/ui/sidebar.tsx`).
- Aktive Route via `NavLink` + `isActive`.
- Statusbadges nutzen vorhandene `Badge`-Varianten / Tailwind Tokens (kein neues CSS nötig).
- Dark Theme bleibt Default, Primary `#2A809B` unverändert.

## Datei-Änderungen (Übersicht)

Neu:

- `src/layouts/AppLayout.tsx`
- `src/components/AppSidebar.tsx`
- `src/pages/DashboardHome.tsx`
- `src/pages/modules/ModulePage.tsx`
- `src/pages/modules/Module1Erfassung.tsx` … `Module8NewsPlattform.tsx` (außer 7)
- `src/pages/modules/Module7InterviewPosts.tsx` (Wrapper, der bestehende Liste rendert)

Geändert:

- `src/App.tsx` – Routen-Baum mit Layout-Wrapping und neuen Pfaden
- `src/pages/Index.tsx` – wird zur Modul-7-Liste, Header reduziert, `navigate`-Pfade angepasst
- `src/pages/NewPost.tsx`, `EditPost.tsx`, `PreviewPost.tsx` – `navigate`-Pfade an neue URLs angepasst

## Offene Punkte für später

- Mapping `posts.status` ↔ Workflow-Schritt verfeinern, sobald Module 1–6 existieren (vermutlich neues Feld `workflow_step` oder eigene `guests`-Tabelle mit Schritt-Verfolgung).
- News-Plattform-Anbindung (Modul 8) braucht später Verbindungsdetails zum Ziel-Lovable-Projekt.