"use client";

import { useState, useTransition } from "react";
import { toggleBookmarkAction } from "@/app/actions/post-actions";

const MINIMUM_FEEDBACK_MS = 320;

function waitForFeedback() {
  return new Promise((resolve) => window.setTimeout(resolve, MINIMUM_FEEDBACK_MS));
}

export function BookmarkControl({
  postId,
  remainingScore,
  initialBookmarked = false,
}: {
  postId: string;
  remainingScore: number;
  initialBookmarked?: boolean;
}) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function toggle() {
    if (pending) return;

    const previousBookmarked = bookmarked;
    const nextBookmarked = !previousBookmarked;
    setError("");
    setBookmarked(nextBookmarked);

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("post_id", postId);
        formData.set("remaining_score", String(remainingScore));
        formData.set("bookmarked", String(nextBookmarked));
        await Promise.all([toggleBookmarkAction(formData), waitForFeedback()]);
      } catch {
        setBookmarked(previousBookmarked);
        setError("保存できませんでした。");
      }
    });
  }

  return (
    <div className="bookmark-control-wrap">
      <button
        type="button"
        className={[
          "bookmark-control",
          bookmarked ? "bookmarked" : "",
          pending ? "pending" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={toggle}
        disabled={pending}
        aria-pressed={bookmarked}
        aria-busy={pending}
        aria-label={bookmarked ? "ブックマークを解除" : "ブックマークに追加"}
        title={bookmarked ? "ブックマークを解除" : "ブックマークに追加"}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="bookmark-control-icon">
          <path d="M6.5 6.25A2.25 2.25 0 0 1 8.75 4h6.5a2.25 2.25 0 0 1 2.25 2.25v12.1L12 15.25l-5.5 3.1z" />
        </svg>
      </button>
      {error ? (
        <span className="bookmark-control-error" role="status">
          {error}
        </span>
      ) : null}
    </div>
  );
}
