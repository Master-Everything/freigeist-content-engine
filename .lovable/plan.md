# Plan: Inhaltliche Langfelder zu Textareas umwandeln

## Ziel
In `src/pages/modules/erfassung/SpeakerForm.tsx` die einzeiligen `Input`-Felder mit inhaltlichem Text auf `Textarea` umstellen, damit die maximale Zeichenmenge sichtbar dargestellt werden kann. Höhe und Zeichenzähler wie bei den bestehenden Textareas.

## Betroffene Felder (Input → Textarea)
- `slogan` (max 300)
- `title_role` (max 160)
- `interview_topic` (max 300)
- `product` (max 300)
- `hot_topic_1`, `hot_topic_2`, `hot_topic_3` (max 300)
- `aff_1_name`, `aff_2_name`, `aff_3_name` (max 160)

## Nicht betroffen (bleiben `Input`)
- Namen: `first_name`, `last_name`
- Kontakt: `phone`, `email`
- `industry`, `product_market_since`
- URLs: `website`, alle `social_*`, `affiliate_registration_url`, `aff_*_url`, `aff_*_freebie`, `aff_*_ebook`
- Zahl: `email_list_size`

## Umsetzung
1. `TextInput`-Aufrufe für `slogan`, `title_role`, `interview_topic`, `product` durch `TextAreaInput` ersetzen (gleiche Props: `name`, `label`, ggf. `required`, `form`, `help`). Höhe ergibt sich automatisch aus `textareaHeightFor(max)` (für max ≤ 300 → `min-h-[6rem]`, ~3 Zeilen).
2. Für die 3 brandaktuellen Themen den Block ersetzen: statt `Input` ein `Textarea` mit `maxLength={FIELD_MAX[name]}`, `min-h-[6rem]`, plus `WatchedCounter` darunter. Nummerierungs-Layout bleibt erhalten (Nummer links, Feld rechts; bei mehrzeiligem Feld Nummer oben ausgerichtet via `items-start` und `pt-2`).
3. Für die Affiliate-Produktnamen (`aff_${i}_name`) ebenfalls auf `Textarea` mit passender Höhe und Counter umstellen; die danebenliegenden URL-Felder (`url`, `freebie`, `ebook`) bleiben `Input`.

## Keine Logikänderungen
- Schema, Validierung, Submit-Payload und DB-Felder bleiben unverändert.
- Nur Präsentation: Eingabeelement-Typ und Höhe.

## Betroffene Dateien
- `src/pages/modules/erfassung/SpeakerForm.tsx`
