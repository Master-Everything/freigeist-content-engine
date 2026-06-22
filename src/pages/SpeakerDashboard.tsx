import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Post, PostBlocks } from "@/types/post";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, FileText, CheckCircle2, AlertCircle, Loader2, ArrowRight, Plus } from "lucide-react";

export default function SpeakerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [speaker, setSpeaker] = useState<any | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: sp }, { data: ps }] = await Promise.all([
        supabase.from("speakers").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("posts").select("*").order("updated_at", { ascending: false }),
      ]);
      setSpeaker(sp);
      if (ps) {
        setPosts(ps.map((d) => ({ ...d, blocks: d.blocks as unknown as PostBlocks | null })) as Post[]);
      }
      setLoading(false);
    })();
  }, [user]);

  const profileComplete = !!(speaker?.full_name && speaker?.email);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Willkommen{speaker?.full_name ? `, ${speaker.full_name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Dein persönlicher Bereich beim Freigeist Kongress.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Mein Profil</CardTitle>
            </div>
            {profileComplete ? (
              <Badge className="gap-1 bg-success text-success-foreground">
                <CheckCircle2 className="h-3 w-3" /> Ausgefüllt
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 border-warning text-warning">
                <AlertCircle className="h-3 w-3" /> Unvollständig
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              {profileComplete
                ? "Du kannst dein Speaker-Profil jederzeit aktualisieren."
                : "Bitte fülle dein Profil aus, damit wir dein Interview vorbereiten können."}
            </p>
            <Button asChild className="w-full">
              <Link to="/module/erfassung">
                {profileComplete ? "Profil bearbeiten" : "Profil ausfüllen"}
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-3">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Meine Interview-Beiträge</CardTitle>
          </CardHeader>
          <CardContent>
            {posts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Noch keine veröffentlichten Beiträge. Sobald dein Interview aufgezeichnet
                und aufbereitet wurde, erscheint er hier.
              </p>
            ) : (
              <div className="space-y-2">
                {posts.slice(0, 5).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/module/interview-beitraege/view/${p.id}`)}
                    className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50"
                  >
                    <span className="truncate font-medium">{p.interview_title}</span>
                    <ArrowRight className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
