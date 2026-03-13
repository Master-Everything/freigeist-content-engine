import { Post, PostBlocks } from "@/types/post";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User, ExternalLink } from "lucide-react";
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
  const mainVideoId = extractYouTubeId(b.main_video_url || "");
  const additionalVideoId = b.additional_video_embed ? extractYouTubeId(b.additional_video_embed) : null;
  const summaryParagraphs = b.summary_paragraphs?.length ? b.summary_paragraphs : (b as any).summary_points || [];

  return (
    <article className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="font-display text-3xl font-bold leading-tight mb-3">{post.interview_title}</h1>

      {b.excerpt && <p className="text-lg text-muted-foreground mb-8">{b.excerpt}</p>}

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

      {(b.summary_box_title || b.summary_lead || summaryParagraphs.length > 0) && (
        <details open className="mb-10 rounded-xl border-l-4 border-primary bg-primary/5 px-6 py-4">
          <summary className="cursor-pointer list-none font-display text-xl font-bold [&::-webkit-details-marker]:hidden">
            {b.summary_box_title}
          </summary>
          <div className="mt-4">
            {b.summary_lead && <p className="text-muted-foreground mb-4">{b.summary_lead}</p>}
            <div className="space-y-3">
              {summaryParagraphs.filter(Boolean).map((para: string, i: number) => (
                <p key={i} className="leading-relaxed text-foreground/90">
                  {renderInlineBold(para)}
                </p>
              ))}
            </div>
          </div>
        </details>
      )}

      {(b.guest_short_bio || b.guest_image_url) && (
        <div className="rounded-xl bg-muted/50 p-6 mb-6 flex gap-5 items-start">
          <Avatar className="h-20 w-20 shrink-0">
            {b.guest_image_url ? (
              <AvatarImage src={b.guest_image_url} alt={post.guest_name} />
            ) : null}
            <AvatarFallback><User className="h-8 w-8" /></AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-display text-lg font-semibold mb-2">Über {post.guest_name}</h3>
            <p className="text-muted-foreground">{b.guest_short_bio}</p>
          </div>
        </div>
      )}

      {b.guest_website_cta && (
        <div className="mb-10">
          <a
            href={b.guest_website_cta}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Zur Website von {post.guest_name}
          </a>
        </div>
      )}

      {([1, 2, 3, 4, 5, 6] as const).map((n) => {
        const title = b[`section_${n}_title` as keyof PostBlocks] as string;
        const content = b[`section_${n}_body` as keyof PostBlocks] as string;
        if (!title && !content) return null;
        const html = markdownToReactHtml(content || "");
        return (
          <section key={n} className="mb-10">
            {title && <h2 className="font-display text-2xl font-bold mb-4">{title}</h2>}
            {html && (
              <div
                className="max-w-none text-sm text-foreground/80 font-normal [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mt-6 [&_h3]:mb-3 [&_h4]:font-display [&_h4]:text-base [&_h4]:font-semibold [&_h4]:mt-4 [&_h4]:mb-2 [&_p]:mb-3 [&_p]:leading-relaxed [&_p]:font-normal [&_ul]:space-y-1.5 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:leading-relaxed [&_strong]:font-semibold"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            )}
          </section>
        );
      })}

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
