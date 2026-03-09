import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Post, PostBlocks } from "@/types/post";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Eye, Download, Save, Loader2, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { generateHTML } from "@/lib/export-html";
import { ThemeToggle } from "@/components/ThemeToggle";

const defaultBlocks: PostBlocks = {
  headline: "",
  excerpt: "",
  youtube_url: "",
  summary_title: "",
  summary_lead: "",
  summary_bullets: [],
  guest_bio: "",
  section1_title: "",
  section1_content: "",
  section2_title: "",
  section2_content: "",
  section3_title: "",
  section3_content: "",
};

export default function EditPost() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [blocks, setBlocks] = useState<PostBlocks>(defaultBlocks);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAdditionalVideo, setShowAdditionalVideo] = useState(false);
  const [showPrettyLink, setShowPrettyLink] = useState(false);
  const [showResources, setShowResources] = useState(false);

  useEffect(() => {
    if (id) loadPost(id);
  }, [id]);

  async function loadPost(postId: string) {
    const { data, error } = await supabase.from("posts").select("*").eq("id", postId).single();
    if (error || !data) {
      toast({ title: "Fehler", description: "Beitrag nicht gefunden.", variant: "destructive" });
      navigate("/");
      return;
    }
    const p = { ...data, blocks: data.blocks as unknown as PostBlocks | null } as Post;
    setPost(p);
    if (p.blocks) {
      setBlocks({ ...defaultBlocks, ...p.blocks });
      setShowAdditionalVideo(!!p.blocks.additional_video_url);
      setShowPrettyLink(!!p.blocks.prettylink_shortcodes);
      setShowResources(!!p.blocks.resources);
    } else {
      setBlocks({ ...defaultBlocks, youtube_url: p.youtube_url || "" });
    }
    setLoading(false);
  }

  const updateBlock = useCallback((field: keyof PostBlocks, value: any) => {
    setBlocks((b) => ({ ...b, [field]: value }));
  }, []);

  const updateBullet = useCallback((index: number, value: string) => {
    setBlocks((b) => {
      const bullets = [...b.summary_bullets];
      bullets[index] = value;
      return { ...b, summary_bullets: bullets };
    });
  }, []);

  const addBullet = () => setBlocks((b) => ({ ...b, summary_bullets: [...b.summary_bullets, ""] }));
  const removeBullet = (i: number) => setBlocks((b) => ({ ...b, summary_bullets: b.summary_bullets.filter((_, idx) => idx !== i) }));

  async function handleSave() {
    if (!id) return;
    setSaving(true);
    const { error } = await supabase.from("posts").update({ blocks: blocks as any }).eq("id", id);
    if (error) {
      toast({ title: "Fehler", description: "Speichern fehlgeschlagen.", variant: "destructive" });
    } else {
      toast({ title: "Gespeichert", description: "Änderungen wurden gespeichert." });
    }
    setSaving(false);
  }

  function handleExport() {
    if (!post) return;
    const html = generateHTML(blocks, post.guest_name);
    navigator.clipboard.writeText(html);
    toast({ title: "HTML kopiert!", description: "Der HTML-Code wurde in die Zwischenablage kopiert." });
    // Update status to exported
    supabase.from("posts").update({ status: "exported" }).eq("id", id);
  }

  async function handleDelete() {
    if (!id || !confirm("Beitrag wirklich löschen?")) return;
    await supabase.from("posts").delete().eq("id", id);
    toast({ title: "Gelöscht" });
    navigate("/");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 py-10">
        {/* Top bar */}
        <div className="mb-8 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" onClick={handleDelete} className="gap-2 text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" /> Löschen
            </Button>
            <Button variant="outline" onClick={() => navigate(`/preview/${id}`)} className="gap-2">
              <Eye className="h-4 w-4" /> Vorschau
            </Button>
            <Button variant="outline" onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" /> HTML Export
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Speichern
            </Button>
          </div>
        </div>

        <h1 className="font-display text-2xl font-bold mb-1">Block-Editor</h1>
        <p className="text-sm text-muted-foreground mb-8">
          {post?.guest_name} — {post?.interview_title}
        </p>

        <div className="space-y-6">
          {/* Headline */}
          <BlockCard title="Überschrift" required>
            <Input value={blocks.headline} onChange={(e) => updateBlock("headline", e.target.value)} className="text-lg font-display font-semibold" />
          </BlockCard>

          {/* Excerpt */}
          <BlockCard title="Kurzbeschreibung (Excerpt)" required>
            <Textarea value={blocks.excerpt} onChange={(e) => updateBlock("excerpt", e.target.value)} rows={2} />
          </BlockCard>

          {/* Main Video */}
          <BlockCard title="Hauptvideo (YouTube)" required>
            <Input value={blocks.youtube_url} onChange={(e) => updateBlock("youtube_url", e.target.value)} placeholder="https://youtube.com/watch?v=..." />
            {blocks.youtube_url && <YouTubePreview url={blocks.youtube_url} />}
          </BlockCard>

          {/* Summary Box */}
          <BlockCard title="Zusammenfassungsbox" required>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Titel</Label>
                <Input value={blocks.summary_title} onChange={(e) => updateBlock("summary_title", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Einleitung</Label>
                <Textarea value={blocks.summary_lead} onChange={(e) => updateBlock("summary_lead", e.target.value)} rows={2} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Stichpunkte</Label>
                {blocks.summary_bullets.map((b, i) => (
                  <div key={i} className="flex gap-2 mt-1">
                    <Input value={b} onChange={(e) => updateBullet(i, e.target.value)} />
                    <Button variant="ghost" size="icon" onClick={() => removeBullet(i)} className="shrink-0 text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addBullet} className="mt-2">
                  + Stichpunkt
                </Button>
              </div>
            </div>
          </BlockCard>

          {/* Guest Profile */}
          <BlockCard title="Gast-Profil" required>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Bild-URL</Label>
                <Input value={blocks.guest_image_url || ""} onChange={(e) => updateBlock("guest_image_url", e.target.value)} placeholder="https://example.com/photo.jpg" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Biografie</Label>
                <Textarea value={blocks.guest_bio} onChange={(e) => updateBlock("guest_bio", e.target.value)} rows={3} />
              </div>
            </div>
          </BlockCard>

          {/* Content Sections */}
          {([1, 2, 3] as const).map((n) => (
            <BlockCard key={n} title={`Inhaltsabschnitt ${n}`} required>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Titel</Label>
                  <Input
                    value={blocks[`section${n}_title` as keyof PostBlocks] as string}
                    onChange={(e) => updateBlock(`section${n}_title` as keyof PostBlocks, e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Inhalt</Label>
                  <Textarea
                    value={blocks[`section${n}_content` as keyof PostBlocks] as string}
                    onChange={(e) => updateBlock(`section${n}_content` as keyof PostBlocks, e.target.value)}
                    rows={5}
                  />
                </div>
              </div>
            </BlockCard>
          ))}

          {/* Optional Blocks */}
          <div className="pt-4">
            <h2 className="font-display text-lg font-semibold mb-4">Optionale Blöcke</h2>
            <div className="space-y-4">
              <OptionalBlockToggle
                label="Zusätzliches Video"
                enabled={showAdditionalVideo}
                onToggle={setShowAdditionalVideo}
              >
                <Input
                  value={blocks.additional_video_url || ""}
                  onChange={(e) => updateBlock("additional_video_url", e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                />
                {blocks.additional_video_url && <YouTubePreview url={blocks.additional_video_url} />}
              </OptionalBlockToggle>

              <OptionalBlockToggle
                label="PrettyLink Block"
                enabled={showPrettyLink}
                onToggle={setShowPrettyLink}
              >
                <Input
                  value={blocks.prettylink_shortcodes || ""}
                  onChange={(e) => updateBlock("prettylink_shortcodes", e.target.value)}
                  placeholder="[prettylink link=...]"
                />
              </OptionalBlockToggle>

              <OptionalBlockToggle
                label="Ressourcen-Block"
                enabled={showResources}
                onToggle={setShowResources}
              >
                <Textarea
                  value={blocks.resources || ""}
                  onChange={(e) => updateBlock("resources", e.target.value)}
                  placeholder="Links, Bücher, weiterführende Materialien..."
                  rows={4}
                />
              </OptionalBlockToggle>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BlockCard({ title, required, children }: { title: string; required?: boolean; children: React.ReactNode }) {
  return (
    <Card className="animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">{title}</CardTitle>
          {required && <Badge variant="outline" className="text-xs">Pflicht</Badge>}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function OptionalBlockToggle({
  label,
  enabled,
  onToggle,
  children,
}: {
  label: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <Card className={enabled ? "" : "opacity-60"}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{label}</CardTitle>
          <Switch checked={enabled} onCheckedChange={onToggle} />
        </div>
      </CardHeader>
      {enabled && <CardContent>{children}</CardContent>}
    </Card>
  );
}

function YouTubePreview({ url }: { url: string }) {
  const videoId = extractYouTubeId(url);
  if (!videoId) return null;
  return (
    <div className="mt-3 aspect-video w-full overflow-hidden rounded-lg border bg-muted">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
  return match?.[1] || null;
}
