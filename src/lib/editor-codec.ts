// lz-string ships as CommonJS — import default and destructure.
import lzString from "lz-string";
import type { BuildMeta, Setup } from "@/components/builder/state";

const { compressToEncodedURIComponent, decompressFromEncodedURIComponent } =
  lzString;

// ── Types ─────────────────────────────────────────────────────────────────────

export type EditorSnapshot = {
  v: 1;
  meta: BuildMeta;
  setups: Setup[];
};

// ── Encode ────────────────────────────────────────────────────────────────────

export function encodeEditor(meta: BuildMeta, setups: Setup[]): string {
  const snap: EditorSnapshot = { v: 1, meta, setups };
  return compressToEncodedURIComponent(JSON.stringify(snap));
}

// ── Decode ────────────────────────────────────────────────────────────────────

// Returns null on any failure (truncated link, junk, old version).
// Callers should silently fall back to the current/empty state.
export function decodeEditor(raw: string): EditorSnapshot | null {
  try {
    const json = decompressFromEncodedURIComponent(raw);
    if (!json) return null;
    const snap = JSON.parse(json);
    if (!snap || snap.v !== 1) return null;
    if (!snap.meta || !Array.isArray(snap.setups)) return null;
    return snap as EditorSnapshot;
  } catch {
    return null;
  }
}
