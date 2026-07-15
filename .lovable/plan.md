# M7 Live-Test-Plan

Ziel: Modul 7 (Autoren-Cockpit) im Preview end-to-end validieren — UI, Datenflüsse, ContextSheet-Tabs und AI-Kontextinjektion.

## Testumgebung

- Rolle: Admin (voller Zugriff auf alle Tabs und AI-Generierung)
- Testdatensatz: Ein bestehender Post mit `speaker_id`, idealerweise mit vorhandenem Speaker-Profil (M3), finalem Leitfaden (M4), Vorgesprächs-Notiz (M5) und Aufzeichnungs-Session (M6). Falls nicht vorhanden: kurz einen Testpfad durch M1→M6 anlegen.

## Testschritte

### 1. EditPost öffnen & Redundanz-Migration
- `/edit/:id` öffnen.
- Prüfen: `loadPost` verschiebt Top-Level `guest_image_url`/`guest_short_bio` einmalig nach `blocks.*` (Konsolenlog / Netzwerk-Update sichtbar).
- Erwartung: Kein Flackern, Blocks enthalten Guest-Info, Top-Level-Felder werden nicht mehr angezeigt.

### 2. ContextSheet-Lasche
- Lasche rechts sichtbar (vertikal, flush am Rand).
- Klick öffnet Panel non-modal, Lasche dockt an Panel-Kante.
- Klick auf Lasche schließt Panel wieder.

### 3. Alle 4 Tabs prüfen
- **Profil**: Speaker-Stammdaten, Website, Social, Foto, generiertes Profil, Kritische Punkte (nur Admin).
- **Interview**: Metadaten aus `posts` (Thema, Produkt, Marktdauer, bisherige Interviews, kritische Stimmen, Affiliate-Produkte als Objekt-safe Render).
- **Scans**: M2 Speaker-Scan + M7/Post-Scans mit AmpelBadge und deutschen Feldlabels.
- **Fragen**: Finaler Leitfaden aus `interview_guides`, Interviewer-Notiz aus `recording_sessions`, Termin und Video-Link.

### 4. AI-Generierung mit Kontext
- In `SourceDataEditor` „Blöcke generieren" auslösen.
- Netzwerk-Request an `generate-content` prüfen: `post_id` und `speaker_id` im Body.
- Edge-Function-Logs prüfen: Speaker-Profil, finaler Leitfaden, Compliance-Regeln und Banned-Words werden in den Prompt injiziert.
- Ausgabe qualitativ prüfen: Generierte Blöcke referenzieren Profildaten/Leitfaden-Themen und vermeiden Banned Words.

### 5. Navigation aus ContextSheet
- „Zu Modul 3 (Profil)"-Link öffnet `ProfilEditor` mit korrekter `speaker_id` (nicht Fallback).

### 6. Status-Flow im Cockpit
- Status-Dropdown zeigt nur aktive Werte der neuen Whitelist.
- Speichern eines Status ≥ `redaktion_angefragt` sperrt Speaker-Sicht (kurz mit Speaker-Login gegenchecken).

## Debugging-Werkzeuge

- Browser-Konsole und Netzwerk-Requests während jedes Schritts beobachten.
- Bei AI-Aufruf: Edge-Function-Logs von `generate-content` einsehen.
- Playwright optional für Screenshots der ContextSheet-Zustände.

## Deliverable

Kurzer Bericht pro Schritt: ✅ OK / ⚠️ Auffälligkeit / ❌ Bug + Screenshot bei UI-Problemen. Bugs werden anschließend als separate Fix-Runde eingeplant.
