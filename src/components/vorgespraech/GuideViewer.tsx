import Markdown from "markdown-to-jsx";

type Props = { markdown: string };

// Renders the Medientraining guide from knowledge_guides.body_md with sensible
// Tailwind-styled overrides. Wraps content in a scrollable container.
export function GuideViewer({ markdown }: Props) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <Markdown
        options={{
          overrides: {
            h1: { props: { className: "text-2xl font-bold mt-0 mb-3" } },
            h2: { props: { className: "text-xl font-semibold mt-6 mb-2" } },
            h3: { props: { className: "text-base font-semibold mt-4 mb-1.5" } },
            p:  { props: { className: "text-sm leading-relaxed my-2" } },
            ul: { props: { className: "list-disc pl-5 my-2 space-y-1 text-sm" } },
            ol: { props: { className: "list-decimal pl-5 my-2 space-y-1 text-sm" } },
            li: { props: { className: "text-sm leading-relaxed" } },
            strong: { props: { className: "font-semibold" } },
            em: { props: { className: "italic" } },
            hr: { props: { className: "my-4 border-border" } },
            code: { props: { className: "px-1 py-0.5 rounded bg-muted text-xs" } },
          },
        }}
      >
        {markdown}
      </Markdown>
    </div>
  );
}
