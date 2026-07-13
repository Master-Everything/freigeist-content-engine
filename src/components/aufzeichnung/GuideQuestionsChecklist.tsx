import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { GuideQuestion } from "@/components/leitfaden/LeitfadenEditor";

export type OrderedQuestion = GuideQuestion & { block: "haupt" | "vertiefung" | "kritisch" };

const BLOCK_LABEL: Record<OrderedQuestion["block"], string> = {
  haupt: "Hauptfrage",
  vertiefung: "Vertiefung",
  kritisch: "Kritisch",
};

const BLOCK_TONE: Record<OrderedQuestion["block"], string> = {
  haupt: "bg-primary/10 text-primary border-primary/30",
  vertiefung: "bg-muted text-muted-foreground",
  kritisch: "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-100 dark:border-amber-900/60",
};

export function collectOrderedQuestions(guide: any): OrderedQuestion[] {
  if (!guide) return [];
  const pull = (arr: GuideQuestion[] | null | undefined, block: OrderedQuestion["block"]) =>
    (arr ?? []).filter((q) => q.active).map<OrderedQuestion>((q) => ({ ...q, block }));
  return [
    ...pull(guide.hauptfragen, "haupt"),
    ...pull(guide.vertiefungsfragen, "vertiefung"),
    ...pull(guide.kritische_fragen, "kritisch"),
  ];
}

type Props = {
  questions: OrderedQuestion[];
  askedIds: string[];
  readOnly?: boolean;
  onToggle?: (id: string, asked: boolean) => void;
  showNotes?: boolean;
};

export function GuideQuestionsChecklist({
  questions, askedIds, readOnly, onToggle, showNotes,
}: Props) {
  if (questions.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic">
        Kein Leitfaden verfügbar oder keine aktiven Fragen.
      </div>
    );
  }
  const askedSet = new Set(askedIds);
  return (
    <ol className="space-y-1.5">
      {questions.map((q, i) => {
        const asked = askedSet.has(q.id);
        return (
          <li
            key={q.id}
            className={`flex items-start gap-3 rounded-md border p-2.5 transition-colors ${
              asked ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60" : "bg-card"
            }`}
          >
            <Checkbox
              checked={asked}
              disabled={readOnly}
              onCheckedChange={(v) => onToggle?.(q.id, !!v)}
              className="mt-0.5"
            />
            <span className="tabular-nums text-xs text-muted-foreground w-6 shrink-0 mt-0.5">
              {i + 1}.
            </span>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-start gap-2">
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 h-4 shrink-0 ${BLOCK_TONE[q.block]}`}
                >
                  {BLOCK_LABEL[q.block]}
                </Badge>
                <span className={`text-sm ${asked ? "text-muted-foreground" : ""}`}>{q.text}</span>
              </div>
              {showNotes && q.interviewer_notiz && (
                <div className="rounded-sm border border-amber-300 bg-amber-50 px-2 py-1 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
                  <span className="font-semibold">Notiz: </span>{q.interviewer_notiz}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
