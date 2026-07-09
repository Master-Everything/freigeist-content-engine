import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { convertToWebP } from "@/lib/image-utils";

interface Props {
  /** id of the speaker profile (posts.speaker_id) */
  speakerId: string | null | undefined;
  /** Current guest_image_url used in the post (public URL) */
  value: string;
  /** Called with the new public URL after upload */
  onChange: (url: string) => void;
}

const BUCKET = "speaker-avatars";

function toPublicUrl(pathOrUrl: string | null | undefined): string {
  if (!pathOrUrl) return "";
  if (/^https?:\/\//i.test(pathOrUrl) || pathOrUrl.startsWith("blob:")) return pathOrUrl;
  return supabase.storage.from(BUCKET).getPublicUrl(pathOrUrl).data.publicUrl;
}

export function SpeakerAvatarField({ speakerId, value, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [ownerUserId, setOwnerUserId] = useState<string | null>(null);
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // Load speaker profile by id and sync guest_image_url from it
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!speakerId) return;
      const { data } = await supabase
        .from("speakers")
        .select("id, user_id, avatar_url")
        .eq("id", speakerId)
        .maybeSingle();
      if (cancelled || !data) return;
      setOwnerUserId(data.user_id);
      setAvatarPath(data.avatar_url);
      const publicUrl = toPublicUrl(data.avatar_url);
      if (publicUrl && publicUrl !== value) onChange(publicUrl);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speakerId]);

  async function handleFile(file: File) {
    if (!speakerId) {
      toast({ title: "Fehler", description: "Kein Speaker verknüpft.", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const webp = await convertToWebP(file);
      if (webp.size > 500_000) throw new Error("Avatar zu groß (max ~500 KB)");
      const folder = ownerUserId || speakerId;
      const path = `${folder}/avatar-${Date.now()}.webp`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, webp, { upsert: true, contentType: "image/webp" });
      if (upErr) throw upErr;

      const { error: updErr } = await supabase
        .from("speakers")
        .update({ avatar_url: path })
        .eq("id", speakerId);
      if (updErr) throw updErr;

      setAvatarPath(path);
      const publicUrl = toPublicUrl(path);
      onChange(publicUrl);
      toast({ title: "Avatar aktualisiert", description: "Wirkt auch im Speaker-Profil (Modul 1)." });
    } catch (e: any) {
      toast({ title: "Upload fehlgeschlagen", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  const displayUrl = value || toPublicUrl(avatarPath);

  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">Speaker-Foto (Speaker-Box, aus Modul 1)</Label>
      <div className="flex items-center gap-3">
        <div className="h-16 w-16 shrink-0 rounded-full border bg-muted overflow-hidden flex items-center justify-center">
          {displayUrl ? (
            <img src={displayUrl} alt="Speaker" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[10px] text-muted-foreground">kein Bild</span>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading || !speakerId}
          onClick={() => fileRef.current?.click()}
          className="gap-2"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Neues Bild wählen
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </div>
      {!speakerId ? (
        <p className="text-[11px] text-destructive">
          Kein Speaker mit diesem Post verknüpft — bitte in Modul 1 zuordnen.
        </p>
      ) : (
        <p className="text-[11px] text-muted-foreground">
          Wird zentral im Speaker-Profil (Modul 1) gepflegt — Änderungen wirken auch dort.
        </p>
      )}
    </div>
  );
}
