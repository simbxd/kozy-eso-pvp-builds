import { useEditorStore, defaultSetup } from "../state";
import { T, F, SectionHead, Diamond } from "../atoms";

export default function SettingsTab() {
  const patchMeta  = useEditorStore((s) => s.patchMeta);
  const { meta, setups, activeSetupIdx } = useEditorStore((s) => ({
    meta: s.meta,
    setups: s.setups,
    activeSetupIdx: s.activeSetupIdx,
  }));

  const resetAll = () => {
    if (!confirm("Reset the entire build? All data will be lost.")) return;
    useEditorStore.setState({
      meta: {
        name: "", slug: "", author: "Kozy", patch: "U50",
        classId: "", race: "", mundus: "",
        subclasses: ["", "", ""],
        mode: "cyro", difficulty: "intermediate",
        featured: false, summary: "", tags: [],
        guide: "", pros: [], cons: [],
      },
      setups: [defaultSetup()],
      activeSetupIdx: 0,
      activeTab: "equipment",
    });
  };

  const resetSetup = () => {
    if (!confirm(`Reset setup ${activeSetupIdx + 1}? Gear, skills, passives, CP, attributes and consumables will be cleared.`)) return;
    useEditorStore.setState((s) => {
      const setups = [...s.setups];
      setups[s.activeSetupIdx] = defaultSetup(s.setups[s.activeSetupIdx].name);
      return { setups };
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22, height: "100%" }}>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* Reset setup */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <SectionHead title="Reset Setup" count={`setup ${activeSetupIdx + 1}`} />
          <p style={{
            fontFamily: F.display, fontStyle: "italic", fontSize: 13,
            color: T.inkMute, lineHeight: 1.5, margin: 0,
          }}>
            Clears all gear, skills, passives, CP, attributes and consumables for the current setup. Build identity (name, author, patch…) is preserved.
          </p>
          <button
            type="button"
            onClick={resetSetup}
            style={{
              alignSelf: "flex-start",
              height: 32, padding: "0 16px",
              border: `1px solid ${T.edgeStrong}`,
              background: "transparent",
              color: T.inkMute,
              fontFamily: F.mono, fontSize: 10, letterSpacing: "0.22em",
              textTransform: "uppercase", cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#f87171";
              (e.currentTarget as HTMLButtonElement).style.color = "#f87171";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = T.edgeStrong;
              (e.currentTarget as HTMLButtonElement).style.color = T.inkMute;
            }}
          >
            Reset current setup
          </button>
        </div>

        {/* Reset all */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <SectionHead title="Reset Build" count="full wipe" />
          <p style={{
            fontFamily: F.display, fontStyle: "italic", fontSize: 13,
            color: T.inkMute, lineHeight: 1.5, margin: 0,
          }}>
            Wipes the entire build including identity, all setups, and guide content. This cannot be undone.
          </p>
          <button
            type="button"
            onClick={resetAll}
            style={{
              alignSelf: "flex-start",
              height: 32, padding: "0 16px",
              border: `1px solid #ef444444`,
              background: "rgba(239,68,68,0.08)",
              color: "#f87171",
              fontFamily: F.mono, fontSize: 10, letterSpacing: "0.22em",
              textTransform: "uppercase", cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.18)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.08)";
            }}
          >
            Reset entire build
          </button>
        </div>
      </div>

      {/* Build info (read-only summary) */}
      <div style={{ marginTop: "auto" }}>
        <SectionHead title="Build Info" count="read-only" />
        <div style={{
          padding: "12px 14px",
          border: `1px solid ${T.edge}`,
          background: "rgba(10,6,18,0.4)",
          display: "flex", gap: 20, flexWrap: "wrap",
        }}>
          {[
            ["Setups",    String(setups.length)],
            ["Class",     meta.classId || "—"],
            ["Race",      meta.race    || "—"],
            ["Patch",     meta.patch   || "—"],
            ["Mode",      meta.mode    || "—"],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <div style={{
                fontFamily: F.mono, fontSize: 8, letterSpacing: "0.32em",
                color: T.inkFaint, textTransform: "uppercase",
              }}>{k}</div>
              <div style={{
                fontFamily: F.mono, fontSize: 12, letterSpacing: "0.06em",
                color: T.inkDim,
              }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
