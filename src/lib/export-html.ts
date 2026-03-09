import { PostBlocks } from "@/types/post";

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
  return match?.[1] || null;
}

export function generateHTML(blocks: PostBlocks, guestName: string): string {
  const lines: string[] = [];

  // Headline
  lines.push(`<h1>${esc(blocks.headline)}</h1>`);
  lines.push("");

  // Excerpt
  if (blocks.excerpt) {
    lines.push(`<p><em>${esc(blocks.excerpt)}</em></p>`);
    lines.push("");
  }

  // Main Video
  const mainId = extractYouTubeId(blocks.youtube_url || "");
  if (mainId) {
    lines.push(`<div class="video-embed">`);
    lines.push(`  <iframe width="100%" height="400" src="https://www.youtube.com/embed/${mainId}" frameborder="0" allowfullscreen></iframe>`);
    lines.push(`</div>`);
    lines.push("");
  }

  // Summary Box
  if (blocks.summary_title) {
    lines.push(`<details class="summary-box" open>`);
    lines.push(`  <summary><h2>${esc(blocks.summary_title)}</h2></summary>`);
    if (blocks.summary_lead) lines.push(`  <p>${esc(blocks.summary_lead)}</p>`);
    if (blocks.summary_bullets.length > 0) {
      lines.push(`  <ul>`);
      for (const b of blocks.summary_bullets) {
        lines.push(`    <li>${esc(b)}</li>`);
      }
      lines.push(`  </ul>`);
    }
    lines.push(`</details>`);
    lines.push("");
  }

  // Guest Bio
  if (blocks.guest_bio) {
    lines.push(`<div class="guest-profile">`);
    if (blocks.guest_image_url) {
      lines.push(`  <img src="${esc(blocks.guest_image_url)}" alt="${esc(guestName)}" class="guest-image" />`);
    }
    lines.push(`  <h3>Über ${esc(guestName)}</h3>`);
    lines.push(`  <p>${esc(blocks.guest_bio)}</p>`);
    lines.push(`</div>`);
    lines.push("");
  }

  // Content Sections
  for (const n of [1, 2, 3] as const) {
    const title = blocks[`section${n}_title` as keyof PostBlocks] as string;
    const content = blocks[`section${n}_content` as keyof PostBlocks] as string;
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
  if (blocks.additional_video_url) {
    const addId = extractYouTubeId(blocks.additional_video_url);
    if (addId) {
      lines.push(`<div class="video-embed">`);
      lines.push(`  <iframe width="100%" height="400" src="https://www.youtube.com/embed/${addId}" frameborder="0" allowfullscreen></iframe>`);
      lines.push(`</div>`);
      lines.push("");
    }
  }

  // PrettyLink
  if (blocks.prettylink_shortcodes) {
    lines.push(`${blocks.prettylink_shortcodes}`);
    lines.push("");
  }

  // Resources
  if (blocks.resources) {
    lines.push(`<h2>Weiterführende Ressourcen</h2>`);
    for (const line of blocks.resources.split("\n")) {
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
