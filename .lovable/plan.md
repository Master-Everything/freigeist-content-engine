## Ziel
Im CSV-Export von `/admin/aufwand` den Projektnamen **„Freigeist Content Creation"** ergänzen – sowohl im Dateinamen als auch als Überschriftszeile in der Tabelle.

## Änderungen in `src/pages/admin/Aufwand.tsx` (Funktion `exportCsv`)

1. **Überschriftszeile** als erste Zeile der CSV einfügen:
   `Aufwand – Freigeist Content Creation`
   (danach eine Leerzeile, dann wie bisher Kopfzeile + Daten + Summen).

2. **Dateiname** ändern von
   `aufwand-YYYY-MM-DD.csv`
   auf
   `aufwand-freigeist-content-creation-YYYY-MM-DD.csv`.

Keine weiteren Änderungen an Datenmodell, Hooks oder UI.
