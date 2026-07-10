import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  interviewSchema,
  type InterviewFormValues,
} from "@/lib/validation/interview-schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Loader2, Send, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { InterviewFieldset, type AffiliateEntry } from "./InterviewFieldset";

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
          <InterviewFieldset
            form={form}
            affiliates={affiliates}
            selectedAffiliateIndices={selectedAffiliateIndices}
            toggleAffiliate={toggleAffiliate}
          />
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
