import { useEditorStore, type TabKey } from "./state";
import { T, F } from "./atoms";

// ── SidebarItem ───────────────────────────────────────────────────────────────

function SidebarItem({ tabKey, label, activeTab, onSelect }: {
  tabKey: TabKey;
  label: string;
  activeTab: TabKey;
  onSelect: (t: TabKey) => void;
}) {
  const on = tabKey === activeTab;
  return (
    <button
      type="button"
      onClick={() => onSelect(tabKey)}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "7px 10px", width: "100%", textAlign: "left",
        background: on ? "rgba(139,92,246,0.15)" : "transparent",
        borderLeft: on ? `2px solid ${T.accent}` : "2px solid transparent",
        marginLeft: -2,
        border: "none", cursor: "pointer",
        // re-apply border-left on top of border:none
        outline: "none",
      }}
      // Need to re-declare borderLeft here since border:none resets it
      onFocus={(e) => { if (!on) e.currentTarget.style.background = "rgba(139,92,246,0.06)"; }}
      onBlur={(e) => { if (!on) e.currentTarget.style.background = "transparent"; }}
    >
      <span style={{
        fontFamily: F.cinzel, fontSize: 13, width: 14, textAlign: "center", flexShrink: 0,
        color: on ? T.accentSoft : T.inkFaint,
      }}>◇</span>
      <span style={{
        fontFamily: F.display, fontSize: 14, letterSpacing: "0.02em",
        fontStyle: on ? "normal" : "italic",
        fontWeight: on ? 600 : 400,
        color: on ? T.ink : T.inkDim,
      }}>{label}</span>
    </button>
  );
}

function SectionHead({ children }: { children: string }) {
  return (
    <div style={{
      fontFamily: F.mono, fontSize: 9, fontWeight: 500,
      letterSpacing: "0.32em", color: T.inkMute, textTransform: "uppercase",
      padding: "0 10px 8px",
    }}>{children}</div>
  );
}

// ── BuildSidebar ──────────────────────────────────────────────────────────────

const BUILD_ITEMS: Array<[TabKey, string]> = [
  ["general",  "General"    ],
  ["guide",    "Guide"      ],
  ["pros",     "Pros & Cons"],
  ["share",    "Share"      ],
];

const SETUP_ITEMS: Array<[TabKey, string]> = [
  ["equipment",   "Equipment"  ],
  ["skills",      "Skills"     ],
  ["passives",    "Passives"   ],
  ["masteries",   "Masteries"  ],
  ["cp",          "CP"         ],
  ["attributes",  "Attributes" ],
  ["consumables", "Consumables"],
];

export default function BuildSidebar() {
  const activeTab    = useEditorStore((s) => s.activeTab);
  const setActiveTab = useEditorStore((s) => s.setActiveTab);

  return (
    <div style={{
      width: 210, flexShrink: 0,
      border: `1px solid ${T.edge}`, background: T.panelBgAlt,
      padding: "16px 8px",
      display: "flex", flexDirection: "column", gap: 14,
      overflow: "hidden",
    }}>
      {/* ◆ Build */}
      <div>
        <SectionHead>◆ Build</SectionHead>
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {BUILD_ITEMS.map(([k, label]) => (
            <SidebarItem key={k} tabKey={k} label={label} activeTab={activeTab} onSelect={setActiveTab} />
          ))}
        </div>
      </div>

      {/* ◆ Setup */}
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        <SectionHead>◆ Setup</SectionHead>
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {SETUP_ITEMS.map(([k, label]) => (
            <SidebarItem key={k} tabKey={k} label={label} activeTab={activeTab} onSelect={setActiveTab} />
          ))}
        </div>
      </div>
    </div>
  );
}
