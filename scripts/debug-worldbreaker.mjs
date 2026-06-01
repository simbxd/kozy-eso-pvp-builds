/**
 * Debug script — inline all data to avoid import.meta.glob
 * Run: node scripts/debug-worldbreaker.mjs
 */
import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// ── 1. Load all sets from JSON ────────────────────────────────────────────────
const setsDir = join(root, "src/content/sets");
const setMap = {};
for (const f of readdirSync(setsDir)) {
  if (!f.endsWith(".json")) continue;
  const s = JSON.parse(readFileSync(join(setsDir, f), "utf-8"));
  setMap[s.id] = s;
}
function getSet(id) { return setMap[id] ?? null; }

// ── 2. Constants (inlined from eso-bonuses.ts) ───────────────────────────────
const BASE = {
  maxHealth: 16000, maxMagicka: 12000, maxStamina: 12000,
  spellDmg: 1000, weaponDmg: 1000,
  healthRecovery: 309, magickaRecovery: 514, staminaRecovery: 514,
  physResist: 0, spellResist: 0, critResistance: 1320,
  critRating: 2190, critDamage: 50, physPen: 0, spellPen: 0, moveSpeed: 0,
};
const ATTR_PER_POINT_HEALTH  = 122;
const ATTR_PER_POINT_MAGSAM  = 111;
const RACIAL = {
  dunmer: { maxMagicka: 1910, maxStamina: 1910, spellDmg: 258, weaponDmg: 258 },
};
const FOOD_VALUES = {
  "bewitched-sugar-skulls": { maxHealth: 4620, maxMagicka: 4250, maxStamina: 4250, healthRecovery: 462 },
};
const ENCHANT_VALUES = {
  "glyph-of-magicka":           { maxMagicka: 868 },
  "glyph-of-stamina":           { maxStamina: 868 },
  "glyph-of-health":            { maxHealth: 952 },
  "glyph-of-prismatic-defense": { maxHealth: 477, maxMagicka: 434, maxStamina: 434 }, // UESP Truly Superb: 477/434/434
  // Both give WD+SD+recovery (confirmed from enchant JSON descriptions).
  "glyph-of-increase-physical-harm": { weaponDmg: 174, spellDmg: 174, staminaRecovery: 10 },
  "glyph-of-increase-magical-harm":  { spellDmg: 174, weaponDmg: 174, magickaRecovery: 10 },
};
const TRAIT_VALUES = {
  // Jewelry
  triune:    { maxHealth: 480, maxMagicka: 436, maxStamina: 436 },
  healthy:   { maxHealth: 966 },
  arcane:    { maxMagicka: 877 },
  robust:    { maxStamina: 877 },
  // Armor
  "impenetrable":    { critResistance: 132 },
  "nirnhoned-armor": { physResist: 253, spellResist: 253 },
  "invigorating":    { healthRecovery: 16, magickaRecovery: 16, staminaRecovery: 16 },
};
const CP_STAR_VALUES = {
  "fighting-finesse":   { critDamage: 40 },
  "fortified":          { physResist: 1731, spellResist: 1731 },
};
const CP_PASSIVE_VALUES = [
  { id: "war-mage",            contrib: { spellDmg: 100 } },              // Warfare — +100 WSD to Magical attacks
  { id: "mighty",              contrib: { weaponDmg: 100 } },             // Warfare — +100 WSD to Martial attacks
  { id: "eldritch-insight",    contrib: { maxMagicka: 520 } },            // Warfare — +260/stage × 2
  { id: "tireless-discipline", contrib: { maxStamina: 520 } },            // Warfare — +260/stage × 2
  { id: "piercing",            contrib: { physPen: 700, spellPen: 700 } },// Warfare — +350 OffPen/stage × 2
  { id: "precision",           contrib: { critRating: 320 } },            // Warfare — +160 Crit/stage × 2
  { id: "heros-vigor",         contrib: { maxHealth: 560 } },             // Fitness — +280 HP/stage × 2
];
const SET_BONUS_OVERRIDES = {
  // mighty-chudan: now correctly expressed in the JSON (1pc Armor, 2pc Max Health + Armor/Major Resolve)
};
const SET_CONDITIONAL_BONUSES = {
  "twice-fanged-serpent": [
    { count: 5, contrib: { physPen: 6600, spellPen: 6600 }, note: "10 stacks × 660 pen (max)" },
  ],
  "rallying-cry": [
    { count: 5, contrib: { weaponDmg: 300, spellDmg: 300, critResistance: 1650 }, note: "Healing crit proc" },
  ],
};
const MARKYN_PER_QUALIFYING_SET = { weaponDmg: 100, spellDmg: 100, physResist: 1157, spellResist: 1157 };
const MARKYN_QUALIFYING_MIN_PIECES = 3;
const UNDAUNTED_METTLE_PCT = 0.02;
const DIVINES_GOLD         = 0.091; // +9.1% mundus per Divines piece at gold (from eso-bonuses.ts)
const INFUSED_ARMOR_GOLD   = 0.25;  // +25% to armor piece enchant
const INFUSED_JEWELRY_GOLD = 0.60;  // +60% to jewelry piece enchant (was 0.14 — WRONG)
const LARGE_ARMOR_SLOTS = new Set(["head", "chest", "legs"]);
const SMALL_ARMOR_ENCHANT_FACTOR = 193 / 477; // ~0.4046 — small slots (shoulders/hands/waist/feet)
const WEAPON_TYPE_BONUS = {
  dual_wield: 1335, one_hand_shield: 1335, bow: 1335,
  restoration_staff: 1335, destruction_staff: 1335, two_handed: 1571,
};
const WEAPON_TRAIT_VALUES = {
  "precise":   { critRating: 1249 },
  "defending": { physResist: 1638, spellResist: 1638 },
  "sharpened": { physPen: 1638, spellPen: 1638 },
};
// ── Weapon line passives (Bar1 only, based on mh1 type) ────────────────────
// compute-stats.ts applies these based on Bar1 mh type and barType.
// Note: This gives Bar1-centric stats. When comparing vs UESP Bar2 (sword+shield),
// mace-bar passives (TbNB-mace) won't be in UESP Bar2 — hence a known offset.
const WEAPON_LINE_PASSIVE = {
  "accuracy":                    { weaponType: "bow",    contrib: { critRating: 1314 } },
  "twin-blade-and-blunt-axe":    { weaponType: "axe",    requiresBarType: "dual_wield", contrib: { critDamage: 3 } },
  "twin-blade-and-blunt-mace":   { weaponType: "mace",   requiresBarType: "dual_wield", contrib: { physPen: 743, spellPen: 743 } },
  "twin-blade-and-blunt-sword":  { weaponType: "sword",  requiresBarType: "dual_wield", contrib: { weaponDmg: 64, spellDmg: 64 } },
  "twin-blade-and-blunt-dagger": { weaponType: "dagger", requiresBarType: "dual_wield", contrib: { critRating: 328 } },
};

const CLASS_PASSIVE_VALUES = {
  // ESO Hub U50: "Increases your Armor by 2974" = both physResist AND spellResist.
  "heart-of-stone": { classId: "dragonknight", contrib: { physResist: 2974, spellResist: 2974 } },
  "elder-dragon":   { classId: "dragonknight", contrib: { healthRecovery: 700 } },
};
const CLASS_PASSIVE_POOL_PCT = {};
// Source: UESP Special:ESO_BuildEditor — ESO_MUNDUS_BUFF_DATA (U50) — mirrors eso-bonuses.ts exactly
const MUNDUS_STONES = {
  "the-lady":       { statKey: "physResist",     value: 2744, statKey2: "spellResist", value2: 2744 },
  "the-lover":      { statKey: "physPen",        value: 2744, statKey2: "spellPen",    value2: 2744 },
  "the-thief":      { statKey: "critRating",     value: 1333 },
  "the-shadow":     { statKey: "critDamage",     value: 11,   isPct: true },
  "the-warrior":    { statKey: "weaponDmg",      value: 238 },
  "the-apprentice": { statKey: "spellDmg",       value: 238 },
  "the-mage":       { statKey: "maxMagicka",     value: 2023 },
  "the-tower":      { statKey: "maxStamina",     value: 2023 },
  "the-lord":       { statKey: "maxHealth",      value: 2225 },
  "the-atronach":   { statKey: "magickaRecovery",value: 310 },
  "the-serpent":    { statKey: "staminaRecovery",value: 310 },
  "the-steed":      { statKey: "healthRecovery", value: 238 },
};
const BATTLE_SPIRIT_RECOVERY_MULT = 0.5;

// Active buff definitions (mirrors eso-bonuses.ts BUFF_DEFS / BUFF_DEF_MAP)
const BUFF_DEF_MAP = {
  "major-resolve":   { contrib: { physResist: 5948, spellResist: 5948 } },
  "minor-resolve":   { contrib: { physResist: 2974, spellResist: 2974 } },
  "major-brutality": { pct: { keys: ["weaponDmg"], factor: 1.20 } },
  "minor-brutality": { pct: { keys: ["weaponDmg"], factor: 1.10 } },
  "major-sorcery":   { pct: { keys: ["spellDmg"],  factor: 1.20 } },
  "minor-sorcery":   { pct: { keys: ["spellDmg"],  factor: 1.10 } },
  "major-force":     { contrib: { critDamage: 20 } },
  "minor-force":     { contrib: { critDamage: 10 } },
};

// Armor passives
const ARMOR_PASSIVE_PER_PIECE = {
  "prodigy":       { critRating: 109 },
  "spell-warding": { spellResist: 363 },
  "concentration": { physPen: 469, spellPen: 469 },
  "evocation":     { magickaRecovery: 17 },
  "wind-walker":   { staminaRecovery: 17 },
  "resolve":       { physResist: 114, spellResist: 114 },
  "constitution":  { healthRecovery: 12 },
};
const ARMOR_PASSIVE_PCT_PER_PIECE = {
  "juggernaut":   { keys: ["maxHealth"],              pctPerPiece: 0.02 },
  "agility":      { keys: ["weaponDmg", "spellDmg"], pctPerPiece: 0.01 },
};
const ARMOR_PASSIVE_WEIGHT = {
  "prodigy": "light", "spell-warding": "light", "concentration": "light", "evocation": "light",
  "dexterity": "medium", "agility": "medium", "wind-walker": "medium",
  "resolve": "heavy", "constitution": "heavy", "juggernaut": "heavy",
};
const ARMOR_BASE = {
  heavy:  { head:1320, chest:3110, shoulders:1320, hands:1320, waist:1320, legs:2410, feet:1320 },
  medium: { head: 880, chest:2073, shoulders: 880, hands: 880, waist: 880, legs:1607, feet: 880 },
  light:  { head: 440, chest:1037, shoulders: 440, hands: 440, waist: 440, legs: 804, feet: 440 },
};
const SHIELD_BASE_ARMOR = 1985;
const DEXTERITY_CRIT_PER_N_PIECES = 2; // +1% critDamage per 2 medium pieces
const REINFORCED_GOLD = 0.16;

// ── 3. Helpers ────────────────────────────────────────────────────────────────
const JEWELRY_SLOTS = new Set(["neck", "ring1", "ring2"]);
const WEAPON_SLOTS  = new Set(["mh1", "oh1", "mh2", "oh2"]);
const ARMOR_SLOTS   = new Set(["head", "chest", "shoulders", "hands", "waist", "legs", "feet"]);
const BAR1_SLOTS    = new Set(["mh1", "oh1"]);

function isJewelry(s) { return JEWELRY_SLOTS.has(s); }
function isWeapon(s)  { return WEAPON_SLOTS.has(s); }
function isArmor(s)   { return ARMOR_SLOTS.has(s); }

// Mirrors eso-bonuses.ts resolveStatKey exactly (strict equality, not includes).
// This ensures per-stack/conditional stat strings like "Offensive Penetration per stack..."
// return null and are skipped, just like the real engine.
function resolveStatKey(stat) {
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

function armorWeightFromSetType(t) {
  const l = (t || "").toLowerCase();
  if (l.includes("heavy")) return "heavy";
  if (l.includes("medium")) return "medium";
  if (l.includes("light")) return "light";
  if (l === "mixed" || l === "monster") return "medium";
  return null;
}
function resolveArmorWeight(piece) {
  if (piece.aw) return piece.aw;
  const set = getSet(piece.id);
  return armorWeightFromSetType(set?.type ?? "");
}

function deriveBarType(mh, oh) {
  if (!mh) return null;
  if (["2h-sword","2h-axe","2h-mace"].includes(mh)) return "two_handed";
  if (mh === "bow") return "bow";
  if (["inferno-staff","lightning-staff","ice-staff","restoration-staff"].includes(mh))
    return mh === "restoration-staff" ? "restoration_staff" : "destruction_staff";
  if (!oh || oh === "shield") return "one_hand_shield";
  return "dual_wield";
}

// ── 4. StatAccumulator ───────────────────────────────────────────────────────
class StatAccumulator {
  constructor() {
    this.s   = { ...BASE };
    this.src = {};
    for (const [k, v] of Object.entries(BASE)) {
      if (v !== 0) this.src[k] = [{ label: "Base", value: v }];
    }
  }
  add(label, contrib) {
    for (const [key, raw] of Object.entries(contrib)) {
      const val = raw;
      if (!val) continue;
      this.s[key] = (this.s[key] ?? 0) + val;
      (this.src[key] ??= []).push({ label, value: val });
    }
  }
  multiply(label, keys, factor) {
    for (const key of keys) {
      const old  = this.s[key] ?? 0;
      const next = Math.round(old * factor);
      const delta = next - old;
      if (!delta) continue;
      this.s[key] = next;
      (this.src[key] ??= []).push({ label, value: delta });
    }
  }
}

// ── 5. Main compute ──────────────────────────────────────────────────────────
function computeStats(build) {
  const acc = new StatAccumulator();

  // 1. Race
  const racial = RACIAL[build.r.toLowerCase()];
  if (racial) acc.add(`Race: ${build.r}`, racial);

  // 2. Attributes
  const ap = build.a.attrPoints ?? [0, 0, 64];
  const attrContrib = {};
  if (ap[0]) attrContrib.maxHealth  = ap[0] * ATTR_PER_POINT_HEALTH;
  if (ap[1]) attrContrib.maxMagicka = ap[1] * ATTR_PER_POINT_MAGSAM;
  if (ap[2]) attrContrib.maxStamina = ap[2] * ATTR_PER_POINT_MAGSAM;
  if (Object.keys(attrContrib).length)
    acc.add(`Attributes (${ap[0]}/${ap[1]}/${ap[2]})`, attrContrib);

  // 2.5 Food
  if (build.a.food) {
    const f = FOOD_VALUES[build.a.food];
    if (f) acc.add(`Food: ${build.a.food}`, f);
  }

  // 3. Set bonuses
  const pieceCount = {};
  for (const p of build.g) {
    if (p.id) pieceCount[p.id] = (pieceCount[p.id] ?? 0) + 1;
  }
  for (const [setId, count] of Object.entries(pieceCount)) {
    const set = getSet(setId);
    const label = set?.name ?? setId;
    if (set?.bonuses) {
      for (const bonus of set.bonuses) {
        if (bonus.count > count) continue;
        if (typeof bonus.value !== "number") continue;
        const target = resolveStatKey(bonus.stat);
        if (!target) continue;
        if (target === "wepSpellDmg") {
          acc.add(`Set: ${label} (${bonus.count}pc)`, { spellDmg: bonus.value, weaponDmg: bonus.value });
        } else if (target === "offPen") {
          acc.add(`Set: ${label} (${bonus.count}pc)`, { physPen: bonus.value, spellPen: bonus.value });
        } else if (target === "armor") {
          acc.add(`Set: ${label} (${bonus.count}pc)`, { physResist: bonus.value, spellResist: bonus.value });
        } else {
          acc.add(`Set: ${label} (${bonus.count}pc)`, { [target]: bonus.value });
        }
      }
    }
    const overrides = SET_BONUS_OVERRIDES[setId];
    if (overrides) {
      for (const o of overrides) {
        if (o.count > count) continue;
        acc.add(`Set: ${label} (${o.count}pc OVR)`, o.contrib);
      }
    }
    if (build.a.cb) {
      const conds = SET_CONDITIONAL_BONUSES[setId];
      if (conds) {
        for (const c of conds) {
          if (c.count > count) continue;
          acc.add(`Set: ${label} (5pc CB)`, c.contrib);
        }
      }
    }
  }

  // 3.5 Markyn
  if (pieceCount["markyn-ring-of-majesty"]) {
    let q = 0;
    for (const [sid, cnt] of Object.entries(pieceCount)) {
      if (sid === "markyn-ring-of-majesty") continue;
      if (cnt >= MARKYN_QUALIFYING_MIN_PIECES) q++;
    }
    if (q > 0) {
      const contrib = Object.fromEntries(
        Object.entries(MARKYN_PER_QUALIFYING_SET).map(([k, v]) => [k, v * q])
      );
      acc.add(`Markyn (${q} qualifying sets)`, contrib);
    }
  }

  // 4. Gear: enchants, armor base
  let divinesPieces = 0;
  let nirnhonedOnBar1 = false;
  let mh1Type, oh1Type;
  const bar1Types = new Set();

  for (const piece of build.g) {
    if (!piece.id && !piece.wp && !piece.e) continue;
    const shield    = piece.wp === "shield";
    const onWeapon  = isWeapon(piece.s) && !shield;
    const onJewelry = isJewelry(piece.s);
    const onArmor   = isArmor(piece.s) || shield;
    const onBar1    = BAR1_SLOTS.has(piece.s);

    if (onBar1 && onWeapon && piece.wp) {
      if (piece.s === "mh1") mh1Type = piece.wp;
      else if (piece.s === "oh1") oh1Type = piece.wp;
      bar1Types.add(piece.wp);
    }

    if (onWeapon && piece.t === "nirnhoned-weapon" && onBar1) {
      nirnhonedOnBar1 = true;
    } else if (piece.t) {
      if (piece.t === "divines" && onArmor && !shield) {
        divinesPieces++;
      } else if (onWeapon && WEAPON_TRAIT_VALUES[piece.t]) {
        const setName = getSet(piece.id)?.name ?? piece.id;
        acc.add(`Trait: ${piece.t} (${setName})`, WEAPON_TRAIT_VALUES[piece.t]);
      } else if (TRAIT_VALUES[piece.t]) {
        const setName = getSet(piece.id)?.name ?? piece.id;
        acc.add(`Trait: ${piece.t} (${setName})`, TRAIT_VALUES[piece.t]);
      }
    }

    // Enchant (skip weapon glyphs)
    if (piece.e && !onWeapon) {
      const base = ENCHANT_VALUES[piece.e];
      if (base) {
        const isLargeSlot = !onArmor || LARGE_ARMOR_SLOTS.has(piece.s ?? "") || shield;
        const sizeFactor  = isLargeSlot ? 1 : SMALL_ARMOR_ENCHANT_FACTOR;
        let mult = sizeFactor;
        if (piece.t === "infused-armor"   && onArmor)   mult = sizeFactor * (1 + INFUSED_ARMOR_GOLD);
        if (piece.t === "infused-jewelry" && onJewelry) mult = 1 + INFUSED_JEWELRY_GOLD;
        const scaled = Object.fromEntries(
          Object.entries(base).map(([k, v]) => [k, Math.round(v * mult)])
        );
        acc.add(`Glyph: ${piece.e} (${piece.s})`, scaled);
      }
    }

    // Armor base
    if (onArmor) {
      let armorPts = 0;
      if (shield) {
        armorPts = SHIELD_BASE_ARMOR;
        acc.add(`Armor: ${piece.s} shield (${getSet(piece.id)?.name ?? piece.id})`, { physResist: armorPts, spellResist: armorPts });
      } else {
        const weight = resolveArmorWeight(piece);
        if (weight && ARMOR_BASE[weight]?.[piece.s]) {
          armorPts = ARMOR_BASE[weight][piece.s];
          if (piece.t === "reinforced") armorPts = Math.round(armorPts * (1 + REINFORCED_GOLD));
          const setName = getSet(piece.id)?.name ?? piece.id;
          acc.add(`Armor: ${piece.s} (${setName})`, { physResist: armorPts, spellResist: armorPts });
        }
      }
    }
  }

  // 5. Weapon type bonus (bar 1)
  const barType = deriveBarType(mh1Type, oh1Type);
  const wepBonus = barType ? (WEAPON_TYPE_BONUS[barType] ?? 0) : 0;
  if (wepBonus) acc.add(`Weapon Type: ${barType}`, { weaponDmg: wepBonus, spellDmg: wepBonus });

  // 5b. Weapon line passives (Bar1 mh type)
  for (const [pid, def] of Object.entries(WEAPON_LINE_PASSIVE)) {
    if (mh1Type !== def.weaponType) continue;
    if (def.requiresBarType && barType !== def.requiresBarType) continue;
    acc.add(`Passive: ${pid}`, def.contrib);
  }

  // 6. Nirnhoned ×1.15
  if (nirnhonedOnBar1) {
    acc.multiply("Nirnhoned ×1.15", ["weaponDmg", "spellDmg"], 1.15);
  }

  // 7. Mundus
  if (build.a.mundus) {
    const stone = MUNDUS_STONES[build.a.mundus];
    if (stone) {
      const mult = 1 + divinesPieces * DIVINES_GOLD;
      const v    = Math.round(stone.value * mult);
      const contrib = { [stone.statKey]: v };
      if (stone.statKey2 && stone.value2 != null) {
        contrib[stone.statKey2] = Math.round(stone.value2 * mult);
      }
      acc.add(`Mundus: ${build.a.mundus}`, contrib);
    }
  }

  // 8. CP slottable flat
  for (const slot of build.cp) {
    const c = CP_STAR_VALUES[slot.id];
    if (c) acc.add(`CP: ${slot.id}`, c);
  }

  // 8c. CP passives
  for (const { id, contrib } of CP_PASSIVE_VALUES) {
    acc.add(`CP Passive: ${id}`, contrib);
  }

  // 9. Armor line passives
  const armorCounts = { heavy: 0, medium: 0, light: 0 };
  for (const piece of build.g) {
    if (!piece.id || !ARMOR_SLOTS.has(piece.s)) continue;
    const weight = resolveArmorWeight(piece);
    if (weight) armorCounts[weight]++;
  }

  for (const [passiveId, contrib] of Object.entries(ARMOR_PASSIVE_PER_PIECE)) {
    const weight = ARMOR_PASSIVE_WEIGHT[passiveId];
    const pieces = armorCounts[weight] ?? 0;
    if (!pieces) continue;
    const scaled = Object.fromEntries(Object.entries(contrib).map(([k,v]) => [k, v * pieces]));
    acc.add(`Passive: ${passiveId} (${weight}×${pieces})`, scaled);
  }
  // Dexterity: +1% critDamage per 2 medium armor pieces
  const medPieces = armorCounts.medium ?? 0;
  const dexStages = Math.floor(medPieces / DEXTERITY_CRIT_PER_N_PIECES);
  if (dexStages > 0) {
    acc.add(`Passive: dexterity (medium ×${medPieces})`, { critDamage: dexStages });
  }

  for (const [passiveId, def] of Object.entries(ARMOR_PASSIVE_PCT_PER_PIECE)) {
    const weight = ARMOR_PASSIVE_WEIGHT[passiveId];
    const pieces = armorCounts[weight] ?? 0;
    if (!pieces) continue;
    const factor = 1 + def.pctPerPiece * pieces;
    acc.multiply(`Passive: ${passiveId} (${weight}×${pieces})`, def.keys, factor);
  }

  // 10. Undaunted Mettle
  const typeCount = (armorCounts.heavy > 0 ? 1 : 0)
                  + (armorCounts.medium > 0 ? 1 : 0)
                  + (armorCounts.light  > 0 ? 1 : 0);
  if (typeCount > 0) {
    acc.multiply(`Undaunted Mettle (${typeCount}×2%)`,
      ["maxHealth", "maxMagicka", "maxStamina"],
      1 + UNDAUNTED_METTLE_PCT * typeCount);
  }

  // 11. Class passives
  for (const [pid, def] of Object.entries(CLASS_PASSIVE_VALUES)) {
    if (def.classId !== build.c.toLowerCase()) continue;
    acc.add(`Class Passive: ${pid}`, def.contrib);
  }

  // 13. Active buffs (build.bx)
  for (const buffId of (build.bx ?? [])) {
    const def = BUFF_DEF_MAP[buffId];
    if (!def) continue;
    if (def.contrib) acc.add(`Buff: ${buffId}`, def.contrib);
    if (def.pct) acc.multiply(`Buff: ${buffId}`, def.pct.keys, def.pct.factor);
  }

  // 14. Battle Spirit
  if (build.bs !== false) {
    acc.multiply("Battle Spirit (HP Rec ×0.5)", ["healthRecovery"], BATTLE_SPIRIT_RECOVERY_MULT);
  }

  return { stats: acc.s, sources: acc.src };
}

// ── 6. Run ───────────────────────────────────────────────────────────────────
const worldbreaker = {
  v: 1, c: "dragonknight", sl: ["","",""], r: "dunmer",
  g: [
    { s: "head",      id: "mighty-chudan",          t: "impenetrable",     e: "glyph-of-prismatic-defense", q: 1, aw: "heavy"  },
    { s: "shoulders", id: "mighty-chudan",          t: "impenetrable",     e: "glyph-of-prismatic-defense", q: 1, aw: "medium" },
    { s: "chest",     id: "armor-of-the-trainee",   t: "reinforced",       e: "glyph-of-prismatic-defense", q: 1, aw: "heavy"  },
    { s: "hands",     id: "rallying-cry",            t: "impenetrable",     e: "glyph-of-prismatic-defense", q: 1, aw: "light"  },
    { s: "waist",     id: "rallying-cry",            t: "impenetrable",     e: "glyph-of-prismatic-defense", q: 1, aw: "light"  },
    { s: "legs",      id: "twice-fanged-serpent",   t: "impenetrable",     e: "glyph-of-prismatic-defense", q: 1, aw: "medium" },
    { s: "feet",      id: "twice-fanged-serpent",   t: "impenetrable",     e: "glyph-of-prismatic-defense", q: 1, aw: "medium" },
    { s: "ring1",     id: "twice-fanged-serpent",   t: "triune",           e: "glyph-of-increase-physical-harm", q: 1 },
    { s: "ring2",     id: "markyn-ring-of-majesty", t: "infused-jewelry",  e: "glyph-of-increase-physical-harm", q: 1 },
    { s: "neck",      id: "rallying-cry",            t: "triune",           e: "glyph-of-increase-physical-harm", q: 1 },
    { s: "mh1",       id: "twice-fanged-serpent",   t: "nirnhoned-weapon", e: "glyph-of-absorb-magicka",    q: 1, wp: "mace" },
    { s: "oh1",       id: "twice-fanged-serpent",   t: "sharpened",        e: "glyph-of-shock",             q: 1, wp: "mace" },
    { s: "mh2",       id: "rallying-cry",            t: "defending",        e: "glyph-of-weapon-damage",     q: 1, wp: "sword" },
    { s: "oh2",       id: "rallying-cry",            t: "sturdy",           e: "glyph-of-prismatic-defense", q: 1, wp: "shield" },
  ],
  b: [
    { w: "mace",  sk: ["","","","",""], u: "" },
    { w: "sword", sk: ["","","","",""], u: "" },
  ],
  cp: [
    { tree: "red",  id: "fighting-finesse" },
    { tree: "blue", id: "fortified" },
  ],
  a: {
    food:       "bewitched-sugar-skulls",
    mundus:     "the-lady",
    attrPoints: [0, 0, 0],
    // cb: true activates RC 5pc (+1650 critRes, +300 WD) AND TFS 5pc (+6600 pen) together.
    // Use with care — UESP reference shows base stats (no stacks active).
  },
  bs: true, bx: [],
  // To verify specific gaps vs UESP:
  //   bx: ["minor-resolve"]  → physResist: -3348 → -374  (confirms Minor Resolve in UESP ref)
  //   a: { cb: true }        → critResistance: -1567 → +83 ✓ (confirms RC 5pc in UESP ref)
};

const { stats, sources } = computeStats(worldbreaker);

console.log("\n══════════ WORLDBREAKER — computeStats (0/0/0 attrs, no CB) ══════════\n");
const detailKeys = [
  "maxHealth","maxMagicka","maxStamina",
  "weaponDmg","spellDmg",
  "physPen","spellPen",
  "physResist","spellResist",
  "critRating","critResistance",
];
for (const key of detailKeys) {
  const srcs = sources[key] ?? [];
  console.log(`\n─── ${key}: ${stats[key]} ───`);
  for (const s of srcs) {
    console.log(`  ${String(s.label).padEnd(55)} ${String(s.value).padStart(7)}`);
  }
  console.log(`  ${"TOTAL".padEnd(55)} ${String(stats[key]).padStart(7)}`);
}
console.log("\n──────────────────────────────────────────────────────");
// ── UESP reference — build 712953 — captured 2026-05-28 ──────────────────────
// Reference is Bar2 (sword + shield) with the following KNOWN differences:
//
//  maxHealth   (+161 ours): Hero's Vigor (+560) added to engine after reference
//                           was captured — the reference predates this CP passive.
//
//  weaponDmg/  (+137 ours): Bar1 nirnhoned-weapon ×1.15 vs Bar2 defending (no WD bonus).
//  spellDmg                 Engine computes Bar1 offense; UESP shows Bar2. Known.
//
//  physPen/    (+446 ours): Bar1 TbNB-mace passive (+743 pen) vs Bar2 one-hand+shield.
//  spellPen                 Engine computes Bar1 pen; UESP shows Bar2. Known.
//
//  physResist  (-3348):     Reference likely had Minor Resolve buff active (+2974),
//  spellResist (-4074):     explaining most of the gap. Remaining ~374 physResist
//                           and ~1100 spellResist gap unknown (possible shield armor
//                           value difference). TODO: re-capture reference with known
//                           buff state.
//
//  critRating  (-2193):     Unknown — reference may have been captured with a different
//                           mundus (The Thief = +1333) or precise weapon trait (+1249),
//                           or a CP configuration we don't model. TODO: re-capture.
//
//  critResist  (-1567):     RC 5pc conditional (cb) not active. Enable cb:true to get
//                           +1650 critResistance → gap becomes ~+83 ✓.
//
const uesp = {
  maxHealth: 30133, maxMagicka: 24475, maxStamina: 23313,
  // Bar2 offense (unbuffed / buffed)
  weaponDmg: 4168, spellDmg: 4168,
  // Bar2 penetration
  physPen: 7365, spellPen: 7365,
  // Bar2 resistances
  physResist: 33572, spellResist: 35024,
  critRating: 6892, critResistance: 3679,
};
console.log("\n  STAT          OURS    UESP    DIFF");
console.log("  ─────────────────────────────────");
for (const [key, ref] of Object.entries(uesp)) {
  const our = stats[key] ?? 0;
  const diff = our - ref;
  const flag = diff !== 0 ? (Math.abs(diff) > 50 ? ' ⚠' : ' ~') : ' ✓';
  console.log(`  ${key.padEnd(14)} ${String(our).padStart(6)}  ${String(ref).padStart(6)}  ${(diff >= 0 ? '+' : '') + diff}${flag}`);
}
