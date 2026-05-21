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
  ["general",  "General"   ],
  ["guide",    "Guide"     ],
  ["pros",     "Pros & Cons"],
  ["settings", "Settings"  ],
];

const SETUP_ITEMS: Array<[TabKey, string]> = [
  ["character",   "Character"  ],
  ["equipment",   "Equipment"  ],
  ["skills",      "Skills"     ],
  ["passives",    "Passives"   ],
  ["masteries",   "Masteries"  ],
  ["cp",          "CP"         ],
  ["attributes",  "Attributes" ],
  ["consumables", "Consumables"],
  ["screenshots", "Screenshots"],
];

export default function BuildSidebar() {
  const activeTab      = useEditorStore((s) => s.activeTab);
  const setActiveTab   = useEditorStore((s) => s.setActiveTab);
  const setups         = useEditorStore((s) => s.setups);
  const activeSetupIdx = useEditorStore((s) => s.activeSetupIdx);
  const setActiveSetup = useEditorStore((s) => s.setActiveSetup);
  const addSetup       = useEditorStore((s) => s.addSetup);

  const currentSetup = setups[activeSetupIdx];

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

      {/* Current Setup */}
      <div>
        <SectionHead>Current Setup · {activeSetupIdx + 1} / {setups.length}</SectionHead>
        <div style={{ display: "flex", gap: 6, padding: "0 8px" }}>
          {/* Setup name dropdown */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              height: 32,
              border: `1px dashed ${T.edgeStrong}`,
              background: "rgba(10,6,18,0.55)",
              display: "flex", alignItems: "center", padding: "0 10px",
              fontFamily: F.mono, fontSize: 12, color: T.inkDim, letterSpacing: "0.06em",
              gap: 6,
            }}>
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {currentSetup.name}
              </span>
              {setups.length > 1 && (
                <svg width="10" height="10" viewBox="0 0 10 10" style={{ opacity: 0.5, flexShrink: 0 }}>
                  <path d="M2 4 L5 7 L8 4" fill="none" stroke={T.inkDim} strokeWidth="1.2" />
                </svg>
              )}
            </div>
          </div>
          {/* + button */}
          <button
            type="button"
            onClick={addSetup}
            disabled={setups.length >= 5}
            aria-label="Add new setup"
            style={{
              width: 32, height: 32, flexShrink: 0,
              border: `1px solid ${T.accent}`,
              background: setups.length >= 5 ? "transparent" : "rgba(139,92,246,0.18)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: setups.length >= 5 ? T.inkMute : T.accentSoft,
              fontFamily: F.cinzel, fontSize: 18, lineHeight: 1,
              cursor: setups.length >= 5 ? "not-allowed" : "pointer",
              opacity: setups.length >= 5 ? 0.4 : 1,
            }}
          >+</button>
        </div>
        {/* Setup tabs (if multiple) */}
        {setups.length > 1 && (
          <div style={{ display: "flex", gap: 4, padding: "8px 8px 0", flexWrap: "wrap" }}>
            {setups.map((s, i) => (
              <button
                key={i} type="button"
                onClick={() => setActiveSetup(i)}
                style={{
                  height: 22, padding: "0 8px",
                  display: "inline-flex", alignItems: "center",
                  border: `1px solid ${i === activeSetupIdx ? T.accent : T.edge}`,
                  background: i === activeSetupIdx ? "rgba(139,92,246,0.18)" : "transparent",
                  color: i === activeSetupIdx ? T.accentSoft : T.inkMute,
                  fontFamily: F.mono, fontSize: 9, letterSpacing: "0.12em",
                  borderRadius: 2, cursor: "pointer",
                }}
              >{i + 1}</button>
            ))}
          </div>
        )}
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
