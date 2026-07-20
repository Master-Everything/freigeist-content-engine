import { cn } from "@/lib/utils";

export function KpiTile({
  label,
  value,
  sub,
  icon: Icon,
  accent = "text-primary",
  onClick,
  isText = false,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: any;
  accent?: string;
  onClick?: () => void;
  isText?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-l-2xl rounded-r-md border bg-card p-4 text-left transition-all",
        "hover:shadow-md hover:border-primary/40"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/70">{label}</div>
        <Icon className={cn("h-4 w-4", accent)} />
      </div>
      <div className={cn(
        "mt-2 font-display font-bold tabular-nums leading-none",
        isText ? "text-lg" : "text-3xl"
      )}>
        {value || "—"}
      </div>
      {sub && <div className="mt-1 truncate text-xs text-muted-foreground">{sub}</div>}
    </button>
  );
}
