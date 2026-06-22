import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Post, PostBlocks } from "@/types/post";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PostPreview } from "@/components/PostPreview";

type AffiliateEntry = { name?: string; url?: string };

export default function ViewPost() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [affiliates, setAffiliates] = useState<AffiliateEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data, error } = await supabase.from("posts").select("*").eq("id", id).single();
      if (error || !data) {
        navigate("/speaker");
        return;
      }
      const p = { ...data, blocks: data.blocks as unknown as PostBlocks | null } as Post;
      setPost(p);
      if (p.speaker_id) {
        const { data: sp } = await supabase
          .from("speakers")
          .select("top_affiliate_products")
          .eq("id", p.speaker_id)
          .maybeSingle();
        if (sp?.top_affiliate_products && Array.isArray(sp.top_affiliate_products)) {
          setAffiliates(sp.top_affiliate_products as AffiliateEntry[]);
        }
      }
      setLoading(false);
    })();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!post) return null;

  const hasInterviewDetails = !!(
    post.interview_topic ||
    post.product ||
    post.product_market_since ||
    post.previous_interviews ||
    post.critical_voices ||
    (post.selected_affiliate_indices && post.selected_affiliate_indices.length > 0)
  );

  const selectedAffiliates =
    (post.selected_affiliate_indices || [])
      .map((i) => affiliates[i])
      .filter((a): a is AffiliateEntry => !!a && (!!a.name || !!a.url));

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur">
        <div className="mx-auto max-w-3xl flex items-center justify-between px-6 py-3">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Zurück
          </Button>
          <span className="text-xs text-muted-foreground">Leseansicht</span>
        </div>
      </div>

      {hasInterviewDetails && (
        <div className="mx-auto max-w-3xl px-6 pt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Interview-Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {post.interview_topic && (
                <Detail label="Thema des Interviews" value={post.interview_topic} />
              )}
              {post.product && <Detail label="Produkt" value={post.product} />}
              {post.product_market_since && (
                <Detail label="Produkt am Markt seit" value={post.product_market_since} />
              )}
              {post.previous_interviews && (
                <Detail label="Vorherige Interviews" value={post.previous_interviews} />
              )}
              {post.critical_voices && (
                <Detail label="Kritische Stimmen / rechtliche Schwierigkeiten" value={post.critical_voices} />
              )}
              {selectedAffiliates.length > 0 && (
                <div>
                  <div className="mb-1 text-xs font-medium text-muted-foreground">Affiliate-Produkte</div>
                  <ul className="list-disc space-y-1 pl-5">
                    {selectedAffiliates.map((a, i) => (
                      <li key={i}>
                        {a.name || a.url}
                        {a.url && a.name && (
                          <span className="ml-2 text-xs text-muted-foreground">{a.url}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {post.blocks ? (
        <PostPreview post={post} blocks={post.blocks} />
      ) : (
        <div className="mx-auto max-w-3xl px-6 py-16 text-center text-muted-foreground">
          Für diesen Beitrag liegt noch kein finaler Inhalt vor.
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-0.5 text-xs font-medium text-muted-foreground">{label}</div>
      <div className="whitespace-pre-wrap">{value}</div>
    </div>
  );
}
