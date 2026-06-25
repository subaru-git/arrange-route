import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { signInWithGoogleAction } from "@/app/actions/auth-actions";
import { PostCard } from "@/components/post-card";
import { BROWSER_ID_COOKIE } from "@/lib/browser-id";
import { listUserBookmarkedPosts } from "@/lib/repository";
import { hasSupabaseAuthConfig } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { remaining_score: string };
}

export default async function MyBookmarksByScorePage({ params }: PageProps) {
  const remainingScore = Number(params.remaining_score);
  if (!Number.isInteger(remainingScore) || remainingScore < 2 || remainingScore > 170) {
    notFound();
  }

  const supabase = hasSupabaseAuthConfig ? createServerSupabaseClient() : null;
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  if (!user || !supabase) {
    return (
      <section className="my-posts-page">
        <header className="my-posts-header">
          <p className="my-posts-kicker">Bookmarks</p>
          <h1>{remainingScore}</h1>
        </header>
        <div className="my-posts-empty">
          <p>ブックマークを見るにはログインしてください。</p>
          <form action={signInWithGoogleAction}>
            <input type="hidden" name="next" value={`/me/bookmarks/${remainingScore}`} />
            <button type="submit" className="auth-button">
              Googleでログイン
            </button>
          </form>
        </div>
      </section>
    );
  }

  const browserId = cookies().get(BROWSER_ID_COOKIE)?.value;
  const posts = await listUserBookmarkedPosts(user.id, browserId, remainingScore, supabase);

  return (
    <section className="my-posts-page">
      <header className="my-posts-header">
        <p className="my-posts-kicker">Bookmarks</p>
        <div>
          <h1>{remainingScore}</h1>
          <p>{posts.length}件のアレンジ</p>
        </div>
      </header>

      <Link href="/me/bookmarks" className="my-posts-back-link">
        ブックマーク一覧へ
      </Link>

      {posts.length > 0 ? (
        <div className="grid gap-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="my-posts-empty">
          <p>この点数のブックマークはありません。</p>
          <Link href="/me/bookmarks" className="new-route-link">
            ブックマーク一覧へ
          </Link>
        </div>
      )}
    </section>
  );
}
