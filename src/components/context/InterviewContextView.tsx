import { Badge } from "@/components/ui/badge";

type PostFields = {
  interview_title: string | null;
  interview_topic: string | null;
  product: string | null;
  product_market_since: string | null;
  previous_interviews: string | null;
  critical_voices: string | null;
  selected_affiliate_indices: number[] | null;
};

type SpeakerFields = {
  first_name: string | null;
  last_name: string | null;
  top_affiliate_products: Array<string | { name?: string; url?: string; ebook?: boolean; freebie?: boolean }> | null;
};

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="space-y-1">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="whitespace-pre-wrap text-sm leading-relaxed">{value}</div>
    </div>
  );
}

export function InterviewContextView({
  post,
  speaker,
}: {
  post: PostFields;
  speaker: SpeakerFields | null;
}) {
  const affiliates = (() => {
    const all = speaker?.top_affiliate_products ?? [];
    const idx = post.selected_affiliate_indices;
    if (!Array.isArray(idx) || idx.length === 0) return all;
    return idx.map((i) => all[i]).filter(Boolean);
  })();

  const speakerName = speaker
    ? `${speaker.first_name ?? ""} ${speaker.last_name ?? ""}`.trim()
    : "";

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Titel</div>
        <div className="text-base font-semibold">{post.interview_title ?? "—"}</div>
        {speakerName && <div className="text-sm text-muted-foreground">mit {speakerName}</div>}
      </div>
      <Field label="Thema" value={post.interview_topic} />
      <Field label="Produkt" value={post.product} />
      <Field label="Marktdauer" value={post.product_market_since} />
      <Field label="Bisherige Interviews" value={post.previous_interviews} />
      <Field label="Kritische Stimmen" value={post.critical_voices} />
      {affiliates.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Affiliate-Produkte
          </div>
          <div className="flex flex-wrap gap-1.5">
            {affiliates.map((it, i) => {
              const label = typeof it === "string" ? it : (it?.name || it?.url || "—");
              return <Badge key={i} variant="secondary" className="font-normal">{label}</Badge>;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
