import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Post, PostBlocks } from "@/types/post";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Download, Loader2, User } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { generateHTML } from "@/lib/export-html";

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
  return match?.[1] || null;
}

export default function PreviewPost() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadPost(id);
  }, [id]);

  async function loadPost(postId: string) {
    const { data, error } = await supabase.from("posts").select("*").eq("id", postId).single();
    if (error || !data) {
      navigate("/");
      return;
    }
    setPost({ ...data, blocks: data.blocks as unknown as PostBlocks | null } as Post);
    setLoading(false);
  }

  function handleExport() {
    if (!post?.blocks) return;
    const html = generateHTML(post.blocks, post.guest_name);
    navigator.clipboard.writeText(html);
    toast({ title: "HTML kopiert!", description: "Der HTML-Code wurde in die Zwischenablage kopiert." });
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const b = post?.blocks;
  if (!b) return null;

  const mainVideoId = extractYouTubeId(b.youtube_url || "");
  const additionalVideoId = b.additional_video_url ? extractYouTubeId(b.additional_video_url) : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur">
        <div className="mx-auto max-w-3xl flex items-center justify-between px-6 py-3">
          <Button variant="ghost" onClick={() => navigate(`/edit/${id}`)} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Zurück zum Editor
          </Button>
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" /> HTML Export
          </Button>
        </div>
      </div>

      <article className="mx-auto max-w-3xl px-6 py-12">
        {/* Headline */}
        <h1 className="font-display text-4xl font-bold leading-tight mb-4">{b.headline}</h1>

        {/* Excerpt */}
        <p className="text-lg text-muted-foreground mb-8">{b.excerpt}</p>

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

        {/* Summary Box */}
        <div className="rounded-xl border-l-4 border-primary bg-primary/5 p-6 mb-10">
          <h2 className="font-display text-xl font-bold mb-2">{b.summary_title}</h2>
          <p className="text-muted-foreground mb-4">{b.summary_lead}</p>
          <ul className="space-y-2">
            {b.summary_bullets.map((bullet, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Guest Bio */}
        <div className="rounded-xl bg-muted/50 p-6 mb-10">
          <h3 className="font-display text-lg font-semibold mb-2">Über {post?.guest_name}</h3>
          <p className="text-muted-foreground">{b.guest_bio}</p>
        </div>

        {/* Content Sections */}
        {([1, 2, 3] as const).map((n) => {
          const title = b[`section${n}_title` as keyof PostBlocks] as string;
          const content = b[`section${n}_content` as keyof PostBlocks] as string;
          if (!title && !content) return null;
          return (
            <section key={n} className="mb-10">
              <h2 className="font-display text-2xl font-bold mb-4">{title}</h2>
              {content.split("\n\n").map((p, i) => (
                <p key={i} className="mb-4 leading-relaxed text-foreground/90">{p}</p>
              ))}
            </section>
          );
        })}

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

        {/* PrettyLink */}
        {b.prettylink_shortcodes && (
          <div className="rounded-xl bg-muted/50 p-6 mb-10">
            <p className="font-mono text-sm">{b.prettylink_shortcodes}</p>
          </div>
        )}

        {/* Resources */}
        {b.resources && (
          <div className="mb-10">
            <h2 className="font-display text-2xl font-bold mb-4">Weiterführende Ressourcen</h2>
            {b.resources.split("\n").map((line, i) => (
              <p key={i} className="mb-2 text-foreground/90">{line}</p>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}
