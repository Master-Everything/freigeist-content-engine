// Ported copy of src/lib/export-html.ts + src/lib/markdown.ts for Deno edge runtime.
// KEEP IN SYNC with the client versions — visual output must match Modul 7 (WordPress-Export).

export interface PostBlocks {
  excerpt?: string;
  main_video_url?: string;
  summary_box_title?: string;
  summary_lead?: string;
  summary_paragraphs?: string[];
  summary_points?: string[];
  guest_short_bio?: string;
  guest_image_url?: string;
  guest_website_cta?: string;
  section_1_title?: string; section_1_body?: string;
  section_2_title?: string; section_2_body?: string;
  section_3_title?: string; section_3_body?: string;
  section_4_title?: string; section_4_body?: string;
  section_5_title?: string; section_5_body?: string;
  section_6_title?: string; section_6_body?: string;
  additional_video_embed?: string;
  pretty_link_shortcode?: string;
  resource_links?: string;
  resource_notes?: string;
  cta_affiliate_url?: string;
  cta_affiliate_label?: string;
  top_image_url?: string; top_image_link?: string; top_image_alt?: string;
  mid_image_url?: string; mid_image_link?: string; mid_image_alt?: string;
  end_image_url?: string; end_image_link?: string; end_image_alt?: string;
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
  return match?.[1] || null;
}

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderInlineBold(text: string): string {
  return esc(text).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function inlineFormat(text: string): string {
  return esc(text).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

export function markdownToHtml(md: string): string {
  if (!md) return "";
  md = md.replace(/\\n/g, "\n");
  const blocks: string[] = [];
  let listBuffer: string[] = [];
  const flushList = () => {
    if (listBuffer.length > 0) {
      blocks.push(`<ul style="list-style:disc;padding-left:1.25em;margin-bottom:1em">${listBuffer.map((li) => `<li style="font-size:16px;line-height:1.8">${inlineFormat(li)}</li>`).join("")}</ul>`);
      listBuffer = [];
    }
  };
  for (const raw of md.split("\n")) {
    const line = raw.trimEnd();
    if (line.trim() === "") { flushList(); continue; }
    if (/^[-*]\s+/.test(line)) { listBuffer.push(line.replace(/^[-*]\s+/, "")); continue; }
    flushList();
    if (/^###\s+/.test(line)) {
      blocks.push(`<h4 style="font-size:18px;font-weight:600;margin-top:1em;margin-bottom:0.5em">${inlineFormat(line.replace(/^###\s+/, ""))}</h4>`);
      continue;
    }
    if (/^##\s+/.test(line)) {
      blocks.push(`<h3 style="font-size:20px;font-weight:700;margin-top:1.5em;margin-bottom:0.75em">${inlineFormat(line.replace(/^##\s+/, ""))}</h3>`);
      continue;
    }
    blocks.push(`<p style="font-size:16px;line-height:1.8;margin-bottom:1em">${inlineFormat(line)}</p>`);
  }
  flushList();
  return blocks.join("\n");
}

export function generateHTML(blocks: PostBlocks, guestName: string, postTitle: string): string {
  const lines: string[] = [];

  lines.push(`<style>`);
  lines.push(`.cta-button { transition: all 0.3s ease; }`);
  lines.push(`.cta-button:hover { background: linear-gradient(to right, #35A89E, #2A809B) !important; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); transform: scale(1.05); }`);
  lines.push(`</style>`);
  lines.push("");

  lines.push(`<h1>${esc(postTitle)}</h1>`);
  lines.push("");

  if (blocks.excerpt) {
    lines.push(`<p class="freigeist-excerpt">${esc(blocks.excerpt)}</p>`);
    lines.push("");
  }

  const mainId = extractYouTubeId(blocks.main_video_url || "");
  if (mainId) {
    lines.push(`<div class="freigeist-video">`);
    lines.push(`  <iframe width="100%" height="400" src="https://www.youtube.com/embed/${mainId}" frameborder="0" allowfullscreen></iframe>`);
    lines.push(`</div>`);
    lines.push("");
  }

  const summaryParagraphs = blocks.summary_paragraphs?.length ? blocks.summary_paragraphs : (blocks.summary_points || []);
  if (blocks.summary_box_title || summaryParagraphs.length > 0) {
    if (blocks.summary_box_title) {
      lines.push(`<h2 style="font-size:1.5em;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:1em">${esc(blocks.summary_box_title)}</h2>`);
    }
    lines.push(`<details class="freigeist-summary-box" style="border:1px solid #e5e7eb;border-radius:12px;padding:1.5em">`);
    lines.push(`  <summary style="cursor:pointer;list-style:none;font-weight:600;display:flex;align-items:center;gap:0.75em"><span style="font-size:1.2em;font-weight:700">+</span> ${esc(blocks.summary_lead || "Zusammenfassung")}</summary>`);
    for (const para of summaryParagraphs) {
      if (para) lines.push(`  <p style="margin-top:1em;line-height:1.7">${renderInlineBold(para)}</p>`);
    }
    lines.push(`</details>`);
    lines.push("");
  }

  if (blocks.guest_short_bio) {
    lines.push(`<h2 style="text-align:center;font-size:44px;font-weight:900;font-family:&quot;Roboto Condensed&quot;,sans-serif;color:#2A809B;margin-bottom:1.5em">Entdecke mehr über ${esc(guestName)} und seine inspirierenden Projekte</h2>`);
    lines.push(`<div class="freigeist-guest-profile" style="display:grid;grid-template-columns:2fr 3fr;gap:1.5em;align-items:start;background:#f5f5f5;border-radius:12px;padding:1.5em">`);
    if (blocks.guest_image_url) {
      lines.push(`  <img src="${esc(blocks.guest_image_url)}" alt="${esc(guestName)}" style="width:100%;border-radius:8px;object-fit:cover;aspect-ratio:1/1" />`);
    }
    lines.push(`  <div class="freigeist-guest-bio">`);
    lines.push(`    <h2 style="font-size:1.5em;font-weight:700;margin-bottom:0.75em">${esc(guestName)}</h2>`);
    lines.push(`    <p style="text-align:justify;font-size:16px;line-height:1.7">${esc(blocks.guest_short_bio)}</p>`);
    lines.push(`  </div>`);
    lines.push(`</div>`);
    lines.push("");
  }

  if (blocks.top_image_url) {
    const imgTag = `<img src="${esc(blocks.top_image_url)}" alt="${esc(blocks.top_image_alt || "")}" style="width:100%;border-radius:12px" />`;
    if (blocks.top_image_link) {
      lines.push(`<div style="margin:2em 0"><a href="${esc(blocks.top_image_link)}" target="_blank" rel="noopener noreferrer">${imgTag}</a></div>`);
    } else {
      lines.push(`<div style="margin:2em 0">${imgTag}</div>`);
    }
    lines.push("");
  }

  if (blocks.guest_website_cta) {
    lines.push(`<div class="freigeist-cta" style="text-align:center;margin:2em 0">`);
    lines.push(`  <a class="cta-button" href="${esc(blocks.guest_website_cta)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 32px;background:linear-gradient(to right,#2A809B,#3BB8A8);color:#fff;border-radius:8px;font-size:15px;font-weight:700;text-decoration:none;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1)">✨ 👉 Zur Website von ${esc(guestName)} ✨</a>`);
    lines.push(`</div>`);
    lines.push("");
  }

  for (const n of [1, 2, 3, 4, 5, 6] as const) {
    const title = blocks[`section_${n}_title` as keyof PostBlocks] as string | undefined;
    const content = blocks[`section_${n}_body` as keyof PostBlocks] as string | undefined;
    if (title || content) {
      lines.push(`<section class="freigeist-content-section">`);
      if (title) lines.push(`  <h2 style="font-size:24px;font-weight:700;margin-bottom:1em">${esc(title)}</h2>`);
      if (content) lines.push(markdownToHtml(content));
      lines.push(`</section>`);
      lines.push("");
    }
    if (n === 3 && blocks.mid_image_url) {
      const midImg = `<img src="${esc(blocks.mid_image_url)}" alt="${esc(blocks.mid_image_alt || "")}" style="width:100%;border-radius:12px" />`;
      if (blocks.mid_image_link) {
        lines.push(`<div style="margin:2em 0"><a href="${esc(blocks.mid_image_link)}" target="_blank" rel="noopener noreferrer">${midImg}</a></div>`);
      } else {
        lines.push(`<div style="margin:2em 0">${midImg}</div>`);
      }
      lines.push("");
    }
    if (n === 3 && blocks.cta_affiliate_url) {
      lines.push(`<div class="freigeist-cta" style="text-align:center;margin:2em 0">`);
      lines.push(`  <a class="cta-button" href="${esc(blocks.cta_affiliate_url)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 32px;background:linear-gradient(to right,#2A809B,#3BB8A8);color:#fff;border-radius:8px;font-size:15px;font-weight:700;text-decoration:none;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1)">🔗 ${esc(blocks.cta_affiliate_label || "Informationen & Store")}</a>`);
      lines.push(`  <p style="margin-top:8px;font-size:12px;color:#888;font-style:italic">Es handelt sich um einen Empfehlungslink</p>`);
      lines.push(`</div>`);
      lines.push("");
    }
  }

  if (blocks.end_image_url) {
    const imgTag = `<img src="${esc(blocks.end_image_url)}" alt="${esc(blocks.end_image_alt || "")}" style="width:100%;border-radius:12px" />`;
    if (blocks.end_image_link) {
      lines.push(`<div class="freigeist-end-image" style="margin:2em 0"><a href="${esc(blocks.end_image_link)}" target="_blank" rel="noopener noreferrer">${imgTag}</a></div>`);
    } else {
      lines.push(`<div class="freigeist-end-image" style="margin:2em 0">${imgTag}</div>`);
    }
    lines.push("");
  }

  if (blocks.cta_affiliate_url) {
    lines.push(`<div class="freigeist-cta" style="text-align:center;margin:2em 0">`);
    lines.push(`  <a class="cta-button" href="${esc(blocks.cta_affiliate_url)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 32px;background:linear-gradient(to right,#2A809B,#3BB8A8);color:#fff;border-radius:8px;font-size:15px;font-weight:700;text-decoration:none;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1)">🔗 ${esc(blocks.cta_affiliate_label || "Informationen & Store")}</a>`);
    lines.push(`  <p style="margin-top:8px;font-size:12px;color:#888;font-style:italic">Es handelt sich um einen Empfehlungslink</p>`);
    lines.push(`</div>`);
    lines.push("");
  }

  if (blocks.additional_video_embed) {
    const addId = extractYouTubeId(blocks.additional_video_embed);
    if (addId) {
      lines.push(`<div class="freigeist-additional-video">`);
      lines.push(`  <iframe width="100%" height="400" src="https://www.youtube.com/embed/${addId}" frameborder="0" allowfullscreen></iframe>`);
      lines.push(`</div>`);
      lines.push("");
    }
  }

  if (blocks.pretty_link_shortcode) {
    lines.push(`<div class="freigeist-prettylink">${blocks.pretty_link_shortcode}</div>`);
    lines.push("");
  }

  if (blocks.resource_links || blocks.resource_notes) {
    lines.push(`<div class="freigeist-resources">`);
    if (blocks.resource_links) for (const line of blocks.resource_links.split("\n")) lines.push(`  <p>${esc(line)}</p>`);
    if (blocks.resource_notes) for (const line of blocks.resource_notes.split("\n")) lines.push(`  <p>${esc(line)}</p>`);
    lines.push(`</div>`);
    lines.push("");
  }

  return lines.join("\n").trim();
}
