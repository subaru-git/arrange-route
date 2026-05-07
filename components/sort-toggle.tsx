"use client";

import { UiButton } from "@/components/ui/button";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function SortToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = params.get("sort") ?? "popular";

  const setSort = (sort: "popular" | "latest") => {
    const next = new URLSearchParams(params.toString());
    if (sort === "popular") next.delete("sort");
    else next.set("sort", sort);
    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <div className="flex gap-2">
      <UiButton
        size="compact"
        active={current === "popular"}
        onClick={() => setSort("popular")}
        type="button"
      >
        Popular
      </UiButton>
      <UiButton
        size="compact"
        active={current === "latest"}
        onClick={() => setSort("latest")}
        type="button"
      >
        Latest
      </UiButton>
    </div>
  );
}
