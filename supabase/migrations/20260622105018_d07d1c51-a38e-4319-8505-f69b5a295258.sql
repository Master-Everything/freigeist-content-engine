
-- 1. Rollen-Enum + Tabelle
CREATE TYPE public.app_role AS ENUM ('admin', 'speaker');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Speakers
CREATE TABLE public.speakers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  salutation text,
  first_name text NOT NULL,
  last_name text NOT NULL,
  title_role text,
  industry text,
  phone text,
  email text NOT NULL,
  website text,
  slogan text,
  bio_third_person text,
  short_vita text,
  avatar_url text,
  topic_suggestions text,
  interview_topic text,
  product text,
  product_market_since text,
  previous_interviews text,
  critical_voices text,
  hot_topics jsonb DEFAULT '[]'::jsonb,
  social_links jsonb DEFAULT '{}'::jsonb,
  has_newsletter boolean,
  email_list_size integer,
  affiliate_available boolean,
  affiliate_registration_url text,
  top_affiliate_products jsonb DEFAULT '[]'::jsonb,
  agb_accepted_at timestamptz,
  privacy_accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.speakers TO authenticated;
GRANT ALL ON public.speakers TO service_role;

ALTER TABLE public.speakers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Speakers view own profile"
  ON public.speakers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Speakers insert own profile"
  ON public.speakers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Speakers update own profile"
  ON public.speakers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete speakers"
  ON public.speakers FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_speakers_updated_at
  BEFORE UPDATE ON public.speakers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. posts: speaker_id + RLS verschärfen
ALTER TABLE public.posts ADD COLUMN speaker_id uuid REFERENCES public.speakers(id) ON DELETE SET NULL;

DROP POLICY IF EXISTS "Allow all delete" ON public.posts;
DROP POLICY IF EXISTS "Allow all insert" ON public.posts;
DROP POLICY IF EXISTS "Allow all select" ON public.posts;
DROP POLICY IF EXISTS "Allow all update" ON public.posts;

CREATE POLICY "Speakers view own posts"
  ON public.posts FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR speaker_id IN (SELECT id FROM public.speakers WHERE user_id = auth.uid())
  );

CREATE POLICY "Speakers insert own posts"
  ON public.posts FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR speaker_id IN (SELECT id FROM public.speakers WHERE user_id = auth.uid())
  );

CREATE POLICY "Speakers update own posts"
  ON public.posts FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR speaker_id IN (SELECT id FROM public.speakers WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins delete posts"
  ON public.posts FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. images: RLS verschärfen
DROP POLICY IF EXISTS "Allow all delete" ON public.images;
DROP POLICY IF EXISTS "Allow all insert" ON public.images;
DROP POLICY IF EXISTS "Allow all select" ON public.images;
DROP POLICY IF EXISTS "Allow all update" ON public.images;

CREATE POLICY "Users view own post images"
  ON public.images FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR post_id IN (
      SELECT p.id FROM public.posts p
      JOIN public.speakers s ON s.id = p.speaker_id
      WHERE s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users manage own post images"
  ON public.images FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR post_id IN (
      SELECT p.id FROM public.posts p
      JOIN public.speakers s ON s.id = p.speaker_id
      WHERE s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR post_id IN (
      SELECT p.id FROM public.posts p
      JOIN public.speakers s ON s.id = p.speaker_id
      WHERE s.user_id = auth.uid()
    )
  );

-- 5. Auto-assign 'speaker' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'speaker')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();
