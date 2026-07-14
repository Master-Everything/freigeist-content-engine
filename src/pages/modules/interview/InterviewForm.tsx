import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Send, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { InterviewFieldset, type AffiliateEntry } from "./InterviewFieldset";

type SpeakerLite = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url: string | null;
  bio_third_person: string | null;
  website: string | null;
  top_affiliate_products: any;
};

export default function InterviewForm() {
  const { user, role } = useAuth();
  const isAdmin = role === "admin";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedSpeakerId = searchParams.get("speaker_id");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [speaker, setSpeaker] = useState<any | null>(null);
  const [speakerOptions, setSpeakerOptions] = useState<SpeakerLite[]>([]);
  const [selectedSpeakerId, setSelectedSpeakerId] = useState<string | null>(
    preselectedSpeakerId
  );
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

  // Speaker-Datensatz laden — für Admin nach speaker_id, für Speaker nach eigenem user_id.
  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      if (isAdmin) {
        // Alle Speaker für Combobox
        const { data: list } = await supabase
          .from("speakers")
          .select("id, first_name, last_name, email, avatar_url, bio_third_person, website, top_affiliate_products")
          .order("first_name", { ascending: true });
        setSpeakerOptions((list as SpeakerLite[]) ?? []);
        if (selectedSpeakerId) {
          const { data } = await supabase
            .from("speakers")
            .select("*")
            .eq("id", selectedSpeakerId)
            .maybeSingle();
          setSpeaker(data);
        }
      } else {
        const { data } = await supabase
          .from("speakers")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        setSpeaker(data);
      }
      setLoading(false);
    })();
     
  }, [user, isAdmin, selectedSpeakerId]);

  const affiliates: AffiliateEntry[] = Array.isArray(speaker?.top_affiliate_products)
    ? (speaker.top_affiliate_products as AffiliateEntry[])
    : [];

  const toggleAffiliate = (idx: number) => {
    setSelectedAffiliateIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const canSubmit = useMemo(() => !!speaker, [speaker]);

  async function onSubmit(values: InterviewFormValues) {
    if (!speaker || !user) {
      toast.error(isAdmin ? "Bitte zuerst einen Speaker auswählen" : "Bitte zuerst dein Profil ausfüllen");
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
        created_by: user.id,
      } as any);
      if (error) throw error;
      toast.success("Interview angelegt");
      navigate(isAdmin ? "/module/erfassung" : "/module/interview-beitraege/mine");
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

  // Speaker-Rolle ohne eigenes Profil → Blocker
  if (!isAdmin && !speaker) {
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

      {isAdmin && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Speaker</CardTitle>
            <CardDescription>
              Wähle den Speaker, für den du dieses Interview anlegst.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Speaker auswählen</Label>
              <Select
                value={selectedSpeakerId ?? undefined}
                onValueChange={(v) => setSelectedSpeakerId(v)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Speaker auswählen…" />
                </SelectTrigger>
                <SelectContent>
                  {speakerOptions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.first_name} {s.last_name} · {s.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {speakerOptions.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Noch keine Speaker im System.{" "}
                <Link to="/module/erfassung/neu" className="text-primary underline">
                  Ersten Speaker anlegen
                </Link>
                .
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <fieldset disabled={!canSubmit} className="space-y-6 disabled:opacity-60">
            <InterviewFieldset
              form={form}
              affiliates={affiliates}
              selectedAffiliateIndices={selectedAffiliateIndices}
              toggleAffiliate={toggleAffiliate}
            />
          </fieldset>
          <div className="flex justify-end">
            <Button
              type="submit"
              size="lg"
              disabled={submitting || !canSubmit}
              className="min-w-[200px]"
            >
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
