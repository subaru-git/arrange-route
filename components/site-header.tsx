"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";

const navItems = [
  { href: "/scores", label: "Scores" },
  { href: "/new", label: "New Post" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 h-14 w-[100dvw] backdrop-blur-sm">
      <div className="mx-auto flex h-full w-[100dvw] items-stretch justify-between gap-4 bg-[linear-gradient(180deg,var(--color-surface-shell-0)_0%,var(--color-surface-shell-1)_100%)] px-3 shadow-[0_10px_18px_var(--elevation-2)]">
        <div className="flex min-w-0 h-full items-stretch gap-2">
          <Link href="/scores" className="flex h-full items-center gap-2 no-underline">
            <span className="inline-flex h-7 w-7 items-center justify-center text-xs font-bold text-[var(--color-text-primary)]">
              AW
            </span>
            <span className="whitespace-nowrap text-sm font-semibold tracking-[-0.01em] text-[var(--color-text-primary)]">
              Arrange Wiki
            </span>
          </Link>

          <nav className="flex h-full shrink-0 gap-2 whitespace-nowrap" aria-label="Primary">
            {navItems.map((item) => {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex h-full items-center justify-center px-2 text-sm font-medium no-underline text-[var(--color-text-secondary)] transition",
                    "hover:bg-[linear-gradient(180deg,var(--color-surface-control-0)_0%,var(--color-surface-control-1)_100%)] hover:text-[var(--color-text-primary)] hover:shadow-[0_6px_12px_var(--elevation-1)]",
                    "after:ml-0 after:mt-0 after:block after:h-[1px] after:w-0 after:bg-[var(--color-line-active)] after:transition-[width]",
                    "hover:after:w-full"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="inline-flex h-full shrink-0 items-center gap-2 px-2 text-sm text-[var(--color-text-primary)] transition hover:bg-[linear-gradient(180deg,var(--color-surface-control-0)_0%,var(--color-surface-control-1)_100%)] hover:shadow-[0_6px_12px_var(--elevation-1)]">
          <span className="inline-flex h-6 w-6 items-center justify-center text-xs font-semibold">U</span>
          <span className="hidden sm:inline">User</span>
          <span aria-hidden>▾</span>
        </div>
      </div>
    </header>
  );
}
