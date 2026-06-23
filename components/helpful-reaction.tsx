"use client";

import { useState, useTransition } from "react";
import { toggleHelpfulAction } from "@/app/actions/post-actions";

const MINIMUM_FEEDBACK_MS = 500;

function waitForFeedback() {
  return new Promise((resolve) => window.setTimeout(resolve, MINIMUM_FEEDBACK_MS));
}

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
        await Promise.all([toggleHelpfulAction(formData), waitForFeedback()]);
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
        className={[
          "helpful-reaction",
          reacted ? "reacted" : "",
          pending ? "pending" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={react}
        disabled={pending}
        aria-pressed={reacted}
        aria-busy={pending}
        aria-label={`参考になった ${displayCount}件`}
      >
        <span className="helpful-reaction-icon" aria-hidden="true">
          <span className="helpful-reaction-dart">🎯</span>
          <span className="helpful-reaction-flight" />
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
