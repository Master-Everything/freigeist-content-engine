import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  interviewSchema,
  INTERVIEW_FIELD_MAX,
  type InterviewFormValues,
} from "@/lib/validation/interview-schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CharCounter } from "@/components/ui/char-counter";
import { Loader2, Send, ClipboardList, Info } from "lucide-react";
import { toast } from "sonner";

type AffiliateEntry = { name?: string; url?: string; freebie?: string; ebook?: string };

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

export default function InterviewForm() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [speaker, setSpeaker] = useState<any | null>(null);
  const [selectedAffiliateIndices, setSelectedAffiliateIndices] = useState<number[]>([]);

  const form = useForm<InterviewFormValues>({
    resolver: zodResolver(interviewSchema),
    defaultValues: {
      interview_title: "",
      interview_topic: "",
      product: "",
      product_market_since: "",
      previous_interviews: "",
      critical_voices: "",
    },
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("speakers")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      setSpeaker(data);
      setLoading(false);
    })();
  }, [user]);

  const affiliates: AffiliateEntry[] = Array.isArray(speaker?.top_affiliate_products)
    ? (speaker.top_affiliate_products as AffiliateEntry[])
    : [];

  const toggleAffiliate = (idx: number) => {
    setSelectedAffiliateIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  async function onSubmit(values: InterviewFormValues) {
    if (!speaker) {
      toast.error("Bitte zuerst dein Profil ausfüllen");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("posts").insert({
        speaker_id: speaker.id,
        guest_name: `${speaker.first_name} ${speaker.last_name}`.trim(),
        interview_title: values.interview_title,
        status: "erfassung",
        guest_short_bio: speaker.bio_third_person,
        guest_website_url: speaker.website,
        guest_image_url: speaker.avatar_url
          ? supabase.storage.from("speaker-avatars").getPublicUrl(speaker.avatar_url).data.publicUrl
          : null,
        interview_topic: values.interview_topic || null,
        product: values.product || null,
        product_market_since: values.product_market_since || null,
        previous_interviews: values.previous_interviews || null,
        critical_voices: values.critical_voices || null,
        selected_affiliate_indices: selectedAffiliateIndices,
      } as any);
      if (error) throw error;
      toast.success("Interview angelegt");
      navigate(role === "admin" ? "/module/interview-beitraege" : "/module/interview-beitraege/mine");
    } catch (err: any) {
      toast.error(err.message || "Fehler beim Speichern");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!speaker) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Profil fehlt</CardTitle>
            <CardDescription>
              Bitte fülle zuerst dein Speaker-Profil aus, bevor du ein Interview anlegst.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/module/erfassung">Zum Profil</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8 flex items-start gap-4">
        <div className="rounded-lg border bg-card p-3">
          <ClipboardList className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Neues Interview anlegen</h1>
          <p className="mt-1 text-muted-foreground">
            Erfasse die wichtigsten Eckdaten zu deinem Interview. Inhalte erstellen wir später im Editor.
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Eckdaten</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <TextInput
                name="interview_title"
                label="Interview-Titel"
                required
                form={form}
                placeholder="z. B. Bewusstsein und Transformation"
              />
              <TextAreaInput
                name="interview_topic"
                label="Thema des Interviews"
                form={form}
                placeholder="Worum geht es inhaltlich?"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Produkt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <TextAreaInput
                name="product"
                label="Produkt, über das gesprochen wird"
                form={form}
              />
              <TextInput
                name="product_market_since"
                label="Wie lange ist das Produkt bereits am Markt?"
                form={form}
                placeholder="z. B. seit 2 Jahren"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Kontext & Risiken</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <TextAreaInput
                name="previous_interviews"
                label="Vorherige Interviews zu diesem Thema oder Produkt"
                form={form}
                placeholder="Links oder Titel auflisten"
              />
              <TextAreaInput
                name="critical_voices"
                label="Kritische Stimmen oder rechtliche Schwierigkeiten?"
                form={form}
                placeholder="Alles Relevante, das wir kennen sollten"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Affiliate-Produkte</CardTitle>
              <CardDescription>
                Wähle aus den im Profil hinterlegten Affiliate-Produkten aus, welche zu diesem Interview passen.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {affiliates.filter((a) => a?.name || a?.url).length === 0 ? (
                <div className="flex items-start gap-2 rounded-md border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    Du hast noch keine Affiliate-Produkte in deinem Profil hinterlegt.{" "}
                    <Link to="/module/erfassung" className="text-primary underline">
                      Im Profil ergänzen
                    </Link>
                    .
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {affiliates.map((aff, idx) => {
                    if (!aff?.name && !aff?.url) return null;
                    const checked = selectedAffiliateIndices.includes(idx);
                    return (
                      <label
                        key={idx}
                        className="flex cursor-pointer items-start gap-3 rounded-md border p-3 hover:bg-muted/40"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleAffiliate(idx)}
                          className="mt-0.5"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium">{aff.name || "(ohne Name)"}</div>
                          {aff.url && (
                            <div className="truncate text-xs text-muted-foreground">{aff.url}</div>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={submitting} className="min-w-[200px]">
              {submitting ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-1.5 h-4 w-4" />
              )}
              Interview anlegen
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

function TextInput({
  name,
  label,
  required,
  form,
  placeholder,
}: {
  name: keyof InterviewFormValues;
  label: string;
  required?: boolean;
  form: any;
  placeholder?: string;
}) {
  const max = INTERVIEW_FIELD_MAX[name];
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
            <Input placeholder={placeholder} maxLength={max} {...field} />
          </FormControl>
          <FormMessage />
          <WatchedCounter control={form.control} name={name} max={max} />
        </FormItem>
      )}
    />
  );
}

function TextAreaInput({
  name,
  label,
  required,
  form,
  placeholder,
}: {
  name: keyof InterviewFormValues;
  label: string;
  required?: boolean;
  form: any;
  placeholder?: string;
}) {
  const max = INTERVIEW_FIELD_MAX[name];
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
            <Textarea
              placeholder={placeholder}
              maxLength={max}
              className={textareaHeightFor(max)}
              {...field}
            />
          </FormControl>
          <FormMessage />
          <WatchedCounter control={form.control} name={name} max={max} />
        </FormItem>
      )}
    />
  );
}
