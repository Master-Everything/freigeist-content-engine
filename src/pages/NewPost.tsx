import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SourceFormData } from "@/types/post";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Save, Loader2, Download, Upload, FileText, ImageIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { convertToWebP, sanitizeName, blobToBase64 } from "@/lib/image-utils";
import { getUploadMethod } from "@/components/ScreenshotSettings";

export default function NewPost() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [profilePicMode, setProfilePicMode] = useState<"link" | "upload">("link");
  const [profileUploading, setProfileUploading] = useState(false);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const profileFileRef = useRef<HTMLInputElement | null>(null);
  const transcriptFileRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState<SourceFormData>({
    guest_name: "",
    interview_title: "",
    youtube_url: "",
    newsletter_text: "",
    telegram_text: "",
    guest_website_url: "",
    guest_short_bio: "",
    prettylink_shortcodes: "",
    video_transcript: "",
  });
  const [guestImageUrl, setGuestImageUrl] = useState("");

  const update = (field: keyof SourceFormData, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  async function handleFetchTranscript() {
    if (!form.youtube_url.trim()) {
      toast({ title: "Fehler", description: "Bitte zuerst eine YouTube URL eingeben.", variant: "destructive" });
      return;
    }
    setTranscriptLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("youtube-transcript", {
        body: { youtube_url: form.youtube_url },
      });
      if (error) throw error;
      if (data?.error) {
        toast({ title: "Kein Transcript gefunden", description: data.error, variant: "destructive" });
        return;
      }
      update("video_transcript", data.transcript);
      toast({ title: "Transcript geladen", description: `Sprache: ${data.language}` });
    } catch (e) {
      console.error(e);
      toast({ title: "Fehler", description: e instanceof Error ? e.message : "Transcript konnte nicht geladen werden", variant: "destructive" });
    } finally {
      setTranscriptLoading(false);
    }
  }

  function handleTranscriptFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      update("video_transcript", reader.result as string);
      toast({ title: "Transcript geladen", description: file.name });
    };
    reader.readAsText(file);
  }

  async function handleProfileImageUpload(file: File) {
    if (!form.guest_name.trim()) {
      toast({ title: "Fehler", description: "Bitte zuerst den Gastnamen eingeben.", variant: "destructive" });
      return;
    }
    setProfileUploading(true);
    try {
      const webpBlob = await convertToWebP(file);
      setProfilePreview(URL.createObjectURL(webpBlob));
      const base64 = await blobToBase64(webpBlob);
      const filename = `${sanitizeName(form.guest_name)}-Profil.webp`;
      const method = getUploadMethod();
      const fnName = method === "ftp" ? "wp-upload-ftp" : "wp-upload";
      const { data, error } = await supabase.functions.invoke(fnName, {
        body: { imageBase64: base64, filename },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Upload failed");
      setGuestImageUrl(data.url);
      toast({ title: "Hochgeladen", description: `${filename} → WordPress` });
    } catch (e: any) {
      toast({ title: "Upload fehlgeschlagen", description: e.message, variant: "destructive" });
    } finally {
      setProfileUploading(false);
    }
  }

  async function handleSave() {
    if (!form.guest_name.trim() || !form.interview_title.trim()) {
      toast({ title: "Fehler", description: "Gastname und Interview-Titel sind Pflichtfelder.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const { data: post, error } = await supabase
        .from("posts")
        .insert({
          guest_name: form.guest_name,
          interview_title: form.interview_title,
          youtube_url: form.youtube_url || null,
          newsletter_text: form.newsletter_text || null,
          telegram_text: form.telegram_text || null,
          guest_website_url: form.guest_website_url || null,
          guest_short_bio: form.guest_short_bio || null,
          prettylink_shortcodes: form.prettylink_shortcodes || null,
          video_transcript: form.video_transcript || null,
          guest_image_url: guestImageUrl || null,
          status: "erfassung",
        } as any)
        .select()
        .single();

      if (error || !post) throw new Error(error?.message || "Speichern fehlgeschlagen");

      // Save profile image record to images table if uploaded
      if (guestImageUrl) {
        await supabase.from("images").insert({
          post_id: post.id,
          slot: "guest_profile",
          filename: `${sanitizeName(form.guest_name)}-Profil.webp`,
          original_name: "profile",
          wp_url: guestImageUrl,
        } as any);
      }

      toast({ title: "Gespeichert", description: "Beitrag wurde als 'In Erfassung' gespeichert." });
      navigate(`/edit/${post.id}`);
    } catch (e) {
      console.error(e);
      toast({ title: "Fehler", description: e instanceof Error ? e.message : "Unbekannter Fehler", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Zurück
          </Button>
          <ThemeToggle />
        </div>

        <h1 className="font-display text-3xl font-bold tracking-tight mb-2">
          Neuer Interview-Beitrag
        </h1>
        <p className="text-muted-foreground mb-8">
          Alle Quelldaten eingeben, dann speichern. Inhalte werden im Block-Editor generiert.
        </p>

        <div className="space-y-6">
          {/* Pflichtfelder */}
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
            </CardContent>
          </Card>

          {/* Video & Transcript */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Video & Transcript</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="youtube_url">YouTube Video URL</Label>
                <div className="flex gap-2">
                  <Input id="youtube_url" value={form.youtube_url} onChange={(e) => update("youtube_url", e.target.value)} placeholder="https://youtube.com/watch?v=..." className="flex-1" />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleFetchTranscript}
                    disabled={transcriptLoading || !form.youtube_url.trim()}
                    className="gap-2 shrink-0"
                  >
                    {transcriptLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    Auto-Transcript
                  </Button>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label htmlFor="video_transcript">Video Transcript</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => transcriptFileRef.current?.click()}
                    className="gap-1.5 text-xs h-7"
                  >
                    <FileText className="h-3 w-3" />
                    .txt hochladen
                  </Button>
                  <input
                    ref={transcriptFileRef}
                    type="file"
                    accept=".txt,text/plain"
                    className="hidden"
                    onChange={handleTranscriptFileUpload}
                  />
                </div>
                <Textarea
                  id="video_transcript"
                  value={form.video_transcript}
                  onChange={(e) => update("video_transcript", e.target.value)}
                  rows={6}
                  placeholder="Transcript hier einfügen oder per Button oben automatisch laden / als .txt hochladen..."
                />
                {form.video_transcript && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {form.video_transcript.length.toLocaleString()} Zeichen
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Gast-Profilbild */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Gast-Profilbild</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={profilePicMode} onValueChange={(v) => setProfilePicMode(v as "link" | "upload")}>
                <TabsList className="mb-3">
                  <TabsTrigger value="link">Link</TabsTrigger>
                  <TabsTrigger value="upload">Upload</TabsTrigger>
                </TabsList>
                <TabsContent value="link">
                  <Input
                    value={guestImageUrl}
                    onChange={(e) => setGuestImageUrl(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                  />
                </TabsContent>
                <TabsContent value="upload">
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => profileFileRef.current?.click()}
                      disabled={profileUploading}
                      className="gap-1.5"
                    >
                      {profileUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                      Bild auswählen & hochladen
                    </Button>
                    <input
                      ref={profileFileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleProfileImageUpload(f);
                      }}
                    />
                    {profilePreview && (
                      <img src={profilePreview} alt="Vorschau" className="h-12 w-12 rounded-full object-cover" />
                    )}
                  </div>
                  {guestImageUrl && profilePicMode === "upload" && (
                    <p className="text-xs text-muted-foreground mt-2 truncate">URL: {guestImageUrl}</p>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Optionale Quelldaten */}
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
                <Label htmlFor="guest_website_url">Gast-Website URL</Label>
                <Input id="guest_website_url" value={form.guest_website_url} onChange={(e) => update("guest_website_url", e.target.value)} placeholder="https://..." />
              </div>
              <div>
                <Label htmlFor="guest_short_bio">Gast-Kurzbiografie</Label>
                <Textarea id="guest_short_bio" value={form.guest_short_bio} onChange={(e) => update("guest_short_bio", e.target.value)} placeholder="Biografie oder Profil-Beschreibung..." rows={4} />
              </div>
              <div>
                <Label htmlFor="prettylink_shortcodes">PrettyLink Shortcode(s)</Label>
                <Input id="prettylink_shortcodes" value={form.prettylink_shortcodes} onChange={(e) => update("prettylink_shortcodes", e.target.value)} placeholder="[prettylink link=...]" />
              </div>
            </CardContent>
          </Card>

          {/* Save */}
          <Button
            onClick={handleSave}
            disabled={saving || !form.guest_name.trim() || !form.interview_title.trim()}
            size="lg"
            className="w-full gap-2"
          >
            {saving ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Speichern...</>
            ) : (
              <><Save className="h-4 w-4" /> Beitrag speichern</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
