import type { GearSlotId, GearPieceV1 } from "@/types/build";
import type { GearCategory } from "@/types/eso";

// Pairing rules (2H/bow/staff occupy both hands, dual wield = a weapon in
// each hand) are NOT enforced — each weapon slot / bar holds its own type.
// Enforcement is deferred to the stats engine (M8).
export const WEAPON_TYPES = [
  "two-handed", "one-handed", "mace", "axe", "sword", "dagger", "bow",
  "inferno-staff", "lightning-staff", "ice-staff", "restoration-staff",
  "shield",
];

export type SlotGroup = "armor" | "jewelry" | "weapon";

export type SlotDef = {
  id: GearSlotId;
  label: string;
  group: SlotGroup;
  bar?: 1 | 2; // weapon slots only — which bar this weapon belongs to
};

// The 14 equip slots, ordered the way they render: 7 armor, 3 jewelry,
// 2 front-bar weapons, 2 back-bar weapons.
export const GEAR_SLOTS: SlotDef[] = [
  { id: "head", label: "Head", group: "armor" },
  { id: "chest", label: "Chest", group: "armor" },
  { id: "shoulders", label: "Shoulders", group: "armor" },
  { id: "hands", label: "Hands", group: "armor" },
  { id: "waist", label: "Waist", group: "armor" },
  { id: "legs", label: "Legs", group: "armor" },
  { id: "feet", label: "Feet", group: "armor" },
  { id: "neck", label: "Necklace", group: "jewelry" },
  { id: "ring1", label: "Ring 1", group: "jewelry" },
  { id: "ring2", label: "Ring 2", group: "jewelry" },
  { id: "mh1", label: "Main Hand", group: "weapon", bar: 1 },
  { id: "oh1", label: "Off Hand", group: "weapon", bar: 1 },
  { id: "mh2", label: "Main Hand", group: "weapon", bar: 2 },
  { id: "oh2", label: "Off Hand", group: "weapon", bar: 2 },
];

// Trait/enchant lists are filtered by category. Armor → armor, jewelry →
// jewelry, weapons → weapon — EXCEPT a shield: it sits in an off-hand
// weapon slot but takes armor traits/enchants (per project data conventions).
export function categoryForSlot(
  group: SlotGroup,
  piece?: GearPieceV1,
): GearCategory {
  if (group === "weapon" && piece?.wp === "shield") return "armor";
  if (group === "weapon") return "weapon";
  if (group === "jewelry") return "jewelry";
  return "armor";
}
