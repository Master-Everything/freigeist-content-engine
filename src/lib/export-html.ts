import { PostBlocks } from "@/types/post";

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
  return match?.[1] || null;
}

export function generateHTML(blocks: PostBlocks, guestName: string): string {
  const lines: string[] = [];

  // Excerpt
  if (blocks.excerpt) {
    lines.push(`<p><em>${esc(blocks.excerpt)}</em></p>`);
    lines.push("");
  }

  // Main Video
  const mainId = extractYouTubeId(blocks.main_video_url || "");
  if (mainId) {
    lines.push(`<div class="video-embed">`);
    lines.push(`  <iframe width="100%" height="400" src="https://www.youtube.com/embed/${mainId}" frameborder="0" allowfullscreen></iframe>`);
    lines.push(`</div>`);
    lines.push("");
  }

  // Summary Box
  if (blocks.summary_box_title) {
    lines.push(`<details class="summary-box" open>`);
    lines.push(`  <summary><h2>${esc(blocks.summary_box_title)}</h2></summary>`);
    if (blocks.summary_lead) lines.push(`  <p>${esc(blocks.summary_lead)}</p>`);
    if (blocks.summary_points.length > 0) {
      lines.push(`  <ul>`);
      for (const b of blocks.summary_points) {
        lines.push(`    <li>${esc(b)}</li>`);
      }
      lines.push(`  </ul>`);
    }
    lines.push(`</details>`);
    lines.push("");
  }

  // Guest Bio
  if (blocks.guest_short_bio) {
    lines.push(`<div class="guest-profile">`);
    if (blocks.guest_image_url) {
      lines.push(`  <img src="${esc(blocks.guest_image_url)}" alt="${esc(guestName)}" class="guest-image" />`);
    }
    lines.push(`  <h3>Über ${esc(guestName)}</h3>`);
    lines.push(`  <p>${esc(blocks.guest_short_bio)}</p>`);
    lines.push(`</div>`);
    lines.push("");
  }

  // Content Sections
  for (const n of [1, 2, 3] as const) {
    const title = blocks[`section_${n}_title` as keyof PostBlocks] as string;
    const content = blocks[`section_${n}_body` as keyof PostBlocks] as string;
    if (title || content) {
      if (title) lines.push(`<h2>${esc(title)}</h2>`);
      if (content) {
        for (const p of content.split("\n\n")) {
          lines.push(`<p>${esc(p)}</p>`);
        }
      }
      lines.push("");
    }
  }

  // Additional Video
  if (blocks.additional_video_embed) {
    const addId = extractYouTubeId(blocks.additional_video_embed);
    if (addId) {
      lines.push(`<div class="video-embed">`);
      lines.push(`  <iframe width="100%" height="400" src="https://www.youtube.com/embed/${addId}" frameborder="0" allowfullscreen></iframe>`);
      lines.push(`</div>`);
      lines.push("");
    }
  }

  // PrettyLink
  if (blocks.pretty_link_shortcode) {
    lines.push(`${blocks.pretty_link_shortcode}`);
    lines.push("");
  }

  // Resources
  if (blocks.resource_links) {
    lines.push(`<h2>Weiterführende Ressourcen</h2>`);
    for (const line of blocks.resource_links.split("\n")) {
      lines.push(`<p>${esc(line)}</p>`);
    }
    lines.push("");
  }
  if (blocks.resource_notes) {
    for (const line of blocks.resource_notes.split("\n")) {
      lines.push(`<p>${esc(line)}</p>`);
    }
    lines.push("");
  }

  return lines.join("\n").trim();
}

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
