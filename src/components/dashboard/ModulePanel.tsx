import { ChevronDown, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export type Tone = "green" | "yellow" | "red" | "muted";

const toneChip: Record<Tone, string> = {
  green: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  yellow: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  red: "border-destructive/40 bg-destructive/10 text-destructive",
  muted: "border-border bg-muted text-muted-foreground",
};

export interface DetailItem {
  id: string;
  title: string;
  sub?: string;
  tone?: Tone;
  onClick?: () => void;
}

export interface ModulePanelMeta {
  num: number;
  title: string;
  icon: any;
  accent: string;
}

export function ModulePanel({
  meta,
  bigNumber,
  chips,
  details,
  footer,
  onOpen,
  onShowAll,
  totalCount,
  loading,
  open,
  onOpenChange,
}: {
  meta: ModulePanelMeta;
  bigNumber: number;
  chips: { label: string; value: number; tone: Tone }[];
  details: DetailItem[];
  footer?: React.ReactNode;
  onOpen: () => void;
  onShowAll: () => void;
  totalCount: number;
  loading: boolean;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const Icon = meta.icon;

  return (
    <div className={cn(
      "group relative flex flex-col overflow-hidden rounded-l-[2rem] rounded-r-md border bg-card transition-all",
      "hover:shadow-lg hover:border-primary/30"
    )}>
      <div className={cn("absolute inset-y-0 left-0 w-1.5", meta.accent)} />

      <div className="pl-5 pr-4 pt-4 pb-3">
        <button onClick={onOpen} className="flex w-full items-start justify-between gap-2 text-left">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-foreground/80">
              <span className="tabular-nums">0{meta.num}</span>
              <span>·</span>
              <span>{meta.title}</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-4xl font-bold tabular-nums leading-none">
                {loading ? "—" : bigNumber}
              </span>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </button>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <span
              key={c.label}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                toneChip[c.tone]
              )}
            >
              <span className="tabular-nums">{c.value}</span> {c.label}
            </span>
          ))}
        </div>

        {footer && <div className="mt-2">{footer}</div>}
      </div>

      <Collapsible open={open} onOpenChange={onOpenChange}>
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-center justify-between border-t bg-muted/30 px-5 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted/50">
            <span className="inline-flex items-center gap-1">
              {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              Details
            </span>
            {totalCount > 0 && (
              <span
                role="button"
                tabIndex={0}
                className="text-[10px] uppercase tracking-wider hover:text-foreground"
                onClick={(e) => { e.stopPropagation(); onShowAll(); }}
              >
                Alle {totalCount} ›
              </span>
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="max-h-72 overflow-y-auto divide-y">
            {details.length === 0 ? (
              <div className="px-5 py-4 text-xs text-muted-foreground">Nichts anstehend</div>
            ) : (
              details.map((d) => (
                <button
                  key={d.id}
                  onClick={d.onClick}
                  className="flex w-full items-center justify-between gap-2 px-5 py-2 text-left text-xs transition-colors hover:bg-muted/40"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{d.title}</div>
                    {d.sub && <div className="truncate text-[10px] text-muted-foreground">{d.sub}</div>}
                  </div>
                  {d.tone && (
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", {
                      "bg-emerald-500": d.tone === "green",
                      "bg-amber-500": d.tone === "yellow",
                      "bg-destructive": d.tone === "red",
                      "bg-muted-foreground/40": d.tone === "muted",
                    })} />
                  )}
                </button>
              ))
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
