import { useMemo, useRef, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { T, F } from "./index";

// ── Types ─────────────────────────────────────────────────────────────────────

export type SelectItem = {
  id: string;
  label: string;
  sub?: string;    // caption / second line
  badge?: string;  // small tag on the right
  icon?: string;   // image URL
};

const CAP = 80;

// ── SearchSelect ──────────────────────────────────────────────────────────────

export function SearchSelect({
  value,
  onChange,
  items,
  placeholder = "— select —",
  searchPlaceholder = "Search…",
  searchable = true,
  height = 36,
  popoverWidth = 300,
  disabled = false,
}: {
  value?: string;
  onChange: (id: string) => void;
  items: SelectItem[];
  placeholder?: string;
  searchPlaceholder?: string;
  searchable?: boolean;
  height?: number;
  popoverWidth?: number;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ]       = useState("");
  const inputRef        = useRef<HTMLInputElement>(null);

  const selected = items.find((i) => i.id === value);

  const matches = useMemo(() => {
    if (!searchable) return items;
    const n = q.trim().toLowerCase();
    if (!n) return items;
    const hits = items.filter((i) => i.label.toLowerCase().includes(n));
    // Sort: exact startsWith first, then the rest (stable within each group)
    hits.sort((a, b) => {
      const aStarts = a.label.toLowerCase().startsWith(n) ? 0 : 1;
      const bStarts = b.label.toLowerCase().startsWith(n) ? 0 : 1;
      return aStarts - bStarts;
    });
    return hits;
  }, [q, items, searchable]);

  const shown    = matches.slice(0, CAP);
  const overflow = matches.length - shown.length;

  const pick = (id: string) => {
    onChange(id);
    setOpen(false);
    setQ("");
  };

  return (
    <Popover.Root open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQ(""); }}>
      <Popover.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          style={{
            width: "100%", height,
            display: "flex", alignItems: "center", gap: 8, padding: "0 10px",
            border: `1px ${selected ? "solid" : "dashed"} ${selected ? T.edgeStrong : T.edgeStrong}`,
            background: selected ? "rgba(139,92,246,0.07)" : "rgba(10,6,18,0.55)",
            color: selected ? T.ink : T.inkMute,
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.5 : 1,
            textAlign: "left",
            outline: "none",
          }}
        >
          {selected?.icon && (
            <img
              src={selected.icon} alt=""
              style={{ width: 20, height: 20, borderRadius: "50%", flexShrink: 0, clipPath: "circle(50%)" }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
          )}
          <span style={{
            flex: 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
            fontFamily: F.display, fontSize: 14,
          }}>
            {selected ? selected.label : (
              <span style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: "0.12em", color: T.inkMute }}>
                {placeholder}
              </span>
            )}
          </span>
          <svg width="10" height="10" viewBox="0 0 10 10" style={{ opacity: 0.4, flexShrink: 0 }}>
            <path d="M2 4 L5 7 L8 4" fill="none" stroke={T.inkDim} strokeWidth="1.4" />
          </svg>
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          sideOffset={4}
          align="start"
          style={{
            width: popoverWidth, zIndex: 9999,
            border: `1px solid ${T.edgeStrong}`,
            background: "#0e0b1a",
            boxShadow: "0 8px 32px rgba(0,0,0,0.7)",
            padding: 8,
          }}
          onOpenAutoFocus={(e) => { e.preventDefault(); setTimeout(() => inputRef.current?.focus(), 10); }}
        >
          {/* Search input */}
          {searchable && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8, padding: "6px 10px",
              border: `1px solid ${T.edge}`,
              background: "rgba(10,6,18,0.7)",
              marginBottom: 6,
            }}>
              <svg width="12" height="12" viewBox="0 0 12 12" style={{ opacity: 0.5, flexShrink: 0 }}>
                <circle cx="5" cy="5" r="4" fill="none" stroke={T.inkMute} strokeWidth="1.3"/>
                <line x1="8.2" y1="8.2" x2="11" y2="11" stroke={T.inkMute} strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={searchPlaceholder}
                style={{
                  flex: 1, background: "transparent", border: "none", outline: "none",
                  fontFamily: F.display, fontSize: 13,
                  color: T.ink,
                }}
              />
            </div>
          )}

          {/* Clear */}
          {value && (
            <button
              type="button"
              onClick={() => pick("")}
              style={{
                width: "100%", padding: "5px 10px", textAlign: "left", marginBottom: 4,
                background: "transparent", border: "none", cursor: "pointer",
                fontFamily: F.mono, fontSize: 10, letterSpacing: "0.22em",
                color: T.inkMute, textTransform: "uppercase",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#ef4444"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = T.inkMute; }}
            >× Clear</button>
          )}

          {/* List */}
          <div style={{ maxHeight: 280, overflowY: "auto" }}>
            {shown.map((item) => {
              const active = item.id === value;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => pick(item.id)}
                  style={{
                    width: "100%", padding: "7px 10px",
                    display: "flex", alignItems: "center", gap: 8, textAlign: "left",
                    background: active ? "rgba(139,92,246,0.15)" : "transparent",
                    border: "none", cursor: "pointer",
                    borderLeft: active ? `2px solid ${T.accent}` : "2px solid transparent",
                  }}
                  onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "rgba(139,92,246,0.07)"; }}
                  onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                >
                  {item.icon && (
                    <img
                      src={item.icon} alt=""
                      style={{ width: 18, height: 18, borderRadius: "50%", flexShrink: 0, clipPath: "circle(50%)" }}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: F.display, fontSize: 13,
                      color: active ? T.accentSoft : T.ink,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>{item.label}</div>
                    {item.sub && (
                      <div style={{
                        fontFamily: F.mono, fontSize: 9, letterSpacing: "0.12em",
                        color: T.inkMute,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        marginTop: 2,
                      }}>{item.sub}</div>
                    )}
                  </div>
                  {item.badge && (
                    <div style={{
                      fontFamily: F.mono, fontSize: 8, letterSpacing: "0.22em",
                      color: T.inkFaint, textTransform: "uppercase", flexShrink: 0,
                    }}>{item.badge}</div>
                  )}
                </button>
              );
            })}
            {shown.length === 0 && (
              <div style={{
                padding: "12px 10px",
                fontFamily: F.mono, fontSize: 11, color: T.inkMute, textAlign: "center",
              }}>No results</div>
            )}
            {overflow > 0 && (
              <div style={{
                padding: "6px 10px",
                fontFamily: F.mono, fontSize: 9, letterSpacing: "0.22em",
                color: T.inkFaint, textTransform: "uppercase", textAlign: "center",
              }}>+{overflow} more — refine search</div>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
