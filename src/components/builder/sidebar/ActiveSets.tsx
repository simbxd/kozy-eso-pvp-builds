import { useMemo } from "react";
import { useBuilderStore } from "@/store/builder-store";
import { activeSets } from "@/lib/compute-stats";

export default function ActiveSets() {
  const build = useBuilderStore((s) => s.build);
  const sets = useMemo(() => activeSets(build), [build]);

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <h3 className="mb-3 font-display text-sm text-text">Active sets</h3>
      {sets.length === 0 ? (
        <p className="font-mono text-xs text-text-muted">—</p>
      ) : (
        <div className="flex flex-col gap-1">
          {sets.map(({ id, name, count }) => (
            <div key={id} className="flex items-baseline justify-between gap-2">
              <span className="min-w-0 truncate text-xs font-body text-text">
                {name}
              </span>
              <span className="shrink-0 font-mono text-[10px] text-text-muted">
                {count}pc
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
