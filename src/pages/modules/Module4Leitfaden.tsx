import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { BookOpen, Loader2, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { LeitfadenEditor, type InterviewGuide } from "@/components/leitfaden/LeitfadenEditor";
import { LeitfadenReadonly } from "@/components/leitfaden/LeitfadenReadonly";

type QueueRow = {
  id: string;
  interview_title: string | null;
  status: string;
  speaker_id: string | null;
  speaker: { first_name: string | null; last_name: string | null; user_id: string | null } | null;
};

function StatusBadge({ status }: { status: string }) {
  if (status === "leitfaden")
    return (
      <Badge className="bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200">
        Leitfaden in Vorbereitung
      </Badge>
    );
  if (status === "leitfaden_final")
    return (
      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
        Leitfaden finalisiert
      </Badge>
    );
  return <Badge variant="outline">{status}</Badge>;
}

export default function Module4Leitfaden() {
  const [params] = useSearchParams();
  const postId = params.get("post_id");
  const { role, user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [post, setPost] = useState<any | null>(null);
  const [speaker, setSpeaker] = useState<any | null>(null);
  const [guide, setGuide] = useState<InterviewGuide | null>(null);

  const [queueLoading, setQueueLoading] = useState(false);
  const [queue, setQueue] = useState<QueueRow[]>([]);

  const hasContext = !!postId;

  useEffect(() => {
    if (!hasContext) return;
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
      const guideSelect =
        role === "admin"
          ? "*"
          : "id, post_id, speaker_id, speaker_profile_id, status, intro, hauptfragen, vertiefungsfragen, kritische_fragen, abschluss, created_at, updated_at";
      const { data: g } = await (supabase as any)
        .from("interview_guides")
        .select(guideSelect)
        .eq("post_id", postId!)
        .maybeSingle();
      // Speaker darf interviewer_notiz nicht sehen — serverseitig aus dem Payload entfernen.
      const strip = (arr: any[] | null) =>
        Array.isArray(arr) ? arr.map(({ interviewer_notiz, ...rest }) => rest) : arr;
      if (g && role === "speaker") {
        g.hauptfragen = strip(g.hauptfragen);
        g.vertiefungsfragen = strip(g.vertiefungsfragen);
        g.kritische_fragen = strip(g.kritische_fragen);
      }
      setGuide((g as any) ?? null);
      setLoading(false);
    })();
  }, [postId, hasContext, role]);

  async function loadQueue() {
    setQueueLoading(true);
    const { data, error } = await supabase
      .from("posts")
      .select("id, interview_title, status, speaker_id, speaker:speakers(first_name, last_name, user_id)")
      .in("status", ["leitfaden", "leitfaden_final"])
      .order("updated_at", { ascending: false });
    if (error) {
      toast({ title: "Fehler beim Laden", description: error.message, variant: "destructive" });
      setQueue([]);
    } else {
      let rows = (data ?? []) as any[];
      if (role === "speaker" && user) {
        rows = rows.filter((r) => r.speaker?.user_id === user.id && r.status === "leitfaden_final");
      }
      setQueue(rows as QueueRow[]);
    }
    setQueueLoading(false);
  }

  useEffect(() => {
    if (hasContext) return;
    if (!role) return;
    loadQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasContext, role, user?.id]);

  // Kontext-Ansicht
  if (hasContext) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10 space-y-6">
        <div className="flex items-start gap-4">
          <div className="rounded-lg border bg-card p-3">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="text-sm text-muted-foreground tabular-nums">Modul 4</div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Interview-Leitfaden</h1>
            <p className="text-muted-foreground mt-2">
              Strukturierter Leitfaden für Moderation und Vorbereitung.
            </p>
          </div>
          {post && <StatusBadge status={post.status} />}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Interview</CardTitle>
                <CardDescription>Aus Modul 1</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div className="font-medium">{post?.interview_title ?? "—"}</div>
                <div className="text-xs text-muted-foreground font-mono">{postId}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Speaker</CardTitle>
                <CardDescription>Interviewgast</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div className="font-medium">
                  {speaker?.first_name} {speaker?.last_name}
                </div>
                <div className="text-xs text-muted-foreground">{speaker?.industry ?? "—"}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {loading ? null : role === "admin" && postId ? (
          <LeitfadenEditor
            key={guide?.id ?? "new"}
            postId={postId}
            initial={guide}
            onChanged={setGuide}
          />
        ) : role === "speaker" && guide && guide.status === "final" ? (
          <LeitfadenReadonly guide={guide} />
        ) : (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Die Redaktion bereitet den Leitfaden vor. Du erhältst ihn hier, sobald er finalisiert ist.
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Listen-Ansicht
  const isAdmin = role === "admin";
  return (
    <div className="mx-auto max-w-5xl px-6 py-10 space-y-6">
      <div className="flex items-start gap-4">
        <div className="rounded-lg border bg-card p-3">
          <BookOpen className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <div className="text-sm text-muted-foreground tabular-nums">Modul 4</div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Interview-Leitfaden</h1>
          <p className="text-muted-foreground mt-2">
            {isAdmin
              ? "Interviews, für die ein Leitfaden erstellt oder finalisiert werden soll."
              : "Deine Interviews mit freigegebenem Leitfaden zur Vorbereitung."}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isAdmin ? "Leitfaden-Warteschlange" : "Meine Leitfäden"}
          </CardTitle>
          <CardDescription>
            {isAdmin
              ? 'Status: „Leitfaden in Vorbereitung" oder „Leitfaden finalisiert".'
              : "Nur finalisierte Leitfäden werden hier angezeigt."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {queueLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : queue.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              {isAdmin
                ? "Aktuell keine Interviews in dieser Phase."
                : "Aktuell kein finalisierter Leitfaden verfügbar."}
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
                    <TableCell>
                      <StatusBadge status={row.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant={isAdmin ? "default" : "outline"}
                          onClick={() => navigate(`/module/leitfaden?post_id=${row.id}`)}
                        >
                          {isAdmin ? "Öffnen" : "Ansehen"} <ArrowRight className="ml-1 h-4 w-4" />
                        </Button>
                        {isAdmin && row.status === "leitfaden_final" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/module/vorgespraech?post_id=${row.id}`)}
                            title="Vorgespräch planen"
                          >
                            Vorgespräch
                          </Button>
                        )}
                      </div>
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
