CREATE TABLE public.images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  slot text NOT NULL,
  filename text NOT NULL,
  original_name text,
  file_size integer,
  wp_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all select" ON public.images FOR SELECT TO public USING (true);
CREATE POLICY "Allow all insert" ON public.images FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow all update" ON public.images FOR UPDATE TO public USING (true);
CREATE POLICY "Allow all delete" ON public.images FOR DELETE TO public USING (true);