import { useMemo, useState } from "react";
import { useBuilderStore } from "@/store/builder-store";
import {
  computeStats,
  critPercent,
  resistPercent,
  type ComputedStats,
  type StatSources,
} from "@/lib/compute-stats";

// ── Formatters ────────────────────────────────────────────────────────────────
const fmtN   = (n: number) => n.toLocaleString("en-US");
const fmtPct = (n: number) => `${n}%`;

// ── Source breakdown (expandable detail) ─────────────────────────────────────

type StatKey = keyof ComputedStats;

function fmtSourceVal(val: number, key: StatKey): string {
  if (key === "critRating") {
    const pct = Math.round((Math.abs(val) / 219) * 10) / 10;
    return `${val > 0 ? "+" : ""}${fmtN(val)} (${pct > 0 ? "+" : ""}${pct}%)`;
  }
  if (key === "physResist" || key === "spellResist" || key === "critResistance") {
    const pct = Math.round((Math.abs(val) / 660) * 10) / 10;
    return `${val > 0 ? "+" : ""}${fmtN(val)} (${pct > 0 ? "+" : ""}${pct}%)`;
  }
  if (key === "critDamage" || key === "moveSpeed") return `${val > 0 ? "+" : ""}${val}%`;
  return `${val > 0 ? "+" : ""}${fmtN(val)}`;
}

function SourceBreakdown({ statKey, sources }: { statKey: StatKey; sources: StatSources }) {
  const entries = sources[statKey] ?? [];
  if (!entries.length) return null;
  return (
    <div className="mt-1 rounded bg-black/25 py-0.5">
      {entries.map((src, i) => (
        <div key={i} className="flex items-baseline justify-between gap-2 px-2 py-0.5 text-[10px]">
          <span className="text-text-muted truncate">{src.label}</span>
          <span className={`shrink-0 font-mono ${
            src.label === "Base" ? "text-text-muted"
            : src.value < 0    ? "text-red-400"
            : "text-[#4ade80]"
          }`}>
            {fmtSourceVal(src.value, statKey)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Resource card (Health / Magicka / Stamina) ────────────────────────────────

type ResourceCardProps = {
  label: string;
  value: number;
  color: string;        // tailwind text color class
  statKey: StatKey;
  expanded: boolean;
  onToggle: () => void;
  sources: StatSources;
};

function ResourceCard({ label, value, color, statKey, expanded, onToggle, sources }: ResourceCardProps) {
  const hasSources = (sources[statKey]?.length ?? 0) > 0;
  return (
    <div>
      <button
        type="button"
        onClick={hasSources ? onToggle : undefined}
        className={`w-full rounded-md border border-border bg-black/20 px-3 py-2.5 text-center transition-colors ${
          hasSources ? "cursor-pointer hover:border-border-2" : "cursor-default"
        }`}
      >
        <p className="mb-1 font-mono text-[9px] uppercase tracking-widest text-text-muted">{label}</p>
        <p className={`font-mono text-lg font-bold leading-none tracking-tight ${color}`}>
          {fmtN(value)}
        </p>
      </button>
      {expanded && hasSources && <SourceBreakdown statKey={statKey} sources={sources} />}
    </div>
  );
}

// ── Stat row (2-col pair or single) ──────────────────────────────────────────

type StatCellProps = {
  label: string;
  display: string;
  statKey: StatKey;
  expanded: boolean;
  onToggle: () => void;
  sources: StatSources;
  valueClass?: string;
};

function StatCell({ label, display, statKey, expanded, onToggle, sources, valueClass = "text-mono" }: StatCellProps) {
  const hasSources = (sources[statKey]?.length ?? 0) > 0;
  return (
    <div>
      <button
        type="button"
        onClick={hasSources ? onToggle : undefined}
        className={`flex w-full items-center justify-between gap-1 rounded px-1.5 py-1 text-left transition-colors ${
          hasSources ? "cursor-pointer hover:bg-white/[0.03]" : "cursor-default"
        }`}
      >
        <span className="font-body text-[11px] text-text-muted">{label}</span>
        <span className={`flex items-center gap-1 font-mono text-[13px] font-medium ${valueClass}`}>
          {display}
          {hasSources && (
            <svg className={`h-2 w-2 shrink-0 text-text-muted transition-transform ${expanded ? "rotate-90" : ""}`}
              fill="none" viewBox="0 0 6 10" stroke="currentColor" strokeWidth={2}>
              <path d="M1 1l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
      </button>
      {expanded && hasSources && <SourceBreakdown statKey={statKey} sources={sources} />}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ComputedStats() {
  const build              = useBuilderStore((s) => s.build);
  const setConditionalBonuses = useBuilderStore((s) => s.setConditionalBonuses);
  const setBattleSpirit    = useBuilderStore((s) => s.setBattleSpirit);

  const { stats, sources } = useMemo(() => computeStats(build), [build]);

  const cbOn = build.a.cb === true;
  const bsOn = build.bs !== false;

  const [expanded, setExpanded] = useState<Set<StatKey>>(new Set());

  function toggle(key: StatKey) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  const ex = (k: StatKey) => expanded.has(k);

  return (
    <div className="flex flex-col gap-0 rounded-xl border border-border bg-surface overflow-hidden">

      {/* ── Header bar ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <span className="font-display text-sm text-text">Stats</span>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setBattleSpirit(!bsOn)}
            title="Battle Spirit: halves Physical and Spell Resistance (toujours actif en PvP)"
            className={`rounded px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider transition-colors border ${
              bsOn ? "border-accent bg-accent-glow text-accent" : "border-border-2 text-text-muted hover:border-accent hover:text-accent"
            }`}>
            BS
          </button>
          <button type="button" onClick={() => setConditionalBonuses(!cbOn)}
            title="Prendre en compte les bonus conditionnels de sets (procs actifs)"
            className={`rounded px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider transition-colors border ${
              cbOn ? "border-accent bg-accent-glow text-accent" : "border-border-2 text-text-muted hover:border-accent hover:text-accent"
            }`}>
            Procs
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-3">

        {/* ── RESOURCES ───────────────────────────────────────────────── */}
        <section>
          <p className="mb-2 font-mono text-[9px] uppercase tracking-widest text-text-muted">Resources</p>
          <div className="grid grid-cols-3 gap-1.5">
            <ResourceCard label="Health"  value={stats.maxHealth}  color="text-[#f87171]" statKey="maxHealth"  expanded={ex("maxHealth")}  onToggle={() => toggle("maxHealth")}  sources={sources} />
            <ResourceCard label="Magicka" value={stats.maxMagicka} color="text-[#818cf8]" statKey="maxMagicka" expanded={ex("maxMagicka")} onToggle={() => toggle("maxMagicka")} sources={sources} />
            <ResourceCard label="Stamina" value={stats.maxStamina} color="text-[#4ade80]" statKey="maxStamina" expanded={ex("maxStamina")} onToggle={() => toggle("maxStamina")} sources={sources} />
          </div>
        </section>

        {/* ── OFFENSE ─────────────────────────────────────────────────── */}
        <section>
          <p className="mb-1 font-mono text-[9px] uppercase tracking-widest text-text-muted">Offense</p>
          <div className="divide-y divide-border/40 rounded-md border border-border/60 bg-black/15">
            {/* WD / SD */}
            <div className="grid grid-cols-2 divide-x divide-border/40">
              <StatCell label="Weapon Dmg"  display={fmtN(stats.weaponDmg)}   statKey="weaponDmg"  expanded={ex("weaponDmg")}  onToggle={() => toggle("weaponDmg")}  sources={sources} />
              <StatCell label="Spell Dmg"   display={fmtN(stats.spellDmg)}    statKey="spellDmg"   expanded={ex("spellDmg")}   onToggle={() => toggle("spellDmg")}   sources={sources} />
            </div>
            {/* Crit % / Crit Dmg */}
            <div className="grid grid-cols-2 divide-x divide-border/40">
              <StatCell label="Crit Chance"  display={`${critPercent(stats.critRating)}%`} statKey="critRating"  expanded={ex("critRating")}  onToggle={() => toggle("critRating")}  sources={sources} />
              <StatCell label="Crit Damage"  display={fmtPct(stats.critDamage)}            statKey="critDamage"  expanded={ex("critDamage")}  onToggle={() => toggle("critDamage")}  sources={sources} />
            </div>
            {/* Pen */}
            <div className="grid grid-cols-2 divide-x divide-border/40">
              <StatCell label="Phys Pen"  display={fmtN(stats.physPen)}  statKey="physPen"  expanded={ex("physPen")}  onToggle={() => toggle("physPen")}  sources={sources} />
              <StatCell label="Spell Pen" display={fmtN(stats.spellPen)} statKey="spellPen" expanded={ex("spellPen")} onToggle={() => toggle("spellPen")} sources={sources} />
            </div>
          </div>
        </section>

        {/* ── RECOVERY ────────────────────────────────────────────────── */}
        <section>
          <p className="mb-1 font-mono text-[9px] uppercase tracking-widest text-text-muted">Recovery</p>
          <div className="divide-y divide-border/40 rounded-md border border-border/60 bg-black/15">
            <div className="grid grid-cols-2 divide-x divide-border/40">
              <StatCell label="Health Rec"  display={fmtN(stats.healthRecovery)}  statKey="healthRecovery"  expanded={ex("healthRecovery")}  onToggle={() => toggle("healthRecovery")}  sources={sources} />
              <StatCell label="Magicka Rec" display={fmtN(stats.magickaRecovery)} statKey="magickaRecovery" expanded={ex("magickaRecovery")} onToggle={() => toggle("magickaRecovery")} sources={sources} />
            </div>
            <StatCell label="Stamina Rec" display={fmtN(stats.staminaRecovery)} statKey="staminaRecovery" expanded={ex("staminaRecovery")} onToggle={() => toggle("staminaRecovery")} sources={sources} />
          </div>
        </section>

        {/* ── DEFENSE ─────────────────────────────────────────────────── */}
        <section>
          <p className="mb-1 font-mono text-[9px] uppercase tracking-widest text-text-muted">Defense</p>
          <div className="divide-y divide-border/40 rounded-md border border-border/60 bg-black/15">
            <div className="grid grid-cols-2 divide-x divide-border/40">
              <StatCell
                label="Phys Resist"
                display={`${fmtN(stats.physResist)} (${resistPercent(stats.physResist)}%)`}
                statKey="physResist"
                expanded={ex("physResist")}
                onToggle={() => toggle("physResist")}
                sources={sources}
              />
              <StatCell
                label="Spell Resist"
                display={`${fmtN(stats.spellResist)} (${resistPercent(stats.spellResist)}%)`}
                statKey="spellResist"
                expanded={ex("spellResist")}
                onToggle={() => toggle("spellResist")}
                sources={sources}
              />
            </div>
            <StatCell label="Crit Resist" display={fmtN(stats.critResistance)} statKey="critResistance" expanded={ex("critResistance")} onToggle={() => toggle("critResistance")} sources={sources} />
          </div>
        </section>

      </div>

      {/* ── Footer note ─────────────────────────────────────────────── */}
      <div className="border-t border-border px-3 py-1.5">
        <p className="font-mono text-[9px] text-text-muted">CP160 gold · bar 1 · food · passives · CP810</p>
      </div>
    </div>
  );
}
