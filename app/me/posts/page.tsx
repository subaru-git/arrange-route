import Link from "next/link";
import { signInWithGoogleAction } from "@/app/actions/auth-actions";
import { listUserPostScoreSummaries } from "@/lib/repository";
import { hasSupabaseAuthConfig } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function MyPostsPage() {
  const user = hasSupabaseAuthConfig
    ? (await createServerSupabaseClient().auth.getUser()).data.user
    : null;

  if (!user) {
    return (
      <section className="my-posts-page">
        <header className="my-posts-header">
          <p className="my-posts-kicker">My posts</p>
          <h1>自分の投稿</h1>
        </header>
        <div className="my-posts-empty">
          <p>投稿一覧を見るにはログインしてください。</p>
          <form action={signInWithGoogleAction}>
            <input type="hidden" name="next" value="/me/posts" />
            <button type="submit" className="auth-button">
              Googleでログイン
            </button>
          </form>
        </div>
      </section>
    );
  }

  const scoreSummaries = await listUserPostScoreSummaries(user.id);
  const postCount = scoreSummaries.reduce((total, item) => total + item.count, 0);

  return (
    <section className="my-posts-page">
      <header className="my-posts-header">
        <p className="my-posts-kicker">My posts</p>
        <div>
          <h1>自分の投稿</h1>
          <p>{postCount}件のアレンジ</p>
        </div>
      </header>

      {scoreSummaries.length > 0 ? (
        <nav className="my-posts-score-index" aria-label="投稿済みの点数">
          {scoreSummaries.map((item) => (
            <Link
              key={item.score}
              href={`/me/posts/${item.score}`}
              aria-label={`${item.score}の投稿 ${item.count}件`}
            >
              <span>{item.score}</span>
              <small>{item.count}件</small>
            </Link>
          ))}
        </nav>
      ) : (
        <div className="my-posts-empty">
          <p>まだ投稿がありません。</p>
          <Link href="/scores" className="new-route-link">
            点数からアレンジを投稿
          </Link>
        </div>
      )}
    </section>
  );
}
