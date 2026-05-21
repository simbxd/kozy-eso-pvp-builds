import { useState } from "react";
import { useEditorStore } from "../state";
import { T, F, SectionHead } from "../atoms";

// ── ListEditor ────────────────────────────────────────────────────────────────

function ListEditor({
  items, onAdd, onRemove, tint, placeholder,
}: {
  items: string[]; tint: string; placeholder: string;
  onAdd: (v: string) => void; onRemove: (i: number) => void;
}) {
  const [input, setInput] = useState("");

  const submit = () => {
    const v = input.trim();
    if (v) { onAdd(v); setInput(""); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {/* List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {items.map((item, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            padding: "8px 12px",
            border: `1px solid ${T.edge}`,
            background: "rgba(10,6,18,0.4)",
          }}>
            <span style={{
              width: 6, height: 6, transform: "rotate(45deg)",
              background: tint, flexShrink: 0, marginTop: 4,
            }} />
            <span style={{
              flex: 1, fontFamily: F.display, fontSize: 14,
              color: T.ink, lineHeight: 1.4,
            }}>{item}</span>
            <button
              type="button"
              onClick={() => onRemove(i)}
              style={{
                background: "transparent", border: "none", cursor: "pointer",
                color: T.inkFaint, fontFamily: F.mono, fontSize: 13, lineHeight: 1,
                padding: "0 2px", flexShrink: 0,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#ef4444"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = T.inkFaint; }}
            >×</button>
          </div>
        ))}
        {items.length === 0 && (
          <div style={{
            padding: "12px", fontFamily: F.mono, fontSize: 10,
            color: T.inkFaint, letterSpacing: "0.22em", textTransform: "uppercase",
            border: `1px dashed ${T.edge}`, textAlign: "center",
          }}>empty — add below</div>
        )}
      </div>
      {/* Input */}
      <div style={{ display: "flex", gap: 6 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }}
          placeholder={placeholder}
          style={{
            flex: 1, height: 32, padding: "0 10px",
            border: `1px dashed ${T.edge}`,
            background: "rgba(10,6,18,0.55)",
            color: T.ink,
            fontFamily: F.display, fontStyle: "italic", fontSize: 13,
            outline: "none",
          }}
        />
        <button
          type="button"
          onClick={submit}
          style={{
            height: 32, padding: "0 12px", flexShrink: 0,
            border: `1px solid ${tint}`,
            background: `${tint}22`,
            color: tint,
            fontFamily: F.mono, fontSize: 10, letterSpacing: "0.22em",
            textTransform: "uppercase", cursor: "pointer",
          }}
        >Add</button>
      </div>
    </div>
  );
}

// ── ProsTab ───────────────────────────────────────────────────────────────────

export default function ProsTab() {
  const pros      = useEditorStore((s) => s.meta.pros);
  const cons      = useEditorStore((s) => s.meta.cons);
  const patchMeta = useEditorStore((s) => s.patchMeta);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, height: "100%" }}>

      {/* Pros */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <SectionHead title="Strengths" count="pros" />
        <ListEditor
          items={pros}
          tint="#6ee7b7"
          placeholder="High burst damage…"
          onAdd={(v) => patchMeta({ pros: [...pros, v] })}
          onRemove={(i) => patchMeta({ pros: pros.filter((_, j) => j !== i) })}
        />
      </div>

      {/* Cons */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <SectionHead title="Weaknesses" count="cons" />
        <ListEditor
          items={cons}
          tint="#fca5a5"
          placeholder="Susceptible to gap closers…"
          onAdd={(v) => patchMeta({ cons: [...cons, v] })}
          onRemove={(i) => patchMeta({ cons: cons.filter((_, j) => j !== i) })}
        />
      </div>

    </div>
  );
}
