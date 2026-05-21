import { GEAR_SLOTS, type SlotDef } from "@/lib/gear-slots";
import GearSlotRow from "@/components/builder/gear/GearSlotRow";

function Section({ title, slots }: { title: string; slots: SlotDef[] }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <h3 className="mb-2 font-display text-sm uppercase tracking-wide text-text-muted">
        {title}
      </h3>
      {slots.map((s) => (
        <GearSlotRow key={s.id} slot={s} />
      ))}
    </div>
  );
}

export default function GearTab() {
  const armor = GEAR_SLOTS.filter((s) => s.group === "armor");
  const jewelry = GEAR_SLOTS.filter((s) => s.group === "jewelry");
  const front = GEAR_SLOTS.filter((s) => s.bar === 1);
  const back = GEAR_SLOTS.filter((s) => s.bar === 2);

  return (
    <div className="flex flex-col gap-4">
      <Section title="Armor" slots={armor} />
      <Section title="Jewelry" slots={jewelry} />
      <Section title="Front Bar" slots={front} />
      <Section title="Back Bar" slots={back} />
    </div>
  );
}
