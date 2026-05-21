import { useMemo, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { ChevronDown, X } from "lucide-react";
import { skillLinesIndex } from "@/lib/eso-data";
import { isSubclassValid } from "@/lib/build-validation";
import { useBuilderStore } from "@/store/builder-store";
import type { EsoSkillLine } from "@/types/eso";

// Skill lines are already class-ordered in the index; preserve that order
// while grouping so the popover reads Arcanist → … → Warden top to bottom.
function groupByClass(lines: EsoSkillLine[]): Array<[string, EsoSkillLine[]]> {
  const map = new Map<string, EsoSkillLine[]>();
  for (const l of lines) {
    const g = map.get(l.class) ?? [];
    g.push(l);
    map.set(l.class, g);
  }
  return [...map.entries()];
}

function Slot({ slot }: { slot: 0 | 1 | 2 }) {
  const [open, setOpen] = useState(false);
  const build = useBuilderStore((s) => s.build);
  const setSkillLine = useBuilderStore((s) => s.setSkillLine);

  const selectedId = build.sl[slot];
  const selected = skillLinesIndex.find((l) => l.id === selectedId);
  // A line slotted in another slot can't be picked again here.
  const usedElsewhere = new Set(
    build.sl.filter((_, i) => i !== slot && !!build.sl[i]),
  );
  const groups = useMemo(() => groupByClass(skillLinesIndex), []);

  const pick = (id: string) => {
    setSkillLine(slot, id);
    setOpen(false);
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={`flex h-[52px] w-32 items-center justify-between gap-1 rounded border px-2 text-left transition-colors ${
            selected
              ? "border-border-2 bg-surface-2"
              : "border-dashed border-border-2 hover:border-accent"
          }`}
        >
          <span className="min-w-0">
            {selected ? (
              <>
                <span className="block truncate text-sm text-text font-body">
                  {selected.name}
                </span>
                <span className="block truncate text-[10px] text-text-muted font-body">
                  {selected.class}
                </span>
              </>
            ) : (
              <span className="text-xs text-text-muted font-body">
                — slot {slot + 1} —
              </span>
            )}
          </span>
          <ChevronDown size={14} className="shrink-0 text-text-muted" />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          sideOffset={6}
          align="start"
          className="z-50 max-h-80 w-60 overflow-y-auto rounded-lg border border-border-2 bg-surface p-2 shadow-lg"
        >
          {selectedId && (
            <button
              type="button"
              onClick={() => pick("")}
              className="mb-1 flex w-full items-center gap-1 rounded px-2 py-1 text-xs text-text-muted font-body hover:text-critical"
            >
              <X size={12} /> Clear slot
            </button>
          )}
          {groups.map(([className, lines]) => (
            <div key={className} className="mb-2 last:mb-0">
              <p className="px-2 py-1 text-[10px] uppercase tracking-wide text-text-muted font-mono">
                {className}
              </p>
              {lines.map((l) => {
                const taken = usedElsewhere.has(l.id);
                const isBase = l.class_id === build.c;
                return (
                  <button
                    key={l.id}
                    type="button"
                    disabled={taken}
                    onClick={() => pick(l.id)}
                    className={`flex w-full items-center justify-between rounded px-2 py-1 text-left text-sm font-body transition-colors ${
                      taken
                        ? "cursor-not-allowed text-text-muted/40"
                        : "text-text hover:bg-accent-glow hover:text-accent"
                    }`}
                  >
                    <span className="truncate">{l.name}</span>
                    {isBase && (
                      <span
                        className="ml-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export default function SubclassPicker() {
  const build = useBuilderStore((s) => s.build);
  const baseClassName = skillLinesIndex.find(
    (l) => l.class_id === build.c,
  )?.class;
  const invalid = !!build.c && !isSubclassValid(build);

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-text-muted font-body">Subclass</span>
      <div className="flex gap-2">
        {([0, 1, 2] as const).map((n) => (
          <Slot key={n} slot={n} />
        ))}
      </div>
      {invalid ? (
        <p className="mt-1 text-xs text-critical font-body">
          Slot at least one {baseClassName} skill line.
        </p>
      ) : (
        build.c && (
          <p className="mt-1 flex items-center gap-1 text-[10px] text-text-muted font-body">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" /> ={" "}
            {baseClassName} skill line
          </p>
        )
      )}
    </div>
  );
}
