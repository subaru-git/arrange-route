"use client";

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
    <div className="sort-toggle">
      <button
        className={current === "popular" ? "active" : ""}
        onClick={() => setSort("popular")}
        type="button"
      >
        Popular
      </button>
      <button
        className={current === "latest" ? "active" : ""}
        onClick={() => setSort("latest")}
        type="button"
      >
        Latest
      </button>
    </div>
  );
}
