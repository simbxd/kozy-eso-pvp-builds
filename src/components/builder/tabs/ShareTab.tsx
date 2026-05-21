import { useState, useRef } from "react";
import { useEditorStore } from "../state";
import { T, F, SectionHead } from "../atoms";
import { encodeEditor, decodeEditor } from "@/lib/editor-codec";

// ── helpers ───────────────────────────────────────────────────────────────────

function buildShareUrl(meta: ReturnType<typeof useEditorStore.getState>["meta"],
                       setups: ReturnType<typeof useEditorStore.getState>["setups"]): string {
  if (typeof window === "undefined") return "";
  // Share links point at the read-only viewer (/share), not the editor.
  const url = new URL("/share", window.location.origin);
  url.searchParams.set("b", encodeEditor(meta, setups));
  return url.toString();
}

// ── ActionBtn ─────────────────────────────────────────────────────────────────

function ActionBtn({ children, onClick, variant = "primary", disabled = false }: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "ghost" | "danger";
  disabled?: boolean;
}) {
  const colors = {
    primary: { bg: "rgba(139,92,246,0.22)", border: T.accent,     color: T.accentSoft },
    ghost:   { bg: "transparent",           border: T.edgeStrong,  color: T.inkDim    },
    danger:  { bg: "rgba(239,68,68,0.12)",  border: "#ef4444",     color: "#f87171"   },
  }[variant];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        height: 36, padding: "0 18px",
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
        border: `1px solid ${disabled ? T.edge : colors.border}`,
        background: disabled ? "transparent" : colors.bg,
        color: disabled ? T.inkMute : colors.color,
        fontFamily: F.mono, fontSize: 11, letterSpacing: "0.22em",
        textTransform: "uppercase", cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "opacity 0.15s",
      }}
    >{children}</button>
  );
}

// ── ShareTab ──────────────────────────────────────────────────────────────────

export default function ShareTab() {
  const meta      = useEditorStore((s) => s.meta);
  const setups    = useEditorStore((s) => s.setups);
  const loadState = useEditorStore((s) => s.loadState);
  const reset     = useEditorStore((s) => s.reset);

  const [copyFeedback, setCopyFeedback] = useState<"idle" | "ok" | "fail">("idle");
  const [importVal,    setImportVal]    = useState("");
  const [importError,  setImportError]  = useState("");
  const [showReset,    setShowReset]    = useState(false);
  const urlInputRef = useRef<HTMLInputElement>(null);

  const shareUrl = buildShareUrl(meta, setups);

  // ── Copy ──────────────────────────────────────────────────────────────────

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyFeedback("ok");
    } catch {
      // Fallback: select the input so the user can Ctrl+C
      urlInputRef.current?.select();
      setCopyFeedback("fail");
    }
    setTimeout(() => setCopyFeedback("idle"), 2500);
  };

  // ── Import ────────────────────────────────────────────────────────────────

  const handleImport = () => {
    setImportError("");
    const raw = importVal.trim();
    if (!raw) return;

    // Accept full URL or just the `?b=` value
    let encoded = raw;
    try {
      const u = new URL(raw);
      const b = u.searchParams.get("b");
      if (b) encoded = b;
    } catch {
      // Not a valid URL — treat raw as the encoded string directly
    }

    const snap = decodeEditor(encoded);
    if (!snap) {
      setImportError("Invalid or unrecognisable link. Paste the full share URL.");
      return;
    }

    loadState(snap.meta, snap.setups);
    setImportVal("");
  };

  // ── Reset ─────────────────────────────────────────────────────────────────

  const handleResetConfirm = () => {
    reset();
    setShowReset(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const mono9: React.CSSProperties = {
    fontFamily: F.mono, fontSize: 9, letterSpacing: "0.28em",
    color: T.inkFaint, textTransform: "uppercase",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: 640 }}>

      {/* ── Share link ─────────────────────────────────────────────────── */}
      <div>
        <SectionHead title="Share Link" count="copy url" />

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", gap: 8 }}>
            {/* URL display */}
            <input
              ref={urlInputRef}
              readOnly
              value={shareUrl}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              style={{
                flex: 1,
                height: 36,
                padding: "0 12px",
                background: "rgba(10,6,18,0.55)",
                border: `1px solid ${T.edgeStrong}`,
                color: T.inkDim,
                fontFamily: F.mono, fontSize: 11, letterSpacing: "0.06em",
                outline: "none",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                minWidth: 0,
              }}
            />
            {/* Copy button */}
            <ActionBtn
              onClick={handleCopy}
              variant={copyFeedback === "ok" ? "primary" : "ghost"}
            >
              {copyFeedback === "ok"   ? "✓ Copied"
               : copyFeedback === "fail" ? "Select & Ctrl+C"
               : "Copy link"}
            </ActionBtn>
          </div>

          <div style={mono9}>
            Click the field to select · paste in any browser to load the build
          </div>
        </div>
      </div>

      {/* ── Import ─────────────────────────────────────────────────────── */}
      <div>
        <SectionHead title="Import Build" count="from link" />

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={importVal}
              onChange={(e) => { setImportVal(e.target.value); setImportError(""); }}
              placeholder="Paste share URL here…"
              onKeyDown={(e) => e.key === "Enter" && handleImport()}
              style={{
                flex: 1,
                height: 36,
                padding: "0 12px",
                background: "rgba(10,6,18,0.55)",
                border: `1px solid ${importError ? "#ef4444" : T.edgeStrong}`,
                color: T.ink,
                fontFamily: F.mono, fontSize: 11, letterSpacing: "0.06em",
                outline: "none",
                minWidth: 0,
              }}
            />
            <ActionBtn
              onClick={handleImport}
              variant="ghost"
              disabled={!importVal.trim()}
            >
              Load
            </ActionBtn>
          </div>

          {importError && (
            <div style={{
              fontFamily: F.mono, fontSize: 10, letterSpacing: "0.16em",
              color: "#f87171",
            }}>{importError}</div>
          )}

          <div style={mono9}>
            Paste a full share URL or the raw encoded string — both work
          </div>
        </div>
      </div>

      {/* ── Reset ──────────────────────────────────────────────────────── */}
      <div>
        <SectionHead title="Reset" count="clear all" />

        {!showReset ? (
          <ActionBtn variant="danger" onClick={() => setShowReset(true)}>
            Reset build
          </ActionBtn>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{
              fontFamily: F.mono, fontSize: 11, letterSpacing: "0.14em",
              color: "#f87171",
            }}>
              This will clear all gear, skills, CP, consumables and metadata. Are you sure?
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <ActionBtn variant="danger" onClick={handleResetConfirm}>
                Yes, reset everything
              </ActionBtn>
              <ActionBtn variant="ghost" onClick={() => setShowReset(false)}>
                Cancel
              </ActionBtn>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
