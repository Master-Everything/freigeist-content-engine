import { useState } from "react";
import { Loader2, Plus, X, Sparkles, Save, CheckCircle2, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type InterviewGuide = {
  id: string;
  post_id: string;
  speaker_id: string | null;
  speaker_profile_id: string | null;
  status: "entwurf" | "final";
  intro: string | null;
  hauptfragen: string[] | null;
  vertiefungsfragen: string[] | null;
  kritische_fragen: string[] | null;
  abschluss: string | null;
  redaktionelle_hinweise: string | null;
  notes: string | null;
  model_used: string | null;
  prompt_version: number | null;
  generated_at: string | null;
};

function QuestionList({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  items: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");
  return (
    <div className="space-y-2">
      <Label>{label} <span className="text-xs text-muted-foreground">({items.length})</span></Label>
      <div className="space-y-2">
        {items.map((q, i) => (
          <div key={i} className="flex gap-2 items-start">
            <span className="mt-2 text-xs font-mono text-muted-foreground w-6 shrink-0 text-right">{i + 1}.</span>
            <Textarea
              rows={2}
              value={q}
              onChange={(e) => {
                const next = [...items];
                next[i] = e.target.value;
                onChange(next);
              }}
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              aria-label="Entfernen"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder ?? "Frage hinzufügen…"}
          onKeyDown={(e) => {
            if (e.key === "Enter" && draft.trim()) {
              e.preventDefault();
              onChange([...items, draft.trim()]);
              setDraft("");
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => {
            if (draft.trim()) {
              onChange([...items, draft.trim()]);
              setDraft("");
            }
          }}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
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
  const [guide, setGuide] = useState<InterviewGuide | null>(initial);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

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
    const g = (data as any).guide as InterviewGuide;
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
    setGuide(data as any);
    onChanged(data as any);
    toast({ title: "Gespeichert" });
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
    const next = (data as any).guide as InterviewGuide;
    setGuide(next);
    onChanged(next);
    toast({
      title: action === "finalisieren" ? "Leitfaden finalisiert" : "Zurück zu Entwurf",
      description: action === "finalisieren" ? "Der Speaker sieht den Leitfaden jetzt in seiner Vorbereitungsansicht." : "Der Leitfaden ist wieder editierbar.",
    });
  }

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
            <Textarea rows={3} value={guide.intro ?? ""} onChange={(e) => patch({ intro: e.target.value })} />
          </div>

          <QuestionList label="Hauptfragen" items={guide.hauptfragen ?? []} onChange={(v) => patch({ hauptfragen: v })} />
          <QuestionList label="Vertiefungsfragen" items={guide.vertiefungsfragen ?? []} onChange={(v) => patch({ vertiefungsfragen: v })} />
          <QuestionList label="Kritische Fragen" items={guide.kritische_fragen ?? []} onChange={(v) => patch({ kritische_fragen: v })} />

          <div className="space-y-2">
            <Label>Abschluss</Label>
            <Textarea rows={3} value={guide.abschluss ?? ""} onChange={(e) => patch({ abschluss: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label>
              Redaktionelle Hinweise
              <span className="ml-2 text-xs text-muted-foreground">(intern — Speaker sieht das NICHT)</span>
            </Label>
            <Textarea rows={4} value={guide.redaktionelle_hinweise ?? ""} onChange={(e) => patch({ redaktionelle_hinweise: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label>Notizen</Label>
            <Textarea rows={2} value={guide.notes ?? ""} onChange={(e) => patch({ notes: e.target.value })} />
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
