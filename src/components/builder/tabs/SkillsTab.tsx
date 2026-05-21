import { useMemo, useState } from "react";
import { useEditorStore } from "../state";
import { T, F, Diamond } from "../atoms";
import { SkillLinePicker, ALL_CLASS_LINES } from "../atoms/SkillLinePicker";
import { SearchSelect, type SelectItem } from "../atoms/SearchSelect";
import { skillsIndex } from "@/lib/eso-data";

// ── Class line picker items ───────────────────────────────────────────────────

const LINE_ITEMS: SelectItem[] = ALL_CLASS_LINES.map((l) => ({
  id:    l.id,
  label: l.name,
  badge: l.class,
}));

// ── ClassLinePickers (top of tab) ─────────────────────────────────────────────

function ClassLinePickers() {
  const subclasses = useEditorStore((s) => s.meta.subclasses);
  const patchMeta  = useEditorStore((s) => s.patchMeta);

  const setLine = (slotIdx: 0 | 1 | 2, id: string) => {
    const next = [...subclasses] as [string, string, string];
    next[slotIdx] = id;
    patchMeta({ subclasses: next });
  };

  return (
    <div style={{
      display: "flex", gap: 10, alignItems: "flex-end",
      paddingBottom: 16,
      borderBottom: `1px solid ${T.edge}`,
      flexShrink: 0,
    }}>
      <div style={{
        fontFamily: F.mono, fontSize: 9, letterSpacing: "0.32em",
        color: T.inkMute, textTransform: "uppercase",
        flexShrink: 0, alignSelf: "center",
      }}>Class lines</div>

      {([0, 1, 2] as const).map((i) => {
        const lineId    = subclasses[i];
        const taken     = new Set(subclasses.filter((id, j) => id && j !== i));
        const available = LINE_ITEMS.filter((item) => !taken.has(item.id) || item.id === lineId);
        const raw       = ALL_CLASS_LINES.find((l) => l.id === lineId);
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
            <div style={{
              fontFamily: F.mono, fontSize: 8, letterSpacing: "0.28em",
              color: lineId ? T.accentSoft : T.inkFaint,
              textTransform: "uppercase",
              display: "flex", alignItems: "center", gap: 4,
            }}>
              {lineId && <Diamond size={4} />}
              {raw ? raw.class : `Line ${["I", "II", "III"][i]}`}
            </div>
            <SearchSelect
              value={lineId}
              onChange={(v) => setLine(i, v)}
              items={available}
              placeholder={`Line ${["I", "II", "III"][i]}`}
              searchPlaceholder="Search lines…"
              height={28}
              popoverWidth={240}
            />
          </div>
        );
      })}
    </div>
  );
}

// ── SkillCell ─────────────────────────────────────────────────────────────────

function SkillCell({
  id, bar, idx, ult, subclasses,
}: {
  id: string;
  bar: 0 | 1;
  idx: number;
  ult?: boolean;
  subclasses: [string, string, string];
}) {
  const setSkill = useEditorStore((s) => s.setSkill);
  const skill    = useMemo(() => skillsIndex.find((s) => s.id === id), [id]);
  const kind     = ult ? "Ultimate" : "Active";
  const [open, setOpen] = useState(false);

  const slotted = !!id;

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
        {/* Clickable skill box */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          title={skill?.name ?? (ult ? "Set ultimate" : `Set slot ${idx + 1}`)}
          style={{
            position: "relative", width: 64, height: 64,
            border: `1px solid ${slotted ? T.accent : T.edgeStrong}`,
            background: slotted
              ? "linear-gradient(135deg, #321a73 0%, #150a30 100%)"
              : "linear-gradient(135deg, #1a0e3d 0%, #0e0626 100%)",
            cursor: "pointer", padding: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden",
            outline: "none",
          }}
        >
          <span style={{ position: "absolute", inset: 4, border: `1px solid rgba(205,180,255,0.16)`, zIndex: 1 }} />
          {skill?.icon ? (
            <img
              src={skill.icon} alt={skill.name}
              style={{ width: 56, height: 56, clipPath: "circle(50%)" }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <span style={{ fontFamily: F.cinzel, fontSize: 26, color: slotted ? T.accentSoft : T.inkFaint }}>
              {slotted ? "◆" : "◇"}
            </span>
          )}
          {/* Hover overlay */}
          <div className="skill-hover-overlay" style={{
            position: "absolute", inset: 0,
            background: "rgba(139,92,246,0.15)",
            opacity: 0, transition: "opacity 0.1s",
            zIndex: 2,
          }} />
        </button>

        {/* Slot label */}
        <div style={{
          fontFamily: F.mono, fontSize: 9, letterSpacing: "0.22em",
          color: ult ? T.accentSoft : T.inkMute, textTransform: "uppercase",
          textAlign: "center", maxWidth: 80,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {skill ? skill.name : (ult ? "Ult." : `Slot ${idx + 1}`)}
        </div>

        {/* Clear button (when slotted) */}
        {slotted && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setSkill(bar, idx, ""); }}
            style={{
              background: "transparent", border: "none", cursor: "pointer",
              fontFamily: F.mono, fontSize: 9, letterSpacing: "0.18em",
              color: T.inkFaint, textTransform: "uppercase",
              padding: 0, lineHeight: 1,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#ef4444"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = T.inkFaint; }}
          >clear</button>
        )}
      </div>

      <SkillLinePicker
        open={open}
        onClose={() => setOpen(false)}
        onSelect={(v) => setSkill(bar, idx, v)}
        kind={kind}
        subclasses={subclasses}
      />
    </>
  );
}

// ── BarRow ────────────────────────────────────────────────────────────────────

function BarRow({ title, bar, skills, subclasses }: {
  title: string;
  bar: 0 | 1;
  skills: string[];
  subclasses: [string, string, string];
}) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 18 }}>
        <Diamond size={6} />
        <div style={{
          fontFamily: F.cinzel, fontWeight: 600, fontSize: 14,
          letterSpacing: "0.32em", color: T.accentSoft, textTransform: "uppercase",
        }}>{title}</div>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${T.accent}66, transparent)` }} />
        <div style={{
          fontFamily: F.mono, fontSize: 10, letterSpacing: "0.28em",
          color: T.inkMute, textTransform: "uppercase",
        }}>6 abilities</div>
      </div>
      <div style={{ display: "flex", gap: 18, justifyContent: "space-between" }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <SkillCell key={i} id={skills[i] ?? ""} bar={bar} idx={i} subclasses={subclasses} />
        ))}
        <SkillCell id={skills[5] ?? ""} bar={bar} idx={5} ult subclasses={subclasses} />
      </div>
    </div>
  );
}

// ── SkillsTab ─────────────────────────────────────────────────────────────────

export default function SkillsTab() {
  const bar1       = useEditorStore((s) => s.setups[s.activeSetupIdx].bar1);
  const bar2       = useEditorStore((s) => s.setups[s.activeSetupIdx].bar2);
  const subclasses = useEditorStore((s) => s.meta.subclasses);

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 28, height: "100%" }}>
        <ClassLinePickers />
        <BarRow title="Bar I · Front Bar"  bar={0} skills={bar1} subclasses={subclasses} />
        <BarRow title="Bar II · Back Bar"  bar={1} skills={bar2} subclasses={subclasses} />
      </div>

      {/* Hover overlay style */}
      <style>{`
        button:hover .skill-hover-overlay { opacity: 1 !important; }
      `}</style>
    </>
  );
}
