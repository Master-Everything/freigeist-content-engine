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

/**
 * Admin-Schnellerfassung: nur Nachname und E-Mail sind Pflicht.
 * Alle anderen Felder sind optional — der Speaker (oder Admin später) ergänzt sie nach Bedarf.
 * AGB/Datenschutz-Checkboxen entfallen; die Timestamps in der DB bleiben `null`, bis der
 * Speaker beim Owner-Handover selbst bestätigt.
 */
const optionalString = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

export const speakerAdminSchema = z.object({
  salutation: z.enum(["Herr", "Frau", "Divers"]).optional(),
  first_name: z.string().trim().min(1, "Pflichtfeld").max(80),
  last_name: z.string().trim().min(1, "Pflichtfeld").max(80),
  title_role: optionalString(160),
  industry: optionalString(120),
  phone: optionalString(40),
  email: z.string().trim().max(255).email("Ungültige E-Mail").optional().or(z.literal("")),
  website: optionalString(255),


  slogan: optionalString(300),
  bio_third_person: optionalString(2000),
  short_vita: optionalString(2000),

  topic_suggestions: optionalString(2000),
  hot_topic_1: optionalString(300),
  hot_topic_2: optionalString(300),
  hot_topic_3: optionalString(300),

  social_youtube: optionalString(255),
  social_facebook: optionalString(255),
  social_instagram: optionalString(255),
  social_linkedin: optionalString(255),
  social_twitter: optionalString(255),
  social_telegram: optionalString(255),

  has_newsletter: z.enum(["ja", "nein"]).optional(),
  email_list_size: z.coerce.number().int().min(0).optional().or(z.literal("")),

  affiliate_available: z.enum(["ja", "nein"]).optional(),
  affiliate_registration_url: optionalString(255),

  aff_1_name: optionalString(160),
  aff_1_url: optionalString(255),
  aff_1_freebie: optionalString(255),
  aff_1_ebook: optionalString(255),
  aff_2_name: optionalString(160),
  aff_2_url: optionalString(255),
  aff_2_freebie: optionalString(255),
  aff_2_ebook: optionalString(255),
  aff_3_name: optionalString(160),
  aff_3_url: optionalString(255),
  aff_3_freebie: optionalString(255),
  aff_3_ebook: optionalString(255),

  // Im Admin-Modus nicht Teil des Formulars — pauschal true gesetzt, um Typkompatibilität
  // mit SpeakerFormValues zu wahren.
  agb_accepted: z.any().optional(),
  privacy_accepted: z.any().optional(),
});
