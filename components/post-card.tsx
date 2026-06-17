import { DeletePostControl } from "@/components/delete-post-control";
import { RouteDiagram } from "@/components/route-diagram";
import { normalizeRouteTree } from "@/lib/route-tree";
import { PostCardItem } from "@/lib/types/domain";

export function PostCard({ post }: { post: PostCardItem }) {
  const tree = normalizeRouteTree(post.routeTree);

  return (
    <article className="post-card">
      <div className="post-card-route">
        <RouteDiagram target={post.remainingScore} tree={tree} />
        <DeletePostControl postId={post.id} remainingScore={post.remainingScore} />
      </div>
    </article>
  );
}
