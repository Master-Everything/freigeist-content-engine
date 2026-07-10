import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Post, PostBlocks } from "@/types/post";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, Eye, Pencil, ScanSearch } from "lucide-react";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; className: string }> = {
  erfassung: { label: "In Erfassung", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  scan_pending: { label: "Scan läuft", className: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" },
  scan_done: { label: "Scan abgeschlossen", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" },
  draft: { label: "Entwurf", className: "bg-muted text-muted-foreground" },
  in_progress: { label: "In Arbeit", className: "bg-warning text-warning-foreground" },
  exported: { label: "Veröffentlicht", className: "bg-success text-success-foreground" },
};

const EDITABLE = new Set(["erfassung"]);
const SCAN_RELEASABLE = new Set(["erfassung"]);

export default function MyPosts() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanningId, setScanningId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("updated_at", { ascending: false });
    if (!error && data) {
      setPosts(
        data.map((d) => ({ ...d, blocks: d.blocks as unknown as PostBlocks | null })) as Post[]
      );
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function releaseForScan(postId: string) {
    setScanningId(postId);
    try {
      const { data, error } = await supabase.functions.invoke("interview-scan", {
        body: { post_id: postId },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
      } else {
        toast.success(`Scan abgeschlossen: ${data?.verdict ?? "—"}`);
      }
      await load();
    } catch (e) {
      toast.error("Scan fehlgeschlagen: " + (e as Error).message);
    } finally {
      setScanningId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight">Meine Interview-Beiträge</h1>
        <p className="mt-1 text-muted-foreground">
          Bearbeite deine Interviews oder gib sie zum Vorab-Scan frei.
        </p>
      </div>

      {posts.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <FileText className="mb-3 h-10 w-10 opacity-40" />
          Noch keine Beiträge vorhanden
        </Card>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => {
            const cfg = statusConfig[post.status] || statusConfig.draft;
            const canEdit = EDITABLE.has(post.status);
            const canScan = SCAN_RELEASABLE.has(post.status);
            const isScanning = scanningId === post.id || post.status === "scan_pending";
            return (
              <Card key={post.id} className="transition-all hover:shadow-md hover:border-primary/20">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display font-semibold truncate">{post.interview_title}</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground truncate">
                      {new Date(post.updated_at).toLocaleDateString("de-DE")}
                    </p>
                  </div>
                  <Badge className={cfg.className}>{cfg.label}</Badge>
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate(`/module/interview-beitraege/view/${post.id}`)}
                      title="Ansehen"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {canEdit && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/module/interview/edit/${post.id}`)}
                        title="Bearbeiten"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canScan && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => releaseForScan(post.id)}
                        disabled={isScanning}
                      >
                        {isScanning ? (
                          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        ) : (
                          <ScanSearch className="mr-1.5 h-4 w-4" />
                        )}
                        Zum Scan freigeben
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
