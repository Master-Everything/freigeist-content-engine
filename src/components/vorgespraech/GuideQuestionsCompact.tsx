import { Badge } from "@/components/ui/badge";
import type { GuideQuestion } from "@/components/leitfaden/LeitfadenEditor";

type Props = {
  hauptfragen?: GuideQuestion[] | null;
  vertiefungsfragen?: GuideQuestion[] | null;
  kritische_fragen?: GuideQuestion[] | null;
};

function Block({ title, items }: { title: string; items?: GuideQuestion[] | null }) {
  const active = (items ?? []).filter((q) => q.active);
  if (active.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </div>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
          {active.length}
        </Badge>
      </div>
      <ol className="space-y-1 text-sm">
        {active.map((q, i) => (
          <li key={q.id} className="flex gap-2">
            <span className="tabular-nums text-muted-foreground w-6 shrink-0">{i + 1}.</span>
            <span className="flex-1">{q.text}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function GuideQuestionsCompact(p: Props) {
  const empty =
    (p.hauptfragen ?? []).length === 0 &&
    (p.vertiefungsfragen ?? []).length === 0 &&
    (p.kritische_fragen ?? []).length === 0;
  if (empty) {
    return (
      <div className="text-sm text-muted-foreground italic">
        Noch kein Leitfaden vorhanden.
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <Block title="Hauptfragen" items={p.hauptfragen} />
      <Block title="Vertiefungsfragen" items={p.vertiefungsfragen} />
      <Block title="Kritische Fragen" items={p.kritische_fragen} />
    </div>
  );
}
