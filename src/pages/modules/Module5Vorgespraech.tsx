import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  MessagesSquare, Loader2, ArrowRight, CalendarClock, CheckCircle2,
  Sparkles, BookOpen, StickyNote, Save, RotateCcw, ExternalLink, BookOpenCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
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
import { GuideQuestionsCompact } from "@/components/vorgespraech/GuideQuestionsCompact";
import { GuideViewer } from "@/components/vorgespraech/GuideViewer";
import type { GuideQuestion } from "@/components/leitfaden/LeitfadenEditor";

type Clarification = {
  question_id: string;
  block: "haupt" | "vertiefung" | "kritisch";
  question_text: string;
  hint: string;
  answer: string;
  clarified: boolean;
};

type PreCall = {
  id: string;
  post_id: string;
  scheduled_at: string | null;
  meeting_link: string | null;
  status: "geplant" | "durchgefuehrt" | "abgesagt";
  flow_notes: string | null;
  clarifications: Clarification[];
  internal_notes: string | null;
};

type QueueRow = {
  id: string;
  interview_title: string | null;
  status: string;
  speaker_id: string | null;
  speaker: { first_name: string | null; last_name: string | null; user_id: string | null } | null;
};

const BLOCK_LABEL: Record<Clarification["block"], string> = {
  haupt: "Hauptfrage",
  vertiefung: "Vertiefung",
  kritisch: "Kritisch",
};

function StatusBadge({ callStatus, postStatus }: { callStatus?: string; postStatus?: string }) {
  if (postStatus === "vorgespraech_done" || callStatus === "durchgefuehrt")
    return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">Vorgespräch durchgeführt</Badge>;
  if (callStatus === "abgesagt")
    return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Abgesagt</Badge>;
  if (callStatus === "geplant")
    return <Badge className="bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200">Vorgespräch geplant</Badge>;
  return <Badge variant="outline">{postStatus ?? "—"}</Badge>;
}

function buildClarifications(guide: any): Clarification[] {
  if (!guide) return [];
  const collect = (arr: GuideQuestion[] | null | undefined, block: Clarification["block"]) =>
    (arr ?? [])
      .filter((q) => q.active && (q.interviewer_notiz ?? "").trim().length > 0)
      .map<Clarification>((q) => ({
        question_id: q.id,
        block,
        question_text: q.text,
        hint: q.interviewer_notiz ?? "",
        answer: "",
        clarified: false,
      }));
  return [
    ...collect(guide.hauptfragen, "haupt"),
    ...collect(guide.vertiefungsfragen, "vertiefung"),
    ...collect(guide.kritische_fragen, "kritisch"),
  ];
}

function mergeClarifications(existing: Clarification[], fresh: Clarification[]): Clarification[] {
  const map = new Map(existing.map((c) => [c.question_id, c] as const));
  return fresh.map((f) => {
    const prev = map.get(f.question_id);
    return prev ? { ...f, answer: prev.answer, clarified: prev.clarified } : f;
  });
}

export default function Module5Vorgespraech() {
  const [params] = useSearchParams();
  const postId = params.get("post_id");
  const { role, user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = role === "admin";
  const hasContext = !!postId;

  // Listen-View
  const [queueLoading, setQueueLoading] = useState(false);
  const [queue, setQueue] = useState<QueueRow[]>([]);

  useEffect(() => {
    if (hasContext || !role) return;
    (async () => {
      setQueueLoading(true);
      const { data, error } = await supabase
        .from("posts")
        .select("id, interview_title, status, speaker_id, speaker:speakers(first_name, last_name, user_id)")
        .in("status", ["leitfaden_final", "vorgespraech", "vorgespraech_done"])
        .order("updated_at", { ascending: false });
      if (error) {
        toast({ title: "Fehler beim Laden", description: error.message, variant: "destructive" });
      } else {
        let rows = (data ?? []) as any[];
        if (role === "speaker" && user) {
          rows = rows.filter((r) => r.speaker?.user_id === user.id);
        }
        setQueue(rows as QueueRow[]);
      }
      setQueueLoading(false);
    })();
  }, [hasContext, role, user?.id]);

  // Detail-View state
  const [loading, setLoading] = useState(false);
  const [post, setPost] = useState<any | null>(null);
  const [speaker, setSpeaker] = useState<any | null>(null);
  const [guide, setGuide] = useState<any | null>(null);
  const [call, setCall] = useState<PreCall | null>(null);
  const [medienguide, setMedienguide] = useState<{ title: string; body_md: string; quick_tips: string[] } | null>(null);

  const [scheduledAt, setScheduledAt] = useState<string>("");
  const [meetingLink, setMeetingLink] = useState("");
  const [flowNotes, setFlowNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [clarifications, setClarifications] = useState<Clarification[]>([]);
  const [onlyOpen, setOnlyOpen] = useState(true);
  const [saving, setSaving] = useState(false);
  const [decisionBusy, setDecisionBusy] = useState(false);

  const flowRef = useAutoGrow(flowNotes);
  const internalRef = useAutoGrow(internalNotes);

  useEffect(() => {
    if (!hasContext || !role) return;
    setLoading(true);
    (async () => {
      // Post + Speaker
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

      // Guide — Speaker sees limited columns
      const guideSelect =
        role === "admin"
          ? "id, hauptfragen, vertiefungsfragen, kritische_fragen"
          : "id, hauptfragen, vertiefungsfragen, kritische_fragen";
      const { data: g } = await (supabase as any)
        .from("interview_guides")
        .select(guideSelect)
        .eq("post_id", postId!)
        .maybeSingle();
      // Speaker darf interviewer_notiz nicht sehen
      if (g && role === "speaker") {
        const strip = (arr: any[] | null) =>
          Array.isArray(arr) ? arr.map(({ interviewer_notiz, ...rest }) => rest) : arr;
        g.hauptfragen = strip(g.hauptfragen);
        g.vertiefungsfragen = strip(g.vertiefungsfragen);
        g.kritische_fragen = strip(g.kritische_fragen);
      }
      setGuide(g ?? null);

      // pre_interview_calls — Spalten-Whitelist: Speaker sieht kein internal_notes
      const callSelect = role === "admin"
        ? "*"
        : "id, post_id, scheduled_at, meeting_link, status, flow_notes, clarifications";
      let { data: c } = await (supabase as any)
        .from("pre_interview_calls")
        .select(callSelect)
        .eq("post_id", postId!)
        .maybeSingle();
      if (!c && role === "admin") {
        const fresh = buildClarifications(g);
        const { data: created, error: createErr } = await (supabase as any)
          .from("pre_interview_calls")
          .insert({ post_id: postId!, clarifications: fresh })
          .select(callSelect)
          .single();
        if (createErr) {
          toast({ title: "Vorgespräch konnte nicht angelegt werden", description: createErr.message, variant: "destructive" });
        } else {
          c = created;
        }
      }
      if (c) {
        setCall(c);
        setScheduledAt(c.scheduled_at ? new Date(c.scheduled_at).toISOString().slice(0, 16) : "");
        setMeetingLink(c.meeting_link ?? "");
        setFlowNotes(c.flow_notes ?? "");
        setInternalNotes(c.internal_notes ?? "");
        setClarifications(Array.isArray(c.clarifications) ? c.clarifications : []);
      }

      // Medientraining-Guide
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

      setLoading(false);
    })();
  }, [postId, hasContext, role]);

  const openCount = clarifications.filter((c) => !c.clarified).length;
  const visibleClarifications = useMemo(
    () => (onlyOpen ? clarifications.filter((c) => !c.clarified) : clarifications),
    [clarifications, onlyOpen]
  );

  async function saveAll() {
    if (!call) return;
    setSaving(true);
    const payload: any = {
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      meeting_link: meetingLink || null,
      flow_notes: flowNotes || null,
      internal_notes: internalNotes || null,
      clarifications,
    };
    const { data, error } = await (supabase as any)
      .from("pre_interview_calls")
      .update(payload)
      .eq("id", call.id)
      .select("*")
      .single();
    setSaving(false);
    if (error) {
      toast({ title: "Speichern fehlgeschlagen", description: error.message, variant: "destructive" });
      return;
    }
    setCall(data);
    toast({ title: "Gespeichert" });
  }

  async function refreshClarificationsFromGuide() {
    if (!guide) return;
    const fresh = buildClarifications(guide);
    const merged = mergeClarifications(clarifications, fresh);
    setClarifications(merged);
    toast({ title: "Klärungspunkte aus Leitfaden übernommen", description: `${merged.length} Einträge (Antworten & Häkchen bleiben erhalten)` });
  }

  async function decide(action: "durchgefuehrt" | "abgesagt" | "zurueck_geplant") {
    if (!call) return;
    setDecisionBusy(true);
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    const { data, error } = await supabase.functions.invoke("vorgespraech-decision", {
      body: { call_id: call.id, action },
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    setDecisionBusy(false);
    if (error || (data as any)?.error) {
      toast({ title: "Aktion fehlgeschlagen", description: (data as any)?.error ?? error?.message, variant: "destructive" });
      return;
    }
    toast({ title: "Status aktualisiert" });
    // Reload
    const { data: c } = await (supabase as any)
      .from("pre_interview_calls").select("*").eq("id", call.id).maybeSingle();
    if (c) setCall(c);
    const { data: p } = await supabase.from("posts").select("status").eq("id", call.post_id).maybeSingle();
    if (p) setPost((prev: any) => ({ ...(prev ?? {}), status: p.status }));
  }

  // ============================================================
  // Listen-Ansicht
  // ============================================================
  if (!hasContext) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-6">
        <div className="flex items-start gap-4">
          <div className="rounded-lg border bg-card p-3">
            <MessagesSquare className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="text-sm text-muted-foreground tabular-nums">Modul 5</div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Vorgespräch</h1>
            <p className="text-muted-foreground mt-2">
              {isAdmin
                ? "Live-Cockpit für Vorgespräche: Termine, offene Klärungen und Notizen."
                : "Deine anstehenden und durchgeführten Vorgespräche."}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {isAdmin ? "Vorgespräch-Warteschlange" : "Meine Vorgespräche"}
            </CardTitle>
            <CardDescription>
              Interviews mit finalisiertem Leitfaden, geplantem oder durchgeführtem Vorgespräch.
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
                          onClick={() => navigate(`/module/vorgespraech?post_id=${row.id}`)}
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

  // ============================================================
  // Detail / Cockpit
  // ============================================================
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 space-y-6">
      <div className="flex items-start gap-4">
        <div className="rounded-lg border bg-card p-3">
          <MessagesSquare className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <div className="text-sm text-muted-foreground tabular-nums">Modul 5</div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Vorgespräch</h1>
          <p className="text-muted-foreground mt-2">
            Live-Cockpit für Interviewer und Speaker.
          </p>
        </div>
        <StatusBadge callStatus={call?.status} postStatus={post?.status} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
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
                <div className="font-medium">
                  {speaker?.first_name} {speaker?.last_name}
                </div>
                <div className="text-xs text-muted-foreground">{speaker?.industry ?? "—"}</div>
              </CardContent>
            </Card>
          </div>

          {/* Termin */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarClock className="h-4 w-4" /> Termin & Zugang
              </CardTitle>
              <CardDescription>
                {isAdmin ? "Vereinbarter Termin für das Vorgespräch." : "Termin für dein Vorgespräch."}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="scheduled_at">Datum & Uhrzeit</Label>
                {isAdmin ? (
                  <Input
                    id="scheduled_at" type="datetime-local"
                    value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)}
                  />
                ) : (
                  <div className="text-sm py-2">
                    {call?.scheduled_at
                      ? new Date(call.scheduled_at).toLocaleString("de-DE", { dateStyle: "full", timeStyle: "short" })
                      : <span className="italic text-muted-foreground">Noch nicht festgelegt</span>}
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="meeting_link">Meeting-Link</Label>
                {isAdmin ? (
                  <Input
                    id="meeting_link" placeholder="https://…"
                    value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)}
                  />
                ) : (
                  <div className="text-sm py-2">
                    {call?.meeting_link ? (
                      <a href={call.meeting_link} target="_blank" rel="noreferrer"
                         className="text-primary underline inline-flex items-center gap-1">
                        Beitreten <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <span className="italic text-muted-foreground">Noch nicht hinterlegt</span>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Leitfaden kompakt */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4" /> Leitfaden-Referenz
              </CardTitle>
              <CardDescription>
                Fragen aus dem finalisierten Leitfaden — als Hintergrund für das Vorgespräch.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GuideQuestionsCompact
                hauptfragen={guide?.hauptfragen}
                vertiefungsfragen={guide?.vertiefungsfragen}
                kritische_fragen={guide?.kritische_fragen}
              />
            </CardContent>
          </Card>

          {/* Klärungspunkte */}
          <Card>
            <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <StickyNote className="h-4 w-4" /> Offene Klärungspunkte
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                    {openCount} offen / {clarifications.length} gesamt
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Automatisch aus den Interviewer-Notizen des Leitfadens übernommen.
                </CardDescription>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-3 shrink-0">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Checkbox checked={onlyOpen} onCheckedChange={(v) => setOnlyOpen(!!v)} />
                    Nur offene
                  </label>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Aus Leitfaden synchronisieren
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Klärungspunkte synchronisieren?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Neue Interviewer-Notizen aus dem Leitfaden werden übernommen. Bestehende
                          Antworten und Häkchen auf gleichen Fragen bleiben erhalten. Punkte, die
                          im Leitfaden nicht mehr existieren, werden entfernt.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction onClick={refreshClarificationsFromGuide}>Übernehmen</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {visibleClarifications.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground italic">
                  {clarifications.length === 0
                    ? "Keine offenen Klärungspunkte — im Leitfaden sind keine Interviewer-Notizen hinterlegt."
                    : "Alle Klärungspunkte sind erledigt. ✔"}
                </div>
              ) : (
                visibleClarifications.map((c) => {
                  const idx = clarifications.findIndex((x) => x.question_id === c.question_id);
                  return (
                    <ClarificationRow
                      key={c.question_id}
                      item={c}
                      isAdmin={isAdmin}
                      onChange={(patch) => {
                        setClarifications((prev) => {
                          const next = [...prev];
                          next[idx] = { ...next[idx], ...patch };
                          return next;
                        });
                      }}
                    />
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Ablauf-Hinweise */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ablauf & Aufbau des Interviews</CardTitle>
              <CardDescription>
                Was mit dem Speaker zum Ablauf besprochen wurde — auch später verfügbar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isAdmin ? (
                <Textarea
                  ref={flowRef} value={flowNotes} onChange={(e) => setFlowNotes(e.target.value)}
                  placeholder="Reihenfolge der Themen, Schwerpunkte, Wünsche des Speakers …"
                  rows={3}
                />
              ) : (
                <div className="text-sm whitespace-pre-wrap">
                  {flowNotes || <span className="italic text-muted-foreground">Noch keine Hinweise hinterlegt.</span>}
                </div>
              )}
            </CardContent>
          </Card>

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

          {/* Interne Notizen — Admin only */}
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Interne Notizen</CardTitle>
                <CardDescription>Nur für die Redaktion — Speaker sieht dieses Feld nicht.</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  ref={internalRef} value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Zusammenfassung, Auffälligkeiten, Follow-ups …"
                  rows={3}
                />
              </CardContent>
            </Card>
          )}

          {/* Aktionen */}
          {isAdmin && call && (
            <div className="flex flex-wrap items-center justify-end gap-2 sticky bottom-4 bg-background/80 backdrop-blur rounded-lg border p-3">
              <Button variant="outline" onClick={saveAll} disabled={saving}>
                {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
                Speichern
              </Button>

              {call.status !== "durchgefuehrt" ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button disabled={decisionBusy}>
                      <CheckCircle2 className="mr-1.5 h-4 w-4" /> Vorgespräch abschließen
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Vorgespräch abschließen?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Nicht gespeicherte Änderungen gehen verloren — bitte vorher speichern.
                        Der Interview-Status wechselt auf „Vorgespräch durchgeführt".
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                      <AlertDialogAction onClick={() => decide("durchgefuehrt")}>Abschließen</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <Button variant="outline" onClick={() => decide("zurueck_geplant")} disabled={decisionBusy}>
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

function ClarificationRow({
  item, isAdmin, onChange,
}: {
  item: Clarification;
  isAdmin: boolean;
  onChange: (patch: Partial<Clarification>) => void;
}) {
  const answerRef = useAutoGrow(item.answer);
  return (
    <div className={`rounded-md border p-3 ${item.clarified ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60" : "bg-card"}`}>
      <div className="flex items-start gap-3">
        <Checkbox
          checked={item.clarified}
          disabled={!isAdmin}
          onCheckedChange={(v) => onChange({ clarified: !!v })}
          className="mt-1"
        />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
              {BLOCK_LABEL[item.block]}
            </Badge>
            <div className={`text-sm font-medium ${item.clarified ? "line-through text-muted-foreground" : ""}`}>
              {item.question_text}
            </div>
          </div>
          {item.hint && (
            <div className="rounded-sm border border-amber-300 bg-amber-50 px-2 py-1.5 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
              <span className="font-semibold">Hinweis: </span>{item.hint}
            </div>
          )}
          {isAdmin ? (
            <Textarea
              ref={answerRef} value={item.answer}
              onChange={(e) => onChange({ answer: e.target.value })}
              placeholder="Antwort/Notiz aus dem Vorgespräch …"
              rows={1}
              className="min-h-0 text-sm"
            />
          ) : item.answer ? (
            <div className="text-sm whitespace-pre-wrap text-muted-foreground">{item.answer}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
