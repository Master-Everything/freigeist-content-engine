/**
 * Formatiert einen ISO-Timestamp als relativen deutschen Chip
 * (z.B. „in 2 Tagen", „vor 3 Stunden"). Reine Funktion, keine State-Bindung.
 */
export function relativeChip(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const diffMs = d.getTime() - Date.now();
  const rtf = new Intl.RelativeTimeFormat("de-DE", { numeric: "auto" });
  const abs = Math.abs(diffMs);
  const min = 60_000,
    hr = 60 * min,
    day = 24 * hr;
  if (abs < hr) return rtf.format(Math.round(diffMs / min), "minute");
  if (abs < day) return rtf.format(Math.round(diffMs / hr), "hour");
  return rtf.format(Math.round(diffMs / day), "day");
}
