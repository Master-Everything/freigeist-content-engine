import { useState } from "react";
import { Loader2, CheckCircle2, MessageSquareWarning, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { SpeakerProfile } from "./ProfilEditor";

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="space-y-1">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="whitespace-pre-wrap text-sm leading-relaxed">{value}</div>
    </div>
  );
}

function ChipRow({ label, items }: { label: string; items: string[] | null | undefined }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((it, i) => (
          <Badge key={i} variant="secondary" className="font-normal">{it}</Badge>
        ))}
      </div>
    </div>
  );
}

export function ProfilReadonly({
  profile,
  onChanged,
}: {
  profile: SpeakerProfile;
  onChanged: (p: SpeakerProfile) => void;
}) {
  const [busy, setBusy] = useState<"freigeben" | "aenderung" | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");

  async function decide(action: "freigeben" | "aenderung") {
    if (action === "aenderung" && !feedback.trim()) {
      toast({ title: "Bitte Feedback angeben", variant: "destructive" });
      return;
    }
    setBusy(action);
    const { data, error } = await supabase.functions.invoke("speaker-profile-decision", {
      body: { profile_id: profile.id, action, feedback: feedback.trim() || undefined },
    });
    setBusy(null);
    if (error) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
      return;
    }
    if ((data as any)?.error) {
      toast({ title: "Fehler", description: (data as any).error, variant: "destructive" });
      return;
    }
    onChanged((data as any).profile);
    setShowFeedback(false);
    setFeedback("");
    toast({
      title: action === "freigeben" ? "Profil freigegeben" : "Änderungswunsch übermittelt",
      description: action === "freigeben"
        ? "Der Beitrag geht jetzt in Modul 4 (Leitfaden)."
        : "Die Redaktion überarbeitet dein Profil.",
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Dein Profil-Entwurf
            </CardTitle>
            <CardDescription>
              Die Redaktion hat dein Profil kuratiert. Bitte prüfen und freigeben – oder Änderungen anfragen.
            </CardDescription>
          </div>
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            Zur Freigabe
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Field label="Kurzbio" value={profile.kurzbio} />
        <Field label="Langbio" value={profile.langbio} />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Positionierung" value={profile.positionierung} />
          <Field label="Zielgruppe" value={profile.zielgruppe} />
        </div>
        <ChipRow label="Themen" items={profile.themen} />
        <ChipRow label="Kernaussagen" items={profile.kernaussagen} />
        <ChipRow label="Mediale Hooks" items={profile.mediale_hooks} />
        <ChipRow label="Kritische Punkte" items={profile.kritische_punkte} />
        {profile.expertise_score != null && (
          <div className="text-sm">
            <span className="text-muted-foreground">Expertise-Score: </span>
            <span className="font-mono">{profile.expertise_score} / 10</span>
          </div>
        )}
        {profile.notes && <Field label="Notizen der Redaktion" value={profile.notes} />}

        {showFeedback && (
          <div className="space-y-2 rounded-md border bg-muted/30 p-3">
            <div className="text-sm font-medium">Was soll geändert werden?</div>
            <Textarea
              rows={4}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Beschreibe deine Änderungswünsche…"
            />
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          {!showFeedback ? (
            <>
              <Button onClick={() => decide("freigeben")} disabled={busy !== null}>
                {busy === "freigeben"
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Profil freigeben
              </Button>
              <Button variant="outline" onClick={() => setShowFeedback(true)} disabled={busy !== null}>
                <MessageSquareWarning className="mr-2 h-4 w-4" />
                Änderungen erbitten
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => decide("aenderung")} disabled={busy !== null}>
                {busy === "aenderung"
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  : <MessageSquareWarning className="mr-2 h-4 w-4" />}
                Änderungswunsch absenden
              </Button>
              <Button variant="ghost" onClick={() => { setShowFeedback(false); setFeedback(""); }} disabled={busy !== null}>
                Abbrechen
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
