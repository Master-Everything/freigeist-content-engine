import { useEffect, useMemo, useRef, useState } from "react";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  ChevronRight,
  ChevronDown,
  CalendarClock,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { relativeChip } from "@/lib/relative-time";

/* ============================================================
 * Types
 * ============================================================ */

type Verdict = "green" | "yellow" | "red" | null;

interface ScanRow {
  id: string;
  post_id?: string;
  speaker_id?: string;
  verdict: Verdict;
  status: string;
  created_at: string;
}

interface ProfileRow { id: string; post_id: string | null; speaker_id: string; status: string; updated_at: string; }
interface GuideRow { id: string; post_id: string; status: string; updated_at: string; }
interface CallRow { id: string; post_id: string; status: string; scheduled_at: string | null; updated_at: string; }
interface SessionRow { id: string; post_id: string; status: string; scheduled_at: string | null; stream_url: string | null; updated_at: string; }

/* ============================================================
 * Workflow-Meta
 * ============================================================ */

const workflow = [
  { num: 1, key: "erfassung",     title: "Erfassung",     url: "/module/erfassung",     icon: ClipboardList,   accent: "bg-sky-500"     },
  { num: 2, key: "vorab-scan",    title: "Vorab-Scan",    url: "/module/vorab-scan",    icon: ScanSearch,      accent: "bg-amber-500"   },
  { num: 3, key: "profil",        title: "Profil",        url: "/module/profil",        icon: UserCheck,       accent: "bg-violet-500"  },
  { num: 4, key: "leitfaden",     title: "Leitfaden",     url: "/module/leitfaden",     icon: BookOpen,        accent: "bg-fuchsia-500" },
  { num: 5, key: "vorgespraech",  title: "Vorgespräch",   url: "/module/vorgespraech",  icon: MessagesSquare,  accent: "bg-teal-500"    },
  { num: 6, key: "aufzeichnung",  title: "Aufzeichnung",  url: "/module/aufzeichnung",  icon: Video,           accent: "bg-rose-500"    },
  { num: 7, key: "beitraege",     title: "Beiträge",      url: "/module/interview-beitraege", icon: FileText,  accent: "bg-primary"     },
  { num: 8, key: "news",          title: "News-Plattform",url: "/module/news",          icon: Newspaper,       accent: "bg-emerald-500" },
] as const;

const statusToStep: Record<string, number> = {
  erfassung: 1,
  scan_pending: 2,
  scan_done: 2,
  profil_pending: 3,
  profil_done: 3,
  leitfaden_pending: 4,
  leitfaden_final: 4,
  vorgespraech_pending: 5,
  vorgespraech_done: 5,
  aufzeichnung_pending: 6,
  aufzeichnung_done: 6,
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

/* ============================================================
 * Component
 * ============================================================ */

export default function DashboardHome() {
  const navigate = useNavigate();
  const { role } = useAuth();

  const [posts, setPosts] = useState<Post[]>([]);
  const [speakerScans, setSpeakerScans] = useState<ScanRow[]>([]);
  const [postScans, setPostScans] = useState<ScanRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [guides, setGuides] = useState<GuideRow[]>([]);
  const [calls, setCalls] = useState<CallRow[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [stepFilter, setStepFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const [p, ssc, psc, pf, gd, cl, se] = await Promise.all([
        supabase.from("posts").select("*").order("updated_at", { ascending: false }),
        supabase.from("speaker_scans").select("id, speaker_id, verdict, status, created_at").order("created_at", { ascending: false }).limit(500),
        supabase.from("post_scans").select("id, post_id, verdict, status, created_at").order("created_at", { ascending: false }).limit(500),
        supabase.from("speaker_profiles").select("id, post_id, speaker_id, status, updated_at").order("updated_at", { ascending: false }),
        supabase.from("interview_guides").select("id, post_id, status, updated_at").order("updated_at", { ascending: false }),
        supabase.from("pre_interview_calls").select("id, post_id, status, scheduled_at, updated_at").order("updated_at", { ascending: false }),
        supabase.from("recording_sessions").select("id, post_id, status, scheduled_at, stream_url, updated_at").order("updated_at", { ascending: false }),
      ]);
      if (p.data) setPosts(p.data.map((d) => ({ ...d, blocks: d.blocks as unknown as PostBlocks | null })) as Post[]);
      setSpeakerScans((ssc.data ?? []) as ScanRow[]);
      setPostScans((psc.data ?? []) as ScanRow[]);
      setProfiles((pf.data ?? []) as ProfileRow[]);
      setGuides((gd.data ?? []) as GuideRow[]);
      setCalls((cl.data ?? []) as CallRow[]);
      setSessions((se.data ?? []) as SessionRow[]);
      setLoading(false);
    })();
  }, []);

  const postById = useMemo(() => {
    const m = new Map<string, Post>();
    posts.forEach((p) => m.set(p.id, p));
    return m;
  }, [posts]);

  /* ---------- Aggregation pro Modul ---------- */

  const agg = useMemo(() => {
    // M2 — nur latest verdict pro speaker / post
    const latestBy = <T extends { created_at: string }>(rows: T[], key: (r: T) => string | undefined) => {
      const m = new Map<string, T>();
      rows.forEach((r) => {
        const k = key(r);
        if (!k) return;
        const cur = m.get(k);
        if (!cur || new Date(r.created_at) > new Date(cur.created_at)) m.set(k, r);
      });
      return Array.from(m.values());
    };
    const latestSpeakerScans = latestBy(speakerScans, (r) => r.speaker_id);
    const latestPostScans = latestBy(postScans, (r) => r.post_id);

    const scanBuckets = {
      green: latestSpeakerScans.filter((s) => s.verdict === "green").length + latestPostScans.filter((s) => s.verdict === "green").length,
      yellow: latestSpeakerScans.filter((s) => s.verdict === "yellow").length + latestPostScans.filter((s) => s.verdict === "yellow").length,
      red: latestSpeakerScans.filter((s) => s.verdict === "red").length + latestPostScans.filter((s) => s.verdict === "red").length,
      pending: latestSpeakerScans.filter((s) => !s.verdict).length + latestPostScans.filter((s) => !s.verdict).length,
    };

    const nextRec = sessions
      .filter((s) => s.scheduled_at && new Date(s.scheduled_at).getTime() > Date.now())
      .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())[0];

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const exportedThisMonth = posts.filter(
      (p) => p.status === "exported" && new Date(p.updated_at) >= startOfMonth
    ).length;

    return {
      m1: posts.filter((p) => p.status === "erfassung"),
      m2: {
        rows: [...latestSpeakerScans, ...latestPostScans],
        buckets: scanBuckets,
      },
      m3: {
        entwurf: profiles.filter((r) => r.status === "entwurf"),
        kuratiert: profiles.filter((r) => r.status === "kuratiert"),
        freigegeben: profiles.filter((r) => r.status === "freigegeben"),
      },
      m4: {
        entwurf: guides.filter((r) => r.status === "entwurf"),
        final: guides.filter((r) => r.status === "final"),
      },
      m5: {
        geplant: calls.filter((r) => r.status === "geplant"),
        durchgefuehrt: calls.filter((r) => r.status === "durchgefuehrt"),
        abgesagt: calls.filter((r) => r.status === "abgesagt"),
      },
      m6: {
        nicht_gestartet: sessions.filter((r) => r.status === "nicht_gestartet"),
        laeuft: sessions.filter((r) => r.status === "laeuft"),
        pausiert: sessions.filter((r) => r.status === "pausiert"),
        beendet: sessions.filter((r) => r.status === "beendet"),
        next: nextRec,
      },
      m7: {
        draft: posts.filter((p) => p.status === "draft"),
        in_progress: posts.filter((p) => p.status === "in_progress"),
      },
      m8: {
        exported: posts.filter((p) => p.status === "exported"),
        pushed: posts.filter((p) => !!p.hub_pushed_at).length,
        errors: posts.filter((p) => !!p.hub_last_error).length,
        thisMonth: exportedThisMonth,
      },
      kpi: {
        active: posts.filter((p) => p.status !== "exported").length,
        review: profiles.filter((r) => r.status === "kuratiert").length + guides.filter((r) => r.status === "entwurf").length,
      },
    };
  }, [posts, speakerScans, postScans, profiles, guides, calls, sessions]);

  /* ---------- Global-Liste (Filter) ---------- */

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

  function jumpToList(step?: number, status?: string) {
    if (step) setStepFilter(String(step));
    if (status) setStatusFilter(status);
    setTimeout(() => listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  /* ============================================================
   * Render
   * ============================================================ */

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* HEADER-BAND */}
      <div className="mb-8 flex items-stretch gap-4">
        <div className="w-2 rounded-full bg-gradient-to-b from-primary via-fuchsia-500 to-amber-500" />
        <div className="flex-1 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
              Freigeist · Workflow-Cockpit
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight">
              {role === "admin" ? "Interviewer-Cockpit" : "Meine Interviews"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {role === "admin"
                ? "Alle Module in Echtzeit — Zähler, Deep-Links, Filter."
                : "Ihre Interviews im Überblick."}
            </p>
          </div>
          <Button onClick={() => navigate("/module/erfassung")} size="lg" className="shrink-0">
            <Plus className="mr-1.5 h-4 w-4" />
            {role === "admin" ? "Neues Interview" : "Neues Interview anstoßen"}
          </Button>
        </div>
      </div>

      {/* KPI-STRIP */}
      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <KpiTile
          label="Aktive Interviews"
          value={agg.kpi.active}
          icon={Activity}
          onClick={() => jumpToList()}
        />
        <KpiTile
          label="Freigegeben"
          value={agg.m2.buckets.green}
          icon={CheckCircle2}
          accent="text-emerald-500"
          onClick={() => jumpToList(2)}
        />
        <KpiTile
          label="Mit Hinweisen"
          value={agg.m2.buckets.yellow}
          icon={AlertTriangle}
          accent="text-amber-500"
          onClick={() => jumpToList(2)}
        />
        <KpiTile
          label="Nächste Aufzeichnung"
          value={agg.m6.next ? relativeChip(agg.m6.next.scheduled_at) : "—"}
          sub={agg.m6.next && postById.get(agg.m6.next.post_id)?.guest_name}
          icon={CalendarClock}
          accent="text-rose-500"
          onClick={() => agg.m6.next && navigate(`/module/aufzeichnung?post_id=${agg.m6.next.post_id}`)}
          isText
        />
        <KpiTile
          label="Diesen Monat exportiert"
          value={agg.m8.thisMonth}
          icon={Sparkles}
          accent="text-primary"
          onClick={() => jumpToList(8, "exported")}
        />
      </div>

      {/* MODUL-GRID */}
      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* M1 */}
        <ModulePanel
          meta={workflow[0]}
          bigNumber={agg.m1.length}
          chips={[{ label: "in Erfassung", value: agg.m1.length, tone: "muted" }]}
          details={agg.m1.slice(0, 8).map((p) => ({
            id: p.id,
            title: p.interview_title || p.guest_name,
            sub: p.guest_name,
            onClick: () => navigate(`/module/interview-beitraege/edit/${p.id}`),
          }))}
          onOpen={() => navigate(workflow[0].url)}
          onShowAll={() => jumpToList(1, "erfassung")}
          totalCount={agg.m1.length}
          loading={loading}
        />

        {/* M2 */}
        <ModulePanel
          meta={workflow[1]}
          bigNumber={agg.m2.buckets.green + agg.m2.buckets.yellow + agg.m2.buckets.red}
          chips={[
            { label: "grün", value: agg.m2.buckets.green, tone: "green" },
            { label: "gelb", value: agg.m2.buckets.yellow, tone: "yellow" },
            { label: "rot", value: agg.m2.buckets.red, tone: "red" },
            { label: "läuft", value: agg.m2.buckets.pending, tone: "muted" },
          ]}
          details={agg.m2.rows.slice(0, 8).map((s) => {
            const p = s.post_id ? postById.get(s.post_id) : undefined;
            return {
              id: s.id,
              title: p?.interview_title || (s.speaker_id ? "Sprecher-Scan" : "Beitrag-Scan"),
              sub: s.verdict ?? "läuft",
              tone: (s.verdict as any) ?? "muted",
              onClick: () => p ? navigate(`/module/vorab-scan?post_id=${p.id}`) : navigate(workflow[1].url),
            };
          })}
          onOpen={() => navigate(workflow[1].url)}
          onShowAll={() => jumpToList(2)}
          totalCount={agg.m2.rows.length}
          loading={loading}
        />

        {/* M3 */}
        <ModulePanel
          meta={workflow[2]}
          bigNumber={agg.m3.entwurf.length + agg.m3.kuratiert.length + agg.m3.freigegeben.length}
          chips={[
            { label: "Entwurf", value: agg.m3.entwurf.length, tone: "muted" },
            { label: "kuratiert", value: agg.m3.kuratiert.length, tone: "yellow" },
            { label: "freigegeben", value: agg.m3.freigegeben.length, tone: "green" },
          ]}
          details={[...agg.m3.kuratiert, ...agg.m3.entwurf, ...agg.m3.freigegeben].slice(0, 8).map((r) => {
            const p = r.post_id ? postById.get(r.post_id) : undefined;
            return {
              id: r.id,
              title: p?.interview_title || "Sprecherprofil",
              sub: r.status,
              tone: r.status === "freigegeben" ? "green" : r.status === "kuratiert" ? "yellow" : "muted",
              onClick: () => p ? navigate(`/module/profil?post_id=${p.id}`) : navigate(workflow[2].url),
            };
          })}
          onOpen={() => navigate(workflow[2].url)}
          onShowAll={() => jumpToList(3)}
          totalCount={agg.m3.entwurf.length + agg.m3.kuratiert.length + agg.m3.freigegeben.length}
          loading={loading}
        />

        {/* M4 */}
        <ModulePanel
          meta={workflow[3]}
          bigNumber={agg.m4.entwurf.length + agg.m4.final.length}
          chips={[
            { label: "Entwurf", value: agg.m4.entwurf.length, tone: "muted" },
            { label: "final", value: agg.m4.final.length, tone: "green" },
          ]}
          details={[...agg.m4.entwurf, ...agg.m4.final].slice(0, 8).map((r) => {
            const p = postById.get(r.post_id);
            return {
              id: r.id,
              title: p?.interview_title || "Leitfaden",
              sub: r.status,
              tone: r.status === "final" ? "green" : "muted",
              onClick: () => navigate(`/module/leitfaden?post_id=${r.post_id}`),
            };
          })}
          onOpen={() => navigate(workflow[3].url)}
          onShowAll={() => jumpToList(4)}
          totalCount={agg.m4.entwurf.length + agg.m4.final.length}
          loading={loading}
        />

        {/* M5 */}
        <ModulePanel
          meta={workflow[4]}
          bigNumber={agg.m5.geplant.length + agg.m5.durchgefuehrt.length + agg.m5.abgesagt.length}
          chips={[
            { label: "geplant", value: agg.m5.geplant.length, tone: "yellow" },
            { label: "durchgeführt", value: agg.m5.durchgefuehrt.length, tone: "green" },
            { label: "abgesagt", value: agg.m5.abgesagt.length, tone: "muted" },
          ]}
          details={[...agg.m5.geplant, ...agg.m5.durchgefuehrt, ...agg.m5.abgesagt].slice(0, 8).map((r) => {
            const p = postById.get(r.post_id);
            return {
              id: r.id,
              title: p?.interview_title || "Vorgespräch",
              sub: r.scheduled_at ? relativeChip(r.scheduled_at) : r.status,
              tone: r.status === "durchgefuehrt" ? "green" : "yellow",
              onClick: () => navigate(`/module/vorgespraech?post_id=${r.post_id}`),
            };
          })}
          onOpen={() => navigate(workflow[4].url)}
          onShowAll={() => jumpToList(5)}
          totalCount={agg.m5.geplant.length + agg.m5.durchgefuehrt.length + agg.m5.abgesagt.length}
          loading={loading}
        />

        {/* M6 */}
        <ModulePanel
          meta={workflow[5]}
          bigNumber={agg.m6.nicht_gestartet.length + agg.m6.laeuft.length + agg.m6.pausiert.length + agg.m6.beendet.length}
          chips={[
            { label: "geplant", value: agg.m6.nicht_gestartet.length, tone: "muted" },
            { label: "läuft", value: agg.m6.laeuft.length, tone: "red" },
            { label: "pausiert", value: agg.m6.pausiert.length, tone: "yellow" },
            { label: "beendet", value: agg.m6.beendet.length, tone: "green" },
          ]}
          footer={
            agg.m6.next && (
              <div className="text-xs text-muted-foreground">
                Nächste: <span className="text-foreground font-medium">{relativeChip(agg.m6.next.scheduled_at)}</span>
                {postById.get(agg.m6.next.post_id) && ` · ${postById.get(agg.m6.next.post_id)!.guest_name}`}
              </div>
            )
          }
          details={[...agg.m6.laeuft, ...agg.m6.pausiert, ...agg.m6.nicht_gestartet, ...agg.m6.beendet].slice(0, 8).map((r) => {
            const p = postById.get(r.post_id);
            return {
              id: r.id,
              title: p?.interview_title || "Aufzeichnung",
              sub: r.scheduled_at ? relativeChip(r.scheduled_at) : r.status,
              tone: r.status === "laeuft" ? "red" : r.status === "pausiert" ? "yellow" : "muted",
              onClick: () => navigate(`/module/aufzeichnung?post_id=${r.post_id}`),
            };
          })}
          onOpen={() => navigate(workflow[5].url)}
          onShowAll={() => jumpToList(6)}
          totalCount={agg.m6.nicht_gestartet.length + agg.m6.laeuft.length + agg.m6.pausiert.length + agg.m6.beendet.length}
          loading={loading}
        />

        {/* M7 */}
        <ModulePanel
          meta={workflow[6]}
          bigNumber={agg.m7.draft.length + agg.m7.in_progress.length}
          chips={[
            { label: "Entwurf", value: agg.m7.draft.length, tone: "muted" },
            { label: "in Arbeit", value: agg.m7.in_progress.length, tone: "yellow" },
          ]}
          details={[...agg.m7.in_progress, ...agg.m7.draft].slice(0, 8).map((p) => ({
            id: p.id,
            title: p.interview_title,
            sub: p.guest_name,
            tone: p.status === "in_progress" ? "yellow" : "muted",
            onClick: () => navigate(`/module/interview-beitraege/edit/${p.id}`),
          }))}
          onOpen={() => navigate(workflow[6].url)}
          onShowAll={() => jumpToList(7)}
          totalCount={agg.m7.draft.length + agg.m7.in_progress.length}
          loading={loading}
        />

        {/* M8 */}
        <ModulePanel
          meta={workflow[7]}
          bigNumber={agg.m8.exported.length}
          chips={[
            { label: "gepusht", value: agg.m8.pushed, tone: "green" },
            { label: "Fehler", value: agg.m8.errors, tone: "red" },
            { label: "diesen Monat", value: agg.m8.thisMonth, tone: "muted" },
          ]}
          details={agg.m8.exported.slice(0, 8).map((p) => ({
            id: p.id,
            title: p.interview_title,
            sub: p.hub_last_error ? "Fehler beim Push" : p.hub_pushed_at ? `gepusht ${new Date(p.hub_pushed_at).toLocaleDateString("de-DE")}` : "bereit",
            tone: p.hub_last_error ? "red" : p.hub_pushed_at ? "green" : "muted",
            onClick: () => navigate(`/module/interview-beitraege/edit/${p.id}`),
          }))}
          onOpen={() => navigate(workflow[7].url)}
          onShowAll={() => jumpToList(8, "exported")}
          totalCount={agg.m8.exported.length}
          loading={loading}
        />
      </div>

      {/* GLOBAL-LISTE */}
      <div ref={listRef} className="scroll-mt-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="h-6 w-1.5 rounded-full bg-primary" />
          <h2 className="font-display text-lg font-semibold uppercase tracking-[0.16em]">
            Interview-Liste
          </h2>
          <span className="text-xs text-muted-foreground tabular-nums">
            {filtered.length} / {posts.length}
          </span>
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
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Module</SelectItem>
              {workflow.map((w) => (
                <SelectItem key={w.num} value={String(w.num)}>{w.num}. {w.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
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
          <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-2">
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
                      <h3 className="font-display font-semibold truncate">{post.interview_title}</h3>
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
    </div>
  );
}

/* ============================================================
 * Sub-Components
 * ============================================================ */

function KpiTile({
  label,
  value,
  sub,
  icon: Icon,
  accent = "text-primary",
  onClick,
  isText = false,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: any;
  accent?: string;
  onClick?: () => void;
  isText?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-l-2xl rounded-r-md border bg-card p-4 text-left transition-all",
        "hover:shadow-md hover:border-primary/40"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground">{label}</div>
        <Icon className={cn("h-4 w-4", accent)} />
      </div>
      <div className={cn(
        "mt-2 font-display font-bold tabular-nums leading-none",
        isText ? "text-lg" : "text-3xl"
      )}>
        {value || "—"}
      </div>
      {sub && <div className="mt-1 truncate text-xs text-muted-foreground">{sub}</div>}
    </button>
  );
}

type Tone = "green" | "yellow" | "red" | "muted";

const toneChip: Record<Tone, string> = {
  green: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  yellow: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  red: "border-destructive/40 bg-destructive/10 text-destructive",
  muted: "border-border bg-muted text-muted-foreground",
};

interface DetailItem {
  id: string;
  title: string;
  sub?: string;
  tone?: Tone;
  onClick?: () => void;
}

function ModulePanel({
  meta,
  bigNumber,
  chips,
  details,
  footer,
  onOpen,
  onShowAll,
  totalCount,
  loading,
}: {
  meta: (typeof workflow)[number];
  bigNumber: number;
  chips: { label: string; value: number; tone: Tone }[];
  details: DetailItem[];
  footer?: React.ReactNode;
  onOpen: () => void;
  onShowAll: () => void;
  totalCount: number;
  loading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const Icon = meta.icon;

  return (
    <div className={cn(
      "group relative flex flex-col overflow-hidden rounded-l-[2rem] rounded-r-md border bg-card transition-all",
      "hover:shadow-lg hover:border-primary/30"
    )}>
      {/* Farb-Band links */}
      <div className={cn("absolute inset-y-0 left-0 w-1.5", meta.accent)} />

      <div className="pl-5 pr-4 pt-4 pb-3">
        <button onClick={onOpen} className="flex w-full items-start justify-between gap-2 text-left">
          <div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
              <span className="tabular-nums">0{meta.num}</span>
              <span>·</span>
              <span>{meta.title}</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-4xl font-bold tabular-nums leading-none">
                {loading ? "—" : bigNumber}
              </span>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </button>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <span
              key={c.label}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                toneChip[c.tone]
              )}
            >
              <span className="tabular-nums">{c.value}</span> {c.label}
            </span>
          ))}
        </div>

        {footer && <div className="mt-2">{footer}</div>}
      </div>

      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-center justify-between border-t bg-muted/30 px-5 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted/50">
            <span className="inline-flex items-center gap-1">
              {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              Details
            </span>
            {totalCount > 0 && (
              <span
                role="button"
                tabIndex={0}
                className="text-[10px] uppercase tracking-wider hover:text-foreground"
                onClick={(e) => { e.stopPropagation(); onShowAll(); }}
              >
                Alle {totalCount} ›
              </span>
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="max-h-72 overflow-y-auto divide-y">
            {details.length === 0 ? (
              <div className="px-5 py-4 text-xs text-muted-foreground">Nichts anstehend</div>
            ) : (
              details.map((d) => (
                <button
                  key={d.id}
                  onClick={d.onClick}
                  className="flex w-full items-center justify-between gap-2 px-5 py-2 text-left text-xs transition-colors hover:bg-muted/40"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{d.title}</div>
                    {d.sub && <div className="truncate text-[10px] text-muted-foreground">{d.sub}</div>}
                  </div>
                  {d.tone && (
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", {
                      "bg-emerald-500": d.tone === "green",
                      "bg-amber-500": d.tone === "yellow",
                      "bg-destructive": d.tone === "red",
                      "bg-muted-foreground/40": d.tone === "muted",
                    })} />
                  )}
                </button>
              ))
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
