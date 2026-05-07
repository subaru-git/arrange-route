import { RouteDiagram } from "@/components/route-diagram";
import { normalizeRouteTree } from "@/lib/route-tree";
import { PostCardItem } from "@/lib/types/domain";

export function PostCard({ post }: { post: PostCardItem }) {
  const tree = normalizeRouteTree(post.routeTree);

  return (
    <article>
      <RouteDiagram target={post.remainingScore} tree={tree} />
    </article>
  );
}
