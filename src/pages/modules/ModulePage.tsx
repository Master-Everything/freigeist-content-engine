import { LucideIcon, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ModulePageProps {
  num: number;
  title: string;
  icon: LucideIcon;
  status?: "active" | "planned";
  description: string;
}

export default function ModulePage({
  num,
  title,
  icon: Icon,
  status = "planned",
  description,
}: ModulePageProps) {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="rounded-lg border bg-card p-3">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground tabular-nums">
              Modul {num}
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight">
              {title}
            </h1>
          </div>
        </div>
        <Badge
          variant="outline"
          className={
            status === "active"
              ? "border-primary/40 text-primary"
              : "text-muted-foreground"
          }
        >
          {status === "active" ? "Aktiv" : "Coming soon"}
        </Badge>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Modulbeschreibung</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-line leading-relaxed text-foreground/90">
            {description}
          </p>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="flex items-start gap-3 py-5">
          <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div className="text-sm text-muted-foreground">
            Die Funktionalität dieses Moduls folgt. Vorlagen und Prompts werden
            bei der Entwicklung dieses Moduls eingebunden und in der zentralen
            Datenbank gespeichert.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
