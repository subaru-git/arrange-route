"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { deletePostAction, DeletePostActionState } from "@/app/actions/post-actions";

const initialState: DeletePostActionState = { ok: false };

function DeleteSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="delete-modal-confirm" disabled={pending}>
      {pending ? "Deleting" : "Delete"}
    </button>
  );
}

export function DeletePostControl({
  postId,
  remainingScore,
}: {
  postId: string;
  remainingScore: number;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(deletePostAction, initialState);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    }
    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    if (!state.ok) return;
    setOpen(false);
    router.refresh();
  }, [router, state.ok]);

  return (
    <>
      <button type="button" className="post-delete-trigger" onClick={() => setOpen(true)}>
        Delete
      </button>

      <dialog
        ref={dialogRef}
        className="delete-modal"
        onClose={() => setOpen(false)}
        aria-labelledby={`delete-title-${postId}`}
      >
        <form action={formAction} className="delete-modal-panel">
          <input type="hidden" name="post_id" value={postId} />
          <input type="hidden" name="remaining_score" value={remainingScore} />
          <div className="delete-modal-copy">
            <h2 id={`delete-title-${postId}`}>Delete route</h2>
            <p>Enter today's date followed by {remainingScore}.</p>
          </div>
          <label className="delete-password-field">
            <span>Password</span>
            <input name="password" type="password" autoComplete="current-password" autoFocus />
          </label>
          {state.message ? <p className="delete-modal-error">{state.message}</p> : null}
          <div className="delete-modal-actions">
            <button type="button" className="delete-modal-cancel" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <DeleteSubmitButton />
          </div>
        </form>
      </dialog>
    </>
  );
}
