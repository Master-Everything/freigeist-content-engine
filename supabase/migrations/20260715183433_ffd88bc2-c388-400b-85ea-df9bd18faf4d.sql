-- Phase B: Harden post-images storage write policies with ownership check
-- Helper function
create or replace function public.can_write_post(_post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
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

-- Drop old permissive policies on storage.objects for post-images
drop policy if exists "Authenticated insert post-images" on storage.objects;
drop policy if exists "Authenticated update post-images" on storage.objects;
drop policy if exists "Authenticated delete post-images" on storage.objects;
drop policy if exists "Authenticated users can upload post-images" on storage.objects;
drop policy if exists "Authenticated users can update post-images" on storage.objects;
drop policy if exists "Authenticated users can delete post-images" on storage.objects;

-- New ownership-gated policies with temp/ branch preserving current behavior
create policy "post-images insert (owner or temp)"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'post-images' and (
    (storage.foldername(name))[1] = 'temp'
    or (
      (storage.foldername(name))[1] = 'posts'
      and public.can_write_post( ((storage.foldername(name))[2])::uuid )
    )
  )
);

create policy "post-images update (owner or temp)"
on storage.objects for update to authenticated
using (
  bucket_id = 'post-images' and (
    (storage.foldername(name))[1] = 'temp'
    or (
      (storage.foldername(name))[1] = 'posts'
      and public.can_write_post( ((storage.foldername(name))[2])::uuid )
    )
  )
)
with check (
  bucket_id = 'post-images' and (
    (storage.foldername(name))[1] = 'temp'
    or (
      (storage.foldername(name))[1] = 'posts'
      and public.can_write_post( ((storage.foldername(name))[2])::uuid )
    )
  )
);

create policy "post-images delete (owner or temp)"
on storage.objects for delete to authenticated
using (
  bucket_id = 'post-images' and (
    (storage.foldername(name))[1] = 'temp'
    or (
      (storage.foldername(name))[1] = 'posts'
      and public.can_write_post( ((storage.foldername(name))[2])::uuid )
    )
  )
);