/**
 * editor-compute.ts
 *
 * Bridges useEditorStore's (BuildMeta + Setup) types to the existing
 * computeStats() pipeline which expects the old Build/GearPieceV1 types.
 *
 * This is a pure mapping layer — no duplicate stat logic.
 */

import type { Build, GearPieceV1, GearSlotId } from "@/types/build";
import type { BuildMeta, Setup }                from "@/components/builder/state";
import { computeStats, type ComputeResult }     from "@/lib/compute-stats";

// ── Slot ID mapping ───────────────────────────────────────────────────────────

const JEWELRY_SLOT_MAP: Record<string, GearSlotId> = {
  necklace: "neck",
  ring1:    "ring1",
  ring2:    "ring2",
};

const WEAPON_SLOT_MAP: Record<string, GearSlotId> = {
  bar1_main: "mh1",
  bar1_off:  "oh1",
  bar2_main: "mh2",
  bar2_off:  "oh2",
};

// ── Build adapter ─────────────────────────────────────────────────────────────

function buildFromEditor(
  meta:          BuildMeta,
  setup:         Setup,
  battleSpirit:  boolean,
  bx:            string[],
): Build {
  const gear: GearPieceV1[] = [];

  // Armor pieces — slot IDs match directly (head, chest, …)
  // Allow pieces without a set if they carry an enchant or trait (enchant-only glyph, Divines for mundus, etc.)
  for (const p of setup.armor) {
    if (!p.set && !p.enchant && !p.trait) continue;
    gear.push({
      s:  p.slot as GearSlotId,
      id: p.set ?? "",
      t:  p.trait   ?? "",
      e:  p.enchant  ?? "",
      q:  1,
      aw: p.weight,
    });
  }

  // Jewelry — necklace → neck
  // Allow pieces without a set if they carry an enchant or trait.
  for (const p of setup.jewelry) {
    if (!p.set && !p.enchant && !p.trait) continue;
    const s = JEWELRY_SLOT_MAP[p.slot];
    if (!s) continue;
    gear.push({ s, id: p.set, t: p.trait ?? "", e: p.enchant ?? "", q: 1 });
  }

  // Weapons — bar1_main → mh1, bar1_off → oh1, etc.
  for (const p of setup.weapons) {
    if (!p.set && !p.type) continue;
    const s = WEAPON_SLOT_MAP[p.slot];
    if (!s) continue;
    gear.push({
      s,
      id: p.set  ?? "",
      t:  p.trait ?? "",
      e:  p.enchant ?? "",
      q:  1,
      wp: p.type ?? "",
    });
  }

  // CP — flatten warfare + fitness into {tree, id}[]
  // The compute pipeline only uses the `id` field for stat lookups.
  const cpSlots = [
    ...setup.cp.warfare.map(([id]) => ({ tree: "red"  as const, id })),
    ...setup.cp.fitness.map(([id]) => ({ tree: "blue" as const, id })),
  ];

  // Attribute points — new store uses named keys; old system expects [H, M, S]
  const { health, magicka, stamina } = setup.attributes;

  // Mundus: comes from meta (General tab selection)
  const mundus = meta.mundus || undefined;

  // Enabled passive skill IDs — opt-in gate for armor/weapon-line/class passives.
  // Empty array = nothing applied (strict opt-in, no legacy fallback).
  const pe = Object.entries(setup.passives ?? {})
    .filter(([, on]) => on)
    .map(([id]) => id);

  return {
    v:  1,
    c:  meta.classId,
    sl: ["", "", ""],
    r:  meta.race,
    g:  gear,
    b:  [
      {
        w:  setup.weapons.find((w) => w.slot === "bar1_main")?.type ?? "",
        sk: ["", "", "", "", ""],
        u:  "",
      },
      {
        w:  setup.weapons.find((w) => w.slot === "bar2_main")?.type ?? "",
        sk: ["", "", "", "", ""],
        u:  "",
      },
    ],
    cp: cpSlots,
    a:  {
      mundus,
      food:       setup.consumables.food   ?? undefined,
      attrPoints: [health, magicka, stamina],
    },
    bs: battleSpirit,
    bx,
    pe,
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Compute stats for the editor's current meta + setup.
 *
 * @param meta         BuildMeta from useEditorStore
 * @param setup        Active Setup from useEditorStore
 * @param battleSpirit Whether to apply Battle Spirit ×0.5 resist (default true)
 */
export function computeStatsFromEditor(
  meta:          BuildMeta,
  setup:         Setup,
  battleSpirit = true,
  bx:            string[] = [],
): ComputeResult {
  return computeStats(buildFromEditor(meta, setup, battleSpirit, bx));
}
