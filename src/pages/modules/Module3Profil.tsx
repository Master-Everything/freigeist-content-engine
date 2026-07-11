import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { UserCheck, Loader2, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { ProfilEditor, type SpeakerProfile } from "@/components/profil/ProfilEditor";

type QueueRow = {
  id: string;
  interview_title: string | null;
  status: string;
  speaker_id: string | null;
  speaker: { first_name: string | null; last_name: string | null } | null;
};

function StatusBadge({ status }: { status: string }) {
  if (status === "redaktion_angefragt")
    return (
      <Badge className="bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200">
        Redaktion angefragt
      </Badge>
    );
  if (status === "in_bearbeitung")
    return (
      <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
        In Bearbeitung
      </Badge>
    );
  return <Badge variant="outline">{status}</Badge>;
}

export default function Module3Profil() {
  const [params] = useSearchParams();
  const postId = params.get("post_id");
  const speakerId = params.get("speaker_id");
  const { role, user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [post, setPost] = useState<any | null>(null);
  const [speaker, setSpeaker] = useState<any | null>(null);
  const [profile, setProfile] = useState<SpeakerProfile | null>(null);

  const [queueLoading, setQueueLoading] = useState(false);
  const [queue, setQueue] = useState<QueueRow[]>([]);
  const [creatingFor, setCreatingFor] = useState<string | null>(null);

  const hasContext = !!(postId || speakerId);

  useEffect(() => {
    if (!hasContext) return;
    setLoading(true);
    (async () => {
      const [p, s, pr] = await Promise.all([
        postId
          ? supabase.from("posts").select("id, interview_title, status").eq("id", postId).maybeSingle()
          : Promise.resolve({ data: null } as any),
        speakerId
          ? supabase.from("speakers").select("id, first_name, last_name, industry").eq("id", speakerId).maybeSingle()
          : Promise.resolve({ data: null } as any),
        postId
          ? (supabase as any).from("speaker_profiles").select("*").eq("post_id", postId).maybeSingle()
          : Promise.resolve({ data: null } as any),
      ]);
      setPost((p as any).data);
      setSpeaker((s as any).data);
      setProfile((pr as any).data ?? null);
      setLoading(false);
    })();
  }, [postId, speakerId, hasContext]);

  async function loadQueue() {
    setQueueLoading(true);
    let query = supabase
      .from("posts")
      .select("id, interview_title, status, speaker_id, speaker:speakers(first_name, last_name, user_id)")
      .in("status", ["redaktion_angefragt", "in_bearbeitung", "profil"])
      .order("updated_at", { ascending: false });

    const { data, error } = await query;
    if (error) {
      toast({ title: "Fehler beim Laden", description: error.message, variant: "destructive" });
      setQueue([]);
    } else {
      let rows = (data ?? []) as any[];
      if (role === "speaker" && user) {
        rows = rows.filter((r) => r.speaker?.user_id === user.id);
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

  async function createProfil(pId: string, sId: string | null) {
    if (!sId) {
      toast({ title: "Kein Speaker verknüpft", variant: "destructive" });
      return;
    }
    setCreatingFor(pId);
    const { error } = await supabase.from("posts").update({ status: "in_bearbeitung" }).eq("id", pId);
    setCreatingFor(null);
    if (error) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
      return;
    }
    navigate(`/module/profil?post_id=${pId}&speaker_id=${sId}`);
  }

  // Kontext-Ansicht
  if (hasContext) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10 space-y-6">
        <div className="flex items-start gap-4">
          <div className="rounded-lg border bg-card p-3">
            <UserCheck className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="text-sm text-muted-foreground tabular-nums">Modul 3</div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Profil Interviewgast</h1>
            <p className="text-muted-foreground mt-2">
              Vorbereitung von Profil und Sprechermappe für dieses Interview.
            </p>
          </div>
          <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
            Redaktion in Arbeit
          </Badge>
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
                <CardDescription>Verknüpftes Profil</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div className="font-medium">
                  {speaker?.first_name} {speaker?.last_name}
                </div>
                <div className="text-xs text-muted-foreground">{speaker?.industry ?? "—"}</div>
                <div className="text-xs text-muted-foreground font-mono">{speakerId}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {role === "admin" && postId && speakerId ? (
          <ProfilEditor
            postId={postId}
            speakerId={speakerId}
            initial={profile}
            onChanged={setProfile}
          />
        ) : (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              {profile
                ? "Profil-Entwurf liegt vor. Freigabe-Ansicht folgt."
                : "Redaktion arbeitet am Profil-Entwurf."}
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
          <UserCheck className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <div className="text-sm text-muted-foreground tabular-nums">Modul 3</div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Profil Interviewgast</h1>
          <p className="text-muted-foreground mt-2">
            {isAdmin
              ? "Offene Anfragen aus Modul 2. Starte hier das Anlegen des Profils und der Sprechermappe."
              : "Deine Interviews, die aktuell bei der Redaktion in der Profil-Phase sind."}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isAdmin ? "Redaktionsanfragen" : "Meine Anfragen"}
          </CardTitle>
          <CardDescription>
            Status: „Redaktion angefragt" oder „In Bearbeitung"
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
                ? "Aktuell keine offenen Anfragen."
                : "Du hast aktuell kein Interview in der Redaktions-Phase."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Interview</TableHead>
                  {isAdmin && <TableHead>Speaker</TableHead>}
                  <TableHead className="w-48">Status</TableHead>
                  <TableHead className="w-48 text-right">{isAdmin ? "Aktion" : "Hinweis"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queue.map((row) => {
                  const requested = row.status === "redaktion_angefragt";
                  return (
                    <TableRow
                      key={row.id}
                      className={requested ? "bg-violet-50/60 dark:bg-violet-950/20" : ""}
                    >
                      <TableCell className="font-medium">
                        {row.interview_title ?? "—"}
                      </TableCell>
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
                        {isAdmin ? (
                          requested ? (
                            <Button
                              size="sm"
                              disabled={creatingFor === row.id || !row.speaker_id}
                              onClick={() => createProfil(row.id, row.speaker_id)}
                            >
                              {creatingFor === row.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>Profil anlegen <ArrowRight className="ml-1 h-4 w-4" /></>
                              )}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                navigate(
                                  `/module/profil?post_id=${row.id}&speaker_id=${row.speaker_id ?? ""}`
                                )
                              }
                            >
                              Öffnen <ArrowRight className="ml-1 h-4 w-4" />
                            </Button>
                          )
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {requested ? "Wartet auf Redaktion" : "Redaktion in Arbeit"}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
