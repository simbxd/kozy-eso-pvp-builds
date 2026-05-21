import {
  traitsForCategory,
  enchantsForCategory,
} from "@/lib/eso-data";
import {
  categoryForSlot,
  WEAPON_TYPES,
  type SlotDef,
} from "@/lib/gear-slots";
import { useBuilderStore } from "@/store/builder-store";
import SetSelect from "@/components/builder/gear/SetSelect";

const WEIGHTS: { v: "heavy" | "medium" | "light"; label: string }[] = [
  { v: "heavy",  label: "Heavy" },
  { v: "medium", label: "Medium" },
  { v: "light",  label: "Light" },
];

const fieldCls =
  "rounded border border-border bg-surface-2 px-2 py-1 text-sm text-text font-body outline-none focus:border-accent disabled:opacity-40";

export default function GearSlotRow({ slot }: { slot: SlotDef }) {
  const piece = useBuilderStore((s) => s.build.g.find((p) => p.s === slot.id));
  const setGearPiece = useBuilderStore((s) => s.setGearPiece);
  const clearGearPiece = useBuilderStore((s) => s.clearGearPiece);

  const category = categoryForSlot(slot.group, piece);
  const traits = traitsForCategory(category);
  const enchants = enchantsForCategory(category);

  return (
    <div className="grid grid-cols-[110px_1fr] items-start gap-3 border-b border-border py-2 last:border-0 md:grid-cols-[110px_1.4fr_1fr_1fr_auto]">
      <span className="pt-1 text-sm text-text font-body">{slot.label}</span>

      <SetSelect
        value={piece?.id ?? ""}
        onChange={(id) => setGearPiece(slot.id, { id })}
      />

      <select
        className={fieldCls}
        value={piece?.t ?? ""}
        onChange={(e) => setGearPiece(slot.id, { t: e.target.value })}
      >
        <option value="">— Trait —</option>
        {traits.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>

      <select
        className={fieldCls}
        value={piece?.e ?? ""}
        onChange={(e) => setGearPiece(slot.id, { e: e.target.value })}
      >
        <option value="">— Enchant —</option>
        {enchants.map((en) => (
          <option key={en.id} value={en.id}>{en.name}</option>
        ))}
      </select>

      <div className="flex flex-wrap items-center gap-2">
        {slot.group === "armor" && (
          <div className="flex gap-1">
            {WEIGHTS.map((w) => (
              <button
                key={w.v}
                type="button"
                onClick={() => setGearPiece(slot.id, { aw: w.v })}
                className={`rounded border px-1.5 py-1 text-[10px] font-mono transition-colors ${
                  piece?.aw === w.v
                    ? "border-accent bg-accent-glow text-accent"
                    : "border-border text-text-muted hover:text-text"
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
        )}

        {slot.group === "weapon" && (
          <select
            className={fieldCls}
            value={piece?.wp ?? ""}
            onChange={(e) => setGearPiece(slot.id, { wp: e.target.value })}
          >
            <option value="">— Type —</option>
            {WEAPON_TYPES.map((wt) => (
              <option key={wt} value={wt}>
                {wt.replace(/-/g, " ")}
              </option>
            ))}
          </select>
        )}

        {piece && (
          <button
            type="button"
            onClick={() => clearGearPiece(slot.id)}
            className="text-xs text-text-muted font-body hover:text-critical"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
