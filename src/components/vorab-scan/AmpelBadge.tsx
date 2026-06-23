import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, XCircle, Loader2 } from "lucide-react";

export type Verdict = "green" | "yellow" | "red" | null;

const map = {
  green: {
    label: "Freigegeben",
    icon: CheckCircle2,
    cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  yellow: {
    label: "Mit Hinweisen",
    icon: AlertTriangle,
    cls: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  red: {
    label: "Überarbeitung nötig",
    icon: XCircle,
    cls: "border-destructive/40 bg-destructive/10 text-destructive",
  },
};

export function AmpelBadge({
  verdict,
  size = "sm",
  showLabel = true,
}: {
  verdict: Verdict;
  size?: "sm" | "lg";
  showLabel?: boolean;
}) {
  if (!verdict) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        {showLabel && "läuft"}
      </span>
    );
  }
  const v = map[verdict];
  const Icon = v.icon;
  const padding = size === "lg" ? "px-4 py-2 text-sm" : "px-2.5 py-1 text-xs";
  const iconSize = size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        padding,
        v.cls,
      )}
    >
      <Icon className={iconSize} />
      {showLabel && v.label}
    </span>
  );
}
