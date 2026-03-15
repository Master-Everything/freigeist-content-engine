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

  // Inject bounce-in animation styles
  lines.push(`<style>`);
  lines.push(`@keyframes bounce-in { 0% { transform: scale(1); } 50% { transform: scale(1.08); } 100% { transform: scale(1); } }`);
  lines.push(`.cta-button:hover { animation: bounce-in 0.4s ease; }`);
  lines.push(`</style>`);
  lines.push("");

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

  // Guest Profile
  if (blocks.guest_short_bio) {
    lines.push(`<h2 style="text-align:center;font-size:44px;font-weight:900;font-family:&quot;Roboto Condensed&quot;,sans-serif;lines.push(`<h2 style="text-align:center;font-size:44px;font-weight:900;font-family:&quot;Roboto Condensed&quot;,sans-serif;color:#2A809B;margin-bottom:1.5em">Entdecke mehr über ${esc(guestName)} und seine inspirierenden Projekte</h2>`);;margin-bottom:1.5em">Entdecke mehr über ${esc(guestName)} und seine inspirierenden Projekte</h2>`);
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

  // Top Image
  if (blocks.top_image_url) {
    const imgTag = `<img src="${esc(blocks.top_image_url)}" alt="${esc(blocks.top_image_alt || "")}" style="width:100%;border-radius:12px" />`;
    if (blocks.top_image_link) {
      lines.push(`<div style="margin:2em 0"><a href="${esc(blocks.top_image_link)}" target="_blank" rel="noopener noreferrer">${imgTag}</a></div>`);
    } else {
      lines.push(`<div style="margin:2em 0">${imgTag}</div>`);
    }
    lines.push("");
  }

  // Guest Website CTA Button
  if (blocks.guest_website_cta) {
    lines.push(`<div class="freigeist-cta" style="text-align:center;margin:2em 0">`);
    lines.push(`  <a class="cta-button" href="${esc(blocks.guest_website_cta)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 24px;background:#2A809B;color:#fff;border-radius:3px;font-size:15px;font-weight:700;text-decoration:none">✨ 👉 Zur Website von ${esc(guestName)} ✨</a>`);
    lines.push(`</div>`);
    lines.push("");
  }

  // Content Sections (1-6) with affiliate CTA after section 3
  for (const n of [1, 2, 3, 4, 5, 6] as const) {
    const title = blocks[`section_${n}_title` as keyof PostBlocks] as string;
    const content = blocks[`section_${n}_body` as keyof PostBlocks] as string;
    if (title || content) {
      lines.push(`<section class="freigeist-content-section">`);
      if (title) lines.push(`  <h2 style="font-size:24px;font-weight:700;margin-bottom:1em">${esc(title)}</h2>`);
      if (content) {
        lines.push(markdownToHtml(content));
      }
      lines.push(`</section>`);
      lines.push("");
    }
    // Mid Image after section 3
    if (n === 3 && blocks.mid_image_url) {
      const midImg = `<img src="${esc(blocks.mid_image_url)}" alt="${esc(blocks.mid_image_alt || "")}" style="width:100%;border-radius:12px" />`;
      if (blocks.mid_image_link) {
        lines.push(`<div style="margin:2em 0"><a href="${esc(blocks.mid_image_link)}" target="_blank" rel="noopener noreferrer">${midImg}</a></div>`);
      } else {
        lines.push(`<div style="margin:2em 0">${midImg}</div>`);
      }
      lines.push("");
    }
    // Affiliate CTA after section 3
    if (n === 3 && blocks.cta_affiliate_url) {
      lines.push(`<div class="freigeist-cta" style="text-align:center;margin:2em 0">`);
      lines.push(`  <a class="cta-button" href="${esc(blocks.cta_affiliate_url)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 24px;background:#6EC1E4;color:#fff;border-radius:3px;font-size:15px;font-weight:700;text-decoration:none">🔗 ${esc(blocks.cta_affiliate_label || "Informationen & Store")}</a>`);
      lines.push(`  <p style="margin-top:8px;font-size:12px;color:#888;font-style:italic">Es handelt sich um einen Empfehlungslink</p>`);
      lines.push(`</div>`);
      lines.push("");
    }
  }

  // End Image
  if (blocks.end_image_url) {
    const imgTag = `<img src="${esc(blocks.end_image_url)}" alt="${esc(blocks.end_image_alt || "")}" style="width:100%;border-radius:12px" />`;
    if (blocks.end_image_link) {
      lines.push(`<div class="freigeist-end-image" style="margin:2em 0">`);
      lines.push(`  <a href="${esc(blocks.end_image_link)}" target="_blank" rel="noopener noreferrer">${imgTag}</a>`);
      lines.push(`</div>`);
    } else {
      lines.push(`<div class="freigeist-end-image" style="margin:2em 0">${imgTag}</div>`);
    }
    lines.push("");
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
