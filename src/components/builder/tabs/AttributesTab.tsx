import { useRef, useCallback } from "react";
import { useEditorStore } from "../state";
import { T, F, Diamond } from "../atoms";

// ── AttrBar ───────────────────────────────────────────────────────────────────

const PRESETS = [0, 8, 16, 24, 32, 40, 48, 56, 64];

function AttrBar({ label, value, tint, onChange }: {
  label: string; value: number; tint: string;
  onChange: (v: number) => void;
}) {
  const pct      = (value / 64) * 100;
  const trackRef = useRef<HTMLDivElement>(null);

  const valueFromX = useCallback((clientX: number) => {
    if (!trackRef.current) return value;
    const { left, width } = trackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - left) / width));
    return Math.round(ratio * 64);
  }, [value]);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    onChange(valueFromX(e.clientX));
  }, [valueFromX, onChange]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return;
    onChange(valueFromX(e.clientX));
  }, [valueFromX, onChange]);

  return (
    <div style={{
      padding: "20px 22px",
      border: `1px solid ${T.edgeStrong}`,
      background: "rgba(10,6,18,0.55)",
    }}>
      {/* Label + value */}
      <div style={{ display: "flex", alignItems: "baseline", marginBottom: 18 }}>
        <div style={{
          fontFamily: F.mono, fontSize: 11, letterSpacing: "0.32em",
          color: tint, textTransform: "uppercase",
        }}>{label}</div>
        <div style={{ flex: 1 }} />
        <div style={{
          fontFamily: F.cinzel, fontSize: 36, color: T.ink, fontWeight: 600, lineHeight: 1,
        }}>{value}</div>
        <div style={{
          fontFamily: F.mono, fontSize: 11, color: T.inkMute,
          letterSpacing: "0.22em", marginLeft: 6,
        }}>/ 64</div>
      </div>

      {/* ── Slider track ── */}
      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        style={{
          position: "relative",
          height: 6,
          background: T.edge,
          cursor: "ew-resize",
          /* hit area plus large */
          padding: "8px 0",
          margin: "-8px 0",
          boxSizing: "content-box",
        }}
      >
        {/* Fond rail */}
        <div style={{
          position: "absolute", left: 0, right: 0,
          top: "50%", transform: "translateY(-50%)",
          height: 6, background: T.edge, pointerEvents: "none",
        }}>
          {/* Fill */}
          <div style={{
            position: "absolute", inset: 0, width: `${pct}%`,
            background: `linear-gradient(90deg, ${tint}cc, ${tint}66)`,
            transition: "width 60ms linear",
          }} />
        </div>

        {/* Thumb */}
        <div style={{
          position: "absolute",
          left: `${pct}%`,
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: 14, height: 14,
          background: tint,
          border: `2px solid rgba(10,6,18,0.9)`,
          borderRadius: "50%",
          boxShadow: `0 0 6px ${tint}88`,
          pointerEvents: "none",
          transition: "left 60ms linear",
        }} />
      </div>

      {/* Presets */}
      <div style={{ marginTop: 22, display: "flex", gap: 6, flexWrap: "wrap" }}>
        {PRESETS.map((v) => (
          <button
            key={v} type="button"
            onClick={() => onChange(v)}
            style={{
              padding: "4px 10px",
              fontFamily: F.mono, fontSize: 10, letterSpacing: "0.22em",
              border: `1px solid ${v === value ? tint : T.edge}`,
              color: v === value ? tint : T.inkMute,
              background: v === value ? `${tint}1a` : "transparent",
              cursor: "pointer", borderRadius: 2,
            }}
          >{v}</button>
        ))}
      </div>
    </div>
  );
}

// ── AttributesTab ─────────────────────────────────────────────────────────────

export default function AttributesTab() {
  const attrs   = useEditorStore((s) => s.setups[s.activeSetupIdx].attributes);
  const setAttr = useEditorStore((s) => s.setAttr);

  const total = attrs.health + attrs.magicka + attrs.stamina;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 4, flexShrink: 0 }}>
        <Diamond size={6} />
        <div style={{
          fontFamily: F.cinzel, fontWeight: 600, fontSize: 14, letterSpacing: "0.32em",
          color: T.accentSoft, textTransform: "uppercase",
        }}>Attribute Points</div>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${T.accent}, transparent)` }} />
        <div style={{
          fontFamily: F.mono, fontSize: 10, letterSpacing: "0.28em",
          color: total === 64 ? T.accentSoft : T.inkMute, textTransform: "uppercase",
        }}>{total} / 64 spent</div>
      </div>

      <AttrBar label="Health"  value={attrs.health}  tint="#e88f8f"
        onChange={(v) => setAttr("health", v)} />
      <AttrBar label="Magicka" value={attrs.magicka} tint={T.light}
        onChange={(v) => setAttr("magicka", v)} />
      <AttrBar label="Stamina" value={attrs.stamina} tint={T.medium}
        onChange={(v) => setAttr("stamina", v)} />
    </div>
  );
}
