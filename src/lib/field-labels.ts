// Übersetzt technische Feldschlüssel aus Scan-Findings in verständliche deutsche Labels.

const STATIC_LABELS: Record<string, string> = {
  // Speaker
  slogan: "Slogan",
  bio_third_person: "Bio (3. Person)",
  short_vita: "Kurzvita",
  topic_suggestions: "Themenvorschläge",
  title_role: "Titel / Rolle",
  industry: "Branche",
  // Interview
  interview_title: "Interview-Titel",
  interview_topic: "Interview-Thema",
  product: "Produkt",
  product_market_since: "Am Markt seit",
  previous_interviews: "Bisherige Interviews",
  critical_voices: "Kritische Stimmen",
};

function humanize(key: string): string {
  const cleaned = key.replace(/[._]+/g, " ").trim();
  if (!cleaned) return "—";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function fieldLabel(field: string | null | undefined): string {
  if (!field || field === "—") return "—";

  // Präfix wie "interview." / "speaker." abschneiden
  const stripped = field.replace(/^(interview|speaker|post)\./i, "");

  if (STATIC_LABELS[stripped]) return STATIC_LABELS[stripped];

  const hot = stripped.match(/^hot_topic_(\d+)$/i);
  if (hot) return `Hot Topic ${hot[1]}`;

  const aff = stripped.match(/^affiliate_(\d+)$/i);
  if (aff) return `Affiliate-Produkt ${aff[1]}`;

  return humanize(stripped);
}
