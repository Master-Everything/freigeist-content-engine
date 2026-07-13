import Markdown from "markdown-to-jsx";
import { Children, isValidElement, type ReactNode } from "react";

type Props = { markdown: string };

// Erkennt GFM-Task-Listen-Präfixe (- [ ] / - [x]) im ersten Text-Kind eines <li>
// und ersetzt sie durch eine echte, deaktivierte Checkbox.
function TaskLi({ children, className, ...rest }: any) {
  const kids = Children.toArray(children) as ReactNode[];
  const first = kids[0];
  if (typeof first === "string") {
    const m = /^\s*\[( |x|X)\]\s+/.exec(first);
    if (m) {
      const checked = m[1].toLowerCase() === "x";
      const rest0 = first.slice(m[0].length);
      return (
        <li {...rest} className={`${className ?? ""} list-none flex items-start gap-2`}>
          <input
            type="checkbox"
            disabled
            checked={checked}
            readOnly
            className="mt-1 h-3.5 w-3.5 accent-primary"
          />
          <span>
            {rest0}
            {kids.slice(1) as any}
          </span>
        </li>
      );
    }
  } else if (isValidElement(first)) {
    // markdown-to-jsx wickelt Zeileninhalt manchmal in <span>/<p>; hier nur die
    // einfache Textvariante behandeln — keine Doppelbehandlung sonst.
  }
  return <li {...rest} className={className}>{children}</li>;
}

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
            li: { component: TaskLi, props: { className: "text-sm leading-relaxed" } },
            strong: { props: { className: "font-semibold" } },
            em: { props: { className: "italic" } },
            hr: { props: { className: "my-4 border-border" } },
            code: { props: { className: "px-1 py-0.5 rounded bg-muted text-xs" } },
            table: { props: { className: "w-full text-sm my-4 border-collapse" } },
            th: { props: { className: "text-left font-semibold border-b border-border px-2 py-1" } },
            td: { props: { className: "align-top border-b border-border/60 px-2 py-1" } },
          },
        }}
      >
        {markdown}
      </Markdown>
    </div>
  );
}
