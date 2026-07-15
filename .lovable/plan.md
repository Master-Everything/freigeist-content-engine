## Phase A — Sofort-Fixes für Linter-Warnungen

Zwei aufwandslose Schritte, keine Code-Änderungen, keine Migration.

### Schritt 1 — Punkt 3 identifizieren (read-only)

`pg_proc`-Abfrage, um zu bestätigen, welche `SECURITY DEFINER`-Funktion der Linter meint:

```sql
SELECT n.nspname AS schema, p.proname AS function, p.prosecdef AS security_definer,
       pg_catalog.pg_get_function_identity_arguments(p.oid) AS args
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.prosecdef = true;
```

Erwartung (laut Claude): `has_role` und `handle_new_user_role`. Ergebnis als Doku festhalten:
- `has_role` → bewusst so (Standardmuster gegen RLS-Rekursion, `STABLE`, `search_path` gepinnt) → **False-Positive, ignorieren**.
- `handle_new_user_role` → `RETURNS trigger`, nicht per RPC aufrufbar → **False-Positive, ignorieren**.

Beide via `manage_security_finding` als *ignore* mit passender Begründung markieren, damit sie im Scanner-Panel nicht liegenbleiben.

### Schritt 2 — Punkt 4 aktivieren

`configure_auth` mit `password_hibp_enabled: true`. Andere Auth-Settings unverändert lassen (`disable_signup: false`, `external_anonymous_users_enabled: false`, `auto_confirm_email: false` — Projekt-Konvention). Wirkt nur auf zukünftige Passwort-Sets, keine Downtime, keine Migration.

### Verifikation

- Linter nochmal laufen lassen → Punkt 4 muss weg sein; Punkt 3 bleibt evtl. sichtbar, ist aber im Findings-Panel als *ignored* markiert.
- Punkte 1 & 2 bleiben offen — wandern in **Phase B** (eigener Strang, Storage-Policies verengen nach kurzer Use-Case-Prüfung).

### Nicht Teil des Plans

- Keine Storage-Policy-Änderungen (Phase B).
- Keine Änderungen an `has_role` / `handle_new_user_role` — beide sind absichtlich so gebaut.
- Keine anderen Auth-Settings anfassen.
