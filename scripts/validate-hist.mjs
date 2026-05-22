/**
 * validate-hist.mjs
 * -----------------
 * Calls The Hist /api/derive-stats with their example build and prints the
 * computed stats. Compare the output against what our builder displays for
 * the same configuration.
 *
 * Usage:  node scripts/validate-hist.mjs
 *
 * Setup the same build in the builder UI to compare:
 *   Race:     Argonian
 *   Class:    Warden
 *   Attr:     64 Magicka
 *   Food:     Bewitched Sugar Skulls
 *   Mundus:   The Atronach
 *   Gear:
 *     Head/Shoulders  → Earthgore   · Light  · Divines    · Glyph of Magicka
 *     Chest           → Gossamer    · Light  · Reinforced · Glyph of Health
 *     Legs            → Gossamer    · Light  · Divines    · Glyph of Magicka
 *     Hands           → Gossamer    · Heavy  · Divines    · Glyph of Magicka
 *     Waist           → Gossamer    · Medium · Divines    · Glyph of Magicka
 *     Feet            → Gossamer    · Light  · Divines    · Glyph of Magicka
 *     Neck/Ring1/Ring2 → Transmutation · Infused · Glyph of Spell Dmg
 */

const API = "https://hist.britt0nia.com/api/derive-stats";

const EXAMPLE_BUILD = {
  name: "Validate Hist Reference",
  race: "argonian",
  player_class: "warden",
  base_class: "warden",
  skill_line_slot1: "animal_companions",
  skill_line_slot2: "green_balance",
  skill_line_slot3: "winters_embrace",
  attributes: { magicka: 64, health: 0, stamina: 0 },
  food: "bewitched-sugar-skulls",
  mundus: "the-atronach",
  front_bar: { weapon_type: "restoration_staff", trait: "powered", enchant: "weapon_damage" },
  back_bar:  { weapon_type: "restoration_staff", trait: "defending", enchant: "damage_shield" },
  gear: {
    head:      { set: "earthgore",     weight: "light",  trait: "divines",    enchant: "magicka" },
    shoulders: { set: "earthgore",     weight: "light",  trait: "divines",    enchant: "magicka" },
    chest:     { set: "gossamer",      weight: "light",  trait: "reinforced", enchant: "health"  },
    legs:      { set: "gossamer",      weight: "light",  trait: "divines",    enchant: "magicka" },
    hands:     { set: "gossamer",      weight: "heavy",  trait: "divines",    enchant: "magicka" },
    waist:     { set: "gossamer",      weight: "medium", trait: "divines",    enchant: "magicka" },
    feet:      { set: "gossamer",      weight: "light",  trait: "divines",    enchant: "magicka" },
    necklace:  { set: "transmutation", trait: "infused", enchant: "spell_damage" },
    ring1:     { set: "transmutation", trait: "infused", enchant: "spell_damage" },
    ring2:     { set: "transmutation", trait: "infused", enchant: "spell_damage" },
  },
};

// ── Stats we care about for comparison ──────────────────────────────────────

// Keys match The Hist's actual JSON response (verified from live output).
// Notes:
//   spell_crit / weapon_crit are 0–1 ratios → displayed as %
//   crit_damage is 0–1 ratio (0.5 = 50%)
//   Our critRating is ~equivalent to spell_crit via formula: rating / 219 / 10
const STAT_LABELS = {
  max_health:           "Max Health",
  max_magicka:          "Max Magicka",
  max_stamina:          "Max Stamina",
  weapon_damage:        "Weapon Dmg",
  spell_damage:         "Spell Dmg",
  physical_resistance:  "Phys Resist",
  spell_resistance:     "Spell Resist",
  spell_crit:           "Spell Crit",       // ratio: 0.15 = 15%
  weapon_crit:          "Weapon Crit",      // ratio: 0.12 = 12%
  crit_damage:          "Crit Damage",      // ratio: 0.5 = 50%
  physical_penetration: "Phys Pen",
  spell_penetration:    "Spell Pen",
  health_recovery:      "Health Rec",
  magicka_recovery:     "Magicka Rec",
  stamina_recovery:     "Stamina Rec",
};

// ── Fetch ────────────────────────────────────────────────────────────────────

console.log("Calling POST /api/derive-stats …\n");

const resp = await fetch(API, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ build: EXAMPLE_BUILD }),
});

if (!resp.ok) {
  console.error(`HTTP ${resp.status}: ${resp.statusText}`);
  const body = await resp.text();
  console.error(body);
  process.exit(1);
}

const data = await resp.json();

// ── Print full response for debugging ────────────────────────────────────────

console.log("=== FULL RESPONSE (raw) ===");
console.log(JSON.stringify(data, null, 2));

// ── Print formatted stat table ────────────────────────────────────────────────

// The Hist response may have nested shape; try to find the stats object.
const statsObj =
  data.derived_stats ??
  data.stats ??
  data.base_stats ??
  data;

console.log("\n=== THE HIST — DERIVED STATS ===");
console.log("(Compare these against the builder sidebar with the same build)\n");

const col1 = 18;
const col2 = 12;

console.log(
  "Stat".padEnd(col1) + "The Hist".padStart(col2)
);
console.log("-".repeat(col1 + col2));

const PCT_KEYS = new Set(["spell_crit", "weapon_crit", "crit_damage"]);

for (const [key, label] of Object.entries(STAT_LABELS)) {
  const val = statsObj[key] ?? "—";
  let display;
  if (val === "—") {
    display = "—";
  } else if (PCT_KEYS.has(key) && typeof val === "number") {
    // Ratio → percentage string (0.1499 → "14.99%")
    display = `${(val * 100).toFixed(2)}%`;
  } else {
    display = typeof val === "number" ? val.toLocaleString("en-US") : String(val);
  }
  console.log(label.padEnd(col1) + display.padStart(col2));
}

console.log("\nNotes for comparison:");
console.log("  • The Hist does NOT apply food via this endpoint (active_buffs needed).");
console.log("    Subtract your food bonus from the builder values before comparing.");
console.log("  • Phys Resist / Spell Resist here are PRE-Battle Spirit.");
console.log("    Our builder applies BS ×0.5 — disable BS toggle when comparing.");
console.log("  • spell_crit includes prodigy+base; weapon_crit includes dexterity+base.");
console.log("    Our critRating is a unified pool; expect slight divergence (~2%).");
console.log("  • Set bonuses are NOT resolved via inline build — spin up a full build");
console.log("    on hist.britt0nia.com and compare via build_slug for set verification.\n");
