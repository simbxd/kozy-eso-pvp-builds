import { useEditorStore } from "../state";
import { T, F, SectionHead } from "../atoms";

export default function GuideTab() {
  const guide     = useEditorStore((s) => s.meta.guide);
  const patchMeta = useEditorStore((s) => s.patchMeta);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%" }}>
      <SectionHead title="Guide" count="rotation & tips" />
      <textarea
        value={guide}
        onChange={(e) => patchMeta({ guide: e.target.value })}
        placeholder={"Write your rotation, tips, and playstyle notes here…\n\nExample:\n— Opening burst: Igneous Shield → Eruption → Standard of Might\n— Sustain: Block-cancel Heavy Attacks on Earthen Heart skills\n— vs tanky enemies: switch to Two-Handed bar for execute range"}
        style={{
          flex: 1,
          padding: "14px 16px",
          border: `1px dashed ${T.edgeStrong}`,
          background: "rgba(10,6,18,0.55)",
          color: guide ? T.ink : T.inkMute,
          fontFamily: F.display, fontStyle: "italic", fontSize: 14,
          lineHeight: 1.7, resize: "none",
          outline: "none",
        }}
      />
      <div style={{
        fontFamily: F.mono, fontSize: 9, letterSpacing: "0.22em",
        color: T.inkFaint, textTransform: "uppercase",
      }}>
        {guide.length} chars — plain text, no markdown rendering yet
      </div>
    </div>
  );
}
