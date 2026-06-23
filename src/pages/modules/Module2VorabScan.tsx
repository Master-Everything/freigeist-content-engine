import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AmpelBadge } from "@/components/vorab-scan/AmpelBadge";
import { ScanDetailSheet } from "@/components/vorab-scan/ScanDetailSheet";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ScanSearch, Loader2, RefreshCw, Eye, Play } from "lucide-react";
import { toast } from "sonner";

type ScanRow = {
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

export default function Module2VorabScan() {
  const [rows, setRows] = useState<ScanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [verdictFilter, setVerdictFilter] = useState<string>("all");
  const [selected, setSelected] = useState<ScanRow | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [rescanning, setRescanning] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("speaker_scans")
      .select("*, speakers(first_name, last_name, industry)")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) toast.error("Konnte Scans nicht laden: " + error.message);
    setRows((data ?? []) as ScanRow[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (verdictFilter !== "all" && r.verdict !== verdictFilter) return false;
      if (!needle) return true;
      const name = `${r.speakers?.first_name ?? ""} ${r.speakers?.last_name ?? ""}`.toLowerCase();
      return name.includes(needle) || (r.speakers?.industry ?? "").toLowerCase().includes(needle);
    });
  }, [rows, q, verdictFilter]);

  async function reScan(speakerId: string) {
    setRescanning(speakerId);
    try {
      const { data, error } = await supabase.functions.invoke("vorab-scan", {
        body: { speaker_id: speakerId },
      });
      if (error) throw error;
      if (data?.error) toast.error(data.error);
      else toast.success(`Scan: ${data?.verdict ?? "—"}`);
      await load();
    } catch (e) {
      toast.error("Re-Scan fehlgeschlagen: " + (e as Error).message);
    } finally {
      setRescanning(null);
    }
  }

  const counts = useMemo(() => {
    return {
      total: rows.length,
      red: rows.filter((r) => r.verdict === "red").length,
      yellow: rows.filter((r) => r.verdict === "yellow").length,
      green: rows.filter((r) => r.verdict === "green").length,
    };
  }, [rows]);

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
            Alle Profil-Audits über alle Speaker. Manuelle Re-Scans möglich.
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

      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Alle Scans</CardTitle>
            <CardDescription>Sortiert nach Datum, neueste oben.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={verdictFilter} onValueChange={setVerdictFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Verdict" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="red">Rot</SelectItem>
                <SelectItem value="yellow">Gelb</SelectItem>
                <SelectItem value="green">Grün</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Suche Name oder Branche…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-64"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
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
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs text-muted-foreground tabular-nums">
                      {new Date(r.created_at).toLocaleString("de-DE")}
                    </TableCell>
                    <TableCell className="text-sm">
                      {r.speakers?.first_name} {r.speakers?.last_name}
                    </TableCell>
                    <TableCell className="text-xs capitalize text-muted-foreground">
                      {r.speakers?.industry ?? "—"}
                    </TableCell>
                    <TableCell>
                      {r.status === "error" ? (
                        <Badge variant="outline" className="text-xs text-destructive border-destructive/40">
                          Fehler
                        </Badge>
                      ) : (
                        <AmpelBadge verdict={r.verdict} />
                      )}
                    </TableCell>
                    <TableCell className="text-xs tabular-nums">
                      {r.score ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs tabular-nums">
                      {r.findings?.length ?? 0}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelected(r);
                            setSheetOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => reScan(r.speaker_id)}
                          disabled={rescanning === r.speaker_id}
                          title="Re-Scan"
                        >
                          {rescanning === r.speaker_id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                      Keine Scans gefunden.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ScanDetailSheet scan={selected as any} open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "red" | "yellow" | "green";
}) {
  const toneCls =
    tone === "red"
      ? "text-destructive"
      : tone === "yellow"
      ? "text-amber-600 dark:text-amber-400"
      : tone === "green"
      ? "text-emerald-600 dark:text-emerald-400"
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
