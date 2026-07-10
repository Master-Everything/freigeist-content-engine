## Nichts zu bauen — Test-Anleitung

Die Änderungen aus dem letzten Turn sind bereits im Code. Du warst nur als Speaker eingeloggt (`/speaker/modul/3`), deshalb waren sie nicht sichtbar.

### So testest du als Admin

1. Rechts oben ausloggen und mit einem Admin-Account neu einloggen.
2. `/module/vorab-scan` öffnen → Tab **„Interviews"** → Zeilen mit Status `redaktion_angefragt` sind violett hervorgehoben; Button **„Profil anlegen"** sichtbar.
3. Klick auf den Button → Post-Status wird auf `in_bearbeitung` gesetzt, Navigation zu `/module/profil?post_id=…&speaker_id=…`.
4. Modul 3 zeigt dann Interview- und Speaker-Kontext oben an.

Falls kein Interview auf `redaktion_angefragt` steht: vorher als Speaker in „Meine Interviews" auf **„Bei Redaktion einreichen"** klicken (Voraussetzung: Interview- und Speaker-Scan-Verdicts nicht rot).

Sag Bescheid, sobald du getestet hast — oder wenn du magst, gebe ich deinem User zusätzlich die Admin-Rolle, damit du zwischen den Sichten wechseln kannst.