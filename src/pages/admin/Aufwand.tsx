import { useMemo, useState } from "react";
import { useHourlyRate } from "@/hooks/useHourlyRate";
import { useTimeEntries, type TimeEntry, type TimeEntryStatus } from "@/hooks/useTimeEntries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus, Download, Clock } from "lucide-react";
import { toast } from "sonner";

const eur = (n: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n);
const hrs = (n: number) =>
  new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 }).format(n) + " h";
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });

function slugId(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function Aufwand() {
  const { rate, setRate, isSaving } = useHourlyRate();
  const { entries, isLoading, create, update, remove } = useTimeEntries();

  const [rateDraft, setRateDraft] = useState<string>("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [onlyEstimated, setOnlyEstimated] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const displayRate = rateDraft === "" ? rate : Number(rateDraft) || 0;

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (from && e.entry_date < from) return false;
      if (to && e.entry_date > to) return false;
      if (onlyEstimated && e.status !== "geschätzt") return false;
      return true;
    });
  }, [entries, from, to, onlyEstimated]);

  const blocks = useMemo(() => {
    const map = new Map<string, TimeEntry[]>();
    for (const e of filtered) {
      if (!map.has(e.block)) map.set(e.block, []);
      map.get(e.block)!.push(e);
    }
    // sort blocks by first entry date
    return Array.from(map.entries())
      .map(([block, items]) => ({
        block,
        items,
        hours: items.reduce((s, i) => s + i.hours, 0),
      }))
      .sort((a, b) => a.items[0].entry_date.localeCompare(b.items[0].entry_date));
  }, [filtered]);

  const totalHours = filtered.reduce((s, e) => s + e.hours, 0);
  const totalNet = totalHours * displayRate;

  const handleSaveRate = () => {
    const n = Number(rateDraft);
    if (!Number.isFinite(n) || n < 0) {
      toast.error("Ungültiger Stundensatz");
      return;
    }
    setRate(n);
    setRateDraft("");
    toast.success("Stundensatz gespeichert");
  };

  const exportCsv = () => {
    const rows = [
      ["Datum", "Block", "Aufgabe", "Notiz", "Stunden", "Netto (EUR)", "Status"],
      ...filtered.map((e) => [
        e.entry_date,
        e.block,
        e.task,
        e.note ?? "",
        e.hours.toString().replace(".", ","),
        (e.hours * displayRate).toFixed(2).replace(".", ","),
        e.status,
      ]),
      [],
      ["", "", "", "Summe", totalHours.toString().replace(".", ","), totalNet.toFixed(2).replace(".", ","), ""],
      ["", "", "", "Stundensatz", "", displayRate.toFixed(2).replace(".", ","), ""],
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aufwand-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleStatus = (e: TimeEntry) => {
    const next: TimeEntryStatus = e.status === "geschätzt" ? "bestätigt" : "geschätzt";
    update({ id: e.id, status: next });
  };

  const existingBlocks = useMemo(
    () => Array.from(new Set(entries.map((e) => e.block))).sort(),
    [entries]
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Aufwand</h1>
          <p className="text-sm text-muted-foreground">
            Chronologische Übersicht aller Arbeitsblöcke – Grundlage für die Abrechnung. Alle
            Beträge sind Netto.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Eintrag hinzufügen
            </Button>
          </DialogTrigger>
          <EntryDialog
            existingBlocks={existingBlocks}
            onSubmit={(input) => {
              create(input);
              setDialogOpen(false);
            }}
          />
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" /> Kalkulation
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="space-y-1">
            <Label htmlFor="rate">Stundensatz (€ netto)</Label>
            <div className="flex gap-2">
              <Input
                id="rate"
                type="number"
                inputMode="decimal"
                step="1"
                placeholder={String(rate)}
                value={rateDraft}
                onChange={(e) => setRateDraft(e.target.value)}
              />
              <Button
                variant="secondary"
                onClick={handleSaveRate}
                disabled={rateDraft === "" || isSaving}
              >
                Speichern
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Aktuell: {eur(rate)}/h</p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="from">Von</Label>
            <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="to">Bis</Label>
            <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="flex items-end justify-between gap-4">
            <div className="flex items-center gap-2">
              <Switch id="est" checked={onlyEstimated} onCheckedChange={setOnlyEstimated} />
              <Label htmlFor="est" className="text-sm">
                Nur geschätzte
              </Label>
            </div>
            <Button variant="outline" onClick={exportCsv}>
              <Download className="mr-2 h-4 w-4" /> CSV
            </Button>
          </div>

          <div className="col-span-full grid gap-4 md:grid-cols-3 pt-4 border-t">
            <Stat label="Einträge" value={String(filtered.length)} />
            <Stat label="Gesamtstunden" value={hrs(totalHours)} />
            <Stat label="Gesamtsumme (netto)" value={eur(totalNet)} highlight />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Blockübersicht</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Block</TableHead>
                <TableHead className="text-right">Stunden</TableHead>
                <TableHead className="text-right">Netto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blocks.map((b) => (
                <TableRow
                  key={b.block}
                  className="cursor-pointer"
                  onClick={() =>
                    document
                      .getElementById(`block-${slugId(b.block)}`)
                      ?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }
                >
                  <TableCell className="font-medium">{b.block}</TableCell>
                  <TableCell className="text-right tabular-nums">{hrs(b.hours)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {eur(b.hours * displayRate)}
                  </TableCell>
                </TableRow>
              ))}
              {blocks.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    Keine Einträge im gewählten Zeitraum.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {blocks.map((b) => (
          <Card key={b.block} id={`block-${slugId(b.block)}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg">{b.block}</CardTitle>
              <div className="text-sm text-muted-foreground tabular-nums">
                {hrs(b.hours)} · {eur(b.hours * displayRate)}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[110px]">Datum</TableHead>
                    <TableHead>Aufgabe</TableHead>
                    <TableHead className="w-[100px] text-right">Stunden</TableHead>
                    <TableHead className="w-[120px] text-right">Netto</TableHead>
                    <TableHead className="w-[130px]">Status</TableHead>
                    <TableHead className="w-[60px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {b.items.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="tabular-nums text-xs text-muted-foreground">
                        {fmtDate(e.entry_date)}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{e.task}</div>
                        {e.note && (
                          <div className="text-xs text-muted-foreground">{e.note}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{hrs(e.hours)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {eur(e.hours * displayRate)}
                      </TableCell>
                      <TableCell>
                        <button onClick={() => toggleStatus(e)} className="cursor-pointer">
                          {e.status === "geschätzt" ? (
                            <Badge
                              variant="outline"
                              className="border-yellow-500/50 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                            >
                              Ø geschätzt
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400"
                            >
                              ✓ bestätigt
                            </Badge>
                          )}
                        </button>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Eintrag löschen?")) remove(e.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-lg border p-4 ${highlight ? "bg-primary/5 border-primary/30" : ""}`}>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${highlight ? "text-primary" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function EntryDialog({
  existingBlocks,
  onSubmit,
}: {
  existingBlocks: string[];
  onSubmit: (input: {
    entry_date: string;
    block: string;
    task: string;
    hours: number;
    note?: string;
    status: TimeEntryStatus;
  }) => void;
}) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [block, setBlock] = useState<string>(existingBlocks[0] ?? "");
  const [customBlock, setCustomBlock] = useState("");
  const [task, setTask] = useState("");
  const [hours, setHours] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<TimeEntryStatus>("geschätzt");

  const submit = () => {
    const finalBlock = block === "__new__" ? customBlock.trim() : block;
    const h = Number(hours);
    if (!finalBlock || !task.trim() || !Number.isFinite(h) || h <= 0) {
      toast.error("Bitte Block, Aufgabe und Stunden ausfüllen");
      return;
    }
    onSubmit({
      entry_date: date,
      block: finalBlock,
      task: task.trim(),
      hours: h,
      note: note.trim() || undefined,
      status,
    });
    setTask("");
    setHours("");
    setNote("");
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Neuer Zeit-Eintrag</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 py-2">
        <div className="grid gap-1">
          <Label>Datum</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="grid gap-1">
          <Label>Block</Label>
          <Select value={block} onValueChange={setBlock}>
            <SelectTrigger>
              <SelectValue placeholder="Block wählen" />
            </SelectTrigger>
            <SelectContent>
              {existingBlocks.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
              <SelectItem value="__new__">+ Neuer Block…</SelectItem>
            </SelectContent>
          </Select>
          {block === "__new__" && (
            <Input
              placeholder="Neuer Block-Name"
              value={customBlock}
              onChange={(e) => setCustomBlock(e.target.value)}
            />
          )}
        </div>
        <div className="grid gap-1">
          <Label>Aufgabe</Label>
          <Input value={task} onChange={(e) => setTask(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1">
            <Label>Stunden</Label>
            <Input
              type="number"
              step="0.25"
              min="0"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
            />
          </div>
          <div className="grid gap-1">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as TimeEntryStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="geschätzt">Ø geschätzt</SelectItem>
                <SelectItem value="bestätigt">✓ bestätigt</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-1">
          <Label>Notiz (optional)</Label>
          <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={submit}>Anlegen</Button>
      </DialogFooter>
    </DialogContent>
  );
}
