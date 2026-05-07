"use client";

import { UiSelect } from "@/components/ui/controls";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function ScoreFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const outRule = params.get("out_rule") ?? "";
  const bullMode = params.get("bull_mode") ?? "";

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (!value) next.delete(key);
    else next.set(key, value);
    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
        <span>out</span>
        <UiSelect
          uiSize="compact"
          value={outRule}
          onChange={(e) => setParam("out_rule", e.target.value)}
          className="min-w-28"
        >
          <option value="">all</option>
          <option value="double_out">double_out</option>
          <option value="master_out">master_out</option>
          <option value="single_out">single_out</option>
        </UiSelect>
      </label>
      <label className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
        <span>bull</span>
        <UiSelect
          uiSize="compact"
          value={bullMode}
          onChange={(e) => setParam("bull_mode", e.target.value)}
          className="min-w-24"
        >
          <option value="">all</option>
          <option value="separate">separate</option>
          <option value="fat">fat</option>
        </UiSelect>
      </label>
    </div>
  );
}
