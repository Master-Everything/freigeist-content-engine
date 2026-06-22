## Ziel

- `thomas@master-everything.com` → Speaker (mit den bestehenden Profildaten)
- `ai@master-everything.com` → nur Admin

## Ablauf

1. **Du registrierst** dich in der App neu mit `thomas@master-everything.com` (über `/auth`). Sobald das Konto existiert, gib mir kurz Bescheid.
  1. Rückmeldung: Das Konto habe ich direkt in den Unsen angelegt
2. **Ich übertrage die Daten** per Daten-Operation:
  - `speakers.user_id` und `speakers.email` des bestehenden Profils auf die neue Thomas-User-ID umhängen
  - Speaker-Rolle bei `ai@...` entfernen (Admin bleibt)
  - Sicherstellen, dass `thomas@...` die Speaker-Rolle hat (wird beim Signup ohnehin automatisch via Trigger gesetzt)
  - Admin-Rolle, die der Signup-Trigger eventuell nicht vergibt, bleibt nur bei `ai@...`
3. **Ergebnis:**
  - Login `thomas@...` → sieht in Modul 1 das bereits ausgefüllte Speaker-Profil
  - Login `ai@...` → reiner Admin-Zugang, kein Speaker-Profil mehr

## Hinweis zum Formular

Das E-Mail-Feld im Erfassungs-Formular spiegelt nur die Login-E-Mail wider und ändert den Account selbst nicht — deshalb der Umweg über eine neue Registrierung statt einer Änderung im Formular.

## Keine Code-Änderungen

Reiner Daten-Umzug, keine Schema- oder UI-Änderungen nötig.