import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type Finding = {
  kind: "banned_word" | "compliance" | "hint";
  severity: "info" | "warn" | "high" | "critical";
  field: string;
  excerpt: string;
  rule_code?: string;
  message: string;
  suggestion?: string;
};

const sevOrder: Finding["severity"][] = ["critical", "high", "warn", "info"];
const sevLabel: Record<Finding["severity"], string> = {
  critical: "Kritisch",
  high: "Hoch",
  warn: "Hinweis",
  info: "Info",
};
const sevCls: Record<Finding["severity"], string> = {
  critical: "border-destructive/40 text-destructive bg-destructive/10",
  high: "border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10",
  warn: "border-yellow-500/40 text-yellow-600 dark:text-yellow-400 bg-yellow-500/10",
  info: "border-border text-muted-foreground bg-muted",
};

export function ScanFindingsList({ findings }: { findings: Finding[] }) {
  if (!findings.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Keine Auffälligkeiten gefunden – sauberes Profil.
      </p>
    );
  }
  const sorted = [...findings].sort(
    (a, b) => sevOrder.indexOf(a.severity) - sevOrder.indexOf(b.severity),
  );
  return (
    <div className="space-y-3">
      {sorted.map((f, i) => (
        <div
          key={i}
          className="rounded-lg border border-border bg-card p-4 space-y-2"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={cn("text-xs", sevCls[f.severity])}>
              {sevLabel[f.severity]}
            </Badge>
            <span className="text-xs font-mono text-muted-foreground">
              {f.field}
            </span>
            {f.rule_code && (
              <Badge variant="outline" className="text-xs font-mono">
                {f.rule_code}
              </Badge>
            )}
            {f.kind === "banned_word" && (
              <Badge variant="outline" className="text-xs">
                BannedWord
              </Badge>
            )}
          </div>
          <p className="text-sm">{f.message}</p>
          {f.excerpt && (
            <blockquote className="text-xs text-muted-foreground border-l-2 border-border pl-3 italic">
              „{f.excerpt}"
            </blockquote>
          )}
          {f.suggestion && (
            <p className="text-sm text-foreground/80">
              <span className="font-medium">Vorschlag:</span> {f.suggestion}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
