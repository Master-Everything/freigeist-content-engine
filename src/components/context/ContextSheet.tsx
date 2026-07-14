import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Loader2, ExternalLink, Video, Calendar } from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ProfilContextView } from "@/components/profil/ProfilContextView";
import { InterviewContextView } from "./InterviewContextView";
import { ScanFindingsList, type Finding } from "@/components/vorab-scan/ScanFindingsList";
import { AmpelBadge, type Verdict } from "@/components/vorab-scan/AmpelBadge";
import { GuideQuestionsCompact } from "@/components/vorgespraech/GuideQuestionsCompact";
import type { SpeakerProfile } from "@/components/profil/ProfilEditor";
import type { GuideQuestion } from "@/components/leitfaden/LeitfadenEditor";
import { cn } from "@/lib/utils";

type PostData = {
  id: string;
  speaker_id: string | null;
  interview_title: string | null;
  interview_topic: string | null;
  product: string | null;
  product_market_since: string | null;
  previous_interviews: string | null;
  critical_voices: string | null;
  selected_affiliate_indices: number[] | null;
  blocks: any;
};

type SpeakerData = {
  first_name: string | null;
  last_name: string | null;
  top_affiliate_products: any[] | null;
  website: string | null;
  social_links: any | null;
  avatar_url: string | null;
};

type ScanRow = {
  id: string;
  verdict: Verdict;
  score: number | null;
  summary: string | null;
  findings: Finding[];
  created_at: string;
  status: string;
  error_text: string | null;
};

type GuideRow = {
  hauptfragen: GuideQuestion[] | null;
  vertiefungsfragen: GuideQuestion[] | null;
  kritische_fragen: GuideQuestion[] | null;
};

type RecordingRow = {
  interviewer_notiz: string | null;
  scheduled_at: string | null;
};

export function ContextSheet({ postId }: { postId: string }) {
  const { role } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [post, setPost] = useState<PostData | null>(null);
  const [speaker, setSpeaker] = useState<SpeakerData | null>(null);
  const [profile, setProfile] = useState<SpeakerProfile | null>(null);
  const [speakerScan, setSpeakerScan] = useState<ScanRow | null>(null);
  const [postScan, setPostScan] = useState<ScanRow | null>(null);
  const [guide, setGuide] = useState<GuideRow | null>(null);
  const [recording, setRecording] = useState<RecordingRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      const { data: p, error: pErr } = await supabase
        .from("posts")
        .select(
          "id, speaker_id, interview_title, interview_topic, product, product_market_since, previous_interviews, critical_voices, selected_affiliate_indices, blocks"
        )
        .eq("id", postId)
        .maybeSingle();
      if (cancelled) return;
      if (pErr || !p) {
        setError(pErr?.message ?? "Interview nicht gefunden.");
        setLoading(false);
        return;
      }
      setPost(p as PostData);

      const [speakerRes, profileRes, postScanRes, guideRes, recRes, speakerScanRes] = await Promise.all([
        p.speaker_id
          ? supabase
              .from("speakers")
              .select("first_name, last_name, top_affiliate_products, website, social_links, avatar_url")
              .eq("id", p.speaker_id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null } as any),
        supabase
          .from("speaker_profiles")
          .select("*")
          .eq("post_id", postId)
          .eq("status", "freigegeben")
          .maybeSingle(),
        supabase
          .from("post_scans")
          .select("id, verdict, score, summary, findings, created_at, status, error_text")
          .eq("post_id", postId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("interview_guides")
          .select("hauptfragen, vertiefungsfragen, kritische_fragen")
          .eq("post_id", postId)
          .eq("status", "final")
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("recording_sessions")
          .select("interviewer_notiz, scheduled_at")
          .eq("post_id", postId)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        p.speaker_id
          ? supabase
              .from("speaker_scans")
              .select("id, verdict, score, summary, findings, created_at, status, error_text")
              .eq("speaker_id", p.speaker_id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null } as any),
      ]);
      if (cancelled) return;
      setSpeaker((speakerRes.data as SpeakerData) ?? null);
      setProfile((profileRes.data as SpeakerProfile) ?? null);
      setPostScan((postScanRes.data as ScanRow) ?? null);
      setGuide((guideRes.data as GuideRow) ?? null);
      setRecording((recRes.data as RecordingRow) ?? null);
      setSpeakerScan((speakerScanRes.data as ScanRow) ?? null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, postId]);

  const roleSafe: "admin" | "speaker" = role === "admin" ? "admin" : "speaker";
  const mainVideoUrl = post?.blocks?.main_video_url as string | undefined;

  return (
    <Sheet open={open} onOpenChange={setOpen} modal={false}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={open ? "Kontext schließen" : "Kontext öffnen"}
          className={cn(
            "fixed top-1/2 -translate-y-1/2 z-[60] transition-[right] duration-300 ease-out",
            "flex items-center gap-2 py-4 pl-1.5 pr-2",
            "rounded-l-lg rounded-r-none",
            "bg-primary text-primary-foreground shadow-lg",
            "[writing-mode:vertical-rl]",
            "text-sm font-medium tracking-wide",
            open ? "right-0 sm:right-[36rem]" : "right-0 hover:pl-2.5"
          )}
        >
          <BookOpen className="h-4 w-4" />
          Kontext
        </button>
      </SheetTrigger>
      <SheetContent
        className="w-full sm:max-w-xl overflow-y-auto [&>[data-radix-dialog-overlay]]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle>Kontext</SheetTitle>
          <SheetDescription>
            Sprecher, Interview, Scans und Fragenkatalog zum Nachschlagen.
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="py-10 text-center text-sm text-destructive">{error}</div>
        ) : (
          <Tabs defaultValue="profil" className="mt-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profil">Profil</TabsTrigger>
              <TabsTrigger value="interview">Interview</TabsTrigger>
              <TabsTrigger value="scans">Scans</TabsTrigger>
              <TabsTrigger value="fragen">Fragen</TabsTrigger>
            </TabsList>

            <TabsContent value="profil" className="mt-4">
              {profile ? (
                <ProfilContextView profile={profile} role={roleSafe} />
              ) : roleSafe === "admin" ? (
                <div className="space-y-3 rounded-md border bg-muted/30 p-4 text-sm">
                  <div className="text-muted-foreground">
                    Für dieses Interview ist noch kein freigegebenes Profil vorhanden.
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/module/profil?post_id=${postId}&speaker_id=${post?.speaker_id ?? ""}`} onClick={() => setOpen(false)}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Zu Modul 3 (Profil)
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Profil noch nicht freigegeben.
                </div>
              )}
            </TabsContent>

            <TabsContent value="interview" className="mt-4">
              {post && <InterviewContextView post={post} speaker={speaker} />}
            </TabsContent>

            <TabsContent value="scans" className="mt-4 space-y-6">
              <ScanBlock title="Sprecher-Scan (M2)" scan={speakerScan} />
              <ScanBlock title="Interview-Scan (M7)" scan={postScan} />
            </TabsContent>

            <TabsContent value="fragen" className="mt-4 space-y-5">
              {(recording?.scheduled_at || mainVideoUrl) && (
                <div className="rounded-md border bg-muted/30 p-3 space-y-2 text-sm">
                  {recording?.scheduled_at && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Aufzeichnung:</span>
                      <span className="text-foreground font-medium">
                        {new Date(recording.scheduled_at).toLocaleString("de-DE")}
                      </span>
                    </div>
                  )}
                  {mainVideoUrl && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Video className="h-3.5 w-3.5" />
                      <a
                        href={mainVideoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline break-all"
                      >
                        {mainVideoUrl}
                      </a>
                    </div>
                  )}
                </div>
              )}
              {recording?.interviewer_notiz && (
                <div className="space-y-1">
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Interviewer-Notiz (Aufzeichnung)
                  </div>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed rounded-md border bg-muted/20 p-3">
                    {recording.interviewer_notiz}
                  </div>
                </div>
              )}
              <GuideQuestionsCompact
                hauptfragen={guide?.hauptfragen ?? null}
                vertiefungsfragen={guide?.vertiefungsfragen ?? null}
                kritische_fragen={guide?.kritische_fragen ?? null}
              />
            </TabsContent>
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  );
}

function ScanBlock({ title, scan }: { title: string; scan: ScanRow | null }) {
  if (!scan) {
    return (
      <div className="space-y-2">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </div>
        <div className="text-sm text-muted-foreground italic">
          Noch kein Scan vorhanden.
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </div>
        <div className="flex items-center gap-2">
          <AmpelBadge verdict={scan.verdict} />
          {scan.score !== null && (
            <span className="text-xs text-muted-foreground tabular-nums">
              {scan.score}/100
            </span>
          )}
        </div>
      </div>
      <div className="text-[11px] text-muted-foreground">
        {new Date(scan.created_at).toLocaleString("de-DE")}
      </div>
      {scan.summary && (
        <p className="text-sm text-foreground/90 whitespace-pre-line">{scan.summary}</p>
      )}
      {Array.isArray(scan.findings) && scan.findings.length > 0 && (
        <ScanFindingsList findings={scan.findings} />
      )}
    </div>
  );
}
