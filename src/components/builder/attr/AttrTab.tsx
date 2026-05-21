import { useBuilderStore } from "@/store/builder-store";
import AttrRow from "@/components/builder/attr/AttrRow";

const TOTAL = 64;

// Stable fallback — avoids creating a new array ref each render (useSyncExternalStore infinite-loop guard)
const DEFAULT_ATTR: [number, number, number] = [0, 0, 64];

// Quick presets: index → [hp, mag, sta]
const PRESETS: Array<{ label: string; pts: [number, number, number] }> = [
  { label: "Full HP",   pts: [64, 0,  0]  },
  { label: "Full Mag",  pts: [0,  64, 0]  },
  { label: "Full Stam", pts: [0,  0,  64] },
];

export default function AttrTab() {
  const attrPoints = useBuilderStore((s) => s.build.a.attrPoints ?? DEFAULT_ATTR);
  const setAttr = useBuilderStore((s) => s.setAttr);
  const loadBuild = useBuilderStore((s) => s.loadBuild);
  const build = useBuilderStore((s) => s.build);

  const used = attrPoints[0] + attrPoints[1] + attrPoints[2];
  const remaining = TOTAL - used;

  const applyPreset = (pts: [number, number, number]) => {
    loadBuild({ ...build, a: { ...build.a, attrPoints: pts } });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="mb-4 flex items-baseline justify-between gap-2">
          <h3 className="font-display text-sm uppercase tracking-wide text-text">
            Attribute Points
          </h3>
          <span
            className={`font-mono text-xs ${
              remaining > 0 ? "text-accent" : "text-text-muted"
            }`}
          >
            {used} / {TOTAL} used
            {remaining > 0 && (
              <span className="ml-1 text-text-muted">
                ({remaining} left)
              </span>
            )}
          </span>
        </div>

        <div className="flex flex-col gap-3">
          <AttrRow
            label="Health"
            colorClass="text-critical"
            barClass="bg-critical"
            value={attrPoints[0]}
            max={attrPoints[0] + remaining}
            onChange={(v) => setAttr(0, v)}
          />
          <AttrRow
            label="Magicka"
            colorClass="text-cp-fitness"
            barClass="bg-cp-fitness"
            value={attrPoints[1]}
            max={attrPoints[1] + remaining}
            onChange={(v) => setAttr(1, v)}
          />
          <AttrRow
            label="Stamina"
            colorClass="text-mythic"
            barClass="bg-mythic"
            value={attrPoints[2]}
            max={attrPoints[2] + remaining}
            onChange={(v) => setAttr(2, v)}
          />
        </div>

        <div className="mt-4 flex gap-2 border-t border-border pt-3">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => applyPreset(p.pts)}
              className="rounded border border-border-2 px-2.5 py-1 font-mono text-[10px] text-text-muted transition-colors hover:border-accent hover:text-accent"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
