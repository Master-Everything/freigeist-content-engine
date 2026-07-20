// Zentrale Basis-URL für den Freigeist Content-Hub.
// Bei Domain-Umstellung (z. B. auf hub.freigeist.media) nur hier ändern.

export const HUB_BASE_URL = "https://freigeist-content-hub.lovable.app";

export function hubPostUrl(slug: string): string {
  return `${HUB_BASE_URL}/posts/${slug}`;
}
