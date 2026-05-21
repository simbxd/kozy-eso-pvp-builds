import { useState, useRef } from "react";
import { useEditorStore } from "../state";
import { T, F, SectionHead } from "../atoms";
import { encodeEditor, decodeEditor } from "@/lib/editor-codec";

// ── helpers ───────────────────────────────────────────────────────────────────

function buildLongUrl(meta: ReturnType<typeof useEditorStore.getState>["meta"],
                      setups: ReturnType<typeof useEditorStore.getState>["setups"]): string {
  if (typeof window === "undefined") return "";
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

  // Short URL state
  const [shortUrl,       setShortUrl]       = useState<string | null>(null);
  const [shortStatus,    setShortStatus]    = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [shortCopy,      setShortCopy]      = useState<"idle" | "ok">("idle");

  // Long URL state
  const [copyFeedback,   setCopyFeedback]   = useState<"idle" | "ok" | "fail">("idle");

  // Import state
  const [importVal,      setImportVal]      = useState("");
  const [importError,    setImportError]    = useState("");

  // Reset state
  const [showReset,      setShowReset]      = useState(false);

  const urlInputRef   = useRef<HTMLInputElement>(null);
  const shortInputRef = useRef<HTMLInputElement>(null);

  // ── Short URL ─────────────────────────────────────────────────────────────

  const handleGetShortLink = async () => {
    setShortStatus("loading");
    setShortUrl(null);
    try {
      const snap = { v: 1, meta, setups };
      const res = await fetch("/api/builds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(snap),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { url } = await res.json() as { id: string; url: string };
      setShortUrl(url);
      setShortStatus("ok");
    } catch {
      setShortStatus("error");
    }
  };

  const handleCopyShort = async () => {
    if (!shortUrl) return;
    try {
      await navigator.clipboard.writeText(shortUrl);
    } catch {
      shortInputRef.current?.select();
    }
    setShortCopy("ok");
    setTimeout(() => setShortCopy("idle"), 2500);
  };

  // ── Long URL copy ─────────────────────────────────────────────────────────

  const longUrl = buildLongUrl(meta, setups);

  const handleCopyLong = async () => {
    try {
      await navigator.clipboard.writeText(longUrl);
      setCopyFeedback("ok");
    } catch {
      urlInputRef.current?.select();
      setCopyFeedback("fail");
    }
    setTimeout(() => setCopyFeedback("idle"), 2500);
  };

  // ── Import ────────────────────────────────────────────────────────────────

  const handleImport = async () => {
    setImportError("");
    const raw = importVal.trim();
    if (!raw) return;

    // Try short URL: /share?id=xxx → fetch from API
    try {
      const u = new URL(raw);
      const id = u.searchParams.get("id");
      if (id) {
        const res = await fetch(`/api/builds/${id}`);
        if (!res.ok) { setImportError("Build not found or link expired."); return; }
        const snap = await res.json() as { v: 1; meta: typeof meta; setups: typeof setups };
        if (!snap || snap.v !== 1) { setImportError("Invalid build data."); return; }
        loadState(snap.meta, snap.setups);
        setImportVal("");
        return;
      }
    } catch { /* not a valid URL, fall through */ }

    // Try long URL: /share?b=xxx or raw encoded string
    let encoded = raw;
    try {
      const u = new URL(raw);
      const b = u.searchParams.get("b");
      if (b) encoded = b;
    } catch { /* raw string */ }

    const snap = decodeEditor(encoded);
    if (!snap) {
      setImportError("Invalid or unrecognisable link. Paste the full share URL.");
      return;
    }
    loadState(snap.meta, snap.setups);
    setImportVal("");
  };

  // ── Reset ─────────────────────────────────────────────────────────────────

  const handleResetConfirm = () => { reset(); setShowReset(false); };

  // ── Render ────────────────────────────────────────────────────────────────

  const mono9: React.CSSProperties = {
    fontFamily: F.mono, fontSize: 9, letterSpacing: "0.28em",
    color: T.inkFaint, textTransform: "uppercase",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: 640 }}>

      {/* ── Short link ─────────────────────────────────────────────────── */}
      <div>
        <SectionHead title="Short Link" count="for discord" />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>

          {shortStatus !== "ok" ? (
            <div style={{ display: "flex", gap: 8 }}>
              <ActionBtn
                onClick={handleGetShortLink}
                variant="primary"
                disabled={shortStatus === "loading"}
              >
                {shortStatus === "loading" ? "Saving…"
                 : shortStatus === "error"  ? "Retry"
                 : "Get short link"}
              </ActionBtn>
              {shortStatus === "error" && (
                <span style={{ fontFamily: F.mono, fontSize: 10, color: "#f87171", alignSelf: "center" }}>
                  Failed — try again
                </span>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <input
                ref={shortInputRef}
                readOnly
                value={shortUrl ?? ""}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                style={{
                  flex: 1, height: 36, padding: "0 12px",
                  background: "rgba(10,6,18,0.55)",
                  border: `1px solid ${T.accent}`,
                  color: T.accentSoft,
                  fontFamily: F.mono, fontSize: 12, letterSpacing: "0.06em",
                  outline: "none", minWidth: 0,
                }}
              />
              <ActionBtn onClick={handleCopyShort} variant="primary">
                {shortCopy === "ok" ? "✓ Copied" : "Copy"}
              </ActionBtn>
              <ActionBtn onClick={() => { setShortStatus("idle"); setShortUrl(null); }} variant="ghost">
                ✕
              </ActionBtn>
            </div>
          )}

          <div style={mono9}>
            Saves the build · link expires in 180 days
          </div>
        </div>
      </div>

      {/* ── Long link ──────────────────────────────────────────────────── */}
      <div>
        <SectionHead title="Full Link" count="self-contained" />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              ref={urlInputRef}
              readOnly
              value={longUrl}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              style={{
                flex: 1, height: 36, padding: "0 12px",
                background: "rgba(10,6,18,0.55)",
                border: `1px solid ${T.edgeStrong}`,
                color: T.inkDim,
                fontFamily: F.mono, fontSize: 11, letterSpacing: "0.06em",
                outline: "none", overflow: "hidden",
                textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0,
              }}
            />
            <ActionBtn
              onClick={handleCopyLong}
              variant={copyFeedback === "ok" ? "primary" : "ghost"}
            >
              {copyFeedback === "ok"   ? "✓ Copied"
               : copyFeedback === "fail" ? "Select & Ctrl+C"
               : "Copy"}
            </ActionBtn>
          </div>
          <div style={mono9}>
            No expiry — entire build encoded in the URL
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
              placeholder="Paste short or full share URL…"
              onKeyDown={(e) => e.key === "Enter" && handleImport()}
              style={{
                flex: 1, height: 36, padding: "0 12px",
                background: "rgba(10,6,18,0.55)",
                border: `1px solid ${importError ? "#ef4444" : T.edgeStrong}`,
                color: T.ink,
                fontFamily: F.mono, fontSize: 11, letterSpacing: "0.06em",
                outline: "none", minWidth: 0,
              }}
            />
            <ActionBtn onClick={handleImport} variant="ghost" disabled={!importVal.trim()}>
              Load
            </ActionBtn>
          </div>
          {importError && (
            <div style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: "0.16em", color: "#f87171" }}>
              {importError}
            </div>
          )}
          <div style={mono9}>Short links and full URLs both work</div>
        </div>
      </div>

      {/* ── Reset ──────────────────────────────────────────────────────── */}
      <div>
        <SectionHead title="Reset" count="clear all" />
        {!showReset ? (
          <ActionBtn variant="danger" onClick={() => setShowReset(true)}>Reset build</ActionBtn>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: "0.14em", color: "#f87171" }}>
              This will clear all gear, skills, CP, consumables and metadata. Are you sure?
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <ActionBtn variant="danger" onClick={handleResetConfirm}>Yes, reset everything</ActionBtn>
              <ActionBtn variant="ghost" onClick={() => setShowReset(false)}>Cancel</ActionBtn>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
