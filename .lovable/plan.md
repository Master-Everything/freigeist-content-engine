## Ziel

Sechs interview-spezifische Felder aus dem Speaker-Profil entfernen und in ein neues, dediziertes **Interview-Formular** verlagern. Speaker bekommen einen eigenen Sidebar-Menüpunkt "Neues Interview". Affiliate-Produkte werden zentral im Profil gepflegt und im Interview-Formular per Dropdown ausgewählt.

## 1. Felder verlagern (Profil → Interview)

Diese sechs Felder werden aus dem Speaker-Profilformular (Modul 1) entfernt und ziehen in das Interview-Formular:

1. Thema des Interviews
2. Produkt, über das gesprochen wird
3. Wie lange ist das Produkt bereits am Markt?
4. Vorherige Interviews zu diesem Thema/Produkt
5. Kritische Stimmen / rechtliche Schwierigkeiten
6. Affiliate-Produkt(e) (Auswahl aus Profil-Affiliates)

Bestehende Werte in `speakers` werden **ersatzlos verworfen**.

## 2. Datenmodell

**`speakers`-Tabelle:** Spalten droppen — `interview_topic`, `product`, `product_market_since`, `previous_interviews`, `critical_voices`. (`top_affiliate_products` bleibt — wird zur Single Source of Truth für Affiliates.)

**`posts`-Tabelle:** Neue Spalten ergänzen:
- `interview_topic` text
- `product` text
- `product_market_since` text
- `previous_interviews` text
- `critical_voices` text
- `selected_affiliate_indices` int[]  *(Indizes 0–2 auf `speakers.top_affiliate_products`)*

Bestehender `interview_title` bleibt; `interview_topic` ergänzt ihn inhaltlich (Titel = öffentlicher Titel, Topic = inhaltliche Beschreibung).

## 3. Neues Interview-Formular für Speaker

**Neue Route:** `/module/interview/neu` (Speaker + Admin).

**Page:** `src/pages/modules/interview/InterviewForm.tsx`

Felder:
- Interview-Titel (Pflicht, bereits in `posts`)
- Thema des Interviews
- Produkt
- Produkt am Markt seit
- Vorherige Interviews (Textarea)
- Kritische Stimmen / rechtliche Schwierigkeiten (Textarea)
- **Affiliate-Produkte:** Multi-Select / Checkboxen aus den im Profil gepflegten `top_affiliate_products` des aktuellen Speakers. Falls Speaker keine Affiliates pflegt → Hinweistext mit Link zum Profil.

Verhalten:
- Speichern legt `posts`-Eintrag mit `speaker_id = aktueller Speaker`, `status='erfassung'` an.
- Speaker landet danach auf seinem Dashboard mit Toast "Interview angelegt".
- Admin kann optional Speaker auswählen (Dropdown), Speaker ist automatisch er selbst.

## 4. Einstieg in das Formular

- **Sidebar (Speaker):** neuer Eintrag "Neues Interview" → `/module/interview/neu`.
- **Sidebar (Admin):** ebenfalls "Neues Interview" zusätzlich zu vorhandenen Admin-Items.
- Existierende "Neues Interview anstoßen"-Buttons (Speaker-Dashboard, SpeakerForm) verlinken auf dieselbe Route statt direkt einen Post anzulegen.
- `triggerInterview()` aus `SpeakerForm.tsx` wird entfernt.

## 5. Anzeige der Daten

- **`MyPosts.tsx` / `Interview-Beiträge` Liste:** Spalte/Badge für `interview_topic` ergänzen (falls vorhanden).
- **`ViewPost.tsx` (Speaker, read-only):** Sektion "Interview-Details" mit den 6 neuen Feldern + Liste der ausgewählten Affiliates (aufgelöst aus Speaker-Profil).
- **`EditPost.tsx` (Admin):** Bestehender `SourceDataEditor` bekommt Block "Interview-Details" mit allen 6 Feldern, damit Admin sie nachbearbeiten kann.
- **Block-Editor / Export:** Affiliate-CTA (`cta_affiliate_url`, `cta_affiliate_label`) wird beim ersten Öffnen automatisch aus dem ersten ausgewählten Affiliate vorbefüllt, bleibt aber überschreibbar.

## 6. Technische Schritte

```text
1. Migration:
   - ALTER TABLE speakers DROP COLUMN interview_topic, product,
       product_market_since, previous_interviews, critical_voices;
   - ALTER TABLE posts ADD COLUMN interview_topic text,
       product text, product_market_since text,
       previous_interviews text, critical_voices text,
       selected_affiliate_indices int[] DEFAULT '{}';
2. Schema/Validation:
   - speaker-schema.ts: 5 Felder entfernen.
   - Neues interview-schema.ts mit Zod-Validation.
3. SpeakerForm.tsx:
   - "Interview-Themen"-Card schrumpft auf topic_suggestions + hot_topics.
   - Submit-Payload: 5 Felder entfernen.
   - triggerInterview-Button → Link zu /module/interview/neu.
4. Neue Datei: src/pages/modules/interview/InterviewForm.tsx.
5. App.tsx: Route /module/interview/neu (speaker+admin) registrieren.
6. AppSidebar.tsx: Eintrag "Neues Interview" für beide Rollen.
7. SpeakerDashboard.tsx: Button verlinkt auf neue Route.
8. ViewPost.tsx + EditPost (SourceDataEditor): Anzeige/Edit der neuen Felder.
9. types/post.ts: Post-Interface um neue Felder erweitern.
```

## 7. Out of Scope

- Keine Änderung an RLS-Policies (bestehende `posts`-Policies decken `speaker_id`-Scope bereits ab — wird vor Migration verifiziert).
- Keine Änderung am HTML-Export-Format (Affiliate-CTA-Logik bleibt wie heute).
- Keine UI-Redesigns an anderen Modulen.
