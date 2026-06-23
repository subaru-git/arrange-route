"use client";

import { useState, useTransition } from "react";
import { toggleHelpfulAction } from "@/app/actions/post-actions";

export function HelpfulReaction({
  postId,
  remainingScore,
  count,
  initialReacted = false,
}: {
  postId: string;
  remainingScore: number;
  count: number;
  initialReacted?: boolean;
}) {
  const [reacted, setReacted] = useState(initialReacted);
  const [displayCount, setDisplayCount] = useState(count);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function react() {
    if (pending) return;

    const previousReacted = reacted;
    const nextReacted = !previousReacted;
    setError("");
    setReacted(nextReacted);
    setDisplayCount((current) => Math.max(0, current + (nextReacted ? 1 : -1)));

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("post_id", postId);
        formData.set("remaining_score", String(remainingScore));
        formData.set("reacted", String(nextReacted));
        await toggleHelpfulAction(formData);
      } catch {
        setReacted(previousReacted);
        setDisplayCount((current) => Math.max(0, current + (nextReacted ? -1 : 1)));
        setError("更新できませんでした。もう一度お試しください。");
      }
    });
  }

  return (
    <div className="helpful-reaction-wrap">
      <button
        type="button"
        className={reacted ? "helpful-reaction reacted" : "helpful-reaction"}
        onClick={react}
        disabled={pending}
        aria-pressed={reacted}
        aria-label={`参考になった ${displayCount}件`}
      >
        <span className="helpful-reaction-dart" aria-hidden="true">
          🎯
        </span>
        <span>{reacted ? "参考になった！" : "参考になった"}</span>
        <strong>{displayCount}</strong>
      </button>
      {error ? (
        <span className="helpful-reaction-error" role="status">
          {error}
        </span>
      ) : null}
    </div>
  );
}
