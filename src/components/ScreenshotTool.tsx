import { useState, useRef, useCallback, useEffect } from "react";
import { Post, PostBlocks } from "@/types/post";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Globe, Camera, X, Loader2, CheckCircle2, XCircle, Copy, RotateCcw, Trash2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ScreenshotSettings, getUploadMethod } from "./ScreenshotSettings";

interface ScreenshotToolProps {
  post: Post;
  blocks: PostBlocks;
  onUpdateBlock: (field: keyof PostBlocks, value: string) => void;
}

type SlotKey = "top" | "mid" | "end";
type SlotStatus = "empty" | "uploading" | "done" | "failed";

interface SlotData {
  status: SlotStatus;
  url: string;
  localPreview: string;
}

const SLOT_CONFIG: { key: SlotKey; label: string; blockField: keyof PostBlocks }[] = [
  { key: "top", label: "Screen-1 (Oberes Bild)", blockField: "top_image_url" },
  { key: "mid", label: "Screen-2 (Mittleres Bild)", blockField: "mid_image_url" },
  { key: "end", label: "Screen-3 (Bild am Textende)", blockField: "end_image_url" },
];

function sanitizeGuestName(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, "");
}

export function ScreenshotTool({ post, blocks, onUpdateBlock }: ScreenshotToolProps) {
  const [websiteUrl, setWebsiteUrl] = useState(post.guest_website_url || "");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewNaturalSize, setPreviewNaturalSize] = useState({ w: 0, h: 0 });

  // Crop state
  const [cropRect, setCropRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<"draw" | "move" | "resize">("draw");
  const [resizeHandle, setResizeHandle] = useState<string>("");
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOrigRect, setDragOrigRect] = useState({ x: 0, y: 0, w: 0, h: 0 });

  const canvasRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Slots
  const [slots, setSlots] = useState<Record<SlotKey, SlotData>>({
    top: { status: blocks.top_image_url ? "done" : "empty", url: blocks.top_image_url || "", localPreview: "" },
    mid: { status: blocks.mid_image_url ? "done" : "empty", url: blocks.mid_image_url || "", localPreview: "" },
    end: { status: blocks.end_image_url ? "done" : "empty", url: blocks.end_image_url || "", localPreview: "" },
  });

  const nextEmptySlot = (): SlotKey | null => {
    for (const { key } of SLOT_CONFIG) {
      if (slots[key].status === "empty") return key;
    }
    return null;
  };

  const capturedCount = SLOT_CONFIG.filter(({ key }) => slots[key].status === "done").length;

  async function loadWebsitePreview() {
    if (!websiteUrl) return;
    setLoadingPreview(true);
    setCropRect(null);
    try {
      const { data, error } = await supabase.functions.invoke("screenshot-capture", {
        body: { url: websiteUrl, fullPage: true },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      const imgSrc = `data:image/png;base64,${data.image}`;
      setPreviewImage(imgSrc);
    } catch (e: any) {
      toast({ title: "Fehler", description: e.message || "Screenshot fehlgeschlagen", variant: "destructive" });
    }
    setLoadingPreview(false);
  }

  function handleImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    setPreviewNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
  }

  // --- Crop interaction handlers ---
  function getRelPos(e: React.MouseEvent): { x: number; y: number } {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function hitTestHandle(pos: { x: number; y: number }): string {
    if (!cropRect) return "";
    const { x, y, w, h } = cropRect;
    const hs = 8;
    const handles: Record<string, { cx: number; cy: number }> = {
      nw: { cx: x, cy: y }, n: { cx: x + w / 2, cy: y }, ne: { cx: x + w, cy: y },
      w: { cx: x, cy: y + h / 2 }, e: { cx: x + w, cy: y + h / 2 },
      sw: { cx: x, cy: y + h }, s: { cx: x + w / 2, cy: y + h }, se: { cx: x + w, cy: y + h },
    };
    for (const [key, { cx, cy }] of Object.entries(handles)) {
      if (Math.abs(pos.x - cx) <= hs && Math.abs(pos.y - cy) <= hs) return key;
    }
    return "";
  }

  function isInsideCrop(pos: { x: number; y: number }): boolean {
    if (!cropRect) return false;
    return pos.x >= cropRect.x && pos.x <= cropRect.x + cropRect.w &&
           pos.y >= cropRect.y && pos.y <= cropRect.y + cropRect.h;
  }

  function handleMouseDown(e: React.MouseEvent) {
    const pos = getRelPos(e);
    const handle = hitTestHandle(pos);
    if (handle) {
      setDragMode("resize");
      setResizeHandle(handle);
      setDragStart(pos);
      setDragOrigRect({ ...cropRect! });
      setIsDragging(true);
    } else if (isInsideCrop(pos)) {
      setDragMode("move");
      setDragStart(pos);
      setDragOrigRect({ ...cropRect! });
      setIsDragging(true);
    } else {
      setDragMode("draw");
      setCropRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
      setDragStart(pos);
      setIsDragging(true);
    }
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isDragging) {
      // Update cursor
      const pos = getRelPos(e);
      const handle = hitTestHandle(pos);
      const el = canvasRef.current;
      if (!el) return;
      if (handle) {
        const cursors: Record<string, string> = {
          nw: "nwse-resize", se: "nwse-resize", ne: "nesw-resize", sw: "nesw-resize",
          n: "ns-resize", s: "ns-resize", e: "ew-resize", w: "ew-resize",
        };
        el.style.cursor = cursors[handle] || "default";
      } else if (isInsideCrop(pos)) {
        el.style.cursor = "move";
      } else {
        el.style.cursor = "crosshair";
      }
      return;
    }

    const pos = getRelPos(e);
    const dx = pos.x - dragStart.x;
    const dy = pos.y - dragStart.y;
    const bounds = canvasRef.current?.getBoundingClientRect();
    const maxW = bounds?.width || 9999;
    const maxH = bounds?.height || 9999;

    if (dragMode === "draw") {
      const x = Math.min(dragStart.x, pos.x);
      const y = Math.min(dragStart.y, pos.y);
      const w = Math.abs(pos.x - dragStart.x);
      const h = Math.abs(pos.y - dragStart.y);
      setCropRect({ x: Math.max(0, x), y: Math.max(0, y), w: Math.min(w, maxW), h: Math.min(h, maxH) });
    } else if (dragMode === "move") {
      let nx = dragOrigRect.x + dx;
      let ny = dragOrigRect.y + dy;
      nx = Math.max(0, Math.min(nx, maxW - dragOrigRect.w));
      ny = Math.max(0, Math.min(ny, maxH - dragOrigRect.h));
      setCropRect({ x: nx, y: ny, w: dragOrigRect.w, h: dragOrigRect.h });
    } else if (dragMode === "resize") {
      const r = { ...dragOrigRect };
      if (resizeHandle.includes("e")) r.w = Math.max(20, dragOrigRect.w + dx);
      if (resizeHandle.includes("w")) { r.x = dragOrigRect.x + dx; r.w = Math.max(20, dragOrigRect.w - dx); }
      if (resizeHandle.includes("s")) r.h = Math.max(20, dragOrigRect.h + dy);
      if (resizeHandle.includes("n")) { r.y = dragOrigRect.y + dy; r.h = Math.max(20, dragOrigRect.h - dy); }
      setCropRect(r);
    }
  }

  function handleMouseUp() {
    setIsDragging(false);
  }

  // --- Capture & Upload ---
  async function captureAndUpload() {
    if (!cropRect || !previewImage || !imgRef.current) return;
    const slot = nextEmptySlot();
    if (!slot) {
      toast({ title: "Alle 3 Slots belegt", description: "Entferne zuerst ein Bild.", variant: "destructive" });
      return;
    }

    const slotIndex = SLOT_CONFIG.findIndex(s => s.key === slot) + 1;
    const guestClean = sanitizeGuestName(post.guest_name);
    const filename = `${guestClean}-Screen-${slotIndex}.webp`;

    // Calculate crop on natural image coordinates
    const displayW = imgRef.current.clientWidth;
    const displayH = imgRef.current.clientHeight;
    const scaleX = previewNaturalSize.w / displayW;
    const scaleY = previewNaturalSize.h / displayH;

    const natCrop = {
      x: Math.round(cropRect.x * scaleX),
      y: Math.round(cropRect.y * scaleY),
      w: Math.round(cropRect.w * scaleX),
      h: Math.round(cropRect.h * scaleY),
    };

    // Crop using canvas
    setSlots(prev => ({ ...prev, [slot]: { status: "uploading", url: "", localPreview: "" } }));

    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = previewImage!;
      });

      const canvas = document.createElement("canvas");
      // Target: max 1500px wide
      const targetW = Math.min(natCrop.w, 1500);
      const scale = targetW / natCrop.w;
      canvas.width = targetW;
      canvas.height = Math.round(natCrop.h * scale);

      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, natCrop.x, natCrop.y, natCrop.w, natCrop.h, 0, 0, canvas.width, canvas.height);

      // Convert to WebP with iterative quality reduction
      let quality = 0.9;
      let blob: Blob | null = null;
      while (quality >= 0.3) {
        blob = await new Promise<Blob | null>(res => canvas.toBlob(res, "image/webp", quality));
        if (blob && blob.size <= 400 * 1024) break;
        quality -= 0.1;
      }

      if (!blob) throw new Error("Failed to create image blob");

      // Convert to base64
      const arrayBuf = await blob.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuf)));

      // Create local preview
      const localPreview = URL.createObjectURL(blob);
      setSlots(prev => ({ ...prev, [slot]: { ...prev[slot], localPreview } }));

      // Upload to WordPress
      const method = getUploadMethod();
      const fnName = method === "ftp" ? "wp-upload-ftp" : "wp-upload";
      const { data, error } = await supabase.functions.invoke(fnName, {
        body: { imageBase64: base64, filename },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const wpUrl = data.url;
      const blockField = SLOT_CONFIG.find(s => s.key === slot)!.blockField;
      onUpdateBlock(blockField, wpUrl);

      setSlots(prev => ({ ...prev, [slot]: { status: "done", url: wpUrl, localPreview } }));
      setCropRect(null);
      toast({ title: `Screen-${slotIndex} hochgeladen ✓`, description: filename });

    } catch (e: any) {
      setSlots(prev => ({ ...prev, [slot]: { status: "failed", url: "", localPreview: prev[slot].localPreview } }));
      toast({ title: "Upload fehlgeschlagen", description: e.message, variant: "destructive" });
    }
  }

  function removeSlot(key: SlotKey) {
    const blockField = SLOT_CONFIG.find(s => s.key === key)!.blockField;
    onUpdateBlock(blockField, "");
    setSlots(prev => ({ ...prev, [key]: { status: "empty", url: "", localPreview: "" } }));
  }

  function retrySlot(key: SlotKey) {
    setSlots(prev => ({ ...prev, [key]: { status: "empty", url: "", localPreview: "" } }));
    toast({ title: "Bereit", description: "Wähle einen neuen Bildausschnitt und klicke Screenshot." });
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url);
    toast({ title: "URL kopiert" });
  }

  const hasValidCrop = cropRect && cropRect.w > 20 && cropRect.h > 20;

  return (
    <div className="h-full overflow-y-auto p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold">Screenshots</h2>
          <p className="text-sm text-muted-foreground">
            {post.guest_name} — {capturedCount}/3 Bilder
          </p>
        </div>
        <ScreenshotSettings />
      </div>

      {/* URL Input */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Globe className="h-4 w-4" /> Website laden
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://example.com"
              className="flex-1"
            />
            <Button onClick={loadWebsitePreview} disabled={loadingPreview || !websiteUrl} size="sm" className="gap-2">
              {loadingPreview ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              Laden
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Die Website wird serverseitig gerendert und als Vorschau-Bild geladen.
          </p>
        </CardContent>
      </Card>

      {/* Preview + Crop */}
      {previewImage && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Bildausschnitt wählen</CardTitle>
              <div className="flex items-center gap-2">
                {cropRect && (
                  <Button variant="ghost" size="sm" onClick={() => setCropRect(null)} className="gap-1 text-xs">
                    <X className="h-3 w-3" /> Auswahl aufheben
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={captureAndUpload}
                  disabled={!hasValidCrop || !nextEmptySlot()}
                  className="gap-1"
                >
                  <Camera className="h-3 w-3" /> Screenshot ↗
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div
              ref={canvasRef}
              className="relative select-none border border-border rounded-lg overflow-hidden"
              style={{ cursor: "crosshair" }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <img
                ref={imgRef}
                src={previewImage}
                alt="Website preview"
                className="w-full h-auto block"
                onLoad={handleImageLoad}
                draggable={false}
              />
              {/* Crop overlay */}
              {cropRect && cropRect.w > 0 && cropRect.h > 0 && (
                <>
                  {/* Dimmed overlay */}
                  <div className="absolute inset-0 bg-black/40 pointer-events-none"
                    style={{
                      clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${cropRect.x}px ${cropRect.y}px, ${cropRect.x}px ${cropRect.y + cropRect.h}px, ${cropRect.x + cropRect.w}px ${cropRect.y + cropRect.h}px, ${cropRect.x + cropRect.w}px ${cropRect.y}px, ${cropRect.x}px ${cropRect.y}px)`
                    }}
                  />
                  {/* Selection border */}
                  <div
                    className="absolute border-2 border-primary pointer-events-none"
                    style={{ left: cropRect.x, top: cropRect.y, width: cropRect.w, height: cropRect.h }}
                  >
                    {/* Dimension label */}
                    <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded font-mono">
                      {Math.round(cropRect.w)}×{Math.round(cropRect.h)} px
                    </div>
                  </div>
                  {/* Resize handles */}
                  {["nw", "n", "ne", "w", "e", "sw", "s", "se"].map((h) => {
                    const positions: Record<string, React.CSSProperties> = {
                      nw: { left: cropRect.x - 4, top: cropRect.y - 4 },
                      n: { left: cropRect.x + cropRect.w / 2 - 4, top: cropRect.y - 4 },
                      ne: { left: cropRect.x + cropRect.w - 4, top: cropRect.y - 4 },
                      w: { left: cropRect.x - 4, top: cropRect.y + cropRect.h / 2 - 4 },
                      e: { left: cropRect.x + cropRect.w - 4, top: cropRect.y + cropRect.h / 2 - 4 },
                      sw: { left: cropRect.x - 4, top: cropRect.y + cropRect.h - 4 },
                      s: { left: cropRect.x + cropRect.w / 2 - 4, top: cropRect.y + cropRect.h - 4 },
                      se: { left: cropRect.x + cropRect.w - 4, top: cropRect.y + cropRect.h - 4 },
                    };
                    return (
                      <div
                        key={h}
                        className="absolute w-2 h-2 bg-primary border border-primary-foreground rounded-sm pointer-events-none"
                        style={positions[h]}
                      />
                    );
                  })}
                </>
              )}
            </div>
            {!nextEmptySlot() && (
              <p className="text-xs text-amber-600 mt-2">Alle 3 Slots sind belegt. Entferne ein Bild, um einen neuen Screenshot zu machen.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Image Slots */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Bild-Slots</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {SLOT_CONFIG.map(({ key, label, blockField }) => {
            const slot = slots[key];
            return (
              <div key={key} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background">
                {/* Thumbnail */}
                <div className="w-[60px] h-[38px] rounded border border-border overflow-hidden bg-muted shrink-0 flex items-center justify-center">
                  {(slot.localPreview || slot.url) ? (
                    <img src={slot.localPreview || slot.url} alt={label} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] text-muted-foreground">—</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium">{label}</span>
                    {slot.status === "done" && <CheckCircle2 className="h-3 w-3 text-green-600" />}
                    {slot.status === "failed" && <XCircle className="h-3 w-3 text-destructive" />}
                    {slot.status === "uploading" && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                    {slot.status === "empty" && <Badge variant="outline" className="text-[9px]">Leer</Badge>}
                  </div>
                  {slot.status === "uploading" && <Progress value={60} className="h-1" />}
                  {slot.url && (
                    <p className="text-[10px] text-muted-foreground truncate">{slot.url}</p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {slot.url && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyUrl(slot.url)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  )}
                  {slot.status === "failed" && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => retrySlot(key)}>
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  )}
                  {(slot.status === "done" || slot.status === "failed") && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeSlot(key)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
