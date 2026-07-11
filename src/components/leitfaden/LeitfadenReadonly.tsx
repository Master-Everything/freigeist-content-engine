import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";
import type { InterviewGuide } from "./LeitfadenEditor";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function QuestionOl({ items }: { items: string[] | null }) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-muted-foreground italic">— keine Angaben —</p>;
  }
  return (
    <ol className="space-y-2 list-decimal list-outside pl-5">
      {items.map((q, i) => (
        <li key={i} className="text-sm leading-relaxed">{q}</li>
      ))}
    </ol>
  );
}

export function LeitfadenReadonly({ guide }: { guide: InterviewGuide }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Dein Interview-Leitfaden
            </CardTitle>
            <CardDescription>
              Zur Vorbereitung auf dein Vorgespräch und die Aufzeichnung.
            </CardDescription>
          </div>
          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
            Freigegeben
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {guide.intro && (
          <Section title="Einstieg">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{guide.intro}</p>
          </Section>
        )}

        <Section title="Hauptfragen">
          <QuestionOl items={guide.hauptfragen} />
        </Section>

        <Section title="Vertiefungsfragen">
          <QuestionOl items={guide.vertiefungsfragen} />
        </Section>

        <Section title="Kritische Fragen">
          <p className="text-xs text-muted-foreground">
            Diese Fragen dürften im Interview vorkommen. Bereite dich in Ruhe darauf vor.
          </p>
          <QuestionOl items={guide.kritische_fragen} />
        </Section>

        {guide.abschluss && (
          <Section title="Abschluss">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{guide.abschluss}</p>
          </Section>
        )}
      </CardContent>
    </Card>
  );
}
