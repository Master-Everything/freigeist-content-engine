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
  ChevronsDown,
  ChevronsUp,
  CalendarClock,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { relativeChip } from "@/lib/relative-time";
import { KpiTile } from "@/components/dashboard/KpiTile";
import { ModulePanel } from "@/components/dashboard/ModulePanel";

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
  redaktion_angefragt: 3,
  in_bearbeitung: 3,
  profil: 3,
  profil_review: 3,
  leitfaden: 4,
  leitfaden_final: 4,
  vorgespraech: 5,
  vorgespraech_done: 5,
  aufzeichnung: 6,
  aufzeichnung_done: 7,
  hub_pushed: 8,
};

const statusConfig: Record<string, { label: string; className: string }> = {
  erfassung: { label: "In Erfassung", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  scan_pending: { label: "Scan läuft", className: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" },
  scan_done: { label: "Scan fertig", className: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" },
  redaktion_angefragt: { label: "Redaktion angefragt", className: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200" },
  in_bearbeitung: { label: "In Bearbeitung", className: "bg-warning text-warning-foreground" },
  profil: { label: "Profil", className: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200" },
  profil_review: { label: "Profil-Review", className: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200" },
  leitfaden: { label: "Leitfaden", className: "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900 dark:text-fuchsia-200" },
  leitfaden_final: { label: "Leitfaden final", className: "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900 dark:text-fuchsia-200" },
  vorgespraech: { label: "Vorgespräch", className: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200" },
  vorgespraech_done: { label: "Vorgespräch fertig", className: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200" },
  aufzeichnung: { label: "Aufzeichnung", className: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200" },
  aufzeichnung_done: { label: "Aufzeichnung fertig", className: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200" },
  hub_pushed: { label: "An Hub gesendet", className: "bg-success text-success-foreground" },
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

  const [openPanels, setOpenPanels] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(sessionStorage.getItem("dashboard.openPanels") || "{}");
    } catch {
      return {};
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.setItem("dashboard.openPanels", JSON.stringify(openPanels));
    } catch {
      /* ignore quota errors */
    }
  }, [openPanels]);

  const allOpen = workflow.every((w) => openPanels[w.key]);
  const toggleAllPanels = () => {
    const next = !allOpen;
    setOpenPanels(Object.fromEntries(workflow.map((w) => [w.key, next])));
  };
  const panelOpenProps = (key: string) => ({
    open: !!openPanels[key],
    onOpenChange: (v: boolean) =>
      setOpenPanels((p) => ({ ...p, [key]: v })),
  });

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
    const pushedThisMonth = posts.filter(
      (p) => p.status === "hub_pushed" && new Date(p.updated_at) >= startOfMonth
    ).length;

    // M7 = Beiträge zwischen aufzeichnung_done und hub_pushed
    const m7Ready = posts.filter((p) => p.status === "aufzeichnung_done");
    const m7InProgress = posts.filter((p) =>
      ["redaktion_angefragt", "in_bearbeitung", "profil", "profil_review",
       "leitfaden", "leitfaden_final", "vorgespraech", "vorgespraech_done",
       "aufzeichnung"].includes(p.status)
    );

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
        draft: m7Ready,
        in_progress: m7InProgress,
      },
      m8: {
        exported: posts.filter((p) => p.status === "hub_pushed"),
        pushed: posts.filter((p) => !!p.hub_pushed_at).length,
        errors: posts.filter((p) => !!p.hub_last_error).length,
        thisMonth: pushedThisMonth,
      },
      kpi: {
        active: posts.filter((p) => p.status !== "hub_pushed").length,
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
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAllPanels}
              title={allOpen ? "Alle Details schließen" : "Alle Details öffnen"}
            >
              {allOpen ? (
                <>
                  <ChevronsUp className="mr-1.5 h-4 w-4" />
                  Alle schließen
                </>
              ) : (
                <>
                  <ChevronsDown className="mr-1.5 h-4 w-4" />
                  Alle öffnen
                </>
              )}
            </Button>
            <Button onClick={() => navigate("/module/erfassung")} size="lg">
              <Plus className="mr-1.5 h-4 w-4" />
              {role === "admin" ? "Neues Interview" : "Neues Interview anstoßen"}
            </Button>
          </div>

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
          label="Diesen Monat an Hub gesendet"
          value={agg.m8.thisMonth}
          icon={Sparkles}
          accent="text-primary"
          onClick={() => jumpToList(8, "hub_pushed")}
        />
      </div>

      {/* MODUL-GRID */}
      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* M1 */}
        <ModulePanel
          meta={workflow[0]}
          {...panelOpenProps(workflow[0].key)}
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
          {...panelOpenProps(workflow[1].key)}
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
          {...panelOpenProps(workflow[2].key)}
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
          {...panelOpenProps(workflow[3].key)}
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
          {...panelOpenProps(workflow[4].key)}
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
          {...panelOpenProps(workflow[5].key)}
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
          {...panelOpenProps(workflow[6].key)}
          bigNumber={agg.m7.draft.length + agg.m7.in_progress.length}
          chips={[
            { label: "bereit", value: agg.m7.draft.length, tone: "muted" },
            { label: "in Arbeit", value: agg.m7.in_progress.length, tone: "yellow" },
          ]}
          details={[...agg.m7.in_progress, ...agg.m7.draft].slice(0, 8).map((p) => ({
            id: p.id,
            title: p.interview_title,
            sub: p.guest_name,
            tone: p.status === "aufzeichnung_done" ? "muted" : "yellow",
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
          {...panelOpenProps(workflow[7].key)}
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
          onShowAll={() => jumpToList(8, "hub_pushed")}
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
            <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              <SelectItem value="erfassung">In Erfassung</SelectItem>
              <SelectItem value="scan_done">Scan fertig</SelectItem>
              <SelectItem value="in_bearbeitung">In Bearbeitung</SelectItem>
              <SelectItem value="leitfaden_final">Leitfaden final</SelectItem>
              <SelectItem value="aufzeichnung_done">Aufzeichnung fertig</SelectItem>
              <SelectItem value="hub_pushed">An Hub gesendet</SelectItem>
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
              const cfg = statusConfig[post.status] || { label: post.status, className: "bg-muted text-muted-foreground" };
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

