
-- Generic updated_at trigger already exists: public.update_updated_at_column()

-- ============ knowledge_compliance_rules ============
CREATE TABLE public.knowledge_compliance_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  industry text NOT NULL DEFAULT 'generic',
  question_text text NOT NULL,
  risk_response_text text,
  legal_basis text,
  severity text NOT NULL DEFAULT 'warn',
  active boolean NOT NULL DEFAULT true,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.knowledge_compliance_rules TO authenticated;
GRANT ALL ON public.knowledge_compliance_rules TO service_role;
ALTER TABLE public.knowledge_compliance_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read active rules" ON public.knowledge_compliance_rules
  FOR SELECT TO authenticated USING (active = true);
CREATE POLICY "admin manage rules" ON public.knowledge_compliance_rules
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_knowledge_compliance_rules_updated
  BEFORE UPDATE ON public.knowledge_compliance_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ knowledge_banned_words ============
CREATE TABLE public.knowledge_banned_words (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term text NOT NULL UNIQUE,
  category text NOT NULL DEFAULT 'banned',
  replacement_suggestion text,
  legal_basis text,
  severity text NOT NULL DEFAULT 'warn',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.knowledge_banned_words TO authenticated;
GRANT ALL ON public.knowledge_banned_words TO service_role;
ALTER TABLE public.knowledge_banned_words ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read active banned_words" ON public.knowledge_banned_words
  FOR SELECT TO authenticated USING (active = true);
CREATE POLICY "admin manage banned_words" ON public.knowledge_banned_words
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_knowledge_banned_words_updated
  BEFORE UPDATE ON public.knowledge_banned_words
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ knowledge_prompts ============
CREATE TABLE public.knowledge_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  title text NOT NULL,
  system_prompt text NOT NULL,
  model text NOT NULL DEFAULT 'google/gemini-2.5-flash',
  version integer NOT NULL DEFAULT 1,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.knowledge_prompts TO authenticated;
GRANT ALL ON public.knowledge_prompts TO service_role;
ALTER TABLE public.knowledge_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read active prompts" ON public.knowledge_prompts
  FOR SELECT TO authenticated USING (active = true);
CREATE POLICY "admin manage prompts" ON public.knowledge_prompts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_knowledge_prompts_updated
  BEFORE UPDATE ON public.knowledge_prompts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ knowledge_email_templates ============
CREATE TABLE public.knowledge_email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  subject text NOT NULL,
  body_markdown text NOT NULL,
  variables jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.knowledge_email_templates TO authenticated;
GRANT ALL ON public.knowledge_email_templates TO service_role;
ALTER TABLE public.knowledge_email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read active email_templates" ON public.knowledge_email_templates
  FOR SELECT TO authenticated USING (active = true);
CREATE POLICY "admin manage email_templates" ON public.knowledge_email_templates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_knowledge_email_templates_updated
  BEFORE UPDATE ON public.knowledge_email_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ knowledge_moderation_tips ============
CREATE TABLE public.knowledge_moderation_tips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic text NOT NULL,
  industry text,
  trigger_text text NOT NULL,
  tip_text text NOT NULL,
  source text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.knowledge_moderation_tips TO authenticated;
GRANT ALL ON public.knowledge_moderation_tips TO service_role;
ALTER TABLE public.knowledge_moderation_tips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read active moderation_tips" ON public.knowledge_moderation_tips
  FOR SELECT TO authenticated USING (active = true);
CREATE POLICY "admin manage moderation_tips" ON public.knowledge_moderation_tips
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_knowledge_moderation_tips_updated
  BEFORE UPDATE ON public.knowledge_moderation_tips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
