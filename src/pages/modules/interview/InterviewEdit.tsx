import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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
import { Loader2, Save, ClipboardList, Lock, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { InterviewFieldset, type AffiliateEntry } from "./InterviewFieldset";

// Status ab dem Speaker nicht mehr bearbeiten darf.
// Ab `redaktion_angefragt` verantwortet die Redaktion die Interview-Stammdaten.
const LOCKED_FOR_SPEAKER = new Set([
  "scan_pending",
  "scan_done",
  "redaktion_angefragt",
  "in_bearbeitung",
  "profil",
  "profil_review",
  "leitfaden",
  "leitfaden_final",
  "vorgespraech",
  "vorgespraech_done",
  "aufzeichnung",
  "aufzeichnung_done",
  "hub_pushed",
]);

export default function InterviewEdit() {
  const { id } = useParams<{ id: string }>();
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [post, setPost] = useState<any | null>(null);
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
    if (!id || !user) return;
    (async () => {
      const { data: p } = await supabase.from("posts").select("*").eq("id", id).maybeSingle();
      if (!p) {
        toast.error("Interview nicht gefunden");
        navigate(-1);
        return;
      }
      setPost(p);
      const { data: s } = await supabase
        .from("speakers")
        .select("*")
        .eq("id", p.speaker_id)
        .maybeSingle();
      setSpeaker(s);
      form.reset({
        interview_title: p.interview_title ?? "",
        interview_topic: p.interview_topic ?? "",
        product: p.product ?? "",
        product_market_since: p.product_market_since ?? "",
        previous_interviews: p.previous_interviews ?? "",
        critical_voices: p.critical_voices ?? "",
      });
      setSelectedAffiliateIndices(
        Array.isArray(p.selected_affiliate_indices) ? p.selected_affiliate_indices : []
      );
      setLoading(false);
    })();
     
  }, [id, user]);

  const isAdmin = role === "admin";
  const readOnly = !isAdmin && post && LOCKED_FOR_SPEAKER.has(post.status);

  const affiliates: AffiliateEntry[] = Array.isArray(speaker?.top_affiliate_products)
    ? (speaker.top_affiliate_products as AffiliateEntry[])
    : [];

  const toggleAffiliate = (idx: number) => {
    setSelectedAffiliateIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  async function onSubmit(values: InterviewFormValues) {
    if (!post || readOnly) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("posts")
        .update({
          interview_title: values.interview_title,
          interview_topic: values.interview_topic || null,
          product: values.product || null,
          product_market_since: values.product_market_since || null,
          previous_interviews: values.previous_interviews || null,
          critical_voices: values.critical_voices || null,
          selected_affiliate_indices: selectedAffiliateIndices,
        } as any)
        .eq("id", post.id);
      if (error) throw error;
      toast.success("Änderungen gespeichert");
      navigate(isAdmin ? "/module/interview-beitraege" : "/module/interview-beitraege/mine");
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

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-1.5 h-4 w-4" /> Zurück
      </Button>

      <div className="mb-8 flex items-start gap-4">
        <div className="rounded-lg border bg-card p-3">
          <ClipboardList className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Interview bearbeiten
          </h1>
          <p className="mt-1 text-muted-foreground">
            {readOnly
              ? "Nach Freigabe zum Scan kannst du das Interview nicht mehr ändern."
              : "Passe die Eckdaten deines Interviews an."}
          </p>
        </div>
      </div>

      {readOnly && (
        <Card className="mb-6 border-amber-500/40 bg-amber-500/5">
          <CardContent className="flex items-start gap-3 py-4">
            <Lock className="mt-0.5 h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Nur Ansicht</p>
              <p className="text-muted-foreground mt-0.5">
                Das Interview wurde zum Scan freigegeben. Änderungen sind nur noch durch die Redaktion möglich.{" "}
                <Link to="/module/interview-beitraege/mine" className="underline">Zur Übersicht</Link>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <InterviewFieldset
            form={form}
            affiliates={affiliates}
            selectedAffiliateIndices={selectedAffiliateIndices}
            toggleAffiliate={toggleAffiliate}
            disabled={readOnly}
          />
          {!readOnly && (
            <div className="flex justify-end">
              <Button type="submit" size="lg" disabled={submitting} className="min-w-[200px]">
                {submitting ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-1.5 h-4 w-4" />
                )}
                Änderungen speichern
              </Button>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}
