// Zentrale Definition der Post-Status-Kette (M1–M8).
// Reihenfolge = tatsächlicher Workflow. Neue Client-Schreibpfade sollten
// advanceStatus() benutzen, damit sie den Status niemals versehentlich
// zurücksetzen.

export const POST_STATUS_ORDER = [
  "erfassung",
  "scan_pending",
  "scan_done",
  "redaktion_angefragt",
  "in_bearbeitung",
  "profil",
  "profil_review",
  "leitfaden",
  "leitfaden_final",
  "vorgespraech",
  "vorgespraech_done",
  "aufzeichnung",
  "aufzeichnung_done",
  "hub_pushed",
] as const;

export type PostStatus = (typeof POST_STATUS_ORDER)[number];

export function statusIndex(s: string | null | undefined): number {
  if (!s) return -1;
  return (POST_STATUS_ORDER as readonly string[]).indexOf(s);
}

/**
 * Gibt `next` nur zurück, wenn es in der Kette **nach** `current` liegt.
 * Sonst `current`. Verhindert versehentliches Zurücksetzen.
 */
export function advanceStatus(
  current: string | null | undefined,
  next: PostStatus,
): PostStatus | string {
  const ci = statusIndex(current ?? "");
  const ni = statusIndex(next);
  if (ni > ci) return next;
  return current ?? next;
}
