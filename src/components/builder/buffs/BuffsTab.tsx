import { useBuilderStore } from "@/store/builder-store";
import { BUFF_DEFS, type BuffDef } from "@/lib/eso-bonuses";

// ── Group metadata ────────────────────────────────────────────────────────────

const GROUP_LABELS: Record<BuffDef["group"], string> = {
  defense:  "Defense",
  offense:  "Offense",
  resource: "Resources",
};

// ── Buff toggle button ────────────────────────────────────────────────────────

function BuffToggle({ def, active, onToggle }: {
  def: BuffDef;
  active: boolean;
  onToggle: () => void;
}) {
  // Derive a short descriptor of what this buff adds for the tooltip / sublabel
  const hint = (() => {
    if (def.pct) {
      const pctStr = `+${Math.round((def.pct.factor - 1) * 100)}%`;
      const keys   = def.pct.keys.map((k) =>
        k === "weaponDmg" ? "WD" : k === "spellDmg" ? "SD"
        : k === "maxHealth" ? "HP" : k === "maxStamina" ? "Stam"
        : k === "maxMagicka" ? "Mag" : k,
      );
      return `${pctStr} ${keys.join("+")}`;
    }
    if (def.contrib) {
      const parts: string[] = [];
      const c = def.contrib;
      if (c.physResist || c.spellResist) {
        const v = c.physResist ?? c.spellResist ?? 0;
        parts.push(`+${v.toLocaleString("en-US")} Resist`);
      }
      if (c.critDamage)  parts.push(`+${c.critDamage}% Crit Dmg`);
      if (c.moveSpeed)   parts.push(`+${c.moveSpeed}% Speed`);
      return parts.join(" · ");
    }
    return "";
  })();

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex flex-col items-start gap-0.5 rounded-md border px-2.5 py-2 text-left transition-colors ${
        active
          ? "border-accent bg-accent-glow text-text"
          : "border-border text-text-muted hover:border-border-2 hover:text-text"
      }`}
    >
      <span className="font-body text-[12px] font-medium leading-tight">{def.label}</span>
      {hint && (
        <span className={`font-mono text-[10px] leading-tight ${active ? "text-accent" : "text-text-muted"}`}>
          {hint}
        </span>
      )}
    </button>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

// Stable fallback — avoids creating a new array ref each render (useSyncExternalStore infinite-loop guard)
const EMPTY_BX: string[] = [];

export default function BuffsTab() {
  const activeBx  = useBuilderStore((s) => s.build.bx ?? EMPTY_BX);
  const toggleBuff = useBuilderStore((s) => s.toggleBuff);

  const groups = (["defense", "offense", "resource"] as const).map((g) => ({
    id: g,
    label: GROUP_LABELS[g],
    defs: BUFF_DEFS.filter((d) => d.group === g),
  }));

  return (
    <div className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-4">

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-base text-text">Active Buffs</h2>
          <p className="mt-0.5 font-body text-[11px] text-text-muted">
            Toggle buffs to include them in the stat calculation. Assumes 100% uptime.
          </p>
        </div>
        {activeBx.length > 0 && (
          <button
            type="button"
            onClick={() => activeBx.forEach((id) => toggleBuff(id))}
            className="shrink-0 rounded border border-border-2 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-text-muted transition-colors hover:border-accent hover:text-accent"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Groups */}
      {groups.map(({ id, label, defs }) => (
        <section key={id}>
          <p className="mb-2 font-mono text-[9px] uppercase tracking-widest text-text-muted">
            {label}
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {defs.map((def) => (
              <BuffToggle
                key={def.id}
                def={def}
                active={activeBx.includes(def.id)}
                onToggle={() => toggleBuff(def.id)}
              />
            ))}
          </div>
        </section>
      ))}

      {/* Footer note */}
      <p className="border-t border-border pt-3 font-mono text-[9px] text-text-muted">
        Major Evasion · Major Protection · Major Expedition and similar combat-only buffs
        don't affect the stat sheet and are not listed.
      </p>
    </div>
  );
}
