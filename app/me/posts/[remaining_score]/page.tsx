import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { signInWithGoogleAction } from "@/app/actions/auth-actions";
import { PostCard } from "@/components/post-card";
import { BROWSER_ID_COOKIE } from "@/lib/browser-id";
import { listUserPosts } from "@/lib/repository";
import { hasSupabaseAuthConfig } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { remaining_score: string };
}

export default async function MyPostsByScorePage({ params }: PageProps) {
  const remainingScore = Number(params.remaining_score);
  if (!Number.isInteger(remainingScore) || remainingScore < 2 || remainingScore > 170) {
    notFound();
  }

  const user = hasSupabaseAuthConfig
    ? (await createServerSupabaseClient().auth.getUser()).data.user
    : null;

  if (!user) {
    return (
      <section className="my-posts-page">
        <header className="my-posts-header">
          <p className="my-posts-kicker">My posts</p>
          <h1>{remainingScore}</h1>
        </header>
        <div className="my-posts-empty">
          <p>投稿一覧を見るにはログインしてください。</p>
          <form action={signInWithGoogleAction}>
            <input type="hidden" name="next" value={`/me/posts/${remainingScore}`} />
            <button type="submit" className="auth-button">
              Googleでログイン
            </button>
          </form>
        </div>
      </section>
    );
  }

  const browserId = cookies().get(BROWSER_ID_COOKIE)?.value;
  const posts = await listUserPosts(user.id, browserId, remainingScore);

  return (
    <section className="my-posts-page">
      <header className="my-posts-header">
        <p className="my-posts-kicker">My posts</p>
        <div>
          <h1>{remainingScore}</h1>
          <p>{posts.length}件のアレンジ</p>
        </div>
      </header>

      <Link href="/me/posts" className="my-posts-back-link">
        自分の投稿一覧へ
      </Link>

      {posts.length > 0 ? (
        <div className="grid gap-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="my-posts-empty">
          <p>この点数の投稿はありません。</p>
          <Link href="/me/posts" className="new-route-link">
            自分の投稿一覧へ
          </Link>
        </div>
      )}
    </section>
  );
}
