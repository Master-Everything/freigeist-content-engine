## Konsistenz-Fix: Admin-Bypass auch für `aenderung`

Claudes Beobachtung ist korrekt und relevant: Die eben vereinbarte Regel „Admin darf ab Modul 3 alles, was sonst dem Speaker vorbehalten ist" ist in `speaker-profile-decision` für die Aktion `aenderung` noch nicht konsequent umgesetzt. Aktuell greift dort weiterhin `!isOwner` (Speaker-only), was der Regel widerspricht — auch wenn es praktisch harmlos ist, weil kein UI-Pfad einen Admin dorthin führt.

Ich ziehe den Fix mit, damit die Autorisierungsregel überall gleich lautet und ein späterer Admin-Button („Zurück an Entwurf mit Notiz") sofort funktioniert.

### Änderung

**Datei:** `supabase/functions/speaker-profile-decision/index.ts`

- Zeile ~74: `aenderung`-Guard von `!isOwner` auf `!isOwner && !isAdmin` erweitern, sodass Admins die Aktion ebenfalls auslösen dürfen.
- Kein zusätzlicher Audit-Stempel für diese Aktion (Speaker-Feedback wird ohnehin über den Text-Body erfasst; ein Admin-Fremdauslöser wäre ein anderer Use Case und kann später separat auditiert werden, wenn ein UI-Trigger existiert).
- Keine Frontend-Änderung — es gibt bewusst noch keinen Admin-Button dafür.

### Nicht Teil dieses Fixes

- Kein neuer Admin-Button „Zurück an Entwurf" im `ProfilEditor` — separat aufsetzen, sobald ein konkreter Workflow-Bedarf entsteht.
- `kuratieren` bleibt Admin-only (per Definition Redaktions-Aktion, keine Speaker-Regel dahinter).
