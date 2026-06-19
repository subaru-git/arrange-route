import Link from "next/link";
import { ModePicker } from "@/components/mode-picker";
import { PostCard } from "@/components/post-card";
import { ScorePicker } from "@/components/score-picker";
import { listPosts } from "@/lib/repository";
import { BullMode, OutRule } from "@/lib/types/domain";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { remaining_score: string };
  searchParams: {
    out_rule?: string;
    bull_mode?: string;
  };
}

const outRuleOptions: Array<{ value: OutRule; label: string }> = [
  { value: "double_out", label: "Double out" },
  { value: "master_out", label: "Master out" },
  { value: "single_out", label: "Single out" },
];

const bullModeOptions: Array<{ value: BullMode; label: string }> = [
  { value: "separate", label: "Separate bull" },
  { value: "fat", label: "Fat bull" },
];

function normalizeOutRule(value?: string): OutRule {
  return outRuleOptions.some((option) => option.value === value) ? (value as OutRule) : "double_out";
}

function normalizeBullMode(value?: string): BullMode {
  return bullModeOptions.some((option) => option.value === value) ? (value as BullMode) : "separate";
}

function newRouteHref(remainingScore: number, outRule: OutRule, bullMode: BullMode) {
  const params = new URLSearchParams({
    remaining_score: String(remainingScore),
    out_rule: outRule,
    bull_mode: bullMode,
  });
  return `/new?${params.toString()}`;
}

export default async function ScorePage({ params, searchParams }: PageProps) {
  const remainingScore = Number(params.remaining_score);
  const outRule = normalizeOutRule(searchParams.out_rule);
  const bullMode = normalizeBullMode(searchParams.bull_mode);

  const posts = await listPosts({ remainingScore, outRule, bullMode, sort: "latest" });

  return (
    <section className="mx-auto max-w-[760px] space-y-4 py-3">
      <header className="score-page-header">
        <div className="flex items-end gap-3">
          <span className="pb-2 text-sm font-semibold text-[var(--color-text-secondary)]">Score</span>
          <h1 className="m-0 leading-none">
            <ScorePicker score={remainingScore} />
          </h1>
        </div>
        <div className="pb-2">
          <ModePicker score={remainingScore} outRule={outRule} bullMode={bullMode} />
        </div>
      </header>

      <div className="grid gap-3">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
        <p className="m-0 p-4 text-sm text-[var(--color-text-secondary)]">
          <Link href={newRouteHref(remainingScore, outRule, bullMode)} className="new-route-link">
            Add a route
          </Link>
        </p>
      </div>
    </section>
  );
}
