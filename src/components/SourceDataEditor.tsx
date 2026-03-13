import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Post, PostBlocks } from "@/types/post";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronDown, ChevronRight, Download, Loader2, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface SourceDataEditorProps {
  post: Post;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPostUpdate: (post: Post) => void;
  onBlocksGenerated: (blocks: PostBlocks) => void;
}

export function SourceDataEditor({ post, open, onOpenChange, onPostUpdate, onBlocksGenerated }: SourceDataEditorProps) {
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const updateField = (field: keyof Post, value: string | null) => {
    onPostUpdate({ ...post, [field]: value });
  };

  async function handleFetchTranscript() {
    if (!post.youtube_url?.trim()) {
      toast({ title: "Fehler", description: "Bitte zuerst eine YouTube-URL eingeben.", variant: "destructive" });
      return;
    }
    setTranscriptLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("youtube-transcript", {
        body: { youtube_url: post.youtube_url },
      });
      if (error) throw error;
      if (data?.error) {
        toast({ title: "Kein Transkript gefunden", description: data.error, variant: "destructive" });
        return;
      }
      updateField("video_transcript" as keyof Post, data.transcript);
      toast({ title: "Transkript geladen", description: `Sprache: ${data.language}` });
    } catch (e) {
      console.error(e);
      toast({ title: "Fehler", description: e instanceof Error ? e.message : "Transkript konnte nicht geladen werden", variant: "destructive" });
    } finally {
      setTranscriptLoading(false);
    }
  }

  async function handleRegenerate() {
    setShowConfirm(false);
    setRegenerating(true);
    try {
      // Save source data first
      const { error: saveError } = await supabase.from("posts").update({
        guest_name: post.guest_name,
        interview_title: post.interview_title,
        youtube_url: post.youtube_url,
        newsletter_text: post.newsletter_text,
        telegram_text: post.telegram_text,
        guest_website_url: post.guest_website_url,
        guest_short_bio: post.guest_short_bio,
        prettylink_shortcodes: post.prettylink_shortcodes,
        video_transcript: (post as any).video_transcript || null,
      }).eq("id", post.id);
      if (saveError) throw saveError;

      // Call generate-content
      const { data: aiData, error: aiError } = await supabase.functions.invoke("generate-content", {
        body: {
          guest_name: post.guest_name,
          interview_title: post.interview_title,
          youtube_url: post.youtube_url || "",
          newsletter_text: post.newsletter_text || "",
          telegram_text: post.telegram_text || "",
          guest_website_url: post.guest_website_url || "",
          guest_short_bio: post.guest_short_bio || "",
          prettylink_shortcodes: post.prettylink_shortcodes || "",
          video_transcript: (post as any).video_transcript || "",
        },
      });

      if (aiError) throw aiError;

      const newBlocks: PostBlocks = {
        excerpt: aiData.excerpt || "",
        main_video_url: post.youtube_url || "",
        summary_box_title: aiData.summary_box_title || "",
        summary_lead: aiData.summary_lead || "",
        summary_paragraphs: aiData.summary_paragraphs || [],
        guest_short_bio: aiData.guest_short_bio || "",
        guest_website_cta: post.guest_website_url || "",
        section_1_title: aiData.section_1_title || "",
        section_1_body: aiData.section_1_body || "",
        section_2_title: aiData.section_2_title || "",
        section_2_body: aiData.section_2_body || "",
        section_3_title: aiData.section_3_title || "",
        section_3_body: aiData.section_3_body || "",
        section_4_title: aiData.section_4_title || "",
        section_4_body: aiData.section_4_body || "",
        section_5_title: aiData.section_5_title || "",
        section_5_body: aiData.section_5_body || "",
        section_6_title: aiData.section_6_title || "",
        section_6_body: aiData.section_6_body || "",
      };

      await supabase.from("posts").update({ blocks: newBlocks as any }).eq("id", post.id);
      onBlocksGenerated(newBlocks);
      toast({ title: "Erfolg!", description: "Inhalte wurden neu generiert." });
    } catch (e) {
      console.error(e);
      toast({ title: "Fehler", description: e instanceof Error ? e.message : "Generierung fehlgeschlagen", variant: "destructive" });
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <>
      <Collapsible open={open} onOpenChange={onOpenChange}>
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-center gap-2 rounded-md border bg-muted/50 px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors">
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            Quelldaten bearbeiten
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 space-y-4 rounded-md border bg-card p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs text-muted-foreground">Gastname *</Label>
              <Input value={post.guest_name} onChange={(e) => updateField("guest_name", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Interview-Titel *</Label>
              <Input value={post.interview_title} onChange={(e) => updateField("interview_title", e.target.value)} />
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">YouTube URL</Label>
            <div className="flex gap-2">
              <Input value={post.youtube_url || ""} onChange={(e) => updateField("youtube_url", e.target.value || null)} placeholder="https://youtube.com/watch?v=..." className="flex-1" />
              <Button type="button" variant="outline" size="sm" onClick={handleFetchTranscript} disabled={transcriptLoading || !post.youtube_url?.trim()} className="gap-2 shrink-0">
                {transcriptLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                Transcript
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Video-Transkript</Label>
            <Textarea value={(post as any).video_transcript || ""} onChange={(e) => updateField("video_transcript" as keyof Post, e.target.value || null)} rows={4} className="text-xs" placeholder="Transkript hier einfügen oder per Button laden…" />
            {(post as any).video_transcript && <p className="text-xs text-muted-foreground mt-1">{((post as any).video_transcript as string).length.toLocaleString()} Zeichen</p>}
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Newsletter-Text</Label>
            <Textarea value={post.newsletter_text || ""} onChange={(e) => updateField("newsletter_text", e.target.value || null)} rows={3} />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Telegram-Post</Label>
            <Textarea value={post.telegram_text || ""} onChange={(e) => updateField("telegram_text", e.target.value || null)} rows={2} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs text-muted-foreground">Gast-Website URL</Label>
              <Input value={post.guest_website_url || ""} onChange={(e) => updateField("guest_website_url", e.target.value || null)} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">PrettyLink Shortcodes</Label>
              <Input value={post.prettylink_shortcodes || ""} onChange={(e) => updateField("prettylink_shortcodes", e.target.value || null)} />
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Gast-Kurzbiografie</Label>
            <Textarea value={post.guest_short_bio || ""} onChange={(e) => updateField("guest_short_bio", e.target.value || null)} rows={3} />
          </div>

          <Button onClick={() => setShowConfirm(true)} disabled={regenerating} className="w-full gap-2">
            {regenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {regenerating ? "Generierung läuft..." : "Inhalte neu generieren"}
          </Button>
        </CollapsibleContent>
      </Collapsible>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Inhalte neu generieren?</AlertDialogTitle>
            <AlertDialogDescription>
              Alle aktuellen Block-Inhalte werden überschrieben. Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleRegenerate}>Neu generieren</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
