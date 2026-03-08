
-- Create posts table for Freigeist Content Engine
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'exported')),
  guest_name TEXT NOT NULL,
  interview_title TEXT NOT NULL,
  youtube_url TEXT,
  newsletter_text TEXT,
  telegram_text TEXT,
  guest_website TEXT,
  guest_profile_text TEXT,
  prettylink_shortcodes TEXT,
  blocks JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- For V1, allow all operations (no auth required)
CREATE POLICY "Allow all select" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Allow all insert" ON public.posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON public.posts FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON public.posts FOR DELETE USING (true);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
