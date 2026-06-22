import { z } from "zod";

export const speakerSchema = z.object({
  salutation: z.enum(["Herr", "Frau", "Divers"], { required_error: "Bitte auswählen" }),
  first_name: z.string().trim().min(1, "Pflichtfeld").max(80),
  last_name: z.string().trim().min(1, "Pflichtfeld").max(80),
  title_role: z.string().trim().max(160).optional().or(z.literal("")),
  industry: z.string().trim().max(120).optional().or(z.literal("")),
  phone: z.string().trim().min(4, "Pflichtfeld").max(40),
  email: z.string().trim().email("Ungültige E-Mail").max(255),
  website: z.string().trim().max(255).optional().or(z.literal("")),

  slogan: z.string().trim().min(1, "Pflichtfeld").max(300),
  bio_third_person: z.string().trim().min(1, "Pflichtfeld").max(2000),
  short_vita: z.string().trim().min(1, "Pflichtfeld").max(2000),

  topic_suggestions: z.string().trim().min(1, "Pflichtfeld").max(2000),
  hot_topic_1: z.string().trim().max(300).optional().or(z.literal("")),
  hot_topic_2: z.string().trim().max(300).optional().or(z.literal("")),
  hot_topic_3: z.string().trim().max(300).optional().or(z.literal("")),

  social_youtube: z.string().trim().max(255).optional().or(z.literal("")),
  social_facebook: z.string().trim().max(255).optional().or(z.literal("")),
  social_instagram: z.string().trim().max(255).optional().or(z.literal("")),
  social_linkedin: z.string().trim().max(255).optional().or(z.literal("")),
  social_twitter: z.string().trim().max(255).optional().or(z.literal("")),
  social_telegram: z.string().trim().max(255).optional().or(z.literal("")),

  has_newsletter: z.enum(["ja", "nein"], { required_error: "Bitte auswählen" }),
  email_list_size: z.coerce.number().int().min(0, "Pflichtfeld"),

  affiliate_available: z.enum(["ja", "nein"], { required_error: "Bitte auswählen" }),
  affiliate_registration_url: z.string().trim().max(255).optional().or(z.literal("")),

  aff_1_name: z.string().trim().max(160).optional().or(z.literal("")),
  aff_1_url: z.string().trim().max(255).optional().or(z.literal("")),
  aff_1_freebie: z.string().trim().max(255).optional().or(z.literal("")),
  aff_1_ebook: z.string().trim().max(255).optional().or(z.literal("")),
  aff_2_name: z.string().trim().max(160).optional().or(z.literal("")),
  aff_2_url: z.string().trim().max(255).optional().or(z.literal("")),
  aff_2_freebie: z.string().trim().max(255).optional().or(z.literal("")),
  aff_2_ebook: z.string().trim().max(255).optional().or(z.literal("")),
  aff_3_name: z.string().trim().max(160).optional().or(z.literal("")),
  aff_3_url: z.string().trim().max(255).optional().or(z.literal("")),
  aff_3_freebie: z.string().trim().max(255).optional().or(z.literal("")),
  aff_3_ebook: z.string().trim().max(255).optional().or(z.literal("")),

  agb_accepted: z.literal(true, { errorMap: () => ({ message: "Bitte bestätigen" }) }),
  privacy_accepted: z.literal(true, { errorMap: () => ({ message: "Bitte bestätigen" }) }),
});

export type SpeakerFormValues = z.infer<typeof speakerSchema>;
