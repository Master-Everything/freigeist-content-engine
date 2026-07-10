## Modul 3 – Übersichtsliste bei Direktaufruf

Aktuell rendert `/module/profil` ohne Query-Parameter nur den generischen `ModulePage`-Platzhalter — deshalb sehen Speaker und Admin „nichts". Wir bauen die zuvor mit Option (a) beschlossene Anfrage-Liste.

### Verhalten

**Admin (`/module/profil` ohne Params)**
- Liste aller Posts mit Status `redaktion_angefragt` oder `in_bearbeitung`.
- Spalten: Interview-Titel · Speaker · Post-Status (Badge, violett/orange analog Modul 2) · Aktion.
- Aktion:
  - `redaktion_angefragt` → Button **„Profil anlegen"** (setzt Status `in_bearbeitung`, navigiert `/module/profil?post_id=…&speaker_id=…`).
  - `in_bearbeitung` → Button **„Öffnen"** (navigiert mit Params, kein Status-Update).
- Leerer Zustand: Hinweistext „Aktuell keine offenen Anfragen".

**Speaker (`/module/profil` ohne Params)**
- Liste der eigenen Posts (`speakers.user_id = auth.uid()`) mit Status `redaktion_angefragt` oder `in_bearbeitung`.
- Spalten: Interview-Titel · Post-Status · Hinweis („Wartet auf Redaktion" / „Redaktion in Arbeit").
- Keine Aktions-Buttons (Speaker startet keinen Profilprozess).
- Leerer Zustand: „Du hast aktuell kein Interview in der Redaktions-Phase."

**Mit Params (`?post_id=…&speaker_id=…`)** – unverändert (Kontext-Karten bleiben wie gebaut).

### Umsetzung

- `src/pages/modules/Module3Profil.tsx`
  - Wenn `postId || speakerId` vorhanden → bestehende Kontext-Ansicht.
  - Sonst: Rolle aus `useAuth()` lesen, entsprechende Query auf `posts` + Join `speakers(first_name,last_name,user_id)`.
  - Rendern in `Card`+`Table` (shadcn, gleiches Look-&-Feel wie Modul 2 Interview-Tab).
  - `Profil anlegen`-Handler identisch zur Version in `Module2VorabScan.tsx` (Update + `navigate`).

Kein Datenbank-, Route- oder Sidebar-Change nötig.