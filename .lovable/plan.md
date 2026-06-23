## GEM-Mapping — Arbeitsvorlage für die Modul-Umsetzung

Drive-Ordner: https://drive.google.com/drive/folders/1FqFI6mmNJqSlPSUhOFoRhnon-tv1phdW

### Drei GEMs (Master-Prompts)
- **01_FGKurator** — Datenerhebung (Phase A) + branchenspezifischer Compliance-Check (Phase B: Gesundheit G1–G9, Finanzen F1–F7, generisch A1–A5/C1–C3/E1–E2). Output: Sprecher-Datenblatt + Analyse-Protokoll. Variablen `[X]=Branche`, `[Y]=Funktion` steuern Phase B.
- **02_FG-Speaker-Auditor** — Input: Datenblatt + Analyse-Protokoll + Wunschdauer (30/60/120 Min). Live-Recherche (Reputation, Marktumfeld). Output: Interview-Skript in 4 gleich großen Zeitblöcken (A Kompetenz-Transfer / B Status Quo / C Gamechanger / D Lösung) mit Compliance-Injektion (Rollen-Offenlegung, MStV, Trennungsgebot, kritische Rückfragen).
- **BERT-soularchitekt** — Compliance-/Sprach-Check (Banned Words, emotionale Codes, Heilversprechen, Renditeversprechen).

### Wissensbasis-Dokumente
- `FG-InterviewKompass.docx` — Moderationsleitfaden, Risiko-Reaktionen, „Rechtsschutz vor Reichweite"
- `FG-Loesungen-bei-Verstoessen.docx` — Eingriffslogik bei Live-Verstößen
- `FG-Rechtliche-Grundlagen.docx`, `FG-Werberichtlinien.docx` — HWG, UWG, MStV, BaFin, Affiliate, Health Claims
- `BannedWords-BERT.docx` — Wortliste + emotionale Manipulationsmuster
- `Ablaufprotokoll-Speaker-Onboarding.docx` — End-to-End-Workflow
- `Videobearbeitung-Verstoesse.docx` — Post-Production-Korrekturen
- `Speakermail.docx`, `Mail-Speaker-Onboarding.docx` — E-Mail-Templates
- Speaker-WIKI-Beispiele (Kevin Meyer, Jörg Schäfer) — Profilformat
- `Freigeist-BOT-Texte/*` — produktspezifische Beispiel-Datensätze

### Mapping pro Modul

**Modul 1 — Erfassung**  *(Quelle: FGKurator Phase A + Speakermail + Speaker-WIKI)*
- Felder: Name/Firma, Funktion (enum), Branche (enum), Webauftritt, Kernthema, Produkt/Angebot, Monetarisierung, Sprecher-Kompetenz/Referenzen, Reputation
- `function_type` & `industry` als enums → steuern Modul 2
- Begrüßungstext „Willkommen in der Arena der Freigeister …" als optionaler Onboarding-Hero
- `speakers`-Schema ergänzen: `function_type`, `industry`, `monetization_model`, `reputation_links`

**Modul 2 — Vorab-Scan**  *(Quelle: FGKurator Phase B + BannedWords + Werberichtlinien)*
- Frageset als JSON in `knowledge_compliance_rules`: generisch A1–A5/C1–C3/E1–E2, Gesundheit G1–G9, Finanzen F1–F7. Pro Frage: `text`, `risk_response_text`, `legal_basis`
- Routing nach `industry`/`function` serverseitig
- LLM-Call (Lovable AI Gateway) gegen Profil + Interview: BannedWords-Hit + Heilversprechen-/Rendite-Klassifikation → Analyse-Protokoll
- UI: Liste eingereichter Interviews mit Ampel grün/gelb/rot + Detailansicht je Block

**Modul 3 — Profil & Sprechermappe**  *(Quelle: Datenblatt-Output + Speaker-WIKI)*
- Konsolidiertes Profil aus M1-Daten + M2-Findings
- Sprechermappen-Export PDF/HTML, Zoho-Signatur (Platzhalter), Freigabe-Gate für Module 4–8

**Modul 4 — Interview-Leitfaden**  *(Quelle: FG-Speaker-Auditor Master-Prompt — Kernstück)*
- Fix 4-Block-Struktur: A Kompetenz / B Status Quo / C Gamechanger / D Lösung
- Zeit-Logik 30/60/120 Min → 7,5 / 15 / 30 Min pro Block + Detailgrad-Anpassung
- Edge Function `generate-interview-script`: System-Prompt = Speaker-Auditor, Kontext = Profil (M3) + Findings (M2) + InterviewKompass-Snippet
- Compliance-Injektion: Rollen-Offenlegung, MStV-Hinweise, Trennungsgebot, kritische Rückfragen

**Modul 5 — Vorgespräch**  *(Quelle: InterviewKompass + Lösungen-bei-Verstoessen)*
- Moderator-Checkliste + Wenn-Dann-Cheat-Sheet
- Transkription speist M4 als Erkenntnis-Update zurück

**Modul 6 — Aufzeichnung / Live**  *(Quelle: Speaker-Auditor Regieanweisungen + Einblendungen-Logo)*
- Sendeplan mit Block-Timer, Compliance-Reminder, Pflicht-Einblendungen, Notfall-Kontrollfragen

**Modul 7 — Interview-Beiträge**  *(Quelle: BERT + BannedWords + Videobearbeitung-Verstoesse + Werberichtlinien)*
- Nach-Aufnahme-Scan: Transkript gegen BannedWords, emotionale Codes, Health Claims, Renditeversprechen
- Findings mit Zeitstempel → Vorschläge: nachvertonen / rausschneiden / Einblendung / Disclaimer-Karte
- Block-Editor bekommt Compliance-Tab mit Live-Score

**Modul 8 — News-Plattform**
- Standardisiertes Übergabeformat mit Compliance-Markern als strukturierte Felder
- Aus GEMs inhaltlich nichts Neues (GEMs enden vor M8)

### Querschnitt: Wissensbasis in Cloud
Versionierte Tabellen, Admin-Schreibrecht, eingeschränkter Speaker-Lesezugriff via `has_role`:

```text
knowledge_compliance_rules   ← FGKurator Phase B + Werberichtlinien + Rechtsgrundlagen
knowledge_banned_words       ← BannedWords + emotionale Codes (BERT)
knowledge_prompts            ← Master-Prompts FGKurator / Speaker-Auditor / BERT
knowledge_email_templates    ← Speakermail, Onboarding-Mail
knowledge_moderation_tips    ← InterviewKompass + Lösungen-bei-Verstoessen
```

### Empfohlene Umsetzungs-Reihenfolge
1. Cloud-Wissensbasis als Fundament
2. Modul 2 (größte 1:1-Übernahme, M1 steht weitgehend)
3. Modul 4 (baut auf M2/M3 auf)
4. Modul 3 → 5 → 6 → 7 → 8

---

Dieser Plan ist die Arbeitsvorlage. Sag mir, mit welchem Schritt wir starten — Vorschlag: **Cloud-Wissensbasis (`knowledge_*` Tabellen) + Seed mit den FGKurator-Phase-B-Fragen und der BannedWords-Liste**. Sobald du in Build-Mode wechselst, lege ich die Vorlage zusätzlich als Projekt-Memory ab, damit sie in jeder Session greifbar ist.
