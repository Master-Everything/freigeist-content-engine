import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Post, PostBlocks } from "@/types/post";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  FileText,
  Loader2,
  Eye,
  Pencil,
  ScanSearch,
  RotateCcw,
  Send,
  BookOpen,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { hubPostUrl } from "@/lib/hub";
import { supabase as sb } from "@/integrations/supabase/client";

const statusConfig: Record<string, { label: string; className: string }> = {
  erfassung: { label: "In Erfassung", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  scan_pending: { label: "Scan läuft", className: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" },
  scan_done: { label: "Scan abgeschlossen", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" },
  redaktion_angefragt: { label: "Bei Redaktion eingereicht", className: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200" },
  in_bearbeitung: { label: "Redaktion in Arbeit", className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  profil: { label: "Profil-Entwurf (Redaktion)", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" },
  profil_review: { label: "Profil zur Freigabe", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  leitfaden: { label: "Leitfaden in Vorbereitung", className: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200" },
  leitfaden_final: { label: "Leitfaden bereit", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" },
  vorgespraech: { label: "Vorgespräch", className: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200" },
  vorgespraech_done: { label: "Vorgespräch abgeschlossen", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" },
  aufzeichnung: { label: "Aufzeichnung", className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  aufzeichnung_done: { label: "Aufzeichnung abgeschlossen", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" },
  hub_pushed: { label: "Veröffentlicht", className: "bg-success text-success-foreground" },
  draft: { label: "Entwurf", className: "bg-muted text-muted-foreground" },
  in_progress: { label: "In Arbeit", className: "bg-warning text-warning-foreground" },
  exported: { label: "Veröffentlicht", className: "bg-success text-success-foreground" },
};

function resolveCoverUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  const { data } = sb.storage.from("post-images").getPublicUrl(raw);
  return data.publicUrl;
}

function truncate(text: string, max = 180): string {
  if (!text) return "";
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max).trimEnd() + "…" : t;
}

type Verdict = "green" | "yellow" | "red" | null;

type Row = Post & {
  latest_interview_verdict: Verdict;
  latest_speaker_verdict: Verdict;
};

type ConfirmState =
  | { kind: "release"; post: Row }
  | { kind: "reopen"; post: Row }
  | { kind: "submit"; post: Row }
  | null;

export default function MyPosts() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("posts")
      .select(`
        *,
        post_scans(verdict, created_at, status),
        speakers(id, speaker_scans(verdict, created_at, status))
      `)
      .order("updated_at", { ascending: false });
    if (error) {
      toast.error("Konnte Interviews nicht laden: " + error.message);
      setLoading(false);
      return;
    }
    const rows: Row[] = (data ?? []).map((d: any) => {
      const iScans = (d.post_scans ?? [])
        .filter((s: any) => s.status === "done")
        .sort((a: any, b: any) => (a.created_at > b.created_at ? -1 : 1));
      const sScans = (d.speakers?.speaker_scans ?? [])
        .filter((s: any) => s.status === "done")
        .sort((a: any, b: any) => (a.created_at > b.created_at ? -1 : 1));
      return {
        ...d,
        blocks: d.blocks as unknown as PostBlocks | null,
        latest_interview_verdict: (iScans[0]?.verdict ?? null) as Verdict,
        latest_speaker_verdict: (sScans[0]?.verdict ?? null) as Verdict,
      } as Row;
    });
    setPosts(rows);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function releaseForScan(postId: string) {
    setBusyId(postId);
    try {
      const { data, error } = await supabase.functions.invoke("interview-scan", {
        body: { post_id: postId },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
      } else {
        toast.success(`Scan abgeschlossen: ${data?.verdict ?? "—"}`);
      }
      await load();
    } catch (e) {
      toast.error("Scan fehlgeschlagen: " + (e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function reopenForEdit(postId: string) {
    setBusyId(postId);
    try {
      const { error } = await supabase
        .from("posts")
        .update({ status: "erfassung" })
        .eq("id", postId);
      if (error) throw error;
      toast.success("Zur Bearbeitung entsperrt. Alter Scan bleibt in der Historie erhalten.");
      await load();
    } catch (e) {
      toast.error("Fehler: " + (e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function submitToRedaktion(postId: string) {
    setBusyId(postId);
    try {
      const { error } = await supabase
        .from("posts")
        .update({ status: "redaktion_angefragt" })
        .eq("id", postId);
      if (error) throw error;
      toast.success("Interview bei der Redaktion eingereicht.");
      await load();
    } catch (e) {
      toast.error("Fehler: " + (e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isPublished = (p: Row) => p.status === "hub_pushed" || !!p.hub_pushed_at;
  const inProgress = posts.filter((p) => !isPublished(p));
  const published = posts
    .filter(isPublished)
    .sort((a, b) => {
      const at = a.hub_pushed_at ?? a.updated_at;
      const bt = b.hub_pushed_at ?? b.updated_at;
      return at > bt ? -1 : 1;
    });

  return (
    <TooltipProvider>
      <div className="mx-auto max-w-4xl px-6 py-10 space-y-12">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Meine Interview-Beiträge</h1>
          <p className="mt-1 text-muted-foreground">
            Bearbeite und begleite deine Interviews, sieh dir deine veröffentlichten Beiträge an.
          </p>
        </div>

        {/* In Bearbeitung */}
        <section>
          <h2 className="font-display text-lg font-semibold mb-3">In Bearbeitung</h2>
          {inProgress.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="mb-3 h-10 w-10 opacity-40" />
              Aktuell keine Interviews in Bearbeitung
            </Card>
          ) : (
            <div className="space-y-2">
              {inProgress.map((post) => {
                const cfg = statusConfig[post.status] || statusConfig.draft;
                const isBusy = busyId === post.id || post.status === "scan_pending";
                const canEdit = post.status === "erfassung";
                const canRelease = post.status === "erfassung";
                const canReopen = post.status === "scan_done";
                const canSubmit = post.status === "scan_done";
                const submitBlockedReason =
                  post.latest_interview_verdict === "red"
                    ? "Rote Findings im Interview-Scan zuerst beheben."
                    : post.latest_speaker_verdict === "red"
                    ? "Rote Findings im Speaker-Profil-Scan zuerst beheben."
                    : post.latest_speaker_verdict === null
                    ? "Zuerst muss dein Speaker-Profil gescannt sein."
                    : null;
                const submitDisabled = !!submitBlockedReason || isBusy;

                return (
                  <Card key={post.id} className="transition-all hover:shadow-md hover:border-primary/20">
                    <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-display font-semibold truncate">{post.interview_title}</h3>
                        <p className="mt-0.5 text-sm text-muted-foreground truncate">
                          {new Date(post.updated_at).toLocaleDateString("de-DE")}
                          {post.latest_interview_verdict && (
                            <span className="ml-2">
                              · Interview-Scan:{" "}
                              <span
                                className={
                                  post.latest_interview_verdict === "green"
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : post.latest_interview_verdict === "yellow"
                                    ? "text-amber-600 dark:text-amber-400"
                                    : "text-destructive"
                                }
                              >
                                {post.latest_interview_verdict}
                              </span>
                            </span>
                          )}
                        </p>
                      </div>
                      <Badge className={cfg.className}>{cfg.label}</Badge>
                      <div className="flex flex-wrap gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/module/interview-beitraege/view/${post.id}`)}
                          title="Ansehen"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canEdit && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate(`/module/interview/edit/${post.id}`)}
                            title="Bearbeiten"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {canRelease && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => setConfirm({ kind: "release", post })}
                            disabled={isBusy}
                          >
                            {isBusy ? (
                              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                            ) : (
                              <ScanSearch className="mr-1.5 h-4 w-4" />
                            )}
                            Zum Scan freigeben
                          </Button>
                        )}
                        {canReopen && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setConfirm({ kind: "reopen", post })}
                            disabled={isBusy}
                          >
                            <RotateCcw className="mr-1.5 h-4 w-4" />
                            Erneut bearbeiten
                          </Button>
                        )}
                        {canSubmit && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => setConfirm({ kind: "submit", post })}
                                  disabled={submitDisabled}
                                >
                                  <Send className="mr-1.5 h-4 w-4" />
                                  Bei Redaktion einreichen
                                </Button>
                              </span>
                            </TooltipTrigger>
                            {submitBlockedReason && (
                              <TooltipContent>{submitBlockedReason}</TooltipContent>
                            )}
                          </Tooltip>
                        )}
                        {post.status === "profil_review" && post.speaker_id && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() =>
                              navigate(
                                `/module/profil?post_id=${post.id}&speaker_id=${post.speaker_id}`
                              )
                            }
                          >
                            Profil freigeben
                          </Button>
                        )}
                        {post.status === "leitfaden_final" && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => navigate(`/module/leitfaden?post_id=${post.id}`)}
                          >
                            <BookOpen className="mr-1.5 h-4 w-4" />
                            Leitfaden ansehen
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Veröffentlichte Beiträge */}
        <section>
          <h2 className="font-display text-lg font-semibold mb-3">Veröffentlichte Beiträge</h2>
          {published.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-12 px-6 text-center text-muted-foreground">
              <FileText className="mb-3 h-10 w-10 opacity-40" />
              Sobald dein Interview aufbereitet und veröffentlicht wurde, findest du es hier.
            </Card>
          ) : (
            <div className="space-y-3">
              {published.map((post) => {
                const cover = resolveCoverUrl(post.guest_image_url);
                const teaser = truncate(post.blocks?.excerpt ?? "", 180);
                const publishedAt = post.hub_pushed_at ?? post.updated_at;
                return (
                  <Card key={post.id} className="transition-all hover:shadow-md hover:border-primary/20">
                    <CardContent className="flex flex-col gap-4 p-5 sm:flex-row">
                      {cover && (
                        <div className="shrink-0">
                          <img
                            src={cover}
                            alt={post.interview_title}
                            className="h-24 w-24 rounded-md object-cover sm:h-28 sm:w-28"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <h3 className="font-display font-semibold text-lg leading-snug">
                            {post.interview_title}
                          </h3>
                          <Badge className={statusConfig.hub_pushed.className}>Veröffentlicht</Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Veröffentlicht am{" "}
                          {new Date(publishedAt).toLocaleDateString("de-DE", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                        {teaser && (
                          <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                            {teaser}
                          </p>
                        )}
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              navigate(`/module/interview-beitraege/view/${post.id}`)
                            }
                          >
                            <Eye className="mr-1.5 h-4 w-4" />
                            Ansehen
                          </Button>
                          {post.hub_slug && (
                            <Button size="sm" variant="default" asChild>
                              <a
                                href={hubPostUrl(post.hub_slug)}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="mr-1.5 h-4 w-4" />
                                Auf News-Plattform öffnen
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>


        <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
          <AlertDialogContent>
            {confirm?.kind === "release" && (
              <>
                <AlertDialogHeader>
                  <AlertDialogTitle>Interview zum Scan freigeben?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Der Vorab-Scan wird gestartet. Während der Scan läuft, kannst du das Interview nicht bearbeiten.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      const p = confirm.post;
                      setConfirm(null);
                      releaseForScan(p.id);
                    }}
                  >
                    Scan starten
                  </AlertDialogAction>
                </AlertDialogFooter>
              </>
            )}
            {confirm?.kind === "reopen" && (
              <>
                <AlertDialogHeader>
                  <AlertDialogTitle>Interview erneut bearbeiten?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Der letzte Scan bleibt als Historie erhalten. Nach der Bearbeitung musst du das Interview
                    erneut zum Scan freigeben.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      const p = confirm.post;
                      setConfirm(null);
                      reopenForEdit(p.id);
                    }}
                  >
                    Zur Bearbeitung entsperren
                  </AlertDialogAction>
                </AlertDialogFooter>
              </>
            )}
            {confirm?.kind === "submit" && (
              <>
                <AlertDialogHeader>
                  <AlertDialogTitle>Bei der Redaktion einreichen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Das Interview geht damit an die Redaktion. Danach kannst du es nicht mehr eigenständig bearbeiten
                    oder neu scannen.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      const p = confirm.post;
                      setConfirm(null);
                      submitToRedaktion(p.id);
                    }}
                  >
                    Einreichen
                  </AlertDialogAction>
                </AlertDialogFooter>
              </>
            )}
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
