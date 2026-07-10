## Ziel
Verwirrung auflösen: Modul 3 für Speaker aktivieren (gleiche Ansicht wie Admin), Sidebar-Status auf „Umsetzung" setzen, und Modul 2 Interview-Tab prüfen (Violette Zeile + „Bei Redaktion einreichen" + „Profil anlegen" existieren bereits im Code — vermutlich sichtbar sobald ein Post im richtigen Status ist).

## Änderungen

### 1. Modul 3 auch für Speaker (Antwort 1a)
- **`src/App.tsx`**: Route `/speaker/modul/3` entfernen bzw. auf `Module3Profil` mappen (statt `SpeakerModulePlaceholder`). Alternativ: Sidebar-Link für Speaker auf `/module/profil` zeigen, damit die gleiche Komponente greift.
- **`src/pages/modules/Module3Profil.tsx`**: Rolle-agnostisch — Kontext-Karten (Interview + Speaker) werden angezeigt, sobald `post_id`/`speaker_id` in URL sind. Ohne Params: gleicher generischer Platzhalter wie Admin. Keine Rolle-Prüfung nötig, RLS erlaubt Speaker ihre eigenen Posts/Speakers.
- **`src/components/AppSidebar.tsx`**: In `speakerModules` Modul 3 auf `/module/profil` umbiegen.

### 2. Sidebar-Status Modul 3 → „Umsetzung" (Antwort 2)
- **`src/components/AppSidebar.tsx`**: In `adminModules` und `speakerModules` Modul 3 von `status: "planned"` auf `status: "in-progress"` setzen.

### 3. Modul 2 · Tab „Interviews" — Verifikation (Antwort 3)
Die Features sind bereits im Code (`Module2VorabScan.tsx`):
- Violette Zeile bei `redaktion_angefragt` ✅ (Z. 327)
- Badge „Redaktion angefragt" ✅ (Z. 345)
- Button „Bei Redaktion einreichen" bei `scan_done` ✅ (Z. 357–370)
- Button „Profil anlegen" bei `redaktion_angefragt` ✅ (Z. 371 ff.)

Wenn du diese nicht siehst, liegt es am Post-Status. Nach dem Test-Klick auf „Profil anlegen" wurde der Status auf `in_bearbeitung` gesetzt → violette Zeile weg, Button weg (korrekt).

**Zur Sichtprüfung**: Ich setze den Test-Post „Duale Intelligenz…" per Migration einmalig zurück auf `redaktion_angefragt`, damit du beide Buttons sofort siehst. (Nur Daten-Reset, kein Code-Change.)

## Nicht betroffen
- Renderer, Push-to-Hub, Wissensbasis, `MyPosts` bleiben unverändert.
- Modul 3 UI bleibt der bestehende Kontext-View — kein neuer Funktionsumfang.
