import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Post, PostBlocks } from "@/types/post";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ClipboardList,
  ScanSearch,
  UserCheck,
  BookOpen,
  MessagesSquare,
  Video,
  FileText,
  Newspaper,
  Search,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

const workflow = [
  { num: 1, title: "Erfassung", url: "/module/erfassung", icon: ClipboardList },
  { num: 2, title: "Vorab-Scan", url: "/module/vorab-scan", icon: ScanSearch },
  { num: 3, title: "Profil", url: "/module/profil", icon: UserCheck },
  { num: 4, title: "Leitfaden", url: "/module/leitfaden", icon: BookOpen },
  { num: 5, title: "Vorgespräch", url: "/module/vorgespraech", icon: MessagesSquare },
  { num: 6, title: "Aufzeichnung", url: "/module/aufzeichnung", icon: Video },
  { num: 7, title: "Beiträge", url: "/module/interview-beitraege", icon: FileText },
  { num: 8, title: "News", url: "/module/news", icon: Newspaper },
];

const statusToStep: Record<string, number> = {
  erfassung: 1,
  draft: 7,
  in_progress: 7,
  exported: 8,
};

const statusConfig: Record<string, { label: string; className: string }> = {
  erfassung: { label: "In Erfassung", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  draft: { label: "Entwurf", className: "bg-muted text-muted-foreground" },
  in_progress: { label: "In Arbeit", className: "bg-warning text-warning-foreground" },
  exported: { label: "Exportiert", className: "bg-success text-success-foreground" },
};

export default function DashboardHome() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stepFilter, setStepFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    // RLS sorgt automatisch dafür, dass Speaker nur eigene Posts sehen,
    // Admins alle.
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

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      const matchSearch =
        !search ||
        p.guest_name.toLowerCase().includes(search.toLowerCase()) ||
        p.interview_title.toLowerCase().includes(search.toLowerCase());
      const step = statusToStep[p.status] ?? 7;
      const matchStep = stepFilter === "all" || String(step) === stepFilter;
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      return matchSearch && matchStep && matchStatus;
    });
  }, [posts, search, stepFilter, statusFilter]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Workflow-Übersicht
          </h1>
          <p className="mt-1 text-muted-foreground">
            {role === "admin"
              ? "Alle Interviewgäste und Interviews – vom Erstkontakt bis zum Beitrag."
              : "Ihre Interviews im Überblick."}
          </p>
        </div>
        <Button onClick={() => navigate("/module/erfassung")}>
          <Plus className="mr-1.5 h-4 w-4" />
          {role === "admin" ? "Erfassung öffnen" : "Neues Interview anstoßen"}
        </Button>
      </div>

      <div className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
        {workflow.map((m) => (
          <button
            key={m.url}
            onClick={() => navigate(m.url)}
            className={cn(
              "group flex flex-col items-start gap-2 rounded-lg border bg-card p-3 text-left transition-all hover:shadow-md hover:border-primary/40",
              m.num === 7 && "border-primary/40"
            )}
          >
            <div className="flex w-full items-center justify-between">
              <m.icon className="h-4 w-4 text-primary" />
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {m.num}/8
              </span>
            </div>
            <div className="text-sm font-medium leading-tight">{m.title}</div>
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Gast oder Titel suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={stepFilter} onValueChange={setStepFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Module</SelectItem>
            {workflow.map((w) => (
              <SelectItem key={w.num} value={String(w.num)}>
                {w.num}. {w.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
            <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <FileText className="mb-3 h-10 w-10 opacity-40" />
          Keine Einträge gefunden
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((post) => {
            const cfg = statusConfig[post.status] || statusConfig.draft;
            const step = statusToStep[post.status] ?? 7;
            const wf = workflow.find((w) => w.num === step);
            return (
              <Card
                key={post.id}
                className="cursor-pointer transition-all hover:shadow-md hover:border-primary/20"
                onClick={() => navigate(`/module/interview-beitraege/edit/${post.id}`)}
              >
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display font-semibold truncate">
                      {post.interview_title}
                    </h3>
                    <p className="mt-0.5 text-sm text-muted-foreground truncate">
                      {post.guest_name} · {new Date(post.updated_at).toLocaleDateString("de-DE")}
                    </p>
                  </div>
                  {wf && (
                    <Badge variant="outline" className="gap-1.5">
                      <wf.icon className="h-3 w-3" />
                      {wf.num}. {wf.title}
                    </Badge>
                  )}
                  <Badge className={cfg.className}>{cfg.label}</Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
