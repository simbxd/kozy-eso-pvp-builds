/**
 * ESO-Hub tooltip API
 * -------------------
 * Discovered via HAR capture on eso-pvp-builds.com (2026-05-21).
 * Both endpoints require the header:  X-Requested-With: XMLHttpRequest
 * Both return CORS: * — safe to call client-side from any origin.
 *
 * Skills:  GET https://eso-hub.com/api/skills/tooltip/{slug}?lang=en
 * Sets:    GET https://eso-hub.com/api/armor-sets/tooltip/{slug}?lang=en
 *
 * CSS classes injected in HTML responses (apply via .eso-tip-body parent):
 *   Skills   — buff · debuff · magic-damage · physical-damage · fire-damage
 *              frost-damage · shock-damage · bleed-damage · health · oblivion
 *   Sets     — stamina · magicka · health · flame-damage
 */

// ── Constants ─────────────────────────────────────────────────────────────────

const BASE    = "https://eso-hub.com";
const HEADERS = { "X-Requested-With": "XMLHttpRequest" };

// ── Skill tooltip ─────────────────────────────────────────────────────────────

export type EsoHubSkillTip = {
  /** Display name of the skill */
  name: string;
  /** Base effect HTML — may contain <span class="..."> for damage/buff coloring */
  effect_1: string;
  /** Morph "New effect" HTML, null for base skills */
  effect_2: string | null;
  /** Relative icon filename — prefix with BASE/storage/icons/ for full URL */
  icon: string;
  passive: boolean;
  /** Section header label (e.g. "Passive" / null for active skills) */
  header: string | null;
};

const skillCache = new Map<string, EsoHubSkillTip | null>();

/**
 * Fetch the ESO-Hub skill tooltip for `id` (slug form, e.g. "merciless-resolve").
 * Returns null if the API call fails or the skill is unknown.
 * Results are cached in memory for the lifetime of the page.
 */
export async function fetchSkillTip(id: string): Promise<EsoHubSkillTip | null> {
  if (skillCache.has(id)) return skillCache.get(id) ?? null;
  try {
    const r = await fetch(`${BASE}/api/skills/tooltip/${id}?lang=en`, { headers: HEADERS });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const d: EsoHubSkillTip = await r.json();
    skillCache.set(id, d);
    return d;
  } catch {
    skillCache.set(id, null);
    return null;
  }
}

/** Direct access to the module-level skill cache (useful for pre-warming). */
export { skillCache };

// ── Set tooltip ───────────────────────────────────────────────────────────────

export type EsoHubSetTip = {
  /** Display name of the set */
  name: string;
  /** Acquisition / type category (e.g. "PvP", "Dungeon") */
  category: string;
  /** Icon filename (.png) — prefix with BASE/storage/icons/ */
  icon: string;
  /** Icon filename (.webp) — preferred over icon when available */
  icon_webp?: string;
  /**
   * Bonus descriptions keyed bonus_1 … bonus_12.
   * The number matches the required piece count.
   * null means no bonus at that piece count.
   * HTML — may contain <span class="..."> for stat coloring.
   */
  bonus_1:  string | null; bonus_2:  string | null; bonus_3:  string | null;
  bonus_4:  string | null; bonus_5:  string | null; bonus_6:  string | null;
  bonus_7:  string | null; bonus_8:  string | null; bonus_9:  string | null;
  bonus_10: string | null; bonus_11: string | null; bonus_12: string | null;
};

/** Ordered list of (pieceCount, html) pairs extracted from an EsoHubSetTip. */
export function setTipBonuses(tip: EsoHubSetTip): { count: number; html: string }[] {
  const rows: { count: number; html: string }[] = [];
  for (let i = 1; i <= 12; i++) {
    const html = tip[`bonus_${i}` as keyof EsoHubSetTip] as string | null;
    if (html) rows.push({ count: i, html });
  }
  return rows;
}

const setCache = new Map<string, EsoHubSetTip | null>();

/**
 * Fetch the ESO-Hub set tooltip for `id` (slug form, e.g. "vicious-death").
 * Returns null if the API call fails or the set is unknown.
 * Results are cached in memory for the lifetime of the page.
 */
export async function fetchSetTip(id: string): Promise<EsoHubSetTip | null> {
  if (setCache.has(id)) return setCache.get(id) ?? null;
  try {
    const r = await fetch(`${BASE}/api/armor-sets/tooltip/${id}?lang=en`, { headers: HEADERS });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const d: EsoHubSetTip = await r.json();
    setCache.set(id, d);
    return d;
  } catch {
    setCache.set(id, null);
    return null;
  }
}

/** Direct access to the module-level set cache (useful for pre-warming). */
export { setCache };

// ── Icon URL helpers ──────────────────────────────────────────────────────────

/** Full URL for a skill icon (use in <img src>). */
export function skillIconUrl(icon: string): string {
  return `${BASE}/storage/icons/${icon}`;
}

/** Full URL for a set icon — prefers .webp when available. */
export function setIconUrl(tip: Pick<EsoHubSetTip, "icon" | "icon_webp">): string {
  return `${BASE}/storage/icons/${tip.icon_webp ?? tip.icon}`;
}
