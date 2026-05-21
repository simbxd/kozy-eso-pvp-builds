import { useMemo, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { ChevronDown, X, Search } from "lucide-react";
import { setsIndex } from "@/lib/eso-data";

const CAP = 60; // 713 sets — render a capped slice, search narrows it

export default function SetSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const selected = setsIndex.find((s) => s.id === value);

  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return setsIndex;
    return setsIndex.filter((s) => s.name.toLowerCase().includes(needle));
  }, [q]);

  const shown = matches.slice(0, CAP);
  const overflow = matches.length - shown.length;

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
          className={`flex w-full items-center justify-between gap-1 rounded border px-2 py-1 text-left text-sm font-body transition-colors ${
            selected
              ? "border-border-2 bg-surface-2 text-text"
              : "border-dashed border-border-2 text-text-muted hover:border-accent"
          }`}
        >
          <span className="truncate">{selected ? selected.name : "— Set —"}</span>
          <ChevronDown size={14} className="shrink-0 text-text-muted" />
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
              placeholder="Search sets…"
              className="w-full bg-transparent py-1 text-sm text-text font-body outline-none"
            />
          </div>

          {value && (
            <button
              type="button"
              onClick={() => pick("")}
              className="mb-1 flex w-full items-center gap-1 rounded px-2 py-1 text-xs text-text-muted font-body hover:text-critical"
            >
              <X size={12} /> Clear set
            </button>
          )}

          <div className="max-h-72 overflow-y-auto">
            {shown.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => pick(s.id)}
                className="flex w-full items-center justify-between gap-2 rounded px-2 py-1 text-left text-sm text-text font-body transition-colors hover:bg-accent-glow hover:text-accent"
              >
                <span className="truncate">{s.name}</span>
                <span className="shrink-0 text-[10px] text-text-muted font-mono">
                  {s.type}
                </span>
              </button>
            ))}
            {shown.length === 0 && (
              <p className="px-2 py-2 text-xs text-text-muted font-body">
                No sets match “{q}”.
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
