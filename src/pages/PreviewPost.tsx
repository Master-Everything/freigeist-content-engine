import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Post, PostBlocks } from "@/types/post";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PostPreview } from "@/components/PostPreview";

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
      navigate("/module/interview-beitraege");
      return;
    }
    setPost({ ...data, blocks: data.blocks as unknown as PostBlocks | null } as Post);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!post?.blocks) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur">
        <div className="mx-auto max-w-3xl flex items-center justify-between px-6 py-3">
          <Button variant="ghost" onClick={() => navigate(`/module/interview-beitraege/edit/${id}`)} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Zurück zum Editor
          </Button>
        </div>
      </div>
      <PostPreview post={post} blocks={post.blocks} />
    </div>
  );
}
