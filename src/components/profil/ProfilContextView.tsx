import { Badge } from "@/components/ui/badge";
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

/**
 * Rein lesende Profil-Anzeige für Kontext-Sheets (M4–M6).
 * Keine Freigabe-Aktionen — dafür siehe ProfilReadonly (Modul 3).
 */
export function ProfilContextView({
  profile,
  role,
}: {
  profile: SpeakerProfile;
  role: "admin" | "speaker";
}) {
  return (
    <div className="space-y-6">
      <Field label="Kurzbio" value={profile.kurzbio} />
      <Field label="Langbio" value={profile.langbio} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Positionierung" value={profile.positionierung} />
        <Field label="Zielgruppe" value={profile.zielgruppe} />
      </div>
      <ChipRow label="Themen" items={profile.themen} />
      <ChipRow label="Kernaussagen" items={profile.kernaussagen} />
      <ChipRow label="Mediale Hooks" items={profile.mediale_hooks} />
      {role === "admin" && (
        <ChipRow label="Kritische Punkte" items={profile.kritische_punkte} />
      )}
      {profile.expertise_score != null && (
        <div className="text-sm">
          <span className="text-muted-foreground">Expertise-Score: </span>
          <span className="font-mono">{profile.expertise_score} / 10</span>
        </div>
      )}
    </div>
  );
}
