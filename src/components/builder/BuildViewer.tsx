import { useEffect, useState, type ReactNode } from "react";
import { decodeEditor, encodeEditor } from "@/lib/editor-codec";
import type { BuildMeta, Setup, ArmorPiece, JewelryPiece, WeaponPiece } from "./state";
import { getSet, getTrait, getEnchant, skillsIndex } from "@/lib/eso-data";
import { computeStatsFromEditor }              from "@/lib/editor-compute";
import { critPercent, resistPercent }          from "@/lib/compute-stats";
import { ALL_CLASS_LINES } from "./atoms/SkillLinePicker";
import { T, F, Diamond } from "./atoms";
import {
  type EsoHubSkillTip, type EsoHubSetTip,
  skillCache as esoHubSkillCache, setCache as esoHubSetCache,
  fetchSkillTip, fetchSetTip, setTipBonuses,
} from "@/lib/esohub-api";
import racesJson     from "@/data/eso/races-index.json";
import mundusJson    from "@/data/eso/mundus-index.json";
import masteriesJson from "@/data/eso/class-masteries-index.json";
import cpStarsJson   from "@/data/eso/cp-stars-index.json";
import {
  GRIMOIRE_MAP, FOCUS_MAP, SIGNATURE_MAP, AFFIX_MAP,
} from "@/lib/scribing-defs";
import type { ScribingSlot } from "./state";

// ── Resolution maps (built once) ──────────────────────────────────────────────

const CLASS_LABEL: Record<string, string> = {
  dragonknight: "Dragonknight", sorcerer: "Sorcerer", nightblade: "Nightblade",
  templar: "Templar", warden: "Warden", necromancer: "Necromancer", arcanist: "Arcanist",
};
const MODE_LABEL: Record<string, string> = {
  cyro: "Cyrodiil", bg: "Battlegrounds", ic: "Imperial City", duel: "Dueling",
};

const raceMap   = new Map((racesJson  as { id: string; name: string }[]).map((r) => [r.id, r.name]));
const mundusMap = new Map((mundusJson as { id: string; name: string }[]).map((m) => [m.id, m.name]));
const lineMap   = new Map(ALL_CLASS_LINES.map((l) => [l.id, l]));
const skillMap  = new Map(skillsIndex.map((s) => [s.id, s]));
const masteryMap = new Map(
  (masteriesJson as { id: string; name: string }[]).map((m) => [m.id, m.name]),
);

function slugCp(s: string) {
  return s.toLowerCase().replace(/[''`]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
const rawCp = cpStarsJson as { warfare: { name: string; effect?: string }[]; fitness: { name: string; effect?: string }[] };
const cpNameMap   = new Map<string, string>();
const cpEffectMap = new Map<string, string>();
for (const s of rawCp.warfare) {
  const key = "warfare:" + slugCp(s.name);
  cpNameMap.set(key, s.name);
  if (s.effect) cpEffectMap.set(key, s.effect);
}
for (const s of rawCp.fitness) {
  const key = "fitness:" + slugCp(s.name);
  cpNameMap.set(key, s.name);
  if (s.effect) cpEffectMap.set(key, s.effect);
}

// ── ESO-Hub tooltip API — see @/lib/esohub-api.ts ────────────────────────────
// Types + caches imported above; SetTipState adds a "local" fallback sentinel.
type SetTipState = EsoHubSetTip | "local" | null;

// ── Viewer tooltip data (loaded eagerly via Vite glob) ────────────────────────

type SetBonus = { count: number; stat: string; value: number | string };
const _setMods = import.meta.glob<{ id: string; bonuses?: SetBonus[] }>(
  "../../content/sets/*.json", { eager: true, import: "default" },
);
const setBonusMap = new Map<string, SetBonus[]>();
for (const m of Object.values(_setMods)) {
  if (m?.id && m.bonuses) setBonusMap.set(m.id, m.bonuses);
}

type ConsEffect = { stat?: string; value?: number; description?: string };
const _consMods = import.meta.glob<{ id: string; name?: string; effects?: ConsEffect[]; description?: string }>(
  "../../content/consumables/*.json", { eager: true, import: "default" },
);
const consumableTipMap = new Map<string, string>();
for (const m of Object.values(_consMods)) {
  if (!m?.id) continue;
  const lines: string[] = [];
  if (m.description) lines.push(m.description);
  if (m.effects) for (const e of m.effects) {
    if (e.description) lines.push(e.description);
    else if (e.stat)   lines.push(`${e.stat}  +${e.value}`);
  }
  if (lines.length) consumableTipMap.set(m.id, lines.join("\n"));
}

// Turn an id like `drain-health-poison-ix` into `Drain Health Poison IX`.
function prettyId(id: string): string {
  return id
    .split("-")
    .map((w) => /^[ivx]+$/i.test(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ── Small shared style helpers ────────────────────────────────────────────────

const monoLabel: React.CSSProperties = {
  fontFamily: F.mono, fontSize: 9, letterSpacing: "0.28em",
  color: T.inkFaint, textTransform: "uppercase",
};

function Section({ title, count, children }: { title: string; count?: string; children: ReactNode }) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <Diamond size={6} />
        <h2 style={{
          margin: 0,
          fontFamily: F.cinzel, fontWeight: 600, fontSize: 13,
          letterSpacing: "0.32em", color: T.accentSoft, textTransform: "uppercase",
        }}>{title}</h2>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${T.accent}, transparent)` }} />
        {count && <div style={monoLabel}>{count}</div>}
      </div>
      {children}
    </section>
  );
}

// ── Tooltip helpers ───────────────────────────────────────────────────────────

function useTip() {
  const [show, setShow] = useState(false);
  const bind = {
    onMouseEnter: () => setShow(true),
    onMouseLeave: () => setShow(false),
  };
  return { show, bind };
}

function TipBox({ children, width = 220, alignLeft = false }: {
  children: React.ReactNode; width?: number; alignLeft?: boolean;
}) {
  return (
    <div style={{
      position: "absolute",
      bottom: "calc(100% + 8px)",
      ...(alignLeft ? { left: 0 } : { left: "50%", transform: "translateX(-50%)" }),
      zIndex: 200,
      width,
      padding: "8px 12px",
      background: "rgba(8,4,18,0.97)",
      border: `1px solid ${T.accent}55`,
      fontFamily: F.mono,
      fontSize: 11,
      letterSpacing: "0.06em",
      color: T.inkDim,
      lineHeight: 1.55,
      pointerEvents: "none",
      whiteSpace: "pre-wrap",
      boxShadow: "0 4px 24px rgba(139,92,246,0.22)",
    }}>{children}</div>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────

function Chip({ label, value }: { label: string; value: string }) {
  const empty = !value || value === "—";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <div style={monoLabel}>{label}</div>
      <div style={{
        height: 28, padding: "0 12px",
        display: "inline-flex", alignItems: "center",
        border: `1px solid ${T.edge}`,
        background: "rgba(139,92,246,0.08)",
        fontFamily: F.display, fontSize: 13,
        color: empty ? T.inkFaint : T.inkDim,
      }}>{empty ? "—" : value}</div>
    </div>
  );
}

function Header({ meta, rawParam }: { meta: BuildMeta; rawParam: string }) {
  const subLines = meta.subclasses
    .map((id) => (id ? lineMap.get(id)?.name ?? id : null))
    .filter(Boolean) as string[];

  return (
    <header style={{
      display: "flex", flexDirection: "column", gap: 16,
      paddingBottom: 22, borderBottom: `1px solid ${T.edge}`,
    }}>
      {/* Title row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <h1 style={{
            margin: 0,
            fontFamily: F.cinzel, fontWeight: 700, fontSize: 30,
            letterSpacing: "0.04em", color: T.ink, lineHeight: 1.1,
          }}>
            {meta.name || "Untitled Build"}
          </h1>
          <div style={{
            marginTop: 6,
            fontFamily: F.mono, fontSize: 10, letterSpacing: "0.2em",
            color: T.inkMute, textTransform: "uppercase",
          }}>
            {[
              meta.author && `by ${meta.author}`,
              meta.patch,
              MODE_LABEL[meta.mode],
              meta.difficulty,
            ].filter(Boolean).join("  ·  ")}
          </div>
        </div>
        <a
          href={`/build-editor?b=${rawParam}`}
          style={{
            height: 36, padding: "0 18px",
            display: "inline-flex", alignItems: "center", gap: 8,
            border: `1px solid ${T.accent}`,
            background: "rgba(139,92,246,0.18)",
            color: T.accentSoft, textDecoration: "none",
            fontFamily: F.mono, fontSize: 11, letterSpacing: "0.2em",
            textTransform: "uppercase", whiteSpace: "nowrap",
          }}
        >Open in editor →</a>
      </div>

      {/* Chips */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Chip label="Class"  value={CLASS_LABEL[meta.classId] ?? meta.classId} />
        <Chip label="Race"   value={raceMap.get(meta.race) ?? meta.race} />
        <Chip label="Mundus" value={mundusMap.get(meta.mundus) ?? meta.mundus} />
        {subLines.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <div style={monoLabel}>Skill Lines</div>
            <div style={{
              height: 28, padding: "0 12px",
              display: "inline-flex", alignItems: "center",
              border: `1px solid ${T.accentSoft}44`,
              background: "rgba(139,92,246,0.10)",
              fontFamily: F.display, fontSize: 13, color: T.accentSoft,
            }}>{subLines.join("  /  ")}</div>
          </div>
        )}
      </div>

      {/* Summary */}
      {meta.summary && (
        <p style={{
          margin: 0, maxWidth: 680,
          fontFamily: F.display, fontStyle: "italic", fontSize: 15,
          lineHeight: 1.6, color: T.inkDim,
        }}>{meta.summary}</p>
      )}
    </header>
  );
}

// ── Equipment ─────────────────────────────────────────────────────────────────

const WEIGHT_COLOR: Record<string, string> = { heavy: T.heavy, medium: T.medium, light: T.light };

function GearRow({ slot, set, trait, enchant, weight }: {
  slot: string; set?: string; trait?: string; enchant?: string; weight?: string;
}) {
  const setName     = set ? getSet(set)?.name ?? prettyId(set) : null;
  const traitName   = trait ? getTrait(trait)?.name ?? prettyId(trait) : null;
  const enchantName = enchant ? getEnchant(enchant)?.name ?? prettyId(enchant) : null;
  const sub         = [traitName, enchantName].filter(Boolean).join("  ·  ");
  const localBonuses = set ? setBonusMap.get(set) : undefined;

  const [show,    setShow]    = useState(false);
  const [tipData, setTipData] = useState<SetTipState>(null);

  const handleMouseEnter = () => {
    if (!set) return;
    setShow(true);
    if (esoHubSetCache.has(set)) { setTipData(esoHubSetCache.get(set) as SetTipState ?? null); return; }
    fetchSetTip(set).then((d) => {
      const state: SetTipState = d ?? "local";
      setTipData(state);
    });
  };

  // Render the tooltip content
  const renderTip = () => {
    if (!show || !set) return null;
    if (tipData === null) return null;

    const tipStyle: React.CSSProperties = {
      position: "absolute", bottom: "calc(100% + 8px)", left: 0,
      zIndex: 200, width: 320,
      background: "linear-gradient(160deg, #160830 0%, #0e0520 100%)",
      border: "1px solid rgba(139,92,246,0.55)",
      boxShadow: "0 0 24px rgba(139,92,246,0.2), 0 4px 16px rgba(0,0,0,0.6)",
      padding: "12px 14px",
      pointerEvents: "none",
    };

    // ── ESO-Hub data ──────────────────────────────────────────────────────
    if (tipData !== "local") {
      const bonusRows = setTipBonuses(tipData);
      return (
        <div style={tipStyle}>
          <div style={{ marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid rgba(139,92,246,0.25)" }}>
            <div style={{ fontFamily: F.cinzel, fontWeight: 700, fontSize: 15, color: "#d4a44a" }}>{tipData.name}</div>
            <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: "0.14em", color: T.accentSoft, textTransform: "uppercase", marginTop: 2 }}>{tipData.category}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {bonusRows.map(({ count, html }) => (
              <div key={count} style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                <span style={{ fontFamily: F.mono, fontSize: 10, color: T.accentSoft, minWidth: 28, flexShrink: 0 }}>{count}pc</span>
                <span className="eso-tip-body" style={{ fontFamily: F.display, fontSize: 13, color: "#cfc0e8", lineHeight: 1.4 }}
                  dangerouslySetInnerHTML={{ __html: html }} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, textAlign: "right", fontFamily: F.mono, fontSize: 9, letterSpacing: "0.1em", color: "rgba(139,92,246,0.4)" }}>
            Tooltips by ESO-Hub
          </div>
        </div>
      );
    }

    // ── Local fallback ────────────────────────────────────────────────────
    if (!localBonuses) return null;
    return (
      <div style={tipStyle}>
        <div style={{ fontFamily: F.cinzel, fontWeight: 700, fontSize: 15, color: "#d4a44a", marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid rgba(139,92,246,0.25)" }}>
          {setName}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {localBonuses.map((b, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
              <span style={{ fontFamily: F.mono, fontSize: 10, color: T.accentSoft, minWidth: 28, flexShrink: 0 }}>{b.count}pc</span>
              <span style={{ fontFamily: F.display, fontSize: 13, color: "#cfc0e8", lineHeight: 1.4 }}>
                {b.stat}{b.value !== "" ? `  +${b.value}` : ""}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        position: "relative",
        display: "flex", alignItems: "baseline", gap: 12,
        padding: "8px 10px",
        background: "rgba(10,6,18,0.35)",
        borderBottom: `1px solid rgba(205,180,255,0.06)`,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setShow(false)}
    >
      <div style={{
        width: 92, flexShrink: 0,
        fontFamily: F.mono, fontSize: 10, letterSpacing: "0.16em",
        color: T.inkMute, textTransform: "uppercase",
      }}>{slot}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: F.display, fontSize: 15,
          color: setName ? T.ink : T.inkFaint,
          fontStyle: setName ? "normal" : "italic",
        }}>{setName ?? "— empty —"}</div>
        {sub && (
          <div style={{
            marginTop: 2,
            fontFamily: F.mono, fontSize: 10, letterSpacing: "0.06em",
            color: T.inkMute,
          }}>{sub}</div>
        )}
      </div>
      {weight && (
        <div style={{
          flexShrink: 0,
          fontFamily: F.mono, fontSize: 10, fontWeight: 600,
          letterSpacing: "0.12em", textTransform: "uppercase",
          color: WEIGHT_COLOR[weight] ?? T.inkMute,
        }}>{weight}</div>
      )}
      {renderTip()}
    </div>
  );
}

const ARMOR_LABELS: Record<ArmorPiece["slot"], string> = {
  head: "Head", chest: "Chest", shoulders: "Shoulders",
  hands: "Hands", waist: "Waist", legs: "Legs", feet: "Feet",
};
const JEWEL_LABELS: Record<JewelryPiece["slot"], string> = {
  necklace: "Necklace", ring1: "Ring 1", ring2: "Ring 2",
};
const WEAPON_LABELS: Record<WeaponPiece["slot"], string> = {
  bar1_main: "Bar I · Main", bar1_off: "Bar I · Off",
  bar2_main: "Bar II · Main", bar2_off: "Bar II · Off",
};

function Equipment({ setup }: { setup: Setup }) {
  return (
    <Section title="Equipment" count="armor · jewelry · weapons">
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div>
          <div style={{ ...monoLabel, marginBottom: 4 }}>Armor</div>
          {setup.armor.map((p) => (
            <GearRow key={p.slot} slot={ARMOR_LABELS[p.slot]}
              set={p.set} trait={p.trait} enchant={p.enchant} weight={p.weight} />
          ))}
        </div>
        <div>
          <div style={{ ...monoLabel, marginBottom: 4 }}>Jewelry</div>
          {setup.jewelry.map((p) => (
            <GearRow key={p.slot} slot={JEWEL_LABELS[p.slot]}
              set={p.set} trait={p.trait} enchant={p.enchant} />
          ))}
        </div>
        <div>
          <div style={{ ...monoLabel, marginBottom: 4 }}>Weapons</div>
          {setup.weapons.map((p) => (
            <GearRow key={p.slot} slot={WEAPON_LABELS[p.slot]}
              set={p.set} trait={p.trait} enchant={p.enchant} />
          ))}
        </div>
      </div>
    </Section>
  );
}

// ── Skills ────────────────────────────────────────────────────────────────────

function SkillIcon({ id, ult, scribing = [] }: { id: string; ult?: boolean; scribing?: ScribingSlot[] }) {
  // Scribing reference — @scr:N
  const scrIdx   = id.startsWith("@scr:") ? parseInt(id.slice(5), 10) : -1;
  const scrSlot  = scrIdx >= 0 ? (scribing[scrIdx] ?? null) : null;
  const grimoire = scrSlot?.grimoire ? GRIMOIRE_MAP.get(scrSlot.grimoire) : null;

  const skill   = scrIdx < 0 ? (id ? skillMap.get(id) : undefined) : undefined;
  const slotted = !!id;
  const isScribe = scrIdx >= 0;

  const [show,       setShow]       = useState(false);
  const [tipData,    setTipData]    = useState<EsoHubSkillTip | "loading" | null>(null);
  const [iconFailed, setIconFailed] = useState(false);

  const handleMouseEnter = () => {
    if (!id || isScribe) return;  // no ESO-Hub tip for scribing
    setShow(true);
    if (esoHubSkillCache.has(id)) { setTipData(esoHubSkillCache.get(id) ?? null); return; }
    setTipData("loading");
    fetchSkillTip(id).then(setTipData);
  };

  const displayIcon = isScribe ? (grimoire?.icon ?? null) : (skill?.icon ?? null);
  const displayName = isScribe
    ? (grimoire?.name ?? `Scribe ${scrIdx + 1}`)
    : (skill?.name ?? (ult ? "Ult." : "—"));

  return (
    <div
      style={{ position: "relative", display: "flex", flexDirection: "column", gap: 6, alignItems: "center", width: 86 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setShow(false)}
    >
      {/* Icon circle */}
      <div style={{
        width: 58, height: 58, borderRadius: "50%",
        border: `2px solid ${
          !slotted ? T.edgeStrong :
          isScribe ? "#d4a44a" :
          ult      ? T.accentSoft : T.accent
        }`,
        background: !slotted
          ? "linear-gradient(135deg, #1a0e3d 0%, #0e0626 100%)"
          : isScribe
            ? "linear-gradient(135deg, #3d2a0a 0%, #1a1006 100%)"
            : "linear-gradient(135deg, #321a73 0%, #150a30 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden",
      }}>
        {displayIcon && !iconFailed ? (
          <img src={displayIcon} alt={displayName}
            style={{ width: 58, height: 58, borderRadius: "50%" }}
            onError={() => setIconFailed(true)} />
        ) : (
          <span style={{
            fontFamily: F.cinzel, fontSize: isScribe ? 16 : 20,
            color: slotted ? (isScribe ? "#d4a44a" : T.accentSoft) : T.edgeStrong,
          }}>{isScribe ? "✦" : "◇"}</span>
        )}
      </div>

      {/* Name label */}
      <div style={{
        fontFamily: F.mono, fontSize: 9, letterSpacing: "0.14em",
        color: isScribe ? "#d4a44a" : ult ? T.accentSoft : T.inkMute,
        textTransform: "uppercase",
        textAlign: "center", lineHeight: 1.3,
      }}>{displayName}</div>

      {/* ESO-Hub tooltip (regular skills only) */}
      {show && tipData === "loading" && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)",
          zIndex: 200, width: 200, padding: "10px 12px",
          background: "#0e0619", border: `1px solid ${T.accent}55`,
          fontFamily: F.mono, fontSize: 11, color: T.inkMute, letterSpacing: "0.1em",
          textAlign: "center",
        }}>Loading…</div>
      )}

      {show && tipData && tipData !== "loading" && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)",
          zIndex: 200, width: 300,
          background: "linear-gradient(160deg, #160830 0%, #0e0520 100%)",
          border: "1px solid rgba(139,92,246,0.55)",
          boxShadow: "0 0 24px rgba(139,92,246,0.2), 0 4px 16px rgba(0,0,0,0.6)",
          padding: "12px 14px",
          pointerEvents: "none",
        }}>
          <div style={{ marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid rgba(139,92,246,0.25)" }}>
            <div style={{ fontFamily: F.cinzel, fontWeight: 700, fontSize: 15, color: "#d4a44a", lineHeight: 1.2 }}>
              {tipData.name}
            </div>
          </div>
          <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: "0.22em", color: "#d4a44a", textTransform: "uppercase", marginBottom: 6 }}>
            {tipData.header ?? "Effect"}
          </div>
          <div
            className="eso-tip-body"
            style={{ fontFamily: F.display, fontSize: 13, color: "#cfc0e8", lineHeight: 1.55 }}
            dangerouslySetInnerHTML={{ __html: tipData.effect_1 }}
          />
          {tipData.effect_2 && (
            <>
              <div style={{ margin: "10px 0 6px", height: 1, background: "rgba(139,92,246,0.25)" }} />
              <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: "0.22em", color: "#65d6ad", textTransform: "uppercase", marginBottom: 6 }}>
                New effect
              </div>
              <div
                className="eso-tip-body"
                style={{ fontFamily: F.display, fontSize: 13, color: "#cfc0e8", lineHeight: 1.55 }}
                dangerouslySetInnerHTML={{ __html: tipData.effect_2 }}
              />
            </>
          )}
          <div style={{ marginTop: 10, textAlign: "right", fontFamily: F.mono, fontSize: 9, letterSpacing: "0.1em", color: "rgba(139,92,246,0.4)" }}>
            Tooltips by ESO-Hub
          </div>
        </div>
      )}
    </div>
  );
}

function SkillBarView({ title, ids, scribing }: { title: string; ids: string[]; scribing: ScribingSlot[] }) {
  return (
    <div>
      <div style={{ ...monoLabel, marginBottom: 8 }}>{title}</div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {[0, 1, 2, 3, 4].map((i) => <SkillIcon key={i} id={ids[i] ?? ""} scribing={scribing} />)}
        <SkillIcon id={ids[5] ?? ""} ult scribing={scribing} />
      </div>
    </div>
  );
}

function Skills({ setup }: { setup: Setup }) {
  const scribing = setup.scribing ?? [];
  return (
    <Section title="Skills" count="bar 1 · bar 2">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <SkillBarView title="Bar I · Front Bar" ids={setup.bar1} scribing={scribing} />
        <SkillBarView title="Bar II · Back Bar" ids={setup.bar2} scribing={scribing} />
      </div>
    </Section>
  );
}

// ── Scribing ──────────────────────────────────────────────────────────────────

function ScribingSlotCard({ slot, idx }: { slot: ScribingSlot; idx: number }) {
  const grimoire  = slot.grimoire  ? GRIMOIRE_MAP.get(slot.grimoire)   : undefined;
  const focus     = slot.focus     ? FOCUS_MAP.get(slot.focus)         : undefined;
  const signature = slot.signature ? SIGNATURE_MAP.get(slot.signature) : undefined;
  const affix     = slot.affix     ? AFFIX_MAP.get(slot.affix)         : undefined;

  if (!grimoire) return null;

  const runes = [
    focus     ? focus.name                          : null,
    signature ? signature.hint                      : null,
    affix     ? affix.hint                          : null,
  ].filter(Boolean);

  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 12,
      padding: "10px 14px",
      background: "rgba(212,164,74,0.05)",
      border: "1px solid rgba(212,164,74,0.2)",
    }}>
      {/* Grimoire icon */}
      <div style={{
        width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
        border: "1px solid rgba(212,164,74,0.4)",
        overflow: "hidden",
        background: "linear-gradient(135deg, #3d2a0a 0%, #1a1006 100%)",
      }}>
        {grimoire.icon ? (
          <img src={grimoire.icon} alt={grimoire.name}
            style={{ width: 48, height: 48 }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
        ) : (
          <div style={{ width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: F.cinzel, fontSize: 18, color: "#d4a44a" }}>✦</div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <div style={{ fontFamily: F.cinzel, fontWeight: 600, fontSize: 15, color: "#d4a44a" }}>
            {grimoire.name}
          </div>
          <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: "0.2em", color: T.inkFaint, textTransform: "uppercase" }}>
            {grimoire.skill_line}
          </div>
        </div>
        {runes.length > 0 && (
          <div style={{
            marginTop: 4,
            fontFamily: F.mono, fontSize: 10, letterSpacing: "0.1em",
            color: "rgba(212,164,74,0.6)", lineHeight: 1.6,
          }}>
            {runes.join("  ·  ")}
          </div>
        )}
      </div>

      {/* Slot number */}
      <div style={{
        fontFamily: F.mono, fontSize: 9, letterSpacing: "0.2em",
        color: T.inkFaint, flexShrink: 0,
      }}>#{idx + 1}</div>
    </div>
  );
}

function Scribing({ setup }: { setup: Setup }) {
  const slots = (setup.scribing ?? []).filter((s) => s.grimoire);
  if (slots.length === 0) return null;

  return (
    <Section title="Scribing" count={`${slots.length} skill${slots.length > 1 ? "s" : ""}`}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {(setup.scribing ?? []).map((slot, i) =>
          slot.grimoire ? <ScribingSlotCard key={i} slot={slot} idx={i} /> : null
        )}
      </div>
    </Section>
  );
}

// ── Passives ──────────────────────────────────────────────────────────────────

function PassiveChip({ id }: { id: string }) {
  const name = masteryMap.get(id) ?? skillMap.get(id)?.name ?? prettyId(id);
  const [show,    setShow]    = useState(false);
  const [tipData, setTipData] = useState<EsoHubSkillTip | "loading" | null>(null);

  const handleMouseEnter = () => {
    setShow(true);
    if (esoHubSkillCache.has(id)) { setTipData(esoHubSkillCache.get(id) ?? null); return; }
    setTipData("loading");
    fetchSkillTip(id).then(setTipData);
  };

  return (
    <div
      style={{ position: "relative", display: "inline-block" }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setShow(false)}
    >
      <span style={{
        display: "inline-block",
        padding: "5px 10px",
        border: `1px solid ${show ? T.accentSoft + "88" : T.edge}`,
        background: show ? "rgba(139,92,246,0.14)" : "rgba(139,92,246,0.07)",
        fontFamily: F.display, fontSize: 13, color: T.inkDim,
        cursor: "default",
        transition: "background 0.12s, border-color 0.12s",
      }}>{name}</span>

      {/* Loading state */}
      {show && tipData === "loading" && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)",
          zIndex: 200, width: 200, padding: "10px 12px",
          background: "#0e0619", border: `1px solid ${T.accent}55`,
          fontFamily: F.mono, fontSize: 11, color: T.inkMute, letterSpacing: "0.1em",
          textAlign: "center", pointerEvents: "none",
        }}>Loading…</div>
      )}

      {/* ESO-Hub tooltip */}
      {show && tipData && tipData !== "loading" && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)",
          zIndex: 200, width: 300,
          background: "linear-gradient(160deg, #160830 0%, #0e0520 100%)",
          border: "1px solid rgba(139,92,246,0.55)",
          boxShadow: "0 0 24px rgba(139,92,246,0.2), 0 4px 16px rgba(0,0,0,0.6)",
          padding: "12px 14px",
          pointerEvents: "none",
        }}>
          <div style={{ marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid rgba(139,92,246,0.25)" }}>
            <div style={{ fontFamily: F.cinzel, fontWeight: 700, fontSize: 15, color: "#d4a44a", lineHeight: 1.2 }}>
              {tipData.name}
            </div>
          </div>
          <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: "0.22em", color: "#d4a44a", textTransform: "uppercase", marginBottom: 6 }}>
            {tipData.header ?? "Passive"}
          </div>
          <div
            className="eso-tip-body"
            style={{ fontFamily: F.display, fontSize: 13, color: "#cfc0e8", lineHeight: 1.55 }}
            dangerouslySetInnerHTML={{ __html: tipData.effect_1 }}
          />
          {tipData.effect_2 && (
            <>
              <div style={{ margin: "10px 0 6px", height: 1, background: "rgba(139,92,246,0.25)" }} />
              <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: "0.22em", color: "#65d6ad", textTransform: "uppercase", marginBottom: 6 }}>
                New effect
              </div>
              <div
                className="eso-tip-body"
                style={{ fontFamily: F.display, fontSize: 13, color: "#cfc0e8", lineHeight: 1.55 }}
                dangerouslySetInnerHTML={{ __html: tipData.effect_2 }}
              />
            </>
          )}
          <div style={{ marginTop: 10, textAlign: "right", fontFamily: F.mono, fontSize: 9, letterSpacing: "0.1em", color: "rgba(139,92,246,0.4)" }}>
            Tooltips by ESO-Hub
          </div>
        </div>
      )}
    </div>
  );
}

function Passives({ setup }: { setup: Setup }) {
  const ids = Object.keys(setup.passives).filter((k) => setup.passives[k]);
  if (ids.length === 0) return null;

  return (
    <Section title="Passives & Masteries" count={`${ids.length} selected`}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {ids.map((id) => <PassiveChip key={id} id={id} />)}
      </div>
    </Section>
  );
}

// ── Champion Points ───────────────────────────────────────────────────────────

function CpStarRow({ id, pts, tree, tint }: {
  id: string; pts: number; tree: "warfare" | "fitness"; tint: string;
}) {
  const key    = `${tree}:${id}`;
  const effect = cpEffectMap.get(key);
  const { show, bind } = useTip();
  return (
    <div
      style={{ position: "relative", display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", background: "rgba(10,6,18,0.35)" }}
      {...(effect ? bind : {})}
    >
      <span style={{ color: tint, fontFamily: F.cinzel, fontSize: 13 }}>★</span>
      <span style={{ flex: 1, fontFamily: F.display, fontSize: 14, color: T.ink }}>
        {cpNameMap.get(key) ?? prettyId(id)}
      </span>
      <span style={{ fontFamily: F.cinzel, fontWeight: 600, fontSize: 14, color: tint }}>{pts}</span>
      {show && effect && <TipBox width={260}>{effect}</TipBox>}
    </div>
  );
}

function CpColumn({ title, tint, tree, stars }: {
  title: string; tint: string; tree: "warfare" | "fitness"; stars: Array<[string, number]>;
}) {
  const spent = stars.reduce((a, [, v]) => a + v, 0);
  return (
    <div style={{ flex: 1, minWidth: 220 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
        <span style={{ width: 6, height: 6, transform: "rotate(45deg)", background: tint, display: "inline-block" }} />
        <div style={{
          fontFamily: F.cinzel, fontWeight: 600, fontSize: 12, letterSpacing: "0.28em",
          color: tint, textTransform: "uppercase",
        }}>{title}</div>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${tint}66, transparent)` }} />
        <div style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: "0.18em", color: tint }}>{spent} pts</div>
      </div>
      {stars.length === 0 ? (
        <div style={{ fontFamily: F.mono, fontSize: 11, color: T.inkFaint, fontStyle: "italic" }}>— none —</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {stars.map(([id, pts], i) => (
            <CpStarRow key={i} id={id} pts={pts} tree={tree} tint={tint} />
          ))}
        </div>
      )}
    </div>
  );
}

function ChampionPoints({ setup }: { setup: Setup }) {
  const { warfare, fitness } = setup.cp;
  if (warfare.length === 0 && fitness.length === 0) return null;
  return (
    <Section title="Champion Points" count="slottable stars">
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <CpColumn title="Warfare" tint={T.light} tree="warfare" stars={warfare} />
        <CpColumn title="Fitness" tint={T.heavy} tree="fitness" stars={fitness} />
      </div>
    </Section>
  );
}

// ── Attributes ────────────────────────────────────────────────────────────────

function Attributes({ setup }: { setup: Setup }) {
  const { health, magicka, stamina } = setup.attributes;
  if (health + magicka + stamina === 0) return null;
  const items: Array<[string, number, string]> = [
    ["Health",  health,  "#ef6f6f"],
    ["Magicka", magicka, "#6f9bef"],
    ["Stamina", stamina, "#7fce8f"],
  ];
  return (
    <Section title="Attributes" count={`${health + magicka + stamina} / 64 pts`}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {items.map(([label, val, color]) => (
          <div key={label} style={{
            flex: 1, minWidth: 130,
            padding: "12px 16px",
            border: `1px solid ${T.edge}`,
            background: "rgba(10,6,18,0.4)",
          }}>
            <div style={monoLabel}>{label}</div>
            <div style={{
              marginTop: 4,
              fontFamily: F.cinzel, fontWeight: 700, fontSize: 26,
              color: val > 0 ? color : T.edgeStrong,
            }}>{val}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ── Consumables ───────────────────────────────────────────────────────────────

function ConsCard({ label, value, tip }: { label: string; value: string; tip?: string }) {
  const { show, bind } = useTip();
  return (
    <div
      style={{ flex: 1, minWidth: 160, position: "relative", padding: "10px 14px", border: `1px solid ${T.edge}`, background: "rgba(10,6,18,0.4)" }}
      {...(tip ? bind : {})}
    >
      <div style={monoLabel}>{label}</div>
      <div style={{ marginTop: 4, fontFamily: F.display, fontSize: 14, color: T.ink }}>{value}</div>
      {show && tip && <TipBox width={280} alignLeft>{tip}</TipBox>}
    </div>
  );
}

function Consumables({ meta, setup }: { meta: BuildMeta; setup: Setup }) {
  const c      = setup.consumables;
  const mundus = meta.mundus;  // mundus is stored on BuildMeta (General tab)
  if (!mundus && !c.food && !c.potion && !c.poison) return null;

  return (
    <Section title="Consumables" count="mundus · food · potion">
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {mundus && (
          <ConsCard label="Mundus" value={mundusMap.get(mundus) ?? prettyId(mundus)} />
        )}
        {c.food && (
          <ConsCard label="Food / Drink" value={prettyId(c.food)} tip={consumableTipMap.get(c.food)} />
        )}
        {c.potion && (
          <ConsCard label="Potion" value={prettyId(c.potion)} tip={consumableTipMap.get(c.potion)} />
        )}
        {c.poison && (
          <ConsCard label="Poison" value={prettyId(c.poison)} tip={consumableTipMap.get(c.poison)} />
        )}
      </div>
    </Section>
  );
}

// ── Guide & Pros/Cons ─────────────────────────────────────────────────────────

function Guide({ text }: { text: string }) {
  if (!text.trim()) return null;
  return (
    <Section title="Guide" count="rotation & tips">
      <p style={{
        margin: 0, whiteSpace: "pre-wrap",
        fontFamily: F.display, fontSize: 15, lineHeight: 1.7, color: T.inkDim,
      }}>{text}</p>
    </Section>
  );
}

function ProsCons({ pros, cons }: { pros: string[]; cons: string[] }) {
  const p = pros.filter((x) => x.trim());
  const c = cons.filter((x) => x.trim());
  if (p.length === 0 && c.length === 0) return null;

  const List = ({ items, color, sign }: { items: string[]; color: string; sign: string }) => (
    <div style={{ flex: 1, minWidth: 220 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {items.map((x, i) => (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
            <span style={{ color, fontFamily: F.mono, fontSize: 13, flexShrink: 0 }}>{sign}</span>
            <span style={{ fontFamily: F.display, fontSize: 14, color: T.inkDim }}>{x}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Section title="Pros & Cons" count="strengths & weaknesses">
      <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
        {p.length > 0 && <List items={p} color="#7fce8f" sign="+" />}
        {c.length > 0 && <List items={c} color="#ef6f6f" sign="−" />}
      </div>
    </Section>
  );
}

// ── Computed Stats ────────────────────────────────────────────────────────────

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "baseline",
      padding: "5px 0",
      borderBottom: "1px solid rgba(205,180,255,0.06)",
    }}>
      <span style={{
        fontFamily: F.mono, fontSize: 9, letterSpacing: "0.2em",
        color: T.inkMute, textTransform: "uppercase",
      }}>{label}</span>
      <span style={{
        fontFamily: F.cinzel, fontWeight: 600, fontSize: 14, color: T.ink,
      }}>{value}</span>
    </div>
  );
}

function ComputedStatsSection({ meta, setup, battleSpirit, onToggleBS }: {
  meta: BuildMeta; setup: Setup; battleSpirit: boolean; onToggleBS: () => void;
}) {
  const { stats } = computeStatsFromEditor(meta, setup, battleSpirit);

  const vitals = [
    { label: "Max Health",  val: stats.maxHealth,  color: "#ef6f6f" },
    { label: "Max Magicka", val: stats.maxMagicka, color: "#6f9bef" },
    { label: "Max Stamina", val: stats.maxStamina, color: "#7fce8f" },
  ];

  return (
    <Section title="Computed Stats" count="estimated totals">

      {/* Battle Spirit toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          type="button"
          onClick={onToggleBS}
          style={{
            height: 26, padding: "0 12px",
            display: "inline-flex", alignItems: "center",
            border: `1px solid ${battleSpirit ? T.accent : T.edge}`,
            background: battleSpirit ? "rgba(139,92,246,0.18)" : "transparent",
            color: battleSpirit ? T.accentSoft : T.inkMute,
            fontFamily: F.mono, fontSize: 9, letterSpacing: "0.2em",
            textTransform: "uppercase", cursor: "pointer",
            transition: "border-color 0.15s, background 0.15s, color 0.15s",
          }}
        >
          Battle Spirit {battleSpirit ? "ON" : "OFF"}
        </button>
        <span style={{
          fontFamily: F.mono, fontSize: 9, letterSpacing: "0.1em", color: T.inkFaint,
        }}>
          {battleSpirit ? "×0.5 to resistances" : "raw stats · no modifier"}
        </span>
      </div>

      {/* Vitals */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {vitals.map(({ label, val, color }) => (
          <div key={label} style={{
            flex: 1, minWidth: 130,
            padding: "12px 16px",
            border: `1px solid ${color}44`,
            background: `${color}0a`,
          }}>
            <div style={{ ...monoLabel, color: `${color}99` }}>{label}</div>
            <div style={{
              marginTop: 6,
              fontFamily: F.cinzel, fontWeight: 700, fontSize: 26,
              color,
            }}>{val.toLocaleString("en-US")}</div>
          </div>
        ))}
      </div>

      {/* Offense / Defense / Recovery columns */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>

        {/* Offense */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ ...monoLabel, marginBottom: 8 }}>Offense</div>
          <StatRow label="Weapon Damage" value={stats.weaponDmg.toLocaleString("en-US")} />
          <StatRow label="Spell Damage"  value={stats.spellDmg.toLocaleString("en-US")} />
          <StatRow label="Crit Chance"   value={`${critPercent(stats.critRating)}%`} />
          <StatRow label="Crit Damage"   value={`${stats.critDamage}%`} />
          <StatRow label="Phys Pen"      value={stats.physPen.toLocaleString("en-US")} />
          <StatRow label="Spell Pen"     value={stats.spellPen.toLocaleString("en-US")} />
        </div>

        {/* Defense */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ ...monoLabel, marginBottom: 8 }}>Defense</div>
          <StatRow
            label="Phys Resist"
            value={`${stats.physResist.toLocaleString("en-US")}  (${resistPercent(stats.physResist)}%)`}
          />
          <StatRow
            label="Spell Resist"
            value={`${stats.spellResist.toLocaleString("en-US")}  (${resistPercent(stats.spellResist)}%)`}
          />
          <StatRow label="Crit Resist" value={stats.critResistance.toLocaleString("en-US")} />
        </div>

        {/* Recovery */}
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ ...monoLabel, marginBottom: 8 }}>Recovery</div>
          <StatRow label="Health Rec"  value={stats.healthRecovery.toLocaleString("en-US")} />
          <StatRow label="Magicka Rec" value={stats.magickaRecovery.toLocaleString("en-US")} />
          <StatRow label="Stamina Rec" value={stats.staminaRecovery.toLocaleString("en-US")} />
        </div>

      </div>
    </Section>
  );
}

// ── Empty / invalid state ─────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{
      minHeight: "70vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 16, padding: 40, textAlign: "center",
    }}>
      <div style={{ fontFamily: F.cinzel, fontSize: 32, color: T.edgeStrong }}>◇</div>
      <div style={{
        fontFamily: F.cinzel, fontWeight: 700, fontSize: 16,
        letterSpacing: "0.06em", color: T.inkDim,
      }}>{message}</div>
      <a href="/build-editor" style={{
        marginTop: 4, height: 36, padding: "0 18px",
        display: "inline-flex", alignItems: "center",
        border: `1px solid ${T.accent}`, background: "rgba(139,92,246,0.18)",
        color: T.accentSoft, textDecoration: "none",
        fontFamily: F.mono, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase",
      }}>Open the Build Editor →</a>
    </div>
  );
}

// ── BuildViewer ───────────────────────────────────────────────────────────────

type ViewState =
  | { kind: "loading" }
  | { kind: "empty" }
  | { kind: "invalid" }
  | { kind: "ok"; meta: BuildMeta; setup: Setup; raw: string };

export default function BuildViewer() {
  const [state, setState]       = useState<ViewState>({ kind: "loading" });
  const [battleSpirit, setBattleSpirit] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shortId = params.get("id");
    const raw     = params.get("b");

    // Short URL: ?id=xxx — fetch from KV API
    if (shortId) {
      fetch(`/api/builds/${shortId}`)
        .then((r) => { if (!r.ok) throw new Error("not_found"); return r.json(); })
        .then((snap: { v: 1; meta: BuildMeta; setups: Setup[] }) => {
          if (!snap || snap.v !== 1 || !snap.setups[0]) { setState({ kind: "invalid" }); return; }
          // Reconstruct a ?b= param so "Open in editor" works
          const encoded = encodeEditor(snap.meta, snap.setups);
          setState({ kind: "ok", meta: snap.meta, setup: snap.setups[0], raw: encoded });
        })
        .catch(() => setState({ kind: "invalid" }));
      return;
    }

    // Long URL: ?b=xxx
    if (!raw) { setState({ kind: "empty" }); return; }
    const snap = decodeEditor(raw);
    if (!snap || !snap.setups[0]) { setState({ kind: "invalid" }); return; }
    // Normalize legacy CP pts (old default was 10, correct is 50)
    const normCp = (stars: Array<[string, number]>) =>
      stars.map(([id, pts]) => [id, pts === 10 ? 50 : pts] as [string, number]);
    const setup = snap.setups[0];
    const normalizedSetup = {
      scribing: [],  // default for builds saved before scribing
      ...setup,
      cp: { warfare: normCp(setup.cp.warfare), fitness: normCp(setup.cp.fitness) },
    };
    setState({ kind: "ok", meta: snap.meta, setup: normalizedSetup, raw });
  }, []);

  const shell: React.CSSProperties = {
    background: "radial-gradient(ellipse at 50% 20%, #1d0e44 0%, var(--color-bg) 55%, #06030f 100%)",
    minHeight: "100vh",
  };

  if (state.kind === "loading") {
    return <div style={shell} />;
  }
  if (state.kind === "empty" || state.kind === "invalid") {
    return (
      <div style={shell}>
        <EmptyState message={
          state.kind === "empty"
            ? "No build to display — this page needs a share link."
            : "This share link is invalid or out of date."
        } />
      </div>
    );
  }

  const { meta, setup, raw } = state;
  return (
    <div style={shell}>
      <div style={{
        maxWidth: 880, margin: "0 auto",
        padding: "36px 24px 80px",
        display: "flex", flexDirection: "column", gap: 30,
      }}>
        <Header meta={meta} rawParam={raw} />
        <ComputedStatsSection
          meta={meta}
          setup={setup}
          battleSpirit={battleSpirit}
          onToggleBS={() => setBattleSpirit((b) => !b)}
        />
        <Attributes setup={setup} />
        <Consumables meta={meta} setup={setup} />
        <Equipment setup={setup} />
        <Skills setup={setup} />
        <Scribing setup={setup} />
        <ChampionPoints setup={setup} />
        <Passives setup={setup} />
        <ProsCons pros={meta.pros} cons={meta.cons} />
        <Guide text={meta.guide} />
      </div>
    </div>
  );
}
