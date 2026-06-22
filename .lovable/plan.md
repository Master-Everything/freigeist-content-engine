## Ziel

Speaker-Sidebar wird 1:1 wie die Admin-Sidebar aufgebaut — gleiche Optik, gleiche acht Workflow-Module, gleiche Badges. Speaker-spezifische Inhalte werden als Sub-Items unter den passenden Modulen einsortiert. Module ohne Speaker-Aktion bleiben sichtbar (Status "Geplant"), sind aber nicht klickbar bzw. zeigen eine schlichte Platzhalter-Seite.

## Neue Sidebar-Struktur (Speaker)

```
Übersicht
  • Dashboard                                  → /speaker

Workflow-Module
  1. Erfassung                       [Aktiv]
       • Profil                                → /module/erfassung
       • Neues Interview                       → /module/interview/neu
       • Meine Interviews                      → /module/interview-beitraege/mine
  2. Vorab-Scan                      [Geplant]
       • Eingereichte Interviews (gescannt)    → /module/vorab-scan/eingereicht
  3. Profil & Sprechermappe          [Geplant]
  4. Interview-Leitfaden             [Geplant]
  5. Vorgespräch                     [Geplant]
  6. Aufzeichnung / Live             [Geplant]
  7. Interview-Beiträge              [Geplant]
  8. News-Plattform                  [Geplant]
```

- Komponenten, Icons, Farben, Badges, Typografie identisch zur Admin-Sidebar (`AppSidebar.tsx`, `adminModules`).
- Module 3–8 sind reine Header-Einträge ohne Sub-Items — wie Admin, aber nicht navigierbar (Status "Geplant" greift auch optisch).
- Aktive Route wird hervorgehoben; Modul-Gruppe mit aktiver Route bleibt aufgeklappt.

## Routen-Mapping

Bestehend, keine Änderungen:
- `/speaker`, `/module/erfassung`, `/module/interview/neu`, `/module/interview-beitraege/mine`

Neu:
- `/module/vorab-scan/eingereicht` → schlichte Platzhalter-Seite "Sobald deine eingereichten Interviews gescannt wurden, erscheinen sie hier." (Stil wie `ModulePage`).

Admin-Routen (`/module/vorab-scan`, `/module/profil`, `/module/leitfaden`, …) bleiben unverändert und Admin-only.

## Verhalten Module 3–8 für Speaker

Klick führt zu einer gemeinsamen Speaker-Platzhalter-Ansicht ("Dieses Modul ist für dich noch in Vorbereitung."), die per `ModulePage`-Pattern aufgebaut wird. Konkrete Umsetzung: ein gemeinsamer Route-Eintrag `/speaker/modul/:num` mit einem kleinen Lookup auf Titel/Icon/Beschreibung. Die Sidebar-Links für Module 3–8 zeigen auf diese Route. Dadurch landen Speaker nicht versehentlich auf Admin-only-Pfaden.

## Änderungen im Detail

### 1. `src/components/AppSidebar.tsx`
- Gemeinsame Modul-Definition `workflowModules` extrahieren (bisheriges `adminModules`).
- Speaker-spezifische Erweiterung: pro Modul optional `items: { title, url }[]`. Für Speaker:
  - Modul 1 bekommt drei Sub-Items (Profil, Neues Interview, Meine Interviews).
  - Modul 2 bekommt ein Sub-Item (Eingereichte Interviews).
  - Modul 3–8 ohne Sub-Items.
- Speaker-Branch komplett ersetzen: gleicher Aufbau wie Admin-Branch, aber:
  - Header-Links zeigen für Speaker bei Modul 3–8 auf `/speaker/modul/<num>`.
  - Module mit Sub-Items werden via `Collapsible` aufgeklappt (Default: offen, wenn aktive Route enthalten).

### 2. `src/App.tsx`
- Neue Routen (kein `requiredRole="admin"`):
  - `/module/vorab-scan/eingereicht` → `SpeakerVorabScanEingereicht`
  - `/speaker/modul/:num` → `SpeakerModulePlaceholder`

### 3. Neue Datei `src/pages/modules/vorab-scan/Eingereicht.tsx`
- Nutzt `ModulePage`-Look, Icon `ScanSearch`, Hinweistext.

### 4. Neue Datei `src/pages/SpeakerModulePlaceholder.tsx`
- Liest `:num` aus URL, mappt auf Titel/Icon aus der gemeinsamen Modul-Definition, zeigt freundlichen "in Vorbereitung"-Text.

### 5. `src/pages/SpeakerDashboard.tsx`
- Unverändert. Karten bleiben, sie sind die Schnellzugriffe parallel zur neuen Sidebar.

## Designentscheidungen (für dich entschieden)

- **Modul-Header klappbar** mit `defaultOpen` für die Gruppe der aktuellen Route — gleiches Verhalten für Admin und Speaker.
- **Module 3–8 nicht ausgegraut**, sondern wie bei Admin mit Badge "Geplant" — visuell identisch.
- **Admin-Sidebar bleibt unverändert** (keine Sub-Items dort). Nur Speaker bekommt die Sub-Item-Erweiterung, weil Admin diese Pfade nicht braucht.

## Nicht im Scope

- Keine neuen Backend-/RLS-Änderungen.
- Keine Änderung an Inhalt/Logik bestehender Speaker-Seiten (Profil, Interview-Formular, Meine Beiträge).
- Keine Implementierung der eigentlichen Vorab-Scan-Funktionalität — nur Platzhalter.
- Keine Anpassung der Admin-Navigation.
