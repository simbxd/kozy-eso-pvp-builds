import { useMemo, useState, useEffect, useCallback } from "react";
import * as Popover from "@radix-ui/react-popover";
import { useEditorStore } from "../state";
import { T, F, Diamond } from "../atoms";
import {
  SkillLinePicker, ALL_CLASS_LINES,
  buildGroups, getSkillGroups, type GroupDef,
} from "../atoms/SkillLinePicker";
import { SearchSelect, type SelectItem } from "../atoms/SearchSelect";
import { skillsIndex } from "@/lib/eso-data";
import {
  GRIMOIRES, FOCI, SIGNATURES, AFFIXES,
  GRIMOIRE_MAP, FOCUS_MAP, SIGNATURE_MAP, AFFIX_MAP,
} from "@/lib/scribing-defs";
import { fetchSkillTip, skillCache, type EsoHubSkillTip } from "@/lib/esohub-api";
import type { ScribingSlot } from "../state";
import type { EsoSkillIndex } from "@/types/eso";

// ── Drag state (module-level singleton — one drag at a time) ───────────────────
// dataTransfer alone can't carry rich payload reliably across React; we keep the
// drag descriptor here and use dataTransfer only for the native drag image.

type DragInfo =
  | { kind: "pool"; id: string }
  | { kind: "slot"; id: string; bar: 0 | 1; idx: number };

let drag: { info: DragInfo; consumed: boolean } | null = null;

// ── Helpers ───────────────────────────────────────────────────────────────────

const skillById = new Map(skillsIndex.map((s) => [s.id, s]));

/** Active | Ultimate for a slottable id (grimoires count as Active). */
function skillKindOf(id: string): "Active" | "Ultimate" | null {
  if (!id) return null;
  if (id.startsWith("@scr:")) return "Active";
  const s = skillById.get(id);
  if (!s) return null;
  return s.type === "Ultimate" ? "Ultimate" : "Active";
}

/** Pool skills for one line: morphs when a base has them, else the orphan base. */
function lineSkills(lineId: string, kind: "Active" | "Ultimate"): EsoSkillIndex[] {
  const out: EsoSkillIndex[] = [];
  for (const g of getSkillGroups(lineId, kind)) {
    if (g.morphs.length > 0) out.push(...g.morphs);
    else out.push(g.base);
  }
  return out;
}

// ── Scribing select items ─────────────────────────────────────────────────────

const GRIMOIRE_ITEMS  = GRIMOIRES.map((g)  => ({ id: g.id, label: g.name, sub: g.skill_line, icon: g.icon }));
const FOCUS_ITEMS     = FOCI.map((f)       => ({ id: f.id, label: f.name, sub: f.damage_type, icon: f.icon }));
const SIGNATURE_ITEMS = SIGNATURES.map((s) => ({ id: s.id, label: s.name, sub: s.hint, icon: s.icon }));
const AFFIX_ITEMS     = AFFIXES.map((a)    => ({ id: a.id, label: a.name, sub: a.hint, icon: a.icon }));

// ── Class line picker items ───────────────────────────────────────────────────

const LINE_ITEMS: SelectItem[] = ALL_CLASS_LINES.map((l) => ({ id: l.id, label: l.name, badge: l.class }));

// ── ClassLineRow — compact 3-dropdown row ─────────────────────────────────────

function ClassLineRow() {
  const subclasses = useEditorStore((s) => s.meta.subclasses);
  const patchMeta  = useEditorStore((s) => s.patchMeta);

  const setLine = (slotIdx: 0 | 1 | 2, id: string) => {
    const next = [...subclasses] as [string, string, string];
    next[slotIdx] = id;
    patchMeta({ subclasses: next });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
      <div style={{
        fontFamily: F.mono, fontSize: 10, letterSpacing: "0.28em",
        color: T.inkMute, textTransform: "uppercase",
      }}>Class Lines</div>
      <div style={{ display: "flex", gap: 10 }}>
        {([0, 1, 2] as const).map((i) => {
          const lineId    = subclasses[i];
          const taken     = new Set(subclasses.filter((id, j) => id && j !== i));
          const available = LINE_ITEMS.filter((item) => !taken.has(item.id) || item.id === lineId);
          return (
            <div key={i} style={{ flex: 1, minWidth: 0 }}>
              <SearchSelect
                value={lineId}
                onChange={(v) => setLine(i, v)}
                items={available}
                placeholder={`Line ${["I", "II", "III"][i]}`}
                searchPlaceholder="Search lines…"
                height={34}
                popoverWidth={260}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── BarSkillCell ──────────────────────────────────────────────────────────────

function BarSkillCell({
  id, bar, idx, ult, subclasses, armed, onArmConsume,
}: {
  id: string;
  bar: 0 | 1;
  idx: number;
  ult?: boolean;
  subclasses: [string, string, string];
  armed: string | null;
  onArmConsume: () => void;
}) {
  const setSkill  = useEditorStore((s) => s.setSkill);
  const scribing  = useEditorStore((s) => s.setups[s.activeSetupIdx].scribing);
  const [open, setOpen] = useState(false);
  const [over, setOver] = useState(false);

  const scrIdx   = id.startsWith("@scr:") ? parseInt(id.slice(5), 10) : -1;
  const scrSlot  = scrIdx >= 0 ? (scribing[scrIdx] ?? null) : null;
  const grimoire = scrSlot?.grimoire ? GRIMOIRE_MAP.get(scrSlot.grimoire) : null;
  const skill    = scrIdx < 0 && id ? skillById.get(id) : null;

  const kind    = ult ? "Ultimate" : "Active";
  const slotted = !!id;

  const displayIcon = scrIdx >= 0 ? (grimoire?.icon ?? null) : (skill?.icon ?? null);
  const displayName = scrIdx >= 0
    ? (grimoire ? `${grimoire.name} (Scribe)` : `Scribe ${scrIdx + 1}`)
    : (skill?.name ?? null);

  // ── Drop handling ──
  const accept = (info: DragInfo): boolean => skillKindOf(info.id) === kind;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setOver(false);
    if (!drag) return;
    const info = drag.info;
    if (!accept(info)) return;             // reject kind mismatch (active↔ult)
    drag.consumed = true;

    if (info.kind === "pool") {
      setSkill(bar, idx, info.id);
    } else if (info.kind === "slot") {
      if (info.bar === bar && info.idx === idx) return;
      // swap
      setSkill(bar, idx, info.id);
      setSkill(info.bar, info.idx, id);
    }
  };

  // ── Click — armed-fill takes priority, else open dialog ──
  const handleClick = () => {
    if (armed) {
      if (skillKindOf(armed) === kind) {
        setSkill(bar, idx, armed);
        onArmConsume();
      }
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
        <button
          type="button"
          onClick={handleClick}
          draggable={slotted}
          onDragStart={(e) => {
            if (!slotted) return;
            drag = { info: { kind: "slot", id, bar, idx }, consumed: false };
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", id);
          }}
          onDragEnd={() => {
            // Dropped on nothing → clear the source slot
            if (drag && !drag.consumed && drag.info.kind === "slot") {
              setSkill(drag.info.bar, drag.info.idx, "");
            }
            drag = null;
          }}
          onDragOver={(e) => {
            if (drag && accept(drag.info)) { e.preventDefault(); setOver(true); }
          }}
          onDragLeave={() => setOver(false)}
          onDrop={handleDrop}
          title={displayName ?? (ult ? "Set ultimate" : `Set slot ${idx + 1}`)}
          style={{
            position: "relative", width: 64, height: 64, borderRadius: "50%",
            border: `2px solid ${
              over     ? "#8b5cf6" :
              !slotted ? (ult ? "rgba(196,181,253,0.4)" : T.edgeStrong) :
              scrIdx >= 0 ? "#d4a44a" : T.accent
            }`,
            background: slotted
              ? scrIdx >= 0
                ? "linear-gradient(135deg, #3d2a0a 0%, #1a1006 100%)"
                : "linear-gradient(135deg, #321a73 0%, #150a30 100%)"
              : "linear-gradient(135deg, #1a0e3d 0%, #0e0626 100%)",
            cursor: armed ? "copy" : slotted ? "grab" : "pointer",
            padding: 0, display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden", outline: "none",
            boxShadow: over ? "0 0 0 3px rgba(139,92,246,0.3)" : "none",
            transition: "border-color 0.12s, box-shadow 0.12s",
          }}
        >
          {displayIcon ? (
            <img src={displayIcon} alt={displayName ?? ""}
              style={{ width: 64, height: 64, borderRadius: "50%", pointerEvents: "none" }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          ) : (
            <span style={{
              fontFamily: F.cinzel, fontSize: scrIdx >= 0 ? 14 : 22,
              color: slotted ? (scrIdx >= 0 ? "#d4a44a" : T.accentSoft) : T.edgeStrong,
            }}>{scrIdx >= 0 ? "✦" : ult ? "◆" : "◇"}</span>
          )}
          <div className="skill-hover-overlay" style={{
            position: "absolute", inset: 0,
            background: "rgba(139,92,246,0.15)",
            opacity: 0, transition: "opacity 0.1s", zIndex: 2, pointerEvents: "none",
          }} />
        </button>

        <div style={{
          fontFamily: F.mono, fontSize: 9, letterSpacing: "0.22em",
          color: ult ? T.accentSoft : T.inkMute, textTransform: "uppercase",
          textAlign: "center", maxWidth: 80,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {displayName ?? (ult ? "Ult." : `Slot ${idx + 1}`)}
        </div>

        {slotted ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setSkill(bar, idx, ""); }}
            style={{
              background: "transparent", border: "none", cursor: "pointer",
              fontFamily: F.mono, fontSize: 9, letterSpacing: "0.18em",
              color: T.inkFaint, textTransform: "uppercase", padding: 0, lineHeight: 1,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#ef4444"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = T.inkFaint; }}
          >clear</button>
        ) : (
          <div style={{ height: 9 }} />
        )}
      </div>

      <SkillLinePicker
        open={open}
        onClose={() => setOpen(false)}
        onSelect={(v) => setSkill(bar, idx, v)}
        kind={kind}
        subclasses={subclasses}
      />
    </>
  );
}

// ── BarRow ────────────────────────────────────────────────────────────────────

function BarRow({ title, bar, skills, subclasses, armed, onArmConsume }: {
  title: string; bar: 0 | 1;
  skills: string[]; subclasses: [string, string, string];
  armed: string | null; onArmConsume: () => void;
}) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14 }}>
        <Diamond size={6} />
        <div style={{
          fontFamily: F.cinzel, fontWeight: 600, fontSize: 14,
          letterSpacing: "0.32em", color: T.accentSoft, textTransform: "uppercase",
        }}>{title}</div>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${T.accent}66, transparent)` }} />
      </div>
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <BarSkillCell key={i} id={skills[i] ?? ""} bar={bar} idx={i}
            subclasses={subclasses} armed={armed} onArmConsume={onArmConsume} />
        ))}
        <div style={{ width: 8, flexShrink: 0 }} />
        <BarSkillCell id={skills[5] ?? ""} bar={bar} idx={5} ult
          subclasses={subclasses} armed={armed} onArmConsume={onArmConsume} />
      </div>
    </div>
  );
}

// ── PoolSkillIcon ─────────────────────────────────────────────────────────────

function PoolSkillIcon({
  skill, armed, onArm, onHover, onHoverEnd,
}: {
  skill: EsoSkillIndex;
  armed: boolean;
  onArm: () => void;
  onHover: (id: string, x: number, y: number) => void;
  onHoverEnd: () => void;
}) {
  return (
    <button
      type="button"
      draggable
      onDragStart={(e) => {
        drag = { info: { kind: "pool", id: skill.id }, consumed: false };
        e.dataTransfer.effectAllowed = "copy";
        e.dataTransfer.setData("text/plain", skill.id);
        onHoverEnd();
      }}
      onDragEnd={() => { drag = null; }}
      onClick={onArm}
      onMouseEnter={(e) => onHover(skill.id, e.clientX, e.clientY)}
      onMouseMove={(e) => onHover(skill.id, e.clientX, e.clientY)}
      onMouseLeave={onHoverEnd}
      title={skill.name}
      style={{
        width: 46, height: 46, padding: 0, flexShrink: 0,
        borderRadius: "50%",
        border: `2px solid ${armed ? "#8b5cf6" : "transparent"}`,
        background: "transparent",
        cursor: "grab",
        boxShadow: armed ? "0 0 0 2px rgba(139,92,246,0.4), 0 0 12px rgba(139,92,246,0.5)" : "none",
        transition: "transform 0.1s, border-color 0.1s, box-shadow 0.1s",
        outline: "none",
      }}
      onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.94)"; }}
      onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
    >
      {skill.icon ? (
        <img src={skill.icon} alt={skill.name}
          style={{ width: "100%", height: "100%", borderRadius: "50%", pointerEvents: "none" }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
      ) : (
        <span style={{ fontFamily: F.cinzel, fontSize: 16, color: T.accentSoft }}>◇</span>
      )}
    </button>
  );
}

// ── ScribingPoolCard — configurable slot inside the pool ───────────────────────

function ScribingPoolCard({ slot, idx, armed, onArm }: {
  slot: ScribingSlot; idx: number; armed: boolean; onArm: () => void;
}) {
  const patchSlot  = useEditorStore((s) => s.patchScribingSlot);
  const removeSlot = useEditorStore((s) => s.removeScribingSlot);
  const [cfg, setCfg] = useState(false);

  const grimoire  = slot.grimoire  ? GRIMOIRE_MAP.get(slot.grimoire)   : undefined;
  const focus     = slot.focus     ? FOCUS_MAP.get(slot.focus)         : undefined;
  const signature = slot.signature ? SIGNATURE_MAP.get(slot.signature) : undefined;
  const affix     = slot.affix     ? AFFIX_MAP.get(slot.affix)         : undefined;
  const configured = !!grimoire;

  const row = (label: string, value: string | undefined, items: SelectItem[], key: keyof ScribingSlot, searchable: boolean, pw: number) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        width: 60, flexShrink: 0, fontFamily: F.mono, fontSize: 8,
        letterSpacing: "0.2em", color: T.inkMute, textTransform: "uppercase",
      }}>{label}</div>
      <div style={{ flex: 1 }}>
        <SearchSelect
          value={value}
          onChange={(v) => patchSlot(idx, { [key]: v } as Partial<ScribingSlot>)}
          items={items}
          placeholder="— select —"
          searchable={searchable}
          searchPlaceholder={`Search ${label.toLowerCase()}…`}
          height={30}
          popoverWidth={pw}
        />
      </div>
    </div>
  );

  return (
    <Popover.Root open={cfg} onOpenChange={setCfg}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center", width: 78 }}>
        {/* Circle — drag to bar (if configured) · click arms (if configured) else opens config */}
        <button
          type="button"
          draggable={configured}
          onDragStart={(e) => {
            if (!configured) return;
            drag = { info: { kind: "pool", id: `@scr:${idx}` }, consumed: false };
            e.dataTransfer.effectAllowed = "copy";
            e.dataTransfer.setData("text/plain", `@scr:${idx}`);
          }}
          onDragEnd={() => { drag = null; }}
          onClick={() => { if (configured) onArm(); else setCfg(true); }}
          title={configured ? `${grimoire!.name} — drag to bar or click to arm` : "Configure scribing slot"}
          style={{
            position: "relative", width: 64, height: 64, borderRadius: "50%",
            border: `2px solid ${armed ? "#8b5cf6" : configured ? "#d4a44a" : "rgba(212,164,74,0.35)"}`,
            background: configured
              ? "linear-gradient(135deg, #3d2a0a 0%, #1a1006 100%)"
              : "linear-gradient(135deg, #1a1006 0%, #0d0a04 100%)",
            cursor: configured ? "grab" : "pointer",
            padding: 0, display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden", outline: "none",
            boxShadow: armed ? "0 0 0 2px rgba(139,92,246,0.4), 0 0 12px rgba(139,92,246,0.5)" : "none",
          }}
        >
          {grimoire?.icon ? (
            <img src={grimoire.icon} alt={grimoire.name}
              style={{ width: 64, height: 64, borderRadius: "50%", pointerEvents: "none" }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          ) : (
            <span style={{ fontFamily: F.cinzel, fontSize: 18, color: "rgba(212,164,74,0.45)" }}>✦</span>
          )}
        </button>

        <div style={{
          fontFamily: F.mono, fontSize: 9, letterSpacing: "0.16em",
          color: configured ? "#d4a44a" : "rgba(212,164,74,0.4)", textTransform: "uppercase",
          textAlign: "center", maxWidth: 78, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{grimoire?.name ?? `Scribe ${idx + 1}`}</div>

        <div style={{ display: "flex", gap: 8 }}>
          <Popover.Trigger asChild>
            <button type="button" style={{
              background: "transparent", border: "none", cursor: "pointer",
              fontFamily: F.mono, fontSize: 9, letterSpacing: "0.16em",
              color: "rgba(212,164,74,0.6)", textTransform: "uppercase", padding: 0, lineHeight: 1,
            }}>edit</button>
          </Popover.Trigger>
          <button type="button" onClick={() => removeSlot(idx)} style={{
            background: "transparent", border: "none", cursor: "pointer",
            fontFamily: F.mono, fontSize: 9, letterSpacing: "0.16em",
            color: T.inkFaint, textTransform: "uppercase", padding: 0, lineHeight: 1,
          }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#ef4444"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = T.inkFaint; }}
          >remove</button>
        </div>
      </div>

      <Popover.Portal>
        <Popover.Content sideOffset={10} align="center" style={{
          width: 300, zIndex: 9999, background: "#0e0b1a",
          border: "1px solid rgba(212,164,74,0.35)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.8)", padding: "14px 14px 12px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{
              fontFamily: F.mono, fontSize: 9, letterSpacing: "0.28em",
              color: "#d4a44a", textTransform: "uppercase",
            }}>Scribing · Slot {idx + 1}</span>
            <div style={{ flex: 1, height: 1, background: "rgba(212,164,74,0.2)" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {row("Grimoire",  slot.grimoire,  GRIMOIRE_ITEMS,  "grimoire",  true,  240)}
            {row("Focus",     slot.focus,     FOCUS_ITEMS,     "focus",     false, 210)}
            {row("Signature", slot.signature, SIGNATURE_ITEMS, "signature", false, 220)}
            {row("Affix",     slot.affix,     AFFIX_ITEMS,     "affix",     false, 240)}
          </div>
          {(focus || signature || affix) && (
            <div style={{
              marginTop: 10, padding: "7px 8px",
              background: "rgba(212,164,74,0.05)", border: "1px solid rgba(212,164,74,0.15)",
              fontFamily: F.mono, fontSize: 8, letterSpacing: "0.12em",
              color: "rgba(212,164,74,0.7)", lineHeight: 1.6,
            }}>
              {[focus?.damage_type ?? focus?.name, signature?.hint, affix?.hint].filter(Boolean).join(" · ")}
            </div>
          )}
          <Popover.Arrow style={{ fill: "rgba(212,164,74,0.35)" }} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

// ── ScribingPoolSection ───────────────────────────────────────────────────────

function ScribingPoolSection({ armed, onArm }: {
  armed: string | null; onArm: (id: string) => void;
}) {
  const scribing = useEditorStore((s) => s.setups[s.activeSetupIdx].scribing);
  const addSlot  = useEditorStore((s) => s.addScribingSlot);

  return (
    <div style={{ padding: "16px 4px" }}>
      <div style={{
        fontFamily: F.mono, fontSize: 9, letterSpacing: "0.18em",
        color: "rgba(212,164,74,0.7)", lineHeight: 1.6, marginBottom: 16,
      }}>
        Configure up to 3 grimoires, then drag (or click to arm) onto a bar slot.
      </div>
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
        {scribing.map((slot, i) => (
          <ScribingPoolCard
            key={i} slot={slot} idx={i}
            armed={armed === `@scr:${i}`}
            onArm={() => onArm(`@scr:${i}`)}
          />
        ))}
        {scribing.length < 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center", width: 78 }}>
            <button type="button" onClick={addSlot} title="Add scribing slot" style={{
              width: 64, height: 64, borderRadius: "50%",
              border: "2px dashed rgba(212,164,74,0.3)", background: "transparent",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              outline: "none", color: "rgba(212,164,74,0.4)", fontFamily: F.cinzel, fontSize: 24,
              transition: "border-color 0.15s, color 0.15s",
            }}
              onMouseEnter={(e) => { const el = e.currentTarget; el.style.borderColor = "rgba(212,164,74,0.7)"; el.style.color = "rgba(212,164,74,0.8)"; }}
              onMouseLeave={(e) => { const el = e.currentTarget; el.style.borderColor = "rgba(212,164,74,0.3)"; el.style.color = "rgba(212,164,74,0.4)"; }}
            >+</button>
            <div style={{
              fontFamily: F.mono, fontSize: 9, letterSpacing: "0.18em",
              color: "rgba(212,164,74,0.35)", textTransform: "uppercase",
            }}>Add</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Pool ──────────────────────────────────────────────────────────────────────

const SCRIBING_CAT = "scribing";

function Pool({ subclasses, armed, onArm }: {
  subclasses: [string, string, string];
  armed: string | null;
  onArm: (id: string) => void;
}) {
  const groups: GroupDef[] = useMemo(() => buildGroups(subclasses), [subclasses]);
  const categories = useMemo(
    () => [...groups, { id: SCRIBING_CAT, label: "Scribing", lines: [] } as GroupDef],
    [groups],
  );

  const [catId, setCatId] = useState<string>(() => groups[0]?.id ?? SCRIBING_CAT);
  const [kind, setKind]   = useState<"Active" | "Ultimate">("Active");
  const [query, setQuery] = useState("");

  const activeCat = categories.find((c) => c.id === catId) ?? categories[0];
  const q = query.trim().toLowerCase();

  // ── Hover tooltip (fetched from ESO-Hub) ──
  const [tip, setTip] = useState<{ id: string; x: number; y: number } | null>(null);
  const [tipData, setTipData] = useState<EsoHubSkillTip | "loading" | null>(null);

  const onHover = useCallback((id: string, x: number, y: number) => {
    setTip({ id, x, y });
    if (skillCache.has(id)) { setTipData(skillCache.get(id) ?? null); return; }
    setTipData("loading");
    fetchSkillTip(id).then((d) => setTipData((prev) => prev === "loading" ? d : prev));
  }, []);
  const onHoverEnd = useCallback(() => { setTip(null); setTipData(null); }, []);

  // ── Flat search across all categories ──
  const searchResults = useMemo(() => {
    if (!q) return [];
    const seen = new Set<string>();
    const out: { skill: EsoSkillIndex; lineName: string }[] = [];
    for (const g of groups) {
      for (const line of g.lines) {
        for (const s of lineSkills(line.id, kind)) {
          if (seen.has(s.id) || !s.name.toLowerCase().includes(q)) continue;
          seen.add(s.id);
          out.push({ skill: s, lineName: line.name });
        }
      }
    }
    return out.slice(0, 80);
  }, [q, groups, kind]);

  const isScribing = activeCat.id === SCRIBING_CAT && !q;

  return (
    <div style={{
      flex: 1, minHeight: 0, display: "flex", flexDirection: "column",
      border: `1px solid ${T.edge}`, background: "rgba(10,6,18,0.4)",
    }}>
      {/* Toolbar: search + kind toggle */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
        borderBottom: `1px solid ${T.edge}`, flexShrink: 0,
      }}>
        <div style={{
          flex: 1, display: "flex", alignItems: "center", gap: 8,
          height: 32, padding: "0 10px",
          border: `1px solid ${T.edgeStrong}`, background: "rgba(10,6,18,0.55)",
        }}>
          <svg width="13" height="13" viewBox="0 0 12 12" style={{ opacity: 0.4, flexShrink: 0 }}>
            <circle cx="5" cy="5" r="4" fill="none" stroke={T.inkMute} strokeWidth="1.3" />
            <line x1="8.2" y1="8.2" x2="11" y2="11" stroke={T.inkMute} strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search all skills…"
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              fontFamily: F.display, fontSize: 14, color: T.ink,
            }}
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} style={{
              background: "transparent", border: "none", cursor: "pointer",
              color: T.inkFaint, fontFamily: F.mono, fontSize: 13,
            }}>×</button>
          )}
        </div>
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          {(["Active", "Ultimate"] as const).map((k) => (
            <button key={k} type="button" onClick={() => setKind(k)} style={{
              height: 32, padding: "0 12px",
              border: `1px solid ${kind === k ? T.accent : T.edge}`,
              background: kind === k ? "rgba(139,92,246,0.18)" : "transparent",
              color: kind === k ? T.accentSoft : T.inkMute,
              fontFamily: F.mono, fontSize: 9, letterSpacing: "0.18em",
              textTransform: "uppercase", cursor: "pointer", borderRadius: 2,
            }}>{k}</button>
          ))}
        </div>
      </div>

      {/* Category tabs */}
      {!q && (
        <div style={{
          display: "flex", gap: 0, padding: "0 8px", flexShrink: 0,
          borderBottom: `1px solid ${T.edge}`, overflowX: "auto", scrollbarWidth: "none",
        }}>
          {categories.map((c) => {
            const active = c.id === catId;
            const gold   = c.id === SCRIBING_CAT;
            return (
              <button key={c.id} type="button" onClick={() => setCatId(c.id)} style={{
                height: 34, padding: "0 12px", background: "transparent", border: "none",
                borderBottom: active ? `2px solid ${gold ? "#d4a44a" : T.accent}` : "2px solid transparent",
                cursor: "pointer", whiteSpace: "nowrap", marginBottom: -1,
                fontFamily: F.mono, fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase",
                color: active ? (gold ? "#d4a44a" : T.accentSoft) : T.inkMute,
                display: "flex", alignItems: "center", gap: 6,
              }}>
                {gold && <span style={{ fontSize: 11 }}>✦</span>}
                {c.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        {/* Search results (flat) */}
        {q && (
          searchResults.length > 0 ? (
            <div style={{ padding: "14px 12px" }}>
              <div style={{ ...lineHeaderStyle, marginBottom: 10 }}>
                {searchResults.length} result{searchResults.length > 1 ? "s" : ""}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {searchResults.map(({ skill }) => (
                  <PoolSkillIcon key={skill.id} skill={skill}
                    armed={armed === skill.id} onArm={() => onArm(skill.id)}
                    onHover={onHover} onHoverEnd={onHoverEnd} />
                ))}
              </div>
            </div>
          ) : (
            <div style={emptyStyle}>No {kind.toLowerCase()} skills match "{query}"</div>
          )
        )}

        {/* Scribing category */}
        {isScribing && <ScribingPoolSection armed={armed} onArm={onArm} />}

        {/* Regular category — lines + morph grids */}
        {!q && !isScribing && (
          <div style={{ padding: "4px 12px 14px" }}>
            {activeCat.lines.map((line) => {
              const skills = lineSkills(line.id, kind);
              if (skills.length === 0) return null;
              return (
                <div key={line.id} style={{ marginTop: 14 }}>
                  <div style={lineHeaderStyle}>{line.name}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {skills.map((s) => (
                      <PoolSkillIcon key={s.id} skill={s}
                        armed={armed === s.id} onArm={() => onArm(s.id)}
                        onHover={onHover} onHoverEnd={onHoverEnd} />
                    ))}
                  </div>
                </div>
              );
            })}
            {activeCat.lines.every((l) => lineSkills(l.id, kind).length === 0) && (
              <div style={emptyStyle}>
                {activeCat.id === "class-selected"
                  ? "Select class skill lines above"
                  : `No ${kind.toLowerCase()} skills here`}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating ESO-Hub tooltip */}
      {tip && tipData && (
        <PoolTooltip x={tip.x} y={tip.y} data={tipData} />
      )}
    </div>
  );
}

// ── PoolTooltip — floating, follows cursor ────────────────────────────────────

function PoolTooltip({ x, y, data }: {
  x: number; y: number; data: EsoHubSkillTip | "loading";
}) {
  const w = 300;
  const left = Math.min(x + 16, window.innerWidth - w - 12);
  const top  = Math.min(y + 16, window.innerHeight - 180);

  return (
    <div style={{
      position: "fixed", left, top, width: w, zIndex: 9999, pointerEvents: "none",
      background: "linear-gradient(160deg, #160830 0%, #0e0520 100%)",
      border: "1px solid rgba(139,92,246,0.55)",
      boxShadow: "0 0 24px rgba(139,92,246,0.2), 0 4px 16px rgba(0,0,0,0.6)",
      padding: "12px 14px",
    }}>
      {data === "loading" ? (
        <div style={{ fontFamily: F.mono, fontSize: 11, color: T.inkMute, letterSpacing: "0.1em", textAlign: "center" }}>
          Loading…
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid rgba(139,92,246,0.25)" }}>
            <div style={{ fontFamily: F.cinzel, fontWeight: 700, fontSize: 15, color: "#d4a44a", lineHeight: 1.2 }}>
              {data.name}
            </div>
          </div>
          <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: "0.22em", color: "#d4a44a", textTransform: "uppercase", marginBottom: 6 }}>
            {data.header ?? "Effect"}
          </div>
          <div className="eso-tip-body"
            style={{ fontFamily: F.display, fontSize: 13, color: "#cfc0e8", lineHeight: 1.55 }}
            dangerouslySetInnerHTML={{ __html: data.effect_1 }} />
          {data.effect_2 && (
            <>
              <div style={{ margin: "10px 0 6px", height: 1, background: "rgba(139,92,246,0.25)" }} />
              <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: "0.22em", color: "#65d6ad", textTransform: "uppercase", marginBottom: 6 }}>
                New effect
              </div>
              <div className="eso-tip-body"
                style={{ fontFamily: F.display, fontSize: 13, color: "#cfc0e8", lineHeight: 1.55 }}
                dangerouslySetInnerHTML={{ __html: data.effect_2 }} />
            </>
          )}
        </>
      )}
    </div>
  );
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const lineHeaderStyle: React.CSSProperties = {
  fontFamily: F.mono, fontSize: 9, letterSpacing: "0.22em",
  color: T.inkMute, textTransform: "uppercase", marginBottom: 8,
};
const emptyStyle: React.CSSProperties = {
  padding: "28px 16px", textAlign: "center",
  fontFamily: F.mono, fontSize: 11, color: T.inkMute,
  letterSpacing: "0.18em", textTransform: "uppercase",
};

// ── SkillsTab ─────────────────────────────────────────────────────────────────

export default function SkillsTab() {
  const bar1       = useEditorStore((s) => s.setups[s.activeSetupIdx].bar1);
  const bar2       = useEditorStore((s) => s.setups[s.activeSetupIdx].bar2);
  const subclasses = useEditorStore((s) => s.meta.subclasses);
  const scribing   = useEditorStore((s) => s.setups[s.activeSetupIdx].scribing);

  // Armed skill (click-to-place fallback for non-drag users)
  const [armed, setArmed] = useState<string | null>(null);
  const onArm = useCallback((id: string) => setArmed((cur) => (cur === id ? null : id)), []);
  const clearArm = useCallback(() => setArmed(null), []);

  // Esc cancels armed selection
  useEffect(() => {
    if (!armed) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") setArmed(null); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [armed]);

  const armedSkill = armed
    ? armed.startsWith("@scr:")
      ? GRIMOIRE_MAP.get(scribing[parseInt(armed.slice(5), 10)]?.grimoire ?? "")?.name
      : skillById.get(armed)?.name
    : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, height: "100%", minHeight: 0 }}>
      <ClassLineRow />

      <BarRow title="Bar I · Front Bar" bar={0} skills={bar1}
        subclasses={subclasses} armed={armed} onArmConsume={clearArm} />
      <BarRow title="Bar II · Back Bar" bar={1} skills={bar2}
        subclasses={subclasses} armed={armed} onArmConsume={clearArm} />

      {/* Armed hint */}
      {armed && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
          background: "rgba(139,92,246,0.12)", border: `1px solid ${T.accent}66`,
          fontFamily: F.mono, fontSize: 10, letterSpacing: "0.12em", color: T.accentSoft,
          flexShrink: 0,
        }}>
          <Diamond size={5} />
          <span>Click a bar slot to place <strong style={{ color: T.ink }}>{armedSkill ?? "skill"}</strong></span>
          <div style={{ flex: 1 }} />
          <button type="button" onClick={clearArm} style={{
            background: "transparent", border: "none", cursor: "pointer",
            color: T.inkMute, fontFamily: F.mono, fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase",
          }}>cancel (esc)</button>
        </div>
      )}

      <Pool subclasses={subclasses} armed={armed} onArm={onArm} />

      <style>{`button:hover .skill-hover-overlay { opacity: 1 !important; }`}</style>
    </div>
  );
}
