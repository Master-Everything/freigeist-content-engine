import { Post, PostBlocks } from "@/types/post";
import { renderPostHtml } from "@/lib/render-post-html";

interface PostPreviewProps {
  post: Post;
  blocks: PostBlocks;
  hideTitle?: boolean;
}

/**
 * Thin wrapper that renders the same Hub-native HTML that gets pushed to the
 * Content-Hub. All visuals come from the `.article-body` ruleset in
 * `src/index.css`, which mirrors the Hub's own stylesheet.
 */
export function PostPreview({ post, blocks, hideTitle }: PostPreviewProps) {
  const mergedBlocks = {
    ...(blocks || {}),
    guest_image_url: blocks?.guest_image_url || post.guest_image_url || undefined,
  } as PostBlocks;
  const html = renderPostHtml(mergedBlocks, post.guest_name, post.interview_title);
  return (
    <article className="mx-auto max-w-2xl px-6 py-10">
      {!hideTitle && (
        <h1 className="font-display text-3xl font-bold leading-tight mb-3">
          {post.interview_title}
        </h1>
      )}
      <div className="article-body" dangerouslySetInnerHTML={{ __html: html }} />
    </article>
  );
}
