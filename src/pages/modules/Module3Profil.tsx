import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { UserCheck, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import ModulePage from "./ModulePage";

export default function Module3Profil() {
  const [params] = useSearchParams();
  const postId = params.get("post_id");
  const speakerId = params.get("speaker_id");
  const [loading, setLoading] = useState(false);
  const [post, setPost] = useState<any | null>(null);
  const [speaker, setSpeaker] = useState<any | null>(null);

  useEffect(() => {
    if (!postId && !speakerId) return;
    setLoading(true);
    (async () => {
      const [p, s] = await Promise.all([
        postId ? supabase.from("posts").select("id, interview_title, status").eq("id", postId).maybeSingle() : Promise.resolve({ data: null }),
        speakerId ? supabase.from("speakers").select("id, first_name, last_name, industry").eq("id", speakerId).maybeSingle() : Promise.resolve({ data: null }),
      ]);
      setPost((p as any).data);
      setSpeaker((s as any).data);
      setLoading(false);
    })();
  }, [postId, speakerId]);

  if (!postId && !speakerId) {
    return (
      <ModulePage
        num={3}
        title="Profil Interviewgast"
        icon={UserCheck}
        description="Erstellen eines Profils des Interviewgastes auf Basis der Erfassung seiner Bewerber-Daten und seines Vorab-Scan. Auf Basis des Profils werden die Daten für seine Sprechermappe generiert und an Zoho zur Unterschrift übergeben und ein Link zur Sprechermappe eingebunden. Erst wenn Zoho die Unterschrift zurückmeldet, werden die nachfolgenden Module freigegeben."
      />
    );
  }

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

      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Profil-Generator und Sprechermappen-Workflow folgen im nächsten Ausbauschritt.
        </CardContent>
      </Card>
    </div>
  );
}
