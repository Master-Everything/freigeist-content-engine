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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ArrowLeft, Download, Save, Loader2, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { generateHTML } from "@/lib/export-html";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PostPreview } from "@/components/PostPreview";
import { SourceDataEditor } from "@/components/SourceDataEditor";
import { ScreenshotTool } from "@/components/ScreenshotTool";
import { useIsMobile } from "@/hooks/use-mobile";

const defaultBlocks: PostBlocks = {
  excerpt: "",
  main_video_url: "",
  summary_box_title: "",
  summary_lead: "",
  summary_paragraphs: [],
  guest_short_bio: "",
  guest_website_cta: "",
  section_1_title: "",
  section_1_body: "",
  section_2_title: "",
  section_2_body: "",
  section_3_title: "",
  section_3_body: "",
  section_4_title: "",
  section_4_body: "",
  section_5_title: "",
  section_5_body: "",
  section_6_title: "",
  section_6_body: "",
};

export default function EditPost() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [post, setPost] = useState<Post | null>(null);
  const [blocks, setBlocks] = useState<PostBlocks>(defaultBlocks);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAdditionalVideo, setShowAdditionalVideo] = useState(false);
  const [showPrettyLink, setShowPrettyLink] = useState(false);
  const [showResources, setShowResources] = useState(false);
  const [showSourceData, setShowSourceData] = useState(false);

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
      // Migrate old summary_points to summary_paragraphs if needed
      const migrated = { ...defaultBlocks, ...p.blocks };
      if (!migrated.summary_paragraphs?.length && (p.blocks as any).summary_points?.length) {
        migrated.summary_paragraphs = (p.blocks as any).summary_points;
      }
      setBlocks(migrated);
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
    const html = generateHTML(blocks, post.guest_name, post.interview_title);
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

  const editorContent = (
    <div className="h-full overflow-y-auto p-6">
      <h2 className="font-display text-lg font-semibold mb-1">Block-Editor</h2>
      <p className="text-sm text-muted-foreground mb-4">
        {post?.guest_name} — {post?.interview_title}
      </p>

      {post && (
        <div className="mb-6">
          <SourceDataEditor
            post={post}
            open={showSourceData}
            onOpenChange={setShowSourceData}
            onPostUpdate={setPost}
            onBlocksGenerated={(newBlocks) => setBlocks({ ...defaultBlocks, ...newBlocks })}
          />
        </div>
      )}

      <div className="space-y-5">
        <BlockCard title="Kurzbeschreibung (Excerpt)" required>
          <Textarea value={blocks.excerpt} onChange={(e) => updateBlock("excerpt", e.target.value)} rows={2} />
        </BlockCard>

        <BlockCard title="Hauptvideo (YouTube)" required>
          <Input value={blocks.main_video_url} onChange={(e) => updateBlock("main_video_url", e.target.value)} placeholder="https://youtube.com/watch?v=..." />
        </BlockCard>

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
              <Label className="text-xs text-muted-foreground">Zusammenfassungs-Absätze</Label>
              <p className="text-xs text-muted-foreground mb-2">Ausführliche Absätze mit **Fettdruck** für Einleitungen</p>
              {blocks.summary_paragraphs.map((p, i) => (
                <div key={i} className="flex gap-2 mt-2">
                  <Textarea value={p} onChange={(e) => {
                    const updated = [...blocks.summary_paragraphs];
                    updated[i] = e.target.value;
                    updateBlock("summary_paragraphs", updated);
                  }} rows={3} />
                  <Button variant="ghost" size="icon" onClick={() => {
                    updateBlock("summary_paragraphs", blocks.summary_paragraphs.filter((_, idx) => idx !== i));
                  }} className="shrink-0 text-destructive mt-1">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => updateBlock("summary_paragraphs", [...blocks.summary_paragraphs, ""])} className="mt-2">
                + Absatz
              </Button>
            </div>
          </div>
        </BlockCard>

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
            <div>
              <Label className="text-xs text-muted-foreground">Gast-Website CTA (Button 1)</Label>
              <Input value={blocks.guest_website_cta || ""} onChange={(e) => updateBlock("guest_website_cta", e.target.value)} placeholder="https://gast-website.de" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Affiliate-Button URL (Button 2, nach Sektion 3)</Label>
              <Input value={blocks.cta_affiliate_url || ""} onChange={(e) => updateBlock("cta_affiliate_url", e.target.value)} placeholder="https://affiliate-link.de" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Affiliate-Button Text</Label>
              <Input value={blocks.cta_affiliate_label || ""} onChange={(e) => updateBlock("cta_affiliate_label", e.target.value)} placeholder="Informationen & Store" />
            </div>
          </div>
        </BlockCard>

        <BlockCard title="Oberes Bild (nach Gast-Profil)">
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Bild-URL</Label>
              <Input value={blocks.top_image_url || ""} onChange={(e) => updateBlock("top_image_url", e.target.value)} placeholder="https://example.com/bild.jpg" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Link-URL (wohin das Bild verlinkt)</Label>
              <Input value={blocks.top_image_link || ""} onChange={(e) => updateBlock("top_image_link", e.target.value)} placeholder="https://example.com" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Alt-Text</Label>
              <Input value={blocks.top_image_alt || ""} onChange={(e) => updateBlock("top_image_alt", e.target.value)} placeholder="Bildbeschreibung" />
            </div>
          </div>
        </BlockCard>

        <BlockCard title="Mittleres Bild (nach Sektion 3)">
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Bild-URL</Label>
              <Input value={blocks.mid_image_url || ""} onChange={(e) => updateBlock("mid_image_url", e.target.value)} placeholder="https://example.com/bild.jpg" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Link-URL (wohin das Bild verlinkt)</Label>
              <Input value={blocks.mid_image_link || ""} onChange={(e) => updateBlock("mid_image_link", e.target.value)} placeholder="https://example.com" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Alt-Text</Label>
              <Input value={blocks.mid_image_alt || ""} onChange={(e) => updateBlock("mid_image_alt", e.target.value)} placeholder="Bildbeschreibung" />
            </div>
          </div>
        </BlockCard>

        <BlockCard title="Bild am Textende">
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Bild-URL</Label>
              <Input value={blocks.end_image_url || ""} onChange={(e) => updateBlock("end_image_url", e.target.value)} placeholder="https://example.com/bild.jpg" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Link-URL (wohin das Bild verlinkt)</Label>
              <Input value={blocks.end_image_link || ""} onChange={(e) => updateBlock("end_image_link", e.target.value)} placeholder="https://example.com" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Alt-Text</Label>
              <Input value={blocks.end_image_alt || ""} onChange={(e) => updateBlock("end_image_alt", e.target.value)} placeholder="Bildbeschreibung" />
            </div>
          </div>
        </BlockCard>

        {([1, 2, 3, 4, 5, 6] as const).map((n) => (
          <BlockCard key={n} title={`Inhaltsabschnitt ${n}`} required={n <= 3}>
            <div className="space-y-2">
              <div>
                <Label className="text-xs text-muted-foreground">Titel</Label>
                <Input
                  value={blocks[`section_${n}_title` as keyof PostBlocks] as string}
                  onChange={(e) => updateBlock(`section_${n}_title` as keyof PostBlocks, e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Inhalt (Markdown: ## H3, ### H4, **fett**, - Listen)</Label>
                <Textarea
                  value={blocks[`section_${n}_body` as keyof PostBlocks] as string}
                  onChange={(e) => updateBlock(`section_${n}_body` as keyof PostBlocks, e.target.value)}
                  rows={6}
                />
              </div>
            </div>
          </BlockCard>
        ))}

        <div className="pt-2">
          <h3 className="font-display text-base font-semibold mb-3">Optionale Blöcke</h3>
          <div className="space-y-4">
            <OptionalBlockToggle label="Zusätzliches Video" enabled={showAdditionalVideo} onToggle={setShowAdditionalVideo}>
              <Input
                value={blocks.additional_video_embed || ""}
                onChange={(e) => updateBlock("additional_video_embed", e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
              />
            </OptionalBlockToggle>

            <OptionalBlockToggle label="PrettyLink Block" enabled={showPrettyLink} onToggle={setShowPrettyLink}>
              <Input
                value={blocks.pretty_link_shortcode || ""}
                onChange={(e) => updateBlock("pretty_link_shortcode", e.target.value)}
                placeholder="[prettylink link=...]"
              />
            </OptionalBlockToggle>

            <OptionalBlockToggle label="Ressourcen-Block" enabled={showResources} onToggle={setShowResources}>
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
  );

  const previewContent = post ? (
    <div className="h-full overflow-y-auto bg-muted/30">
      <div className="sticky top-0 z-10 border-b bg-muted/60 backdrop-blur px-6 py-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Live-Vorschau</p>
      </div>
      <PostPreview post={post} blocks={blocks} />
    </div>
  ) : null;

  return (
    <div className="flex h-screen flex-col bg-background">
      <div className="shrink-0 border-b bg-card/80 backdrop-blur z-20">
        <div className="flex items-center justify-between px-4 py-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={handleDelete} className="gap-2 text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" /> Löschen
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" /> HTML
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Speichern
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {isMobile ? (
          <Tabs defaultValue="editor" className="flex h-full flex-col">
            <TabsList className="mx-4 mt-2 shrink-0">
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="preview">Vorschau</TabsTrigger>
            </TabsList>
            <TabsContent value="editor" className="flex-1 min-h-0 mt-0">
              {editorContent}
            </TabsContent>
            <TabsContent value="preview" className="flex-1 min-h-0 mt-0">
              {previewContent}
            </TabsContent>
          </Tabs>
        ) : (
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={50} minSize={30}>
              {editorContent}
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={50} minSize={30}>
              {previewContent}
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
    </div>
  );
}

function BlockCard({ title, required, children }: { title: string; required?: boolean; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm">{title}</CardTitle>
          {required && <Badge variant="outline" className="text-[10px]">Pflicht</Badge>}
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
          <CardTitle className="text-sm">{label}</CardTitle>
          <Switch checked={enabled} onCheckedChange={onToggle} />
        </div>
      </CardHeader>
      {enabled && <CardContent>{children}</CardContent>}
    </Card>
  );
}
