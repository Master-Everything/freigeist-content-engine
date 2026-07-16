import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Copy } from "lucide-react";
import { toast } from "sonner";

type Item = { name: string; desc: string };
type Section = { title: string; items: Item[] };

const SECTIONS: Section[] = [
  {
    title: "Frontend",
    items: [
      { name: "React 18", desc: "UI library" },
      { name: "TypeScript 5", desc: "Static typing" },
      { name: "Vite 5", desc: "Dev server & bundler" },
    ],
  },
  {
    title: "Styling & UI",
    items: [
      { name: "Tailwind CSS v3", desc: "Utility-first CSS, semantic tokens via index.css" },
      { name: "shadcn/ui", desc: "Component library on top of Radix primitives" },
      { name: "lucide-react", desc: "Icon set" },
      { name: "next-themes", desc: "Light/dark theme switching" },
    ],
  },
  {
    title: "Routing & State",
    items: [
      { name: "React Router", desc: "Client-side routing" },
      { name: "TanStack Query", desc: "Server-state caching" },
      { name: "React Hook Form + Zod", desc: "Forms and schema validation" },
      { name: "sonner", desc: "Toast-Benachrichtigungen" },
    ],
  },
  {
    title: "Backend (Lovable Cloud)",
    items: [
      { name: "Postgres", desc: "Relational database with RLS" },
      { name: "Auth", desc: "Email/Passwort + Rollen (admin/speaker) via separater user_roles-Tabelle und has_role-Security-Definer" },
      { name: "Storage", desc: "File storage buckets (post-images, speaker-avatars)" },
      { name: "Edge Functions (Deno)", desc: "Serverless backend logic" },
    ],
  },
  {
    title: "Edge Functions in this project",
    items: [
      { name: "assign-speaker-owner", desc: "Speaker per E-Mail einem User zuordnen" },
      { name: "generate-content", desc: "Block-Generierung via Lovable AI Gateway mit Kontext-Injektion (Compliance, verbotene Wörter, Profil, Leitfaden)" },
      { name: "generate-interview-guide", desc: "AI-Leitfaden für Modul 4" },
      { name: "generate-speaker-profile", desc: "AI-Profil für Modul 3" },
      { name: "interview-guide-decision", desc: "Freigabe/Änderungswunsch Leitfaden" },
      { name: "interview-scan", desc: "Vorab-Scan Interview-Text via Gemini" },
      { name: "prioritize-interview-guide", desc: "Fragen-Priorisierung im Leitfaden" },
      { name: "push-to-hub", desc: "Sendet fertige Interview-Posts an den Freigeist Content-Hub" },
      { name: "recording-decision", desc: "Freigabe Aufzeichnung (Modul 6)" },
      { name: "speaker-profile-decision", desc: "Freigabe/Änderungswunsch Sprecher-Profil" },
      { name: "vorab-scan", desc: "Compliance-Vorab-Scan von Sprecher-Profilen via Gemini" },
      { name: "vorgespraech-decision", desc: "Freigabe Vorgespräch (Modul 5)" },
      { name: "youtube-transcript", desc: "Fetches YouTube video transcripts" },
    ],
  },
  {
    title: "AI",
    items: [
      { name: "Lovable AI Gateway", desc: "Zugriff auf Gemini und GPT-Modelle ohne separate API-Keys" },
    ],
  },
  {
    title: "External integrations",
    items: [
      { name: "YouTube", desc: "Transcript fetching" },
      { name: "Freigeist Content-Hub", desc: "REST-Ingest fertiger Interview-Beiträge" },
    ],
  },
  {
    title: "Kernkonzepte",
    items: [
      { name: "Rollenmodell", desc: "Hybrid Admin/Speaker, ProtectedRoute mit requiredRole-Gate" },
      { name: "ContextSheet", desc: "Non-modales Slide-in für Profil/Interview/Scans/Fragen in M4–M7" },
      { name: "AI-Kontext-Injektion", desc: "generate-content mergt Compliance-Regeln, verbotene Wörter, freigegebene Profile und finale Leitfäden in den Prompt" },
      { name: "Storage-Ownership", desc: "can_write_post-Helper (Admin/Ersteller/zugeordneter Speaker) für post-images-Writes" },
    ],
  },
  {
    title: "Utilities",
    items: [
      { name: "src/lib/render-post-html.ts", desc: "Unified Hub-native HTML renderer (Preview + Push)" },
      { name: "src/lib/image-utils.ts", desc: "Client-seitige WebP-Konvertierung und Resize" },
      { name: "src/lib/post-status.ts", desc: "Zentrale Status-Definition und Rollen-Locking" },
      { name: "src/lib/field-labels.ts", desc: "DB-Feldkeys → deutsche Labels für Scan-Findings" },
      { name: "src/lib/simple-markdown.tsx", desc: "Markdown-Renderer für redaktionelle Hinweise" },
      { name: "src/lib/relative-time.ts", desc: "Relative Zeitangaben (de)" },
      { name: "src/lib/validation/interview-schema.ts", desc: "Zod-Schema für Interview-Formular" },
      { name: "src/lib/validation/speaker-schema.ts", desc: "Zod-Schema für Sprecher-Profil" },
    ],
  },

];

function buildMarkdown(): string {
  const lines: string[] = ["# Tech Stack", ""];
  for (const s of SECTIONS) {
    lines.push(`## ${s.title}`, "");
    for (const i of s.items) {
      lines.push(`- **${i.name}** — ${i.desc}`);
    }
    lines.push("");
  }
  return lines.join("\n").trim() + "\n";
}

export default function TechStack() {
  const navigate = useNavigate();

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(buildMarkdown());
      toast.success("Markdown in Zwischenablage kopiert");
    } catch {
      toast.error("Kopieren fehlgeschlagen");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="mb-2 -ml-2 gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Zurück
            </Button>
            <h1 className="font-display text-3xl font-bold tracking-tight">Tech Stack</h1>
            <p className="mt-1 text-muted-foreground">
              Übersicht der in diesem Projekt verwendeten Technologien
            </p>
          </div>
          <Button onClick={handleCopy} className="gap-2">
            <Copy className="h-4 w-4" />
            Copy as Markdown
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {SECTIONS.map((section) => (
            <Card key={section.title}>
              <CardHeader>
                <CardTitle className="text-lg">{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {section.items.map((item) => (
                    <li key={item.name} className="text-sm">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-muted-foreground"> — {item.desc}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
