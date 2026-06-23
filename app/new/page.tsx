import { NewPostForm } from "@/components/new-post-form";
import { BullMode, OutRule } from "@/lib/types/domain";

interface PageProps {
  searchParams: {
    remaining_score?: string;
    out_rule?: string;
    bull_mode?: string;
  };
}

const outRules: OutRule[] = ["double_out", "master_out", "single_out"];
const bullModes: BullMode[] = ["separate", "fat"];

function normalizeScore(value?: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 70;
  return Math.max(1, Math.min(701, Math.trunc(parsed)));
}

function normalizeOutRule(value?: string): OutRule {
  return outRules.includes(value as OutRule) ? (value as OutRule) : "double_out";
}

function normalizeBullMode(value?: string): BullMode {
  return bullModes.includes(value as BullMode) ? (value as BullMode) : "separate";
}

export default function NewPage({ searchParams }: PageProps) {
  return (
    <section className="new-post-page">
      <header>
        <p className="page-eyebrow">ルートを共有</p>
        <h1>新しいアレンジ</h1>
      </header>
      <NewPostForm
        initialRemainingScore={normalizeScore(searchParams.remaining_score)}
        initialOutRule={normalizeOutRule(searchParams.out_rule)}
        initialBullMode={normalizeBullMode(searchParams.bull_mode)}
      />
    </section>
  );
}
