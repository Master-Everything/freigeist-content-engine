import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Send, ClipboardList, Info } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

type AffiliateEntry = { name?: string; url?: string; freebie?: string; ebook?: string };

export default function InterviewForm() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [speaker, setSpeaker] = useState<any | null>(null);

  const [form, setForm] = useState({
    interview_title: "",
    interview_topic: "",
    product: "",
    product_market_since: "",
    previous_interviews: "",
    critical_voices: "",
    selected_affiliate_indices: [] as number[],
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

  const update = (field: keyof typeof form, value: any) =>
    setForm((f) => ({ ...f, [field]: value }));

  const toggleAffiliate = (idx: number) => {
    setForm((f) => ({
      ...f,
      selected_affiliate_indices: f.selected_affiliate_indices.includes(idx)
        ? f.selected_affiliate_indices.filter((i) => i !== idx)
        : [...f.selected_affiliate_indices, idx],
    }));
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.interview_title.trim()) {
      toast.error("Interview-Titel ist Pflicht");
      return;
    }
    if (!speaker) {
      toast.error("Bitte zuerst dein Profil ausfüllen");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("posts").insert({
        speaker_id: speaker.id,
        guest_name: `${speaker.first_name} ${speaker.last_name}`.trim(),
        interview_title: form.interview_title,
        status: "erfassung",
        guest_short_bio: speaker.bio_third_person,
        guest_website_url: speaker.website,
        guest_image_url: speaker.avatar_url
          ? supabase.storage.from("speaker-avatars").getPublicUrl(speaker.avatar_url).data.publicUrl
          : null,
        interview_topic: form.interview_topic || null,
        product: form.product || null,
        product_market_since: form.product_market_since || null,
        previous_interviews: form.previous_interviews || null,
        critical_voices: form.critical_voices || null,
        selected_affiliate_indices: form.selected_affiliate_indices,
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

      <form onSubmit={onSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Eckdaten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="interview_title">Interview-Titel *</Label>
              <Input
                id="interview_title"
                value={form.interview_title}
                onChange={(e) => update("interview_title", e.target.value)}
                placeholder="z. B. Bewusstsein und Transformation"
              />
            </div>
            <div>
              <Label htmlFor="interview_topic">Thema des Interviews</Label>
              <Textarea
                id="interview_topic"
                value={form.interview_topic}
                onChange={(e) => update("interview_topic", e.target.value)}
                rows={3}
                placeholder="Worum geht es inhaltlich?"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Produkt</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="product">Produkt, über das gesprochen wird</Label>
              <Textarea
                id="product"
                value={form.product}
                onChange={(e) => update("product", e.target.value)}
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="product_market_since">Wie lange ist das Produkt bereits am Markt?</Label>
              <Input
                id="product_market_since"
                value={form.product_market_since}
                onChange={(e) => update("product_market_since", e.target.value)}
                placeholder="z. B. seit 2 Jahren"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Kontext & Risiken</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="previous_interviews">
                Vorherige Interviews zu diesem Thema oder Produkt
              </Label>
              <Textarea
                id="previous_interviews"
                value={form.previous_interviews}
                onChange={(e) => update("previous_interviews", e.target.value)}
                rows={3}
                placeholder="Links oder Titel auflisten"
              />
            </div>
            <div>
              <Label htmlFor="critical_voices">
                Kritische Stimmen oder rechtliche Schwierigkeiten?
              </Label>
              <Textarea
                id="critical_voices"
                value={form.critical_voices}
                onChange={(e) => update("critical_voices", e.target.value)}
                rows={3}
                placeholder="Alles Relevante, das wir kennen sollten"
              />
            </div>
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
            {affiliates.length === 0 ? (
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
                  const checked = form.selected_affiliate_indices.includes(idx);
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
    </div>
  );
}
