
ALTER TABLE public.posts ADD COLUMN post_slug text;
ALTER TABLE public.posts RENAME COLUMN guest_website TO guest_website_url;
ALTER TABLE public.posts RENAME COLUMN guest_profile_text TO guest_short_bio;
