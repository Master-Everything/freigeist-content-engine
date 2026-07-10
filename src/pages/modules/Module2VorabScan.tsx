import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AmpelBadge } from "@/components/vorab-scan/AmpelBadge";
import { ScanDetailSheet } from "@/components/vorab-scan/ScanDetailSheet";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ScanSearch, Loader2, RefreshCw, Eye, Play, UserCheck, Send, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type SpeakerScanRow = {
  id: string;
  speaker_id: string;
  status: string;
  verdict: "green" | "yellow" | "red" | null;
  score: number | null;
  summary: string | null;
  findings: any[];
  model_used: string | null;
  error_text: string | null;
  created_at: string;
  speakers: { first_name: string | null; last_name: string | null; industry: string | null } | null;
};

type InterviewScanRow = {
  id: string;
  post_id: string;
  status: string;
  verdict: "green" | "yellow" | "red" | null;
  score: number | null;
  summary: string | null;
  findings: any[];
  model_used: string | null;
  error_text: string | null;
  created_at: string;
  posts: {
    id: string;
    interview_title: string | null;
    status: string;
    speaker_id: string | null;
    speakers: {
      first_name: string | null;
      last_name: string | null;
      speaker_scans: { verdict: "green" | "yellow" | "red" | null; created_at: string }[] | null;
    } | null;
  } | null;
};

export default function Module2VorabScan() {
  const navigate = useNavigate();
  const [creatingProfilFor, setCreatingProfilFor] = useState<string | null>(null);
  const [tab, setTab] = useState<"speakers" | "interviews">("speakers");
  const [speakerRows, setSpeakerRows] = useState<SpeakerScanRow[]>([]);
  const [interviewRows, setInterviewRows] = useState<InterviewScanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [verdictFilter, setVerdictFilter] = useState<string>("all");
  const [selected, setSelected] = useState<any | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [rescanning, setRescanning] = useState<string | null>(null);
  const [submittingFor, setSubmittingFor] = useState<string | null>(null);
  const [reopeningFor, setReopeningFor] = useState<string | null>(null);
  type Confirm =
    | { kind: "reopen"; postId: string; title: string }
    | { kind: "submit"; postId: string; title: string; interviewVerdict: Verdict; speakerVerdict: Verdict; blockedReason: string | null }
    | null;
  const [confirm, setConfirm] = useState<Confirm>(null);

  async function load() {
    setLoading(true);
    const [{ data: sData, error: sErr }, { data: iData, error: iErr }] = await Promise.all([
      supabase.from("speaker_scans")
        .select("*, speakers(first_name, last_name, industry)")
        .order("created_at", { ascending: false }).limit(500),
      supabase.from("post_scans")
        .select("*, posts(id, interview_title, status, speaker_id, speakers(first_name, last_name, speaker_scans(verdict, created_at)))")
        .order("created_at", { ascending: false }).limit(500),
    ]);
    if (sErr) toast.error("Konnte Speaker-Scans nicht laden: " + sErr.message);
    if (iErr) toast.error("Konnte Interview-Scans nicht laden: " + iErr.message);
    setSpeakerRows((sData ?? []) as SpeakerScanRow[]);
    setInterviewRows((iData ?? []) as unknown as InterviewScanRow[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filteredSpeakers = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return speakerRows.filter((r) => {
      if (verdictFilter !== "all" && r.verdict !== verdictFilter) return false;
      if (!needle) return true;
      const name = `${r.speakers?.first_name ?? ""} ${r.speakers?.last_name ?? ""}`.toLowerCase();
      return name.includes(needle) || (r.speakers?.industry ?? "").toLowerCase().includes(needle);
    });
  }, [speakerRows, q, verdictFilter]);

  const filteredInterviews = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return interviewRows.filter((r) => {
      if (verdictFilter !== "all" && r.verdict !== verdictFilter) return false;
      if (!needle) return true;
      const title = (r.posts?.interview_title ?? "").toLowerCase();
      const sp = r.posts?.speakers;
      const name = `${sp?.first_name ?? ""} ${sp?.last_name ?? ""}`.toLowerCase();
      return title.includes(needle) || name.includes(needle);
    });
  }, [interviewRows, q, verdictFilter]);

  const counts = useMemo(() => {
    const all = [...speakerRows, ...interviewRows];
    return {
      total: all.length,
      red: all.filter((r) => r.verdict === "red").length,
      yellow: all.filter((r) => r.verdict === "yellow").length,
      green: all.filter((r) => r.verdict === "green").length,
    };
  }, [speakerRows, interviewRows]);

  async function reScanSpeaker(speakerId: string) {
    setRescanning(speakerId);
    try {
      const { data, error } = await supabase.functions.invoke("vorab-scan", { body: { speaker_id: speakerId } });
      if (error) throw error;
      if (data?.error) toast.error(data.error);
      else toast.success(`Scan: ${data?.verdict ?? "—"}`);
      await load();
    } catch (e) {
      toast.error("Re-Scan fehlgeschlagen: " + (e as Error).message);
    } finally { setRescanning(null); }
  }

  async function reScanInterview(postId: string) {
    setRescanning(postId);
    try {
      const { data, error } = await supabase.functions.invoke("interview-scan", { body: { post_id: postId } });
      if (error) throw error;
      if (data?.error) toast.error(data.error);
      else toast.success(`Scan: ${data?.verdict ?? "—"}`);
      await load();
    } catch (e) {
      toast.error("Re-Scan fehlgeschlagen: " + (e as Error).message);
    } finally { setRescanning(null); }
  }

  async function createProfil(postId: string, speakerId: string | null) {
    if (!speakerId) {
      toast.error("Diesem Interview ist kein Speaker-Profil zugeordnet.");
      return;
    }
    setCreatingProfilFor(postId);
    try {
      const { error } = await supabase
        .from("posts")
        .update({ status: "in_bearbeitung" })
        .eq("id", postId);
      if (error) throw error;
      toast.success("Interview an Modul 3 übergeben.");
      navigate(`/module/profil?post_id=${postId}&speaker_id=${speakerId}`);
    } catch (e) {
      toast.error("Fehler: " + (e as Error).message);
    } finally {
      setCreatingProfilFor(null);
    }
  }

  async function submitToRedaktion(postId: string) {
    setSubmittingFor(postId);
    try {
      const { error } = await supabase
        .from("posts")
        .update({ status: "redaktion_angefragt" })
        .eq("id", postId);
      if (error) throw error;
      toast.success("Interview bei Redaktion eingereicht.");
      await load();
    } catch (e) {
      toast.error("Fehler: " + (e as Error).message);
    } finally {
      setSubmittingFor(null);
    }
  }

  function openScan(row: any) {
    setSelected(row);
    setSheetOpen(true);
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 space-y-6">
      <div className="flex items-start gap-4">
        <div className="rounded-lg border bg-card p-3">
          <ScanSearch className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <div className="text-sm text-muted-foreground tabular-nums">Modul 2</div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Vorab-Scan · Admin-Übersicht
          </h1>
          <p className="text-muted-foreground mt-2">
            Alle Audits über alle Speaker-Profile und Interviews. Manuelle Re-Scans möglich.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Aktualisieren
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Scans gesamt" value={counts.total} />
        <StatCard label="Rot" value={counts.red} tone="red" />
        <StatCard label="Gelb" value={counts.yellow} tone="yellow" />
        <StatCard label="Grün" value={counts.green} tone="green" />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="speakers">Speaker-Profile ({speakerRows.length})</TabsTrigger>
          <TabsTrigger value="interviews">Interviews ({interviewRows.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="speakers">
          <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <CardTitle className="text-lg">Profil-Scans</CardTitle>
                <CardDescription>Sortiert nach Datum, neueste oben.</CardDescription>
              </div>
              <Filters q={q} setQ={setQ} verdictFilter={verdictFilter} setVerdictFilter={setVerdictFilter} placeholder="Suche Name oder Branche…" />
            </CardHeader>
            <CardContent>
              {loading ? <Spinner /> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-40">Datum</TableHead>
                      <TableHead>Speaker</TableHead>
                      <TableHead className="w-32">Branche</TableHead>
                      <TableHead className="w-36">Verdict</TableHead>
                      <TableHead className="w-20">Score</TableHead>
                      <TableHead className="w-20">Findings</TableHead>
                      <TableHead className="w-40">Aktion</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSpeakers.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-xs text-muted-foreground tabular-nums">
                          {new Date(r.created_at).toLocaleString("de-DE")}
                        </TableCell>
                        <TableCell className="text-sm">{r.speakers?.first_name} {r.speakers?.last_name}</TableCell>
                        <TableCell className="text-xs capitalize text-muted-foreground">{r.speakers?.industry ?? "—"}</TableCell>
                        <TableCell>
                          {r.status === "error"
                            ? <Badge variant="outline" className="text-xs text-destructive border-destructive/40">Fehler</Badge>
                            : <AmpelBadge verdict={r.verdict} />}
                        </TableCell>
                        <TableCell className="text-xs tabular-nums">{r.score ?? "—"}</TableCell>
                        <TableCell className="text-xs tabular-nums">{r.findings?.length ?? 0}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => openScan(r)}><Eye className="h-4 w-4" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => reScanSpeaker(r.speaker_id)}
                              disabled={rescanning === r.speaker_id} title="Re-Scan">
                              {rescanning === r.speaker_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredSpeakers.length === 0 && (
                      <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">Keine Scans gefunden.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interviews">
          <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <CardTitle className="text-lg">Interview-Scans</CardTitle>
                <CardDescription>Von Speakern zum Scan freigegebene Interviews.</CardDescription>
              </div>
              <Filters q={q} setQ={setQ} verdictFilter={verdictFilter} setVerdictFilter={setVerdictFilter} placeholder="Suche Titel oder Speaker…" />
            </CardHeader>
            <CardContent>
              {loading ? <Spinner /> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-40">Datum</TableHead>
                      <TableHead>Interview</TableHead>
                      <TableHead className="w-40">Speaker</TableHead>
                      <TableHead className="w-36">Verdict</TableHead>
                      <TableHead className="w-20">Score</TableHead>
                      <TableHead className="w-20">Findings</TableHead>
                      <TableHead className="w-40">Post-Status</TableHead>
                      <TableHead className="w-56">Aktion</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInterviews.map((r) => {
                      const postStatus = r.posts?.status;
                      const isRequested = postStatus === "redaktion_angefragt";
                      const isInBearbeitung = postStatus === "in_bearbeitung";
                      const isScanDone = postStatus === "scan_done";
                      const speakerScans = r.posts?.speakers?.speaker_scans ?? [];
                      const sortedSpeakerScans = [...speakerScans].sort(
                        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                      );
                      const latestSpeakerVerdict = sortedSpeakerScans[0]?.verdict ?? null;
                      const canSubmit = isScanDone;
                      const submitBlockReason =
                        r.verdict === "red" ? "Interview-Scan rot"
                        : latestSpeakerVerdict === "red" ? "Profil-Scan rot"
                        : latestSpeakerVerdict === null ? "Profil noch nicht gescannt"
                        : null;
                      return (
                      <TableRow key={r.id} className={isRequested ? "bg-violet-50/60 dark:bg-violet-950/20" : ""}>
                        <TableCell className="text-xs text-muted-foreground tabular-nums">
                          {new Date(r.created_at).toLocaleString("de-DE")}
                        </TableCell>
                        <TableCell className="text-sm truncate max-w-[280px]">
                          {r.posts?.interview_title ?? "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {r.posts?.speakers?.first_name} {r.posts?.speakers?.last_name}
                        </TableCell>
                        <TableCell>
                          {r.status === "error"
                            ? <Badge variant="outline" className="text-xs text-destructive border-destructive/40">Fehler</Badge>
                            : <AmpelBadge verdict={r.verdict} />}
                        </TableCell>
                        <TableCell className="text-xs tabular-nums">{r.score ?? "—"}</TableCell>
                        <TableCell className="text-xs tabular-nums">{r.findings?.length ?? 0}</TableCell>
                        <TableCell>
                          {isRequested && <Badge className="bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200">Redaktion angefragt</Badge>}
                          {isInBearbeitung && <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">In Bearbeitung</Badge>}
                          {isScanDone && <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">Scan abgeschlossen</Badge>}
                          {!isRequested && !isInBearbeitung && !isScanDone && <span className="text-xs text-muted-foreground">{postStatus}</span>}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            <Button size="sm" variant="ghost" onClick={() => openScan(r)}><Eye className="h-4 w-4" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => reScanInterview(r.post_id)}
                              disabled={rescanning === r.post_id} title="Re-Scan">
                              {rescanning === r.post_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                            </Button>
                            {canSubmit && (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => submitToRedaktion(r.post_id)}
                                disabled={!!submitBlockReason || submittingFor === r.post_id}
                                title={submitBlockReason ?? "Bei Redaktion einreichen"}
                              >
                                {submittingFor === r.post_id
                                  ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                                  : <Send className="mr-1.5 h-4 w-4" />}
                                Bei Redaktion einreichen
                              </Button>
                            )}
                            {isRequested && (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => createProfil(r.post_id, r.posts?.speaker_id ?? null)}
                                disabled={creatingProfilFor === r.post_id}
                                title="Profil & Sprechermappe anlegen"
                              >
                                {creatingProfilFor === r.post_id
                                  ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                                  : <UserCheck className="mr-1.5 h-4 w-4" />}
                                Profil anlegen
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      );
                    })}
                    {filteredInterviews.length === 0 && (
                      <TableRow><TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">Keine Interview-Scans gefunden.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ScanDetailSheet scan={selected as any} open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  );
}

function Filters({
  q, setQ, verdictFilter, setVerdictFilter, placeholder,
}: {
  q: string; setQ: (v: string) => void;
  verdictFilter: string; setVerdictFilter: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="flex gap-2">
      <Select value={verdictFilter} onValueChange={setVerdictFilter}>
        <SelectTrigger className="w-40"><SelectValue placeholder="Verdict" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle</SelectItem>
          <SelectItem value="red">Rot</SelectItem>
          <SelectItem value="yellow">Gelb</SelectItem>
          <SelectItem value="green">Grün</SelectItem>
        </SelectContent>
      </Select>
      <Input placeholder={placeholder} value={q} onChange={(e) => setQ(e.target.value)} className="w-64" />
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone?: "red" | "yellow" | "green" }) {
  const toneCls = tone === "red" ? "text-destructive"
    : tone === "yellow" ? "text-amber-600 dark:text-amber-400"
    : tone === "green" ? "text-emerald-600 dark:text-emerald-400"
    : "text-foreground";
  return (
    <Card>
      <CardContent className="py-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`text-2xl font-semibold tabular-nums ${toneCls}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
