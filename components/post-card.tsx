import Link from "next/link";
import { BookmarkControl } from "@/components/bookmark-control";
import { DeletePostControl } from "@/components/delete-post-control";
import { HelpfulReaction } from "@/components/helpful-reaction";
import { RouteDiagram } from "@/components/route-diagram";
import { normalizeRouteTree } from "@/lib/route-tree";
import { PostCardItem } from "@/lib/types/domain";

function getAuthorInitial(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || "?";
}

export function PostCard({ post }: { post: PostCardItem }) {
  const tree = normalizeRouteTree(post.routeTree);

  return (
    <article className="post-card">
      <div className="post-card-main">
        <RouteDiagram target={post.remainingScore} tree={tree} />
        {post.canManage ? (
          <>
            <Link
              href={`/edit/${post.id}`}
              className="post-edit-trigger"
              aria-label="アレンジを編集"
              title="アレンジを編集"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="post-edit-icon">
                <path d="M5 18.3 5.8 14 15.9 3.9a2.1 2.1 0 0 1 3 0l1.2 1.2a2.1 2.1 0 0 1 0 3L10 18.2 5 19zm2.6-3.2-.3 1.6 1.7-.3 9.6-9.6-1.4-1.4zM5 21a1 1 0 1 1 0-2h14a1 1 0 1 1 0 2z" />
              </svg>
            </Link>
            <DeletePostControl postId={post.id} remainingScore={post.remainingScore} />
          </>
        ) : null}
      </div>
      <footer className="post-card-reactions">
        <div className="post-author">
          {post.authorAvatarUrl ? (
            <img
              className="post-author-avatar"
              src={post.authorAvatarUrl}
              alt=""
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="post-author-avatar fallback" aria-hidden="true">
              {getAuthorInitial(post.authorName)}
            </span>
          )}
          <span className="post-author-name">{post.authorName}</span>
        </div>
        <div className="post-card-actions">
          <HelpfulReaction
            postId={post.id}
            remainingScore={post.remainingScore}
            count={post.upCount}
            initialReacted={post.viewerHasUpvoted}
          />
          {post.viewerHasBookmarked !== undefined ? (
            <BookmarkControl
              postId={post.id}
              remainingScore={post.remainingScore}
              initialBookmarked={post.viewerHasBookmarked}
            />
          ) : null}
        </div>
      </footer>
    </article>
  );
}
