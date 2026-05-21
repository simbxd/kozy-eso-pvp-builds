import { useMemo } from "react";
import { cpStarsByTree, type CpTree as TreeId } from "@/lib/eso-data";
import { useBuilderStore } from "@/store/builder-store";
import CpStarSelect from "@/components/builder/cp/CpStarSelect";

// Heading color is set via inline style because global.css ships an unlayered
// `h1-h6 { color: var(--color-text) }` rule that trumps Tailwind utilities
// (utilities live in @layer utilities, unlayered styles win). The accent
// bar uses bg- utilities which aren't affected by that global rule.
const TREE_LABELS: Record<
  TreeId,
  { title: string; sub: string; colorVar: string; barClass: string }
> = {
  red: {
    title: "Warfare",
    sub: "Combat damage & sustain",
    colorVar: "var(--color-cp-warfare)",
    barClass: "bg-cp-warfare",
  },
  blue: {
    title: "Fitness",
    sub: "Survivability & mobility",
    colorVar: "var(--color-cp-fitness)",
    barClass: "bg-cp-fitness",
  },
  // Kept for schema parity (tree enum has "green") — Craft is not rendered.
  green: {
    title: "Craft",
    sub: "Utility",
    colorVar: "var(--color-text-muted)",
    barClass: "bg-border-2",
  },
};

const SLOT_CAP = 4;

export default function CpTreeSection({ tree }: { tree: TreeId }) {
  // Select the stable cp array, then derive — see CpStarSelect for the same
  // pattern and the reason (getSnapshot caching for useSyncExternalStore).
  const cp = useBuilderStore((s) => s.build.cp);
  const slotted = useMemo(
    () => cp.filter((e) => e.tree === tree).map((e) => e.id),
    [cp, tree],
  );
  const setCpStar = useBuilderStore((s) => s.setCpStar);
  const poolEmpty = cpStarsByTree[tree].length === 0;
  const { title, sub, colorVar, barClass } = TREE_LABELS[tree];

  // Filled slots (currently slotted stars in insertion order) + one "add"
  // slot when below cap. Clearing a slot drops the entry → remaining stars
  // shift up; this matches the schema's set-style storage of build.cp.
  const slots: Array<{ kind: "filled" | "add"; id: string }> = slotted.map(
    (id) => ({ kind: "filled", id }),
  );
  if (slots.length < SLOT_CAP) slots.push({ kind: "add", id: "" });

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-surface p-4">
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 w-1 ${barClass}`}
      />
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <div>
          <h3
            className="font-display text-sm uppercase tracking-wide"
            style={{ color: colorVar }}
          >
            {title}
          </h3>
          <p className="text-[10px] text-text-muted font-body">{sub}</p>
        </div>
        <span className="text-[10px] text-text-muted font-mono">
          {slotted.length} / {SLOT_CAP}
        </span>
      </div>

      {poolEmpty ? (
        <p className="text-xs text-text-muted font-body">
          No slottable stars indexed for this tree. PvP curation focuses on
          Warfare and Fitness; Craft can be added later if needed.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {slots.map((slot, i) => (
            <CpStarSelect
              key={`${slot.kind}-${slot.id}-${i}`}
              tree={tree}
              currentId={slot.id}
              onChange={(newId) => setCpStar(tree, slot.id, newId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
