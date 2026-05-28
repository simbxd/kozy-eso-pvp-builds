import { useState, useMemo, useRef, useEffect } from "react";
import { useEditorStore } from "../state";
import { T, F } from "../atoms";
import { skillsIndex, getSkillDesc } from "@/lib/eso-data";
import skillLinesJson from "@/data/eso/skill-lines-index.json";

// ── Static data ───────────────────────────────────────────────────────────────

type RawLine = { id: string; name: string; class: string; class_id: string; icon?: string };
const CLASS_LINES = skillLinesJson as RawLine[];

// Race → skill_line_id mapping
const RACE_LINE: Record<string, string> = {
  altmer:   "high-elf-skills",
  argonian: "argonian-skills",
  bosmer:   "wood-elf-skills",
  breton:   "breton-skills",
  dunmer:   "dark-elf-skills",
  imperial: "imperial-skills",
  khajiit:  "khajiit-skills",
  nord:     "nord-skills",
  orc:      "orc-skills",
  redguard: "redguard-skills",
};

// Fixed non-class groups
type LineRef = { id: string; name: string; icon?: string };
type Group   = { id: string; label: string; lines: LineRef[] };

const FIXED_GROUPS: Group[] = [
  {
    id: "weapon", label: "Weapon",
    lines: [
      { id: "two-handed",          name: "Two Handed"          },
      { id: "one-hand-and-shield", name: "One Hand & Shield"   },
      { id: "dual-wield",          name: "Dual Wield"          },
      { id: "bow",                 name: "Bow"                 },
      { id: "destruction-staff",   name: "Destruction Staff"   },
      { id: "restoration-staff",   name: "Restoration Staff"   },
    ],
  },
  {
    id: "armor", label: "Armor",
    lines: [
      { id: "light-armor",  name: "Light Armor"  },
      { id: "medium-armor", name: "Medium Armor" },
      { id: "heavy-armor",  name: "Heavy Armor"  },
    ],
  },
  {
    id: "world", label: "World",
    lines: [
      { id: "vampire",    name: "Vampire"    },
      { id: "werewolf",   name: "Werewolf"   },
      { id: "soul-magic", name: "Soul Magic" },
    ],
  },
  {
    id: "guild", label: "Guild",
    lines: [
      { id: "fighters-guild", name: "Fighters Guild" },
      { id: "mages-guild",    name: "Mages Guild"    },
      { id: "undaunted",      name: "Undaunted"      },
      { id: "psijic-order",   name: "Psijic Order"   },
    ],
  },
  {
    id: "pvp", label: "Alliance War",
    lines: [
      { id: "assault", name: "Assault" },
      { id: "support", name: "Support" },
    ],
  },
];

// ── Passive skill lookup ──────────────────────────────────────────────────────

const PASSIVE_BLOCKLIST = new Set([
  "heavy-armor-bonuses", "heavy-armor-penalties",
  "light-armor-bonuses", "light-armor-penalties",
  "medium-armor-bonuses",
]);

const PASSIVE_BY_LINE = new Map<string, typeof skillsIndex[number][]>();
for (const s of skillsIndex) {
  if (s.type !== "Passive") continue;
  if (PASSIVE_BLOCKLIST.has(s.id)) continue;
  if (!PASSIVE_BY_LINE.has(s.skill_line_id)) PASSIVE_BY_LINE.set(s.skill_line_id, []);
  PASSIVE_BY_LINE.get(s.skill_line_id)!.push(s);
}

// ── PassiveTooltip ────────────────────────────────────────────────────────────

function PassiveTooltip({ name, desc, skillLine, x, y }: {
  name: string; desc: string; skillLine: string; x: number; y: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x, y });

  useEffect(() => {
    if (!ref.current) return;
    const { width, height } = ref.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let nx = x + 10;
    let ny = y;
    if (nx + width > vw - 8) nx = x - width - 10;
    if (ny + height > vh - 8) ny = vh - height - 8;
    setPos({ x: Math.max(8, nx), y: Math.max(8, ny) });
  }, [x, y]);

  // Strip "Current bonus: X" noise from descriptions
  const clean = desc.replace(/\n\nCurrent bonus:[^\n]*/g, "").trim();

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
        zIndex: 9999,
        width: 260,
        background: "rgba(10,6,22,0.97)",
        border: `1px solid ${T.edgeStrong}`,
        borderRadius: 6,
        padding: "10px 12px",
        boxShadow: "0 6px 24px rgba(0,0,0,0.6)",
        pointerEvents: "none",
      }}
    >
      <div style={{
        fontFamily: F.cinzel, fontWeight: 600, fontSize: 13,
        color: T.accentSoft, marginBottom: 4,
      }}>{name}</div>
      <div style={{
        fontFamily: F.mono, fontSize: 8, letterSpacing: "0.22em",
        color: T.inkMute, textTransform: "uppercase", marginBottom: 6,
      }}>{skillLine}</div>
      <div style={{
        fontFamily: F.display, fontSize: 11,
        color: T.inkDim, lineHeight: 1.55,
        whiteSpace: "pre-line",
      }}>{clean}</div>
    </div>
  );
}

// ── PassiveRow ────────────────────────────────────────────────────────────────

function PassiveRow({ id, name, icon, skillLine }: {
  id: string; name: string; icon?: string; skillLine: string;
}) {
  const checked       = useEditorStore((s) => !!s.setups[s.activeSetupIdx].passives[id]);
  const togglePassive = useEditorStore((s) => s.togglePassive);
  const desc          = getSkillDesc(id);

  const [tooltip, setTooltip] = useState<{ x: number; y: number } | null>(null);

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!checked) (e.currentTarget as HTMLButtonElement).style.background = "rgba(139,92,246,0.04)";
    if (desc) {
      const rect = e.currentTarget.getBoundingClientRect();
      setTooltip({ x: rect.right, y: rect.top });
    }
  };
  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!checked) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
    setTooltip(null);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => togglePassive(id)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 14,
          padding: "10px 16px", textAlign: "left",
          background: checked ? "rgba(139,92,246,0.08)" : "transparent",
          border: "none",
          borderBottom: `1px solid ${T.edge}`,
          cursor: "pointer",
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Icon */}
        {icon ? (
          <img
            src={icon} alt=""
            style={{
              width: 44, height: 44, borderRadius: "50%", clipPath: "circle(50%)", flexShrink: 0,
              border: `2px solid ${checked ? T.accent : T.edge}`,
              opacity: checked ? 1 : 0.6,
            }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div style={{
            width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
            background: T.panelBgAlt, border: `2px solid ${checked ? T.accent : T.edge}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: F.cinzel, fontSize: 16,
            color: checked ? T.accentSoft : T.inkFaint,
          }}>◇</div>
        )}

        {/* Name */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: F.cinzel, fontWeight: 600, fontSize: 14,
            color: checked ? T.ink : T.inkDim,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{name}</div>
        </div>

        {/* Checkbox */}
        <div style={{
          width: 18, height: 18, flexShrink: 0,
          border: `1.5px solid ${checked ? T.accent : T.edgeStrong}`,
          background: checked ? T.accent : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {checked && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4L4 7L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </button>

      {/* Tooltip portal */}
      {tooltip && desc && (
        <PassiveTooltip name={name} desc={desc} skillLine={skillLine} x={tooltip.x} y={tooltip.y} />
      )}
    </>
  );
}

// ── CheckAllButton ────────────────────────────────────────────────────────────

function CheckAllButton({ items }: { items: Array<{ id: string }> }) {
  const store = useEditorStore();
  const p = store.setups[store.activeSetupIdx].passives;
  const allChecked = items.length > 0 && items.every((sk) => !!p[sk.id]);

  const handleClick = () => {
    const toggle = store.togglePassive;
    if (allChecked) {
      items.filter((sk) => !!p[sk.id]).forEach((sk) => toggle(sk.id));
    } else {
      items.filter((sk) => !p[sk.id]).forEach((sk) => toggle(sk.id));
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{
        background: "transparent", border: `1px solid ${T.edge}`, cursor: "pointer",
        fontFamily: F.mono, fontSize: 9, letterSpacing: "0.22em",
        color: T.inkMute, textTransform: "uppercase",
        padding: "4px 10px",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = T.accentSoft; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = T.edge; }}
    >
      {allChecked ? "Uncheck all" : "Check all"}
    </button>
  );
}

// ── LinePanel ─────────────────────────────────────────────────────────────────

function LinePanel({ lineId, lineName }: { lineId: string; lineName: string }) {
  const passives = useMemo(() => PASSIVE_BY_LINE.get(lineId) ?? [], [lineId]);

  if (passives.length === 0) {
    return (
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: F.mono, fontSize: 11, color: T.inkMute,
        letterSpacing: "0.18em", textTransform: "uppercase",
      }}>
        No passives in this skill line
      </div>
    );
  }

  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px 10px",
        borderBottom: `1px solid ${T.edge}`,
        flexShrink: 0,
      }}>
        <div style={{
          fontFamily: F.cinzel, fontWeight: 600, fontSize: 15,
          letterSpacing: "0.06em", color: T.ink,
        }}>{lineName}</div>
        <CheckAllButton items={passives} />
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {passives.map((sk) => (
          <PassiveRow key={sk.id} id={sk.id} name={sk.name} icon={sk.icon} skillLine={sk.skill_line} />
        ))}
      </div>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function SidebarLine({ lineId, name, selected, onClick }: {
  lineId: string; name: string; selected: boolean; onClick: () => void;
}) {
  const count   = useMemo(() => PASSIVE_BY_LINE.get(lineId)?.length ?? 0, [lineId]);
  const checked = useEditorStore((s) => {
    const p = s.setups[s.activeSetupIdx].passives;
    const passives = PASSIVE_BY_LINE.get(lineId) ?? [];
    return passives.filter((sk) => !!p[sk.id]).length;
  });

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 8,
        padding: "7px 10px 7px 22px", textAlign: "left",
        background: selected ? "rgba(139,92,246,0.14)" : "transparent",
        border: "none",
        borderLeft: selected ? `2px solid ${T.accent}` : "2px solid transparent",
        marginLeft: -2,
        cursor: "pointer",
      }}
      onMouseEnter={(e) => { if (!selected) (e.currentTarget as HTMLButtonElement).style.background = "rgba(139,92,246,0.05)"; }}
      onMouseLeave={(e) => { if (!selected) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
    >
      <span style={{
        flex: 1, fontFamily: F.display,
        fontStyle: selected ? "normal" : "italic",
        fontWeight: selected ? 600 : 400, fontSize: 13,
        color: selected ? T.ink : T.inkDim,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>{name}</span>
      {count > 0 && (
        <span style={{
          fontFamily: F.mono, fontSize: 9, letterSpacing: "0.12em",
          color: checked > 0 ? T.accentSoft : T.inkFaint,
        }}>
          {checked}/{count}
        </span>
      )}
    </button>
  );
}

function SidebarGroup({ group, selectedLineId, onSelect }: {
  group: Group;
  selectedLineId: string;
  onSelect: (id: string, name: string) => void;
}) {
  const isActive = group.lines.some((l) => l.id === selectedLineId);
  const [open, setOpen] = useState(isActive);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 8,
          padding: "8px 10px", textAlign: "left",
          background: "transparent", border: "none",
          borderBottom: open ? "none" : `1px solid ${T.edge}`,
          cursor: "pointer",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(139,92,246,0.04)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
      >
        <span style={{
          flex: 1, fontFamily: F.mono, fontSize: 9, fontWeight: 500,
          letterSpacing: "0.32em", color: T.inkMute, textTransform: "uppercase",
        }}>{group.label}</span>
        <span style={{
          fontFamily: F.mono, fontSize: 10, color: T.inkFaint,
          transform: open ? "none" : "rotate(-90deg)", display: "inline-block", transition: "transform 0.12s",
        }}>∨</span>
      </button>
      {open && (
        <div style={{ borderBottom: `1px solid ${T.edge}` }}>
          {group.lines.map((line) => (
            <SidebarLine
              key={line.id}
              lineId={line.id}
              name={line.name}
              selected={selectedLineId === line.id}
              onClick={() => onSelect(line.id, line.name)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── PassivesTab ───────────────────────────────────────────────────────────────

export default function PassivesTab() {
  const subclasses = useEditorStore((s) => s.meta.subclasses);
  const race       = useEditorStore((s) => s.meta.race);

  // Build class groups from selected skill lines (grouped by parent class)
  const classGroups: Group[] = useMemo(() => {
    const byClass = new Map<string, { classLabel: string; lines: LineRef[] }>();
    for (const lineId of subclasses.filter(Boolean)) {
      const raw = CLASS_LINES.find((l) => l.id === lineId);
      if (!raw) continue;
      if (!byClass.has(raw.class_id)) {
        byClass.set(raw.class_id, { classLabel: raw.class, lines: [] });
      }
      byClass.get(raw.class_id)!.lines.push({ id: raw.id, name: raw.name, icon: raw.icon });
    }
    return [...byClass.entries()].map(([classId, { classLabel, lines }]) => ({
      id: `class-${classId}`,
      label: classLabel,
      lines,
    }));
  }, [subclasses]);

  // Racial group
  const racialGroup: Group | null = useMemo(() => {
    const lineId = race ? RACE_LINE[race.toLowerCase()] : undefined;
    if (!lineId) return null;
    const lineName = race.charAt(0).toUpperCase() + race.slice(1);
    return { id: "racial", label: "Racial", lines: [{ id: lineId, name: lineName }] };
  }, [race]);

  const firstLine = useMemo(() => {
    if (classGroups.length > 0) return classGroups[0].lines[0];
    if (racialGroup) return racialGroup.lines[0];
    return FIXED_GROUPS[0].lines[0];
  }, [classGroups, racialGroup]);

  const [selectedLineId,   setSelectedLineId]   = useState(firstLine?.id   ?? "");
  const [selectedLineName, setSelectedLineName] = useState(firstLine?.name ?? "");

  const selectLine = (id: string, name: string) => {
    setSelectedLineId(id);
    setSelectedLineName(name);
  };

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden", gap: 0 }}>

      {/* ── Left sidebar ── */}
      <div style={{
        width: 196, flexShrink: 0,
        borderRight: `1px solid ${T.edge}`,
        overflowY: "auto",
        display: "flex", flexDirection: "column",
      }}>
        {classGroups.length > 0
          ? classGroups.map((g) => (
              <SidebarGroup key={g.id} group={g} selectedLineId={selectedLineId} onSelect={selectLine} />
            ))
          : (
            <div style={{
              padding: "10px 10px 8px",
              fontFamily: F.mono, fontSize: 8, letterSpacing: "0.28em",
              color: T.inkFaint, textTransform: "uppercase",
              borderBottom: `1px solid ${T.edge}`,
            }}>
              ◆ Set class lines in Skills tab
            </div>
          )
        }
        {racialGroup && (
          <SidebarGroup group={racialGroup} selectedLineId={selectedLineId} onSelect={selectLine} />
        )}
        {FIXED_GROUPS.map((g) => (
          <SidebarGroup key={g.id} group={g} selectedLineId={selectedLineId} onSelect={selectLine} />
        ))}
      </div>

      {/* ── Right panel ── */}
      <LinePanel lineId={selectedLineId} lineName={selectedLineName} />
    </div>
  );
}
