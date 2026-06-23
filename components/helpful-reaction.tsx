"use client";

import { useState, useTransition } from "react";
import { voteAction } from "@/app/actions/post-actions";

export function HelpfulReaction({ postId, count }: { postId: string; count: number }) {
  const [reacted, setReacted] = useState(false);
  const [pending, startTransition] = useTransition();

  function react() {
    if (reacted || pending) return;

    setReacted(true);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("post_id", postId);
      formData.set("vote_type", "up");
      await voteAction(formData);
    });
  }

  return (
    <button
      type="button"
      className={reacted ? "helpful-reaction reacted" : "helpful-reaction"}
      onClick={react}
      disabled={pending}
      aria-pressed={reacted}
    >
      <span className="helpful-reaction-dart" aria-hidden="true">
        🎯
      </span>
      <span>{reacted ? "参考になった！" : "参考になった"}</span>
      <strong>{count + (reacted ? 1 : 0)}</strong>
    </button>
  );
}
