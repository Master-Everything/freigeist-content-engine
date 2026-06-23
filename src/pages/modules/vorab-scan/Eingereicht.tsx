import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useSpeakerScans, type SpeakerScan } from "@/hooks/useSpeakerScans";
import { AmpelBadge } from "@/components/vorab-scan/AmpelBadge";
import { ScanDetailSheet } from "@/components/vorab-scan/ScanDetailSheet";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScanSearch, Loader2, Play, Eye, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function VorabScanEingereicht() {
  const { user } = useAuth();
  const [speaker, setSpeaker] = useState<any | null>(null);
  const [speakerLoading, setSpeakerLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [selected, setSelected] = useState<SpeakerScan | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { scans, loading, refresh } = useSpeakerScans(speaker?.id ?? null);

  useEffect(() => {
    if (!user) {
      setSpeakerLoading(false);
      return;
    }
    supabase
      .from("speakers")
      .select("id, first_name, last_name")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setSpeaker(data);
        setSpeakerLoading(false);
      });
  }, [user]);

  async function startScan() {
    if (!speaker?.id) return;
    setStarting(true);
    try {
      const { data, error } = await supabase.functions.invoke("vorab-scan", {
        body: { speaker_id: speaker.id },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
      } else {
        toast.success(`Scan abgeschlossen: ${data?.verdict ?? "—"}`);
      }
      await refresh();
    } catch (e) {
      toast.error("Scan fehlgeschlagen: " + (e as Error).message);
    } finally {
      setStarting(false);
    }
  }

  function openScan(s: SpeakerScan) {
    setSelected(s);
    setSheetOpen(true);
  }

  if (speakerLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!speaker) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Card>
          <CardContent className="py-10 space-y-4">
            <h2 className="font-display text-xl font-semibold">
              Bitte zuerst dein Profil ausfüllen
            </h2>
            <p className="text-muted-foreground">
              Für einen Vorab-Scan brauchen wir deine Speaker-Daten aus Modul 1.
            </p>
            <Button asChild>
              <Link to="/module/erfassung">Zur Profil-Erfassung</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const latest = scans[0];

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8 flex items-start gap-4">
        <div className="rounded-lg border bg-card p-3">
          <ScanSearch className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <div className="text-sm text-muted-foreground tabular-nums">Modul 2</div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Vorab-Scan deines Profils
          </h1>
          <p className="text-muted-foreground mt-2">
            Lass dein Speaker-Profil automatisch gegen die Freigeist-Qualitäts- und
            Compliance-Regeln prüfen. Du bekommst eine Ampel-Bewertung und konkrete
            Hinweise, wie du dein Profil optimieren kannst.
          </p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg">Neuen Scan starten</CardTitle>
            <CardDescription>
              Dein aktuelles Profil wird gegen BannedWords, Compliance-Regeln und den
              FG-Kurator-Prompt geprüft.
            </CardDescription>
          </div>
          <Button onClick={startScan} disabled={starting}>
            {starting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Scanne…
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Profil jetzt prüfen
              </>
            )}
          </Button>
        </CardHeader>
      </Card>

      {latest?.verdict === "red" && (
        <Card className="mb-6 border-destructive/40 bg-destructive/5">
          <CardContent className="flex items-start gap-3 py-5">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-destructive">
                Dein letztes Profil-Audit zeigt kritische Punkte.
              </p>
              <p className="text-muted-foreground mt-1">
                Bitte überarbeite die markierten Stellen und starte den Scan erneut.{" "}
                <Link to="/module/erfassung" className="underline">
                  Zur Profil-Bearbeitung
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bisherige Scans</CardTitle>
          <CardDescription>
            Sortiert nach Datum, neueste zuerst. Klicke auf einen Eintrag für die Details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : scans.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              Noch kein Scan vorhanden. Starte deinen ersten Scan oben.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {scans.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center gap-4 py-3 cursor-pointer hover:bg-muted/40 -mx-2 px-2 rounded-md transition-colors"
                  onClick={() => openScan(s)}
                >
                  <AmpelBadge verdict={s.verdict} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">
                      {new Date(s.created_at).toLocaleString("de-DE")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {s.status === "done"
                        ? `${s.findings.length} Findings · Score ${s.score ?? "—"}`
                        : s.status === "error"
                        ? "Fehler beim Scan"
                        : "läuft…"}
                    </div>
                  </div>
                  {s.status === "done" && (
                    <Badge variant="outline" className="text-xs tabular-nums">
                      {s.score ?? "—"}/100
                    </Badge>
                  )}
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <ScanDetailSheet
        scan={selected as any}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}
