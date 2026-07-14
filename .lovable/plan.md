## Ziel

In den Findings der Vorab-Scans (Speaker & Interview) werden technische Feldnamen wie `interview.interview_topic`, `speaker.bio_third_person`, `hot_topic_1` oder `affiliate_2` angezeigt. Diese sollen durch verständliche deutsche Labels ersetzt werden — z. B. „Interview-Thema", „Bio (3. Person)", „Hot Topic 1", „Affiliate-Produkt 2".

## Vorgehen

1. **Neues Utility `src/lib/field-labels.ts`**
   - Export `fieldLabel(field: string): string`
   - Festes Mapping für alle bekannten Feldschlüssel aus `vorab-scan` und `interview-scan`:
     - Speaker: `slogan`, `bio_third_person`, `short_vita`, `topic_suggestions`, `title_role`, `industry`
     - Interview: `interview_title`, `interview_topic`, `product`, `product_market_since`, `previous_interviews`, `critical_voices`
   - Regex-Fallbacks für dynamische Keys: `hot_topic_N` → „Hot Topic N", `affiliate_N` → „Affiliate-Produkt N"
   - Präfix-Strip: `interview.` / `speaker.` vor dem Lookup entfernen (das LLM liefert im Interview-Scan wegen der verschachtelten Payload gelegentlich den vollen Pfad).
   - Fallback für unbekannte Keys: Präfix weg, Underscores → Leerzeichen, erster Buchstabe groß.

2. **`src/components/vorab-scan/ScanFindingsList.tsx`**
   - `f.field` nicht mehr roh als `font-mono` rendern, sondern `fieldLabel(f.field)` in normaler Schrift ausgeben.
   - `rule_code` bleibt weiterhin als eigenes monospaced Badge (technischer Regel-Code).

Keine Änderungen an Edge Functions oder DB — die technischen Keys bleiben in `findings.field` gespeichert, nur die Darstellung wird übersetzt.

## Betroffene Dateien

- `src/lib/field-labels.ts` (neu)
- `src/components/vorab-scan/ScanFindingsList.tsx` (Label-Rendering)