## Problem

Beim Absenden des Erfassungsformulars wird ein `posts`-Eintrag mit `status = 'erfassung'` erzeugt. Die `posts`-Tabelle hat aber einen CHECK-Constraint, der nur `draft`, `in_progress`, `exported` erlaubt → INSERT schlägt fehl. Das Speaker-Profil selbst wird vorher gespeichert, daher sind die Profildaten trotzdem in der DB.

## Fix

Migration, die den alten Constraint ersetzt und die Workflow-Status passend zu unseren 8 Modulen ergänzt:

- `erfassung` (Modul 1)
- `vorab_scan` (Modul 2)
- `profil` (Modul 3)
- `leitfaden` (Modul 4)
- `vorgespraech` (Modul 5)
- `aufzeichnung` (Modul 6)
- `draft`, `in_progress`, `exported` (bestehender Editor/Export-Flow bleibt funktionsfähig)

```sql
ALTER TABLE public.posts DROP CONSTRAINT posts_status_check;
ALTER TABLE public.posts ADD CONSTRAINT posts_status_check
  CHECK (status IN (
    'erfassung','vorab_scan','profil','leitfaden',
    'vorgespraech','aufzeichnung',
    'draft','in_progress','exported'
  ));
```

## Nicht Teil dieses Fixes

- Keine Code-Änderungen am Formular nötig — der Insert ist korrekt, nur die DB-Regel war zu eng.
- Bestehende Daten bleiben unverändert.

Nach der Migration: Formular erneut absenden, dann sollten Profil **und** erster `posts`-Eintrag (`status='erfassung'`) sauber durchlaufen.
