"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { BullMode, OutRule } from "@/lib/types/domain";

const outRuleOptions: Array<{ value: OutRule; label: string }> = [
  { value: "double_out", label: "Double out" },
  { value: "master_out", label: "Master out" },
  { value: "single_out", label: "Single out" },
];

const bullModeOptions: Array<{ value: BullMode; label: string }> = [
  { value: "separate", label: "Separate bull" },
  { value: "fat", label: "Fat bull" },
];

function clampScore(value: number) {
  if (!Number.isFinite(value)) return null;
  return Math.min(701, Math.max(1, Math.trunc(value)));
}

function numericOnly(value: string) {
  return value.replace(/\D/g, "");
}

function scoreHref(score: number, outRule: OutRule, bullMode: BullMode) {
  const params = new URLSearchParams({ out_rule: outRule, bull_mode: bullMode });
  return `/scores/${score}?${params.toString()}`;
}

export function ScoreEntry({ commonScores }: { commonScores: number[] }) {
  const router = useRouter();
  const [score, setScore] = useState("");
  const [outRule, setOutRule] = useState<OutRule>("double_out");
  const [bullMode, setBullMode] = useState<BullMode>("separate");
  const nextScore = clampScore(Number(score));
  const newPostHref = nextScore
    ? `/new?${new URLSearchParams({
        remaining_score: String(nextScore),
        out_rule: outRule,
        bull_mode: bullMode,
      }).toString()}`
    : "/new";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!nextScore) return;
    router.push(scoreHref(nextScore, outRule, bullMode));
  }

  return (
    <div className="score-entry">
      <form onSubmit={submit}>
        <label className="score-entry-field">
            <span>Score 1-701</span>
          <input
            aria-label="Remaining score 1-701"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={score}
            onChange={(event) => setScore(numericOnly(event.target.value))}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.preventDefault();
            }}
            autoFocus
          />
        </label>

        <div className="score-entry-mode">
          <label>
            <span>Out</span>
            <select value={outRule} onChange={(event) => setOutRule(event.target.value as OutRule)}>
              {outRuleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Bull</span>
            <select value={bullMode} onChange={(event) => setBullMode(event.target.value as BullMode)}>
              {bullModeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button type="submit" disabled={!score}>
          Go
        </button>
      </form>

      <section className="score-entry-recommend">
        <p>Recommend</p>
        <div className="score-entry-shortcuts">
          {commonScores.map((value) => (
            <Link key={value} href={scoreHref(value, outRule, bullMode)}>
              {value}
            </Link>
          ))}
        </div>
        <p className="score-entry-secondary">
          Know a route? <Link href={newPostHref}>Add it to the wiki</Link>
        </p>
      </section>
    </div>
  );
}
