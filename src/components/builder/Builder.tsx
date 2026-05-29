import { useEffect } from "react";
import { useEditorStore, type TabKey } from "./state";
import { decodeEditor } from "@/lib/editor-codec";
import { T, F, Diamond, PillBtn } from "./atoms";
import TabBar    from "./TabBar";
import StatsPanel from "./StatsPanel";
import skillLinesRaw from "@/data/eso/skill-lines-index.json";
import racesRaw      from "@/data/eso/races-index.json";
import mundusRaw     from "@/data/eso/mundus-index.json";

// id→name lookups for MetaHeader display
const SKILL_LINE_NAME = new Map(
  (skillLinesRaw as { id: string; name: string }[]).map((sl) => [sl.id, sl.name])
);
const RACE_NAME = new Map(
  (racesRaw as { id: string; name: string }[]).map((r) => [r.id, r.name])
);
const MUNDUS_NAME = new Map(
  (mundusRaw as { id: string; name: string }[]).map((m) => [m.id, m.name])
);
const CLASS_NAME = new Map([
  ["dragonknight", "Dragonknight"], ["sorcerer",    "Sorcerer"   ],
  ["nightblade",   "Nightblade"  ], ["templar",     "Templar"    ],
  ["warden",       "Warden"      ], ["necromancer", "Necromancer"],
  ["arcanist",     "Arcanist"    ],
]);

// Tab panel imports
import GeneralTab      from "./tabs/GeneralTab";
import GuideTab        from "./tabs/GuideTab";
import ProsTab         from "./tabs/ProsTab";
import ShareTab        from "./tabs/ShareTab";
import EquipmentTab    from "./tabs/EquipmentTab";
import SkillsTab       from "./tabs/SkillsTab";
import PassivesTab     from "./tabs/PassivesTab";
import MasteriesTab    from "./tabs/MasteriesTab";
import CpTab           from "./tabs/CpTab";
import AttributesTab   from "./tabs/AttributesTab";
import ConsumablesTab  from "./tabs/ConsumablesTab";
import BuffsTab        from "./buffs/BuffsTab";

// ── MetaHeader ────────────────────────────────────────────────────────────────

const MODES: Array<[key: "cyro" | "bg" | "duel", label: string, extra?: string]> = [
  ["cyro", "Cyro/IC"],
  ["bg",   "BG"     ],
  ["duel", "Duel"   ],
];

function MetaHeader() {
  const meta      = useEditorStore((s) => s.meta);
  const patchMeta = useEditorStore((s) => s.patchMeta);

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 20,
      padding: "12px 20px",
      borderBottom: `1px solid ${T.edge}`,
      background: "rgba(10,6,18,0.6)",
      flexShrink: 0, flexWrap: "wrap",
    }}>
      {/* Build name */}
      <div style={{
        fontFamily: F.cinzel, fontWeight: 700, fontSize: 17,
        letterSpacing: "0.06em", color: T.ink, minWidth: 160,
      }}>
        {meta.name || <span style={{ color: T.inkFaint, fontStyle: "italic", fontWeight: 400 }}>Untitled Build</span>}
      </div>

      {/* Class · Race · Mundus pills */}
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        {[
          ["Class",  meta.classId ? (CLASS_NAME.get(meta.classId)  ?? meta.classId)  : "—"],
          ["Race",   meta.race    ? (RACE_NAME.get(meta.race)       ?? meta.race)     : "—"],
          ["Mundus", meta.mundus  ? (MUNDUS_NAME.get(meta.mundus)   ?? meta.mundus)   : "—"],
        ].map(([label, val]) => (
          <div key={label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{
              fontFamily: F.mono, fontSize: 7, letterSpacing: "0.32em",
              color: T.inkFaint, textTransform: "uppercase",
            }}>{label}</div>
            <div style={{
              height: 24, padding: "0 8px",
              display: "inline-flex", alignItems: "center",
              border: `1px solid ${T.edge}`,
              background: "rgba(139,92,246,0.07)",
              fontFamily: F.mono, fontSize: 10, letterSpacing: "0.12em",
              color: val === "—" ? T.inkFaint : T.inkDim,
            }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Subclasses */}
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        {meta.subclasses.map((sc, i) => {
          const name = sc ? (SKILL_LINE_NAME.get(sc) ?? sc) : null;
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{
                fontFamily: F.mono, fontSize: 7, letterSpacing: "0.32em",
                color: T.inkFaint, textTransform: "uppercase",
              }}>Sub {["I", "II", "III"][i]}</div>
              <div style={{
                height: 24, padding: "0 8px",
                display: "inline-flex", alignItems: "center",
                border: `1px solid ${name ? T.accentSoft + "66" : T.edge}`,
                background: name ? "rgba(139,92,246,0.10)" : "transparent",
                fontFamily: F.display, fontStyle: name ? "normal" : "italic",
                fontSize: 12, color: name ? T.accentSoft : T.inkFaint,
              }}>{name || "— none —"}</div>
            </div>
          );
        })}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Patch */}
      <div style={{
        fontFamily: F.mono, fontSize: 9, letterSpacing: "0.22em",
        color: T.inkMute, textTransform: "uppercase",
      }}>{meta.patch || "U50"}</div>

      {/* Mode pills */}
      <div style={{ display: "flex", gap: 4 }}>
        {MODES.map(([key, label]) => (
          <PillBtn
            key={key}
            active={key === "cyro" ? (meta.mode === "cyro" || meta.mode === "ic") : meta.mode === key}
            onClick={() => patchMeta({ mode: key })}
          >{label}</PillBtn>
        ))}
      </div>
    </div>
  );
}

// ── TabBody ───────────────────────────────────────────────────────────────────

function TabBody({ tab }: { tab: TabKey }) {
  switch (tab) {
    case "general":     return <GeneralTab />;
    case "guide":       return <GuideTab />;
    case "pros":        return <ProsTab />;
    case "share":       return <ShareTab />;
    case "equipment":   return <EquipmentTab />;
    case "skills":      return <SkillsTab />;
    case "passives":    return <PassivesTab />;
    case "masteries":   return <MasteriesTab />;
    case "cp":          return <CpTab />;
    case "attributes":  return <AttributesTab />;
    case "consumables": return <ConsumablesTab />;
    case "buffs":       return <BuffsTab />;
  }
}

// ── Builder ───────────────────────────────────────────────────────────────────

export default function Builder() {
  const activeTab = useEditorStore((s) => s.activeTab);
  const loadState = useEditorStore((s) => s.loadState);
  const setActiveTab = useEditorStore((s) => s.setActiveTab);

  // On first mount: restore build from `?b=` and honour `?tab=` deep-link.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const tabParam = params.get("tab") as TabKey | null;
    if (tabParam) setActiveTab(tabParam);

    const raw = params.get("b");
    if (!raw) return;
    const snap = decodeEditor(raw);
    if (snap) loadState(snap.meta, snap.setups);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/* Desktop-only guard */}
      <div style={{
        display: "none",
        fontFamily: "var(--font-body)",
        color: T.inkMute,
        padding: "40px 20px",
        textAlign: "center",
        fontSize: 14,
      }}
        className="builder-mobile-guard"
      >
        Open on desktop to use the Build Editor (min 1180px).
      </div>

      {/* Main editor shell */}
      <div
        className="builder-shell"
        style={{
          minWidth: 1180,
          background: "radial-gradient(ellipse at 50% 30%, #1d0e44 0%, var(--color-bg) 60%, #06030f 100%)",
          minHeight: "100vh",
          display: "flex", flexDirection: "column",
        }}
      >
        {/* Meta header */}
        <MetaHeader />

        {/* Horizontal tab bar */}
        <TabBar />

        {/* Body: tab content + right stats panel */}
        <div style={{
          flex: 1, display: "flex", minHeight: 0,
        }}>
          {/* Tab content */}
          <div style={{
            flex: 1, minWidth: 0,
            padding: "20px 24px",
            overflowY: "auto", overflowX: "hidden",
          }}>
            <TabBody tab={activeTab} />
          </div>

          {/* Right stats panel */}
          <StatsPanel />
        </div>
      </div>

      {/* Responsive guard CSS */}
      <style>{`
        @media (max-width: 1179px) {
          .builder-shell { display: none !important; }
          .builder-mobile-guard { display: block !important; }
        }
      `}</style>
    </>
  );
}
