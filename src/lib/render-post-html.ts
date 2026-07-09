// Unified Post Renderer — emits Hub-native semantic markup that is styled
// identically in the Engine preview (via .article-body classes in src/index.css)
// AND in the Content-Hub (which owns the same .article-body ruleset).
//
// KEEP IN SYNC with `supabase/functions/push-to-hub/render-post.ts`
// (identical output — do not diverge).

import type { PostBlocks } from "@/types/post";

function esc(str: string): string {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineFormat(text: string): string {
  return esc(text).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
  return m?.[1] || null;
}

function videoEmbed(url: string): string {
  const id = extractYouTubeId(url);
  if (!id) return "";
  return `<div class="video-embed"><iframe src="https://www.youtube.com/embed/${id}" title="YouTube video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
}

function figure(url: string, alt?: string, link?: string): string {
  const img = `<img src="${esc(url)}" alt="${esc(alt || "")}" />`;
  const wrapped = link ? `<a href="${esc(link)}" target="_blank" rel="noopener noreferrer">${img}</a>` : img;
  const caption = alt ? `<figcaption>${esc(alt)}</figcaption>` : "";
  return `<figure>${wrapped}${caption}</figure>`;
}

const SPARKLE_RE = /[\u2728\u2B50]|\uD83C\uDF1F/;
function withSparkles(label: string): string {
  const trimmed = (label || "").trim();
  if (!trimmed) return trimmed;
  if (SPARKLE_RE.test(trimmed)) return trimmed;
  return `\u2728 ${trimmed} \u2728`;
}

function ctaButton(href: string, label: string, note?: string): string {
  const link = `<a class="freigeist-cta" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(withSparkles(label))}</a>`;
  const paragraph = `<p>${link}</p>`;
  if (!note) return paragraph;
  return `${paragraph}<p class="cta-note"><em>${esc(note)}</em></p>`;
}


function markdownToHtml(md: string): string {
  if (!md) return "";
  md = md.replace(/\\n/g, "\n");
  const out: string[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length) {
      out.push(`<ul>${list.map((li) => `<li>${inlineFormat(li)}</li>`).join("")}</ul>`);
      list = [];
    }
  };
  for (const raw of md.split("\n")) {
    const line = raw.trimEnd();
    if (line.trim() === "") { flush(); continue; }
    if (/^[-*]\s+/.test(line)) { list.push(line.replace(/^[-*]\s+/, "")); continue; }
    flush();
    if (/^###\s+/.test(line)) { out.push(`<h4>${inlineFormat(line.replace(/^###\s+/, ""))}</h4>`); continue; }
    if (/^##\s+/.test(line))  { out.push(`<h3>${inlineFormat(line.replace(/^##\s+/, ""))}</h3>`); continue; }
    out.push(`<p>${inlineFormat(line)}</p>`);
  }
  flush();
  return out.join("\n");
}

export interface RenderOptions {
  /** When true, emit `<h1>` for the interview title. Default: false (Hub already renders title separately). */
  includeTitle?: boolean;
}

export function renderPostHtml(
  blocks: PostBlocks,
  guestName: string,
  postTitle: string,
  opts: RenderOptions = {},
): string {
  const b: PostBlocks = blocks || ({} as PostBlocks);
  const parts: string[] = [];

  if (opts.includeTitle && postTitle) {
    parts.push(`<h1>${esc(postTitle)}</h1>`);
  }

  if (b.excerpt) parts.push(`<p class="lead">${esc(b.excerpt)}</p>`);

  if (b.main_video_url) {
    const v = videoEmbed(b.main_video_url);
    if (v) parts.push(v);
  }

  const summaryParagraphs = (b as any).summary_paragraphs?.length
    ? (b as any).summary_paragraphs as string[]
    : ((b as any).summary_points as string[] | undefined) || [];

  if (b.summary_box_title || b.summary_lead || summaryParagraphs.length > 0) {
    if (b.summary_box_title) parts.push(`<h2>${esc(b.summary_box_title)}</h2>`);
    const bodyHtml = summaryParagraphs
      .filter(Boolean)
      .map((p) => `<p>${inlineFormat(p)}</p>`)
      .join("");
    parts.push(
      `<div class="freigeist-accordion"><details class="freigeist-accordion-item"><summary>${esc(b.summary_lead || "Zusammenfassung")}</summary><div class="freigeist-accordion-body">${bodyHtml}</div></details></div>`,
    );
  }

  if (b.guest_short_bio || b.guest_image_url) {
    const photo = b.guest_image_url
      ? `<figure class="speaker-photo"><img src="${esc(b.guest_image_url)}" alt="${esc(guestName)}" /></figure>`
      : "";
    const bio = `<div class="speaker-bio"><h3>${esc(guestName)}</h3>${
      b.guest_short_bio ? `<p>${inlineFormat(b.guest_short_bio)}</p>` : ""
    }</div>`;
    parts.push(`<aside class="speaker-profile">${photo}${bio}</aside>`);
  }

  if (b.top_image_url) parts.push(figure(b.top_image_url, b.top_image_alt, b.top_image_link));

  if (b.guest_website_cta) {
    parts.push(ctaButton(b.guest_website_cta, `Zur Website von ${guestName}`));
  }

  for (const n of [1, 2, 3, 4, 5, 6] as const) {
    const title = (b as any)[`section_${n}_title`] as string | undefined;
    const content = (b as any)[`section_${n}_body`] as string | undefined;
    if (title || content) {
      if (title) parts.push(`<h2>${esc(title)}</h2>`);
      if (content) parts.push(markdownToHtml(content));
    }
    if (n === 3) {
      if (b.mid_image_url) parts.push(figure(b.mid_image_url, b.mid_image_alt, b.mid_image_link));
      if (b.cta_affiliate_url) {
        parts.push(
          ctaButton(
            b.cta_affiliate_url,
            b.cta_affiliate_label || "Informationen & Store",
            "Es handelt sich um einen Empfehlungslink",
          ),
        );
      }
    }
  }

  if (b.end_image_url) parts.push(figure(b.end_image_url, b.end_image_alt, b.end_image_link));

  if (b.cta_affiliate_url) {
    parts.push(
      ctaButton(
        b.cta_affiliate_url,
        b.cta_affiliate_label || "Informationen & Store",
        "Es handelt sich um einen Empfehlungslink",
      ),
    );
  }

  if (b.additional_video_embed) {
    const v = videoEmbed(b.additional_video_embed);
    if (v) parts.push(v);
  }

  if (b.pretty_link_shortcode) {
    parts.push(`<div class="freigeist-prettylink">${b.pretty_link_shortcode}</div>`);
  }

  if (b.resource_links || b.resource_notes) {
    parts.push(`<h2>Weiterführende Ressourcen</h2>`);
    if (b.resource_links) {
      for (const line of b.resource_links.split("\n")) {
        if (line.trim()) parts.push(`<p>${inlineFormat(line)}</p>`);
      }
    }
    if (b.resource_notes) {
      for (const line of b.resource_notes.split("\n")) {
        if (line.trim()) parts.push(`<p><em>${inlineFormat(line)}</em></p>`);
      }
    }
  }

  return parts.join("\n");
}
