import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Video, Loader2, ArrowRight, Play, Pause, RotateCcw, CheckCircle2,
  Sparkles, BookOpen, Save, Flag, Trash2, Plus, BookOpenCheck,
  CalendarClock, Copy, ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useAutoGrow } from "@/hooks/use-auto-grow";
import { SimpleMarkdown } from "@/lib/simple-markdown";
import { relativeChip } from "@/lib/relative-time";
import { GuideViewer } from "@/components/vorgespraech/GuideViewer";
import {
  GuideQuestionsChecklist,
  collectOrderedQuestions,
  type OrderedQuestion,
} from "@/components/aufzeichnung/GuideQuestionsChecklist";

type Marker = { id: string; ts: number; comment: string };

type Session = {
  id: string;
  post_id: string;
  status: "nicht_gestartet" | "laeuft" | "pausiert" | "beendet";
  accumulated_seconds: number;
  resumed_at: string | null;
  question_order: OrderedQuestion[];
  asked_question_ids: string[];
  interviewer_notiz: string | null;
  recording_markers: Marker[];
  scheduled_at: string | null;
  stream_url: string | null;
  stream_platform: string | null;
};

type QueueRow = {
  id: string;
  interview_title: string | null;
  status: string;
  speaker_id: string | null;
  speaker: { first_name: string | null; last_name: string | null; user_id: string | null } | null;
};

function fmtMMSS(total: number) {
  const s = Math.max(0, Math.floor(total));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

function isoToLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localInputToIso(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function fmtScheduled(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("de-DE", {
    weekday: "short", day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// relativeChip wird jetzt aus src/lib/relative-time.ts importiert

function StatusBadge({ postStatus, sessionStatus }: { postStatus?: string; sessionStatus?: string }) {
  if (postStatus === "aufzeichnung_done")
    return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">Aufzeichnung abgeschlossen</Badge>;
  if (sessionStatus === "laeuft")
    return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 animate-pulse">Läuft</Badge>;
  if (sessionStatus === "pausiert")
    return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">Pausiert</Badge>;
  if (postStatus === "aufzeichnung" || sessionStatus === "nicht_gestartet")
    return <Badge className="bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200">Bereit zur Aufzeichnung</Badge>;
  return <Badge variant="outline">{postStatus ?? "—"}</Badge>;
}

export default function Module6Aufzeichnung() {
  const [params] = useSearchParams();
  const postId = params.get("post_id");
  const { role, user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = role === "admin";
  const hasContext = !!postId;

  // Queue
  const [queueLoading, setQueueLoading] = useState(false);
  const [queue, setQueue] = useState<QueueRow[]>([]);

  useEffect(() => {
    if (hasContext || !role) return;
    (async () => {
      setQueueLoading(true);
      const { data, error } = await supabase
        .from("posts")
        .select("id, interview_title, status, speaker_id, speaker:speakers(first_name, last_name, user_id)")
        .in("status", ["vorgespraech_done", "aufzeichnung", "aufzeichnung_done"])
        .order("updated_at", { ascending: false });
      if (error) {
        toast({ title: "Fehler beim Laden", description: error.message, variant: "destructive" });
      } else {
        let rows = (data ?? []) as any[];
        if (role === "speaker" && user) rows = rows.filter((r) => r.speaker?.user_id === user.id);
        setQueue(rows as QueueRow[]);
      }
      setQueueLoading(false);
    })();
  }, [hasContext, role, user?.id]);

  // Detail state
  const [loading, setLoading] = useState(false);
  const [post, setPost] = useState<any | null>(null);
  const [speaker, setSpeaker] = useState<any | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [medienguide, setMedienguide] = useState<{ title: string; body_md: string; quick_tips: string[] } | null>(null);
  const [clarifications, setClarifications] = useState<Record<string, { answer: string; clarified: boolean }>>({});
  const [flowNotes, setFlowNotes] = useState<string>("");

  const [interviewerNotiz, setInterviewerNotiz] = useState("");
  const [notizMode, setNotizMode] = useState<"edit" | "preview">("edit");
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [newMarkerComment, setNewMarkerComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [decisionBusy, setDecisionBusy] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<string>("");
  const [streamUrl, setStreamUrl] = useState<string>("");
  const [streamPlatform, setStreamPlatform] = useState<string>("");
  const [sendeSaving, setSendeSaving] = useState(false);

  // Live-Timer (nur Anzeige)
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (session?.status !== "laeuft") return;
    const id = setInterval(() => setTick((t) => t + 1), 500);
    return () => clearInterval(id);
  }, [session?.status]);

  const currentSeconds = useMemo(() => {
    if (!session) return 0;
    let s = session.accumulated_seconds ?? 0;
    if (session.status === "laeuft" && session.resumed_at) {
      s += Math.max(0, Math.floor((Date.now() - new Date(session.resumed_at).getTime()) / 1000));
    }
    return s;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, tick]);

  const notizRef = useAutoGrow(interviewerNotiz, notizMode);

  useEffect(() => {
    if (!hasContext || !role) return;
    setLoading(true);
    (async () => {
      const { data: p } = await supabase
        .from("posts")
        .select("id, interview_title, status, speaker_id")
        .eq("id", postId!)
        .maybeSingle();
      setPost(p);

      let sp: any = null;
      if (p?.speaker_id) {
        const { data: s } = await supabase
          .from("speakers")
          .select("id, first_name, last_name, industry")
          .eq("id", p.speaker_id)
          .maybeSingle();
        sp = s;
      }
      setSpeaker(sp);

      // Guide für Fallback und initiale Reihenfolge
      const { data: g } = await (supabase as any)
        .from("interview_guides")
        .select("hauptfragen, vertiefungsfragen, kritische_fragen")
        .eq("post_id", postId!)
        .maybeSingle();

      if (g && role === "speaker") {
        const strip = (arr: any[] | null) =>
          Array.isArray(arr) ? arr.map(({ interviewer_notiz, ...rest }) => rest) : arr;
        g.hauptfragen = strip(g.hauptfragen);
        g.vertiefungsfragen = strip(g.vertiefungsfragen);
        g.kritische_fragen = strip(g.kritische_fragen);
      }



      // Session laden oder anlegen (Admin only)
      const sessionSelect = role === "admin"
        ? "*"
        : "id, post_id, status, accumulated_seconds, resumed_at, question_order, asked_question_ids, scheduled_at, stream_url, stream_platform";
      let { data: sess } = await (supabase as any)
        .from("recording_sessions")
        .select(sessionSelect)
        .eq("post_id", postId!)
        .maybeSingle();

      if (!sess && isAdmin) {
        const order = collectOrderedQuestions(g);
        const { data: created, error: createErr } = await (supabase as any)
          .from("recording_sessions")
          .insert({ post_id: postId!, question_order: order })
          .select("*")
          .single();
        if (createErr) {
          toast({ title: "Session konnte nicht angelegt werden", description: createErr.message, variant: "destructive" });
        } else {
          sess = created;
          // Post auf 'aufzeichnung' setzen, falls noch nicht
          if (p?.status === "vorgespraech_done") {
            await supabase.from("posts").update({ status: "aufzeichnung" }).eq("id", postId!);
            setPost((prev: any) => ({ ...(prev ?? {}), status: "aufzeichnung" }));
          }
        }
      }

      if (sess) {
        // Fallback: wenn question_order leer, aus Guide ableiten (read-only Anzeige)
        if (!Array.isArray(sess.question_order) || sess.question_order.length === 0) {
          sess.question_order = collectOrderedQuestions(g);
        } else {
          // Notizen aus aktuellem Leitfaden nachziehen (Snapshot könnte veraltet sein)
          const latest = collectOrderedQuestions(g);
          const noteMap = new Map(latest.map((q) => [q.id, q.interviewer_notiz]));
          sess.question_order = (sess.question_order as OrderedQuestion[]).map((q) => ({
            ...q,
            interviewer_notiz: noteMap.get(q.id) ?? q.interviewer_notiz ?? null,
          }));
        }
        // Speaker darf interviewer_notiz nicht sehen
        if (role === "speaker") {
          sess.interviewer_notiz = null;
          sess.question_order = (sess.question_order as OrderedQuestion[]).map((q) => ({
            ...q, interviewer_notiz: null,
          }));
        }
        setSession(sess as Session);
        setInterviewerNotiz(sess.interviewer_notiz ?? "");
        setMarkers(Array.isArray(sess.recording_markers) ? sess.recording_markers : []);
        setScheduledAt(isoToLocalInput(sess.scheduled_at));
        setStreamUrl(sess.stream_url ?? "");
        setStreamPlatform(sess.stream_platform ?? "");
      }

      // Medientraining
      const { data: mg } = await (supabase as any)
        .from("knowledge_guides")
        .select("title, body_md, quick_tips")
        .eq("key", "speaker_medientraining")
        .eq("active", true)
        .maybeSingle();
      if (mg) {
        setMedienguide({
          title: mg.title,
          body_md: mg.body_md,
          quick_tips: Array.isArray(mg.quick_tips) ? mg.quick_tips : [],
        });
      }

      // Klärungsantworten + Ablauf-Notizen aus Vorgespräch (für Admin und Speaker)
      const { data: pc } = await (supabase as any)
        .from("pre_interview_calls")
        .select("clarifications, flow_notes")
        .eq("post_id", postId!)
        .maybeSingle();
      if (pc?.clarifications && Array.isArray(pc.clarifications)) {
        const map: Record<string, { answer: string; clarified: boolean }> = {};
        for (const c of pc.clarifications as any[]) {
          if (c?.question_id) {
            map[c.question_id] = { answer: c.answer ?? "", clarified: !!c.clarified };
          }
        }
        setClarifications(map);
      } else {
        setClarifications({});
      }
      setFlowNotes(pc?.flow_notes ?? "");



      setLoading(false);
    })();
  }, [postId, hasContext, role, isAdmin]);

  // ---------- Timer-Aktionen (Admin only, sofortiges Persist) ----------
  async function patchSession(patch: Partial<Session>) {
    if (!session) return;
    const { data, error } = await (supabase as any)
      .from("recording_sessions")
      .update(patch)
      .eq("id", session.id)
      .select("*")
      .single();
    if (error) {
      toast({ title: "Aktion fehlgeschlagen", description: error.message, variant: "destructive" });
      return;
    }
    setSession((prev) => (prev ? { ...prev, ...data } : data));
  }

  async function timerStart() {
    if (!session || session.status === "laeuft") return;
    await patchSession({ status: "laeuft", resumed_at: new Date().toISOString() } as any);
  }
  async function timerPause() {
    if (!session || session.status !== "laeuft") return;
    const acc = currentSeconds;
    await patchSession({ status: "pausiert", accumulated_seconds: acc, resumed_at: null } as any);
  }
  async function timerReset() {
    if (!session) return;
    await patchSession({ status: "nicht_gestartet", accumulated_seconds: 0, resumed_at: null } as any);
  }

  async function saveSendeplanung() {
    if (!session) return;
    setSendeSaving(true);
    await patchSession({
      scheduled_at: localInputToIso(scheduledAt),
      stream_url: streamUrl.trim() || null,
      stream_platform: streamPlatform.trim() || null,
    } as any);
    setSendeSaving(false);
    toast({ title: "Sendeplanung gespeichert" });
  }

  async function copyStreamUrl() {
    if (!streamUrl) return;
    try {
      await navigator.clipboard.writeText(streamUrl);
      toast({ title: "Link kopiert" });
    } catch {
      toast({ title: "Kopieren fehlgeschlagen", variant: "destructive" });
    }
  }


  async function addMarker() {
    if (!session) return;
    const ts = currentSeconds;
    const m: Marker = {
      id: crypto.randomUUID(),
      ts,
      comment: newMarkerComment.trim(),
    };
    const next = [...markers, m].sort((a, b) => a.ts - b.ts);
    setMarkers(next);
    setNewMarkerComment("");
    await patchSession({ recording_markers: next } as any);
  }

  async function updateMarker(id: string, patch: Partial<Marker>) {
    const next = markers.map((m) => (m.id === id ? { ...m, ...patch } : m));
    setMarkers(next);
    await patchSession({ recording_markers: next } as any);
  }
  async function removeMarker(id: string) {
    const next = markers.filter((m) => m.id !== id);
    setMarkers(next);
    await patchSession({ recording_markers: next } as any);
  }

  async function toggleAsked(qid: string, asked: boolean) {
    if (!session) return;
    const set = new Set(session.asked_question_ids ?? []);
    if (asked) set.add(qid); else set.delete(qid);
    const arr = Array.from(set);
    setSession({ ...session, asked_question_ids: arr });
    await patchSession({ asked_question_ids: arr } as any);
  }

  async function saveNotiz() {
    if (!session) return;
    setSaving(true);
    await patchSession({ interviewer_notiz: interviewerNotiz || null } as any);
    setSaving(false);
    toast({ title: "Notiz gespeichert" });
  }

  async function decide(action: "beenden" | "zurueck_offen") {
    if (!session) return;
    setDecisionBusy(true);
    const { data: s } = await supabase.auth.getSession();
    const token = s.session?.access_token;
    const { data, error } = await supabase.functions.invoke("recording-decision", {
      body: { session_id: session.id, action },
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    setDecisionBusy(false);
    if (error || (data as any)?.error) {
      toast({ title: "Aktion fehlgeschlagen", description: (data as any)?.error ?? error?.message, variant: "destructive" });
      return;
    }
    toast({ title: "Status aktualisiert" });
    const { data: sess } = await (supabase as any)
      .from("recording_sessions").select("*").eq("id", session.id).maybeSingle();
    if (sess) {
      if (role === "speaker") sess.interviewer_notiz = null;
      setSession(sess as Session);
    }
    const { data: p } = await supabase.from("posts").select("status").eq("id", session.post_id).maybeSingle();
    if (p) setPost((prev: any) => ({ ...(prev ?? {}), status: p.status }));
  }

  // ==================== Listen-Ansicht ====================
  if (!hasContext) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-6">
        <div className="flex items-start gap-4">
          <div className="rounded-lg border bg-card p-3">
            <Video className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="text-sm text-muted-foreground tabular-nums">Modul 6</div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Aufzeichnung / Live</h1>
            <p className="text-muted-foreground mt-2">
              {isAdmin
                ? "Cockpit für Interviewer: Timer, Fragen-Fortschritt und Schnittmarken."
                : "Deine anstehenden und aufgezeichneten Interviews."}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {isAdmin ? "Aufzeichnungs-Warteschlange" : "Meine Aufzeichnungen"}
            </CardTitle>
            <CardDescription>
              Interviews nach durchgeführtem Vorgespräch, in Aufzeichnung oder abgeschlossen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {queueLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : queue.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Aktuell keine Interviews in dieser Phase.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Interview</TableHead>
                    {isAdmin && <TableHead>Speaker</TableHead>}
                    <TableHead className="w-52">Status</TableHead>
                    <TableHead className="w-40 text-right">Aktion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queue.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.interview_title ?? "—"}</TableCell>
                      {isAdmin && (
                        <TableCell className="text-sm">
                          {row.speaker
                            ? `${row.speaker.first_name ?? ""} ${row.speaker.last_name ?? ""}`.trim() || "—"
                            : "—"}
                        </TableCell>
                      )}
                      <TableCell><StatusBadge postStatus={row.status} /></TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant={isAdmin ? "default" : "outline"}
                          onClick={() => navigate(`/module/aufzeichnung?post_id=${row.id}`)}
                        >
                          {isAdmin ? "Öffnen" : "Ansehen"} <ArrowRight className="ml-1 h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ==================== Detail / Cockpit ====================
  const askedCount = session?.asked_question_ids?.length ?? 0;
  const totalCount = session?.question_order?.length ?? 0;
  const pct = totalCount > 0 ? Math.round((askedCount / totalCount) * 100) : 0;
  const isDone = post?.status === "aufzeichnung_done";

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 space-y-6">
      <div className="flex items-start gap-4">
        <div className="rounded-lg border bg-card p-3">
          <Video className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <div className="text-sm text-muted-foreground tabular-nums">Modul 6</div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Aufzeichnung / Live</h1>
          <p className="text-muted-foreground mt-2">
            {isAdmin
              ? "Sendeplanung, Timer, Fragenkatalog und Schnittmarken in einem Cockpit."
              : "Fortschritt deiner Aufzeichnung und Vorbereitung."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {postId && <ContextSheet postId={postId} />}
          <StatusBadge postStatus={post?.status} sessionStatus={session?.status} />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : !session ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Für dieses Interview wurde noch keine Aufzeichnungs-Session angelegt.
            {!isAdmin && <div className="mt-1">Sobald der Interviewer startet, siehst du hier den Fortschritt.</div>}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Kontext */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Interview</CardTitle></CardHeader>
              <CardContent className="text-sm">
                <div className="font-medium">{post?.interview_title ?? "—"}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Speaker</CardTitle></CardHeader>
              <CardContent className="text-sm">
                <div className="font-medium">{speaker?.first_name} {speaker?.last_name}</div>
                <div className="text-xs text-muted-foreground">{speaker?.industry ?? "—"}</div>
              </CardContent>
            </Card>
          </div>

          {/* Sendeplanung */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-primary" /> Sendeplanung
              </CardTitle>
              <CardDescription>
                {isAdmin
                  ? "Termin, Plattform und Streaming-Link für die Aufzeichnung."
                  : "Termin und Zugang zur Aufzeichnung."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isAdmin ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Termin</label>
                      <Input
                        type="datetime-local"
                        value={scheduledAt}
                        onChange={(e) => setScheduledAt(e.target.value)}
                      />
                      {scheduledAt && (
                        <div className="text-xs text-muted-foreground">
                          {relativeChip(localInputToIso(scheduledAt))}
                        </div>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Plattform</label>
                      <Input
                        placeholder="z. B. Zoom, StreamYard, Riverside"
                        value={streamPlatform}
                        onChange={(e) => setStreamPlatform(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Streaming-Link</label>
                    <div className="flex gap-2">
                      <Input
                        type="url"
                        placeholder="https://…"
                        value={streamUrl}
                        onChange={(e) => setStreamUrl(e.target.value)}
                      />
                      <Button type="button" variant="outline" size="icon" onClick={copyStreamUrl} disabled={!streamUrl}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={saveSendeplanung} disabled={sendeSaving}>
                      {sendeSaving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
                      Speichern
                    </Button>
                  </div>
                </>
              ) : session.scheduled_at || session.stream_url ? (
                <div className="space-y-3 text-sm">
                  {session.scheduled_at && (
                    <div>
                      <div className="font-medium">{fmtScheduled(session.scheduled_at)}</div>
                      <div className="text-xs text-muted-foreground">{relativeChip(session.scheduled_at)}</div>
                    </div>
                  )}
                  {session.stream_platform && (
                    <div className="text-muted-foreground">Plattform: <span className="text-foreground">{session.stream_platform}</span></div>
                  )}
                  {session.stream_url && (
                    <div className="flex flex-wrap items-center gap-2">
                      <Button asChild size="sm">
                        <a href={session.stream_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-1.5 h-4 w-4" /> Zum Stream öffnen
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" onClick={copyStreamUrl}>
                        <Copy className="mr-1.5 h-4 w-4" /> Link kopieren
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Termin wird noch bekannt gegeben.</div>
              )}
            </CardContent>
          </Card>

          {/* Timer */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Time Counter</CardTitle>
              <CardDescription>
                {isAdmin
                  ? "Starten, Pausieren und Zurücksetzen — der Stand wird sofort für alle Beteiligten aktualisiert."
                  : "Aktueller Aufzeichnungs-Stand (Live vom Interviewer)."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-6">
              <div className="font-mono text-5xl tabular-nums tracking-tight">
                {fmtMMSS(currentSeconds)}
              </div>
              {isAdmin && !isDone && (
                <div className="flex flex-wrap gap-2">
                  {session.status !== "laeuft" ? (
                    <Button onClick={timerStart}>
                      <Play className="mr-1.5 h-4 w-4" />{" "}
                      {session.status === "pausiert" ? "Fortsetzen" : "Start"}
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={timerPause}>
                      <Pause className="mr-1.5 h-4 w-4" /> Pause
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <RotateCcw className="mr-1.5 h-4 w-4" /> Zurücksetzen
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Timer wirklich zurücksetzen?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Der aktuelle Stand ({fmtMMSS(currentSeconds)}) wird auf 00:00 gesetzt.
                          Schnittmarken bleiben erhalten.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction onClick={timerReset}>Zurücksetzen</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fragen-Checklist */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4" /> Fragen-Fortschritt
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                  {askedCount} / {totalCount} gestellt
                </Badge>
              </CardTitle>
              <CardDescription>
                {isAdmin
                  ? "Hake während der Aufzeichnung die bereits gestellten Fragen ab."
                  : "So weit ist der Interviewer im Fragenkatalog."}
              </CardDescription>
              <Progress value={pct} className="h-2 mt-2" />
            </CardHeader>
            <CardContent>
              <GuideQuestionsChecklist
                questions={session.question_order ?? []}
                askedIds={session.asked_question_ids ?? []}
                readOnly={!isAdmin || isDone}
                onToggle={toggleAsked}
                showNotes={isAdmin}
                clarifications={clarifications}
                showClarifications
              />
            </CardContent>
          </Card>

          {/* Marker (Admin only) */}
          {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Flag className="h-4 w-4" /> Schnittmarken
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                  {markers.length}
                </Badge>
              </CardTitle>
              <CardDescription>
                Setze Marker beim aktuellen Timer-Stand — auch nach Abschluss editierbar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/30 p-2">
                <div className="font-mono text-sm tabular-nums px-2 py-1 rounded bg-background border">
                  {fmtMMSS(currentSeconds)}
                </div>
                <Input
                  value={newMarkerComment}
                  onChange={(e) => setNewMarkerComment(e.target.value)}
                  placeholder='Kommentar (optional) — z. B. „Kernaussage", „Schnitt hier", „Rückfrage" …'
                  className="flex-1 min-w-[200px]"
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addMarker(); } }}
                />
                <Button size="sm" onClick={addMarker}>
                  <Plus className="mr-1.5 h-4 w-4" /> Marker setzen
                </Button>
              </div>

              {markers.length === 0 ? (
                <div className="py-4 text-center text-sm text-muted-foreground italic">
                  Noch keine Schnittmarken gesetzt.
                </div>
              ) : (
                <ul className="space-y-1.5">
                  {markers.map((m) => (
                    <li key={m.id} className="flex items-start gap-2 rounded-md border p-2">
                      <div className="font-mono text-sm tabular-nums px-2 py-1 rounded bg-muted/50 shrink-0">
                        {fmtMMSS(m.ts)}
                      </div>
                      <Input
                        value={m.comment}
                        onChange={(e) => updateMarker(m.id, { comment: e.target.value })}
                        placeholder="Kommentar …"
                        className="flex-1 h-8"
                      />
                      <Button
                        variant="ghost" size="icon"
                        onClick={() => removeMarker(m.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        title="Marker löschen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          )}

          {/* Ablauf & Aufbau (aus Vorgespräch — beide Rollen) */}
          {flowNotes?.trim() && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="h-4 w-4" /> Ablauf & Aufbau
                </CardTitle>
                <CardDescription>
                  Aus dem Vorgespräch übernommen — Referenz für den Interview-Ablauf.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleMarkdown text={flowNotes} />
              </CardContent>
            </Card>
          )}

          {/* Interviewer-Notiz (Admin only) */}
          {isAdmin && (
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                <div>
                  <CardTitle className="text-base">Interviewer-Notiz</CardTitle>
                  <CardDescription>
                    Nur für die Redaktion sichtbar — Beobachtungen, Follow-ups, Auffälligkeiten.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="inline-flex rounded-md border p-0.5">
                    <Button
                      type="button"
                      variant={notizMode === "edit" ? "secondary" : "ghost"}
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => setNotizMode("edit")}
                    >
                      Bearbeiten
                    </Button>
                    <Button
                      type="button"
                      variant={notizMode === "preview" ? "secondary" : "ghost"}
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => setNotizMode("preview")}
                    >
                      Vorschau
                    </Button>
                  </div>
                  <Button variant="outline" size="sm" onClick={saveNotiz} disabled={saving}>
                    {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
                    Speichern
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {notizMode === "edit" ? (
                  <Textarea
                    ref={notizRef}
                    value={interviewerNotiz}
                    onChange={(e) => setInterviewerNotiz(e.target.value)}
                    placeholder="Notizen zur Aufzeichnung …"
                    rows={2}
                  />
                ) : (
                  <div className="rounded-md border bg-muted/30 p-3 min-h-[3rem] text-sm">
                    {interviewerNotiz.trim() ? (
                      <SimpleMarkdown text={interviewerNotiz} />
                    ) : (
                      <span className="text-muted-foreground italic">Noch keine Notizen erfasst.</span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Medientraining */}
          {medienguide && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> Tipps für den Speaker
                </CardTitle>
                <CardDescription>{medienguide.title}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-1.5">
                  {medienguide.quick_tips.map((t, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm">
                      <BookOpenCheck className="mr-1.5 h-4 w-4" /> Vollständiges Medientraining lesen
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>{medienguide.title}</SheetTitle>
                      <SheetDescription>Freigeist-Speaker-Guide (M5 & M6)</SheetDescription>
                    </SheetHeader>
                    <div className="mt-4">
                      <GuideViewer markdown={medienguide.body_md} />
                    </div>
                  </SheetContent>
                </Sheet>
              </CardContent>
            </Card>
          )}

          {/* Aktionen */}
          {isAdmin && (
            <div className="flex flex-wrap items-center justify-end gap-2 sticky bottom-4 bg-background/80 backdrop-blur rounded-lg border p-3">
              {!isDone ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button disabled={decisionBusy}>
                      <CheckCircle2 className="mr-1.5 h-4 w-4" /> Aufzeichnung abschließen
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Aufzeichnung abschließen?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Der Timer wird finalisiert ({fmtMMSS(currentSeconds)}) und der Interview-Status
                        wechselt auf „Aufzeichnung abgeschlossen". Schnittmarken und Notizen bleiben
                        auch danach editierbar.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                      <AlertDialogAction onClick={() => decide("beenden")}>Abschließen</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <Button variant="outline" onClick={() => decide("zurueck_offen")} disabled={decisionBusy}>
                  <RotateCcw className="mr-1.5 h-4 w-4" /> Wieder öffnen
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
