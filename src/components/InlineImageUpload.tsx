import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { convertToWebP, sanitizeName } from "@/lib/image-utils";

interface InlineImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  guestName: string;
  postId: string;
  slot: string;
  filenameIndex: number;
  label?: string;
}

const BUCKET = "post-images";

export function InlineImageUpload({
  value,
  onChange,
  guestName,
  postId,
  slot,
  filenameIndex,
  label = "Bild-URL",
}: InlineImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const handleUpload = useCallback(async (file: File) => {
    if (!postId) {
      toast({ title: "Fehler", description: "Post-ID fehlt.", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const webpBlob = await convertToWebP(file);
      const nameStub = guestName ? sanitizeName(guestName) : "image";
      const filename = `${nameStub}-${slot}-${filenameIndex}-${Date.now()}.webp`;
      const path = `posts/${postId}/${filename}`;

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, webpBlob, {
          upsert: true,
          contentType: "image/webp",
        });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const publicUrl = pub.publicUrl;

      // record in images table (best-effort)
      await supabase.from("images").insert({
        post_id: postId,
        slot,
        filename,
        original_name: file.name,
        file_size: webpBlob.size,
        wp_url: publicUrl,
      } as any);

      onChange(publicUrl);
      toast({ title: "Hochgeladen", description: filename });
    } catch (e: any) {
      toast({ title: "Upload fehlgeschlagen", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }, [guestName, postId, slot, filenameIndex, onChange]);

  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex gap-2 items-center">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0 h-9 w-9"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          title="Bild hochladen"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleUpload(f);
          }}
        />
        {value && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
      </div>
    </div>
  );
}
