import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Upload, Loader2, CheckCircle2, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { getUploadMethod } from "@/components/ScreenshotSettings";

interface ImageUrls {
  top?: string;
  mid?: string;
  end?: string;
}

interface ScreenshotUploaderProps {
  guestName: string;
  onUrlsChange: (urls: ImageUrls) => void;
  urls: ImageUrls;
}

type SlotKey = "top" | "mid" | "end";

const SLOTS: { key: SlotKey; label: string; index: number }[] = [
  { key: "top", label: "Oberes Bild (Screen 1)", index: 1 },
  { key: "mid", label: "Mittleres Bild (Screen 2)", index: 2 },
  { key: "end", label: "Unteres Bild (Screen 3)", index: 3 },
];

async function convertToWebP(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const maxW = 1500;
      let w = img.width, h = img.height;
      if (w > maxW) { h = Math.round(h * (maxW / w)); w = maxW; }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);

      let quality = 0.85;
      const tryCompress = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("WebP conversion failed"));
            if (blob.size > 400_000 && quality > 0.3) {
              quality -= 0.1;
              tryCompress();
            } else {
              resolve(blob);
            }
          },
          "image/webp",
          quality
        );
      };
      tryCompress();
    };
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = URL.createObjectURL(file);
  });
}

function sanitizeName(name: string) {
  return name.replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export function ScreenshotUploader({ guestName, onUrlsChange, urls }: ScreenshotUploaderProps) {
  const [previews, setPreviews] = useState<Record<SlotKey, string | null>>({ top: null, mid: null, end: null });
  const [blobs, setBlobs] = useState<Record<SlotKey, Blob | null>>({ top: null, mid: null, end: null });
  const [uploading, setUploading] = useState<Record<SlotKey, boolean>>({ top: false, mid: false, end: false });
  const fileRefs = useRef<Record<SlotKey, HTMLInputElement | null>>({ top: null, mid: null, end: null });

  const handleFileSelect = useCallback(async (slot: SlotKey, file: File) => {
    try {
      const webpBlob = await convertToWebP(file);
      const previewUrl = URL.createObjectURL(webpBlob);
      setPreviews((p) => ({ ...p, [slot]: previewUrl }));
      setBlobs((b) => ({ ...b, [slot]: webpBlob }));
    } catch {
      toast({ title: "Fehler", description: "Bild konnte nicht verarbeitet werden.", variant: "destructive" });
    }
  }, []);

  const handleUpload = useCallback(async (slot: SlotKey, index: number) => {
    const blob = blobs[slot];
    if (!blob) return;
    if (!guestName.trim()) {
      toast({ title: "Fehler", description: "Bitte zuerst den Gastnamen eingeben.", variant: "destructive" });
      return;
    }

    setUploading((u) => ({ ...u, [slot]: true }));
    try {
      const filename = `${sanitizeName(guestName)}-Screen-${index}.webp`;
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const method = getUploadMethod();
      const fnName = method === "ftp" ? "wp-upload-ftp" : "wp-upload";
      const { data, error } = await supabase.functions.invoke(fnName, {
        body: { imageBase64: base64, filename },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Upload failed");

      const newUrls = { ...urls, [slot]: data.url };
      onUrlsChange(newUrls);
      toast({ title: "Hochgeladen", description: `${filename} → WordPress` });
    } catch (e: any) {
      toast({ title: "Upload fehlgeschlagen", description: e.message, variant: "destructive" });
    } finally {
      setUploading((u) => ({ ...u, [slot]: false }));
    }
  }, [blobs, guestName, urls, onUrlsChange]);

  const handleDrop = useCallback((slot: SlotKey, e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) handleFileSelect(slot, file);
  }, [handleFileSelect]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Screenshots hochladen</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {SLOTS.map(({ key, label, index }) => (
          <div key={key} className="space-y-2">
            <Label className="text-sm font-medium">{label}</Label>
            <div
              className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileRefs.current[key]?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(key, e)}
            >
              <input
                ref={(el) => { fileRefs.current[key] = el; }}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelect(key, f);
                }}
              />
              {previews[key] ? (
                <img src={previews[key]!} alt={label} className="max-h-32 mx-auto rounded" />
              ) : (
                <div className="flex flex-col items-center gap-1 text-muted-foreground py-2">
                  <ImageIcon className="h-6 w-6" />
                  <span className="text-xs">Klicken oder Bild hierher ziehen</span>
                </div>
              )}
            </div>
            <div className="flex gap-2 items-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!blobs[key] || uploading[key]}
                onClick={() => handleUpload(key, index)}
                className="gap-1.5"
              >
                {uploading[key] ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                Hochladen
              </Button>
              {urls[key] && (
                <div className="flex items-center gap-1 text-xs text-primary">
                  <CheckCircle2 className="h-3 w-3" />
                  <span className="truncate max-w-[200px]">{urls[key]}</span>
                </div>
              )}
            </div>
            {urls[key] && (
              <Input
                value={urls[key] || ""}
                onChange={(e) => onUrlsChange({ ...urls, [key]: e.target.value })}
                className="text-xs"
                placeholder="WordPress URL"
              />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
