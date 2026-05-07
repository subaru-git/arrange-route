import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const base =
  "inline-flex items-center justify-center rounded-xl border border-transparent bg-[var(--color-surface-control-0)] font-medium text-[var(--color-text-primary)] shadow-[0_5px_10px_var(--elevation-1)] transition hover:shadow-[0_8px_14px_var(--elevation-2)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-line-default)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-page-0)] disabled:cursor-not-allowed disabled:opacity-60";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  size?: "default" | "compact";
}

const sizes = {
  default: "min-h-11 px-3 py-2 text-sm",
  compact: "min-h-9 px-2.5 py-1.5 text-xs",
} as const;

export function UiButton({ className, active, size = "default", ...props }: Props) {
  return (
    <button
      className={cn(base, sizes[size], active && "ring-1 ring-[var(--color-line-active)]", className)}
      {...props}
    />
  );
}
