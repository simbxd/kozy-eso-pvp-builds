import { useMemo, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { useEditorStore } from "../state";
import { T, F, Diamond } from "../atoms";
import { SkillLinePicker, ALL_CLASS_LINES } from "../atoms/SkillLinePicker";
import { SearchSelect, type SelectItem } from "../atoms/SearchSelect";
import { skillsIndex } from "@/lib/eso-data";
import {
  GRIMOIRES, FOCI, SIGNATURES, AFFIXES,
  GRIMOIRE_MAP, FOCUS_MAP, SIGNATURE_MAP, AFFIX_MAP,
} from "@/lib/scribing-defs";
import type { ScribingSlot } from "../state";

// ── Scribing select items ─────────────────────────────────────────────────────

const GRIMOIRE_ITEMS = GRIMOIRES.map((g) => ({
  id:    g.id,
  label: g.name,
  sub:   g.skill_line,
  icon:  g.icon,
}));

const FOCUS_ITEMS = FOCI.map((f) => ({
  id:    f.id,
  label: f.name,
  sub:   f.damage_type,
  icon:  f.icon,
}));

const SIGNATURE_ITEMS = SIGNATURES.map((s) => ({
  id:    s.id,
  label: s.name,
  sub:   s.hint,
  icon:  s.icon,
}));

const AFFIX_ITEMS = AFFIXES.map((a) => ({
  id:    a.id,
  label: a.name,
  sub:   a.hint,
  icon:  a.icon,
}));

// ── Class line picker items ───────────────────────────────────────────────────

const LINE_ITEMS: SelectItem[] = ALL_CLASS_LINES.map((l) => ({
  id:    l.id,
  label: l.name,
  badge: l.class,
}));

// ── ClassLinePickers ──────────────────────────────────────────────────────────

function ClassLineColumn() {
  const subclasses = useEditorStore((s) => s.meta.subclasses);
  const patchMeta  = useEditorStore((s) => s.patchMeta);

  const setLine = (slotIdx: 0 | 1 | 2, id: string) => {
    const next = [...subclasses] as [string, string, string];
    next[slotIdx] = id;
    patchMeta({ subclasses: next });
  };

  return (
    <div style={{
      width: 164, flexShrink: 0,
      display: "flex", flexDirection: "column", gap: 14,
      paddingRight: 20,
      borderRight: `1px solid ${T.edge}`,
    }}>
      {/* Section label */}
      <div style={{
        fontFamily: F.mono, fontSize: 9, letterSpacing: "0.32em",
        color: T.inkMute, textTransform: "uppercase",
      }}>Class lines</div>

      {([0, 1, 2] as const).map((i) => {
        const lineId    = subclasses[i];
        const taken     = new Set(subclasses.filter((id, j) => id && j !== i));
        const available = LINE_ITEMS.filter((item) => !taken.has(item.id) || item.id === lineId);
        const raw       = ALL_CLASS_LINES.find((l) => l.id === lineId);
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{
              fontFamily: F.mono, fontSize: 8, letterSpacing: "0.28em",
              color: lineId ? T.accentSoft : T.inkFaint,
              textTransform: "uppercase",
              display: "flex", alignItems: "center", gap: 4,
            }}>
              {lineId && <Diamond size={4} />}
              {raw ? raw.class : `Line ${["I", "II", "III"][i]}`}
            </div>
            <SearchSelect
              value={lineId}
              onChange={(v) => setLine(i, v)}
              items={available}
              placeholder={`Line ${["I", "II", "III"][i]}`}
              searchPlaceholder="Search lines…"
              height={30}
              popoverWidth={220}
            />
          </div>
        );
      })}
    </div>
  );
}

// ── SkillCell ─────────────────────────────────────────────────────────────────

function SkillCell({
  id, bar, idx, ult, subclasses,
}: {
  id: string;
  bar: 0 | 1;
  idx: number;
  ult?: boolean;
  subclasses: [string, string, string];
}) {
  const setSkill = useEditorStore((s) => s.setSkill);
  const scribing = useEditorStore((s) => s.setups[s.activeSetupIdx].scribing);
  const [open, setOpen] = useState(false);

  const scrIdx  = id.startsWith("@scr:") ? parseInt(id.slice(5), 10) : -1;
  const scrSlot = scrIdx >= 0 ? (scribing[scrIdx] ?? null) : null;
  const grimoire = scrSlot?.grimoire ? GRIMOIRE_MAP.get(scrSlot.grimoire) : null;

  const skill = useMemo(
    () => (scrIdx < 0 && id ? skillsIndex.find((s) => s.id === id) : null),
    [id, scrIdx],
  );

  const kind    = ult ? "Ultimate" : "Active";
  const slotted = !!id;

  const displayIcon = scrIdx >= 0 ? (grimoire?.icon ?? null) : (skill?.icon ?? null);
  const displayName = scrIdx >= 0
    ? (grimoire ? `${grimoire.name} (Scribe)` : `Scribe ${scrIdx + 1}`)
    : (skill?.name ?? null);

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          title={displayName ?? (ult ? "Set ultimate" : `Set slot ${idx + 1}`)}
          style={{
            position: "relative", width: 64, height: 64,
            borderRadius: "50%",
            border: `2px solid ${slotted ? (scrIdx >= 0 ? "#d4a44a" : T.accent) : T.edgeStrong}`,
            background: slotted
              ? scrIdx >= 0
                ? "linear-gradient(135deg, #3d2a0a 0%, #1a1006 100%)"
                : "linear-gradient(135deg, #321a73 0%, #150a30 100%)"
              : "linear-gradient(135deg, #1a0e3d 0%, #0e0626 100%)",
            cursor: "pointer", padding: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden", outline: "none",
          }}
        >
          {displayIcon ? (
            <img src={displayIcon} alt={displayName ?? ""}
              style={{ width: 64, height: 64, borderRadius: "50%" }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          ) : (
            <span style={{
              fontFamily: F.cinzel,
              fontSize: scrIdx >= 0 ? 14 : 22,
              color: slotted ? (scrIdx >= 0 ? "#d4a44a" : T.accentSoft) : T.edgeStrong,
            }}>
              {scrIdx >= 0 ? "✦" : "◇"}
            </span>
          )}
          <div className="skill-hover-overlay" style={{
            position: "absolute", inset: 0,
            background: "rgba(139,92,246,0.15)",
            opacity: 0, transition: "opacity 0.1s", zIndex: 2,
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

        {slotted && (
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

function BarRow({ title, bar, skills, subclasses }: {
  title: string; bar: 0 | 1;
  skills: string[]; subclasses: [string, string, string];
}) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 18 }}>
        <Diamond size={6} />
        <div style={{
          fontFamily: F.cinzel, fontWeight: 600, fontSize: 14,
          letterSpacing: "0.32em", color: T.accentSoft, textTransform: "uppercase",
        }}>{title}</div>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${T.accent}66, transparent)` }} />
        <div style={{
          fontFamily: F.mono, fontSize: 10, letterSpacing: "0.28em",
          color: T.inkMute, textTransform: "uppercase",
        }}>6 abilities</div>
      </div>
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <SkillCell key={i} id={skills[i] ?? ""} bar={bar} idx={i} subclasses={subclasses} />
        ))}
        {/* Small gap before ultimate */}
        <div style={{ width: 8, flexShrink: 0 }} />
        <SkillCell id={skills[5] ?? ""} bar={bar} idx={5} ult subclasses={subclasses} />
      </div>
    </div>
  );
}

// ── ScribingCell — circle + popover configurator ──────────────────────────────

function ScribingCell({ slot, idx }: { slot: ScribingSlot; idx: number }) {
  const patchSlot  = useEditorStore((s) => s.patchScribingSlot);
  const removeSlot = useEditorStore((s) => s.removeScribingSlot);
  const [open, setOpen] = useState(false);

  const grimoire  = slot.grimoire  ? GRIMOIRE_MAP.get(slot.grimoire)   : undefined;
  const focus     = slot.focus     ? FOCUS_MAP.get(slot.focus)         : undefined;
  const signature = slot.signature ? SIGNATURE_MAP.get(slot.signature) : undefined;
  const affix     = slot.affix     ? AFFIX_MAP.get(slot.affix)         : undefined;

  const configured = !!grimoire;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>

        {/* Circle trigger */}
        <Popover.Trigger asChild>
          <button
            type="button"
            title={grimoire ? `${grimoire.name} (Scribing)` : `Configure Scribing Slot ${idx + 1}`}
            style={{
              position: "relative", width: 64, height: 64,
              borderRadius: "50%",
              border: `2px solid ${configured ? "#d4a44a" : "rgba(212,164,74,0.35)"}`,
              background: configured
                ? "linear-gradient(135deg, #3d2a0a 0%, #1a1006 100%)"
                : "linear-gradient(135deg, #1a1006 0%, #0d0a04 100%)",
              cursor: "pointer", padding: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden", outline: "none",
              boxShadow: open ? `0 0 0 2px rgba(212,164,74,0.4)` : "none",
            }}
          >
            {grimoire?.icon ? (
              <img src={grimoire.icon} alt={grimoire.name}
                style={{ width: 64, height: 64, borderRadius: "50%" }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            ) : (
              <span style={{ fontFamily: F.cinzel, fontSize: 18, color: "rgba(212,164,74,0.45)" }}>✦</span>
            )}
            <div className="skill-hover-overlay" style={{
              position: "absolute", inset: 0,
              background: "rgba(212,164,74,0.12)",
              opacity: 0, transition: "opacity 0.1s", zIndex: 2,
            }} />
          </button>
        </Popover.Trigger>

        {/* Label */}
        <div style={{
          fontFamily: F.mono, fontSize: 9, letterSpacing: "0.18em",
          color: configured ? "#d4a44a" : "rgba(212,164,74,0.4)",
          textTransform: "uppercase", textAlign: "center",
          maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {grimoire?.name ?? `Scribe ${idx + 1}`}
        </div>

        {/* Remove */}
        <button
          type="button"
          onClick={() => removeSlot(idx)}
          style={{
            background: "transparent", border: "none", cursor: "pointer",
            fontFamily: F.mono, fontSize: 9, letterSpacing: "0.18em",
            color: T.inkFaint, textTransform: "uppercase", padding: 0, lineHeight: 1,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#ef4444"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = T.inkFaint; }}
        >remove</button>
      </div>

      {/* Config popover */}
      <Popover.Portal>
        <Popover.Content
          sideOffset={10}
          align="center"
          style={{
            width: 300, zIndex: 9999,
            background: "#0e0b1a",
            border: `1px solid rgba(212,164,74,0.35)`,
            boxShadow: "0 12px 40px rgba(0,0,0,0.8)",
            padding: "14px 14px 12px",
          }}
        >
          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8, marginBottom: 12,
          }}>
            <span style={{
              fontFamily: F.mono, fontSize: 9, letterSpacing: "0.28em",
              color: "#d4a44a", textTransform: "uppercase",
            }}>Scribing · Slot {idx + 1}</span>
            <div style={{ flex: 1, height: 1, background: "rgba(212,164,74,0.2)" }} />
          </div>

          {/* Pickers */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {/* Grimoire */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 60, flexShrink: 0,
                fontFamily: F.mono, fontSize: 8, letterSpacing: "0.2em",
                color: T.inkMute, textTransform: "uppercase",
              }}>Grimoire</div>
              <div style={{ flex: 1 }}>
                <SearchSelect
                  value={slot.grimoire}
                  onChange={(v) => patchSlot(idx, { grimoire: v })}
                  items={GRIMOIRE_ITEMS}
                  placeholder="— select —"
                  searchPlaceholder="Search grimoire…"
                  height={30}
                  popoverWidth={240}
                />
              </div>
            </div>

            {/* Focus */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 60, flexShrink: 0,
                fontFamily: F.mono, fontSize: 8, letterSpacing: "0.2em",
                color: T.inkMute, textTransform: "uppercase",
              }}>Focus</div>
              <div style={{ flex: 1 }}>
                <SearchSelect
                  value={slot.focus}
                  onChange={(v) => patchSlot(idx, { focus: v })}
                  items={FOCUS_ITEMS}
                  placeholder="— select —"
                  searchable={false}
                  height={30}
                  popoverWidth={210}
                />
              </div>
            </div>

            {/* Signature */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 60, flexShrink: 0,
                fontFamily: F.mono, fontSize: 8, letterSpacing: "0.2em",
                color: T.inkMute, textTransform: "uppercase",
              }}>Signature</div>
              <div style={{ flex: 1 }}>
                <SearchSelect
                  value={slot.signature}
                  onChange={(v) => patchSlot(idx, { signature: v })}
                  items={SIGNATURE_ITEMS}
                  placeholder="— select —"
                  searchable={false}
                  height={30}
                  popoverWidth={220}
                />
              </div>
            </div>

            {/* Affix */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 60, flexShrink: 0,
                fontFamily: F.mono, fontSize: 8, letterSpacing: "0.2em",
                color: T.inkMute, textTransform: "uppercase",
              }}>Affix</div>
              <div style={{ flex: 1 }}>
                <SearchSelect
                  value={slot.affix}
                  onChange={(v) => patchSlot(idx, { affix: v })}
                  items={AFFIX_ITEMS}
                  placeholder="— select —"
                  searchable={false}
                  height={30}
                  popoverWidth={240}
                />
              </div>
            </div>
          </div>

          {/* Summary line */}
          {(focus || signature || affix) && (
            <div style={{
              marginTop: 10, padding: "7px 8px",
              background: "rgba(212,164,74,0.05)",
              border: "1px solid rgba(212,164,74,0.15)",
              fontFamily: F.mono, fontSize: 8, letterSpacing: "0.12em",
              color: "rgba(212,164,74,0.7)", lineHeight: 1.6,
            }}>
              {[
                focus     ? `${focus.damage_type ?? focus.name}`   : null,
                signature ? signature.hint                         : null,
                affix     ? affix.hint                             : null,
              ].filter(Boolean).join(" · ")}
            </div>
          )}

          {/* Hint: slot on bar */}
          {grimoire && (
            <div style={{
              marginTop: 8,
              fontFamily: F.mono, fontSize: 8, letterSpacing: "0.12em",
              color: T.inkFaint, lineHeight: 1.5,
            }}>
              ✦ Click a bar slot → select this skill from{" "}
              <span style={{ color: "rgba(212,164,74,0.6)" }}>Scribing Skills</span> at top of picker
            </div>
          )}

          <Popover.Arrow style={{ fill: "rgba(212,164,74,0.35)" }} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

// ── ScribingRow ───────────────────────────────────────────────────────────────

function ScribingRow() {
  const scribing = useEditorStore((s) => s.setups[s.activeSetupIdx].scribing);
  const addSlot  = useEditorStore((s) => s.addScribingSlot);

  return (
    <div>
      {/* Header — matches BarRow style */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 18 }}>
        <Diamond size={6} color="#d4a44a" />
        <div style={{
          fontFamily: F.cinzel, fontWeight: 600, fontSize: 14,
          letterSpacing: "0.32em", color: "#d4a44a", textTransform: "uppercase",
        }}>Scribing</div>
        <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(212,164,74,0.4), transparent)" }} />
        <div style={{
          fontFamily: F.mono, fontSize: 10, letterSpacing: "0.28em",
          color: T.inkMute, textTransform: "uppercase",
        }}>up to 3</div>
      </div>

      {/* Cells row */}
      <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
        {scribing.map((slot, i) => (
          <ScribingCell key={i} slot={slot} idx={i} />
        ))}

        {/* Add slot button — same size as skill circle */}
        {scribing.length < 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
            <button
              type="button"
              onClick={addSlot}
              title="Add scribing skill"
              style={{
                width: 64, height: 64, borderRadius: "50%",
                border: `2px dashed rgba(212,164,74,0.3)`,
                background: "transparent",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                outline: "none",
                color: "rgba(212,164,74,0.4)",
                fontFamily: F.cinzel, fontSize: 24,
                transition: "border-color 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.borderColor = "rgba(212,164,74,0.7)";
                el.style.color = "rgba(212,164,74,0.8)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.borderColor = "rgba(212,164,74,0.3)";
                el.style.color = "rgba(212,164,74,0.4)";
              }}
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

// ── SkillsTab ─────────────────────────────────────────────────────────────────

export default function SkillsTab() {
  const bar1       = useEditorStore((s) => s.setups[s.activeSetupIdx].bar1);
  const bar2       = useEditorStore((s) => s.setups[s.activeSetupIdx].bar2);
  const subclasses = useEditorStore((s) => s.meta.subclasses);

  return (
    <>
      <div style={{ display: "flex", gap: 24, height: "100%", alignItems: "flex-start" }}>

        {/* Left column — class lines */}
        <ClassLineColumn />

        {/* Right column — bars + scribing */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 28, minWidth: 0 }}>
          <BarRow title="Bar I · Front Bar"  bar={0} skills={bar1} subclasses={subclasses} />
          <BarRow title="Bar II · Back Bar"  bar={1} skills={bar2} subclasses={subclasses} />

          {/* Divider */}
          <div style={{ height: 1, background: `linear-gradient(90deg, rgba(212,164,74,0.15), transparent)`, flexShrink: 0 }} />

          <ScribingRow />
        </div>
      </div>

      <style>{`
        button:hover .skill-hover-overlay { opacity: 1 !important; }
      `}</style>
    </>
  );
}
