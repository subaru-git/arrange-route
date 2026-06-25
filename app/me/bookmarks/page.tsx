import Link from "next/link";
import { signInWithGoogleAction } from "@/app/actions/auth-actions";
import { listUserBookmarkScoreSummaries } from "@/lib/repository";
import { hasSupabaseAuthConfig } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function MyBookmarksPage() {
  const supabase = hasSupabaseAuthConfig ? createServerSupabaseClient() : null;
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  if (!user || !supabase) {
    return (
      <section className="my-posts-page">
        <header className="my-posts-header">
          <p className="my-posts-kicker">Bookmarks</p>
          <h1>ブックマーク</h1>
        </header>
        <div className="my-posts-empty">
          <p>ブックマークを見るにはログインしてください。</p>
          <form action={signInWithGoogleAction}>
            <input type="hidden" name="next" value="/me/bookmarks" />
            <button type="submit" className="auth-button">
              Googleでログイン
            </button>
          </form>
        </div>
      </section>
    );
  }

  const scoreSummaries = await listUserBookmarkScoreSummaries(user.id, supabase);
  const postCount = scoreSummaries.reduce((total, item) => total + item.count, 0);

  return (
    <section className="my-posts-page">
      <header className="my-posts-header">
        <p className="my-posts-kicker">Bookmarks</p>
        <div>
          <h1>ブックマーク</h1>
          <p>{postCount}件のアレンジ</p>
        </div>
      </header>

      {scoreSummaries.length > 0 ? (
        <nav className="my-posts-score-index" aria-label="ブックマークした点数">
          {scoreSummaries.map((item) => (
            <Link
              key={item.score}
              href={`/me/bookmarks/${item.score}`}
              aria-label={`${item.score}のブックマーク ${item.count}件`}
            >
              <span>{item.score}</span>
              <small>{item.count}件</small>
            </Link>
          ))}
        </nav>
      ) : (
        <div className="my-posts-empty">
          <p>まだブックマークがありません。</p>
          <Link href="/scores" className="new-route-link">
            点数からアレンジを探す
          </Link>
        </div>
      )}
    </section>
  );
}
