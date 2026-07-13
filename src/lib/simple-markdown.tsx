import { Fragment, type ReactNode } from "react";

/**
 * Minimaler Markdown-Renderer für interne Hinweisfelder.
 * Unterstützt:
 * - `**fett**` inline
 * - Zeilen mit `- ` oder `* ` → Bullet-Liste
 * - Leerzeilen → Absatzwechsel
 *
 * Kein `dangerouslySetInnerHTML`, alles über React (XSS-sicher).
 */
function renderInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<Fragment key={key++}>{text.slice(lastIndex, match.index)}</Fragment>);
    }
    parts.push(<strong key={key++}>{match[1]}</strong>);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(<Fragment key={key++}>{text.slice(lastIndex)}</Fragment>);
  }
  return parts;
}

export function SimpleMarkdown({ text, className }: { text: string; className?: string }) {
  if (!text?.trim()) {
    return <div className={className}><em className="text-muted-foreground">Kein Inhalt.</em></div>;
  }
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let listBuffer: string[] = [];
  let paraBuffer: string[] = [];
  let blockKey = 0;

  const flushList = () => {
    if (listBuffer.length === 0) return;
    blocks.push(
      <ul key={blockKey++} className="list-disc pl-5 space-y-1">
        {listBuffer.map((li, i) => (
          <li key={i}>{renderInline(li)}</li>
        ))}
      </ul>,
    );
    listBuffer = [];
  };
  const flushPara = () => {
    if (paraBuffer.length === 0) return;
    blocks.push(
      <p key={blockKey++} className="whitespace-pre-wrap">
        {renderInline(paraBuffer.join("\n"))}
      </p>,
    );
    paraBuffer = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    if (bullet) {
      flushPara();
      listBuffer.push(bullet[1]);
      continue;
    }
    if (line.trim() === "") {
      flushList();
      flushPara();
      continue;
    }
    flushList();
    paraBuffer.push(line);
  }
  flushList();
  flushPara();

  return <div className={`space-y-2 text-sm leading-relaxed ${className ?? ""}`}>{blocks}</div>;
}
