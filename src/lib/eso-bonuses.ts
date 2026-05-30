// Numeric constants for ESO stat computation.
// Source: UESP (en.uesp.net) — verified U50.
// Primary references: Special:ESO_BuildEditor JS globals (g_EsoBuildRules, g_EsoCpData),
// Online:Races, Online:Mundus_Stones, Online:Champion, Online:Traits, Online:Enchanting.
// All values at CP160 gold quality unless otherwise noted.

import type { ComputedStats } from "@/lib/compute-stats";
import { getSet } from "@/lib/eso-data";

// ── Base character stats (CP160, no gear, no race, no food) ────────────────
// Source: UESP g_EsoBuildRules.stats formulas at level 50.
// Health   = 300×50 + 1000 = 16 000
// Mag/Stam = 220×50 + 1000 = 12 000
// WD/SD    = 20×50          =  1 000
// Base CritResist = 1320 (UESP formula: "1320 + Item.CritResist + …")
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
  critResistance:  1320,  // UESP: base 1320 always present
  // 10% base critical strike chance (UESP baseline).
  // 10% × 219 rating/% = 2190 critRating.
  critRating:      2190,
  critDamage:      50,
  physPen:         0,
  spellPen:        0,
  moveSpeed:       0,
};

// ── Attribute points ────────────────────────────────────────────────────────
// Source: UESP g_EsoBuildRules.stats formulas.
// Health yields 122 per point; Magicka and Stamina yield 111 per point.
export const ATTR_PER_POINT_HEALTH  = 122;
export const ATTR_PER_POINT_MAGSAM  = 111;

// ── Weapon type bonus (bar 1) ───────────────────────────────────────────────
// These values are the base Weapon Damage of the equipped weapon at CP160 gold.
// UESP stores them in esoitem.uesp.net (private item DB, no public API).
// The wiki skill-line pages show sub-type passives (Twin Blade: +129/sword,
// Sword and Board: +5% WD…) which are separate and already in WEAPON_LINE_PASSIVE.
// Values below come from The Hist /api/weapons and are community-verified stable
// across multiple patches. Kept as-is — cannot be sourced from UESP wiki pages.
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

// Each 2H sub-type gets its own ID; "two-handed" (old category) is no longer used by the editor.
export const TWO_HANDED_TYPES = new Set(["2h-sword", "2h-axe", "2h-mace"]);

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
  "nirnhoned-armor": { physResist: 301, spellResist: 301 },
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

// ESO armor slot-size mechanic: large slots get full glyph potency,
// small slots get ~40.5% (ratio of small/large gold glyph values, e.g. 193/477).
export const LARGE_ARMOR_SLOTS       = new Set(["head", "chest", "legs"]);
export const SMALL_ARMOR_ENCHANT_FACTOR = 193 / 477; // ≈ 0.4046

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
  "glyph-of-prismatic-defense": { maxHealth: 477, maxMagicka: 434, maxStamina: 434 }, // UESP item data (Truly Superb): 477/434/434

  // ── Jewelry glyphs ─────────────────────────────────────────────────
  // Both harm glyphs add BOTH Weapon Damage AND Spell Damage (gold quality = 174 each),
  // plus a secondary recovery stat.
  // Source: enchant JSON descriptions — "Adds X Weapon Damage and Spell Damage and 10 Stamina Recovery"
  "glyph-of-increase-physical-harm": { weaponDmg: 174, spellDmg: 174, staminaRecovery: 10 },
  "glyph-of-increase-magical-harm":  { spellDmg: 174, weaponDmg: 174, magickaRecovery: 10 },
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
// Source: UESP g_EsoBuildRules.buff["Battle Spirit"]
// In PvP zones (Cyrodiil, Battlegrounds, IC), Battle Spirit applies:
//   • Damage Taken:       -50%  (combat multiplier — not a raw stat-sheet entry)
//   • Healing Received:   -55%  (combat multiplier)
//   • Health Recovery:    -50%  (applied to the recovery stat)
//   • Damage Shield:      -50%  (combat multiplier)
//
// IMPORTANT: Battle Spirit does NOT modify Physical or Spell Resistance on the
// stat sheet. Resistances are displayed at their raw character-sheet values.
// The -50% damage taken is a separate combat modifier applied during damage calc.
export const BATTLE_SPIRIT_RECOVERY_MULT = 0.5;   // ×0.5 on Health Recovery

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
  // Source: UESP Special:ESO_BuildEditor — ESO_MUNDUS_BUFF_DATA.description (U50)
  // The Lady: Physical + Spell Resistance 2744 each
  "the-lady":        { statKey: "physResist",      value: 2744, statKey2: "spellResist",  value2: 2744 },
  // The Lover: Physical + Spell Penetration 2744 each
  "the-lover":       { statKey: "physPen",          value: 2744, statKey2: "spellPen",     value2: 2744 },
  // The Thief: Weapon + Spell Crit (+1333 critRating — UESP confirmed)
  "the-thief":       { statKey: "critRating",       value: 1333 },
  // The Shadow: +11% Critical Damage (UESP confirmed)
  "the-shadow":      { statKey: "critDamage",       value: 11,   isPct: true },
  // The Warrior: Weapon Damage +238 (UESP confirmed)
  "the-warrior":     { statKey: "weaponDmg",        value: 238 },
  // The Apprentice: Spell Damage +238 (UESP confirmed)
  "the-apprentice":  { statKey: "spellDmg",         value: 238 },
  // The Mage: Max Magicka +2023 (UESP confirmed)
  "the-mage":        { statKey: "maxMagicka",       value: 2023 },
  // The Tower: Max Stamina +2023 (UESP confirmed)
  "the-tower":       { statKey: "maxStamina",       value: 2023 },
  // The Lord: Max Health +2225 (UESP confirmed)
  "the-lord":        { statKey: "maxHealth",        value: 2225 },
  // The Atronach: Magicka Recovery +310 (UESP confirmed)
  "the-atronach":    { statKey: "magickaRecovery",  value: 310 },
  // The Serpent: Stamina Recovery +310 (UESP confirmed)
  "the-serpent":     { statKey: "staminaRecovery",  value: 310 },
  // The Steed: Health Recovery +238 (UESP confirmed — NOT 310)
  "the-steed":       { statKey: "healthRecovery",   value: 238 },
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
// Source: UESP Online:Races + Special:ESO_BuildEditor auto-purchase passives (U50).
// Only flat stat-sheet bonuses are included; combat procs, cost reductions,
// conditional regeneration, and speed bonuses are noted but excluded.
export const RACIAL: Record<string, Partial<ComputedStats>> = {
  // High Elf: +2000 Max Magicka; +258 WD & SD (Spellcharge / Highborn).
  // Excluded: +625 Mag/Stam restore every 6s (Syrabane's Boon), -5% dmg taken during cast.
  altmer:   { maxMagicka: 2000, spellDmg: 258, weaponDmg: 258 },

  // Argonian: +1000 Max Health + Max Magicka + Max Stamina (Resourceful / Life Mender).
  // Excluded: potion restore 3125, +2310 Disease/Poison Resist, +6% healing done.
  argonian: { maxHealth: 1000, maxMagicka: 1000, maxStamina: 1000 },

  // Wood Elf: +2000 Max Stamina (Nimble Climber); +258 WD & SD (Hunter's Eye).
  // Excluded: +4620 Poison/Disease Resist, physPen from Hunter's Eye (combat), +5% speed.
  bosmer:   { maxStamina: 2000, weaponDmg: 258, spellDmg: 258 },

  // Breton: +2000 Max Magicka; +2310 Spell Resist (Spell Attunement); +130 Mag Rec.
  // Excluded: -7% Magicka cost, conditional double-spell-resist on status.
  breton:   { maxMagicka: 2000, spellResist: 2310, magickaRecovery: 130 },

  // Dark Elf: +1910 Max Magicka + Max Stamina; +258 WD & SD (Dynamite Personality / Ancestor's Wrath).
  // Excluded: +4620 Flame Resist.
  dunmer:   { maxMagicka: 1910, maxStamina: 1910, spellDmg: 258, weaponDmg: 258 },

  // Imperial: +2000 Max Health; +2000 Max Stamina (Tough / Red Diamond).
  // Excluded: -6% ability cost, small health gain on kill.
  imperial: { maxHealth: 2000, maxStamina: 2000 },

  // Khajiit: +915 all pools (Cutpurse / Lunar Blessings); +90 all recovery (Robustness);
  // +12% Crit Damage & Crit Healing (Carnage).
  khajiit:  {
    maxHealth: 915, maxMagicka: 915, maxStamina: 915,
    healthRecovery: 90, magickaRecovery: 90, staminaRecovery: 90,
    critDamage: 12,
  },

  // Nord: +1000 Max Health; +1500 Max Stamina (Stalwart / Nord's Resolve);
  // +2600 Phys & Spell Resist (Rugged).
  // Excluded: +4620 Frost Resist, Ultimate gain on damage taken.
  nord:     { maxHealth: 1000, maxStamina: 1500, physResist: 2600, spellResist: 2600 },

  // Orc: +1000 Max Health; +1000 Max Stamina; +258 WD & SD (Brawny / Craftsman / Swift Warrior).
  // Excluded: -12% Sprint cost, +10% Sprint speed, heal-on-damage proc.
  orc:      { maxHealth: 1000, maxStamina: 1000, spellDmg: 258, weaponDmg: 258 },

  // Redguard: +2000 Max Stamina (Conditioning passive).
  // Excluded: Adrenaline Rush (restore 1005 Stam on hit/5s — proc, not flat stat),
  //           stamina regen after dodge/block (combat mechanic).
  redguard: { maxStamina: 2000 },
};

// ── CP slottable stars — flat contributions ─────────────────────────────────
// Source: src/data/eso/cp-stars-index.json — values verified in-game by author (U50).
// Stars that are combat modifiers (%, procs, conditional) are excluded from the stat sheet:
//   ironclad (−6% direct dmg taken), master-at-arms (% direct dmg), duelist's-rebuff,
//   unassailable, enduring-resolve, cleansing-revival (proc), celerity (+10% speed — no
//   stat-sheet entry in our model), slippery (auto break-free), pain's-refuge (conditional
//   % dmg per negative effect), force-of-nature, backstabber, exploiter, occult-overload.
export const CP_STAR_VALUES: Record<string, Partial<ComputedStats>> = {
  // ── Warfare ──────────────────────────────────────────────────────
  // fighting-finesse: "+4% crit dmg/healing per stage" — tooltip: 40% at max
  "fighting-finesse":   { critDamage: 40 },
  // wrathful-strikes: "Grants 205 Weapon and Spell Damage to your damaging abilities."
  "wrathful-strikes":   { weaponDmg: 205, spellDmg: 205 },
  // untamed-aggression: "Increases your Weapon and Spell Damage by 150."
  "untamed-aggression": { weaponDmg: 150, spellDmg: 150 },
  // arcane-supremacy: "Increases Maximum Magicka by 1300." (flat, not % pool)
  "arcane-supremacy":   { maxMagicka: 1300 },
  // endless-endurance: "Increases Maximum Stamina by 1300." (flat, not % pool)
  "endless-endurance":  { maxStamina: 1300 },
  // resilience: "Grants 660 Critical Resistance."
  "resilience":         { critResistance: 660 },

  // ── Fitness ──────────────────────────────────────────────────────
  // boundless-vitality: "Grants 1400 Maximum Health."
  "boundless-vitality": { maxHealth: 1400 },
  // fortified: "Grants 1731 Armor." (physResist + spellResist each)
  "fortified":          { physResist: 1731, spellResist: 1731 },
  // rejuvenation: "Grants 90 Health, Magicka, and Stamina Recovery."
  "rejuvenation":       { healthRecovery: 90, magickaRecovery: 90, staminaRecovery: 90 },
};

// CP stars that scale as a % of the current pool.
// Applied as multipliers AFTER all flat bonuses (including flat CP stars above).
// Note: arcane-supremacy, untamed-aggression, endless-endurance were previously modelled
// here as 2% pool bonuses (from The Hist API). The in-game tooltip shows flat values —
// moved to CP_STAR_VALUES above.
export const CP_STAR_PCT: Record<string, Partial<Record<"maxHealth" | "maxMagicka" | "maxStamina", number>>> = {
  // (empty — all formerly-% stars are now confirmed flat; kept for future use)
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
// Per-slot armor ratings (Physical + Spell Resistance contribution).
// UESP does not publish these in any accessible wiki page — they live in
// esoitem.uesp.net (private item DB). Values below come from The Hist and
// match community consensus across multiple patches. Kept as-is.
// CP160 gold quality — source: ESO forums community data (VR16/CP160 DB patch)
// Slot groups: chest (largest) · head/shoulders/legs/feet (equal) · hands · waist (smallest)
export const ARMOR_BASE: Record<ArmorWeight, Record<string, number>> = {
  heavy: {
    head: 2425, shoulders: 2425, chest: 2772,
    hands: 1386, waist: 1039, legs: 2425, feet: 2425,
  },
  medium: {
    head: 1823, shoulders: 1823, chest: 2084,
    hands: 1042, waist:  781, legs: 1823, feet: 1823,
  },
  light: {
    head: 1221, shoulders: 1221, chest: 1396,
    hands:  698, waist:  523, legs: 1221, feet: 1221,
  },
};

// Source: ESO forums community data (same thread as ARMOR_BASE, CP160 gold).
// Non-reinforced gold shield = 1675. Reinforced = 1995 (~19% on shields vs 16% on armor).
export const SHIELD_BASE_ARMOR = 1675;

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
  // mighty-chudan: now correctly expressed in the JSON (1pc Armor, 2pc Max Health + Armor/Major Resolve)
};

export const SET_CONDITIONAL_BONUSES: Record<string, Array<{ count: number; contrib: Partial<ComputedStats>; note: string }>> = {
  "twice-fanged-serpent": [
    { count: 5, contrib: { physPen: 6600, spellPen: 6600 }, note: "10 stacks × +660 pen (max stacks)" },
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
// Note: Twin Blade and Blunt applies ONE sub-passive per bar 1 MAIN-HAND weapon type,
//       but ONLY when the bar type is dual_wield (it is a Dual Wield skill-line passive).
// requiresBarType: if set, the passive is skipped unless deriveBarType() returns this value.
export const WEAPON_LINE_PASSIVE: Record<string, {
  weaponType:      string;
  requiresBarType?: string;
  contrib:         Partial<ComputedStats>;
}> = {
  "accuracy":                    { weaponType: "bow",    contrib: { critRating: 1314 } },
  "twin-blade-and-blunt-axe":    { weaponType: "axe",    requiresBarType: "dual_wield", contrib: { critDamage: 6 } },
  "twin-blade-and-blunt-mace":   { weaponType: "mace",   requiresBarType: "dual_wield", contrib: { physPen: 743, spellPen: 743 } },
  "twin-blade-and-blunt-sword":  { weaponType: "sword",  requiresBarType: "dual_wield", contrib: { weaponDmg: 64, spellDmg: 64 } },
  "twin-blade-and-blunt-dagger": { weaponType: "dagger", requiresBarType: "dual_wield", contrib: { critRating: 328 } },
};

// ── Class passives ──────────────────────────────────────────────────────────
// Source: The Hist /api/passives/grouped + ESO Skillbook — U50.
// Only unconditional flat stat passives are modelled here (no "while X is active").
export const CLASS_PASSIVE_VALUES: Record<string, { classId: string; contrib: Partial<ComputedStats> }> = {
  // DK: Heart of Stone (Earthen Heart) — "Increases your Armor by 2974."
  // In ESO, "Armor" = both Physical Resistance AND Spell Resistance.
  // Source: ESO Hub — U50 value: 2974 to both physResist and spellResist.
  // Note: ~40k in-game resistance comes from active skill buffs (Major Resolve +5948)
  // which are combat buffs, not modelled in this static sheet.
  "heart-of-stone":       { classId: "dragonknight",  contrib: { physResist: 2974, spellResist: 2974 } },
  // DK: Elder Dragon (Draconic Power) — +700 Health Recovery.
  // Source: The Hist /api/passives/grouped — "Increases your Health Recovery by 700."
  "elder-dragon":         { classId: "dragonknight",  contrib: { healthRecovery: 700 } },
  // NOTE: blessing-at-the-peak removed — The Hist confirms it is Ultimate generation
  // (10 ulti/s when casting Earthen Heart abilities), NOT a stat-sheet entry.
  // Templar: Piercing Spear — 10% crit damage (was 12).
  "piercing-spear":       { classId: "templar",        contrib: { critDamage: 10 } },
  "hemorrhage":           { classId: "nightblade",     contrib: { critDamage: 10 } },
  // Warden: Flourish (Green Balance) — +51 Magicka and Stamina Recovery.
  // Source: The Hist /api/derive-stats stat_sources — "Class Passive: flourish: 51"
  // Applied unconditionally when class = warden (all 3 skill lines contribute).
  "flourish":             { classId: "warden",         contrib: { magickaRecovery: 51, staminaRecovery: 51 } },
  // Necromancer: Last Gasp (Bone Tyrant) — "Increases your Max Health by 2412."
  // Source: ESO Skillbook — R2 value: 2412. Unconditional.
  // Skipped conditionals: Dismember (+1500 pen while Gravelord active),
  //   Death Gleaning (restore on kill), Undead Confederate (while summon active).
  "last-gasp":            { classId: "necromancer",    contrib: { maxHealth: 2412 } },
  // Arcanist: no unconditional flat stat passives confirmed.
  // Aegis of the Unseen (+3271 Armor) requires a Soldier of Apocrypha ability active.
  // Fated Fortune (+12% crit dmg) is a 7s buff on Crux gen/consumption.
  // Both conditional → not modelled here.
};

export const CLASS_PASSIVE_POOL_PCT: Record<string, {
  classId: string;
  pools: Partial<Record<"maxHealth" | "maxMagicka" | "maxStamina", number>>;
}> = {
  "magicka-flood":   { classId: "nightblade", pools: { maxMagicka: 0.06, maxStamina: 0.06 } },
  "expert-summoner": { classId: "sorcerer",   pools: { maxMagicka: 0.05, maxStamina: 0.05 } },
};

// ── CP passive (non-slottable) stars — always active at CP810+ ───────────────
// Source: ESO-Hub verified 2026-05-28. These are passive (Is slotable: No) CP stars
// that auto-apply when enough CP is invested in the node (assumes max stages at CP810+).
// NOT stored in build.cp — applied unconditionally.
//
// Verified values (ESO-Hub 2026-05-28):
//   war-mage          Warfare/Extended Might — +100 WSD to Magical attacks (1 stage, 30 pts)
//                     Applied as spellDmg only — conditional on magical damage type.
//   eldritch-insight  Warfare — +260 Max Magicka/stage × 2 stages (jump pts 0,10,20)
//   tireless-discipline Warfare — +260 Max Stamina/stage × 2 stages (jump pts 0,10,20)
//   piercing          Warfare/Extended Might — +350 Offensive Penetration/stage × 2 (jump pts 0,10,20)
//   precision         Warfare — +160 Critical Chance/stage × 2 (jump pts 0,10,20)
//   fortification     REMOVED — Fitness, +2% block mitigation/stage, NOT a stat we model
//   battle-mastery    REMOVED — Warfare/Extended Might, +30% Martial status effect chance/stage, NOT critDamage
export const CP_PASSIVE_VALUES: Array<{ id: string; contrib: Partial<ComputedStats> }> = [
  { id: "war-mage",            contrib: { spellDmg: 100 } },              // +100 WSD to Magical attacks (1 stage) — approx as spellDmg
  { id: "mighty",              contrib: { weaponDmg: 100 } },             // +100 WSD to Martial attacks (1 stage) — Warfare/Extended Might
  { id: "eldritch-insight",    contrib: { maxMagicka: 520 } },            // +260 Mag/stage × 2
  { id: "tireless-discipline", contrib: { maxStamina: 520 } },            // +260 Stam/stage × 2
  { id: "piercing",            contrib: { physPen: 700, spellPen: 700 } },// +350 OffPen/stage × 2
  { id: "precision",           contrib: { critRating: 320 } },            // +160 Crit/stage × 2
  // Fitness always-on path passives
  { id: "heros-vigor",         contrib: { maxHealth: 560 } },             // +280 HP/stage × 2 — Fitness tree
];

// ── Active buff / debuff definitions ──────────────────────────────────────
// Buffs toggled in the Buffs tab (build.bx[]). Each has a flat contribution
// and/or a % multiplier on a stat pool. Values from ESO in-game tooltips U50.
//
//  type "buff"   — self-buff; directly adds to your stat sheet.
//  type "debuff" — enemy debuff; modelled as an equivalent stat bonus on your
//                  sheet (e.g. Major Breach → physPen/spellPen, since reducing
//                  enemy armor has the same effect as increasing your penetration).
//
//  group — sub-category used for grouping inside each type:
//    offense  : damage / crit
//    defense  : resistances
//    recovery : recovery rates (health/magicka/stamina)
//
// ── Crit rating values (U50, verified via UESP ESO_BUFF_DATA):
//    Major Prophecy / Major Savagery  : +2191 critRating ≈ +10% crit
//    Minor Prophecy / Minor Savagery  : +1096 critRating ≈ +5%  crit
//    Note: Prophecy = Spell Crit, Savagery = Weapon Crit — unified as critRating here.
//
// ── Courage values (U50):
//    Major Courage : +430 Weapon Damage + Spell Damage
//    Minor Courage : +215 Weapon Damage + Spell Damage
//
export type BuffDef = {
  id:    string;
  label: string;
  group: "offense" | "defense" | "recovery";
  hintSuffix?: string;
  contrib?: Partial<ComputedStats>;                           // flat add
  pct?:    { keys: (keyof ComputedStats)[]; factor: number };// multiply pool
};

export const BUFF_DEFS: BuffDef[] = [

  // ── Offense ───────────────────────────────────────────────────────────
  { id: "major-brutality",  label: "Major Brutality",  group: "offense",
    pct: { keys: ["weaponDmg"], factor: 1.20 } },
  { id: "minor-brutality",  label: "Minor Brutality",  group: "offense",
    pct: { keys: ["weaponDmg"], factor: 1.10 } },
  { id: "major-sorcery",    label: "Major Sorcery",    group: "offense",
    pct: { keys: ["spellDmg"], factor: 1.20 } },
  { id: "minor-sorcery",    label: "Minor Sorcery",    group: "offense",
    pct: { keys: ["spellDmg"], factor: 1.10 } },
  { id: "major-courage",    label: "Major Courage",    group: "offense",
    contrib: { weaponDmg: 430, spellDmg: 430 } },
  { id: "minor-courage",    label: "Minor Courage",    group: "offense",
    contrib: { weaponDmg: 215, spellDmg: 215 } },
  { id: "major-force",      label: "Major Force",      group: "offense",
    contrib: { critDamage: 20 } },
  { id: "minor-force",      label: "Minor Force",      group: "offense",
    contrib: { critDamage: 10 } },
  { id: "major-prophecy",   label: "Major Prophecy",   group: "offense",
    contrib: { critRating: 2191 } },  // Spell Crit ≈ +10%
  { id: "minor-prophecy",   label: "Minor Prophecy",   group: "offense",
    contrib: { critRating: 1096 } },  // ≈ +5%
  { id: "major-savagery",   label: "Major Savagery",   group: "offense",
    contrib: { critRating: 2191 } },  // Weapon Crit ≈ +10%
  { id: "minor-savagery",   label: "Minor Savagery",   group: "offense",
    contrib: { critRating: 1096 } },  // ≈ +5%

  // ── Defense ───────────────────────────────────────────────────────────
  { id: "major-resolve",    label: "Major Resolve",    group: "defense",
    contrib: { physResist: 5948, spellResist: 5948 } },
  { id: "minor-resolve",    label: "Minor Resolve",    group: "defense",
    contrib: { physResist: 2974, spellResist: 2974 } },

  // ── Resources (recovery rate, not max pool) ───────────────────────────────
  { id: "major-fortitude",  label: "Major Fortitude",  group: "recovery",
    pct: { keys: ["healthRecovery"],   factor: 1.30 } },
  { id: "minor-fortitude",  label: "Minor Fortitude",  group: "recovery",
    pct: { keys: ["healthRecovery"],   factor: 1.15 } },
  { id: "major-endurance",  label: "Major Endurance",  group: "recovery",
    pct: { keys: ["staminaRecovery"],  factor: 1.30 } },
  { id: "minor-endurance",  label: "Minor Endurance",  group: "recovery",
    pct: { keys: ["staminaRecovery"],  factor: 1.15 } },
  { id: "major-intellect",  label: "Major Intellect",  group: "recovery",
    pct: { keys: ["magickaRecovery"],  factor: 1.30 } },
  { id: "minor-intellect",  label: "Minor Intellect",  group: "recovery",
    pct: { keys: ["magickaRecovery"],  factor: 1.15 } },
];

export const BUFF_DEF_MAP: Record<string, BuffDef> = Object.fromEntries(
  BUFF_DEFS.map((b) => [b.id, b]),
);

// Kept for external callers.
export function isTwoHanded(wp?: string): boolean {
  return !!wp && (TWO_HANDED_TYPES.has(wp) || wp === "bow" || STAFF_TYPES.has(wp));
}

export const TWO_H_DOUBLED_TRAITS = new Set<string>();
