/**
 * compare-set-bonuses.mjs
 * -----------------------
 * Compares our esolog-scraped set bonus values against The Hist's /api/sets
 * parsed values to identify discrepancies or missing stat mappings.
 *
 * Usage:  node scripts/compare-set-bonuses.mjs
 *
 * Output:
 *   - MATCH     → our value == The Hist max_value  (silent unless --verbose)
 *   - MISMATCH  → different values
 *   - HIST_ONLY → The Hist has a stat we don't (or ours has no value)
 *   - UNRESOLVED→ we have a stat The Hist uses that our resolveStatKey doesn't handle
 */

import { readdir, readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dir  = dirname(fileURLToPath(import.meta.url));
const SETS_DIR = join(__dir, "../src/content/sets");

const VERBOSE = process.argv.includes("--verbose");

// ── Load our set files ───────────────────────────────────────────────────────

const files = await readdir(SETS_DIR);
const ourSets = new Map();

for (const file of files) {
  if (!file.endsWith(".json")) continue;
  const raw  = await readFile(join(SETS_DIR, file), "utf8");
  const data = JSON.parse(raw);
  if (data.id) ourSets.set(data.id, data);
  // Also index by name (normalized) in case IDs differ
  if (data.name) ourSets.set(normalizeKey(data.name), data);
}

console.log(`Loaded ${files.length} local set files.\n`);

// ── Fetch The Hist sets ──────────────────────────────────────────────────────

console.log("Fetching The Hist /api/sets …");
const resp = await fetch("https://hist.britt0nia.com/api/sets");
if (!resp.ok) {
  console.error(`HTTP ${resp.status}: ${resp.statusText}`);
  process.exit(1);
}
const { sets: histSets } = await resp.json();
console.log(`The Hist returned ${histSets.length} sets.\n`);

// ── Stat name normalizer (The Hist → our format) ─────────────────────────────

// Maps The Hist's parsed stat names to our bonus.stat strings
const STAT_NAME_MAP = {
  "Maximum Health":         "Max Health",
  "Maximum Magicka":        "Max Magicka",
  "Maximum Stamina":        "Max Stamina",
  "Weapon and Spell Damage":"Weapon and Spell Damage",
  "Health Recovery":        "Health Recovery",
  "Magicka Recovery":       "Magicka Recovery",
  "Stamina Recovery":       "Stamina Recovery",
  "Critical Chance":        "Critical Chance",
  "Critical Resistance":    "Critical Resistance",
  "Critical Damage and Healing": "Critical Damage and Healing",
  "Offensive Penetration":  "Offensive Penetration",
  "Armor":                  "Armor",
};

// Normalize a set name to a slug-like key for matching
function normalizeKey(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// Match a Hist set to one of our sets
function findOurSet(histSet) {
  const nameKey = normalizeKey(histSet.name);
  // Try by our ID (which should match the normalized name)
  if (ourSets.has(nameKey)) return ourSets.get(nameKey);
  // Try some common variations
  const variations = [
    nameKey,
    nameKey.replace(/^the-/, ""),
    "the-" + nameKey,
  ];
  for (const v of variations) {
    if (ourSets.has(v)) return ourSets.get(v);
  }
  return null;
}

// ── Compare ──────────────────────────────────────────────────────────────────

let matched = 0, mismatches = 0, ourOnly = 0, histOnly = 0, unresolved = 0;
let noLocalData = 0;
const mismatchList = [];
const unresolvedStats = new Map();  // stat name → count

for (const histSet of histSets) {
  const ourSet = findOurSet(histSet);
  if (!ourSet) {
    noLocalData++;
    continue;
  }

  // Compare each bonus slot that The Hist has parsed with high confidence
  for (const [slot, bonus] of Object.entries(histSet.bonuses)) {
    if (!bonus.parsed?.parsed || bonus.parsed.confidence !== "high") continue;
    const parsed = bonus.parsed.parsed;
    if (!parsed.stat || !parsed.max_value) continue;

    const histStatName = parsed.stat;
    const histValue    = parsed.max_value;
    const pc = parseInt(slot.replace("pc", ""), 10);

    // Find matching entry in our data
    const ourBonus = ourSet.bonuses?.find(b => b.count === pc);
    if (!ourBonus) {
      histOnly++;
      if (VERBOSE) {
        console.log(`[HIST_ONLY] ${histSet.name} ${slot}: ${histStatName} = ${histValue} (we have nothing for ${slot})`);
      }
      continue;
    }

    // Check if we handle this stat name at all
    const mappedName = STAT_NAME_MAP[histStatName];
    if (!mappedName) {
      // The Hist has a stat we don't know how to map
      unresolvedStats.set(histStatName, (unresolvedStats.get(histStatName) ?? 0) + 1);
      unresolved++;
      continue;
    }

    // Compare our value vs The Hist's max_value
    if (ourBonus.stat !== mappedName && ourBonus.stat !== histStatName) {
      // Different stat type for same slot
      if (VERBOSE) {
        console.log(`[STAT_DIFF] ${ourSet.name} ${slot}: ours="${ourBonus.stat}"/${ourBonus.value} vs hist="${histStatName}"/${histValue}`);
      }
      mismatches++;
      mismatchList.push({ set: ourSet.name, slot, ours: `${ourBonus.stat}:${ourBonus.value}`, hist: `${histStatName}:${histValue}` });
      continue;
    }

    const ourValue = ourBonus.value;
    if (ourValue == null || ourValue === "") {
      histOnly++;
      continue;
    }

    if (Number(ourValue) === histValue) {
      matched++;
      if (VERBOSE) console.log(`[MATCH]  ${ourSet.name} ${slot}: ${histStatName} = ${histValue}`);
    } else {
      mismatches++;
      mismatchList.push({
        set: ourSet.name, slot,
        ours: `${ourBonus.stat}:${ourValue}`,
        hist: `${histStatName}:${histValue}`,
      });
    }
  }

  ourOnly = 0; // (we don't check our-only direction here)
}

// ── Report ───────────────────────────────────────────────────────────────────

console.log(`\n=== SET BONUS COMPARISON SUMMARY ===`);
console.log(`Sets not in our DB :  ${noLocalData}`);
console.log(`Matched (exact)    :  ${matched}`);
console.log(`Mismatches         :  ${mismatches}`);
console.log(`Hist-only slots    :  ${histOnly}`);
console.log(`Unresolved stats   :  ${unresolved}`);

if (mismatchList.length > 0) {
  console.log("\n=== MISMATCHES ===");
  console.log("(Ours vs The Hist)\n");
  for (const m of mismatchList) {
    console.log(`  ${m.set.padEnd(40)} ${m.slot.padEnd(4)}  ours: ${m.ours.padEnd(30)}  hist: ${m.hist}`);
  }
}

if (unresolvedStats.size > 0) {
  console.log("\n=== UNRESOLVED STAT NAMES (in The Hist but not in our STAT_NAME_MAP) ===");
  const sorted = [...unresolvedStats.entries()].sort((a, b) => b[1] - a[1]);
  for (const [stat, count] of sorted) {
    console.log(`  ${count.toString().padStart(3)}×  "${stat}"`);
  }
}

console.log("\nNotes:");
console.log("  • Only 'high' confidence parsed bonuses are compared.");
console.log("  • 5pc conditional procs (confidence: low) are skipped.");
console.log("  • Sets not found in our DB are skipped (noLocalData count).");
