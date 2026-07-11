import { useMemo, useState } from "react";
import { Loader2, Plus, X, Sparkles, Save, CheckCircle2, MessageSquareWarning } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type SpeakerProfile = {
  id: string;
  post_id: string;
  speaker_id: string;
  status: "entwurf" | "kuratiert" | "freigegeben";
  kurzbio: string | null;
  langbio: string | null;
  positionierung: string | null;
  zielgruppe: string | null;
  themen: string[] | null;
  kernaussagen: string[] | null;
  mediale_hooks: string[] | null;
  kritische_punkte: string[] | null;
  expertise_score: number | null;
  model: string | null;
  prompt_version: number | null;
  generated_at: string | null;
  notes: string | null;
};

function ChipList({
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
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        {items.map((it, i) => (
          <Badge key={i} variant="secondary" className="pl-2 pr-1 py-1 gap-1">
            <span className="text-sm font-normal">{it}</span>
            <button
              type="button"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="rounded hover:bg-muted p-0.5"
              aria-label="Entfernen"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder ?? "Hinzufügen…"}
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

export function ProfilEditor({
  postId,
  speakerId,
  initial,
  postStatus,
  onChanged,
}: {
  postId: string;
  speakerId: string;
  initial: SpeakerProfile | null;
  postStatus?: string | null;
  onChanged: (p: SpeakerProfile | null) => void;
}) {
  const [profile, setProfile] = useState<SpeakerProfile | null>(initial);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  async function generate() {
    setGenerating(true);
    const { data, error } = await supabase.functions.invoke("generate-speaker-profile", {
      body: { post_id: postId, speaker_id: speakerId },
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
    const p = (data as any).profile as SpeakerProfile;
    setProfile(p);
    onChanged(p);
    toast({ title: "Profil-Entwurf generiert" });
  }

  async function save() {
    if (!profile) return;
    setSaving(true);
    const update = {
      kurzbio: profile.kurzbio,
      langbio: profile.langbio,
      positionierung: profile.positionierung,
      zielgruppe: profile.zielgruppe,
      themen: profile.themen ?? [],
      kernaussagen: profile.kernaussagen ?? [],
      mediale_hooks: profile.mediale_hooks ?? [],
      kritische_punkte: profile.kritische_punkte ?? [],
      expertise_score: profile.expertise_score,
      notes: profile.notes,
    };
    const { data, error } = await (supabase as any)
      .from("speaker_profiles")
      .update(update)
      .eq("id", profile.id)
      .select("*")
      .single();
    setSaving(false);
    if (error) {
      toast({ title: "Speichern fehlgeschlagen", description: error.message, variant: "destructive" });
      return;
    }
    setProfile(data as any);
    onChanged(data as any);
    toast({ title: "Gespeichert" });
  }

  async function kuratieren() {
    if (!profile) return;
    setSaving(true);
    // Erst Formularfelder sichern
    await save();
    const { data, error } = await supabase.functions.invoke("speaker-profile-decision", {
      body: { profile_id: profile.id, action: "kuratieren" },
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
    const next = (data as any).profile as SpeakerProfile;
    setProfile(next);
    onChanged(next);
    toast({
      title: "Als kuratiert markiert",
      description: "Der Speaker wurde zur Freigabe eingeladen.",
    });
  }

  if (!profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profil-Entwurf</CardTitle>
          <CardDescription>Noch kein Entwurf generiert.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={generate} disabled={generating}>
            {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Profil generieren
          </Button>
        </CardContent>
      </Card>
    );
  }

  const patch = (u: Partial<SpeakerProfile>) => setProfile({ ...profile, ...u });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">Profil-Entwurf</CardTitle>
            <CardDescription>
              Status: <Badge variant="outline" className="ml-1">{profile.status}</Badge>
              {profile.model && <span className="ml-3 text-xs">Modell: {profile.model}</span>}
              {profile.prompt_version != null && <span className="ml-3 text-xs">Prompt v{profile.prompt_version}</span>}
              {profile.generated_at && <span className="ml-3 text-xs">generiert: {new Date(profile.generated_at).toLocaleString("de-DE")}</span>}
            </CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={generate} disabled={generating}>
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="mr-2 h-4 w-4" />Neu generieren</>}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {profile.status === "freigegeben" && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
            Der Speaker hat dieses Profil freigegeben. Zur Sicherheit ist die Bearbeitung gesperrt – bei Bedarf „Neu generieren".
          </div>
        )}
        <fieldset disabled={profile.status === "freigegeben"} className="space-y-5 disabled:opacity-70">
        <div className="space-y-2">
          <Label>Kurzbio</Label>
          <Textarea rows={3} value={profile.kurzbio ?? ""} onChange={(e) => patch({ kurzbio: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Langbio</Label>
          <Textarea rows={8} value={profile.langbio ?? ""} onChange={(e) => patch({ langbio: e.target.value })} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Positionierung</Label>
            <Textarea rows={3} value={profile.positionierung ?? ""} onChange={(e) => patch({ positionierung: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Zielgruppe</Label>
            <Textarea rows={3} value={profile.zielgruppe ?? ""} onChange={(e) => patch({ zielgruppe: e.target.value })} />
          </div>
        </div>

        <ChipList label="Themen" items={profile.themen ?? []} onChange={(v) => patch({ themen: v })} />
        <ChipList label="Kernaussagen" items={profile.kernaussagen ?? []} onChange={(v) => patch({ kernaussagen: v })} placeholder="Aussage…" />
        <ChipList label="Mediale Hooks" items={profile.mediale_hooks ?? []} onChange={(v) => patch({ mediale_hooks: v })} />
        <ChipList label="Kritische Punkte" items={profile.kritische_punkte ?? []} onChange={(v) => patch({ kritische_punkte: v })} />

        <div className="space-y-2">
          <Label>Expertise-Score: <span className="font-mono">{profile.expertise_score ?? "—"}</span> / 10</Label>
          <Slider
            min={1} max={10} step={1}
            value={[profile.expertise_score ?? 5]}
            onValueChange={(v) => patch({ expertise_score: v[0] })}
          />
        </div>

        <div className="space-y-2">
          <Label>Notizen</Label>
          <Textarea rows={3} value={profile.notes ?? ""} onChange={(e) => patch({ notes: e.target.value })} />
        </div>
        </fieldset>

        {profile.status !== "freigegeben" && (
          <div className="flex flex-wrap gap-2 pt-2">
            <Button onClick={() => save()} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Speichern
            </Button>
            {profile.status !== "kuratiert" && (
              <Button variant="outline" onClick={kuratieren} disabled={saving}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Als kuratiert markieren
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
