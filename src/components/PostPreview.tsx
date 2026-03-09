import { Post, PostBlocks } from "@/types/post";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User } from "lucide-react";

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
  return match?.[1] || null;
}

interface PostPreviewProps {
  post: Post;
  blocks: PostBlocks;
}

export function PostPreview({ post, blocks: b }: PostPreviewProps) {
  const mainVideoId = extractYouTubeId(b.main_video_url || "");
  const additionalVideoId = b.additional_video_embed ? extractYouTubeId(b.additional_video_embed) : null;

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

      {(b.summary_box_title || b.summary_lead || b.summary_points.length > 0) && (
        <Accordion type="single" collapsible defaultValue="summary" className="mb-10">
          <AccordionItem value="summary" className="rounded-xl border-l-4 border-primary bg-primary/5 px-6 border-b-0">
            <AccordionTrigger className="hover:no-underline">
              <h2 className="font-display text-xl font-bold">{b.summary_box_title}</h2>
            </AccordionTrigger>
            <AccordionContent>
              {b.summary_lead && <p className="text-muted-foreground mb-4">{b.summary_lead}</p>}
              <ul className="space-y-2">
                {b.summary_points.filter(Boolean).map((point, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {(b.guest_short_bio || b.guest_image_url) && (
        <div className="rounded-xl bg-muted/50 p-6 mb-10 flex gap-5 items-start">
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

      {([1, 2, 3] as const).map((n) => {
        const title = b[`section_${n}_title` as keyof PostBlocks] as string;
        const content = b[`section_${n}_body` as keyof PostBlocks] as string;
        if (!title && !content) return null;
        return (
          <section key={n} className="mb-10">
            {title && <h2 className="font-display text-2xl font-bold mb-4">{title}</h2>}
            {content?.split("\n\n").map((p, i) => (
              <p key={i} className="mb-4 leading-relaxed text-foreground/90">{p}</p>
            ))}
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
