import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SourceFormData } from "@/types/post";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function NewPost() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<SourceFormData>({
    guest_name: "",
    interview_title: "",
    youtube_url: "",
    newsletter_text: "",
    telegram_text: "",
    guest_website: "",
    guest_profile_text: "",
    prettylink_shortcodes: "",
  });

  const update = (field: keyof SourceFormData, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  async function handleAnalyze() {
    if (!form.guest_name.trim() || !form.interview_title.trim()) {
      toast({ title: "Fehler", description: "Gastname und Interview-Titel sind Pflichtfelder.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // 1. Create post in DB
      const { data: post, error: insertError } = await supabase
        .from("posts")
        .insert({
          guest_name: form.guest_name,
          interview_title: form.interview_title,
          youtube_url: form.youtube_url || null,
          newsletter_text: form.newsletter_text || null,
          telegram_text: form.telegram_text || null,
          guest_website: form.guest_website || null,
          guest_profile_text: form.guest_profile_text || null,
          prettylink_shortcodes: form.prettylink_shortcodes || null,
          status: "in_progress",
        })
        .select()
        .single();

      if (insertError || !post) throw new Error(insertError?.message || "Insert failed");

      // 2. Call AI generation
      const { data: aiData, error: aiError } = await supabase.functions.invoke("generate-content", {
        body: form,
      });

      if (aiError) {
        console.error("AI error:", aiError);
        toast({ title: "AI-Generierung fehlgeschlagen", description: "Beitrag wurde als Entwurf gespeichert. Sie können die Blöcke manuell bearbeiten.", variant: "destructive" });
        navigate(`/edit/${post.id}`);
        return;
      }

      // 3. Save generated blocks
      const blocks = {
        headline: aiData.headline || form.interview_title,
        excerpt: aiData.excerpt || "",
        youtube_url: form.youtube_url || "",
        summary_title: aiData.summary_title || "",
        summary_lead: aiData.summary_lead || "",
        summary_bullets: aiData.summary_bullets || [],
        guest_bio: aiData.guest_bio || "",
        section1_title: aiData.section1_title || "",
        section1_content: aiData.section1_content || "",
        section2_title: aiData.section2_title || "",
        section2_content: aiData.section2_content || "",
        section3_title: aiData.section3_title || "",
        section3_content: aiData.section3_content || "",
      };

      await supabase.from("posts").update({ blocks }).eq("id", post.id);

      toast({ title: "Erfolg!", description: "Inhalte wurden generiert." });
      navigate(`/edit/${post.id}`);
    } catch (e) {
      console.error(e);
      toast({ title: "Fehler", description: e instanceof Error ? e.message : "Unbekannter Fehler", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" /> Zurück
        </Button>

        <h1 className="font-display text-3xl font-bold tracking-tight mb-2">
          Neuer Interview-Beitrag
        </h1>
        <p className="text-muted-foreground mb-8">
          Quelldaten eingeben, dann AI-gestützt Inhalte generieren.
        </p>

        <div className="space-y-6">
          {/* Required fields */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pflichtfelder</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="guest_name">Gastname *</Label>
                <Input id="guest_name" value={form.guest_name} onChange={(e) => update("guest_name", e.target.value)} placeholder="z.B. Dr. Max Mustermann" />
              </div>
              <div>
                <Label htmlFor="interview_title">Interview-Titel *</Label>
                <Input id="interview_title" value={form.interview_title} onChange={(e) => update("interview_title", e.target.value)} placeholder="z.B. Bewusstsein und Transformation" />
              </div>
              <div>
                <Label htmlFor="youtube_url">YouTube Video URL</Label>
                <Input id="youtube_url" value={form.youtube_url} onChange={(e) => update("youtube_url", e.target.value)} placeholder="https://youtube.com/watch?v=..." />
              </div>
            </CardContent>
          </Card>

          {/* Optional fields */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Optionale Quelldaten</CardTitle>
              <CardDescription>Mehr Kontext liefert bessere AI-Ergebnisse.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="newsletter_text">Newsletter-Text</Label>
                <Textarea id="newsletter_text" value={form.newsletter_text} onChange={(e) => update("newsletter_text", e.target.value)} placeholder="Newsletter-Inhalt einfügen..." rows={4} />
              </div>
              <div>
                <Label htmlFor="telegram_text">Telegram-Post</Label>
                <Textarea id="telegram_text" value={form.telegram_text} onChange={(e) => update("telegram_text", e.target.value)} placeholder="Telegram-Nachricht einfügen..." rows={3} />
              </div>
              <div>
                <Label htmlFor="guest_website">Gast-Website URL</Label>
                <Input id="guest_website" value={form.guest_website} onChange={(e) => update("guest_website", e.target.value)} placeholder="https://..." />
              </div>
              <div>
                <Label htmlFor="guest_profile_text">Gast-Profiltext</Label>
                <Textarea id="guest_profile_text" value={form.guest_profile_text} onChange={(e) => update("guest_profile_text", e.target.value)} placeholder="Biografie oder Profil-Beschreibung..." rows={4} />
              </div>
              <div>
                <Label htmlFor="prettylink_shortcodes">PrettyLink Shortcode(s)</Label>
                <Input id="prettylink_shortcodes" value={form.prettylink_shortcodes} onChange={(e) => update("prettylink_shortcodes", e.target.value)} placeholder="[prettylink link=...]" />
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleAnalyze} disabled={loading} size="lg" className="w-full gap-2">
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Analyse läuft...</>
            ) : (
              <><Sparkles className="h-4 w-4" /> Inhalte analysieren & generieren</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
