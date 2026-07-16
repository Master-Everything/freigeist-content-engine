## Ziel

Admin-Seite `/admin/aufwand`, die alle bisherigen und künftigen Projektaufgaben chronologisch samt Zeitaufwand auflistet, Blöcke summiert und mit einem zentral änderbaren Stundensatz (Default 40 €) die Abrechnungsgrundlage (netto) liefert.

## Datenmodell (neue Migration)

**`public.app_settings`** — generischer Key/Value-Store.
- `key text primary key`, `value jsonb`, `updated_at`
- RLS: nur `admin` (SELECT/INSERT/UPDATE)
- Seed: `('hourly_rate', '40')`

**`public.time_entries`** — Zeiteinträge.
- `id uuid pk`
- `entry_date date not null`
- `block text not null` (z. B. „Modul 3 — Profil-Generator")
- `task text not null`
- `hours numeric(6,2) not null`
- `note text`
- `status text not null default 'geschätzt'` — Werte `'geschätzt'` | `'bestätigt'` (CHECK)
- `created_by uuid references auth.users(id) on delete set null`
- `created_at`, `updated_at`
- Index auf `(entry_date, block)`
- RLS: nur `admin` (SELECT/INSERT/UPDATE/DELETE via `has_role`)
- GRANTs: `authenticated` (RLS-gated) + `service_role`
- `update_updated_at_column`-Trigger

## Seed-Daten

Alle initial geseedeten Einträge bekommen `status = 'geschätzt'`. Feine Granularität (~80+ Einträge) aus dem Chatverlauf, chronologisch, in Blöcke gruppiert:

- Setup & Auth (Hybrid Roles, Sidebar, Speaker-Dashboard)
- Modul 1 — Erfassung (Speaker/Interview-Split, Admin-Overview, Fast-Entry)
- Modul 2 — Vorab-Scan
- Modul 3 — Profil-Generator
- Modul 4 — Interview-Leitfaden (+ Interviewer-Notizen, Auto-Grow)
- Modul 5 — Vorgespräch/Cockpit
- Modul 6 — Aufzeichnung
- Modul 7 — Refactor (Authoring Cockpit + AI-Kontextinjektion)
- Modul 8 — Hub-Integration
- Wissensbasis + Seeding
- Dashboard (LCARS)
- ContextSheet
- Status-Fluss + Guest-Field-Backfill
- Security Phase A + Phase B
- Bugfixes & Reviews
- Tech-Stack-Seite

## UI (`src/pages/admin/Aufwand.tsx`)

Route in `App.tsx`: `/admin/aufwand`, admin-only. Sidebar-Footer-Eintrag neben „Wissensbasis" (Icon `Euro`/`Clock`).

**Layout:**

1. **Header-Card „Kalkulation"**
   - Input „Stundensatz (€)" → persistiert sofort in `app_settings.hourly_rate`
   - Datumsbereichsfilter (shadcn Datepicker, von/bis)
   - Toggle „Nur geschätzte anzeigen"
   - Kacheln: **Gesamtstunden** · **Gesamtsumme (netto)** — keine USt-Ausweisung
   - Button „CSV-Export" (aktuelle Sicht + Summenzeile, inkl. `status`-Spalte)

2. **Blockübersicht** — kompakte Tabelle Block → Stunden → Netto-Betrag, Klick scrollt zum Detail.

3. **Detailliste** — chronologisch, gruppiert nach `block`:
   - Spalten: Datum · Aufgabe · Notiz · Stunden · Netto-Betrag · **Status-Badge** · Aktionen
   - Badge gelb `Ø geschätzt` bzw. grün `✓ bestätigt`, klickbar zum Toggeln
   - Pro Block Zwischensumme (Stunden + Netto €)
   - „+ Eintrag hinzufügen"-Dialog (Datum, Block-Combobox, Aufgabe, Stunden, Status, Notiz)

Alle Beträge reaktiv über zentralen `hourlyRate`-State. Sämtliche Beträge sind Netto — keine Steuerlogik im Code.

## Technisch

- Hooks: `useHourlyRate()`, `useTimeEntries(filters?)` (TanStack Query + Mutations)
- CSV-Export clientseitig, ohne Extra-Dep
- Änderungen außerhalb der neuen Seite: `App.tsx` (Route), `AppSidebar.tsx` (Nav-Item, admin-only)

## Nicht enthalten

- Umsatzsteuer/MwSt.-Ausweisung
- PDF-Export
- Multi-User-Erfassung
- Historisierung von Stundensatz-Änderungen
