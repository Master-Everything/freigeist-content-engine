In `src/components/AppSidebar.tsx` die Status-Werte anpassen für **beide** Modul-Listen (`adminModules` und `speakerModules`):

- **Modul 1 – Erfassung:** `planned`/`active` → `active`
- **Modul 2 – Vorab-Scan:** `planned`/`in-progress` → `active`
- **Modul 8 – News-Plattform:** `planned` → `active`

Alle anderen Module bleiben unverändert. Keine Logik-Änderungen, nur die `status`-Felder in den beiden Arrays.