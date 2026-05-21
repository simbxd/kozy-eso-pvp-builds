import { useEditorStore, type ArmorPiece, type JewelryPiece, type WeaponPiece } from "../state";
import { T, F, CompactWeight, SectionHead } from "../atoms";
import { SearchSelect, type SelectItem } from "../atoms/SearchSelect";
import { setsIndex, traitsForCategory, enchantsForCategory } from "@/lib/eso-data";

// ── Static lists (built once outside render) ──────────────────────────────────

const SET_ITEMS: SelectItem[] = setsIndex.map((s) => ({
  id: s.id, label: s.name, badge: s.type,
}));

const TRAIT_ARMOR   = traitsForCategory("armor")  .map((t) => ({ id: t.id, label: t.name }));
const TRAIT_JEWEL   = traitsForCategory("jewelry") .map((t) => ({ id: t.id, label: t.name }));
const TRAIT_WEAPON  = traitsForCategory("weapon")  .map((t) => ({ id: t.id, label: t.name }));
const ENCHANT_ARMOR  = enchantsForCategory("armor")  .map((e) => ({ id: e.id, label: e.name, sub: e.effect }));
const ENCHANT_JEWEL  = enchantsForCategory("jewelry") .map((e) => ({ id: e.id, label: e.name, sub: e.effect }));
const ENCHANT_WEAPON = enchantsForCategory("weapon")  .map((e) => ({ id: e.id, label: e.name, sub: e.effect }));

// ── Column template ───────────────────────────────────────────────────────────
// icon · slot-label · set · trait · enchant · last-col

const COLS = "20px 96px 1fr 1fr 1fr 96px";

function ColHead({ last }: { last: string }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: COLS, gap: 6,
      padding: "0 8px 4px",
      fontFamily: F.mono, fontSize: 8, letterSpacing: "0.28em",
      color: T.inkFaint, textTransform: "uppercase",
      borderBottom: `1px solid ${T.edge}`, marginBottom: 2,
    }}>
      <div /><div>Slot</div><div>Set</div><div>Trait</div><div>Enchant</div>
      <div style={{ textAlign: "right" }}>{last}</div>
    </div>
  );
}

function GlyIcon() {
  return (
    <div style={{
      width: 20, height: 20, flexShrink: 0,
      background: "rgba(139,92,246,0.06)",
      border: `1px solid ${T.edge}`,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <span style={{ fontFamily: F.cinzel, fontSize: 8, color: T.inkFaint }}>◇</span>
    </div>
  );
}

function SlotLabel({ label }: { label: string }) {
  return (
    <div style={{
      fontFamily: F.mono, fontSize: 10, letterSpacing: "0.18em",
      color: T.inkMute, textTransform: "uppercase",
      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
    }}>{label}</div>
  );
}

// ── ArmorRow ──────────────────────────────────────────────────────────────────

const ARMOR_SLOTS: ArmorPiece["slot"][] = [
  "head", "chest", "shoulders", "hands", "waist", "legs", "feet",
];
const ARMOR_LABELS: Record<ArmorPiece["slot"], string> = {
  head: "Head", chest: "Chest", shoulders: "Shoulders",
  hands: "Hands", waist: "Waist", legs: "Legs", feet: "Feet",
};

function ArmorRow({ piece }: { piece: ArmorPiece }) {
  const patch = useEditorStore((s) => s.patchArmorPiece);
  return (
    <div style={{
      display: "grid", gridTemplateColumns: COLS, gap: 6,
      alignItems: "center", padding: "4px 8px",
      background: "rgba(10,6,18,0.35)",
      borderBottom: `1px solid rgba(205,180,255,0.06)`,
    }}>
      <GlyIcon />
      <SlotLabel label={ARMOR_LABELS[piece.slot]} />
      <SearchSelect value={piece.set}    onChange={(id) => patch(piece.slot, { set: id })}
        items={SET_ITEMS}    placeholder="Set"    height={28} popoverWidth={320} />
      <SearchSelect value={piece.trait}  onChange={(id) => patch(piece.slot, { trait: id })}
        items={TRAIT_ARMOR}  placeholder="Trait"  searchable={false} height={28} popoverWidth={180} />
      <SearchSelect value={piece.enchant} onChange={(id) => patch(piece.slot, { enchant: id })}
        items={ENCHANT_ARMOR} placeholder="Enchant" searchable={false} height={28} popoverWidth={260} />
      <CompactWeight active={piece.weight}
        onChange={(w) => patch(piece.slot, { weight: w as ArmorPiece["weight"] })} />
    </div>
  );
}

// ── JewelryRow ────────────────────────────────────────────────────────────────

const JEWEL_SLOTS: JewelryPiece["slot"][] = ["necklace", "ring1", "ring2"];
const JEWEL_LABELS: Record<JewelryPiece["slot"], string> = {
  necklace: "Necklace", ring1: "Ring 1", ring2: "Ring 2",
};

function JewelryRow({ piece }: { piece: JewelryPiece }) {
  const patch = useEditorStore((s) => s.patchJewelryPiece);
  return (
    <div style={{
      display: "grid", gridTemplateColumns: COLS, gap: 6,
      alignItems: "center", padding: "4px 8px",
      background: "rgba(10,6,18,0.35)",
      borderBottom: `1px solid rgba(205,180,255,0.06)`,
    }}>
      <GlyIcon />
      <SlotLabel label={JEWEL_LABELS[piece.slot]} />
      <SearchSelect value={piece.set}    onChange={(id) => patch(piece.slot, { set: id })}
        items={SET_ITEMS}    placeholder="Set"    height={28} popoverWidth={320} />
      <SearchSelect value={piece.trait}  onChange={(id) => patch(piece.slot, { trait: id })}
        items={TRAIT_JEWEL}  placeholder="Trait"  searchable={false} height={28} popoverWidth={180} />
      <SearchSelect value={piece.enchant} onChange={(id) => patch(piece.slot, { enchant: id })}
        items={ENCHANT_JEWEL} placeholder="Enchant" searchable={false} height={28} popoverWidth={260} />
      <div /> {/* no weight column for jewelry */}
    </div>
  );
}

// ── WeaponRow ─────────────────────────────────────────────────────────────────

const WEAPON_SLOTS: WeaponPiece["slot"][] = ["bar1_main", "bar1_off", "bar2_main", "bar2_off"];
const WEAPON_LABELS: Record<WeaponPiece["slot"], string> = {
  bar1_main: "Bar I · Main", bar1_off: "Bar I · Off",
  bar2_main: "Bar II · Main", bar2_off: "Bar II · Off",
};

function WeaponRow({ piece }: { piece: WeaponPiece }) {
  const patch = useEditorStore((s) => s.patchWeaponPiece);
  return (
    <div style={{
      display: "grid", gridTemplateColumns: COLS, gap: 6,
      alignItems: "center", padding: "4px 8px",
      background: "rgba(10,6,18,0.35)",
      borderBottom: `1px solid rgba(205,180,255,0.06)`,
    }}>
      <GlyIcon />
      <SlotLabel label={WEAPON_LABELS[piece.slot]} />
      <SearchSelect value={piece.set}    onChange={(id) => patch(piece.slot, { set: id })}
        items={SET_ITEMS}     placeholder="Set"    height={28} popoverWidth={320} />
      <SearchSelect value={piece.trait}  onChange={(id) => patch(piece.slot, { trait: id })}
        items={TRAIT_WEAPON}  placeholder="Trait"  searchable={false} height={28} popoverWidth={180} />
      <SearchSelect value={piece.enchant} onChange={(id) => patch(piece.slot, { enchant: id })}
        items={ENCHANT_WEAPON} placeholder="Enchant" searchable={false} height={28} popoverWidth={260} />
      <div /> {/* no weight for weapons */}
    </div>
  );
}

// ── EquipmentTab ──────────────────────────────────────────────────────────────

export default function EquipmentTab() {
  const setup = useEditorStore((s) => s.setups[s.activeSetupIdx]);

  const armor   = ARMOR_SLOTS .map((sl) => setup.armor  .find((p) => p.slot === sl)!).filter(Boolean);
  const jewelry = JEWEL_SLOTS .map((sl) => setup.jewelry.find((p) => p.slot === sl)!).filter(Boolean);
  const weapons = WEAPON_SLOTS.map((sl) => setup.weapons.find((p) => p.slot === sl)!).filter(Boolean);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, height: "100%", overflow: "auto" }}>

      <div>
        <SectionHead title="Armor" count="7 pieces" />
        <ColHead last="Weight" />
        {armor.map((p)   => <ArmorRow   key={p.slot} piece={p} />)}
      </div>

      <div>
        <SectionHead title="Jewelry" count="3 pieces" />
        <ColHead last="" />
        {jewelry.map((p) => <JewelryRow key={p.slot} piece={p} />)}
      </div>

      <div>
        <SectionHead title="Weapons" count="2 bars" />
        <ColHead last="" />
        {weapons.map((p) => <WeaponRow  key={p.slot} piece={p} />)}
      </div>
    </div>
  );
}
