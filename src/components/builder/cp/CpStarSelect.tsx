import { useMemo, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { ChevronDown, X } from "lucide-react";
import { cpStarsByTree, type CpTree } from "@/lib/eso-data";
import { useBuilderStore } from "@/store/builder-store";

export default function CpStarSelect({
  tree,
  currentId,
  onChange,
}: {
  tree: CpTree;
  currentId: string;
  onChange: (newId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  // Subscribe to the stable cp array; deriving the filter inside the selector
  // would return a fresh array each render and trip useSyncExternalStore's
  // "getSnapshot should be cached" infinite loop.
  const cp = useBuilderStore((s) => s.build.cp);
  const slottedInTree = useMemo(
    () => cp.filter((e) => e.tree === tree).map((e) => e.id),
    [cp, tree],
  );
  const pool = cpStarsByTree[tree];
  const selected = pool.find((s) => s.id === currentId);
  // Stars taken by *other* slots of this tree can't be re-picked here.
  const takenElsewhere = useMemo(
    () => new Set(slottedInTree.filter((id) => id !== currentId)),
    [slottedInTree, currentId],
  );

  const pick = (id: string) => {
    onChange(id);
    setOpen(false);
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={`flex h-12 w-full items-center justify-between gap-1 rounded border px-2 text-left text-sm transition-colors ${
            selected
              ? "border-border-2 bg-surface-2 text-text"
              : "border-dashed border-border-2 text-text-muted hover:border-accent"
          }`}
        >
          <span className="min-w-0 truncate font-body">
            {selected ? selected.name : "— Star —"}
          </span>
          <ChevronDown size={12} className="shrink-0 text-text-muted" />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          sideOffset={6}
          align="start"
          className="z-50 w-80 rounded-lg border border-border-2 bg-surface p-2 shadow-lg"
        >
          {currentId && (
            <button
              type="button"
              onClick={() => pick("")}
              className="mb-1 flex w-full items-center gap-1 rounded px-2 py-1 text-xs text-text-muted font-body hover:text-critical"
            >
              <X size={12} /> Clear slot
            </button>
          )}
          <div className="max-h-80 overflow-y-auto">
            {pool.length === 0 && (
              <p className="px-2 py-3 text-xs text-text-muted font-body">
                No stars indexed for this tree yet.
              </p>
            )}
            {pool.map((s) => {
              const taken = takenElsewhere.has(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={taken}
                  onClick={() => pick(s.id)}
                  title={s.effect}
                  className={`flex w-full flex-col items-start rounded px-2 py-1.5 text-left transition-colors ${
                    taken
                      ? "cursor-not-allowed text-text-muted/40"
                      : "text-text hover:bg-accent-glow hover:text-accent"
                  }`}
                >
                  <span className="text-sm font-body">{s.name}</span>
                  <span className="line-clamp-2 text-[10px] text-text-muted font-body">
                    {s.effect}
                  </span>
                </button>
              );
            })}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
