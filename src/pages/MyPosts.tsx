import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Post, PostBlocks } from "@/types/post";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Loader2, Eye } from "lucide-react";

const statusConfig: Record<string, { label: string; className: string }> = {
  erfassung: { label: "In Erfassung", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  draft: { label: "Entwurf", className: "bg-muted text-muted-foreground" },
  in_progress: { label: "In Arbeit", className: "bg-warning text-warning-foreground" },
  exported: { label: "Veröffentlicht", className: "bg-success text-success-foreground" },
};

export default function MyPosts() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("posts")
      .select("*")
      .order("updated_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) {
          setPosts(
            data.map((d) => ({ ...d, blocks: d.blocks as unknown as PostBlocks | null })) as Post[]
          );
        }
        setLoading(false);
      });
  }, []);

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
          Eine Übersicht aller Beiträge zu deinen Interviews.
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
            return (
              <Card
                key={post.id}
                className="cursor-pointer transition-all hover:shadow-md hover:border-primary/20"
                onClick={() => navigate(`/module/interview-beitraege/view/${post.id}`)}
              >
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display font-semibold truncate">{post.interview_title}</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground truncate">
                      {new Date(post.updated_at).toLocaleDateString("de-DE")}
                    </p>
                  </div>
                  <Badge className={cfg.className}>{cfg.label}</Badge>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
