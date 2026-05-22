import { useEffect } from "react";
import { useEditorStore, type TabKey } from "./state";
import { decodeEditor } from "@/lib/editor-codec";
import { T, F, Diamond, PanelHeader, PillBtn } from "./atoms";
import BuildSidebar from "./BuildSidebar";

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

// ── Tab panel info (title + info caption shown in PanelHeader) ────────────────

const PANEL_INFO: Record<TabKey, [string, string]> = {
  general:     ["General",          "identity · class · race · mode"],
  guide:       ["Guide",            "written rotation & tips"],
  pros:        ["Pros & Cons",      "strengths & weaknesses"],
  share:       ["Share",            "copy link · import · reset"],
  equipment:   ["Equipment",        "armor · jewelry · weapons"],
  skills:      ["Skills",           "bar 1 · bar 2"],
  passives:    ["Passives",         "skill line ranks"],
  masteries:   ["Masteries",        "class mastery passives · U50"],
  cp:          ["Champion Points",  "warfare · fitness"],
  attributes:  ["Attributes",       "64 pts total"],
  consumables: ["Consumables",      "mundus · food · potion"],
};

// ── MetaHeader ────────────────────────────────────────────────────────────────

const MODES: Array<["cyro" | "bg" | "ic" | "duel", string]> = [
  ["cyro", "Cyro"],
  ["bg",   "BG"  ],
  ["ic",   "IC"  ],
  ["duel", "Duel"],
];

function MetaHeader() {
  const meta      = useEditorStore((s) => s.meta);
  const patchMeta = useEditorStore((s) => s.patchMeta);

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 20,
      padding: "14px 20px",
      borderBottom: `1px solid ${T.edge}`,
      background: "rgba(10,6,18,0.6)",
      flexShrink: 0, flexWrap: "wrap",
    }}>
      {/* Build name */}
      <div style={{
        fontFamily: F.cinzel, fontWeight: 700, fontSize: 18,
        letterSpacing: "0.06em", color: T.ink, minWidth: 160,
      }}>
        {meta.name || <span style={{ color: T.inkFaint, fontStyle: "italic", fontWeight: 400 }}>Untitled Build</span>}
      </div>

      {/* Class · Race · Mundus pills */}
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        {[
          ["Class",  meta.classId || "—"],
          ["Race",   meta.race    || "—"],
          ["Mundus", meta.mundus  || "—"],
        ].map(([label, val]) => (
          <div key={label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{
              fontFamily: F.mono, fontSize: 8, letterSpacing: "0.32em",
              color: T.inkFaint, textTransform: "uppercase",
            }}>{label}</div>
            <div style={{
              height: 26, padding: "0 10px",
              display: "inline-flex", alignItems: "center",
              border: `1px solid ${T.edge}`,
              background: "rgba(139,92,246,0.08)",
              fontFamily: F.mono, fontSize: 11, letterSpacing: "0.12em",
              color: val === "—" ? T.inkFaint : T.inkDim,
            }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Subclasses */}
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        {meta.subclasses.map((sc, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{
              fontFamily: F.mono, fontSize: 8, letterSpacing: "0.32em",
              color: T.inkFaint, textTransform: "uppercase",
            }}>Sub {["I", "II", "III"][i]}</div>
            <div style={{
              height: 26, padding: "0 10px",
              display: "inline-flex", alignItems: "center",
              border: `1px solid ${sc ? T.accentSoft + "66" : T.edge}`,
              background: sc ? "rgba(139,92,246,0.10)" : "transparent",
              fontFamily: F.display, fontStyle: sc ? "normal" : "italic",
              fontSize: 13, color: sc ? T.accentSoft : T.inkFaint,
            }}>{sc || "— none —"}</div>
          </div>
        ))}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Patch */}
      <div style={{
        fontFamily: F.mono, fontSize: 10, letterSpacing: "0.22em",
        color: T.inkMute, textTransform: "uppercase",
      }}>{meta.patch || "U50"}</div>

      {/* Mode pills */}
      <div style={{ display: "flex", gap: 4 }}>
        {MODES.map(([key, label]) => (
          <PillBtn
            key={key}
            active={meta.mode === key}
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
  }
}

// ── Builder ───────────────────────────────────────────────────────────────────

export default function Builder() {
  const activeTab = useEditorStore((s) => s.activeTab);
  const loadState = useEditorStore((s) => s.loadState);
  const [panelTitle, panelInfo] = PANEL_INFO[activeTab];

  const setActiveTab = useEditorStore((s) => s.setActiveTab);

  // On first mount: restore build from `?b=` and honour `?tab=` deep-link.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Deep-link to a specific tab (e.g. ?tab=share)
    const tabParam = params.get("tab") as TabKey | null;
    if (tabParam) setActiveTab(tabParam);

    // Restore encoded build state
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

        {/* Body: sidebar + panel */}
        <div style={{
          flex: 1, display: "flex", minHeight: 0,
        }}>
          {/* Left sidebar */}
          <BuildSidebar />

          {/* Right panel */}
          <div style={{
            flex: 1, minWidth: 0,
            display: "flex", flexDirection: "column",
            padding: "20px 24px",
            overflow: "hidden",
          }}>
            {/* Coming soon banner */}
            <div style={{
              marginBottom: 12,
              padding: "7px 14px",
              background: "rgba(139,92,246,0.07)",
              border: `1px solid ${T.accent}33`,
              fontFamily: F.mono, fontSize: 10, letterSpacing: "0.18em",
              color: T.inkMute, textTransform: "uppercase",
            }}>
              ◆ Calculated stats — coming soon
            </div>
            <PanelHeader title={panelTitle} info={panelInfo} />
            <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
              <TabBody tab={activeTab} />
            </div>
          </div>
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
