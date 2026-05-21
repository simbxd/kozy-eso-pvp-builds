import { WEAPON_TYPES } from "@/lib/gear-slots";
import { useBuilderStore } from "@/store/builder-store";
import SkillSelect from "@/components/builder/skills/SkillSelect";

const SLOTS = [0, 1, 2, 3, 4] as const;

export default function SkillBar({ bar }: { bar: 0 | 1 }) {
  const setup = useBuilderStore((s) => s.build.b[bar]);
  const setBarSkill = useBuilderStore((s) => s.setBarSkill);
  const setBarUltimate = useBuilderStore((s) => s.setBarUltimate);
  const setBarWeapon = useBuilderStore((s) => s.setBarWeapon);

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-display text-sm uppercase tracking-wide text-text-muted">
          {bar === 0 ? "Front Bar" : "Back Bar"}
        </h3>
        <select
          value={setup.w}
          onChange={(e) => setBarWeapon(bar, e.target.value)}
          className="rounded border border-border bg-surface-2 px-2 py-1 text-xs text-text font-body outline-none focus:border-accent"
        >
          <option value="">— Weapon —</option>
          {WEAPON_TYPES.map((w) => (
            <option key={w} value={w}>
              {w.replace(/-/g, " ")}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {SLOTS.map((i) => (
          <SkillSelect
            key={i}
            kind="Active"
            value={setup.sk[i]}
            onChange={(id) => setBarSkill(bar, i, id)}
          />
        ))}
        <SkillSelect
          kind="Ultimate"
          value={setup.u}
          onChange={(id) => setBarUltimate(bar, id)}
        />
      </div>
    </div>
  );
}
