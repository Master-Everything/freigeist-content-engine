import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { speakerSchema, speakerAdminSchema, SpeakerFormValues } from "@/lib/validation/speaker-schema";
import { convertToWebP } from "@/lib/image-utils";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { CharCounter } from "@/components/ui/char-counter";
import { ClipboardList, Loader2, Send, Upload, CheckCircle2 } from "lucide-react";
import { useWatch } from "react-hook-form";

const FIELD_MAX: Record<string, number> = {
  first_name: 80,
  last_name: 80,
  title_role: 160,
  industry: 120,
  phone: 40,
  email: 255,
  website: 255,
  slogan: 300,
  bio_third_person: 2000,
  short_vita: 2000,
  topic_suggestions: 2000,
  hot_topic_1: 300,
  hot_topic_2: 300,
  hot_topic_3: 300,
  social_youtube: 255,
  social_facebook: 255,
  social_instagram: 255,
  social_linkedin: 255,
  social_twitter: 255,
  social_telegram: 255,
  affiliate_registration_url: 255,
  aff_1_name: 160, aff_1_url: 255, aff_1_freebie: 255, aff_1_ebook: 255,
  aff_2_name: 160, aff_2_url: 255, aff_2_freebie: 255, aff_2_ebook: 255,
  aff_3_name: 160, aff_3_url: 255, aff_3_freebie: 255, aff_3_ebook: 255,
};

function textareaHeightFor(max: number): string {
  if (max <= 300) return "min-h-[6rem]";
  if (max <= 800) return "min-h-[10rem]";
  if (max <= 1500) return "min-h-[16rem]";
  return "min-h-[20rem]";
}

function WatchedCounter({ control, name, max }: { control: any; name: string; max: number }) {
  const value = useWatch({ control, name });
  return <CharCounter current={typeof value === "string" ? value.length : 0} max={max} />;
}

interface Props {
  existing: any | null;
  userId: string;
  userEmail: string;
  /** "self" = Speaker füllt eigenes Profil, "admin" = Admin legt im Auftrag an */
  mode?: "self" | "admin";
  /** Nur im Admin-Modus: id des bestehenden Datensatzes (falls edit) */
  initialSpeakerId?: string | null;
  /** Nur im Admin-Modus: Callback nach erfolgreichem Insert (id des neuen Datensatzes) */
  onCreated?: (id: string) => void;
}

const sections = [
  { id: "personal", label: "Persönliche Informationen" },
  { id: "profile", label: "Profil & Bio" },
  { id: "topics", label: "Interview-Themen" },
  { id: "social", label: "Social Media" },
  { id: "newsletter", label: "Newsletter & Reichweite" },
  { id: "affiliate", label: "Affiliate & Produkte" },
  { id: "legal", label: "Rechtliches" },
];

export default function SpeakerForm({
  existing,
  userId,
  userEmail,
  mode = "self",
  initialSpeakerId = null,
  onCreated,
}: Props) {
  const navigate = useNavigate();
  const isAdminMode = mode === "admin";
  const [submitting, setSubmitting] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(existing?.avatar_url ?? null);
  const fileRef = useRef<HTMLInputElement>(null);


  const social = (existing?.social_links as Record<string, string>) || {};
  const hot: string[] = Array.isArray(existing?.hot_topics) ? existing.hot_topics : [];
  const affs: any[] = Array.isArray(existing?.top_affiliate_products)
    ? existing.top_affiliate_products
    : [];

  const form = useForm<SpeakerFormValues>({
    resolver: zodResolver((isAdminMode ? speakerAdminSchema : speakerSchema) as any),
    defaultValues: {
      salutation: existing?.salutation || undefined,
      first_name: existing?.first_name || "",
      last_name: existing?.last_name || "",
      title_role: existing?.title_role || "",
      industry: existing?.industry || "",
      phone: existing?.phone || "",
      email: existing?.email || userEmail,
      website: existing?.website || "",
      slogan: existing?.slogan || "",
      bio_third_person: existing?.bio_third_person || "",
      short_vita: existing?.short_vita || "",
      topic_suggestions: existing?.topic_suggestions || "",
      hot_topic_1: hot[0] || "",
      hot_topic_2: hot[1] || "",
      hot_topic_3: hot[2] || "",
      social_youtube: social.youtube || "",
      social_facebook: social.facebook || "",
      social_instagram: social.instagram || "",
      social_linkedin: social.linkedin || "",
      social_twitter: social.twitter || "",
      social_telegram: social.telegram || "",
      has_newsletter: existing?.has_newsletter === true ? "ja" : existing?.has_newsletter === false ? "nein" : undefined,
      email_list_size: existing?.email_list_size ?? 0,
      affiliate_available: existing?.affiliate_available === true ? "ja" : existing?.affiliate_available === false ? "nein" : undefined,
      affiliate_registration_url: existing?.affiliate_registration_url || "",
      aff_1_name: affs[0]?.name || "",
      aff_1_url: affs[0]?.url || "",
      aff_1_freebie: affs[0]?.freebie || "",
      aff_1_ebook: affs[0]?.ebook || "",
      aff_2_name: affs[1]?.name || "",
      aff_2_url: affs[1]?.url || "",
      aff_2_freebie: affs[1]?.freebie || "",
      aff_2_ebook: affs[1]?.ebook || "",
      aff_3_name: affs[2]?.name || "",
      aff_3_url: affs[2]?.url || "",
      aff_3_freebie: affs[2]?.freebie || "",
      aff_3_ebook: affs[2]?.ebook || "",
      // Im Admin-Modus werden AGB/Datenschutz durch den Speaker beim späteren Owner-Handover
      // bestätigt — die Checkboxes werden ausgeblendet und pauschal gesetzt, damit die Zod-Schema
      // Literal-Constraint passt. Timestamps im Payload spiegeln aber die tatsächliche Zustimmung.
      agb_accepted: isAdminMode ? true : existing?.agb_accepted_at ? true : (undefined as any),
      privacy_accepted: isAdminMode ? true : existing?.privacy_accepted_at ? true : (undefined as any),
    },
  });

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      toast.error("Bild zu groß (max. 5 MB Original)");
      return;
    }
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile) return existing?.avatar_url ?? null;
    const webp = await convertToWebP(avatarFile);
    if (webp.size > 500_000) {
      toast.error("Profilbild über 500 KB nach Konvertierung – bitte kleineres Bild wählen");
      throw new Error("avatar too large");
    }
    // Admin-Anlage ohne user_id: Bilder im Admin-Namespace ablegen, damit Storage-RLS greift.
    const scope = isAdminMode ? `admin-${userId}` : userId;
    const path = `${scope}/avatar-${Date.now()}.webp`;
    const { error } = await supabase.storage
      .from("speaker-avatars")
      .upload(path, webp, { contentType: "image/webp", upsert: true });
    if (error) throw error;
    return path;
  };

  const onSubmit = async (values: SpeakerFormValues) => {
    // Avatar ist im Self-Modus Pflicht, im Admin-Modus optional.
    if (!isAdminMode && !avatarFile && !existing?.avatar_url) {
      toast.error("Bitte ein Profilbild hochladen");
      return;
    }
    setSubmitting(true);
    try {
      const avatar_url = await uploadAvatar();

      const basePayload = {
        salutation: values.salutation,
        first_name: values.first_name,
        last_name: values.last_name,
        title_role: values.title_role || null,
        industry: values.industry || null,
        phone: values.phone,
        email: values.email,
        website: values.website || null,
        slogan: values.slogan,
        bio_third_person: values.bio_third_person,
        short_vita: values.short_vita,
        avatar_url,
        topic_suggestions: values.topic_suggestions,
        hot_topics: [values.hot_topic_1, values.hot_topic_2, values.hot_topic_3].filter(Boolean),
        social_links: {
          youtube: values.social_youtube || "",
          facebook: values.social_facebook || "",
          instagram: values.social_instagram || "",
          linkedin: values.social_linkedin || "",
          twitter: values.social_twitter || "",
          telegram: values.social_telegram || "",
        },
        has_newsletter: values.has_newsletter === "ja",
        email_list_size: values.email_list_size,
        affiliate_available: values.affiliate_available === "ja",
        affiliate_registration_url: values.affiliate_registration_url || null,
        top_affiliate_products: [
          { name: values.aff_1_name, url: values.aff_1_url, freebie: values.aff_1_freebie, ebook: values.aff_1_ebook },
          { name: values.aff_2_name, url: values.aff_2_url, freebie: values.aff_2_freebie, ebook: values.aff_2_ebook },
          { name: values.aff_3_name, url: values.aff_3_url, freebie: values.aff_3_freebie, ebook: values.aff_3_ebook },
        ].filter((a) => a.name || a.url),
      };

      if (isAdminMode) {
        // Schnellerfassung: leere Strings → null für alle optionalen Felder, damit die DB
        // sauber bleibt und Enum-Spalten (has_newsletter, affiliate_available) nicht mit ""
        // befüllt werden. Dank Migration ist first_name jetzt nullable — kein Sonderfall nötig.
        const nn = <T,>(v: T): T | null =>
          v === "" || v === undefined ? null : v;
        const adminPayload: any = {
          salutation: nn(values.salutation),
          first_name: nn(values.first_name),
          last_name: values.last_name,
          title_role: nn(values.title_role),
          industry: nn(values.industry),
          phone: nn(values.phone),
          email: values.email,
          website: nn(values.website),
          slogan: nn(values.slogan),
          bio_third_person: nn(values.bio_third_person),
          short_vita: nn(values.short_vita),
          avatar_url,
          topic_suggestions: nn(values.topic_suggestions),
          hot_topics: [values.hot_topic_1, values.hot_topic_2, values.hot_topic_3].filter(Boolean),
          social_links: basePayload.social_links,
          has_newsletter:
            values.has_newsletter === "ja" ? true : values.has_newsletter === "nein" ? false : null,
          email_list_size:
            values.email_list_size == null || (values.email_list_size as any) === ""
              ? null
              : Number(values.email_list_size),
          affiliate_available:
            values.affiliate_available === "ja"
              ? true
              : values.affiliate_available === "nein"
              ? false
              : null,
          affiliate_registration_url: nn(values.affiliate_registration_url),
          top_affiliate_products: basePayload.top_affiliate_products,
          agb_accepted_at: null,
          privacy_accepted_at: null,
        };
        if (initialSpeakerId) {
          const { error } = await supabase
            .from("speakers")
            .update(adminPayload)
            .eq("id", initialSpeakerId);
          if (error) throw error;
          toast.success("Profil gespeichert");
        } else {
          const { data: created, error } = await supabase
            .from("speakers")
            .insert({ ...adminPayload, user_id: null, created_by: userId } as any)
            .select("id")
            .single();
          if (error) throw error;
          toast.success("Speaker angelegt");
          if (created?.id && onCreated) onCreated(created.id);
          else navigate("/module/erfassung");
        }
      } else {
        // Self-Modus: unverändert — upsert über user_id
        const payload = {
          ...basePayload,
          user_id: userId,
          agb_accepted_at: values.agb_accepted ? new Date().toISOString() : null,
          privacy_accepted_at: values.privacy_accepted ? new Date().toISOString() : null,
        };
        const { error: spkErr } = await supabase
          .from("speakers")
          .upsert(payload, { onConflict: "user_id" })
          .select()
          .single();
        if (spkErr) throw spkErr;
        toast.success(existing ? "Profil aktualisiert" : "Anmeldung erfolgreich");
        navigate("/module/erfassung/danke");
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Fehler beim Speichern");
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-10 flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="rounded-lg border bg-card p-3">
            <ClipboardList className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground tabular-nums">Modul 1</div>
            <h1 className="font-display text-3xl font-bold tracking-tight">
              {isAdminMode
                ? existing
                  ? "Speaker-Profil bearbeiten"
                  : "Neuen Speaker anlegen"
                : "Anmeldung zum Freigeist Kongress"}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {isAdminMode
                ? "Im Auftrag anlegen. Owner-Zuweisung erfolgt später über die Übersicht."
                : "Registrieren Sie sich als Speaker oder Interview-Gast"}
            </p>
          </div>
        </div>
        {!isAdminMode && existing && (
          <Button onClick={() => navigate("/module/interview/neu")} size="lg">
            <Send className="mr-1.5 h-4 w-4" />
            Neues Interview anstoßen
          </Button>
        )}
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_220px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {isAdminMode && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm text-foreground">
                <strong className="font-semibold">Schnellerfassung:</strong>{" "}
                Nur <em>Nachname</em> und <em>E-Mail</em> sind Pflicht. Alle weiteren Angaben
                können der Speaker oder du später ergänzen.
              </div>
            )}
            {/* PERSÖNLICH */}
            <Card id="personal">
              <CardHeader>
                <CardTitle>Persönliche Informationen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <FormField
                  control={form.control}
                  name="salutation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Anrede {!isAdminMode && <span className="text-primary">*</span>}</FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="flex gap-6"
                        >
                          {["Herr", "Frau", "Divers"].map((v) => (
                            <div key={v} className="flex items-center gap-2">
                              <RadioGroupItem value={v} id={`anr-${v}`} />
                              <Label htmlFor={`anr-${v}`} className="font-normal">{v}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-5 md:grid-cols-2">
                  <TextInput name="first_name" label="Vorname" required={!isAdminMode} form={form} />
                  <TextInput name="last_name" label="Nachname" required form={form} />
                  <TextAreaInput name="title_role" label="Titel & Berufsbezeichnung" form={form} />
                  <TextInput name="industry" label="Branche" form={form} />
                  <TextInput name="phone" label="Telefonnummer" required={!isAdminMode} form={form} />
                  <TextInput name="email" label="E-Mail-Adresse" type="email" required form={form} />
                  <TextInput name="website" label="Homepage" form={form} placeholder="https://..." />
                </div>
              </CardContent>
            </Card>

            {/* PROFIL */}
            <Card id="profile">
              <CardHeader>
                <CardTitle>Profil & Bio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <TextAreaInput name="slogan" label="Slogan, Motto, Leitsatz, Vision" required={!isAdminMode} form={form} />
                <TextAreaInput
                  name="bio_third_person"
                  label="Ich über mich in 3. Person"
                  required={!isAdminMode}
                  form={form}
                  rows={4}
                />
                <TextAreaInput
                  name="short_vita"
                  label="Kurze Vita"
                  required={!isAdminMode}
                  form={form}
                  rows={5}
                  help="Wer du bist, was du machst und warum dein Thema wichtig ist."
                />

                <div>
                  <Label className="text-sm font-medium">
                    Profilbild {!isAdminMode && <span className="text-primary">*</span>}
                  </Label>
                  <p className="mt-1 mb-2 text-xs text-muted-foreground">
                    Bitte ein klares Profilbild hochladen. Max. 500 KB (wird automatisch optimiert).
                  </p>
                  <div className="flex items-center gap-4">
                    {avatarPreview && (
                      <img
                        src={avatarPreview.startsWith("http") || avatarPreview.startsWith("blob:")
                          ? avatarPreview
                          : supabase.storage.from("speaker-avatars").getPublicUrl(avatarPreview).data.publicUrl}
                        alt="Vorschau"
                        className="h-20 w-20 rounded-full border object-cover"
                      />
                    )}
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileRef}
                        onChange={onFileChange}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileRef.current?.click()}
                      >
                        <Upload className="mr-1.5 h-4 w-4" />
                        Bild auswählen
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* THEMEN */}
            <Card id="topics">
              <CardHeader>
                <CardTitle>Interview-Themen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <TextAreaInput
                  name="topic_suggestions"
                  label="Interview-Themenvorschläge"
                  required
                  form={form}
                  rows={3}
                />
                <div>
                  <Label className="text-sm font-medium">3 brandaktuelle Themen</Label>
                  <div className="mt-2 space-y-3">
                    {[1, 2, 3].map((i) => {
                      const name = `hot_topic_${i}`;
                      const max = FIELD_MAX[name];
                      return (
                        <div key={i}>
                          <div className="flex items-start gap-3">
                            <span className="w-6 pt-2 text-sm text-muted-foreground tabular-nums">{i}.</span>
                            <Textarea
                              {...form.register(name as any)}
                              placeholder={`Thema ${i}`}
                              maxLength={max}
                              className="min-h-[6rem] flex-1"
                            />
                          </div>
                          <WatchedCounter control={form.control} name={name} max={max} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SOCIAL */}
            <Card id="social">
              <CardHeader>
                <CardTitle>Social Media</CardTitle>
                <CardDescription>URLs Ihrer Profile (optional)</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5 md:grid-cols-2">
                <TextInput name="social_youtube" label="YouTube" form={form} placeholder="https://..." />
                <TextInput name="social_facebook" label="Facebook" form={form} placeholder="https://..." />
                <TextInput name="social_instagram" label="Instagram" form={form} placeholder="https://..." />
                <TextInput name="social_linkedin" label="LinkedIn" form={form} placeholder="https://..." />
                <TextInput name="social_twitter" label="Twitter / X" form={form} placeholder="https://..." />
                <TextInput name="social_telegram" label="Telegram" form={form} placeholder="https://..." />
              </CardContent>
            </Card>

            {/* NEWSLETTER */}
            <Card id="newsletter">
              <CardHeader>
                <CardTitle>Newsletter & Reichweite</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <FormField
                  control={form.control}
                  name="has_newsletter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Newsletter-Anmeldung auf Homepage <span className="text-primary">*</span></FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="flex gap-6"
                        >
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value="ja" id="nl-ja" />
                            <Label htmlFor="nl-ja" className="font-normal">Ja</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value="nein" id="nl-nein" />
                            <Label htmlFor="nl-nein" className="font-normal">Nein</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <TextInput
                  name="email_list_size"
                  label="Größe Ihrer E-Mail-Liste"
                  type="number"
                  required
                  form={form}
                  help="Wie viele Kontakte werden Sie nutzen, um den Freigeist Kongress zu bewerben?"
                />
              </CardContent>
            </Card>

            {/* AFFILIATE */}
            <Card id="affiliate">
              <CardHeader>
                <CardTitle>Affiliate & Produkte</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <FormField
                  control={form.control}
                  name="affiliate_available"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Affiliate-Anmeldung möglich? <span className="text-primary">*</span></FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="flex gap-6"
                        >
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value="ja" id="aff-ja" />
                            <Label htmlFor="aff-ja" className="font-normal">Ja</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value="nein" id="aff-nein" />
                            <Label htmlFor="aff-nein" className="font-normal">Nein</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <TextInput
                  name="affiliate_registration_url"
                  label="Affiliate-Registrierungslink"
                  form={form}
                  placeholder="https://..."
                  help="Wo können wir uns registrieren? (z. B. Digistore)"
                />

                <div>
                  <Label className="text-sm font-medium">Top 3 Affiliate-Produkte</Label>
                  <div className="mt-3 space-y-5">
                    {[1, 2, 3].map((i) => {
                      const fields = [
                        { key: `aff_${i}_name`, placeholder: "Produkt" },
                        { key: `aff_${i}_url`, placeholder: "URL" },
                        { key: `aff_${i}_freebie`, placeholder: "Freebie URL" },
                        { key: `aff_${i}_ebook`, placeholder: "E-Book URL" },
                      ];
                      return (
                        <div key={i} className="rounded-lg border bg-muted/20 p-4 space-y-3">
                          <div className="text-xs font-medium text-muted-foreground tabular-nums">
                            Produkt {i}
                          </div>
                          <div>
                            <Textarea
                              {...form.register(fields[0].key as any)}
                              placeholder={fields[0].placeholder}
                              maxLength={FIELD_MAX[fields[0].key]}
                              className="min-h-[6rem]"
                            />
                            <WatchedCounter control={form.control} name={fields[0].key} max={FIELD_MAX[fields[0].key]} />
                          </div>
                          <div className="grid gap-3 md:grid-cols-3">
                            {fields.slice(1).map((f) => (
                              <div key={f.key}>
                                <Input
                                  {...form.register(f.key as any)}
                                  placeholder={f.placeholder}
                                  maxLength={FIELD_MAX[f.key]}
                                />
                                <WatchedCounter control={form.control} name={f.key} max={FIELD_MAX[f.key]} />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* RECHTLICHES — im Admin-Modus ausgeblendet (Speaker bestätigt später selbst) */}
            {!isAdminMode && (
              <Card id="legal">
                <CardHeader>
                  <CardTitle>Rechtliches</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <FormField
                    control={form.control}
                    name="agb_accepted"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-start gap-3">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="mt-0.5"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-tight">
                            <FormLabel className="font-normal">
                              AGB-Bestätigung inkl. E-Mail-Promotion <span className="text-primary">*</span>
                            </FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Mit der Einreichung bestätige ich, die AGB zu akzeptieren und meine
                              E-Mail-Liste mindestens dreimal vor dem Kongress mit dem Link
                              freigeistkongress.com anzuschreiben.
                            </p>
                            <FormMessage />
                          </div>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="privacy_accepted"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-start gap-3">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="mt-0.5"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-tight">
                            <FormLabel className="font-normal">
                              Datenschutz <span className="text-primary">*</span>
                            </FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Ich bestätige die Datenschutzbestimmungen und die Verarbeitung meiner
                              Daten. (Bestätigungs-E-Mail folgt.)
                            </p>
                            <FormMessage />
                          </div>
                        </div>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {isAdminMode ? (
              <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
                Du legst dieses Profil im Auftrag an. AGB und Datenschutz werden vom Speaker
                später beim Owner-Handover selbst bestätigt.
              </div>
            ) : (
              <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
                Ihre Daten werden sicher verarbeitet. Sie erhalten eine Bestätigungs-E-Mail.
              </div>
            )}

            <div className="flex justify-end">
              <Button type="submit" size="lg" disabled={submitting} className="min-w-[220px]">
                {submitting ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-1.5 h-4 w-4" />
                )}
                {isAdminMode
                  ? existing
                    ? "Änderungen speichern"
                    : "Speaker anlegen"
                  : existing
                  ? "Profil speichern"
                  : "Anmeldung absenden"}
              </Button>
            </div>
          </form>
        </Form>

        {/* Sticky Sektions-Nav */}
        <aside className="hidden lg:block">
          <div className="sticky top-6 rounded-lg border bg-card p-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Abschnitte
            </div>
            <nav className="space-y-1">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="block rounded px-2 py-1.5 text-sm text-foreground/80 hover:bg-accent/40 hover:text-foreground"
                >
                  {s.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>
      </div>
    </div>
  );
}

function TextInput({
  name,
  label,
  required,
  form,
  type = "text",
  placeholder,
  help,
}: any) {
  const max = FIELD_MAX[name];
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label} {required && <span className="text-primary">*</span>}
          </FormLabel>
          <FormControl>
            <Input type={type} placeholder={placeholder} maxLength={max} {...field} />
          </FormControl>
          {help && <FormDescription>{help}</FormDescription>}
          <FormMessage />
          {max && type !== "number" && (
            <CharCounter
              current={typeof field.value === "string" ? field.value.length : 0}
              max={max}
            />
          )}
        </FormItem>
      )}
    />
  );
}

function TextAreaInput({ name, label, required, form, rows, help }: any) {
  const max = FIELD_MAX[name];
  const heightClass = max ? textareaHeightFor(max) : "";
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label} {required && <span className="text-primary">*</span>}
          </FormLabel>
          <FormControl>
            <Textarea rows={rows} maxLength={max} className={heightClass} {...field} />
          </FormControl>
          {help && <FormDescription>{help}</FormDescription>}
          <FormMessage />
          {max && (
            <CharCounter
              current={typeof field.value === "string" ? field.value.length : 0}
              max={max}
            />
          )}
        </FormItem>
      )}
    />
  );
}
