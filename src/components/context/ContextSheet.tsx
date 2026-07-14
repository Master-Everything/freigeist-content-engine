import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Loader2, ExternalLink } from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ProfilContextView } from "@/components/profil/ProfilContextView";
import { InterviewContextView } from "./InterviewContextView";
import type { SpeakerProfile } from "@/components/profil/ProfilEditor";
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
};

type SpeakerData = {
  first_name: string | null;
  last_name: string | null;
  top_affiliate_products: string[] | null;
};

export function ContextSheet({ postId }: { postId: string }) {
  const { role } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [post, setPost] = useState<PostData | null>(null);
  const [speaker, setSpeaker] = useState<SpeakerData | null>(null);
  const [profile, setProfile] = useState<SpeakerProfile | null>(null);
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
          "id, speaker_id, interview_title, interview_topic, product, product_market_since, previous_interviews, critical_voices, selected_affiliate_indices"
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

      const [speakerRes, profileRes] = await Promise.all([
        p.speaker_id
          ? supabase
              .from("speakers")
              .select("first_name, last_name, top_affiliate_products")
              .eq("id", p.speaker_id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null } as any),
        supabase
          .from("speaker_profiles")
          .select("*")
          .eq("post_id", postId)
          .eq("status", "freigegeben")
          .maybeSingle(),
      ]);
      if (cancelled) return;
      setSpeaker((speakerRes.data as SpeakerData) ?? null);
      setProfile((profileRes.data as SpeakerProfile) ?? null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, postId]);

  const roleSafe: "admin" | "speaker" = role === "admin" ? "admin" : "speaker";

  return (
    <Sheet open={open} onOpenChange={setOpen} modal={false}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Kontext öffnen"
          className="fixed right-0 top-1/2 -translate-y-1/2 z-40
                     flex items-center gap-2 py-4 pl-2 pr-1.5
                     rounded-l-lg rounded-r-none
                     bg-primary text-primary-foreground shadow-lg
                     hover:pr-2.5 hover:pl-2.5 transition-all
                     [writing-mode:vertical-rl] rotate-180
                     text-sm font-medium tracking-wide"
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
            Sprecher-Profil und Interview-Eckdaten zum Nachschlagen.
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
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profil">Profil</TabsTrigger>
              <TabsTrigger value="interview">Interview</TabsTrigger>
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
                    <Link to={`/module/profil?post_id=${postId}`} onClick={() => setOpen(false)}>
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
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  );
}
