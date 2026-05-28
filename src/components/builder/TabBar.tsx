import { Fragment } from "react";
import { useEditorStore, type TabKey } from "./state";
import { T, F } from "./atoms";

// ── Tab definitions ───────────────────────────────────────────────────────────

type TabDef = { key: TabKey; label: string };

const GROUP_BUILD: TabDef[] = [
  { key: "general",  label: "General"   },
  { key: "guide",    label: "Guide"     },
  { key: "pros",     label: "Pros"      },
];

const GROUP_SETUP: TabDef[] = [
  { key: "attributes",  label: "Attributes"  },
  { key: "equipment",   label: "Equipment"   },
  { key: "skills",      label: "Skills"      },
  { key: "buffs",       label: "Buffs"       },
  { key: "passives",    label: "Passives"    },
  { key: "masteries",   label: "Masteries"   },
  { key: "cp",          label: "CP"          },
  { key: "consumables", label: "Consumables" },
];

const GROUP_EXPORT: TabDef[] = [
  { key: "share", label: "Share" },
];

// ── TabBtn ────────────────────────────────────────────────────────────────────

function TabBtn({ def, active, onClick }: {
  def: TabDef;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: "relative",
        height: 40,
        padding: "0 14px",
        background: "transparent",
        border: "none",
        borderBottom: active ? `2px solid ${T.accent}` : "2px solid transparent",
        cursor: "pointer",
        display: "flex", alignItems: "center",
        fontFamily: F.mono,
        fontSize: 10,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color: active ? T.accentSoft : T.inkMute,
        transition: "color 0.12s, border-color 0.12s",
        whiteSpace: "nowrap",
        marginBottom: -1, // overlap the border-bottom of container
      }}
      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = T.inkDim; }}
      onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = T.inkMute; }}
    >
      {def.label}
    </button>
  );
}

// ── Separator ────────────────────────────────────────────────────────────────

function Sep() {
  return (
    <div style={{
      width: 1, height: 16, alignSelf: "center",
      background: `linear-gradient(180deg, transparent, ${T.edge}, transparent)`,
      flexShrink: 0, margin: "0 4px",
    }} />
  );
}

// ── TabBar ────────────────────────────────────────────────────────────────────

export default function TabBar() {
  const activeTab    = useEditorStore((s) => s.activeTab);
  const setActiveTab = useEditorStore((s) => s.setActiveTab);

  const groups = [GROUP_BUILD, GROUP_SETUP, GROUP_EXPORT];

  return (
    <div style={{
      display: "flex", alignItems: "stretch",
      padding: "0 20px",
      borderBottom: `1px solid ${T.edge}`,
      background: "rgba(10,6,18,0.5)",
      flexShrink: 0,
      overflowX: "auto",
      gap: 0,
      // Hide scrollbar
      scrollbarWidth: "none",
    }}>
      {groups.map((group, gi) => (
        <Fragment key={gi}>
          {gi > 0 && <Sep />}
          {group.map((def) => (
            <TabBtn
              key={def.key}
              def={def}
              active={activeTab === def.key}
              onClick={() => setActiveTab(def.key)}
            />
          ))}
        </Fragment>
      ))}
    </div>
  );
}
