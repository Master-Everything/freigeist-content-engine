# Plan: Modul 1 – Erfassung Interviewgast (Basics)

## Ziel

Speaker können sich selbst registrieren (oder werden von einem Admin angelegt), füllen ein deutsches Premium-Anmeldeformular aus, und beim Absenden wird automatisch ein erster `posts`-Eintrag mit Status `erfassung` erzeugt – sichtbar im Dashboard und im weiteren Workflow.

## Umfang dieser Iteration

- Auth: E-Mail + Passwort + Google (Lovable Cloud managed)
- Rollen: `admin` / `speaker` über separate `user_roles`-Tabelle (sicher, ohne Eskalations-Risiko)
- Speaker-Profil: neue Tabelle `speakers` mit allen Formularfeldern
- Profilbild: öffentlicher Storage-Bucket `speaker-avatars`
- Formular: deutsches, mehrteiliges Premium-Formular (Sektionen wie spezifiziert)
- Beim Absenden: Profil speichern **und** ersten `posts`-Eintrag (Status `erfassung`) anlegen, verknüpft mit Speaker
- Speaker-Dashboard-Sicht: gefilterte Liste eigener Interviews; Admins sehen weiterhin alles
- Sidebar: Auth-Status, Logout, Login-Route geschützt

## Routen

```text
/auth                            → Login + Registrierung (Tabs)
/module/erfassung                → ersetzt Platzhalter: Anmelde-/Profilformular
/module/erfassung/danke          → Bestätigungsseite nach Absenden
```

Bestehende Modul-Routen bleiben unverändert. Dashboard und Modul 7 werden für nicht eingeloggte User auf `/auth` umgeleitet.

## Datenbank

### Enum & Rollen
- `app_role` Enum: `admin`, `speaker`
- `user_roles` (user_id, role) + `has_role(_user_id, _role)` Security-Definer-Funktion (gemäß Lovable-Standard, RLS, separate Tabelle)
- Ersten Admin lege ich nach Deiner Bestätigung manuell per Insert an – bitte E-Mail-Adresse nennen, sobald Du registriert bist.

### Neue Tabelle `speakers`
Stammdaten 1:1 zum User (FK `auth.users(id)`, unique). Felder gemäß Formular:

- Persönlich: `salutation` (Herr/Frau/Divers), `first_name`, `last_name`, `title_role`, `industry`, `phone`, `email`, `website`
- Profil: `slogan`, `bio_third_person`, `short_vita`, `avatar_url`
- Themen: `topic_suggestions`, `interview_topic`, `product`, `product_market_since`, `previous_interviews`, `critical_voices`, `hot_topics` (jsonb array von 3 Strings)
- Social: `social_links` jsonb (`youtube`, `facebook`, `instagram`, `linkedin`, `twitter`, `telegram`)
- Newsletter: `has_newsletter` bool, `email_list_size` int
- Affiliate: `affiliate_available` bool, `affiliate_registration_url`, `top_affiliate_products` jsonb array (3 × `{produkt, url, freebie_url, ebook_url}`)
- Rechtliches: `agb_accepted_at`, `privacy_accepted_at` (timestamps statt Booleans → Audit-tauglich)
- Standard: `id`, `user_id`, `created_at`, `updated_at` (mit Trigger)

### Erweiterung `posts`
- Neue Spalte `speaker_id uuid references public.speakers(id)` (nullable für Bestandsdaten)
- Status-Wert `erfassung` ist bereits im bestehenden Mapping vorgesehen

### Storage
- Bucket `speaker-avatars`, **public**
- RLS auf `storage.objects`: Speaker dürfen nur in ihren eigenen Pfad `{user_id}/...` schreiben/löschen, alle dürfen lesen

### RLS-Politik
- `speakers`: Speaker liest/schreibt eigenes Profil; Admin sieht/ändert alles
- `user_roles`: Read für eingeloggte User (für UI-Gating); Insert/Update nur Admin
- `posts`: vorhandene "Allow all"-Policies werden **ersetzt** durch: Speaker sieht/ändert nur eigene (über `speaker_id`); Admin alles; Edge Functions via `service_role`
- `images`: analog – Speaker sieht/ändert nur Bilder zu eigenen Posts; Admin alles

> Hinweis: Die alten freizügigen "Allow all"-Policies an `posts`/`images` werden im Zuge dessen verschärft. Für bestehende Datensätze ohne `speaker_id` greift die Admin-Policy.

## Frontend

### Auth
- `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })` für Google
- E-Mail/Passwort via vorhandenem Supabase Client
- `AuthProvider`-Hook (`useAuth`) mit `user`, `role`, `loading`
- Geschützte Routen über Wrapper-Komponente
- Sidebar bekommt User-Bereich (Avatar/E-Mail + Logout)

### Formular `/module/erfassung`
- Eingeloggte Speaker ohne Profil → Formular zum Erstausfüllen
- Eingeloggte Speaker mit Profil → vorbefülltes Formular + Button "Neues Interview anstoßen" (legt nur neuen `posts`-Eintrag mit Status `erfassung` an, ohne Profilfelder neu zu speichern)
- Nicht eingeloggte → Hinweis-Karte + Buttons "Registrieren" / "Einloggen"
- Tech: `react-hook-form` + `zod`, shadcn `Form`/`Input`/`Textarea`/`Select`/`RadioGroup`/`Checkbox`
- Sektionen exakt wie spezifiziert: Persönliches · Profil & Bio · Interview-Themen · Social Media · Newsletter · Affiliate · Rechtliches
- Pflichtfelder mit `*`, dezente Hilfetexte unter den Feldern
- Profilbild-Upload: Reuse `convertToWebP` aus `src/lib/image-utils.ts`, max 500 KB nach Konvertierung, Upload nach `speaker-avatars/{user_id}/avatar.webp`
- Submit: Profil upsert → erster `posts`-Insert (`speaker_id`, `guest_name = first+last`, `interview_title = interview_topic || topic_suggestions`, `status = 'erfassung'`) → Redirect `/module/erfassung/danke`

### Design (Premium, Freigeist-Stil)
- Dark Theme bleibt Default; Primary `#2A809B`
- Karten-basierte Sektionen mit großzügigem Padding, `border` + `bg-card`, klare Trennlinien zwischen Sektionen über Abstand (keine `<hr>` – Memory-Regel)
- Pflichtfelder visuell hervorgehoben (`text-primary` für `*`)
- Submit-Button: groß, `bg-primary`, mit Icon, leicht erhöhter Schatten
- Sticky Fortschritts-/Sektionsnavigation am rechten Rand (Desktop)

### Dashboard-Anpassung
- `DashboardHome` filtert die zentrale Liste rollenbasiert: Speaker sieht nur eigene Interviews; Admin alles
- Neuer Button "Erfassung starten" → `/module/erfassung`

## Dateien

Neu:
- `src/contexts/AuthContext.tsx` (User + Rolle)
- `src/components/ProtectedRoute.tsx`
- `src/pages/Auth.tsx`
- `src/pages/modules/Module1Erfassung.tsx` (ersetzt Platzhalter)
- `src/pages/modules/erfassung/SpeakerForm.tsx`
- `src/pages/modules/erfassung/Danke.tsx`
- `src/lib/validation/speaker-schema.ts` (zod)

Geändert:
- `src/App.tsx` – `/auth`-Route, AuthProvider-Wrapping, Schutz für Modul-Routen
- `src/components/AppSidebar.tsx` – User-Bereich + Logout
- `src/pages/DashboardHome.tsx` – Rollen-Filter + neuer Einstiegsbutton
- `supabase/config.toml` – ggf. Auto-Bestätigung wie Standard (nicht aktiv, außer Du wünschst es)

## Nicht Teil dieses Schritts

- E-Mail-Versand & individuelle Auth-E-Mail-Templates (Standard-Lovable-Mails reichen vorerst)
- Admin-UI zum Verwalten von Rollen/Speakern (kommt später)
- Komplexe Interview-Workflow-Logik (Übergang erfassung → vorab-scan etc.)
- Validierung über Branchen-/Themen-Vorschläge, KI-Auto-Fill, Sprechermappe (Modul 2/3)

## Offene Punkte (für nach diesem Schritt)

- Deine E-Mail-Adresse für den ersten Admin-Insert
- Soll die Google-Anmeldung auf bestimmte Domains beschränkt sein? (Default: nein)
- Brauchen wir später eine öffentliche Bewerbungs-URL ohne Login (z. B. `/anmeldung`)? Aktuell setze ich Login voraus – einfacher und sicherer.
