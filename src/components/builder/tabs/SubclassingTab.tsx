import { useMemo } from "react";
import { useEditorStore } from "../state";
import { T, F, Diamond, SectionHead } from "../atoms";
import { SearchSelect, type SelectItem } from "../atoms/SearchSelect";
import skillLinesJson from "@/data/eso/skill-lines-index.json";

// ── Data ──────────────────────────────────────────────────────────────────────

type RawLine = { id: string; name: string; class: string; class_id: string };
const allLines = skillLinesJson as RawLine[];

const LINE_ITEMS: SelectItem[] = allLines.map((l) => ({
  id: l.id,
  label: l.name,
  badge: l.class,
}));

// ── SubclassSlot ──────────────────────────────────────────────────────────────

function SubclassSlot({ slotIdx }: { slotIdx: 0 | 1 | 2 }) {
  const subclasses = useEditorStore((s) => s.meta.subclasses);
  const patchMeta  = useEditorStore((s) => s.patchMeta);

  const lineId = subclasses[slotIdx];
  const line   = useMemo(() => allLines.find((l) => l.id === lineId), [lineId]);

  // Items exclude lines already chosen in OTHER slots
  const taken = new Set(
    subclasses.filter((id, i) => id && i !== slotIdx),
  );
  const available = LINE_ITEMS.filter((i) => !taken.has(i.id) || i.id === lineId);

  const setLine = (id: string) => {
    const next = [...subclasses] as [string, string, string];
    next[slotIdx] = id;
    patchMeta({ subclasses: next });
  };

  return (
    <div style={{
      padding: "14px 16px",
      border: `1px solid ${lineId ? T.accent : T.edge}`,
      background: lineId ? "rgba(139,92,246,0.08)" : "rgba(10,6,18,0.45)",
      display: "flex", flexDirection: "column", gap: 10,
    }}>
      {/* Slot label */}
      <div style={{
        fontFamily: F.mono, fontSize: 9, letterSpacing: "0.32em",
        color: T.inkMute, textTransform: "uppercase",
      }}>Slot {slotIdx + 1}</div>

      {/* Line name */}
      <div style={{
        fontFamily: F.cinzel, fontWeight: 600, fontSize: 16,
        color: lineId ? T.ink : T.inkFaint,
        lineHeight: 1.1,
      }}>
        {line ? line.name : <span style={{ fontWeight: 400, fontStyle: "italic" }}>— not set —</span>}
      </div>

      {/* Class label */}
      {line && (
        <div style={{
          fontFamily: F.mono, fontSize: 9, letterSpacing: "0.22em",
          color: T.accentSoft, textTransform: "uppercase",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <Diamond size={4} />
          {line.class}
        </div>
      )}

      {/* Divider */}
      <div style={{ height: 1, background: lineId ? T.accent : T.edge, opacity: 0.5 }} />

      {/* Picker */}
      <SearchSelect
        value={lineId}
        onChange={setLine}
        items={available}
        placeholder="Choose skill line"
        searchPlaceholder="Search lines…"
        height={32}
        popoverWidth={280}
      />
    </div>
  );
}

// ── SubclassingTab ────────────────────────────────────────────────────────────

export default function SubclassingTab() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%" }}>
      <div style={{
        fontFamily: F.mono, fontSize: 10, letterSpacing: "0.28em",
        color: T.inkMute, textTransform: "uppercase",
      }}>
        3 subclass skill lines — pick from any class
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        <SubclassSlot slotIdx={0} />
        <SubclassSlot slotIdx={1} />
        <SubclassSlot slotIdx={2} />
      </div>

      <div style={{
        fontFamily: F.mono, fontSize: 9, letterSpacing: "0.22em",
        color: T.inkFaint, textTransform: "uppercase", marginTop: "auto",
      }}>
        Abilities listing coming in a later milestone
      </div>
    </div>
  );
}
