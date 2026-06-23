## Cloud-Wissensbasis + Seed FGKurator Phase B

### Schritt 1 — Migration: 5 neue Tabellen

Alle Tabellen in `public`, mit RLS, GRANTs, `created_at`/`updated_at` + Update-Trigger.

**`knowledge_compliance_rules`** — Prüf-Fragen
- `code` (text, unique) — z.B. `G1`, `F3`, `A1`
- `industry` (text) — `generic` | `health` | `finance` | …
- `question_text` (text)
- `risk_response_text` (text) — Standard-Reaktion bei Risiko
- `legal_basis` (text) — z.B. `HWG §3`, `UWG §5`
- `severity` (text) — `info` | `warn` | `block`
- `active` (bool, default true)
- `version` (int, default 1)

**`knowledge_banned_words`**
- `term` (text, unique)
- `category` (text) — `banned` | `emotional_code` | `health_claim` | `roi_promise`
- `replacement_suggestion` (text, nullable)
- `legal_basis` (text, nullable)
- `severity` (text)
- `active` (bool)

**`knowledge_prompts`** — Master-Prompts
- `key` (text, unique) — `fg_kurator` | `fg_speaker_auditor` | `bert_soularchitekt`
- `title` (text)
- `system_prompt` (text)
- `model` (text, default `google/gemini-2.5-flash`)
- `version` (int)
- `active` (bool)

**`knowledge_email_templates`**
- `key` (text, unique) — `speakermail` | `onboarding`
- `subject` (text)
- `body_markdown` (text)
- `variables` (jsonb) — Platzhalter-Doku
- `active` (bool)

**`knowledge_moderation_tips`**
- `topic` (text) — z.B. `risiko_heilversprechen`
- `industry` (text, nullable)
- `trigger_text` (text) — wann anwenden
- `tip_text` (text) — was tun
- `source` (text) — `InterviewKompass` | `Loesungen-Verstoesse`
- `active` (bool)

### Schritt 2 — RLS-Policies

Lese-Zugriff für eingeloggte Speaker (sie brauchen die Regeln im Frontend für Modul 2/4/7):
```
GRANT SELECT ON public.knowledge_* TO authenticated;
GRANT ALL    ON public.knowledge_* TO service_role;

-- Lesen: jede:r authentifizierte Nutzer:in (nur active=true)
CREATE POLICY "auth read active" ... USING (active = true);

-- Schreiben: nur admin
CREATE POLICY "admin write" ... USING (has_role(auth.uid(), 'admin'))
                                WITH CHECK (has_role(auth.uid(), 'admin'));
```

### Schritt 3 — Seed FGKurator Phase B

Initial-Inserts in `knowledge_compliance_rules`:
- **Generisch (10):** A1–A5, C1–C3, E1–E2
- **Gesundheit (9):** G1–G9 (HWG-relevant — Heilversprechen, Indikationsbezug, Vorher/Nachher, etc.)
- **Finanzen (7):** F1–F7 (BaFin, UWG — Renditeversprechen, Garantien, Vergleichswerbung)

Pro Eintrag: Fragetext + `risk_response_text` + `legal_basis`, übernommen 1:1 aus dem FGKurator-GEM.

Zusätzlich Seed in `knowledge_prompts`: die drei Master-Prompts (FGKurator, Speaker-Auditor, BERT) im Volltext aus den GEM-Dateien.

Optional sofort mit-geseedet (falls gewünscht — siehe Frage unten):
- `knowledge_banned_words` aus `BannedWords-BERT.docx`
- `knowledge_email_templates` aus Speakermail + Onboarding-Mail
- `knowledge_moderation_tips` aus InterviewKompass + Lösungen-bei-Verstößen

### Schritt 4 — Admin-Hinweis im UI (klein)

Noch kein vollständiges Admin-CRUD. Stattdessen:
- Kurzer Hinweis im Sidebar-Footer für Admin-Rolle: „Wissensbasis: X Regeln · Y Wörter · Z Prompts" — als Sanity-Check, dass die Daten da sind.

Echtes Admin-UI zum Pflegen der Tabellen kommt später, wenn wir Modul 2 bauen — sonst pflegen wir leere Masken.

### Was bewusst NICHT in diesem Schritt drin ist
- Modul 2 UI / Ampel-Logik
- Edge Functions (kommen mit Modul 2 + 4)
- Frontend-Hooks zum Abfragen der Tabellen (kommen on-demand mit jedem Modul)

### Offene Frage vor Umsetzung
Sollen wir **alle 5 Tabellen sofort komplett seeden** (Phase-B-Fragen + Master-Prompts + BannedWords + Mails + Moderation-Tips) — oder erstmal nur die zwei kritischen (`compliance_rules` + `prompts`) und den Rest dann beim Bau von Modul 2/7?

Empfehlung: **alles auf einmal seeden** — wir haben die GEM-Daten frisch geparst, ein zweites Mal aufwendig nachladen wäre Doppelarbeit.
