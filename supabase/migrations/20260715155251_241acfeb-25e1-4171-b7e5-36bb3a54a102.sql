-- Backfill: guest_image_url + guest_short_bio in posts.blocks spiegeln
-- Idempotent: greift nur, wenn blocks-Feld leer und Top-Level-Feld gefüllt ist.
-- Auf Prod bereits am 2026-07-15 manuell ausgeführt (Verifikation: 0 verbleibende Zeilen).
-- Diese Migration dokumentiert die Datenkorrektur reproduzierbar im Repo.
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