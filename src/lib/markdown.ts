/**
 * Simple Markdown-to-HTML converter for section bodies.
 * Supports: ## H3, ### H4, **bold**, - list items, paragraphs via double newline.
 */
export function markdownToHtml(md: string): string {
  if (!md) return "";

  // Normalize escaped newlines from AI JSON output
  md = md.replace(/\\n/g, "\n");

  const blocks: string[] = [];
  let listBuffer: string[] = [];

  function flushList() {
    if (listBuffer.length > 0) {
      blocks.push(`<ul>${listBuffer.map((li) => `<li style="line-height:1.8">${inlineFormat(li)}</li>`).join("")}</ul>`);
      listBuffer = [];
    }
  }

  const lines = md.split("\n");

  for (const raw of lines) {
    const line = raw.trimEnd();

    // Blank line → flush
    if (line.trim() === "") {
      flushList();
      continue;
    }

    // List item
    if (/^[-*]\s+/.test(line)) {
      listBuffer.push(line.replace(/^[-*]\s+/, ""));
      continue;
    }

    flushList();

    // ### → h4 (because section title is already h2, ## maps to h3)
    if (/^###\s+/.test(line)) {
      blocks.push(`<h4 style="font-size:18px;font-weight:700;margin-top:1em;margin-bottom:0.5em">${inlineFormat(line.replace(/^###\s+/, ""))}</h4>`);
      continue;
    }

    // ## → h3
    if (/^##\s+/.test(line)) {
      blocks.push(`<h3 style="font-size:20px;font-weight:700;margin-top:1.5em;margin-bottom:0.75em">${inlineFormat(line.replace(/^##\s+/, ""))}</h3>`);
      continue;
    }

    // Regular paragraph line
    blocks.push(`<p>${inlineFormat(line)}</p>`);
  }

  flushList();
  return blocks.join("\n");
}

function inlineFormat(text: string): string {
  return esc(text).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Renders markdown text to React-safe HTML for dangerouslySetInnerHTML.
 */
export function markdownToReactHtml(md: string): string {
  return markdownToHtml(md);
}
