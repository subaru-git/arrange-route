"use client";

export function ShareUrlButton() {
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(window.location.href);
      }}
    >
      Copy URL
    </button>
  );
}
