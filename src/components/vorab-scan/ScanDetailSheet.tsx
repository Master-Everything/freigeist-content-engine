import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScanFindingsList, type Finding } from "./ScanFindingsList";
import { AmpelBadge, type Verdict } from "./AmpelBadge";

type Scan = {
  id: string;
  verdict: Verdict;
  score: number | null;
  summary: string | null;
  findings: Finding[];
  created_at: string;
  model_used: string | null;
  status: string;
  error_text: string | null;
};

export function ScanDetailSheet({
  scan,
  open,
  onOpenChange,
}: {
  scan: Scan | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        {scan && (
          <>
            <SheetHeader className="space-y-3">
              <div className="flex items-center gap-3">
                <AmpelBadge verdict={scan.verdict} size="lg" />
                {scan.score !== null && (
                  <span className="text-sm text-muted-foreground tabular-nums">
                    Score: {scan.score}/100
                  </span>
                )}
              </div>
              <SheetTitle>Scan-Details</SheetTitle>
              <SheetDescription className="text-xs">
                {new Date(scan.created_at).toLocaleString("de-DE")}
                {scan.model_used && ` · ${scan.model_used}`}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {scan.status === "error" && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                  Fehler beim Scan: {scan.error_text}
                </div>
              )}
              {scan.summary && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Zusammenfassung</h3>
                  <p className="text-sm text-foreground/90 whitespace-pre-line">
                    {scan.summary}
                  </p>
                </div>
              )}
              <div>
                <h3 className="text-sm font-semibold mb-3">
                  Findings ({scan.findings.length})
                </h3>
                <ScanFindingsList findings={scan.findings} />
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
