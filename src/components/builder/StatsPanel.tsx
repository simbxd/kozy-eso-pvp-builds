import { useMemo } from "react";
import { useEditorStore, type Setup, type BuildMeta } from "./state";
import { T, F, Diamond } from "./atoms";
import { setsIndex } from "@/lib/eso-data";

// ── Set name lookup ───────────────────────────────────────────────────────────

const SET_NAME_MAP = new Map(setsIndex.map((s) => [s.id, s.name]));

// ── Active sets computation ───────────────────────────────────────────────────

type SetEntry = { id: string; name: string; count: number };

function computeActiveSets(setup: Setup): SetEntry[] {
  const counts = new Map<string, number>();

  const allPieces = [
    ...setup.armor,
    ...setup.jewelry,
    ...setup.weapons,
  ] as Array<{ set?: string }>;

  for (const piece of allPieces) {
    if (!piece.set) continue;
    counts.set(piece.set, (counts.get(piece.set) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([id, count]) => ({
      id,
      name: SET_NAME_MAP.get(id) ?? id,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

// ── Armor weight distribution ─────────────────────────────────────────────────

function computeWeightDist(setup: Setup): { heavy: number; medium: number; light: number } {
  const dist = { heavy: 0, medium: 0, light: 0 };
  for (const p of setup.armor) dist[p.weight]++;
  return dist;
}

// ── Weapon bar summary ────────────────────────────────────────────────────────

const WEAPON_LABEL: Record<string, string> = {
  "two-handed":        "2H",
  "one-hand-and-shield": "S+B",
  "dual-wield":        "DW",
  "bow":               "Bow",
  "inferno-staff":     "Inferno",
  "lightning-staff":   "Lightning",
  "ice-staff":         "Ice",
  "restoration-staff": "Resto",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function PanelSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        paddingBottom: 6,
        borderBottom: `1px solid ${T.edge}`,
      }}>
        <Diamond size={5} color={T.accentSoft} />
        <span style={{
          fontFamily: F.mono, fontSize: 9, letterSpacing: "0.32em",
          color: T.inkMute, textTransform: "uppercase",
        }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

// Active sets section
function ActiveSets({ setup }: { setup: Setup }) {
  const sets = useMemo(() => computeActiveSets(setup), [setup]);

  if (!sets.length) {
    return (
      <span style={{
        fontFamily: F.mono, fontSize: 10, color: T.inkFaint,
        fontStyle: "italic", letterSpacing: "0.08em",
      }}>— no sets equipped</span>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {sets.map(({ id, name, count }) => (
        <div key={id} style={{
          display: "flex", alignItems: "baseline", justifyContent: "space-between",
          gap: 6, padding: "3px 6px",
          background: "rgba(139,92,246,0.05)",
          border: `1px solid ${count >= 5 ? T.accent + "44" : T.edge}`,
        }}>
          <span style={{
            fontFamily: F.display, fontSize: 12, fontStyle: "italic",
            color: count >= 5 ? T.inkDim : T.inkMute,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            minWidth: 0,
          }}>{name}</span>
          <span style={{
            fontFamily: F.mono, fontSize: 10,
            color: count >= 5 ? T.accentSoft : count >= 2 ? T.inkDim : T.inkFaint,
            flexShrink: 0,
            fontWeight: count >= 5 ? 700 : 400,
          }}>{count}pc</span>
        </div>
      ))}
    </div>
  );
}

// Armor weight distribution
function WeightDist({ setup }: { setup: Setup }) {
  const dist = computeWeightDist(setup);
  const WEIGHTS = [
    { key: "heavy",  letter: "H", color: "#e06060" },
    { key: "medium", letter: "M", color: "#72c472" },
    { key: "light",  letter: "L", color: "#7ab0e0" },
  ] as const;

  return (
    <div style={{ display: "flex", gap: 4 }}>
      {WEIGHTS.map(({ key, letter, color }) => {
        const n = dist[key];
        return (
          <div key={key} style={{
            flex: 1,
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            padding: "6px 0",
            background: n > 0 ? `${color}12` : "rgba(10,6,18,0.3)",
            border: `1px solid ${n > 0 ? color + "44" : T.edge}`,
          }}>
            <span style={{
              fontFamily: F.mono, fontSize: 9, letterSpacing: "0.14em",
              color: n > 0 ? color : T.inkFaint, fontWeight: 600,
            }}>{letter}</span>
            <span style={{
              fontFamily: F.mono, fontSize: 16, lineHeight: 1,
              color: n > 0 ? color : T.inkFaint,
            }}>{n}</span>
          </div>
        );
      })}
    </div>
  );
}

// Weapons on bars
function Weapons({ setup }: { setup: Setup }) {
  const bar1Main = setup.weapons.find((w) => w.slot === "bar1_main");
  const bar1Off  = setup.weapons.find((w) => w.slot === "bar1_off");
  const bar2Main = setup.weapons.find((w) => w.slot === "bar2_main");
  const bar2Off  = setup.weapons.find((w) => w.slot === "bar2_off");

  function WeaponPill({ weapon, label }: { weapon: typeof bar1Main; label: string }) {
    const typeLbl = weapon?.type ? (WEAPON_LABEL[weapon.type] ?? weapon.type) : "—";
    const setName = weapon?.set ? (SET_NAME_MAP.get(weapon.set) ?? weapon.set) : null;
    return (
      <div style={{
        display: "flex", gap: 6, alignItems: "flex-start", padding: "4px 6px",
        background: "rgba(10,6,18,0.3)", border: `1px solid ${T.edge}`,
      }}>
        <span style={{
          fontFamily: F.mono, fontSize: 8, letterSpacing: "0.22em",
          color: T.inkFaint, textTransform: "uppercase",
          paddingTop: 2, flexShrink: 0,
        }}>{label}</span>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontFamily: F.mono, fontSize: 10, letterSpacing: "0.14em",
            color: typeLbl !== "—" ? T.inkDim : T.inkFaint,
          }}>{typeLbl}</div>
          {setName && (
            <div style={{
              fontFamily: F.display, fontSize: 10, fontStyle: "italic",
              color: T.inkMute, overflow: "hidden", textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>{setName}</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{
        fontFamily: F.mono, fontSize: 8, letterSpacing: "0.28em",
        color: T.inkFaint, textTransform: "uppercase", marginBottom: 2,
      }}>Bar I</div>
      <WeaponPill weapon={bar1Main} label="MH" />
      <WeaponPill weapon={bar1Off}  label="OH" />

      <div style={{
        fontFamily: F.mono, fontSize: 8, letterSpacing: "0.28em",
        color: T.inkFaint, textTransform: "uppercase", marginTop: 4, marginBottom: 2,
      }}>Bar II</div>
      <WeaponPill weapon={bar2Main} label="MH" />
      <WeaponPill weapon={bar2Off}  label="OH" />
    </div>
  );
}

// Attributes bar
function Attributes({ setup }: { setup: Setup }) {
  const { health, magicka, stamina } = setup.attributes;
  const total = health + magicka + stamina;
  const remaining = 64 - total;

  const ATTRS = [
    { key: "health",  label: "Health",  color: "#e07070", val: health  },
    { key: "magicka", label: "Magicka", color: "#818cf8", val: magicka },
    { key: "stamina", label: "Stamina", color: "#4ade80", val: stamina },
  ] as const;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {/* Stacked bar */}
      <div style={{
        display: "flex", height: 6, border: `1px solid ${T.edge}`, overflow: "hidden",
      }}>
        {ATTRS.map(({ key, color, val }) =>
          val > 0 ? (
            <div key={key} style={{
              width: `${(val / 64) * 100}%`,
              background: color, flexShrink: 0,
            }} />
          ) : null
        )}
        {remaining > 0 && (
          <div style={{
            flex: 1, background: "rgba(205,180,255,0.06)",
          }} />
        )}
      </div>
      {/* Numbers */}
      <div style={{ display: "flex", gap: 4 }}>
        {ATTRS.map(({ key, label, color, val }) => (
          <div key={key} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            padding: "4px 0",
            background: val > 0 ? `${color}0d` : "transparent",
            border: `1px solid ${val > 0 ? color + "30" : T.edge}`,
          }}>
            <span style={{
              fontFamily: F.mono, fontSize: 7, letterSpacing: "0.22em",
              color: val > 0 ? color : T.inkFaint, textTransform: "uppercase",
            }}>{label.slice(0, 3)}</span>
            <span style={{
              fontFamily: F.mono, fontSize: 14, lineHeight: 1,
              color: val > 0 ? color : T.inkFaint, fontWeight: 600, marginTop: 2,
            }}>{val}</span>
          </div>
        ))}
        {remaining > 0 && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", padding: "4px 6px",
            border: `1px solid ${T.edge}`,
            background: "rgba(10,6,18,0.3)",
          }}>
            <span style={{
              fontFamily: F.mono, fontSize: 7, color: T.inkFaint, letterSpacing: "0.14em",
            }}>Free</span>
            <span style={{
              fontFamily: F.mono, fontSize: 12, color: T.inkFaint,
            }}>{remaining}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Setup selector (multiple setups) ──────────────────────────────────────────

function SetupSelector() {
  const setups         = useEditorStore((s) => s.setups);
  const activeSetupIdx = useEditorStore((s) => s.activeSetupIdx);
  const setActiveSetup = useEditorStore((s) => s.setActiveSetup);
  const addSetup       = useEditorStore((s) => s.addSetup);

  if (setups.length <= 1 && !setups[0].name) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {setups.map((su, i) => (
        <button key={i} type="button"
          onClick={() => setActiveSetup(i)}
          style={{
            padding: "5px 8px", textAlign: "left",
            background: i === activeSetupIdx ? "rgba(139,92,246,0.12)" : "transparent",
            border: `1px solid ${i === activeSetupIdx ? T.accent + "66" : T.edge}`,
            cursor: "pointer", display: "flex", gap: 8, alignItems: "center",
          }}>
          <span style={{
            fontFamily: F.mono, fontSize: 9, letterSpacing: "0.18em",
            color: i === activeSetupIdx ? T.accentSoft : T.inkFaint,
          }}>{String(i + 1).padStart(2, "0")}</span>
          <span style={{
            fontFamily: F.display, fontSize: 12, fontStyle: "italic",
            color: i === activeSetupIdx ? T.ink : T.inkDim,
          }}>{su.name || "Untitled Setup"}</span>
        </button>
      ))}
      {setups.length < 5 && (
        <button type="button" onClick={addSetup}
          style={{
            padding: "5px 8px", textAlign: "left",
            background: "transparent",
            border: `1px dashed ${T.edge}`,
            cursor: "pointer", display: "flex", gap: 6, alignItems: "center",
            color: T.inkFaint, fontFamily: F.mono, fontSize: 9,
            letterSpacing: "0.18em", textTransform: "uppercase",
          }}>
          + Add Setup
        </button>
      )}
    </div>
  );
}

// ── StatsPanel ────────────────────────────────────────────────────────────────

export default function StatsPanel() {
  const setup  = useEditorStore((s) => s.setups[s.activeSetupIdx]);
  const setups = useEditorStore((s) => s.setups);

  return (
    <div style={{
      width: 240, flexShrink: 0,
      borderLeft: `1px solid ${T.edge}`,
      background: "rgba(10,6,18,0.45)",
      display: "flex", flexDirection: "column",
      overflow: "hidden",
    }}>
      <div style={{
        flex: 1, overflowY: "auto", overflowX: "hidden",
        padding: "16px 14px",
        display: "flex", flexDirection: "column", gap: 20,
        scrollbarWidth: "thin",
        // @ts-ignore
        scrollbarColor: `${T.edge} transparent`,
      }}>

        {/* Setups */}
        {setups.length > 1 && (
          <PanelSection title="Setups">
            <SetupSelector />
          </PanelSection>
        )}

        {/* Active sets */}
        <PanelSection title="Active Sets">
          <ActiveSets setup={setup} />
        </PanelSection>

        {/* Armor weights */}
        <PanelSection title="Armor Weights">
          <WeightDist setup={setup} />
        </PanelSection>

        {/* Weapons */}
        <PanelSection title="Weapons">
          <Weapons setup={setup} />
        </PanelSection>

        {/* Attribute points */}
        <PanelSection title="Attributes">
          <Attributes setup={setup} />
        </PanelSection>

      </div>

      {/* Footer */}
      <div style={{
        borderTop: `1px solid ${T.edge}`,
        padding: "8px 14px",
        fontFamily: F.mono, fontSize: 8,
        letterSpacing: "0.22em", color: T.inkFaint,
        textTransform: "uppercase",
      }}>
        ◆ Computed stats — coming soon
      </div>
    </div>
  );
}
