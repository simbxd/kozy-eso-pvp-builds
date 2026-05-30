import type { Build, GearPieceV1, GearSlotId } from "@/types/build";
import { getSet } from "@/lib/eso-data";
import {
  BUFF_DEF_MAP,
  BASE,
  ATTR_PER_POINT_HEALTH,
  ATTR_PER_POINT_MAGSAM,
  RACIAL,
  WEAPON_TYPE_BONUS,
  STAFF_TYPES,
  TWO_HANDED_TYPES,
  deriveBarType,
  NIRNHONED_WEAPON_PCT,
  TRAIT_VALUES,
  WEAPON_TRAIT_VALUES,
  ENCHANT_VALUES,
  DIVINES_GOLD,
  INFUSED_ARMOR_GOLD,
  INFUSED_JEWELRY_GOLD,
  REINFORCED_GOLD,
  ARMOR_BASE,
  SHIELD_BASE_ARMOR,
  resolveArmorWeight,
  armorWeightFromSetType,
  CP_STAR_VALUES,
  CP_STAR_PCT,
  CP_PASSIVE_VALUES,
  ARMOR_PASSIVE_PER_PIECE,
  ARMOR_PASSIVE_PCT_PER_PIECE,
  ARMOR_PASSIVE_WEIGHT,
  DEXTERITY_CRIT_PER_N_PIECES,
  UNDAUNTED_METTLE_PCT,
  WEAPON_LINE_PASSIVE,
  CLASS_PASSIVE_VALUES,
  CLASS_PASSIVE_POOL_PCT,
  SET_BONUS_OVERRIDES,
  SET_CONDITIONAL_BONUSES,
  MARKYN_PER_QUALIFYING_SET,
  MARKYN_QUALIFYING_MIN_PIECES,
  MUNDUS_STONES,
  MUNDUS_SLUG_MAP,
  FOOD_VALUES,
  BATTLE_SPIRIT_RECOVERY_MULT,
  LARGE_ARMOR_SLOTS,
  SMALL_ARMOR_ENCHANT_FACTOR,
  resolveStatKey,
  type ArmorWeight,
} from "@/lib/eso-bonuses";

// ── Types ────────────────────────────────────────────────────────────────────

export type ComputedStats = {
  maxHealth: number;
  maxMagicka: number;
  maxStamina: number;
  spellDmg: number;
  weaponDmg: number;
  healthRecovery: number;
  magickaRecovery: number;
  staminaRecovery: number;
  physResist: number;
  spellResist: number;
  critResistance: number;
  critRating: number;
  critDamage: number;
  physPen: number;
  spellPen: number;
  moveSpeed: number;
};

export type StatSource  = { label: string; value: number };
export type StatSources = Partial<Record<keyof ComputedStats, StatSource[]>>;
export type ComputeResult = { stats: ComputedStats; sources: StatSources };

// ── StatAccumulator ──────────────────────────────────────────────────────────

class StatAccumulator {
  s:   ComputedStats;
  src: StatSources;

  constructor() {
    this.s   = { ...BASE };
    this.src = {};
    for (const [key, val] of Object.entries(BASE)) {
      if ((val as number) !== 0) {
        const k = key as keyof ComputedStats;
        this.src[k] = [{ label: "Base", value: val as number }];
      }
    }
  }

  add(label: string, contrib: Partial<ComputedStats>): void {
    for (const [key, raw] of Object.entries(contrib)) {
      const val = raw as number;
      if (!val) continue;
      const k = key as keyof ComputedStats;
      (this.s as Record<string, number>)[k] += val;
      (this.src[k] ??= []).push({ label, value: val });
    }
  }

  multiply(label: string, keys: (keyof ComputedStats)[], factor: number): void {
    for (const key of keys) {
      const old  = this.s[key] as number;
      const next = Math.round(old * factor);
      const delta = next - old;
      if (!delta) continue;
      (this.s as Record<string, number>)[key] = next;
      (this.src[key] ??= []).push({ label, value: delta });
    }
  }
}

// ── Slot helpers ─────────────────────────────────────────────────────────────

const JEWELRY_SLOTS = new Set<GearSlotId>(["neck", "ring1", "ring2"]);
const WEAPON_SLOTS  = new Set<GearSlotId>(["mh1", "oh1", "mh2", "oh2"]);
const ARMOR_SLOTS   = new Set<GearSlotId>(["head", "chest", "shoulders", "hands", "waist", "legs", "feet"]);
const BAR1_SLOTS    = new Set<GearSlotId>(["mh1", "oh1"]);

function isJewelry(s: GearSlotId) { return JEWELRY_SLOTS.has(s); }
function isWeapon(s: GearSlotId)  { return WEAPON_SLOTS.has(s); }
function isArmor(s: GearSlotId)   { return ARMOR_SLOTS.has(s); }

// ── Set bonus helpers ─────────────────────────────────────────────────────────

function applySetTarget(
  acc: StatAccumulator,
  label: string,
  target: ReturnType<typeof resolveStatKey>,
  value: number,
): void {
  if (!target) return;
  if (target === "wepSpellDmg") {
    acc.add(label, { spellDmg: value, weaponDmg: value });
  } else if (target === "offPen") {
    acc.add(label, { physPen: value, spellPen: value });
  } else if (target === "armor") {
    acc.add(label, { physResist: value, spellResist: value });
  } else {
    acc.add(label, { [target]: value } as Partial<ComputedStats>);
  }
}

// ── Mundus stone ─────────────────────────────────────────────────────────────
// Uses structured MUNDUS_STONES data (not text-matching). Divines multiplier
// applies to both flat and percentage stones.

function applyMundus(acc: StatAccumulator, mundusId: string, multiplier: number): void {
  // Normalise slug: strip "the-" prefix or map legacy IDs
  const normalised = MUNDUS_SLUG_MAP[mundusId]
    ?? (mundusId.startsWith("the-") ? mundusId : `the-${mundusId}`);

  const stone = MUNDUS_STONES[normalised];
  if (!stone) return;

  const name  = normalised.replace(/^the-/, "The ").replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const label = `Mundus: ${name}`;

  const v = stone.isPct
    ? Math.round(stone.value * multiplier * 10) / 10  // keep 1 decimal for %
    : Math.round(stone.value * multiplier);

  const contrib: Partial<ComputedStats> = { [stone.statKey]: v };
  if (stone.statKey2 && stone.value2 != null) {
    const v2 = stone.isPct
      ? Math.round(stone.value2 * multiplier * 10) / 10
      : Math.round(stone.value2 * multiplier);
    contrib[stone.statKey2] = v2;
  }
  acc.add(label, contrib);
}

// ── Gear pass ─────────────────────────────────────────────────────────────────

function applyGear(
  acc: StatAccumulator,
  gear: GearPieceV1[],
): { divinesPieces: number; nirnhonedOnBar1: boolean; mh1Type?: string; oh1Type?: string; bar1Types: Set<string> } {
  let divinesPieces   = 0;
  let nirnhonedOnBar1 = false;
  let mh1Type: string | undefined;
  let oh1Type: string | undefined;
  const bar1Types = new Set<string>();

  for (const piece of gear) {
    // Skip pieces that have absolutely nothing to contribute:
    //   no set (id), no weapon type (wp), no enchant (e).
    // - Armor/jewelry with only a set: id is truthy → not skipped ✅
    // - Weapon with type but no set: wp is truthy → not skipped ✅ (weapon-type bonus fires)
    // - Armor with enchant but no set: e is truthy → not skipped ✅ (enchant fires)
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

    // Nirnhoned on bar 1: flag for % multiplier after gear loop
    if (onWeapon && onBar1 && piece.t === "nirnhoned-weapon") {
      nirnhonedOnBar1 = true;
      // No flat contribution — skip trait below
    } else if (piece.t) {
      // ── Traits ──────────────────────────────────────────────────
      if (piece.t === "divines" && onArmor && !shield) {
        divinesPieces += 1;
      } else if (onWeapon) {
        // Weapon traits from both bars are included in the "stat sheet" view.
        // This matches the UESP build editor display where all equipped items
        // contribute passively (defending on Bar 2 adds resistance even when
        // viewing Bar 1 damage values). A future per-bar stat view would need
        // to filter by active bar here.
        const contrib = WEAPON_TRAIT_VALUES[piece.t];
        if (contrib) {
          const setName = getSet(piece.id)?.name ?? piece.id;
          // 2H weapons (2h melee, bow, staves) occupy both weapon slots in ESO
          // and therefore give double the trait bonus of a 1H weapon.
          const is2H = !!piece.wp && (
            TWO_HANDED_TYPES.has(piece.wp) ||
            STAFF_TYPES.has(piece.wp) ||
            piece.wp === "bow"
          );
          const scaled = is2H
            ? Object.fromEntries(
                Object.entries(contrib).map(([k, v]) => [k, (v as number) * 2])
              ) as Partial<ComputedStats>
            : contrib;
          acc.add(`Trait: ${piece.t} (${setName})`, scaled);
        }
      } else if (TRAIT_VALUES[piece.t]) {
        const setName = getSet(piece.id)?.name ?? piece.id;
        acc.add(`Trait: ${piece.t} (${setName})`, TRAIT_VALUES[piece.t]);
      }
    }

    // ── Enchants (skip weapon glyphs — procs, not stat-sheet) ─────────
    if (piece.e && !onWeapon) {
      const base = ENCHANT_VALUES[piece.e];
      if (base) {
        // Large armor slots (head/chest/legs) and shields get full glyph potency;
        // small slots (shoulders/hands/waist/feet) get ~40.5% potency.
        const isLargeSlot = !onArmor || LARGE_ARMOR_SLOTS.has(piece.s ?? "") || shield;
        const sizeFactor  = isLargeSlot ? 1 : SMALL_ARMOR_ENCHANT_FACTOR;
        let mult = sizeFactor;
        if (piece.t === "infused-armor"   && onArmor)   mult = sizeFactor * (1 + INFUSED_ARMOR_GOLD);
        if (piece.t === "infused-jewelry" && onJewelry) mult = 1 + INFUSED_JEWELRY_GOLD;
        const scaled = Object.fromEntries(
          Object.entries(base).map(([k, v]) => [k, Math.round((v as number) * mult)]),
        ) as Partial<ComputedStats>;
        acc.add(`Glyph: ${piece.e}`, scaled);
      }
    }

    // ── Armor base resistance ─────────────────────────────────────────
    if (onArmor) {
      let armorPts = 0;
      if (shield) {
        armorPts = SHIELD_BASE_ARMOR;
      } else {
        const weight = resolveArmorWeight(piece);
        if (weight) armorPts = ARMOR_BASE[weight][piece.s] ?? 0;
      }
      if (armorPts > 0) {
        const reinfMult = piece.t === "reinforced" ? 1 + REINFORCED_GOLD : 1;
        const val = Math.round(armorPts * reinfMult);
        const setName = getSet(piece.id)?.name ?? piece.id;
        acc.add(`Armor: ${piece.s} (${setName})`, { physResist: val, spellResist: val });
      }
    }
  }

  return { divinesPieces, nirnhonedOnBar1, mh1Type, oh1Type, bar1Types };
}

// ── Armor piece counts ────────────────────────────────────────────────────────

function armorCountsByWeight(gear: GearPieceV1[]): Record<ArmorWeight, number> {
  const counts: Record<ArmorWeight, number> = { heavy: 0, medium: 0, light: 0 };
  for (const piece of gear) {
    if (!piece.id || !ARMOR_SLOTS.has(piece.s)) continue;
    const weight = resolveArmorWeight(piece);
    if (weight) counts[weight] += 1;
  }
  return counts;
}

// ── Main compute function ────────────────────────────────────────────────────

export function computeStats(build: Build): ComputeResult {
  const acc = new StatAccumulator();

  // ── 1. Race ──────────────────────────────────────────────────────────
  const raceKey = build.r.toLowerCase();
  const racial  = RACIAL[raceKey];
  if (racial) acc.add(`Race: ${build.r}`, racial);

  // ── 2. Attribute points — Health: 122/pt, Magicka/Stamina: 111/pt ──
  // Source: UESP g_EsoBuildRules.stats formulas.
  const ap = build.a.attrPoints ?? [0, 0, 0];
  const attrContrib: Partial<ComputedStats> = {};
  if (ap[0]) attrContrib.maxHealth  = ap[0] * ATTR_PER_POINT_HEALTH;
  if (ap[1]) attrContrib.maxMagicka = ap[1] * ATTR_PER_POINT_MAGSAM;
  if (ap[2]) attrContrib.maxStamina = ap[2] * ATTR_PER_POINT_MAGSAM;
  if (Object.keys(attrContrib).length)
    acc.add(`Attributes (${ap[0]}/${ap[1]}/${ap[2]} pts)`, attrContrib);

  // ── 2.5. Food / drink ────────────────────────────────────────────────
  if (build.a.food) {
    // Normalise slug: The Hist stores underscores in some contexts, we use hyphens.
    const foodSlug = build.a.food.replace(/_/g, "-");
    const foodContrib = FOOD_VALUES[foodSlug];
    if (foodContrib) acc.add(`Food: ${foodSlug}`, foodContrib);
  }

  // ── 3. Set bonuses ───────────────────────────────────────────────────
  const pieceCount: Record<string, number> = {};
  for (const piece of build.g) {
    if (piece.id) pieceCount[piece.id] = (pieceCount[piece.id] ?? 0) + 1;
  }

  for (const [setId, count] of Object.entries(pieceCount)) {
    const set      = getSet(setId);
    const setLabel = set?.name ?? setId;

    if (set?.bonuses) {
      for (const bonus of set.bonuses) {
        if (bonus.count > count) continue;
        if (typeof bonus.value !== "number") continue;
        const target = resolveStatKey(bonus.stat);
        if (target) applySetTarget(acc, `Set: ${setLabel} (${bonus.count}pc)`, target, bonus.value);
      }
    }

    const overrides = SET_BONUS_OVERRIDES[setId];
    if (overrides) {
      for (const o of overrides) {
        if (o.count > count) continue;
        acc.add(`Set: ${setLabel} (${o.count}pc)`, o.contrib);
      }
    }

    if (build.a.cb) {
      const conds = SET_CONDITIONAL_BONUSES[setId];
      if (conds) {
        for (const c of conds) {
          if (c.count > count) continue;
          acc.add(`Set: ${setLabel} (${c.count}pc — ${c.note})`, c.contrib);
        }
      }
    }
  }

  // ── 3.5 Markyn Ring of Majesty ───────────────────────────────────────
  if (pieceCount["markyn-ring-of-majesty"]) {
    let qualifying = 0;
    for (const [setId, count] of Object.entries(pieceCount)) {
      if (setId === "markyn-ring-of-majesty") continue;
      if (count >= MARKYN_QUALIFYING_MIN_PIECES) qualifying += 1;
    }
    if (qualifying > 0) {
      const contrib = Object.fromEntries(
        Object.entries(MARKYN_PER_QUALIFYING_SET).map(([k, v]) => [k, (v as number) * qualifying]),
      ) as Partial<ComputedStats>;
      acc.add(`Set: Markyn Ring of Majesty (${qualifying} qualifying sets)`, contrib);
    }
  }

  // ── 4. Gear: traits, enchants, armor base ────────────────────────────
  const { divinesPieces, nirnhonedOnBar1, mh1Type, oh1Type, bar1Types } = applyGear(acc, build.g);

  // ── 5. Weapon type bonus (bar 1) ─────────────────────────────────────
  const barType      = deriveBarType(mh1Type, oh1Type);
  const wepTypeBonus = barType ? (WEAPON_TYPE_BONUS[barType] ?? 0) : 0;
  if (wepTypeBonus) {
    const barLabel = barType?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    acc.add(`Weapon Type: ${barLabel}`, { weaponDmg: wepTypeBonus, spellDmg: wepTypeBonus });
  }

  // ── 6. Nirnhoned — +15% multiplicative on WD+SD ──────────────────────
  if (nirnhonedOnBar1) {
    acc.multiply("Nirnhoned (×1.15)", ["weaponDmg", "spellDmg"], 1 + NIRNHONED_WEAPON_PCT);
  }

  // ── 7. Mundus stone ───────────────────────────────────────────────────
  if (build.a.mundus) {
    const mundusMult = 1 + divinesPieces * DIVINES_GOLD;
    applyMundus(acc, build.a.mundus, mundusMult);
  }

  // ── 8. CP slottable stars — flat ─────────────────────────────────────
  for (const slot of build.cp) {
    const contrib = CP_STAR_VALUES[slot.id];
    if (contrib) acc.add(`CP: ${slot.id}`, contrib);
  }

  // ── 8b. CP slottable stars — % pool ──────────────────────────────────
  // Applied after flat CP, before armor passives.
  for (const slot of build.cp) {
    const pools = CP_STAR_PCT[slot.id];
    if (!pools) continue;
    for (const [k, pct] of Object.entries(pools)) {
      acc.multiply(`CP: ${slot.id}`, [k as keyof ComputedStats], 1 + (pct as number));
    }
  }

  // ── 8c. CP passive (non-slottable) stars — always-on at CP810+ ──────
  for (const { id, contrib } of CP_PASSIVE_VALUES) {
    acc.add(`CP Passive: ${id}`, contrib);
  }

  // ── 9. Armor line passives ────────────────────────────────────────────
  const armorCounts = armorCountsByWeight(build.g);

  // Flat passives (prodigy, spell-warding, concentration, resolve)
  for (const [passiveId, contrib] of Object.entries(ARMOR_PASSIVE_PER_PIECE)) {
    const weight = ARMOR_PASSIVE_WEIGHT[passiveId];
    const pieces = armorCounts[weight] ?? 0;
    if (!pieces) continue;
    const scaled = Object.fromEntries(
      Object.entries(contrib).map(([k, v]) => [k, (v as number) * pieces]),
    ) as Partial<ComputedStats>;
    acc.add(`Passive: ${passiveId} (${weight} ×${pieces})`, scaled);
  }

  // % passives (constitution, juggernaut, agility, athletics)
  for (const [passiveId, def] of Object.entries(ARMOR_PASSIVE_PCT_PER_PIECE)) {
    const weight = ARMOR_PASSIVE_WEIGHT[passiveId];
    const pieces = armorCounts[weight] ?? 0;
    if (!pieces) continue;
    const factor = 1 + def.pctPerPiece * pieces;
    acc.multiply(
      `Passive: ${passiveId} (${weight} ×${pieces})`,
      def.keys as (keyof ComputedStats)[],
      factor,
    );
  }

  // Dexterity (medium): +1% Critical Damage per DEXTERITY_CRIT_PER_N_PIECES pieces
  {
    const medPieces = armorCounts.medium ?? 0;
    const dexStages = Math.floor(medPieces / DEXTERITY_CRIT_PER_N_PIECES);
    if (dexStages > 0) {
      acc.add(`Passive: dexterity (medium ×${medPieces})`, { critDamage: dexStages });
    }
  }

  // ── 10. Undaunted Mettle ──────────────────────────────────────────────
  const typeCount =
    (armorCounts.heavy  > 0 ? 1 : 0) +
    (armorCounts.medium > 0 ? 1 : 0) +
    (armorCounts.light  > 0 ? 1 : 0);
  if (typeCount > 0) {
    acc.multiply(
      `Undaunted Mettle (${typeCount}×2%)`,
      ["maxHealth", "maxMagicka", "maxStamina"],
      1 + UNDAUNTED_METTLE_PCT * typeCount,
    );
  }

  // ── 11. Weapon line passives ──────────────────────────────────────────
  // Twin Blade and Blunt bonuses apply PER weapon of matching type in bar 1
  // (main-hand + off-hand both count). Bow accuracy fires on mh1 only.
  {
    const bar1Weapons = [mh1Type, oh1Type].filter(Boolean) as string[];
    for (const [passiveId, def] of Object.entries(WEAPON_LINE_PASSIVE)) {
      if (def.requiresBarType && barType !== def.requiresBarType) continue;
      const matchCount = bar1Weapons.filter((t) => t === def.weaponType).length;
      if (matchCount === 0) continue;
      if (matchCount === 1) {
        acc.add(`Passive: ${passiveId}`, def.contrib);
      } else {
        const scaled = Object.fromEntries(
          Object.entries(def.contrib).map(([k, v]) => [k, (v as number) * matchCount]),
        ) as Partial<ComputedStats>;
        acc.add(`Passive: ${passiveId} (×${matchCount})`, scaled);
      }
    }
  }

  // ── 12. Class passives ────────────────────────────────────────────────
  const classId = build.c.toLowerCase();

  for (const [passiveId, def] of Object.entries(CLASS_PASSIVE_VALUES)) {
    if (def.classId !== classId) continue;
    acc.add(`Passive: ${passiveId}`, def.contrib);
  }
  for (const [passiveId, def] of Object.entries(CLASS_PASSIVE_POOL_PCT)) {
    if (def.classId !== classId) continue;
    for (const [k, pct] of Object.entries(def.pools)) {
      acc.multiply(`Passive: ${passiveId}`, [k as keyof ComputedStats], 1 + (pct as number));
    }
  }

  // ── 13. Active buffs (build.bx) ──────────────────────────────────────
  for (const buffId of build.bx ?? []) {
    const def = BUFF_DEF_MAP[buffId];
    if (!def) continue;
    if (def.contrib && Object.values(def.contrib).some(Boolean)) {
      acc.add(`Buff: ${def.label}`, def.contrib);
    }
    if (def.pct) {
      acc.multiply(`Buff: ${def.label}`, def.pct.keys, def.pct.factor);
    }
  }

  // ── 14. Battle Spirit ─────────────────────────────────────────────────
  // Source: UESP g_EsoBuildRules.buff["Battle Spirit"]
  // build.bs === undefined → default true (PvP context).
  // Resistances show raw stat-sheet values — Battle Spirit is a -50% Damage Taken
  // combat modifier, NOT a resistance halving. Only Health Recovery is reduced.
  if (build.bs !== false) {
    acc.multiply("Battle Spirit (HP Rec ×0.5)", ["healthRecovery"], BATTLE_SPIRIT_RECOVERY_MULT);
  }

  return { stats: acc.s, sources: acc.src };
}

// ── Display helpers ──────────────────────────────────────────────────────────

// 219 rating = 1% crit chance (ESO internal: crit_div ≈ 21905 → 219 per 0.1%).
export function critPercent(critRating: number): number {
  return Math.round((critRating / 219) * 10) / 10;
}

// 660 resistance ≈ 1% mitigation (PvP cap 33,000 = 50%).
export function resistPercent(resist: number): number {
  return Math.round((resist / 660) * 10) / 10;
}

// ── activeSets ────────────────────────────────────────────────────────────────

export function activeSets(build: Build): Array<{ id: string; name: string; count: number }> {
  const pieceCount: Record<string, number> = {};
  for (const piece of build.g) {
    if (piece.id) pieceCount[piece.id] = (pieceCount[piece.id] ?? 0) + 1;
  }
  return Object.entries(pieceCount)
    .map(([id, count]) => {
      const set = getSet(id);
      return set ? { id, name: set.name, count } : null;
    })
    .filter((x): x is { id: string; name: string; count: number } => x !== null)
    .sort((a, b) => b.count - a.count);
}
