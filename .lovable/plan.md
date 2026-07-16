## Stunden +30% auf alle Einträge

Einmalige DB-Migration, die `hours` in `public.time_entries` für jeden bestehenden Eintrag um 30% erhöht.

### SQL
```sql
UPDATE public.time_entries
SET hours = ROUND((hours * 1.3)::numeric, 2);
```

### Auswirkung
- Alle bisher erfassten Einträge werden mit Faktor 1.3 multipliziert (auf 2 Nachkommastellen gerundet).
- Blocksummen, Gesamtstunden und Netto-Beträge in `/admin/aufwand` steigen entsprechend automatisch — keine Code-Änderung nötig.
- Status (`geschätzt`/`bestätigt`), Stundensatz und alle anderen Felder bleiben unverändert.
- Neue Einträge ab jetzt werden **nicht** automatisch erhöht — der Faktor gilt nur einmalig für den aktuellen Bestand.

### Hinweis
Der Vorgang ist nicht automatisch rückgängig zu machen. Falls du zurück willst, müssten wir später `hours / 1.3` laufen lassen (mit minimalen Rundungsabweichungen).