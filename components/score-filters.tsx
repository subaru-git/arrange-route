"use client";

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
    <div className="filters">
      <label>
        out_rule
        <select value={outRule} onChange={(e) => setParam("out_rule", e.target.value)}>
          <option value="">all</option>
          <option value="double_out">double_out</option>
          <option value="master_out">master_out</option>
          <option value="single_out">single_out</option>
        </select>
      </label>
      <label>
        bull_mode
        <select value={bullMode} onChange={(e) => setParam("bull_mode", e.target.value)}>
          <option value="">all</option>
          <option value="separate">separate</option>
          <option value="fat">fat</option>
        </select>
      </label>
    </div>
  );
}
