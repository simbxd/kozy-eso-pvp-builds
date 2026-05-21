import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { useBuilderStore } from "@/store/builder-store";
import SubclassPicker from "@/components/builder/header/SubclassPicker";

// Hardcoded for M1. M2 swaps these for content-driven loaders + the real
// subclass / mundus pickers. Keep the shape stable so swapping is mechanical.
const CLASSES = [
  { id: "arcanist", name: "Arcanist" },
  { id: "dragonknight", name: "Dragonknight" },
  { id: "necromancer", name: "Necromancer" },
  { id: "nightblade", name: "Nightblade" },
  { id: "sorcerer", name: "Sorcerer" },
  { id: "templar", name: "Templar" },
  { id: "warden", name: "Warden" },
];

const RACES = [
  { id: "altmer", name: "Altmer" }, { id: "argonian", name: "Argonian" },
  { id: "bosmer", name: "Bosmer" }, { id: "breton", name: "Breton" },
  { id: "dunmer", name: "Dunmer" }, { id: "imperial", name: "Imperial" },
  { id: "khajiit", name: "Khajiit" }, { id: "nord", name: "Nord" },
  { id: "orc", name: "Orc" }, { id: "redguard", name: "Redguard" },
];

const MODES = [
  { id: "cyro", name: "Cyro" },
  { id: "bg", name: "BG" },
  { id: "ic", name: "IC" },
  { id: "duel", name: "Duel" },
] as const;

const selectClass =
  "bg-surface-2 border border-border rounded px-2 py-1 text-text font-body text-sm focus:border-accent outline-none";

export default function Header() {
  const build = useBuilderStore((s) => s.build);
  const setClass = useBuilderStore((s) => s.setClass);
  const setRace = useBuilderStore((s) => s.setRace);
  const setMode = useBuilderStore((s) => s.setMode);
  const [notesOpen, setNotesOpen] = useState(false);

  const notesLen = build.meta?.notes?.length ?? 0;

  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <div className="flex flex-wrap items-start gap-x-8 gap-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex flex-col gap-1 text-xs text-text-muted font-body">
            Class
            <select
              className={selectClass}
              value={build.c}
              onChange={(e) => setClass(e.target.value)}
            >
              <option value="">— Class —</option>
              {CLASSES.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs text-text-muted font-body">
            Race
            <select
              className={selectClass}
              value={build.r}
              onChange={(e) => setRace(e.target.value)}
            >
              <option value="">— Race —</option>
              {RACES.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs text-text-muted font-body">
            Mundus
            <select className={selectClass} disabled value="">
              <option value="">—</option>
            </select>
          </label>
        </div>

        <div className="flex flex-1 flex-wrap items-start justify-between gap-4">
          <SubclassPicker />

          <div className="flex flex-col gap-1">
            <span className="text-xs text-text-muted font-body">Mode</span>
            <div className="flex gap-1">
              {MODES.map((m) => {
                const active = build.meta?.mode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMode(m.id)}
                    className={`rounded px-3 py-1 text-sm font-mono border transition-colors ${
                      active
                        ? "bg-accent-glow text-accent border-accent"
                        : "border-border text-text-muted hover:text-text"
                    }`}
                  >
                    {m.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 border-t border-border pt-3">
        <button
          type="button"
          onClick={() => setNotesOpen((o) => !o)}
          className="flex w-full items-center justify-between text-sm text-text-muted font-body"
          aria-expanded={notesOpen}
        >
          <span className="flex items-center gap-1">
            <ChevronRight
              size={14}
              className={`transition-transform ${notesOpen ? "rotate-90" : ""}`}
            />
            Notes
          </span>
          <span className="font-mono text-xs">{notesLen}/500 chars</span>
        </button>
        {notesOpen && (
          <p className="mt-2 text-xs text-text-muted font-body">
            Notes editor — coming in M10.
          </p>
        )}
      </div>
    </div>
  );
}
