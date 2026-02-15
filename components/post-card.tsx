import { commentAction, removeVoteAction, voteAction } from "@/app/actions/post-actions";
import { normalizeRouteTree } from "@/lib/route-tree";
import { RouteDiagram } from "@/components/route-diagram";
import { PostCardItem } from "@/lib/types/domain";

function relativeTime(iso: string) {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}h ago`;
  const day = Math.floor(hour / 24);
  return `${day}d ago`;
}

export function PostCard({ post }: { post: PostCardItem }) {
  const tree = normalizeRouteTree(post.routeTree);

  return (
    <article className="post-card">
      <div className="vote-rail">
        <form action={voteAction}>
          <input type="hidden" name="post_id" value={post.id} />
          <input type="hidden" name="vote_type" value="up" />
          <button type="submit" aria-label="upvote">
            ▲
          </button>
        </form>

        <div className="vote-score">{post.voteScore}</div>

        <form action={voteAction}>
          <input type="hidden" name="post_id" value={post.id} />
          <input type="hidden" name="vote_type" value="down" />
          <button type="submit" aria-label="downvote">
            ▼
          </button>
        </form>

        <form action={removeVoteAction}>
          <input type="hidden" name="post_id" value={post.id} />
          <button type="submit" className="clear-vote">
            clear
          </button>
        </form>
      </div>

      <div className="post-content">
        <RouteDiagram
          target={post.remainingScore}
          tree={tree}
        />

        <div className="post-meta">
          <span>up/down {post.upCount}/{post.downCount}</span>
          <span>{post.commentCount} comments</span>
          <span>{post.outRule}</span>
          <span>{post.bullMode}</span>
          <span>by {post.authorName}</span>
          <span>{relativeTime(post.createdAt)}</span>
        </div>

        <ul className="comment-list">
          {post.comments.map((c) => (
            <li key={c.id}>
              <span className="comment-author">{c.authorName}</span>
              <span>{c.body}</span>
            </li>
          ))}
        </ul>

        <form action={commentAction} className="comment-form">
          <input type="hidden" name="post_id" value={post.id} />
          <input type="text" name="body" placeholder="Add a comment" />
          <button type="submit">Comment</button>
        </form>
      </div>
    </article>
  );
}
