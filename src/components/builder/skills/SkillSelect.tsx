import { useMemo, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { ChevronDown, X, Search } from "lucide-react";
import { skillsIndex } from "@/lib/eso-data";
import { useBuilderStore } from "@/store/builder-store";
import type { EsoSkillIndex } from "@/types/eso";

const CAP = 80;

function SkillIcon({ skill }: { skill: EsoSkillIndex }) {
  const [ok, setOk] = useState(true);
  if (!ok)
    return <span className="h-5 w-5 shrink-0 rounded-full bg-surface-2" />;
  return (
    <img
      src={skill.icon}
      alt=""
      onError={() => setOk(false)}
      className="h-5 w-5 shrink-0 rounded-full"
      style={{ clipPath: "circle(50%)" }}
    />
  );
}

export default function SkillSelect({
  value,
  onChange,
  kind,
}: {
  value: string;
  onChange: (id: string) => void;
  kind: "Active" | "Ultimate";
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const slottedLines = useBuilderStore((s) => s.build.sl);
  const selected = skillsIndex.find((s) => s.id === value);

  const pool = useMemo(
    () => skillsIndex.filter((s) => s.type === kind),
    [kind],
  );

  // Skills from the build's 3 slotted skill lines float to the top so the
  // relevant ~30 are reachable before the long tail of every other line.
  const ordered = useMemo(() => {
    const prio = new Set(slottedLines.filter(Boolean));
    const score = (s: EsoSkillIndex) => (prio.has(s.skill_line_id) ? 0 : 1);
    return [...pool].sort(
      (a, b) =>
        score(a) - score(b) ||
        a.skill_line.localeCompare(b.skill_line) ||
        a.name.localeCompare(b.name),
    );
  }, [pool, slottedLines]);

  const matches = useMemo(() => {
    const n = q.trim().toLowerCase();
    return n ? ordered.filter((s) => s.name.toLowerCase().includes(n)) : ordered;
  }, [q, ordered]);

  const shown = matches.slice(0, CAP);
  const overflow = matches.length - shown.length;
  const prioSet = new Set(slottedLines.filter(Boolean));

  const pick = (id: string) => {
    onChange(id);
    setOpen(false);
    setQ("");
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          title={selected?.name}
          className={`flex w-full items-center gap-1 rounded border px-1.5 py-1 text-left text-xs font-body transition-colors ${
            selected
              ? "border-border-2 bg-surface-2 text-text"
              : "border-dashed border-border-2 text-text-muted hover:border-accent"
          }`}
        >
          {selected && <SkillIcon skill={selected} />}
          <span className="min-w-0 flex-1 truncate">
            {selected ? selected.name : `— ${kind} —`}
          </span>
          <ChevronDown size={12} className="shrink-0 text-text-muted" />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          sideOffset={6}
          align="start"
          className="z-50 w-72 rounded-lg border border-border-2 bg-surface p-2 shadow-lg"
        >
          <div className="mb-2 flex items-center gap-1 rounded border border-border bg-surface-2 px-2">
            <Search size={13} className="text-text-muted" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`Search ${kind.toLowerCase()} skills…`}
              className="w-full bg-transparent py-1 text-sm text-text font-body outline-none"
            />
          </div>

          {value && (
            <button
              type="button"
              onClick={() => pick("")}
              className="mb-1 flex w-full items-center gap-1 rounded px-2 py-1 text-xs text-text-muted font-body hover:text-critical"
            >
              <X size={12} /> Clear slot
            </button>
          )}

          <div className="max-h-72 overflow-y-auto">
            {shown.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => pick(s.id)}
                className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm text-text font-body transition-colors hover:bg-accent-glow hover:text-accent"
              >
                <SkillIcon skill={s} />
                <span className="min-w-0 flex-1 truncate">{s.name}</span>
                <span className="flex shrink-0 items-center gap-1 text-[10px] text-text-muted font-mono">
                  {prioSet.has(s.skill_line_id) && (
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  )}
                  {s.skill_line}
                </span>
              </button>
            ))}
            {shown.length === 0 && (
              <p className="px-2 py-2 text-xs text-text-muted font-body">
                No skills match “{q}”.
              </p>
            )}
            {overflow > 0 && (
              <p className="px-2 py-2 text-[10px] text-text-muted font-mono">
                +{overflow} more — refine search
              </p>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
