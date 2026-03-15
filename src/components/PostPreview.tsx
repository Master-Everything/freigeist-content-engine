import { useState } from "react";
import { Post, PostBlocks } from "@/types/post";

import { User } from "lucide-react";
import { markdownToReactHtml } from "@/lib/markdown";

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
  return match?.[1] || null;
}

function renderInlineBold(text: string) {
  const parts = text.split(/(\*\*.+?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

interface PostPreviewProps {
  post: Post;
  blocks: PostBlocks;
}

export function PostPreview({ post, blocks: b }: PostPreviewProps) {
  const [summaryOpen, setSummaryOpen] = useState(false);
  const mainVideoId = extractYouTubeId(b.main_video_url || "");
  const additionalVideoId = b.additional_video_embed ? extractYouTubeId(b.additional_video_embed) : null;
  const summaryParagraphs = b.summary_paragraphs?.length ? b.summary_paragraphs : (b as any).summary_points || [];

  return (
    <article className="mx-auto max-w-2xl px-6 py-10">
      {/* Hero */}
      <h1 className="font-display text-3xl font-bold leading-tight mb-3">{post.interview_title}</h1>
      {b.excerpt && <p className="text-lg text-muted-foreground mb-8">{b.excerpt}</p>}

      {/* Main Video */}
      {mainVideoId && (
        <div className="aspect-video w-full overflow-hidden rounded-xl mb-10">
          <iframe
            src={`https://www.youtube.com/embed/${mainVideoId}`}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {/* Summary Accordion */}
      {(b.summary_box_title || b.summary_lead || summaryParagraphs.length > 0) && (
        <div className="mb-10">
          {b.summary_box_title && (
            <h2 className="font-display text-2xl font-bold uppercase tracking-wide mb-4">{b.summary_box_title}</h2>
          )}
          <details className="rounded-xl border border-border bg-background px-6 py-4" open={summaryOpen} onToggle={(e) => setSummaryOpen((e.target as HTMLDetailsElement).open)}>
            <summary className="cursor-pointer list-none font-display text-base font-semibold [&::-webkit-details-marker]:hidden flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-6 h-6 shrink-0 text-lg font-bold text-foreground">{summaryOpen ? "−" : "+"}</span>
              {b.summary_lead || "Zusammenfassung"}
            </summary>
            <div className="mt-4 space-y-4">
              {summaryParagraphs.filter(Boolean).map((para: string, i: number) => (
                <p key={i} className="text-base font-normal leading-[1.7] text-foreground/90">
                  {renderInlineBold(para)}
                </p>
              ))}
            </div>
          </details>
        </div>
      )}

      {/* Guest Profile */}
      {(b.guest_short_bio || b.guest_image_url) && (
        <div className="mb-10">
          <h2 className="text-center font-black text-[#2A809B] mb-6" style={{ fontFamily: '"Roboto Condensed", sans-serif', fontSize: '44px' }}>
            Entdecke mehr über {post.guest_name} und seine inspirierenden Projekte
          </h2>
          <div className="rounded-xl bg-muted/30 p-6 grid grid-cols-[2fr_3fr] gap-6 items-start">
            {b.guest_image_url ? (
              <img
                src={b.guest_image_url}
                alt={post.guest_name}
                className="w-full rounded-lg object-cover aspect-square"
              />
            ) : (
              <div className="w-full rounded-lg bg-muted flex items-center justify-center aspect-square">
                <User className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
            <div>
              <h3 className="font-display text-2xl font-bold mb-3">{post.guest_name}</h3>
              <p className="text-foreground/80 text-base leading-[1.7] text-justify">{b.guest_short_bio}</p>
            </div>
          </div>
        </div>
      )}

      {/* Top Image */}
      {b.top_image_url ? (
        <div className="mb-10">
          {b.top_image_link ? (
            <a href={b.top_image_link} target="_blank" rel="noopener noreferrer" className="block">
              <img src={b.top_image_url} alt={b.top_image_alt || ""} className="w-full rounded-xl" />
            </a>
          ) : (
            <img src={b.top_image_url} alt={b.top_image_alt || ""} className="w-full rounded-xl" />
          )}
        </div>
      ) : (
        <div className="mb-10 flex items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/20 py-16">
          <p className="text-sm text-muted-foreground">Bild hier einfügen (Oberes Bild)</p>
        </div>
      )}

      {/* CTA Button 1: Guest Website */}
      {b.guest_website_cta && (
        <div className="mb-10 text-center">
          <a
            href={b.guest_website_cta}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-lg bg-gradient-to-r from-[#2A809B] to-[#3BB8A8] px-8 py-3.5 text-[15px] font-bold text-white no-underline shadow-md transition-all hover:scale-105 hover:from-[#35A89E] hover:to-[#2A809B] hover:shadow-lg"
          >
            ✨ 👉 Zur Website von {post.guest_name} ✨
          </a>
        </div>
      )}

      {/* Content Sections 1-6 with Affiliate CTA after Section 3 */}
      {([1, 2, 3, 4, 5, 6] as const).map((n) => {
        const title = b[`section_${n}_title` as keyof PostBlocks] as string;
        const content = b[`section_${n}_body` as keyof PostBlocks] as string;
        if (!title && !content) return null;
        const html = markdownToReactHtml(content || "");
        return (
          <div key={n}>
            <section className="mb-10">
              {title && <h2 className="font-display text-2xl font-bold mb-4">{title}</h2>}
              {html && (
                <div
                  className="max-w-none text-base text-foreground/80 font-normal leading-[1.8] [&_h3]:font-display [&_h3]:text-xl [&_h3]:font-bold [&_h3]:mt-6 [&_h3]:mb-3 [&_h4]:font-display [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:mt-4 [&_h4]:mb-2 [&_p]:mb-4 [&_p]:leading-[1.8] [&_p]:font-normal [&_ul]:space-y-1.5 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:leading-[1.8] [&_strong]:font-semibold"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              )}
            </section>
            {n === 3 && (
              <>
                {/* Mid Image */}
                {b.mid_image_url ? (
                  <div className="mb-10">
                    {b.mid_image_link ? (
                      <a href={b.mid_image_link} target="_blank" rel="noopener noreferrer" className="block">
                        <img src={b.mid_image_url} alt={b.mid_image_alt || ""} className="w-full rounded-xl" />
                      </a>
                    ) : (
                      <img src={b.mid_image_url} alt={b.mid_image_alt || ""} className="w-full rounded-xl" />
                    )}
                  </div>
                ) : (
                  <div className="mb-10 flex items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/20 py-16">
                    <p className="text-sm text-muted-foreground">Bild hier einfügen (Mittleres Bild)</p>
                  </div>
                )}
              </>
            )}
            {n === 3 && b.cta_affiliate_url && (
              <div className="mb-10 text-center">
                <a
                  href={b.cta_affiliate_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded-lg bg-gradient-to-r from-[#2A809B] to-[#3BB8A8] px-8 py-3.5 text-[15px] font-bold text-white no-underline shadow-md transition-all hover:scale-105 hover:from-[#35A89E] hover:to-[#2A809B] hover:shadow-lg"
                >
                  🔗 {b.cta_affiliate_label || "Informationen & Store"}
                </a>
                <p className="mt-2 text-xs text-muted-foreground italic">Es handelt sich um einen Empfehlungslink</p>
              </div>
            )}
          </div>
        );
      })}

      {/* End Image (one image at the end, before additional video) */}
      {b.end_image_url ? (
        <div className="mb-10">
          {b.end_image_link ? (
            <a href={b.end_image_link} target="_blank" rel="noopener noreferrer" className="block">
              <img
                src={b.end_image_url}
                alt={b.end_image_alt || ""}
                className="w-full rounded-xl"
              />
            </a>
          ) : (
            <img
              src={b.end_image_url}
              alt={b.end_image_alt || ""}
              className="w-full rounded-xl"
            />
          )}
        </div>
      ) : (
        <div className="mb-10 flex items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/20 py-16">
          <p className="text-sm text-muted-foreground">Bild hier einfügen (Bild am Textende)</p>
        </div>
      )}

      {/* CTA Button 3: Affiliate (unter End-Bild) */}
      {b.cta_affiliate_url && (
        <div className="mb-10 text-center">
          <a
            href={b.cta_affiliate_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-lg bg-gradient-to-r from-[#2A809B] to-[#3BB8A8] px-8 py-3.5 text-[15px] font-bold text-white no-underline shadow-md transition-all hover:scale-105 hover:from-[#35A89E] hover:to-[#2A809B] hover:shadow-lg"
          >
            🔗 {b.cta_affiliate_label || "Informationen & Store"}
          </a>
          <p className="mt-2 text-xs text-muted-foreground italic">Es handelt sich um einen Empfehlungslink</p>
        </div>
      )}

      {/* Additional Video */}
      {additionalVideoId && (
        <div className="aspect-video w-full overflow-hidden rounded-xl mb-10">
          <iframe
            src={`https://www.youtube.com/embed/${additionalVideoId}`}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {b.pretty_link_shortcode && (
        <div className="rounded-xl bg-muted/50 p-6 mb-10">
          <p className="font-mono text-sm">{b.pretty_link_shortcode}</p>
        </div>
      )}

      {(b.resource_links || b.resource_notes) && (
        <div className="mb-10">
          <h2 className="font-display text-2xl font-bold mb-4">Weiterführende Ressourcen</h2>
          {b.resource_links?.split("\n").map((line, i) => (
            <p key={i} className="mb-2 text-foreground/90">{line}</p>
          ))}
          {b.resource_notes?.split("\n").map((line, i) => (
            <p key={`n-${i}`} className="mb-2 text-muted-foreground">{line}</p>
          ))}
        </div>
      )}
    </article>
  );
}
