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
  excerpt: "",
  main_video_url: "",
  summary_box_title: "",
  summary_lead: "",
  summary_points: [],
  guest_short_bio: "",
  section_1_title: "",
  section_1_body: "",
  section_2_title: "",
  section_2_body: "",
  section_3_title: "",
  section_3_body: "",
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
      setShowAdditionalVideo(!!p.blocks.additional_video_embed);
      setShowPrettyLink(!!p.blocks.pretty_link_shortcode);
      setShowResources(!!p.blocks.resource_links || !!p.blocks.resource_notes);
    } else {
      setBlocks({ ...defaultBlocks, main_video_url: p.youtube_url || "" });
    }
    setLoading(false);
  }

  const updateBlock = useCallback((field: keyof PostBlocks, value: any) => {
    setBlocks((b) => ({ ...b, [field]: value }));
  }, []);

  const updatePoint = useCallback((index: number, value: string) => {
    setBlocks((b) => {
      const points = [...b.summary_points];
      points[index] = value;
      return { ...b, summary_points: points };
    });
  }, []);

  const addPoint = () => setBlocks((b) => ({ ...b, summary_points: [...b.summary_points, ""] }));
  const removePoint = (i: number) => setBlocks((b) => ({ ...b, summary_points: b.summary_points.filter((_, idx) => idx !== i) }));

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
          {/* Excerpt */}
          <BlockCard title="Kurzbeschreibung (Excerpt)" required>
            <Textarea value={blocks.excerpt} onChange={(e) => updateBlock("excerpt", e.target.value)} rows={2} />
          </BlockCard>

          {/* Main Video */}
          <BlockCard title="Hauptvideo (YouTube)" required>
            <Input value={blocks.main_video_url} onChange={(e) => updateBlock("main_video_url", e.target.value)} placeholder="https://youtube.com/watch?v=..." />
            {blocks.main_video_url && <YouTubePreview url={blocks.main_video_url} />}
          </BlockCard>

          {/* Summary Box */}
          <BlockCard title="Zusammenfassungsbox" required>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Titel</Label>
                <Input value={blocks.summary_box_title} onChange={(e) => updateBlock("summary_box_title", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Einleitung</Label>
                <Textarea value={blocks.summary_lead} onChange={(e) => updateBlock("summary_lead", e.target.value)} rows={2} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Stichpunkte</Label>
                {blocks.summary_points.map((b, i) => (
                  <div key={i} className="flex gap-2 mt-1">
                    <Input value={b} onChange={(e) => updatePoint(i, e.target.value)} />
                    <Button variant="ghost" size="icon" onClick={() => removePoint(i)} className="shrink-0 text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addPoint} className="mt-2">
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
                <Label className="text-xs text-muted-foreground">Kurzbiografie</Label>
                <Textarea value={blocks.guest_short_bio} onChange={(e) => updateBlock("guest_short_bio", e.target.value)} rows={3} />
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
                    value={blocks[`section_${n}_title` as keyof PostBlocks] as string}
                    onChange={(e) => updateBlock(`section_${n}_title` as keyof PostBlocks, e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Inhalt</Label>
                  <Textarea
                    value={blocks[`section_${n}_body` as keyof PostBlocks] as string}
                    onChange={(e) => updateBlock(`section_${n}_body` as keyof PostBlocks, e.target.value)}
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
                  value={blocks.additional_video_embed || ""}
                  onChange={(e) => updateBlock("additional_video_embed", e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                />
                {blocks.additional_video_embed && <YouTubePreview url={blocks.additional_video_embed} />}
              </OptionalBlockToggle>

              <OptionalBlockToggle
                label="PrettyLink Block"
                enabled={showPrettyLink}
                onToggle={setShowPrettyLink}
              >
                <Input
                  value={blocks.pretty_link_shortcode || ""}
                  onChange={(e) => updateBlock("pretty_link_shortcode", e.target.value)}
                  placeholder="[prettylink link=...]"
                />
              </OptionalBlockToggle>

              <OptionalBlockToggle
                label="Ressourcen-Block"
                enabled={showResources}
                onToggle={setShowResources}
              >
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Links</Label>
                    <Textarea
                      value={blocks.resource_links || ""}
                      onChange={(e) => updateBlock("resource_links", e.target.value)}
                      placeholder="Links, Bücher, weiterführende Materialien..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Notizen</Label>
                    <Textarea
                      value={blocks.resource_notes || ""}
                      onChange={(e) => updateBlock("resource_notes", e.target.value)}
                      placeholder="Zusätzliche Hinweise..."
                      rows={3}
                    />
                  </div>
                </div>
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
