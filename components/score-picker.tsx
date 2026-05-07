"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

function clampScore(value: number) {
  if (!Number.isFinite(value)) return 70;
  return Math.min(701, Math.max(1, Math.trunc(value)));
}

function numericOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function ScorePicker({ score }: { score: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [draftScore, setDraftScore] = useState(String(score));

  function openPicker() {
    setDraftScore(String(score));
    setOpen(true);
  }

  function applyScore(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextScore = clampScore(Number(draftScore));
    const params = new URLSearchParams(searchParams.toString());
    const query = params.toString();
    setOpen(false);
    router.push(`/scores/${nextScore}${query ? `?${query}` : ""}`);
  }

  return (
    <>
      <button type="button" className="score-picker-trigger" onClick={openPicker}>
        {score}
      </button>

      {open ? (
        <div className="score-picker-backdrop" role="presentation" onClick={() => setOpen(false)}>
          <form
            className="score-picker-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Score"
            onSubmit={applyScore}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="score-picker-head">
              <p>Score</p>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close score picker">
                Close
              </button>
            </div>

            <label className="score-picker-field">
              <span>Remaining score 1-701</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={draftScore}
                onChange={(event) => setDraftScore(numericOnly(event.target.value))}
                autoFocus
              />
            </label>

            <div className="score-picker-actions">
              <button type="button" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="primary">
                Apply
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
