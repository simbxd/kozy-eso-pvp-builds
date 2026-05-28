import { useMemo, useState } from "react";
import { useEditorStore } from "../state";
import { T, F, Diamond } from "../atoms";
import { SkillLinePicker, ALL_CLASS_LINES } from "../atoms/SkillLinePicker";
import { SearchSelect, type SelectItem } from "../atoms/SearchSelect";
import { skillsIndex } from "@/lib/eso-data";
import {
  GRIMOIRES, FOCI, SIGNATURES, AFFIXES,
  GRIMOIRE_MAP, AFFIX_MAP,
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

// ── ClassLinePickers (top of tab) ─────────────────────────────────────────────

function ClassLinePickers() {
  const subclasses = useEditorStore((s) => s.meta.subclasses);
  const patchMeta  = useEditorStore((s) => s.patchMeta);

  const setLine = (slotIdx: 0 | 1 | 2, id: string) => {
    const next = [...subclasses] as [string, string, string];
    next[slotIdx] = id;
    patchMeta({ subclasses: next });
  };

  return (
    <div style={{
      display: "flex", gap: 10, alignItems: "flex-end",
      paddingBottom: 16,
      borderBottom: `1px solid ${T.edge}`,
      flexShrink: 0,
    }}>
      <div style={{
        fontFamily: F.mono, fontSize: 9, letterSpacing: "0.32em",
        color: T.inkMute, textTransform: "uppercase",
        flexShrink: 0, alignSelf: "center",
      }}>Class lines</div>

      {([0, 1, 2] as const).map((i) => {
        const lineId    = subclasses[i];
        const taken     = new Set(subclasses.filter((id, j) => id && j !== i));
        const available = LINE_ITEMS.filter((item) => !taken.has(item.id) || item.id === lineId);
        const raw       = ALL_CLASS_LINES.find((l) => l.id === lineId);
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
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
              height={28}
              popoverWidth={240}
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

  // Check if this slot holds a scribing skill reference
  const scrIdx  = id.startsWith("@scr:") ? parseInt(id.slice(5), 10) : -1;
  const scrSlot = scrIdx >= 0 ? (scribing[scrIdx] ?? null) : null;
  const grimoire = scrSlot?.grimoire ? GRIMOIRE_MAP.get(scrSlot.grimoire) : null;

  // Regular skill lookup (only when not a scribing ref)
  const skill = useMemo(
    () => (scrIdx < 0 && id ? skillsIndex.find((s) => s.id === id) : null),
    [id, scrIdx],
  );

  const kind    = ult ? "Ultimate" : "Active";
  const slotted = !!id;

  // Display values
  const displayIcon = scrIdx >= 0 ? (grimoire?.icon ?? null) : (skill?.icon ?? null);
  const displayName = scrIdx >= 0
    ? (grimoire ? `${grimoire.name} (Scribe)` : `Scribe ${scrIdx + 1}`)
    : (skill?.name ?? null);

  const titleText = displayName ?? (ult ? "Set ultimate" : `Set slot ${idx + 1}`);

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
        {/* Clickable skill box */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          title={titleText}
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
            overflow: "hidden",
            outline: "none",
          }}
        >
          {displayIcon ? (
            <img
              src={displayIcon} alt={displayName ?? ""}
              style={{ width: 64, height: 64, borderRadius: "50%" }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <span style={{
              fontFamily: F.cinzel, fontSize: scrIdx >= 0 ? 14 : 22,
              color: slotted
                ? (scrIdx >= 0 ? "#d4a44a" : T.accentSoft)
                : T.edgeStrong,
            }}>
              {scrIdx >= 0 ? "✦" : "◇"}
            </span>
          )}
          {/* Hover overlay */}
          <div className="skill-hover-overlay" style={{
            position: "absolute", inset: 0,
            background: "rgba(139,92,246,0.15)",
            opacity: 0, transition: "opacity 0.1s",
            zIndex: 2,
          }} />
        </button>

        {/* Slot label */}
        <div style={{
          fontFamily: F.mono, fontSize: 9, letterSpacing: "0.22em",
          color: ult ? T.accentSoft : T.inkMute, textTransform: "uppercase",
          textAlign: "center", maxWidth: 80,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {displayName ?? (ult ? "Ult." : `Slot ${idx + 1}`)}
        </div>

        {/* Clear button (when slotted) */}
        {slotted && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setSkill(bar, idx, ""); }}
            style={{
              background: "transparent", border: "none", cursor: "pointer",
              fontFamily: F.mono, fontSize: 9, letterSpacing: "0.18em",
              color: T.inkFaint, textTransform: "uppercase",
              padding: 0, lineHeight: 1,
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
  title: string;
  bar: 0 | 1;
  skills: string[];
  subclasses: [string, string, string];
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
      <div style={{ display: "flex", gap: 18, justifyContent: "space-between" }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <SkillCell key={i} id={skills[i] ?? ""} bar={bar} idx={i} subclasses={subclasses} />
        ))}
        <SkillCell id={skills[5] ?? ""} bar={bar} idx={5} ult subclasses={subclasses} />
      </div>
    </div>
  );
}

// ── ScribingSlotRow ───────────────────────────────────────────────────────────

function ScribingSlotRow({ slot, idx }: { slot: ScribingSlot; idx: number }) {
  const patchSlot  = useEditorStore((s) => s.patchScribingSlot);
  const removeSlot = useEditorStore((s) => s.removeScribingSlot);

  const affix      = slot.affix ? AFFIX_MAP.get(slot.affix) : undefined;
  const hasBufRef  = !!(affix?.buff_ids?.length);

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "8px 0",
      borderBottom: `1px solid ${T.edge}`,
    }}>
      {/* Slot index */}
      <div style={{
        width: 16, flexShrink: 0, textAlign: "center",
        fontFamily: F.mono, fontSize: 9, color: T.inkFaint,
      }}>{idx + 1}</div>

      {/* Grimoire */}
      <div style={{ flex: "0 0 150px" }}>
        <SearchSelect
          value={slot.grimoire}
          onChange={(v) => patchSlot(idx, { grimoire: v })}
          items={GRIMOIRE_ITEMS}
          placeholder="Grimoire"
          searchPlaceholder="Search grimoire…"
          height={32}
          popoverWidth={220}
        />
      </div>

      {/* Focus */}
      <div style={{ flex: "0 0 125px" }}>
        <SearchSelect
          value={slot.focus}
          onChange={(v) => patchSlot(idx, { focus: v })}
          items={FOCUS_ITEMS}
          placeholder="Focus"
          searchPlaceholder="Search focus…"
          searchable={false}
          height={32}
          popoverWidth={180}
        />
      </div>

      {/* Signature */}
      <div style={{ flex: "0 0 130px" }}>
        <SearchSelect
          value={slot.signature}
          onChange={(v) => patchSlot(idx, { signature: v })}
          items={SIGNATURE_ITEMS}
          placeholder="Signature"
          searchPlaceholder="Search signature…"
          searchable={false}
          height={32}
          popoverWidth={210}
        />
      </div>

      {/* Affix */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <SearchSelect
          value={slot.affix}
          onChange={(v) => patchSlot(idx, { affix: v })}
          items={AFFIX_ITEMS}
          placeholder="Affix"
          searchPlaceholder="Search affix…"
          searchable={false}
          height={32}
          popoverWidth={240}
        />
      </div>

      {/* Buff cross-reference badge */}
      {hasBufRef && (
        <div
          title={`Provides: ${affix!.buff_ids!.join(", ")} — toggle in Buffs tab`}
          style={{
            flexShrink: 0,
            width: 7, height: 7, borderRadius: "50%",
            background: T.accentSoft,
            boxShadow: `0 0 6px ${T.accent}`,
            cursor: "default",
          }}
        />
      )}

      {/* Remove */}
      <button
        type="button"
        onClick={() => removeSlot(idx)}
        style={{
          flexShrink: 0, width: 22, height: 22,
          background: "transparent", border: `1px solid ${T.edge}`,
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: F.mono, fontSize: 14, color: T.inkMute,
          lineHeight: 1,
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#ef4444"; (e.currentTarget as HTMLButtonElement).style.color = "#ef4444"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = T.edge; (e.currentTarget as HTMLButtonElement).style.color = T.inkMute; }}
      >×</button>
    </div>
  );
}

// ── ScribingSection ───────────────────────────────────────────────────────────

function ScribingSection() {
  const scribing = useEditorStore((s) => s.setups[s.activeSetupIdx].scribing);
  const addSlot  = useEditorStore((s) => s.addScribingSlot);

  const buffRefs = useMemo(() => {
    const ids: string[] = [];
    for (const sl of scribing) {
      const a = sl.affix ? AFFIX_MAP.get(sl.affix) : undefined;
      if (a?.buff_ids) ids.push(...a.buff_ids);
    }
    return [...new Set(ids)];
  }, [scribing]);

  return (
    <div style={{ flexShrink: 0 }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 12, gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Diamond size={6} />
          <div style={{
            fontFamily: F.cinzel, fontWeight: 600, fontSize: 14,
            letterSpacing: "0.32em", color: "#d4a44a", textTransform: "uppercase",
          }}>Scribing</div>
          <div style={{
            fontFamily: F.mono, fontSize: 9, letterSpacing: "0.24em",
            color: "#d4a44a", textTransform: "uppercase",
            border: "1px solid rgba(212,164,74,0.3)", padding: "2px 6px",
          }}>Gold Road</div>
          <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(212,164,74,0.4), transparent)", width: 60 }} />
          <div style={{
            fontFamily: F.mono, fontSize: 10, letterSpacing: "0.28em",
            color: T.inkMute, textTransform: "uppercase",
          }}>up to 3</div>
        </div>

        {scribing.length < 3 && (
          <button
            type="button"
            onClick={addSlot}
            style={{
              flexShrink: 0,
              background: "transparent",
              border: `1px solid ${T.edgeStrong}`,
              cursor: "pointer",
              padding: "4px 10px",
              fontFamily: F.mono, fontSize: 9, letterSpacing: "0.22em",
              color: T.inkMute, textTransform: "uppercase",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#d4a44a"; (e.currentTarget as HTMLButtonElement).style.color = "#d4a44a"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = T.edgeStrong; (e.currentTarget as HTMLButtonElement).style.color = T.inkMute; }}
          >+ Add</button>
        )}
      </div>

      {/* Sub-header */}
      <div style={{
        fontFamily: F.mono, fontSize: 9, letterSpacing: "0.12em",
        color: T.inkFaint, marginBottom: scribing.length > 0 ? 10 : 0,
      }}>
        Grimoire · Focus · Signature · Affix — configure here, then slot on a bar via the skill picker
      </div>

      {/* Empty state */}
      {scribing.length === 0 && (
        <div style={{
          padding: "14px 0 4px",
          fontFamily: F.mono, fontSize: 10, letterSpacing: "0.14em",
          color: T.inkFaint,
        }}>
          No scribing skills — click Add to configure up to 3
        </div>
      )}

      {/* Slot rows */}
      {scribing.map((slot, i) => (
        <ScribingSlotRow key={i} slot={slot} idx={i} />
      ))}

      {/* Buff cross-ref hint */}
      {buffRefs.length > 0 && (
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 8,
          marginTop: 10, padding: "8px 10px",
          background: "rgba(139,92,246,0.06)",
          border: `1px solid rgba(139,92,246,0.15)`,
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
            background: T.accentSoft, marginTop: 3,
            boxShadow: `0 0 5px ${T.accent}`,
          }} />
          <div style={{
            fontFamily: F.mono, fontSize: 9, letterSpacing: "0.14em",
            color: T.inkMute, lineHeight: 1.6,
          }}>
            Affixes provide: {buffRefs.join(" · ")} — enable matching toggles in the{" "}
            <span style={{ color: T.accentSoft }}>Buffs tab</span>.
          </div>
        </div>
      )}
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
      <div style={{ display: "flex", flexDirection: "column", gap: 28, height: "100%" }}>
        <ClassLinePickers />
        <BarRow title="Bar I · Front Bar"  bar={0} skills={bar1} subclasses={subclasses} />
        <BarRow title="Bar II · Back Bar"  bar={1} skills={bar2} subclasses={subclasses} />

        {/* Divider */}
        <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${T.edge}, transparent)` }} />

        <ScribingSection />
      </div>

      {/* Hover overlay style */}
      <style>{`
        button:hover .skill-hover-overlay { opacity: 1 !important; }
      `}</style>
    </>
  );
}
