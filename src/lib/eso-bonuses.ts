// Numeric constants for ESO stat computation.
// Source: The Hist optimizer (hist.britt0nia.com/api/*) — verified U50.
// Endpoints used: /api/races, /api/weapons, /api/enchantments, /api/mundus, /api/cp-stars
// All values at CP160 gold quality unless otherwise noted.

import type { ComputedStats } from "@/lib/compute-stats";
import { getSet } from "@/lib/eso-data";

// ── Base character stats (CP160, no gear, no race, no food) ────────────────
// Source: The Hist /api/derive-stats baseline.
// "Base Health Bonus: 4000" is a universal always-active mechanic.
export const BASE: ComputedStats = {
  maxHealth:       16000,
  maxMagicka:      12000,
  maxStamina:      12000,
  spellDmg:        1000,
  weaponDmg:       1000,
  healthRecovery:  309,
  magickaRecovery: 514,
  staminaRecovery: 514,
  physResist:      0,
  spellResist:     0,
  critResistance:  0,
  // 10% base critical strike chance, universal at CP160.
  // Source: The Hist /api/derive-stats — "Base: 0.1" in spell_crit and weapon_crit stat_sources.
  // 10% × 219 rating/% = 2190 critRating.
  critRating:      2190,
  critDamage:      50,
  physPen:         0,
  spellPen:        0,
  moveSpeed:       0,
};

// ── Attribute points ────────────────────────────────────────────────────────
// All resources (Health, Magicka, Stamina) yield 111 per point.
export const ATTR_PER_POINT = 111;

// ── Weapon type bonus (bar 1) ───────────────────────────────────────────────
// Source: The Hist /api/weapons — weapon_types section.
export const WEAPON_TYPE_BONUS: Record<string, number> = {
  dual_wield:        1335,
  one_hand_shield:   1335,
  bow:               1335,
  restoration_staff: 1335,
  destruction_staff: 1335,
  two_handed:        1571,
};

export const STAFF_TYPES = new Set([
  "inferno-staff", "lightning-staff", "ice-staff", "restoration-staff",
]);

export const TWO_HANDED_TYPES = new Set(["two-handed"]);

export function deriveBarType(mhType?: string, ohType?: string): string | null {
  if (!mhType) return null;
  if (TWO_HANDED_TYPES.has(mhType)) return "two_handed";
  if (mhType === "bow") return "bow";
  if (STAFF_TYPES.has(mhType))
    return mhType === "restoration-staff" ? "restoration_staff" : "destruction_staff";
  if (!ohType || ohType === "shield") return "one_hand_shield";
  return "dual_wield";
}

// ── Nirnhoned — +15% multiplicative on WD+SD ──────────────────────────────
// Source: The Hist /api/weapons — weapon_traits[nirnhoned].value=0.15, is_percentage=true
// Applied AFTER all flat bonuses. Applied once regardless of how many nirnhoned weapons.
export const NIRNHONED_WEAPON_PCT = 0.15;

// ── Weapon trait values ─────────────────────────────────────────────────────
// Source: The Hist /api/weapons — weapon_traits section.
// Values are UNIFORM for all weapon types (no 1H/2H distinction in The Hist).
// precise=0.057 crit → 0.057 × 21905 ≈ 1249 crit rating.
// nirnhoned is handled separately as a % multiplier (not a flat entry here).
export const WEAPON_TRAIT_VALUES: Record<string, Partial<ComputedStats>> = {
  "precise":   { critRating: 1249 },
  "defending": { physResist: 1638, spellResist: 1638 },
  "sharpened": { physPen: 1638, spellPen: 1638 },
};

// ── Trait values (armor & jewelry) ─────────────────────────────────────────
export const TRAIT_VALUES: Record<string, Partial<ComputedStats>> = {
  // Armor
  "impenetrable":    { critResistance: 132 },
  "invigorating":    { healthRecovery: 16, magickaRecovery: 16, staminaRecovery: 16 },
  "nirnhoned-armor": { physResist: 253, spellResist: 253 },
  // Jewelry
  "healthy":         { maxHealth: 966 },
  "arcane":          { maxMagicka: 877 },
  "robust":          { maxStamina: 877 },
  "triune":          { maxHealth: 480, maxMagicka: 436, maxStamina: 436 },
  "protective":      { physResist: 1190, spellResist: 1190 },
  "swift":           { moveSpeed: 7 },
};

// ── Enchant multipliers ─────────────────────────────────────────────────────
export const DIVINES_GOLD         = 0.091; // +9.1% mundus per Divines piece at gold
export const INFUSED_ARMOR_GOLD   = 0.25;  // +25% to armor piece enchant
export const INFUSED_JEWELRY_GOLD = 0.60;  // +60% to jewelry piece enchant
export const REINFORCED_GOLD      = 0.16;  // +16% to armor piece base armor

// ── Enchant values (CP160 gold) ─────────────────────────────────────────────
// Source: The Hist /api/enchantments — U50.
// NOTE on jewelry harm glyphs: The Hist treats spell_damage and weapon_damage
// as separate stats. "Increase Magical Harm" adds only spellDmg; "Increase Physical
// Harm" adds only weaponDmg. In ESO's UI both values display identically because
// WD = SD in most scenarios, but the engine tracks them separately.
export const ENCHANT_VALUES: Record<string, Partial<ComputedStats>> = {
  // ── Armor glyphs ───────────────────────────────────────────────────
  "glyph-of-magicka":           { maxMagicka: 868 },
  "glyph-of-stamina":           { maxStamina: 868 },
  "glyph-of-health":            { maxHealth:  952 },
  "glyph-of-prismatic-defense": { maxHealth: 868, maxMagicka: 868, maxStamina: 868 },

  // ── Jewelry glyphs ─────────────────────────────────────────────────
  // Harm: each adds only its own damage type (not both)
  "glyph-of-increase-magical-harm":  { spellDmg: 174 },
  "glyph-of-increase-physical-harm": { weaponDmg: 174 },
  // Recovery glyphs: 169 each (The Hist /api/enchantments confirmed)
  "glyph-of-magicka-recovery":       { magickaRecovery: 169 },
  "glyph-of-stamina-recovery":       { staminaRecovery: 169 },
  "glyph-of-health-recovery":        { healthRecovery: 169 },
  "glyph-of-prismatic-recovery":     { healthRecovery: 57, magickaRecovery: 57, staminaRecovery: 57 },
  "glyph-of-decrease-physical-harm": { physResist: 1206 },
  "glyph-of-decrease-spell-harm":    { spellResist: 1206 },
};

// ── Food / drink buffs ─────────────────────────────────────────────────────
// Source: The Hist /api/foods — U50.
// Slugs match The Hist (hyphens). build.a.food stores the same slug.
// Restore-over-time effects (Artaeum, Clockwork Citrus) are combat mechanics —
// only flat stat values are recorded here.
// XP-only items (Aetherial/Psijic Ambrosia) are omitted.
export const FOOD_VALUES: Record<string, Partial<ComputedStats>> = {
  "bewitched-sugar-skulls":      { maxHealth: 4620, maxMagicka: 4250, maxStamina: 4250, healthRecovery: 462 },
  "artaeum-takeaway-broth":      { maxHealth: 3326, maxStamina: 3080 },
  "clockwork-citrus-filet":      { maxHealth: 3080, maxMagicka: 3326 },
  "garlic-cod-potato":           { maxHealth: 5395, maxStamina: 4936 },
  "melon-baked-parmesan-pork":   { maxHealth: 5395, maxMagicka: 4936 },
  "mistral-banana-bunny-hash":   { maxHealth: 5395, maxMagicka: 4936 },
  "orzorgas-blood-price-pie":    { maxHealth: 5395, healthRecovery: 539 },
  "orzorgas-tripe-trifle":       { maxHealth: 5395, staminaRecovery: 493 },
  "lava-foot-soup":              { maxStamina: 4936, staminaRecovery: 493 },
  "ghastly-eye-bowl":            { maxMagicka: 4592, magickaRecovery: 459 },
  "bewitched-sugar-skulls-v2":   { maxHealth: 4620, maxMagicka: 4250, maxStamina: 4250, healthRecovery: 462 },
  "dubious-camoran-throne":      { maxStamina: 3192, healthRecovery: 319, staminaRecovery: 319 },
  "jewels-of-misrule":           { maxHealth: 3927, maxStamina: 2856, healthRecovery: 315, magickaRecovery: 357, staminaRecovery: 357 },
  "orzorgas-smoked-bear-haunch": { maxHealth: 4312, healthRecovery: 406, magickaRecovery: 369, staminaRecovery: 369 },
  "orzorgas-red-frothgar":       { maxHealth: 3094, healthRecovery: 315, staminaRecovery: 315 },
  "witchmothers-potent-brew":    { maxHealth: 3094, maxMagicka: 2856, magickaRecovery: 315 },
  "spring-loaded-infusion":      { maxMagicka: 2856, maxStamina: 2856, magickaRecovery: 315 },
  "crown-fortifying-meal":       { maxHealth: 2745, maxMagicka: 2503, maxStamina: 2503 },
  "longfin-pasty-melon":         { maxHealth: 2745, maxMagicka: 2503, maxStamina: 2503 },
  "tri-stat-food":               { maxHealth: 2745, maxMagicka: 2503, maxStamina: 2503 },
  // Solitude Salmon-Millet Soup (same values as tri-stat tier)
  "solitude-salmon-millet-soup": { maxHealth: 2745, maxMagicka: 2503, maxStamina: 2503 },
};

// ── Battle Spirit ───────────────────────────────────────────────────────────
// In PvP zones (Cyrodiil, Battlegrounds, Imperial City), Battle Spirit halves
// all Physical and Spell Resistance. Does NOT affect Critical Resistance.
// Applied as the final step when build.bs !== false (default: active in PvP).
export const BATTLE_SPIRIT_RESIST_MULT = 0.5;

// ── Mundus stones ───────────────────────────────────────────────────────────
// Source: The Hist /api/mundus — U50.
// stat_2 = second stat for dual-stat stones (The Lady, The Lover, The Thief).
// is_pct = true means the value is a multiplier/% added to critDamage etc.
// Divines multiplier applies to both flat and % stones.
type MundusStone = {
  statKey: keyof ComputedStats;
  value: number;
  statKey2?: keyof ComputedStats;
  value2?: number;
  isPct?: boolean; // if true, value is already in % points (add directly to stat)
};

export const MUNDUS_STONES: Record<string, MundusStone> = {
  // The Lady: Physical + Spell Resistance 2744 each
  "the-lady":        { statKey: "physResist",      value: 2744, statKey2: "spellResist",  value2: 2744 },
  // The Lover: Physical + Spell Penetration 2744 each
  "the-lover":       { statKey: "physPen",          value: 2744, statKey2: "spellPen",     value2: 2744 },
  // The Thief: Weapon + Spell Crit (unified in our schema as critRating)
  "the-thief":       { statKey: "critRating",       value: 1548 },
  // The Shadow: +12% Critical Damage (is_percentage: true in The Hist)
  "the-shadow":      { statKey: "critDamage",       value: 12,   isPct: true },
  // The Warrior: Weapon Damage
  "the-warrior":     { statKey: "weaponDmg",        value: 238 },
  // The Apprentice: Spell Damage
  "the-apprentice":  { statKey: "spellDmg",         value: 238 },
  // The Mage: Max Magicka
  "the-mage":        { statKey: "maxMagicka",       value: 2025 },
  // The Tower: Max Stamina
  "the-tower":       { statKey: "maxStamina",       value: 2025 },
  // The Lord: Max Health
  "the-lord":        { statKey: "maxHealth",        value: 2231 },
  // The Atronach: Magicka Recovery
  "the-atronach":    { statKey: "magickaRecovery",  value: 310 },
  // The Serpent: Stamina Recovery
  "the-serpent":     { statKey: "staminaRecovery",  value: 310 },
  // The Steed: Health Recovery (movement speed component removed in current ESO)
  "the-steed":       { statKey: "healthRecovery",   value: 310 },
  // The Ritual: Healing Done % — no stat-sheet entry (not tracked in ComputedStats)
  // "the-ritual": not in MUNDUS_STONES; handled gracefully as a no-op
};

// Also support legacy slug formats from our mundus-index.json
export const MUNDUS_SLUG_MAP: Record<string, string> = {
  "lady":       "the-lady",
  "lover":      "the-lover",
  "thief":      "the-thief",
  "shadow":     "the-shadow",
  "warrior":    "the-warrior",
  "apprentice": "the-apprentice",
  "mage":       "the-mage",
  "tower":      "the-tower",
  "lord":       "the-lord",
  "atronach":   "the-atronach",
  "serpent":    "the-serpent",
  "steed":      "the-steed",
  "ritual":     "the-ritual",
};

// ── Racial bonuses ──────────────────────────────────────────────────────────
// Source: The Hist /api/races flat bonuses + in-game racial passives for
// bonuses not exposed via the API (Nord Rugged, Bosmer Hunter's Eye/Y'ffre,
// Breton Spell Attunement, Khajiit Robustness full set).
export const RACIAL: Record<string, Partial<ComputedStats>> = {
  altmer:   { maxMagicka: 2000, spellDmg: 258, weaponDmg: 258 },
  argonian: { maxHealth: 1000, maxMagicka: 1000, maxStamina: 1000 },
  // Bosmer: staminaRecovery (Y'ffre's Endurance) + pen (Hunter's Eye) + speed
  bosmer:   { maxStamina: 2000, staminaRecovery: 258, physPen: 950, spellPen: 950, moveSpeed: 5 },
  // Breton: magicka flat + recovery from API; +2310 spell resist from Spell Attunement passive
  breton:   { maxMagicka: 2000, spellResist: 2310, magickaRecovery: 130 },
  dunmer:   { maxMagicka: 1910, maxStamina: 1910, spellDmg: 258, weaponDmg: 258 },
  imperial: { maxHealth: 2000, maxStamina: 2000 },
  khajiit:  {
    maxHealth: 915, maxMagicka: 915, maxStamina: 915,
    // Robustness gives +90 to ALL three recoveries (The Hist API shows magicka only —
    // in-game tooltip confirms all three).
    healthRecovery: 90, magickaRecovery: 90, staminaRecovery: 90,
    critDamage: 12,
  },
  // Nord: +2600 phys+spell resist from Rugged passive (not in The Hist flat race API but real in-game)
  nord:     { maxHealth: 1000, maxStamina: 1500, physResist: 2600, spellResist: 2600 },
  orc:      { maxHealth: 1000, maxStamina: 1000, spellDmg: 258, weaponDmg: 258 },
  redguard: { maxStamina: 2000 },
};

// ── CP slottable stars — flat contributions ─────────────────────────────────
// Source: The Hist /api/cp-stars — slottable_value × 50 stages or confirmed totals.
// Stars that give % of pool (arcane_supremacy, untamed_aggression, endless_endurance)
// are in CP_STAR_PCT below and applied as multipliers instead.
// Stars that are combat procs or non-stat-sheet (wrathful_strikes, resilience, celerity) are excluded.
export const CP_STAR_VALUES: Record<string, Partial<ComputedStats>> = {
  // ── Warfare ──────────────────────────────────────────────────────
  // fighting_finesse: "+4% crit dmg/healing per stage, max 40% at 10 stages"
  "fighting-finesse":   { critDamage: 40 },
  // boundless_vitality: 28 per stage × 50 stages = 1400 HP
  "boundless-vitality": { maxHealth: 1400 },
  // fortified: 34.6 per stage × 50 stages = 1730 armor (both resists)
  "fortified":          { physResist: 1730, spellResist: 1730 },
  // rejuvenation: 3 per stage × 50 stages = 150 for each recovery
  "rejuvenation":       { healthRecovery: 150, magickaRecovery: 150, staminaRecovery: 150 },
  // celerity: Minor Expedition buff (not a flat stat rating — excluded from sheet)
};

// CP stars that scale as a % of the current pool.
// Applied as multipliers AFTER all flat bonuses (including flat CP stars above).
// Source: The Hist /api/cp-stars — slottable_pct = 0.02 for all three.
export const CP_STAR_PCT: Record<string, Partial<Record<"maxHealth" | "maxMagicka" | "maxStamina", number>>> = {
  "arcane-supremacy":   { maxMagicka: 0.02 },
  "untamed-aggression": { maxStamina: 0.02 },
  "endless-endurance":  { maxHealth: 0.02 },
};

// ── Armor type ──────────────────────────────────────────────────────────────
export type ArmorWeight = "heavy" | "medium" | "light";

// ── Armor passives (per piece, rank 2) ─────────────────────────────────────
// Source: The Hist /api/passives/grouped — U50.
// % passives (constitution, juggernaut, agility, athletics, dexterity) are in
// ARMOR_PASSIVE_PCT_PER_PIECE below and applied via acc.multiply / special logic.
export const ARMOR_PASSIVE_PER_PIECE: Record<string, Partial<ComputedStats>> = {
  // Light Armor — flat per piece
  "prodigy":       { critRating: 109 },
  "spell-warding": { spellResist: 363 },
  "concentration": { physPen: 469, spellPen: 469 },
  // Light Armor — Evocation: +17 Magicka Recovery per light piece.
  // Source: The Hist /api/derive-stats — 6 light pieces × 17 = 102 confirmed in stat_sources.
  "evocation":     { magickaRecovery: 17 },
  // Medium Armor — Wind Walker: +17 Stamina Recovery per piece (confirmed flat from The Hist stat_sources).
  // Note: The Hist /api/passives/grouped describes this as "+2% per piece" but derive-stats
  // outputs flat +17 for 1 medium piece regardless of base recovery level — treated as flat.
  "wind-walker":   { staminaRecovery: 17 },
  // Heavy Armor — flat per piece
  "resolve":       { physResist: 114, spellResist: 114 },
  // Constitution: +12 Health Recovery per heavy piece (confirmed flat from The Hist stat_sources).
  "constitution":  { healthRecovery: 12 },
};

// Armor passives that scale as % per piece — applied via acc.multiply.
// Source: The Hist /api/passives/grouped.
export type ArmorPassivePct = {
  keys: (keyof ComputedStats)[];
  pctPerPiece: number;
};

export const ARMOR_PASSIVE_PCT_PER_PIECE: Record<string, ArmorPassivePct> = {
  // Heavy Armor
  // Juggernaut: +2% Max Health per heavy piece.
  // Source: The Hist stat_sources — 1 heavy piece gives 340, base health = 17,000 → 340/17,000 = 2%.
  "juggernaut":   { keys: ["maxHealth"],              pctPerPiece: 0.02 },
  // Medium Armor
  // Agility: +1% Weapon and Spell Damage per medium piece.
  // Source: The Hist /api/passives/grouped — "Increases your Weapon and Spell Damage by 1% for each piece of Medium Armor worn."
  "agility":      { keys: ["weaponDmg", "spellDmg"], pctPerPiece: 0.01 },
};

// Dexterity (medium): +1% Critical Damage per N medium armor pieces (floor).
// Source: The Hist /api/passives/grouped — value=1%, per_pieces=2.
export const DEXTERITY_CRIT_PER_N_PIECES = 2;

export const ARMOR_PASSIVE_WEIGHT: Record<string, ArmorWeight> = {
  "prodigy":       "light",
  "spell-warding": "light",
  "concentration": "light",
  "evocation":     "light",
  "dexterity":     "medium",
  "agility":       "medium",
  "wind-walker":   "medium",
  "resolve":       "heavy",
  "constitution":  "heavy",
  "juggernaut":    "heavy",
};

// ── Undaunted Mettle ────────────────────────────────────────────────────────
// +2% to all three pools per armor TYPE present (H/M/L).
// Source: The Hist /api/derive-stats stat_sources — "+6%" with 3 types = 2%/type.
export const UNDAUNTED_METTLE_PCT = 0.02;

// ── Armor base values (CP160 gold) ──────────────────────────────────────────
export const ARMOR_BASE: Record<ArmorWeight, Record<string, number>> = {
  heavy: {
    head: 1320, shoulders: 1320, chest: 3110,
    hands: 1320, waist: 1320, legs: 2410, feet: 1320,
  },
  medium: {
    head: 880, shoulders: 880, chest: 2073,
    hands: 880, waist: 880, legs: 1607, feet: 880,
  },
  light: {
    head: 440, shoulders: 440, chest: 1037,
    hands: 440, waist: 440, legs: 804, feet: 440,
  },
};

export const SHIELD_BASE_ARMOR = 1985;

export function armorWeightFromSetType(setType: string): ArmorWeight | null {
  const t = setType.toLowerCase();
  if (t.includes("heavy"))  return "heavy";
  if (t.includes("medium")) return "medium";
  if (t.includes("light"))  return "light";
  if (t === "mixed" || t === "monster") return "medium";
  return null;
}

const LEGACY_WEIGHT: Record<number, ArmorWeight> = { 0: "heavy", 1: "medium", 2: "light" };

export function resolveArmorWeight(piece: {
  id: string; aw?: ArmorWeight; w?: 0 | 1 | 2;
}): ArmorWeight | null {
  if (piece.aw) return piece.aw;
  if (piece.w != null && piece.w in LEGACY_WEIGHT) return LEGACY_WEIGHT[piece.w];
  const set = getSet(piece.id);
  return armorWeightFromSetType(set?.type ?? "");
}

// ── Set bonus helpers ───────────────────────────────────────────────────────
export type StatTarget = keyof ComputedStats | "wepSpellDmg" | "offPen" | "armor";

export function resolveStatKey(stat: string): StatTarget | null {
  const s = stat.trim().toLowerCase();
  if (s === "max health"    || s === "maximum health")    return "maxHealth";
  if (s === "max magicka"   || s === "maximum magicka")   return "maxMagicka";
  if (s === "max stamina"   || s === "maximum stamina")   return "maxStamina";
  if (s === "weapon and spell damage")                    return "wepSpellDmg";
  if (s === "health recovery")                            return "healthRecovery";
  if (s === "magicka recovery")                           return "magickaRecovery";
  if (s === "stamina recovery")                           return "staminaRecovery";
  if (s === "critical chance")                            return "critRating";
  if (s === "critical resistance")                        return "critResistance";
  if (s === "offensive penetration")                      return "offPen";
  if (s === "armor")                                      return "armor";
  return null;
}

// ── Set overrides + conditionals ────────────────────────────────────────────
export const SET_BONUS_OVERRIDES: Record<string, Array<{ count: number; contrib: Partial<ComputedStats> }>> = {
  "mighty-chudan": [
    { count: 2, contrib: { maxHealth: 1206, physResist: 5948, spellResist: 5948 } },
  ],
};

export const SET_CONDITIONAL_BONUSES: Record<string, Array<{ count: number; contrib: Partial<ComputedStats>; note: string }>> = {
  "twice-fanged-serpent": [
    { count: 5, contrib: { physPen: 5440, spellPen: 5440 }, note: "10 stacks × +544 pen (5s)" },
  ],
  "rallying-cry": [
    { count: 5, contrib: { weaponDmg: 300, spellDmg: 300, critResistance: 1650 }, note: "Healing crit proc (20s/15s)" },
  ],
};

// ── Markyn Ring of Majesty ──────────────────────────────────────────────────
export const MARKYN_PER_QUALIFYING_SET = {
  weaponDmg: 100, spellDmg: 100, physResist: 1157, spellResist: 1157,
};
export const MARKYN_QUALIFYING_MIN_PIECES = 3;

// ── Weapon line passives ────────────────────────────────────────────────────
// Source: The Hist /api/passives/grouped — Twin Blade and Blunt values corrected.
// Note: Twin Blade and Blunt applies ONE sub-passive per bar 1 weapon type.
export const WEAPON_LINE_PASSIVE: Record<string, { weaponType: string; contrib: Partial<ComputedStats> }> = {
  "accuracy":                    { weaponType: "bow",    contrib: { critRating: 1314 } },
  "twin-blade-and-blunt-axe":    { weaponType: "axe",   contrib: { critDamage: 3 } },
  "twin-blade-and-blunt-mace":   { weaponType: "mace",  contrib: { physPen: 743, spellPen: 743 } },
  "twin-blade-and-blunt-sword":  { weaponType: "sword", contrib: { weaponDmg: 64, spellDmg: 64 } },
  "twin-blade-and-blunt-dagger": { weaponType: "dagger",contrib: { critRating: 328 } },
};

// ── Class passives ──────────────────────────────────────────────────────────
// Source: The Hist /api/passives/grouped — U50.
export const CLASS_PASSIVE_VALUES: Record<string, { classId: string; contrib: Partial<ComputedStats> }> = {
  // DK: Heart of Stone (Earthen Heart) — Spell Resistance only, confirmed via The Hist.
  // No Physical Resistance passive exists for DK in current patch.
  // Note: ~40k in-game resistance comes from active skill buffs (Major Resolve +5948)
  // which are combat buffs, not modelled in this static sheet.
  "heart-of-stone":       { classId: "dragonknight", contrib: { spellResist: 3960 } },
  // DK: Elder Dragon (Draconic Power) — +700 Health Recovery.
  // Source: The Hist /api/passives/grouped — "Increases your Health Recovery by 700."
  "elder-dragon":         { classId: "dragonknight", contrib: { healthRecovery: 700 } },
  // NOTE: blessing-at-the-peak removed — The Hist confirms it is Ultimate generation
  // (10 ulti/s when casting Earthen Heart abilities), NOT a stat-sheet entry.
  // Templar: Piercing Spear — 10% crit damage (was 12).
  "piercing-spear":       { classId: "templar",       contrib: { critDamage: 10 } },
  "hemorrhage":           { classId: "nightblade",    contrib: { critDamage: 10 } },
  // Warden: Flourish (Green Balance) — +51 Magicka and Stamina Recovery.
  // Source: The Hist /api/derive-stats stat_sources — "Class Passive: flourish: 51"
  // Applied unconditionally when class = warden (all 3 skill lines contribute).
  "flourish":             { classId: "warden",        contrib: { magickaRecovery: 51, staminaRecovery: 51 } },
};

export const CLASS_PASSIVE_POOL_PCT: Record<string, {
  classId: string;
  pools: Partial<Record<"maxHealth" | "maxMagicka" | "maxStamina", number>>;
}> = {
  "magicka-flood":   { classId: "nightblade", pools: { maxMagicka: 0.06, maxStamina: 0.06 } },
  "expert-summoner": { classId: "sorcerer",   pools: { maxMagicka: 0.05, maxStamina: 0.05 } },
};

// ── CP passive (non-slottable) stars — always active at CP810+ ───────────────
// Source: The Hist /api/cp-passives — auto-applied unconditionally (assumes CP810).
// These are permanent constellation bonuses, not slottable — not stored in build.cp.
export const CP_PASSIVE_VALUES: Array<{ id: string; contrib: Partial<ComputedStats> }> = [
  { id: "war-mage",              contrib: { weaponDmg: 60, spellDmg: 60 } },
  { id: "eldritch-insight",      contrib: { maxMagicka: 520 } },
  { id: "tireless-discipline",   contrib: { maxHealth: 560 } },
  { id: "piercing",              contrib: { physPen: 700, spellPen: 700 } },
  { id: "precision",             contrib: { critRating: 320 } },
  { id: "fortification",         contrib: { maxHealth: 1200 } },
  { id: "battle-mastery",        contrib: { critDamage: 10 } },
];

// ── Active buff definitions ────────────────────────────────────────────────
// Buffs toggled in the Buffs tab (build.bx[]). Each has a flat contribution
// and/or a % multiplier on a stat pool. Values from ESO in-game tooltips U50.
// Major/Minor buffs: flat additions to the stat sheet (not ×base in our model).
// Brutality/Sorcery: multiplicative on the current WD/SD pool (×1.20/×1.10).
export type BuffDef = {
  id: string;
  label: string;
  group: "defense" | "offense" | "resource";
  contrib?: Partial<ComputedStats>;                           // flat add
  pct?: { keys: (keyof ComputedStats)[]; factor: number };   // multiply pool
};

export const BUFF_DEFS: BuffDef[] = [
  // ── Defense ───────────────────────────────────────────────────────────
  {
    id: "major-resolve",   label: "Major Resolve",
    group: "defense",
    contrib: { physResist: 5948, spellResist: 5948 },
  },
  {
    id: "minor-resolve",   label: "Minor Resolve",
    group: "defense",
    contrib: { physResist: 2974, spellResist: 2974 },
  },
  {
    id: "major-evasion",   label: "Major Evasion",
    group: "defense",
    contrib: { moveSpeed: 0 },   // dodge/evade roll bonus — no stat-sheet entry
    // Note: +30% Dodge Roll invulnerability window — not a numeric stat, shown for reference.
  },
  // ── Offense ───────────────────────────────────────────────────────────
  {
    id: "major-brutality", label: "Major Brutality",
    group: "offense",
    pct: { keys: ["weaponDmg"], factor: 1.20 },
  },
  {
    id: "minor-brutality", label: "Minor Brutality",
    group: "offense",
    pct: { keys: ["weaponDmg"], factor: 1.10 },
  },
  {
    id: "major-sorcery",   label: "Major Sorcery",
    group: "offense",
    pct: { keys: ["spellDmg"], factor: 1.20 },
  },
  {
    id: "minor-sorcery",   label: "Minor Sorcery",
    group: "offense",
    pct: { keys: ["spellDmg"], factor: 1.10 },
  },
  {
    id: "major-force",     label: "Major Force",
    group: "offense",
    contrib: { critDamage: 20 },
  },
  {
    id: "minor-force",     label: "Minor Force",
    group: "offense",
    contrib: { critDamage: 10 },
  },
  // ── Resources ─────────────────────────────────────────────────────────
  {
    id: "major-fortitude", label: "Major Fortitude",
    group: "resource",
    pct: { keys: ["maxHealth"], factor: 1.30 },
  },
  {
    id: "minor-fortitude", label: "Minor Fortitude",
    group: "resource",
    pct: { keys: ["maxHealth"], factor: 1.15 },
  },
  {
    id: "major-endurance", label: "Major Endurance",
    group: "resource",
    pct: { keys: ["maxStamina"], factor: 1.30 },
  },
  {
    id: "minor-endurance", label: "Minor Endurance",
    group: "resource",
    pct: { keys: ["maxStamina"], factor: 1.15 },
  },
  {
    id: "major-intellect", label: "Major Intellect",
    group: "resource",
    pct: { keys: ["maxMagicka"], factor: 1.30 },
  },
  {
    id: "minor-intellect", label: "Minor Intellect",
    group: "resource",
    pct: { keys: ["maxMagicka"], factor: 1.15 },
  },
];

export const BUFF_DEF_MAP: Record<string, BuffDef> = Object.fromEntries(
  BUFF_DEFS.map((b) => [b.id, b]),
);

// Kept for external callers.
export function isTwoHanded(wp?: string): boolean {
  return !!wp && (TWO_HANDED_TYPES.has(wp) || wp === "bow" || STAFF_TYPES.has(wp));
}

export const TWO_H_DOUBLED_TRAITS = new Set<string>();
