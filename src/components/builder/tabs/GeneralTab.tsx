import { useEditorStore } from "../state";
import { T, F, SectionHead, PillBtn } from "../atoms";
import { SearchSelect, type SelectItem } from "../atoms/SearchSelect";
import racesJson  from "@/data/eso/races-index.json";
import mundusJson from "@/data/eso/mundus-index.json";

// ── Static data ───────────────────────────────────────────────────────────────

const CLASSES: SelectItem[] = [
  { id: "dragonknight",  label: "Dragonknight"  },
  { id: "sorcerer",      label: "Sorcerer"       },
  { id: "nightblade",    label: "Nightblade"     },
  { id: "templar",       label: "Templar"        },
  { id: "warden",        label: "Warden"         },
  { id: "necromancer",   label: "Necromancer"    },
  { id: "arcanist",      label: "Arcanist"       },
];

const races = (racesJson as { id: string; name: string; alliance: string }[]);
const RACES: SelectItem[] = races.map((r) => ({
  id: r.id, label: r.name, badge: r.alliance,
}));

const mundus = (mundusJson as { id: string; name: string; effect: string; value_base: number }[]);
const MUNDUS: SelectItem[] = mundus.map((m) => ({
  id: m.id, label: m.name, sub: m.effect,
}));

const MODES: Array<["cyro" | "bg" | "ic" | "duel", string, string]> = [
  ["cyro", "Cyrodiil",        "Large-scale siege PvP"],
  ["bg",   "Battlegrounds",   "4v4v4 instanced arenas"],
  ["ic",   "Imperial City",   "IC sewers / districts"],
  ["duel", "Dueling",         "1v1 open-world"],
];

// ── GeneralTab ────────────────────────────────────────────────────────────────

export default function GeneralTab() {
  const meta      = useEditorStore((s) => s.meta);
  const patchMeta = useEditorStore((s) => s.patchMeta);

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20,
      height: "100%", overflow: "hidden",
    }}>
      {/* Left */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <SectionHead title="Class" count="base skill lines" />
        <SearchSelect
          value={meta.classId}
          onChange={(id) => patchMeta({ classId: id })}
          items={CLASSES}
          placeholder="Choose class"
          searchable={false}
          popoverWidth={220}
        />

        <SectionHead title="Race" count="racial passives" />
        <SearchSelect
          value={meta.race}
          onChange={(id) => patchMeta({ race: id })}
          items={RACES}
          placeholder="Choose race"
          searchable={false}
          popoverWidth={280}
        />

        <SectionHead title="Mundus Stone" count="passive bonus" />
        <SearchSelect
          value={meta.mundus}
          onChange={(id) => patchMeta({ mundus: id })}
          items={MUNDUS}
          placeholder="Choose mundus"
          searchable={false}
          popoverWidth={300}
        />
      </div>

      {/* Right */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <SectionHead title="Game Mode" count="target content" />
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {MODES.map(([key, label, desc]) => {
            const on = meta.mode === key;
            return (
              <button
                key={key} type="button"
                onClick={() => patchMeta({ mode: key })}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 14px", textAlign: "left",
                  border: `1px solid ${on ? T.accent : T.edge}`,
                  background: on ? "rgba(139,92,246,0.10)" : "rgba(10,6,18,0.4)",
                  cursor: "pointer",
                }}
              >
                <div style={{
                  width: 8, height: 8, transform: "rotate(45deg)",
                  background: on ? T.accent : T.edge, flexShrink: 0,
                }} />
                <div>
                  <div style={{
                    fontFamily: F.display, fontSize: 14,
                    color: on ? T.ink : T.inkDim,
                    fontWeight: on ? 600 : 400,
                  }}>{label}</div>
                  <div style={{
                    fontFamily: F.mono, fontSize: 9, letterSpacing: "0.18em",
                    color: T.inkMute, textTransform: "uppercase", marginTop: 2,
                  }}>{desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
