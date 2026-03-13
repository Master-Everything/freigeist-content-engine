import { PostBlocks } from "@/types/post";
import { markdownToHtml } from "@/lib/markdown";

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

export function generateHTML(blocks: PostBlocks, guestName: string, postTitle: string): string {
  const lines: string[] = [];

  // Title
  lines.push(`<h1>${esc(postTitle)}</h1>`);
  lines.push("");

  // Excerpt
  if (blocks.excerpt) {
    lines.push(`<p class="freigeist-excerpt">${esc(blocks.excerpt)}</p>`);
    lines.push("");
  }

  // Main Video
  const mainId = extractYouTubeId(blocks.main_video_url || "");
  if (mainId) {
    lines.push(`<div class="freigeist-video">`);
    lines.push(`  <iframe width="100%" height="400" src="https://www.youtube.com/embed/${mainId}" frameborder="0" allowfullscreen></iframe>`);
    lines.push(`</div>`);
    lines.push("");
  }

  // Summary Box
  const summaryParagraphs = blocks.summary_paragraphs?.length ? blocks.summary_paragraphs : (blocks as any).summary_points || [];
  if (blocks.summary_box_title || summaryParagraphs.length > 0) {
    lines.push(`<details class="freigeist-summary-box">`);
    lines.push(`  <summary>${esc(blocks.summary_box_title)}</summary>`);
    if (blocks.summary_lead) lines.push(`  <p>${esc(blocks.summary_lead)}</p>`);
    for (const para of summaryParagraphs) {
      if (para) lines.push(`  <p>${renderInlineBold(para)}</p>`);
    }
    lines.push(`</details>`);
    lines.push("");
  }

  // Guest Profile
  if (blocks.guest_short_bio) {
    lines.push(`<div class="freigeist-guest-profile">`);
    if (blocks.guest_image_url) {
      lines.push(`  <img src="${esc(blocks.guest_image_url)}" alt="${esc(guestName)}" />`);
    }
    lines.push(`  <div class="freigeist-guest-bio">`);
    lines.push(`    <h2>${esc(guestName)}</h2>`);
    lines.push(`    <p>${esc(blocks.guest_short_bio)}</p>`);
    lines.push(`  </div>`);
    lines.push(`</div>`);
    lines.push("");
  }

  // Guest Website CTA Button
  if (blocks.guest_website_cta) {
    lines.push(`<div class="freigeist-cta" style="text-align:center;margin:2em 0">`);
    lines.push(`  <a href="${esc(blocks.guest_website_cta)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:8px;font-weight:600;text-decoration:none">✨ 👉 Zur Website von ${esc(guestName)} ✨</a>`);
    lines.push(`</div>`);
    lines.push("");
  }

  // Content Sections (1-6) with affiliate CTA after section 3
  for (const n of [1, 2, 3, 4, 5, 6] as const) {
    const title = blocks[`section_${n}_title` as keyof PostBlocks] as string;
    const content = blocks[`section_${n}_body` as keyof PostBlocks] as string;
    if (title || content) {
      lines.push(`<section class="freigeist-content-section">`);
      if (title) lines.push(`  <h2>${esc(title)}</h2>`);
      if (content) {
        lines.push(markdownToHtml(content));
      }
      lines.push(`</section>`);
      lines.push("");
    }
    // Affiliate CTA after section 3
    if (n === 3 && blocks.cta_affiliate_url) {
      lines.push(`<div class="freigeist-cta" style="text-align:center;margin:2em 0">`);
      lines.push(`  <a href="${esc(blocks.cta_affiliate_url)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:8px;font-weight:600;text-decoration:none">🔗 ${esc(blocks.cta_affiliate_label || "Informationen & Store")}</a>`);
      lines.push(`  <p style="margin-top:8px;font-size:12px;color:#888;font-style:italic">Es handelt sich um einen Empfehlungslink</p>`);
      lines.push(`</div>`);
      lines.push("");
    }
  }

  // Additional Video
  if (blocks.additional_video_embed) {
    const addId = extractYouTubeId(blocks.additional_video_embed);
    if (addId) {
      lines.push(`<div class="freigeist-additional-video">`);
      lines.push(`  <iframe width="100%" height="400" src="https://www.youtube.com/embed/${addId}" frameborder="0" allowfullscreen></iframe>`);
      lines.push(`</div>`);
      lines.push("");
    }
  }

  // PrettyLink
  if (blocks.pretty_link_shortcode) {
    lines.push(`<div class="freigeist-prettylink">${blocks.pretty_link_shortcode}</div>`);
    lines.push("");
  }

  // Resources
  if (blocks.resource_links || blocks.resource_notes) {
    lines.push(`<div class="freigeist-resources">`);
    if (blocks.resource_links) {
      for (const line of blocks.resource_links.split("\n")) {
        lines.push(`  <p>${esc(line)}</p>`);
      }
    }
    if (blocks.resource_notes) {
      for (const line of blocks.resource_notes.split("\n")) {
        lines.push(`  <p>${esc(line)}</p>`);
      }
    }
    lines.push(`</div>`);
    lines.push("");
  }

  return lines.join("\n").trim();
}
