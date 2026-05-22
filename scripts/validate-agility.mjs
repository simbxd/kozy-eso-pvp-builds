/**
 * validate-agility.mjs
 * --------------------
 * Verifies the Medium Armor "Agility" passive value (+1%? WD+SD per piece)
 * by comparing two builds against The Hist /api/derive-stats:
 *   Build A: 7 medium armor pieces
 *   Build B: 0 armor pieces (jewelry + weapons only, no body armor)
 *
 * The delta on weapon_damage and spell_damage between A and B should equal
 * the Agility contribution (if it is a % passive, it scales with the pool).
 *
 * Usage:  node scripts/validate-agility.mjs
 */

const API = "https://hist.britt0nia.com/api/derive-stats";

// ── Common base ──────────────────────────────────────────────────────────────

const BASE_BUILD = {
  name: "Agility Test Base",
  race: "dunmer",
  player_class: "nightblade",
  base_class: "nightblade",
  skill_line_slot1: "assassination",
  skill_line_slot2: "shadow",
  skill_line_slot3: "siphoning",
  attributes: { magicka: 0, health: 0, stamina: 64 },
  food: null,
  mundus: "the-warrior",
  front_bar:  { weapon_type: "dual_wield", trait: "precise",   enchant: "absorb_stamina" },
  back_bar:   { weapon_type: "dual_wield", trait: "defending", enchant: "damage_shield" },
};

// ── Build A: 7 medium pieces (Tzogvin's Warband — medium PvP set) ────────────
// Using Hunding's Rage as a well-known crafted medium set.
// All Divines to avoid mundus interference; enchant doesn't matter for WD/SD test.
const BUILD_A = {
  ...BASE_BUILD,
  name: "Agility Test — 7 Medium",
  gear: {
    head:      { set: "hundings-rage",  weight: "medium", trait: "divines", enchant: "stamina" },
    shoulders: { set: "hundings-rage",  weight: "medium", trait: "divines", enchant: "stamina" },
    chest:     { set: "hundings-rage",  weight: "medium", trait: "divines", enchant: "stamina" },
    legs:      { set: "hundings-rage",  weight: "medium", trait: "divines", enchant: "stamina" },
    hands:     { set: "hundings-rage",  weight: "medium", trait: "divines", enchant: "stamina" },
    waist:     { set: "hundings-rage",  weight: "medium", trait: "divines", enchant: "stamina" },
    feet:      { set: "hundings-rage",  weight: "medium", trait: "divines", enchant: "stamina" },
    necklace:  { set: "hundings-rage",  trait: "robust",  enchant: "weapon_damage" },
    ring1:     { set: "hundings-rage",  trait: "robust",  enchant: "weapon_damage" },
    ring2:     { set: "hundings-rage",  trait: "robust",  enchant: "weapon_damage" },
  },
};

// ── Build B: 0 body armor, same jewelry+weapons ───────────────────────────────
// (No chest/legs/etc — just the jewelry+weapons so Agility doesn't fire)
const BUILD_B = {
  ...BASE_BUILD,
  name: "Agility Test — 0 Medium",
  gear: {
    necklace:  { set: "hundings-rage",  trait: "robust",  enchant: "weapon_damage" },
    ring1:     { set: "hundings-rage",  trait: "robust",  enchant: "weapon_damage" },
    ring2:     { set: "hundings-rage",  trait: "robust",  enchant: "weapon_damage" },
  },
};

// ── Fetch ────────────────────────────────────────────────────────────────────

async function deriveStats(build) {
  const resp = await fetch(API, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ build }),
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`HTTP ${resp.status}: ${txt}`);
  }
  const data = await resp.json();
  return data.derived_stats ?? data.stats ?? data;
}

console.log("Fetching build A (7× medium)…");
const statsA = await deriveStats(BUILD_A);

console.log("Fetching build B (0 medium)…");
const statsB = await deriveStats(BUILD_B);

// ── Compare ──────────────────────────────────────────────────────────────────

const wdA  = statsA.weapon_damage  ?? 0;
const sdA  = statsA.spell_damage   ?? 0;
const wdB  = statsB.weapon_damage  ?? 0;
const sdB  = statsB.spell_damage   ?? 0;

const deltaWD = wdA - wdB;
const deltaSD = sdA - sdB;

console.log("\n=== AGILITY PASSIVE COMPARISON ===\n");
console.log(`                    Build A (7 medium)   Build B (0 medium)   Delta`);
console.log(`Weapon Damage       ${String(wdA).padStart(8)}              ${String(wdB).padStart(8)}          ${String(deltaWD).padStart(6)}`);
console.log(`Spell Damage        ${String(sdA).padStart(8)}              ${String(sdB).padStart(8)}          ${String(deltaSD).padStart(6)}`);

if (deltaWD > 0) {
  const pctOfBase = ((deltaWD / wdB) * 100).toFixed(2);
  const perPiece  = (deltaWD / 7).toFixed(1);
  console.log(`\nWD delta = +${deltaWD} (+${pctOfBase}% of base with 0 armor)`);
  console.log(`Per medium piece  = ${perPiece} WD`);
  console.log(`\nIf Agility is 1% per piece × 7 pieces = 7% → expected delta ≈ ${Math.round(wdB * 0.07)} WD`);
  console.log(`If Agility is flat (not %) → we need to check the raw value in stat_sources`);
} else {
  console.log("\nNo WD delta — Agility might not be resolved by inline builds.");
}

// Print full stat_sources for weapon_damage if available
if (statsA.stat_sources?.weapon_damage) {
  console.log("\n=== BUILD A — weapon_damage stat_sources ===");
  for (const src of statsA.stat_sources.weapon_damage) {
    console.log(`  ${src.source ?? src.label}: ${src.value}`);
  }
}
if (statsB.stat_sources?.weapon_damage) {
  console.log("\n=== BUILD B — weapon_damage stat_sources ===");
  for (const src of statsB.stat_sources.weapon_damage) {
    console.log(`  ${src.source ?? src.label}: ${src.value}`);
  }
}

console.log("\n=== BUILD A FULL stat_sources (raw) ===");
console.log(JSON.stringify(statsA.stat_sources ?? {}, null, 2));
