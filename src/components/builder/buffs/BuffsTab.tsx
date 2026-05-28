import { useEditorStore } from "@/components/builder/state";
import { BUFF_DEFS, type BuffDef } from "@/lib/eso-bonuses";

// ── Helpers ───────────────────────────────────────────────────────────────────

function buffHint(def: BuffDef): string {
  if (def.pct) {
    const pct  = `+${Math.round((def.pct.factor - 1) * 100)}%`;
    const keys = def.pct.keys.map((k) =>
      k === "weaponDmg" ? "WD" : k === "spellDmg" ? "SD"
      : k === "maxHealth" ? "HP" : k === "maxStamina" ? "Stam"
      : k === "maxMagicka" ? "Mag" : k,
    );
    const base = `${pct} ${keys.join("+")}`;
    return def.hintSuffix ? `${base} ${def.hintSuffix}` : base;
  }
  if (def.contrib) {
    const c = def.contrib;
    const parts: string[] = [];
    if (c.physResist && c.spellResist)  parts.push(`+${c.physResist.toLocaleString("en-US")} Resist`);
    else if (c.physResist)              parts.push(`+${c.physResist.toLocaleString("en-US")} Phys Res`);
    else if (c.spellResist)             parts.push(`+${c.spellResist.toLocaleString("en-US")} Spell Res`);
    if (c.weaponDmg && c.spellDmg)     parts.push(`+${c.weaponDmg} WD+SD`);
    else if (c.weaponDmg)              parts.push(`+${c.weaponDmg} WD`);
    else if (c.spellDmg)               parts.push(`+${c.spellDmg} SD`);
    if (c.critDamage)                  parts.push(`+${c.critDamage}% Crit Dmg`);
    if (c.critRating)                  parts.push(`+${c.critRating.toLocaleString("en-US")} Crit`);
    return parts.join(" · ");
  }
  return "";
}

// ── BuffToggle ────────────────────────────────────────────────────────────────

function BuffToggle({ def, active, onToggle }: {
  def:      BuffDef;
  active:   boolean;
  onToggle: () => void;
}) {
  const hint = buffHint(def);

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
      <span className={`font-mono text-[10px] leading-tight ${active ? "text-accent" : "text-text-muted"}`}>
        {hint}
      </span>
    </button>
  );
}

// ── Group section ─────────────────────────────────────────────────────────────

const GROUP_LABEL: Record<BuffDef["group"], string> = {
  offense:  "Offense",
  defense:  "Defense",
  resource: "Resources",
  recovery: "Recovery",
};

function BuffGroup({ groupId, activeBx, toggleBuff }: {
  groupId:    BuffDef["group"];
  activeBx:   readonly string[];
  toggleBuff: (id: string) => void;
}) {
  const defs = BUFF_DEFS.filter((d) => d.group === groupId);
  if (!defs.length) return null;
  return (
    <div>
      <p className="mb-2 font-mono text-[9px] uppercase tracking-widest text-text-muted">
        {GROUP_LABEL[groupId]}
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
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

const BUFF_GROUPS = (["offense", "defense", "resource", "recovery"] as const);

export default function BuffsTab() {
  const activeBx   = useEditorStore((s) => s.bx);
  const toggleBuff = useEditorStore((s) => s.toggleBuff);

  const activeCount = activeBx.length;

  return (
    <div className="flex flex-col gap-6 rounded-lg border border-border bg-surface p-4">

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-base text-text">Buffs</h2>
          <p className="mt-0.5 font-body text-[11px] text-text-muted">
            Toggle to include in stat calculation. Assumes 100% uptime.
          </p>
        </div>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={() => [...activeBx].forEach((id) => toggleBuff(id))}
            className="shrink-0 rounded border border-border-2 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-text-muted transition-colors hover:border-accent hover:text-accent"
          >
            Clear all
          </button>
        )}
      </div>

      {BUFF_GROUPS.map((g) => (
        <BuffGroup
          key={g}
          groupId={g}
          activeBx={activeBx}
          toggleBuff={toggleBuff}
        />
      ))}

    </div>
  );
}
