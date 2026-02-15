import Link from "next/link";
import { PostCard } from "@/components/post-card";
import { ScoreFilters } from "@/components/score-filters";
import { ShareUrlButton } from "@/components/share-url-button";
import { SortToggle } from "@/components/sort-toggle";
import { listPosts } from "@/lib/repository";
import { BullMode, OutRule, SortMode } from "@/lib/types/domain";

interface PageProps {
  params: { remaining_score: string };
  searchParams: {
    out_rule?: string;
    bull_mode?: string;
    sort?: string;
  };
}

const outRules: OutRule[] = ["double_out", "master_out", "single_out"];
const bullModes: BullMode[] = ["separate", "fat"];
const sortModes: SortMode[] = ["popular", "latest"];

export default async function ScorePage({ params, searchParams }: PageProps) {
  const remainingScore = Number(params.remaining_score);
  const outRule = outRules.includes(searchParams.out_rule as OutRule)
    ? (searchParams.out_rule as OutRule)
    : undefined;
  const bullMode = bullModes.includes(searchParams.bull_mode as BullMode)
    ? (searchParams.bull_mode as BullMode)
    : undefined;
  const sort = sortModes.includes(searchParams.sort as SortMode)
    ? (searchParams.sort as SortMode)
    : "popular";

  const posts = await listPosts({ remainingScore, outRule, bullMode, sort });

  return (
    <section>
      <div className="score-header">
        <h1>{remainingScore} out option</h1>
        <p>posts: {posts.length}</p>
      </div>

      <div className="toolbar">
        <ScoreFilters />
        <SortToggle />
        <ShareUrlButton />
        <Link href="/new">Post this score</Link>
      </div>

      <div className="posts-grid">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
