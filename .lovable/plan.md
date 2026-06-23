## Cloud-Wissensbasis seeden (Modul 2 Vorbereitung)

Ich habe die Drive-Verbindung geprüft — alle GEM-Quellen liegen im Ordner **Freigeist-GEM** und sind erreichbar. Plan in einem Rutsch.

### Schritt 1 — Drive-Dateien parsen

Diese 8 Dateien werden gezogen und mit `document--parse_document` in Text gewandelt:

| Quelle | Ziel-Tabelle |
|---|---|
| `01_FGKurator-GEM-Masterprompt.pdf` | `knowledge_prompts` (key: `fg_kurator`) + `knowledge_compliance_rules` (Phase-B-Fragen) |
| `02_FG-Speaker-Auditor-GEM-Masterprompt.pdf` | `knowledge_prompts` (key: `fg_speaker_auditor`) |
| `BERT-soularchitekt-Master.pdf` | `knowledge_prompts` (key: `bert_soularchitekt`) |
| `Liste der BannedWords-BERT.docx` | `knowledge_banned_words` |
| `FG-Speakermail.docx` | `knowledge_email_templates` (key: `speakermail`) |
| `FG InterviewKompass.docx` | `knowledge_moderation_tips` (source: `InterviewKompass`) |
| `FG-Lösungen bei Verstößen.docx` | `knowledge_moderation_tips` (source: `Loesungen-Verstoesse`) |
| `FG-Werberichtlinien, Affiliate-Links, Health Claims.docx` | ergänzt `legal_basis`-Texte in `compliance_rules` |

`Compliance-Checker-Masterprompt.docx` und `FG-Rechtliche Grundlagen für Video-Prüfungen.docx` werden mitgelesen als Kontext, aber nicht eigenständig geseedet — die fließen in die Master-Prompts bzw. legal_basis ein.

### Schritt 2 — Seed-Migration

Eine SQL-Migration mit allen `INSERT`s, idempotent via `ON CONFLICT (code/term/key) DO UPDATE`. Inhalte 1:1 aus den Quellen, deutsche Originale.

Ungefähre Mengen (Schätzung auf Basis der GEM-Struktur):
- `knowledge_compliance_rules`: ~26 Einträge (A1–A5, C1–C3, E1–E2, G1–G9, F1–F7)
- `knowledge_prompts`: 3 Einträge
- `knowledge_banned_words`: ~50–150 (kommt auf die Liste an)
- `knowledge_email_templates`: 1 Eintrag
- `knowledge_moderation_tips`: ~15–30 Einträge

### Schritt 3 — Read-only Admin-View

Neue Route `/admin/wissensbasis` (nur für Rolle `admin` sichtbar — `ProtectedRoute` + `has_role`-Check):
- 5 Tabs (eine pro Tabelle)
- Pro Tab eine simple shadcn-`Table` mit Suche/Filter
- Keine Edit-/Delete-Buttons — reines Durchscrollen für deine Qualitätskontrolle
- Sidebar-Link in `AppSidebar.tsx` nur bei Admin-Rolle

### Schritt 4 — Sanity-Check im Sidebar-Footer

Für Admin-Rolle: kleiner Hinweis „Wissensbasis: X Regeln · Y Wörter · Z Prompts" — live aus DB.

### Was bewusst NICHT in diesem Schritt drin ist
- Modul 2 selbst (UI + Edge Function `vorab-scan`) — kommt direkt danach in eigener Runde
- Edit-/CRUD-Masken für die Wissensbasis (später bei Bedarf)

### Reihenfolge der Umsetzung
1. Drive-Dateien parsen (Edge-/Sandbox-seitig, kein User-Eingriff)
2. Daten auf das DB-Schema mappen, SQL generieren
3. Migration einreichen (du bestätigst sie)
4. Admin-View + Sidebar-Footer-Hinweis bauen
5. Du gehst die Daten durch und meldest Korrekturwünsche — danach starten wir Modul 2

### Offene Frage
Soll der Admin-View auch **Spalten zum Markieren** (`active` toggle, kleines Edit-Icon) bekommen — oder strikt read-only? Empfehlung: **strikt read-only**, Edits jetzt direkt per Migration / später dediziertes CRUD. Spart Zeit und vermeidet versehentliches Verändern der Wissensbasis.
