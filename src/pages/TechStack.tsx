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
    ],
  },
  {
    title: "Backend (Lovable Cloud)",
    items: [
      { name: "Postgres", desc: "Relational database with RLS" },
      { name: "Auth", desc: "Email/password and social login" },
      { name: "Storage", desc: "File storage buckets" },
      { name: "Edge Functions (Deno)", desc: "Serverless backend logic" },
    ],
  },
  {
    title: "Edge Functions in this project",
    items: [
      { name: "generate-content", desc: "AI block generation via Lovable AI Gateway" },
      { name: "youtube-transcript", desc: "Fetches YouTube video transcripts" },
      { name: "wp-upload", desc: "Uploads images to WordPress via REST API" },
      { name: "wp-upload-ftp", desc: "Uploads images to WordPress via FTP" },
    ],
  },
  {
    title: "AI",
    items: [
      { name: "Lovable AI Gateway", desc: "Access to Gemini and GPT models without separate API keys" },
    ],
  },
  {
    title: "External integrations",
    items: [
      { name: "YouTube", desc: "Transcript fetching" },
      { name: "WordPress", desc: "REST API and FTP media upload" },
    ],
  },
  {
    title: "Utilities",
    items: [
      { name: "src/lib/render-post-html.ts", desc: "Unified Hub-native HTML renderer (Preview + Push)" },
      { name: "src/lib/image-utils.ts", desc: "Client-side WebP conversion and resize" },
    ],
  },
  {
    title: "Tooling",
    items: [
      { name: "ESLint", desc: "Linting" },
      { name: "Vitest", desc: "Unit testing" },
      { name: "Bun", desc: "Package manager / runtime" },
      { name: "lovable-tagger", desc: "Vite plugin for the Lovable editor" },
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
