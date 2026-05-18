import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Post, PostBlocks } from "@/types/post";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const statusConfig: Record<string, { label: string; className: string }> = {
  erfassung: { label: "In Erfassung", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  draft: { label: "Entwurf", className: "bg-muted text-muted-foreground" },
  in_progress: { label: "In Arbeit", className: "bg-warning text-warning-foreground" },
  exported: { label: "Exportiert", className: "bg-success text-success-foreground" },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("updated_at", { ascending: false });
    if (!error && data) {
      setPosts(data.map(d => ({ ...d, blocks: d.blocks as unknown as PostBlocks | null })) as Post[]);
    }
    setLoading(false);
  }

  const filtered = posts.filter((p) => {
    const matchesSearch =
      !search ||
      p.guest_name.toLowerCase().includes(search.toLowerCase()) ||
      p.interview_title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <div className="text-sm text-muted-foreground tabular-nums">Modul 7</div>
            <h1 className="font-display text-3xl font-bold tracking-tight">
              Interview-Beiträge
            </h1>
            <p className="mt-1 text-muted-foreground">
              Blog-Beiträge zu realisierten Interviews erstellen und verwalten
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => navigate("/module/interview-beitraege/new")} size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              Neuer Beitrag
            </Button>
          </div>
        </div>

        <div className="mb-6 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              <SelectItem value="erfassung">In Erfassung</SelectItem>
              <SelectItem value="draft">Entwurf</SelectItem>
              <SelectItem value="in_progress">In Arbeit</SelectItem>
              <SelectItem value="exported">Exportiert</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-16">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <p className="text-lg font-medium text-muted-foreground">
              {posts.length === 0
                ? "Noch keine Beiträge vorhanden"
                : "Keine Ergebnisse gefunden"}
            </p>
            {posts.length === 0 && (
              <Button onClick={() => navigate("/module/interview-beitraege/new")} variant="outline" className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Ersten Beitrag erstellen
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((post, i) => {
              const cfg = statusConfig[post.status] || statusConfig.draft;
              return (
                <Card
                  key={post.id}
                  className="cursor-pointer transition-all hover:shadow-md hover:border-primary/20"
                  style={{ animationDelay: `${i * 50}ms` }}
                  onClick={() => navigate(`/module/interview-beitraege/edit/${post.id}`)}
                >
                  <CardContent className="flex items-center justify-between p-5">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-lg font-semibold truncate">
                        {post.interview_title}
                      </h3>
                      <p className="mt-0.5 text-sm text-muted-foreground truncate">
                        {post.guest_name} · {new Date(post.updated_at).toLocaleDateString("de-DE")}
                      </p>
                    </div>
                    <Badge className={cfg.className}>{cfg.label}</Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
