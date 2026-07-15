## Root-Cause-Fix für `guest_image_url` + `guest_short_bio` Migration

Claudes Review bestätigt: 3 von 5 Posts haben `blocks.guest_image_url` leer, obwohl die Top-Level-Spalte gefüllt ist. Für `guest_short_bio` gilt dieselbe Ursache (identisches Migrations-Muster in `loadPost()`), also gleich verbindlich mit-backfillen statt vorab prüfen.

### Schritt 1 — Backfill-Migration (beide Felder in einem Rutsch)

```sql
UPDATE public.posts
SET blocks = jsonb_set(
  jsonb_set(
    COALESCE(blocks, '{}'::jsonb),
    '{guest_image_url}',
    to_jsonb(guest_image_url)
  ),
  '{guest_short_bio}',
  to_jsonb(guest_short_bio)
)
WHERE
  (guest_image_url IS NOT NULL AND guest_image_url <> ''
    AND (blocks->>'guest_image_url' IS NULL OR blocks->>'guest_image_url' = ''))
  OR
  (guest_short_bio IS NOT NULL AND guest_short_bio <> ''
    AND (blocks->>'guest_short_bio' IS NULL OR blocks->>'guest_short_bio' = ''));
```

### Schritt 2 — Fallbacks entfernen

Nach erfolgreichem Backfill ist `blocks` wieder alleinige Quelle:

- `src/components/PostPreview.tsx` — `mergedBlocks`-Wrapper entfernen, wieder direkt `blocks` an `renderPostHtml` übergeben.
- `supabase/functions/push-to-hub/index.ts` — den entsprechenden Fallback-Merge entfernen.

### Schritt 3 — Verifikation

- SQL-Check (beide Felder):
  ```sql
  SELECT COUNT(*) FROM posts
  WHERE ((blocks->>'guest_image_url' IS NULL OR blocks->>'guest_image_url' = '')
         AND guest_image_url IS NOT NULL AND guest_image_url <> '')
     OR ((blocks->>'guest_short_bio' IS NULL OR blocks->>'guest_short_bio' = '')
         AND guest_short_bio IS NOT NULL AND guest_short_bio <> '');
  ```
  → muss 0 sein.
- Preview für Post `21837dbe…` erneut öffnen → Speaker-Block rendert zweispaltig mit Foto und Kurzbio.
- Push-to-Hub-Payload spot-checken.

### Nicht Teil des Plans

- Neue Felder oder UI-Änderungen.
- Änderungen an `loadPost()` — Migrations-Logik bleibt als Sicherheitsnetz für evtl. noch nicht erfasste Alt-Posts.
