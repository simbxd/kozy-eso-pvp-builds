// lz-string ships as CommonJS; importing named exports breaks Astro's ESM
// SSR/prerender. Pull the default and destructure instead.
import lzString from "lz-string";
import type { Build } from "@/types/build";

const { compressToEncodedURIComponent, decompressFromEncodedURIComponent } =
  lzString;

// A build is stored entirely in the URL. We JSON-serialize then LZ-compress
// to an URI-safe string so even a fully-loaded build stays short enough to
// share. There is no server: the URL *is* the database.

export function encodeBuild(build: Build): string {
  return compressToEncodedURIComponent(JSON.stringify(build));
}

// Returns null on any failure (truncated link, hand-edited junk, old format)
// so the caller can silently fall back to an empty build.
export function decodeBuild(raw: string): Build | null {
  try {
    const json = decompressFromEncodedURIComponent(raw);
    if (!json) return null;
    return migrate(JSON.parse(json));
  } catch {
    return null;
  }
}

// Version gate. Today only v1 exists; future schema breaks bump `v` and add
// a branch here that upconverts old payloads. Unknown/missing version → null.
export function migrate(raw: unknown): Build | null {
  if (!raw || typeof raw !== "object") return null;
  const v = (raw as { v?: unknown }).v;
  if (v === 1) return raw as Build;
  return null;
}
