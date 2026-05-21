import type { CSSProperties, ReactNode } from "react";

// ── Design tokens (CSS variable references) ───────────────────────────────────

export const T = {
  ink:        "var(--color-text)",
  inkDim:     "var(--color-text-dim)",
  inkMute:    "var(--color-text-muted)",
  inkFaint:   "var(--color-text-faint)",
  accent:     "var(--color-accent)",
  accentSoft: "var(--color-accent-soft)",
  edge:       "var(--color-edge)",
  edgeStrong: "var(--color-edge-strong)",
  heavy:      "var(--color-armor-heavy)",
  medium:     "var(--color-armor-medium)",
  light:      "var(--color-armor-light)",
  panelBg:    "rgba(10,6,18,0.4)",
  panelBgAlt: "rgba(10,6,18,0.5)",
  rowBg:      "rgba(10,6,18,0.35)",
  rowBgActive:"rgba(139,92,246,0.10)",
} as const;

export const F = {
  display: "var(--font-display)",
  cinzel:  "var(--font-cinzel)",
  mono:    "var(--font-mono)",
} as const;

// ── Diamond ───────────────────────────────────────────────────────────────────

export function Diamond({ size = 6, color = T.accent, filled = true }: {
  size?: number; color?: string; filled?: boolean;
}) {
  return (
    <span style={{
      display: "inline-block", width: size, height: size,
      transform: "rotate(45deg)",
      background: filled ? color : "transparent",
      border: `1px solid ${color}`,
      verticalAlign: "middle",
      flexShrink: 0,
    }} />
  );
}

// ── FieldShell ────────────────────────────────────────────────────────────────

export function FieldShell({ label, placeholder, value, width, mono = false,
  dashed = true, dropdown = true, height = 38,
  onChange, style }: {
  label?: string;
  placeholder?: string;
  value?: string;
  width?: number | string;
  mono?: boolean;
  dashed?: boolean;
  dropdown?: boolean;
  height?: number;
  onChange?: (v: string) => void;
  style?: CSSProperties;
}) {
  const isEditable = !!onChange;
  return (
    <div style={{ width, minWidth: 0, display: "flex", flexDirection: "column", gap: 6, ...style }}>
      {label && (
        <div style={{
          fontFamily: F.mono, fontSize: 10, letterSpacing: "0.28em",
          color: T.inkMute, textTransform: "uppercase",
        }}>{label}</div>
      )}
      <div style={{
        height,
        border: dashed ? `1px dashed ${T.edgeStrong}` : `1px solid ${T.edgeStrong}`,
        background: "rgba(10,6,18,0.55)",
        display: "flex", alignItems: "center", padding: "0 10px",
        fontFamily: mono ? F.mono : F.display,
        fontSize: mono ? 12 : 15,
        color: value ? T.ink : T.inkMute,
        letterSpacing: mono ? "0.06em" : 0,
        gap: 6, cursor: isEditable ? "text" : "default",
      }}>
        {isEditable ? (
          <input
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder ? `— ${placeholder} —` : ""}
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              fontFamily: mono ? F.mono : F.display,
              fontSize: mono ? 12 : 15,
              color: T.ink,
              letterSpacing: mono ? "0.06em" : 0,
              width: "100%",
            }}
          />
        ) : (
          <>
            <span style={{ flex: 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
              {value || (
                <span style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: "0.12em" }}>
                  — {placeholder} —
                </span>
              )}
            </span>
            {dropdown && (
              <svg width="10" height="10" viewBox="0 0 10 10" style={{ opacity: 0.5, flexShrink: 0 }}>
                <path d="M2 4 L5 7 L8 4" fill="none" stroke={T.inkDim} strokeWidth="1.2" />
              </svg>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── PillBtn ───────────────────────────────────────────────────────────────────

export function PillBtn({ children, active, onClick, color = T.accent, mono = true, w }: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  color?: string;
  mono?: boolean;
  w?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        minWidth: w, height: 28, padding: "0 12px",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        border: `1px solid ${active ? color : T.edge}`,
        background: active ? `${color}22` : "transparent",
        color: active ? color : T.inkMute,
        fontFamily: mono ? F.mono : F.display,
        fontSize: 11,
        letterSpacing: mono ? "0.22em" : "0.06em",
        textTransform: "uppercase",
        borderRadius: 2,
        cursor: "pointer",
      }}
    >{children}</button>
  );
}

// ── CompactWeight ─────────────────────────────────────────────────────────────

export function CompactWeight({ active, onChange }: {
  active: string;
  onChange?: (w: string) => void;
}) {
  const items = [
    ["heavy",  "H", T.heavy],
    ["medium", "M", T.medium],
    ["light",  "L", T.light],
  ] as const;
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {items.map(([k, letter, col]) => {
        const on = active === k;
        return (
          <button
            key={k} type="button"
            onClick={() => onChange?.(k)}
            style={{
              width: 30, height: 26,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              border: `1px solid ${on ? col : T.edge}`,
              color: on ? col : T.inkMute,
              background: on ? `${col}1a` : "transparent",
              fontFamily: F.mono, fontSize: 10, fontWeight: 600,
              letterSpacing: "0.12em", textTransform: "uppercase",
              borderRadius: 2, cursor: "pointer",
            }}
          >{letter}</button>
        );
      })}
    </div>
  );
}

// ── SlotIcon ──────────────────────────────────────────────────────────────────

export function SlotIcon({ size = 28, active }: { size?: number; active?: boolean }) {
  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      border: `1px solid ${active ? T.accent : T.edgeStrong}`,
      background: "linear-gradient(135deg, #2a1657 0%, #0e0626 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: T.accentSoft, fontFamily: F.cinzel, fontSize: 14,
      position: "relative",
    }}>
      <span style={{ position: "absolute", inset: 3, border: `1px solid rgba(205,180,255,0.16)` }} />
      ◇
    </div>
  );
}

// ── SectionHead ───────────────────────────────────────────────────────────────

export function SectionHead({ title, count }: { title: string; count?: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6,
    }}>
      <Diamond size={6} />
      <div style={{
        fontFamily: F.cinzel, fontWeight: 600, fontSize: 12,
        letterSpacing: "0.32em", color: T.accentSoft, textTransform: "uppercase",
      }}>{title}</div>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${T.accent}66, transparent)` }} />
      {count && (
        <div style={{
          fontFamily: F.mono, fontSize: 9, letterSpacing: "0.32em",
          color: T.inkMute, textTransform: "uppercase",
        }}>{count}</div>
      )}
    </div>
  );
}

// ── ColHeader ─────────────────────────────────────────────────────────────────

export function ColHeader({ columns, lastLabel }: { columns: string; lastLabel: string }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: columns, gap: 8,
      padding: "0 10px 4px",
      fontFamily: F.mono, fontSize: 8, letterSpacing: "0.32em",
      color: T.inkFaint, textTransform: "uppercase",
      borderBottom: `1px solid ${T.edge}`, marginBottom: 4,
    }}>
      <div /><div>Slot</div><div>Set</div><div>Trait</div><div>Enchant</div>
      <div style={{ textAlign: "right" }}>{lastLabel}</div>
    </div>
  );
}

// ── PanelHeader (Diamond + title + gradient rule + caption) ───────────────────

export function PanelHeader({ title, info }: { title: string; info: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14, flexShrink: 0,
    }}>
      <Diamond size={6} />
      <div style={{
        fontFamily: F.cinzel, fontWeight: 600, fontSize: 13,
        letterSpacing: "0.32em", color: T.accentSoft, textTransform: "uppercase",
      }}>{title}</div>
      <div style={{
        flex: 1, height: 1,
        background: `linear-gradient(90deg, ${T.accent}, transparent)`,
      }} />
      <div style={{
        fontFamily: F.mono, fontSize: 9, letterSpacing: "0.32em",
        color: T.inkFaint, textTransform: "uppercase",
      }}>{info}</div>
    </div>
  );
}
