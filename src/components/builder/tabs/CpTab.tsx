import { useMemo } from "react";
import { useEditorStore } from "../state";
import { T, F, Diamond } from "../atoms";
import { SearchSelect, type SelectItem } from "../atoms/SearchSelect";
import cpStarsJson from "@/data/eso/cp-stars-index.json";

// ── CP star data ──────────────────────────────────────────────────────────────

type RawStar = { name: string; effect: string };
const rawCp = cpStarsJson as { warfare: RawStar[]; fitness: RawStar[] };

function slug(s: string) {
  return s.toLowerCase().replace(/[''`]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const WARFARE_ITEMS: SelectItem[] = rawCp.warfare.map((s) => ({
  id: slug(s.name), label: s.name, sub: s.effect,
}));
const FITNESS_ITEMS: SelectItem[] = rawCp.fitness.map((s) => ({
  id: slug(s.name), label: s.name, sub: s.effect,
}));

// ── CpStarSlot ────────────────────────────────────────────────────────────────

function CpStarSlot({ tree, slotIdx, star, tint, allItems, takenIds }: {
  tree: "warfare" | "fitness";
  slotIdx: number;
  star: [string, number] | null;
  tint: string;
  allItems: SelectItem[];
  takenIds: Set<string>;
}) {
  const setCpStar = useEditorStore((s) => s.setCpStar);
  const slotted = !!star;

  // Items available = all minus those taken in OTHER slots
  const available = useMemo(
    () => allItems.filter((i) => i.id === star?.[0] || !takenIds.has(i.id)),
    [allItems, takenIds, star],
  );

  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
      {/* Star icon */}
      <div style={{
        width: 32, height: 32, flexShrink: 0,
        background: slotted ? "linear-gradient(135deg, #321a73 0%, #150a30 100%)" : "transparent",
        border: `1px solid ${slotted ? tint : T.edge}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: F.cinzel, fontSize: 16,
        color: slotted ? tint : T.inkFaint,
      }}>★</div>

      {/* Picker */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <SearchSelect
          value={star?.[0] ?? ""}
          onChange={(id) => {
            if (!id) {
              setCpStar(tree, slotIdx, null);
            } else {
              setCpStar(tree, slotIdx, [id, 50]);
            }
          }}
          items={available}
          placeholder="— empty —"
          height={36}
          popoverWidth={340}
          searchPlaceholder="Search stars…"
        />
      </div>

      {/* Fixed 50 pts display */}
      {slotted && (
        <div style={{
          width: 42, height: 36, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: F.cinzel, fontWeight: 600, fontSize: 15,
          color: tint,
        }}>50</div>
      )}
    </div>
  );
}

// ── CpTree ────────────────────────────────────────────────────────────────────

function CpTree({ title, tint, tree }: {
  title: string; tint: string;
  tree: "warfare" | "fitness";
}) {
  const stars    = useEditorStore((s) => s.setups[s.activeSetupIdx].cp[tree]);
  const setCpStar = useEditorStore((s) => s.setCpStar);

  const spent = stars.reduce((a, [, v]) => a + v, 0);
  const allItems = tree === "warfare" ? WARFARE_ITEMS : FITNESS_ITEMS;

  // 4 slots — show filled stars first, then up to 4 empty
  const slots: Array<[string, number] | null> = [
    ...stars.slice(0, 4),
    ...Array(Math.max(0, 4 - stars.length)).fill(null),
  ];

  const takenIds = useMemo(
    () => new Set(stars.map(([id]) => id)),
    [stars],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <span style={{ width: 6, height: 6, transform: "rotate(45deg)", background: tint, display: "inline-block" }} />
        <div style={{
          fontFamily: F.cinzel, fontWeight: 600, fontSize: 13, letterSpacing: "0.32em",
          color: tint, textTransform: "uppercase",
        }}>{title}</div>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${tint}66, transparent)` }} />
        <div style={{
          fontFamily: F.mono, fontSize: 10, letterSpacing: "0.22em",
          color: tint, textTransform: "uppercase",
        }}>{spent} pts</div>
      </div>

      {/* Star slots */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {slots.map((star, i) => (
          <CpStarSlot
            key={i}
            tree={tree}
            slotIdx={i}
            star={star}
            tint={tint}
            allItems={allItems}
            takenIds={takenIds}
          />
        ))}
      </div>
    </div>
  );
}

// ── CpTab ─────────────────────────────────────────────────────────────────────

export default function CpTab() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%", overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, flex: 1, overflow: "hidden" }}>
        <CpTree title="Warfare" tint={T.light} tree="warfare" />
        <CpTree title="Fitness" tint={T.heavy} tree="fitness" />
      </div>

      {/* Passive note */}
      <div style={{
        fontFamily: F.mono, fontSize: 9, letterSpacing: "0.08em",
        color: T.inkFaint, textTransform: "uppercase",
        borderTop: `1px solid ${T.edge}`, paddingTop: 8,
        flexShrink: 0,
      }}>
        ◆ Passive nodes (Hardy, Piercing, Mighty…) are always active at max rank — no slot required
      </div>
    </div>
  );
}
