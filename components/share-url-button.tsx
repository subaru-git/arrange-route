"use client";

import { UiButton } from "@/components/ui/button";
import { cn } from "@/lib/cn";

interface ShareUrlButtonProps {
  className?: string;
}

export function ShareUrlButton({ className }: ShareUrlButtonProps) {
  return (
    <UiButton
      size="compact"
      className={cn(className)}
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(window.location.href);
      }}
    >
      Copy URL
    </UiButton>
  );
}
