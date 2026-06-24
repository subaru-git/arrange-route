import { notFound } from "next/navigation";
import { NewPostForm } from "@/components/new-post-form";
import { getPost } from "@/lib/repository";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { post_id: string };
}

export default async function EditPage({ params }: PageProps) {
  const post = await getPost(params.post_id);
  if (!post) notFound();

  return (
    <section className="new-post-page">
      <header>
        <p className="page-eyebrow">ルートを整える</p>
        <h1>アレンジを編集</h1>
      </header>
      <NewPostForm
        mode="edit"
        postId={post.id}
        initialRemainingScore={post.remainingScore}
        originalRemainingScore={post.remainingScore}
        initialDartsLeft={post.dartsLeft}
        initialOutRule={post.outRule}
        initialBullMode={post.bullMode}
        initialRouteTree={post.routeTree}
      />
    </section>
  );
}
