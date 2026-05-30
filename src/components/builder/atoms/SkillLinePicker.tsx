import { useState, useMemo, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { T, F } from "./index";
import { skillsIndex } from "@/lib/eso-data";
import type { EsoSkillIndex } from "@/types/eso";
import skillLinesJson from "@/data/eso/skill-lines-index.json";
import { useEditorStore } from "../state";
import { GRIMOIRE_MAP, AFFIX_MAP, GRIMOIRES } from "@/lib/scribing-defs";
import type { ScribingSlot } from "../state";

// ── Static data ───────────────────────────────────────────────────────────────

type RawLine = { id: string; name: string; class: string; class_id: string; icon?: string };
export const ALL_CLASS_LINES = skillLinesJson as RawLine[];

type LineInfo = { id: string; name: string; icon?: string };
type GroupDef = { id: string; label: string; lines: LineInfo[] };

const WEAPON_GROUP: GroupDef = {
  id: "weapon", label: "Weapon",
  lines: [
    { id: "two-handed",          name: "Two Handed"          },
    { id: "one-hand-and-shield", name: "One Hand and Shield" },
    { id: "dual-wield",          name: "Dual Wield"          },
    { id: "bow",                 name: "Bow"                 },
    { id: "destruction-staff",   name: "Destruction Staff"   },
    { id: "restoration-staff",   name: "Restoration Staff"   },
  ],
};
const ARMOR_GROUP: GroupDef = {
  id: "armor", label: "Armor",
  lines: [
    { id: "heavy-armor",  name: "Heavy Armor"  },
    { id: "medium-armor", name: "Medium Armor" },
    { id: "light-armor",  name: "Light Armor"  },
  ],
};
const WORLD_GROUP: GroupDef = {
  id: "world", label: "World",
  lines: [
    { id: "vampire",    name: "Vampire"    },
    { id: "werewolf",   name: "Werewolf"   },
    { id: "soul-magic", name: "Soul Magic" },
  ],
};
const GUILD_GROUP: GroupDef = {
  id: "guild", label: "Guild",
  lines: [
    { id: "fighters-guild",   name: "Fighters Guild"   },
    { id: "mages-guild",      name: "Mages Guild"      },
    { id: "undaunted",        name: "Undaunted"        },
    { id: "psijic-order",     name: "Psijic Order"     },
    { id: "thieves-guild",    name: "Thieves Guild"    },
    { id: "dark-brotherhood", name: "Dark Brotherhood" },
  ],
};
const PVP_GROUP: GroupDef = {
  id: "pvp", label: "Alliance War",
  lines: [
    { id: "assault", name: "Assault" },
    { id: "support", name: "Support" },
  ],
};
const FIXED_GROUPS = [WEAPON_GROUP, ARMOR_GROUP, WORLD_GROUP, GUILD_GROUP, PVP_GROUP];

/** Build groups from the 3 selected subclass lines + fixed groups */
function buildGroups(subclasses: [string, string, string]): GroupDef[] {
  const groups: GroupDef[] = [];

  const selectedLines = subclasses
    .filter(Boolean)
    .map((id) => ALL_CLASS_LINES.find((l) => l.id === id))
    .filter((l): l is RawLine => !!l);

  if (selectedLines.length > 0) {
    groups.push({
      id: "class-selected",
      label: "Class Lines",
      lines: selectedLines.map((l) => ({ id: l.id, name: l.name, icon: l.icon })),
    });
  }

  groups.push(...FIXED_GROUPS);
  return groups;
}

// ── Scribing variant exclusion ────────────────────────────────────────────────
// Scribing permutations (e.g. "goading-throw", "healing-soul") are identified
// by: same skill_line_id as the grimoire AND id ends with `-${grimoire.id}`.
// They are excluded everywhere — users access them via the Scribing Skills section.

const SCRIBING_VARIANT_IDS = new Set(
  skillsIndex
    .filter((s) => GRIMOIRES.some((g) => s.skill_line_id === g.skill_line_id && s.id.endsWith(`-${g.id}`)))
    .map((s) => s.id)
);

// ── Skill grouping (base + morphs) ────────────────────────────────────────────

type SkillGroup = { base: EsoSkillIndex; morphs: EsoSkillIndex[] };

function getSkillGroups(lineId: string, kind: "Active" | "Ultimate"): SkillGroup[] {
  const lineSkills = skillsIndex.filter(
    (s) => s.skill_line_id === lineId && s.type === kind
      && !SCRIBING_VARIANT_IDS.has(s.id)
      && !s.id.startsWith("major-") && !s.id.startsWith("minor-"),
  );
  const bases  = lineSkills.filter((s) => !s.morph_of);
  const morphs = lineSkills.filter((s) => !!s.morph_of);
  return bases.map((base) => ({
    base,
    morphs: morphs.filter((m) => m.morph_of === base.id),
  }));
}

// ── Dialog layout helpers ─────────────────────────────────────────────────────

const overlay: React.CSSProperties = {
  position: "fixed", inset: 0,
  background: "rgba(0,0,0,0.72)",
  zIndex: 9000,
};
const panel: React.CSSProperties = {
  position: "fixed",
  top: "50%", left: "50%",
  transform: "translate(-50%, -50%)",
  width: 480, maxHeight: "80vh",
  background: "#0e0b1a",
  border: `1px solid ${T.edgeStrong}`,
  boxShadow: "0 16px 48px rgba(0,0,0,0.8)",
  display: "flex", flexDirection: "column",
  overflow: "hidden", zIndex: 9001,
};

function TitleBar({ title, onBack, onClose }: {
  title: string; onBack?: () => void; onClose: () => void;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "14px 16px 12px",
      borderBottom: `1px solid ${T.edge}`, flexShrink: 0,
    }}>
      {onBack && (
        <button type="button" onClick={onBack} style={{
          background: "transparent", border: "none", cursor: "pointer",
          color: T.inkMute, fontFamily: F.mono, fontSize: 14, lineHeight: 1, padding: "0 4px",
        }}>←</button>
      )}
      <div style={{
        flex: 1, fontFamily: F.cinzel, fontWeight: 600, fontSize: 15,
        letterSpacing: "0.06em", color: T.ink,
      }}>{title}</div>
      <button type="button" onClick={onClose} style={{
        background: "transparent", border: "none", cursor: "pointer",
        color: T.inkMute, fontFamily: F.mono, fontSize: 16, lineHeight: 1, padding: "0 2px",
      }}>×</button>
    </div>
  );
}

function SearchBar({ value, onChange, placeholder = "Search…" }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
      borderBottom: `1px solid ${T.edge}`, flexShrink: 0,
    }}>
      <svg width="13" height="13" viewBox="0 0 12 12" style={{ opacity: 0.4, flexShrink: 0 }}>
        <circle cx="5" cy="5" r="4" fill="none" stroke={T.inkMute} strokeWidth="1.3"/>
        <line x1="8.2" y1="8.2" x2="11" y2="11" stroke={T.inkMute} strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1, background: "transparent", border: "none", outline: "none",
          fontFamily: F.display, fontSize: 13, color: T.ink,
        }}
      />
      {value && (
        <button type="button" onClick={() => onChange("")} style={{
          background: "transparent", border: "none", cursor: "pointer",
          color: T.inkFaint, fontFamily: F.mono, fontSize: 13,
        }}>×</button>
      )}
    </div>
  );
}

// ── Flat skill search index ───────────────────────────────────────────────────

type FlatSkill = { skill: EsoSkillIndex; lineName: string; isBase: boolean };

function buildFlatSkills(groups: GroupDef[], kind: "Active" | "Ultimate"): FlatSkill[] {
  const out: FlatSkill[] = [];
  for (const group of groups) {
    for (const line of group.lines) {
      for (const sg of getSkillGroups(line.id, kind)) {
        // Scribing variants already excluded in getSkillGroups
        if (sg.morphs.length > 0) {
          for (const m of sg.morphs) out.push({ skill: m, lineName: line.name, isBase: false });
        } else {
          out.push({ skill: sg.base, lineName: line.name, isBase: true });
        }
      }
    }
  }
  return out;
}

// ── GroupsView ────────────────────────────────────────────────────────────────

function GroupsView({
  groups, expanded, onToggle, onSelectLine, onSelectDirect, search, noClassLines, scribingSlots, kind,
}: {
  groups: GroupDef[];
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onSelectLine: (lineId: string, lineName: string) => void;
  onSelectDirect: (id: string) => void;
  search: string;
  noClassLines: boolean;
  scribingSlots: ScribingSlot[];
  kind: "Active" | "Ultimate";
}) {
  const q = search.trim().toLowerCase();

  // Flat skill search — only when query is non-empty
  const flatSkills = useMemo(() => buildFlatSkills(groups, kind), [groups, kind]);
  const skillResults = useMemo(() => {
    if (!q) return [];
    return flatSkills.filter((f) => f.skill.name.toLowerCase().includes(q)).slice(0, 30);
  }, [flatSkills, q]);

  const visible = groups.map((g) => ({
    ...g,
    lines: q ? g.lines.filter((l) => l.name.toLowerCase().includes(q)) : g.lines,
  })).filter((g) => g.lines.length > 0);

  // Scribing slots that are configured (have a grimoire set)
  const configuredScribing = scribingSlots
    .map((slot, i) => ({ slot, i }))
    .filter(({ slot }) => !!slot.grimoire);

  // Filter scribing slots by search
  const visibleScribing = q
    ? configuredScribing.filter(({ slot }) => {
        const g = GRIMOIRE_MAP.get(slot.grimoire);
        return g?.name.toLowerCase().includes(q) || g?.skill_line.toLowerCase().includes(q);
      })
    : configuredScribing;

  return (
    <div style={{ overflowY: "auto", flex: 1 }}>

      {/* ── Scribing slots section ── */}
      {visibleScribing.length > 0 && (
        <div>
          <div style={{
            padding: "8px 16px 6px",
            background: "rgba(212,164,74,0.05)",
            borderBottom: `1px solid ${T.edge}`,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{
              fontFamily: F.mono, fontSize: 9, letterSpacing: "0.28em",
              color: "#d4a44a", textTransform: "uppercase",
            }}>Scribing Skills</span>
            <span style={{
              fontFamily: F.mono, fontSize: 8, letterSpacing: "0.14em",
              color: T.inkFaint,
            }}>Gold Road</span>
          </div>
          {visibleScribing.map(({ slot, i }) => {
            const g = GRIMOIRE_MAP.get(slot.grimoire);
            const a = slot.affix ? AFFIX_MAP.get(slot.affix) : undefined;
            return (
              <button
                key={i}
                type="button"
                onClick={() => onSelectDirect(`@scr:${i}`)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 16px", textAlign: "left",
                  background: "transparent",
                  border: "none", borderBottom: `1px solid ${T.edge}`, cursor: "pointer",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(212,164,74,0.07)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              >
                {g?.icon && (
                  <img
                    src={g.icon} alt=""
                    style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, opacity: 0.9,
                      border: "1px solid rgba(212,164,74,0.4)" }}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: F.cinzel, fontWeight: 600, fontSize: 14,
                    color: "#d4a44a",
                  }}>
                    {g?.name ?? "Scribing Skill"}{" "}
                    <span style={{ fontFamily: F.mono, fontSize: 9, color: T.inkFaint, letterSpacing: "0.12em" }}>
                      (Slot {i + 1})
                    </span>
                  </div>
                  <div style={{
                    fontFamily: F.mono, fontSize: 9, letterSpacing: "0.12em",
                    color: T.inkMute, marginTop: 2,
                  }}>
                    {g?.skill_line ?? ""}
                    {a ? ` · ${a.hint}` : ""}
                  </div>
                </div>
                <span style={{ fontFamily: F.mono, fontSize: 12, color: T.inkFaint }}>›</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Direct skill results (when searching) ── */}
      {skillResults.length > 0 && (
        <div>
          <div style={{
            padding: "6px 16px",
            background: "rgba(139,92,246,0.06)",
            borderBottom: `1px solid ${T.edge}`,
            fontFamily: F.mono, fontSize: 9, letterSpacing: "0.28em",
            color: T.accentSoft, textTransform: "uppercase",
          }}>Skills</div>
          {skillResults.map(({ skill, lineName, isBase }) => (
            <button
              key={skill.id}
              type="button"
              onClick={() => onSelectDirect(skill.id)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12,
                padding: "9px 16px", textAlign: "left",
                background: "transparent",
                border: "none", borderBottom: `1px solid ${T.edge}`, cursor: "pointer",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(139,92,246,0.10)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >
              {skill.icon ? (
                <img src={skill.icon} alt=""
                  style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                    border: `1px solid rgba(139,92,246,0.35)`, opacity: isBase ? 0.6 : 1 }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
              ) : (
                <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                  background: "rgba(139,92,246,0.12)", border: `1px solid ${T.edge}` }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: F.cinzel, fontWeight: 600, fontSize: 13,
                  color: isBase ? T.inkMute : T.ink,
                  fontStyle: isBase ? "italic" : "normal",
                }}>{skill.name}</div>
                <div style={{
                  fontFamily: F.mono, fontSize: 9, letterSpacing: "0.14em",
                  color: T.inkFaint, marginTop: 2,
                }}>{lineName}</div>
              </div>
              <span style={{ fontFamily: F.mono, fontSize: 12, color: T.inkFaint }}>›</span>
            </button>
          ))}
        </div>
      )}

      {/* No class lines hint */}
      {noClassLines && !q && (
        <div style={{
          padding: "10px 16px",
          background: "rgba(139,92,246,0.06)",
          borderBottom: `1px solid ${T.edge}`,
          fontFamily: F.mono, fontSize: 9, letterSpacing: "0.22em",
          color: T.inkMute, textTransform: "uppercase",
        }}>
          ◆ Select class skill lines above to access class skills
        </div>
      )}

      {visible.map((group) => {
        const isOpen = q ? true : expanded.has(group.id);
        return (
          <div key={group.id}>
            <button
              type="button"
              onClick={() => onToggle(group.id)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "11px 16px", textAlign: "left",
                background: isOpen ? "rgba(139,92,246,0.06)" : "transparent",
                border: "none", borderBottom: `1px solid ${T.edge}`, cursor: "pointer",
              }}
            >
              {group.lines[0]?.icon && (
                <img src={group.lines[0].icon} alt="" style={{ width: 22, height: 22, flexShrink: 0, opacity: 0.85 }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
              )}
              <div style={{
                flex: 1, fontFamily: F.display, fontSize: 15, fontWeight: 600,
                color: isOpen ? T.accentSoft : T.ink,
              }}>{group.label}</div>
              <span style={{
                fontFamily: F.mono, fontSize: 12, color: T.inkMute,
                display: "inline-block",
                transform: isOpen ? "rotate(180deg)" : "none",
                transition: "transform 0.15s",
              }}>∨</span>
            </button>

            {isOpen && (
              <div style={{ background: "rgba(10,6,18,0.3)" }}>
                {group.lines.map((line) => (
                  <button
                    key={line.id}
                    type="button"
                    onClick={() => onSelectLine(line.id, line.name)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 10,
                      padding: "9px 16px 9px 38px", textAlign: "left",
                      background: "transparent",
                      border: "none", borderBottom: `1px solid ${T.edge}`, cursor: "pointer",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(139,92,246,0.10)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                  >
                    {line.icon && (
                      <img src={line.icon} alt="" style={{ width: 20, height: 20, flexShrink: 0, opacity: 0.85 }}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                    )}
                    <span style={{ flex: 1, fontFamily: F.display, fontSize: 14, color: T.inkDim }}>{line.name}</span>
                    <span style={{ fontFamily: F.mono, fontSize: 12, color: T.inkFaint }}>›</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {visible.length === 0 && visibleScribing.length === 0 && skillResults.length === 0 && q && (
        <div style={{
          padding: "24px 16px", textAlign: "center",
          fontFamily: F.mono, fontSize: 11, color: T.inkMute,
          letterSpacing: "0.18em", textTransform: "uppercase",
        }}>No results for "{search}"</div>
      )}
    </div>
  );
}

// ── SkillsView helpers ────────────────────────────────────────────────────────

function SkillGroupRow({ group, onSelect }: {
  group: SkillGroup;
  onSelect: (id: string) => void;
}) {
  return (
    <div style={{ borderBottom: `1px solid ${T.edge}` }}>
      {/* Base skill — smaller, italic, secondary */}
      <button
        type="button"
        onClick={() => onSelect(group.base.id)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 10,
          padding: "8px 16px", textAlign: "left",
          background: "rgba(10,6,18,0.25)", border: "none", cursor: "pointer",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(139,92,246,0.07)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(10,6,18,0.25)"; }}
      >
        {group.base.icon && (
          <img src={group.base.icon} alt=""
            style={{ width: 24, height: 24, borderRadius: "50%", clipPath: "circle(50%)", flexShrink: 0, opacity: 0.7 }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
        )}
        <span style={{ fontFamily: F.display, fontSize: 13, color: T.inkMute, fontStyle: "italic" }}>
          {group.base.name}
        </span>
        {group.morphs.length === 0 && (
          <span style={{
            marginLeft: "auto", fontFamily: F.mono, fontSize: 9,
            color: T.inkFaint, letterSpacing: "0.18em", textTransform: "uppercase",
          }}>slot base</span>
        )}
      </button>

      {/* Morphs — prominent */}
      {group.morphs.map((morph) => (
        <button
          key={morph.id}
          type="button"
          onClick={() => onSelect(morph.id)}
          style={{
            width: "100%", display: "flex", alignItems: "flex-start", gap: 12,
            padding: "12px 16px", textAlign: "left",
            background: "transparent", border: "none", cursor: "pointer",
            borderTop: `1px solid ${T.edge}`,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(139,92,246,0.10)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
        >
          <div style={{
            width: 6, height: 6, transform: "rotate(45deg)",
            background: T.accentSoft, flexShrink: 0, marginTop: 8,
          }} />
          {morph.icon && (
            <img src={morph.icon} alt=""
              style={{
                width: 44, height: 44, borderRadius: "50%", clipPath: "circle(50%)", flexShrink: 0,
                border: `2px solid rgba(139,92,246,0.4)`,
              }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: F.cinzel, fontWeight: 600, fontSize: 14,
              color: T.ink, marginBottom: 4,
            }}>{morph.name}</div>
            <div style={{
              fontFamily: F.mono, fontSize: 9, letterSpacing: "0.18em",
              color: T.inkMute, textTransform: "uppercase",
            }}>{morph.skill_line}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

// ── SkillsView ────────────────────────────────────────────────────────────────

function SkillsView({ lineId, kind, onSelect, search }: {
  lineId: string; kind: "Active" | "Ultimate";
  onSelect: (id: string) => void; search: string;
}) {
  const groups = useMemo(() => getSkillGroups(lineId, kind), [lineId, kind]);
  const [showOrphans, setShowOrphans] = useState(false);
  const q = search.trim().toLowerCase();

  // Split into groups-with-morphs (real skills) and orphaned bases (no morphs)
  const { real, orphans } = useMemo(() => {
    return {
      real:    groups.filter((g) => g.morphs.length > 0),
      orphans: groups.filter((g) => g.morphs.length === 0),
    };
  }, [groups]);

  // Apply search filter — when searching, show everything
  const filteredReal = useMemo(() => {
    if (!q) return real;
    return real.map((g) => ({
      ...g,
      morphs: g.morphs.filter((m) => m.name.toLowerCase().includes(q)),
    })).filter((g) => g.base.name.toLowerCase().includes(q) || g.morphs.length > 0);
  }, [real, q]);

  const filteredOrphans = useMemo(() => {
    if (!q) return orphans;
    return orphans.filter((g) => g.base.name.toLowerCase().includes(q));
  }, [orphans, q]);

  if (groups.length === 0) {
    return (
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: F.mono, fontSize: 11, color: T.inkMute,
        letterSpacing: "0.18em", textTransform: "uppercase",
      }}>No {kind.toLowerCase()} skills in this line</div>
    );
  }

  // When search is active and nothing matches primary, show hint
  const noResults = filteredReal.length === 0 && filteredOrphans.length === 0;

  return (
    <div style={{ overflowY: "auto", flex: 1 }}>
      {/* Primary: real skill groups (with morphs) */}
      {filteredReal.map((group) => (
        <SkillGroupRow key={group.base.id} group={group} onSelect={onSelect} />
      ))}

      {/* Orphaned base skills (class variants without morphs) */}
      {orphans.length > 0 && (
        <>
          {/* Searching → show matching orphans directly */}
          {q ? (
            filteredOrphans.map((group) => (
              <SkillGroupRow key={group.base.id} group={group} onSelect={onSelect} />
            ))
          ) : (
            /* Not searching → toggle */
            <>
              <button
                type="button"
                onClick={() => setShowOrphans((v) => !v)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 16px", border: "none",
                  background: "transparent",
                  borderTop: `1px solid ${T.edge}`,
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(139,92,246,0.04)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              >
                <span style={{
                  fontFamily: F.mono, fontSize: 9, letterSpacing: "0.22em",
                  color: T.inkFaint, textTransform: "uppercase",
                }}>
                  {showOrphans ? "▲" : "▼"} {orphans.length} more base skills
                </span>
              </button>
              {showOrphans && orphans.map((group) => (
                <SkillGroupRow key={group.base.id} group={group} onSelect={onSelect} />
              ))}
            </>
          )}
        </>
      )}

      {noResults && (
        <div style={{
          padding: "24px 16px", textAlign: "center",
          fontFamily: F.mono, fontSize: 11, color: T.inkMute,
          letterSpacing: "0.18em", textTransform: "uppercase",
        }}>No skills match "{search}"</div>
      )}
    </div>
  );
}

// ── SkillLinePicker ───────────────────────────────────────────────────────────

export function SkillLinePicker({
  open, onClose, onSelect, kind, subclasses,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  kind: "Active" | "Ultimate";
  subclasses: [string, string, string];
}) {
  const [view, setView]         = useState<"groups" | "skills">("groups");
  const [lineId, setLineId]     = useState("");
  const [lineName, setLineName] = useState("");
  const [search, setSearch]     = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set<string>());

  // Read scribing slots from store (to surface them in groups view)
  const scribing = useEditorStore((s) => s.setups[s.activeSetupIdx].scribing);

  const noClassLines = subclasses.filter(Boolean).length === 0;
  const groups = useMemo(() => buildGroups(subclasses), [subclasses]);

  // Auto-expand "Class Lines" group when there are selected lines
  const handleOpenAutoFocus = () => {
    if (!noClassLines) setExpanded((p) => new Set([...p, "class-selected"]));
  };

  const reset = () => {
    setView("groups"); setLineId(""); setLineName(""); setSearch("");
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) { onClose(); reset(); }
  };

  const handleToggle = (gid: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(gid)) next.delete(gid); else next.add(gid);
      return next;
    });
  };

  const handleSelectLine = (lid: string, lname: string) => {
    setLineId(lid); setLineName(lname);
    setView("skills"); setSearch("");
  };

  const handleSelect = useCallback((id: string) => {
    onSelect(id); onClose(); reset();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onSelect, onClose]);

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay style={overlay} />
        <Dialog.Content
          style={panel}
          onOpenAutoFocus={(e) => { e.preventDefault(); handleOpenAutoFocus(); }}
          aria-describedby={undefined}
        >
          <Dialog.Title style={{ display: "none" }}>
            {view === "groups" ? "Select a skill line" : lineName}
          </Dialog.Title>

          <TitleBar
            title={view === "groups" ? "Select a skill line" : lineName}
            onBack={view === "skills" ? () => { setView("groups"); setSearch(""); } : undefined}
            onClose={onClose}
          />

          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder={view === "groups" ? "Search lines…" : `Search ${kind.toLowerCase()}s…`}
          />

          {view === "groups" ? (
            <GroupsView
              groups={groups}
              expanded={expanded}
              onToggle={handleToggle}
              onSelectLine={handleSelectLine}
              onSelectDirect={handleSelect}
              search={search}
              noClassLines={noClassLines}
              scribingSlots={scribing}
              kind={kind}
            />
          ) : (
            <SkillsView
              lineId={lineId}
              kind={kind}
              onSelect={handleSelect}
              search={search}
            />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
