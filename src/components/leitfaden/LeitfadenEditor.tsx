import { useMemo, useState } from "react";
import {
  Loader2, Plus, X, Sparkles, Save, CheckCircle2, RotateCcw,
  ArrowUp, ArrowDown, Wand2, StickyNote,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAutoGrow } from "@/hooks/use-auto-grow";
import { SimpleMarkdown } from "@/lib/simple-markdown";

export type GuideQuestion = { id: string; text: string; active: boolean; interviewer_notiz?: string | null };

export type InterviewGuide = {
  id: string;
  post_id: string;
  speaker_id: string | null;
  speaker_profile_id: string | null;
  status: "entwurf" | "final";
  intro: string | null;
  hauptfragen: GuideQuestion[] | null;
  vertiefungsfragen: GuideQuestion[] | null;
  kritische_fragen: GuideQuestion[] | null;
  abschluss: string | null;
  redaktionelle_hinweise: string | null;
  ki_instruktionen: string | null;
  notes: string | null;
  model_used: string | null;
  prompt_version: number | null;
  generated_at: string | null;
};

function newQ(text = ""): GuideQuestion {
  return { id: crypto.randomUUID(), text, active: true };
}

// Bestandsdaten defensiv in Objektform bringen (falls Alt-Daten aus Cache reinkommen).
function toQArray(v: unknown): GuideQuestion[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x: any) => {
      if (typeof x === "string" && x.trim()) return newQ(x.trim());
      if (x && typeof x === "object" && typeof x.text === "string" && x.text.trim()) {
        return {
          id: typeof x.id === "string" && x.id ? x.id : crypto.randomUUID(),
          text: x.text.trim(),
          active: typeof x.active === "boolean" ? x.active : true,
          interviewer_notiz: typeof x.interviewer_notiz === "string" ? x.interviewer_notiz : null,
        };
      }
      return null;
    })
    .filter((x): x is GuideQuestion => x !== null);
}

function QuestionList({
  label,
  items,
  onChange,
  showOnlyActive,
  compact,
  placeholder,
}: {
  label: string;
  items: GuideQuestion[];
  onChange: (next: GuideQuestion[]) => void;
  showOnlyActive: boolean;
  compact: boolean;
  placeholder?: string;
}) {
  const cls = compact
    ? {
        listWrap: "space-y-1.5",
        card: "px-2 py-1.5",
        textareaRows: 1,
        textareaClass: "flex-1 min-h-0",
        iconBtn: "h-7 w-7",
        noteWrap: "mt-1.5 pl-12 pr-2 space-y-1",
      }
    : {
        listWrap: "space-y-2",
        card: "p-3",
        textareaRows: 2,
        textareaClass: "flex-1",
        iconBtn: "",
        noteWrap: "mt-2 pl-12 pr-2 space-y-1",
      };
  const [draft, setDraft] = useState("");
  const [openNoteIds, setOpenNoteIds] = useState<Set<string>>(new Set());
  const activeCount = items.filter((q) => q.active).length;

  function update(idx: number, patch: Partial<GuideQuestion>) {
    const next = [...items];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  }
  function remove(idx: number) {
    onChange(items.filter((_, i) => i !== idx));
  }
  function move(idx: number, dir: -1 | 1) {
    const j = idx + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange(next);
  }
  function add() {
    const t = draft.trim();
    if (!t) return;
    onChange([...items, newQ(t)]);
    setDraft("");
  }
  function toggleNote(id: string) {
    setOpenNoteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-2">
      <Label>
        {label}{" "}
        <span className="text-xs text-muted-foreground">
          ({activeCount} übernommen / {items.length} gesamt)
        </span>
      </Label>
      <div className={cls.listWrap}>
        {items.map((q, i) => {
          if (showOnlyActive && !q.active) return null;
          return (
            <QuestionRow
              key={q.id}
              q={q}
              index={i}
              total={items.length}
              cls={cls}
              noteOpen={openNoteIds.has(q.id)}
              onToggleNote={() => toggleNote(q.id)}
              onUpdate={(patch) => update(i, patch)}
              onMove={(dir) => move(i, dir)}
              onRemove={() => remove(i)}
            />
          );
        })}
      </div>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder ?? "Frage hinzufügen…"}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button type="button" variant="outline" size="icon" onClick={add}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

type RowCls = {
  listWrap: string;
  card: string;
  textareaRows: number;
  textareaClass: string;
  iconBtn: string;
  noteWrap: string;
};

function QuestionRow({
  q,
  index,
  total,
  cls,
  noteOpen,
  onToggleNote,
  onUpdate,
  onMove,
  onRemove,
}: {
  q: GuideQuestion;
  index: number;
  total: number;
  cls: RowCls;
  noteOpen: boolean;
  onToggleNote: () => void;
  onUpdate: (patch: Partial<GuideQuestion>) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  const hasNote = !!(q.interviewer_notiz && q.interviewer_notiz.trim());
  const textRef = useAutoGrow(q.text, cls.textareaRows);
  const notizRef = useAutoGrow(q.interviewer_notiz ?? "", cls.textareaRows);
  return (
    <div
      className={`rounded-md border ${cls.card} ${q.active ? "" : "opacity-60 bg-muted/30"}`}
    >
      <div className="flex gap-1.5 items-start">
        <div className="flex w-10 shrink-0 flex-col items-center gap-1 pt-1">
          <span className="text-xs font-mono text-muted-foreground w-6 text-center">
            {index + 1}.
          </span>
          <Switch
            checked={q.active}
            onCheckedChange={(v) => onUpdate({ active: v })}
            aria-label="Übernehmen"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onToggleNote}
            aria-label={hasNote ? "Interviewer-Notiz bearbeiten" : "Interviewer-Notiz hinzufügen"}
            aria-pressed={noteOpen}
            className={`relative ${cls.iconBtn} ${hasNote ? "text-primary" : "text-muted-foreground"}`}
          >
            <StickyNote className="h-4 w-4" />
            {hasNote && (
              <span
                aria-hidden
                className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-primary"
              />
            )}
          </Button>
        </div>
        <Textarea
          ref={textRef}
          rows={cls.textareaRows}
          value={q.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          className={`${cls.textareaClass} resize-none`}
        />
        <div className="flex flex-col gap-1">
          <Button
            type="button" variant="ghost" size="icon" className={cls.iconBtn}
            disabled={index === 0}
            onClick={() => onMove(-1)}
            aria-label="Nach oben"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            type="button" variant="ghost" size="icon" className={cls.iconBtn}
            disabled={index === total - 1}
            onClick={() => onMove(1)}
            aria-label="Nach unten"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button
            type="button" variant="ghost" size="icon" className={cls.iconBtn}
            onClick={onRemove}
            aria-label="Entfernen"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {noteOpen && (
        <div className={cls.noteWrap}>
          <Label className="text-xs text-muted-foreground">
            Interviewer-Notiz (intern, nur Admin)
          </Label>
          <Textarea
            ref={notizRef}
            rows={1}
            className="min-h-0 resize-none"
            value={q.interviewer_notiz ?? ""}
            onChange={(e) => onUpdate({ interviewer_notiz: e.target.value })}
            placeholder="Was möchtest du im Vorgespräch dazu klären?"
          />
        </div>
      )}
    </div>
  );
}


export function LeitfadenEditor({
  postId,
  initial,
  onChanged,
}: {
  postId: string;
  initial: InterviewGuide | null;
  onChanged: (g: InterviewGuide | null) => void;
}) {
  const [guide, setGuide] = useState<InterviewGuide | null>(
    initial
      ? {
          ...initial,
          hauptfragen: toQArray(initial.hauptfragen),
          vertiefungsfragen: toQArray(initial.vertiefungsfragen),
          kritische_fragen: toQArray(initial.kritische_fragen),
        }
      : null,
  );
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [prioritizing, setPrioritizing] = useState(false);
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [compact, setCompact] = useState(true);
  const [hinweiseMode, setHinweiseMode] = useState<"edit" | "preview">("edit");

  // Auto-Grow für alle freien Textareas — MUSS vor dem `if (!guide)` Return stehen,
  // damit die Hook-Reihenfolge über beide Render-Pfade stabil bleibt.
  const introRef = useAutoGrow(guide?.intro ?? "");
  const kiRef = useAutoGrow(guide?.ki_instruktionen ?? "");
  const abschlussRef = useAutoGrow(guide?.abschluss ?? "");
  const hinweiseRef = useAutoGrow(guide?.redaktionelle_hinweise ?? "");
  const notesRef = useAutoGrow(guide?.notes ?? "");

  async function generate() {
    setGenerating(true);
    const { data, error } = await supabase.functions.invoke("generate-interview-guide", {
      body: { post_id: postId },
    });
    setGenerating(false);
    if (error) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
      return;
    }
    if ((data as any)?.error) {
      toast({ title: "Fehler", description: (data as any).error, variant: "destructive" });
      return;
    }
    const raw = (data as any).guide as any;
    const g: InterviewGuide = {
      ...raw,
      hauptfragen: toQArray(raw.hauptfragen),
      vertiefungsfragen: toQArray(raw.vertiefungsfragen),
      kritische_fragen: toQArray(raw.kritische_fragen),
    };
    setGuide(g);
    onChanged(g);
    toast({ title: "Leitfaden-Entwurf generiert" });
  }

  async function save() {
    if (!guide) return;
    setSaving(true);
    const update = {
      intro: guide.intro,
      hauptfragen: guide.hauptfragen ?? [],
      vertiefungsfragen: guide.vertiefungsfragen ?? [],
      kritische_fragen: guide.kritische_fragen ?? [],
      abschluss: guide.abschluss,
      redaktionelle_hinweise: guide.redaktionelle_hinweise,
      ki_instruktionen: guide.ki_instruktionen,
      notes: guide.notes,
    };
    const { data, error } = await (supabase as any)
      .from("interview_guides")
      .update(update)
      .eq("id", guide.id)
      .select("*")
      .single();
    setSaving(false);
    if (error) {
      toast({ title: "Speichern fehlgeschlagen", description: error.message, variant: "destructive" });
      return;
    }
    const next: InterviewGuide = {
      ...(data as any),
      hauptfragen: toQArray((data as any).hauptfragen),
      vertiefungsfragen: toQArray((data as any).vertiefungsfragen),
      kritische_fragen: toQArray((data as any).kritische_fragen),
    };
    setGuide(next);
    onChanged(next);
    toast({ title: "Gespeichert" });
  }

  async function prioritize() {
    if (!guide) return;
    if (!(guide.ki_instruktionen ?? "").trim()) {
      toast({ title: "KI-Instruktionen fehlen", description: "Bitte oben angeben, was die KI machen soll.", variant: "destructive" });
      return;
    }
    setPrioritizing(true);
    // Erst speichern, damit KI die aktuellen Fragen und Instruktionen sieht.
    await save();
    const { data, error } = await supabase.functions.invoke("prioritize-interview-guide", {
      body: { guide_id: guide.id, ki_instruktionen: guide.ki_instruktionen },
    });
    setPrioritizing(false);
    if (error) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
      return;
    }
    if ((data as any)?.error) {
      toast({ title: "Fehler", description: (data as any).error, variant: "destructive" });
      return;
    }
    const raw = (data as any).guide as any;
    const next: InterviewGuide = {
      ...raw,
      hauptfragen: toQArray(raw.hauptfragen),
      vertiefungsfragen: toQArray(raw.vertiefungsfragen),
      kritische_fragen: toQArray(raw.kritische_fragen),
    };
    setGuide(next);
    onChanged(next);
    const invalids = (data as any).invalid_ids as string[] | undefined;
    toast({
      title: "KI-Vorschlag übernommen",
      description: invalids && invalids.length > 0
        ? `Hinweis: ${invalids.length} ungültige ID(s) wurden ignoriert (siehe Notizen).`
        : "Toggle und Reihenfolge nach Wunsch nachjustieren.",
    });
  }

  async function decision(action: "finalisieren" | "zurueck_entwurf") {
    if (!guide) return;
    setSaving(true);
    await save();
    const { data, error } = await supabase.functions.invoke("interview-guide-decision", {
      body: { guide_id: guide.id, action },
    });
    setSaving(false);
    if (error) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
      return;
    }
    if ((data as any)?.error) {
      toast({ title: "Fehler", description: (data as any).error, variant: "destructive" });
      return;
    }
    const raw = (data as any).guide as any;
    const next: InterviewGuide = {
      ...raw,
      hauptfragen: toQArray(raw.hauptfragen),
      vertiefungsfragen: toQArray(raw.vertiefungsfragen),
      kritische_fragen: toQArray(raw.kritische_fragen),
    };
    setGuide(next);
    onChanged(next);
    toast({
      title: action === "finalisieren" ? "Leitfaden finalisiert" : "Zurück zu Entwurf",
      description: action === "finalisieren"
        ? "Der Speaker sieht den Leitfaden jetzt in seiner Vorbereitungsansicht."
        : "Der Leitfaden ist wieder editierbar.",
    });
  }

  const totals = useMemo(() => {
    if (!guide) return { active: 0, total: 0 };
    const all = [
      ...(guide.hauptfragen ?? []),
      ...(guide.vertiefungsfragen ?? []),
      ...(guide.kritische_fragen ?? []),
    ];
    return { active: all.filter((q) => q.active).length, total: all.length };
  }, [guide]);

  if (!guide) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Leitfaden-Entwurf</CardTitle>
          <CardDescription>Noch kein Entwurf generiert.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={generate} disabled={generating}>
            {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Leitfaden generieren
          </Button>
        </CardContent>
      </Card>
    );
  }

  const patch = (u: Partial<InterviewGuide>) => setGuide({ ...guide, ...u });
  const isFinal = guide.status === "final";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">Leitfaden-Entwurf</CardTitle>
            <CardDescription>
              Status: <Badge variant="outline" className="ml-1">{guide.status}</Badge>
              {guide.model_used && <span className="ml-3 text-xs">Modell: {guide.model_used}</span>}
              {guide.prompt_version != null && <span className="ml-3 text-xs">Prompt v{guide.prompt_version}</span>}
              {guide.generated_at && <span className="ml-3 text-xs">generiert: {new Date(guide.generated_at).toLocaleString("de-DE")}</span>}
            </CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={generate} disabled={generating}>
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="mr-2 h-4 w-4" />Neu generieren</>}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {isFinal && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
            Leitfaden ist finalisiert und für den Speaker sichtbar. Zum Bearbeiten „Zurück zu Entwurf".
          </div>
        )}
        <fieldset disabled={isFinal} className="space-y-5 disabled:opacity-70">
          <div className="space-y-2">
            <Label>Einstieg / Begrüßung</Label>
            <Textarea ref={introRef} rows={3} className="resize-none" value={guide.intro ?? ""} onChange={(e) => patch({ intro: e.target.value })} />
          </div>

          {/* KI-gestützte Priorisierung */}
          <div className="rounded-md border border-primary/30 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-primary" />
              <h4 className="font-medium text-sm">KI-gestützte Priorisierung</h4>
            </div>
            <p className="text-xs text-muted-foreground">
              Der Vorschlag ist ein Startpunkt. Toggle und Reihenfolge kannst du danach frei nachjustieren.
              Nicht ausgewählte Fragen werden auf inaktiv gesetzt, aber nicht gelöscht.
            </p>
            <Textarea
              ref={kiRef}
              rows={3}
              className="resize-none"
              placeholder="Beschreibe, worauf die KI beim Priorisieren/Ergänzen achten soll (z. B. Fokus auf X, wenige Nachfragen zu Y, kritische Frage zu Z ergänzen)…"
              value={guide.ki_instruktionen ?? ""}
              onChange={(e) => patch({ ki_instruktionen: e.target.value })}
            />
            <Button
              type="button"
              size="sm"
              onClick={prioritize}
              disabled={prioritizing || !(guide.ki_instruktionen ?? "").trim()}
            >
              {prioritizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
              KI-Vorschlag anwenden
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <div className="flex items-center gap-3">
                <Switch checked={showOnlyActive} onCheckedChange={setShowOnlyActive} id="only-active" />
                <Label htmlFor="only-active" className="cursor-pointer text-sm">Nur übernommene Fragen anzeigen</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={compact} onCheckedChange={setCompact} id="compact-view" />
                <Label htmlFor="compact-view" className="cursor-pointer text-sm">Kompakte Ansicht</Label>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              {totals.active} / {totals.total} übernommen
            </div>
          </div>

          <QuestionList
            label="Hauptfragen"
            items={guide.hauptfragen ?? []}
            onChange={(v) => patch({ hauptfragen: v })}
            showOnlyActive={showOnlyActive}
            compact={compact}
          />
          <QuestionList
            label="Vertiefungsfragen"
            items={guide.vertiefungsfragen ?? []}
            onChange={(v) => patch({ vertiefungsfragen: v })}
            showOnlyActive={showOnlyActive}
            compact={compact}
          />
          <QuestionList
            label="Kritische Fragen"
            items={guide.kritische_fragen ?? []}
            onChange={(v) => patch({ kritische_fragen: v })}
            showOnlyActive={showOnlyActive}
            compact={compact}
          />

          <div className="space-y-2">
            <Label>Abschluss</Label>
            <Textarea ref={abschlussRef} rows={3} className="resize-none" value={guide.abschluss ?? ""} onChange={(e) => patch({ abschluss: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label>
              Redaktionelle Hinweise
              <span className="ml-2 text-xs text-muted-foreground">(intern — Speaker sieht das NICHT)</span>
            </Label>
            <Textarea ref={hinweiseRef} rows={4} className="resize-none" value={guide.redaktionelle_hinweise ?? ""} onChange={(e) => patch({ redaktionelle_hinweise: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label>Notizen</Label>
            <Textarea ref={notesRef} rows={2} className="resize-none" value={guide.notes ?? ""} onChange={(e) => patch({ notes: e.target.value })} />
          </div>
        </fieldset>

        <div className="flex flex-wrap gap-2 pt-2">
          {!isFinal ? (
            <>
              <Button onClick={() => save()} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Speichern
              </Button>
              <Button variant="outline" onClick={() => decision("finalisieren")} disabled={saving}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Als final markieren
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => decision("zurueck_entwurf")} disabled={saving}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Zurück zu Entwurf
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
