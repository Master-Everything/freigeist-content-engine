# Phase B — Storage-Security härten (v2, temp/-Zweig ergänzt)

Drei Findings aus dem Linter in einem Rutsch, alle im Storage-Layer, keine App-Code-Änderung.

## Ownership-Modell für `post-images`

Pfad-Konvention im Bucket ist **nicht einheitlich** — zwei Schreibpfade:

1. `posts/<post_id>/<filename>.webp` — via `InlineImageUpload` im Block-Editor (Post existiert bereits).
2. `temp/<filename>.webp` — via `NewPost.tsx` beim Erstanlegen, dauerhaft dort liegend (keine post_id verfügbar).

`(storage.foldername(name))[2]` liefert bei `posts/…` die `post_id`, bei `temp/…` gibt es kein zweites Segment → Cast schlägt fehl → Policy würde alle Titelbild-Uploads brechen. Deshalb kommt in jede Write-Policy ein **zweiter Zweig für `temp/`** (Status quo: offen für alle authenticated), damit sich Modul 1 nicht selbst blockiert.

Ownership für `posts/<post_id>/…`:
- **Admin** (`has_role(auth.uid(), 'admin')`)
- **Ersteller** (`posts.created_by = auth.uid()`)
- **Zugeordneter Speaker** (`speakers.user_id = auth.uid()` via `posts.speaker_id`)

Gebündelt in `SECURITY DEFINER`-Helper `public.can_write_post(_post_id uuid)` — Muster wie `has_role`, `STABLE`, `search_path` gepinnt.

## 1 · Helper-Funktion

```sql
create or replace function public.can_write_post(_post_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.posts p
    left join public.speakers s on s.id = p.speaker_id
    where p.id = _post_id
      and (
        public.has_role(auth.uid(), 'admin')
        or p.created_by = auth.uid()
        or s.user_id = auth.uid()
      )
  )
$$;
```

## 2 · `post-images` Write-Policies ersetzen

Drop der bisherigen `Authenticated insert/update/delete post-images`-Policies. Neu, jeweils mit `temp/`-Zweig als Status-quo-Erhalt:

```sql
create policy "Write post-images (owner or temp)"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'post-images' and (
    (storage.foldername(name))[1] = 'temp'
    or public.can_write_post( ((storage.foldername(name))[2])::uuid )
  )
);
-- analog für UPDATE (USING + WITH CHECK) und DELETE (USING)
```

Public-SELECT bleibt unverändert — nötig für Bild-Auslieferung. `speaker-avatars` wird nicht angefasst.

*Restrisiko:* `temp/`-Prefix bleibt für alle Authenticated schreib-/löschbar. Identisch zum heutigen Verhalten, keine Verschlechterung. Wird in `@security-memory` als „acknowledged, revisit bei Move-Schritt `temp/ → posts/<post_id>/`" festgehalten.

## 3 · WARN-Findings (Bucket-Listing)

Beide Buckets sind bewusst public-read für Object-URLs, aber der Linter warnt vor Listing-Möglichkeit. Voller Fix wäre Umbau auf Signed URLs — eigener Strang, hier nicht drin.

Handling: beide Findings via `manage_security_finding → ignore` mit Begründung schließen und in `@security-memory` festhalten (public by design, kein PII in Dateinamen, Signed-URL-Umbau vorgemerkt).

## 4 · Verifikation

```sql
select policyname, cmd from pg_policies
where schemaname='storage' and tablename='objects'
  and policyname ilike '%post-images%';
```
Danach Linter erneut — erwartet: ERROR `post_images_storage_authenticated_write` weg, die zwei Listing-WARNs bleiben als „ignored" markiert. Smoke-Test (Neuanlage Post + Titelbild + Block-Editor-Bild) macht der Nutzer.

## Nicht Teil des Plans

- Kein Umbau auf Signed URLs.
- Kein Move `temp/ → posts/<post_id>/`.
- Keine Änderung an `speaker-avatars`-Write-Policies.
- Keine App-Code-Änderungen.
