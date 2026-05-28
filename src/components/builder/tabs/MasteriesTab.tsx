import { useMemo } from "react";
import { useEditorStore } from "../state";
import { T, F, Diamond } from "../atoms";
import { SearchSelect } from "../atoms/SearchSelect";
import skillLinesJson from "@/data/eso/skill-lines-index.json";
import masteriesJson  from "@/data/eso/class-masteries-index.json";
import {
  GRIMOIRES, FOCI, SIGNATURES, AFFIXES,
  GRIMOIRE_MAP, FOCUS_MAP, SIGNATURE_MAP, AFFIX_MAP,
  type ScribingSlot as _ScribingSlot,
} from "@/lib/scribing-defs";

// Re-export for JSX usage
type ScribingSlot = _ScribingSlot;

// ── Static data ───────────────────────────────────────────────────────────────

type RawLine      = { id: string; class_id: string };
type MasteryEntry = { id: string; name: string; class_id: string; description?: string };

const CLASS_LINES = skillLinesJson as RawLine[];
const MASTERIES   = masteriesJson  as MasteryEntry[];

const MASTERY_BY_CLASS = new Map<string, MasteryEntry[]>();
for (const m of MASTERIES) {
  if (!MASTERY_BY_CLASS.has(m.class_id)) MASTERY_BY_CLASS.set(m.class_id, []);
  MASTERY_BY_CLASS.get(m.class_id)!.push(m);
}

const CLASS_DISPLAY: Record<string, string> = {
  dragonknight: "Dragonknight",
  sorcerer:     "Sorcerer",
  nightblade:   "Nightblade",
  templar:      "Templar",
  warden:       "Warden",
  necromancer:  "Necromancer",
  arcanist:     "Arcanist",
};

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

// ── ScribingSlotRow ───────────────────────────────────────────────────────────

function ScribingSlotRow({ slot, idx }: { slot: ScribingSlot; idx: number }) {
  const patchSlot  = useEditorStore((s) => s.patchScribingSlot);
  const removeSlot = useEditorStore((s) => s.removeScribingSlot);

  const affix    = slot.affix ? AFFIX_MAP.get(slot.affix) : undefined;
  const hasBufRef = !!(affix?.buff_ids?.length);

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
      <div style={{ flex: "0 0 130px" }}>
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
      <div style={{ flex: "0 0 140px" }}>
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
  const scribing  = useEditorStore((s) => s.setups[s.activeSetupIdx].scribing);
  const addSlot   = useEditorStore((s) => s.addScribingSlot);

  // Collect affix buff cross-refs for the summary
  const buffRefs: string[] = useMemo(() => {
    const ids: string[] = [];
    for (const sl of scribing) {
      const a = sl.affix ? AFFIX_MAP.get(sl.affix) : undefined;
      if (a?.buff_ids) ids.push(...a.buff_ids);
    }
    return [...new Set(ids)];
  }, [scribing]);

  return (
    <div style={{
      padding: "18px 24px 16px",
      borderBottom: `1px solid ${T.edge}`,
      flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14, gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontFamily: F.cinzel, fontWeight: 700, fontSize: 17, color: T.accentSoft }}>
              Scribing
            </div>
            <div style={{
              fontFamily: F.mono, fontSize: 9, letterSpacing: "0.24em",
              color: "#d4a44a", textTransform: "uppercase",
              border: "1px solid rgba(212,164,74,0.3)", padding: "2px 6px",
            }}>Gold Road</div>
          </div>
          <div style={{
            fontFamily: F.mono, fontSize: 10, letterSpacing: "0.12em",
            color: T.inkMute, marginTop: 4,
          }}>
            Grimoire · Focus · Signature · Affix — up to 3 scribing skills
          </div>
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
              padding: "5px 12px",
              fontFamily: F.mono, fontSize: 9, letterSpacing: "0.22em",
              color: T.inkMute, textTransform: "uppercase",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = T.accentSoft; (e.currentTarget as HTMLButtonElement).style.color = T.accentSoft; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = T.edgeStrong; (e.currentTarget as HTMLButtonElement).style.color = T.inkMute; }}
          >+ Add skill</button>
        )}
      </div>

      {/* Empty state */}
      {scribing.length === 0 && (
        <div style={{
          padding: "16px 0",
          fontFamily: F.mono, fontSize: 10, letterSpacing: "0.14em",
          color: T.inkFaint, textAlign: "center",
        }}>
          No scribing skills — click Add skill to configure
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
            Selected affixes provide: {buffRefs.join(" · ")} — enable matching toggles in the{" "}
            <span style={{ color: T.accentSoft }}>Buffs tab</span> to include them in stat calculation.
          </div>
        </div>
      )}
    </div>
  );
}

// ── Class Mastery components (unchanged logic) ────────────────────────────────

function ClassPassiveRow({ m }: { m: MasteryEntry }) {
  const checked       = useEditorStore((s) => !!s.setups[s.activeSetupIdx].passives[m.id]);
  const togglePassive = useEditorStore((s) => s.togglePassive);

  return (
    <button
      type="button"
      onClick={() => togglePassive(m.id)}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 16,
        padding: "14px 20px", textAlign: "left",
        background: checked ? "rgba(139,92,246,0.10)" : "transparent",
        border: "none",
        borderBottom: `1px solid ${T.edge}`,
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        if (!checked) (e.currentTarget as HTMLButtonElement).style.background = "rgba(139,92,246,0.05)";
      }}
      onMouseLeave={(e) => {
        if (!checked) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
      }}
    >
      {/* Icon placeholder */}
      <div style={{
        width: 48, height: 48, flexShrink: 0, borderRadius: "50%",
        background: checked
          ? "linear-gradient(135deg, #321a73 0%, #150a30 100%)"
          : "rgba(10,6,18,0.6)",
        border: `2px solid ${checked ? T.accent : T.edgeStrong}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: F.cinzel, fontSize: 18,
        color: checked ? T.accentSoft : T.inkFaint,
        transition: "border-color 0.1s, background 0.1s",
      }}>◆</div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: F.cinzel, fontWeight: 700, fontSize: 14,
          letterSpacing: "0.04em",
          color: checked ? T.ink : T.inkDim,
          marginBottom: m.description ? 4 : 0,
        }}>{m.name}</div>
        {m.description && (
          <div style={{
            fontFamily: F.mono, fontSize: 11, letterSpacing: "0.04em",
            color: checked ? T.inkDim : T.inkMute,
            lineHeight: 1.55,
          }}>{m.description}</div>
        )}
      </div>

      {/* Checkbox */}
      <div style={{
        width: 20, height: 20, flexShrink: 0,
        border: `1.5px solid ${checked ? T.accent : T.edgeStrong}`,
        background: checked ? T.accent : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "background 0.1s, border-color 0.1s",
      }}>
        {checked && (
          <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
            <path d="M1 4.5L4.5 8L10 1" stroke="white" strokeWidth="1.6"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
    </button>
  );
}

function MasteryPanel({ classId }: { classId: string }) {
  const masteries    = useMemo(() => MASTERY_BY_CLASS.get(classId) ?? [], [classId]);
  const classLabel   = CLASS_DISPLAY[classId] ?? classId;
  const checkedCount = useEditorStore((s) => {
    const p = s.setups[s.activeSetupIdx].passives;
    return masteries.filter((m) => !!p[m.id]).length;
  });

  const overLimit = checkedCount > 2;

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>

      {/* ── Header ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "14px 24px 12px",
        borderBottom: `1px solid ${T.edge}`,
        flexShrink: 0,
      }}>
        <Diamond size={7} />
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <div style={{
              fontFamily: F.cinzel, fontWeight: 700, fontSize: 17,
              letterSpacing: "0.06em", color: T.accentSoft,
            }}>Class Masteries</div>
            <div style={{
              fontFamily: F.cinzel, fontWeight: 600, fontSize: 14,
              letterSpacing: "0.04em", color: T.inkDim,
            }}>{classLabel}</div>
            <div style={{
              fontFamily: F.mono, fontSize: 9, letterSpacing: "0.24em",
              color: "#d4a44a", textTransform: "uppercase",
              border: "1px solid rgba(212,164,74,0.3)",
              padding: "2px 6px",
            }}>U50</div>
          </div>
          <div style={{
            fontFamily: F.mono, fontSize: 10, letterSpacing: "0.14em",
            color: T.inkMute, marginTop: 4,
          }}>
            Unlocked at rank 50 on all 3 class lines · Choose 2 of 5
          </div>
        </div>

        {/* Counter */}
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <div style={{
            fontFamily: F.cinzel, fontWeight: 700, fontSize: 26,
            color: overLimit ? "#ef4444" : checkedCount > 0 ? T.accentSoft : T.edgeStrong,
            lineHeight: 1,
          }}>{checkedCount}</div>
          <div style={{
            fontFamily: F.mono, fontSize: 9, letterSpacing: "0.22em",
            color: T.inkMute, textTransform: "uppercase",
          }}>of 2</div>
          {overLimit && (
            <div style={{
              fontFamily: F.mono, fontSize: 9, letterSpacing: "0.14em",
              color: "#ef4444", marginTop: 2,
            }}>max exceeded</div>
          )}
        </div>
      </div>

      {/* ── Passive list ── */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {masteries.map((m) => <ClassPassiveRow key={m.id} m={m} />)}
      </div>

      {/* ── PTS disclaimer ── */}
      <div style={{
        padding: "10px 20px",
        borderTop: `1px solid ${T.edge}`,
        fontFamily: F.mono, fontSize: 9, letterSpacing: "0.14em",
        color: T.inkFaint, flexShrink: 0,
      }}>
        Values from U50 PTS — subject to change at live release
      </div>
    </div>
  );
}

function LockedPanel({ reason }: { reason: "no-class" | "subclassing" }) {
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 18,
      padding: 40, textAlign: "center",
    }}>
      <div style={{ fontFamily: F.cinzel, fontSize: 28, color: T.edgeStrong }}>◇</div>
      <div style={{
        fontFamily: F.cinzel, fontWeight: 700, fontSize: 15,
        letterSpacing: "0.08em", color: T.inkDim,
      }}>Class Masteries Unavailable</div>
      <div style={{
        fontFamily: F.mono, fontSize: 11, letterSpacing: "0.10em",
        color: T.inkMute, lineHeight: 1.7, maxWidth: 340,
      }}>
        {reason === "no-class"
          ? "Set all 3 class skill lines in the Skills tab to unlock this section."
          : "Class Masteries require all 3 skill lines to be from the same class. Subclassing across different classes disables this feature."}
      </div>
      {reason === "subclassing" && (
        <div style={{
          fontFamily: F.mono, fontSize: 9, letterSpacing: "0.18em",
          color: "#d4a44a", textTransform: "uppercase",
          border: "1px solid rgba(212,164,74,0.2)",
          padding: "6px 14px",
        }}>Pure class build required</div>
      )}
    </div>
  );
}

// ── MasteriesTab ──────────────────────────────────────────────────────────────

export default function MasteriesTab() {
  const subclasses = useEditorStore((s) => s.meta.subclasses);

  const { pureClassId, reason } = useMemo(() => {
    const filled = subclasses.filter(Boolean);
    if (filled.length === 0) return { pureClassId: null, reason: "no-class" as const };

    const classIds = [...new Set(
      filled.map((id) => CLASS_LINES.find((l) => l.id === id)?.class_id).filter(Boolean)
    )];

    if (classIds.length > 1) return { pureClassId: null, reason: "subclassing" as const };
    if (filled.length < 3)    return { pureClassId: null, reason: "no-class" as const };

    return { pureClassId: classIds[0] as string, reason: null };
  }, [subclasses]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* Scribing — always visible */}
      <div style={{ flexShrink: 0, overflowY: "auto", maxHeight: "45%" }}>
        <ScribingSection />
      </div>

      {/* Class Masteries — scrollable */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        {pureClassId
          ? <MasteryPanel classId={pureClassId} />
          : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <LockedPanel reason={reason!} />
            </div>
          )
        }
      </div>

    </div>
  );
}
