import { InputHTMLAttributes, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const control =
  "rounded-xl border border-transparent bg-[var(--color-surface-control-0)] text-[var(--color-text-primary)] shadow-[0_5px_10px_var(--elevation-1)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-line-default)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-page-0)]";

const sizes = {
  default: "min-h-11 px-3 py-2 text-sm",
  compact: "min-h-9 px-2.5 py-1.5 text-xs",
} as const;

type ControlSize = keyof typeof sizes;

interface UiInputProps extends InputHTMLAttributes<HTMLInputElement> {
  uiSize?: ControlSize;
}

interface UiSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  uiSize?: ControlSize;
}

export function UiInput({ uiSize = "default", className, ...props }: UiInputProps) {
  return <input className={cn(control, sizes[uiSize], className)} {...props} />;
}

export function UiSelect({ uiSize = "default", className, ...props }: UiSelectProps) {
  return <select className={cn(control, sizes[uiSize], className)} {...props} />;
}
