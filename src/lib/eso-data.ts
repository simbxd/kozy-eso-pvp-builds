import type {
  EsoSet,
  EsoSkill,
  EsoSkillLine,
  EsoSetIndex,
  EsoSkillIndex,
  EsoTrait,
  EsoEnchant,
  GearCategory,
} from "@/types/eso";
import skillLinesJson from "@/data/eso/skill-lines-index.json";
import traitsJson from "@/data/eso/traits-index.json";
import enchantsJson from "@/data/eso/enchants-index.json";
import cpStarsJson from "@/data/eso/cp-stars-index.json";

// All ~713 sets and ~1208 skills are bundled eagerly. This produces a large
// chunk; that is accepted for M1 — bundle splitting / lazy loading is M11.
// `import: "default"` unwraps each JSON module to its parsed object directly.
const setModules = import.meta.glob<EsoSet>("/src/content/sets/*.json", {
  eager: true,
  import: "default",
});
const skillModules = import.meta.glob<EsoSkill>("/src/content/skills/*.json", {
  eager: true,
  import: "default",
});

const sets: EsoSet[] = Object.values(setModules);
const skills: EsoSkill[] = Object.values(skillModules);
const skillLines = skillLinesJson as EsoSkillLine[];
// Traits (28) and enchants (38) are tiny + curated — static import, no glob.
const traits = traitsJson as EsoTrait[];
const enchants = enchantsJson as EsoEnchant[];

// O(1) id → entity lookups. The full objects stay reachable for later
// milestones (gear stats, tooltips); the *Index arrays below are the
// lightweight shape pickers/lists should consume.
const setMap = new Map<string, EsoSet>(sets.map((s) => [s.id, s]));
const skillMap = new Map<string, EsoSkill>(skills.map((s) => [s.id, s]));
const skillLineMap = new Map<string, EsoSkillLine>(
  skillLines.map((l) => [l.id, l]),
);

export const setsIndex: EsoSetIndex[] = sets.map((s) => ({
  id: s.id,
  name: s.name,
  type: s.type,
  pieces: s.pieces,
  slots: s.slots,
  acquisition: s.acquisition,
}));

export const skillsIndex: EsoSkillIndex[] = skills.map((s) => ({
  id: s.id,
  name: s.name,
  class: s.class,
  skill_line: s.skill_line,
  skill_line_id: s.skill_line_id,
  type: s.type,
  icon: s.icon,
  morph_of: s.morph_of,
}));

export const skillLinesIndex: EsoSkillLine[] = skillLines;

export function getSet(id: string): EsoSet | undefined {
  return setMap.get(id);
}

export function getSkill(id: string): EsoSkill | undefined {
  return skillMap.get(id);
}

export function getSkillLine(id: string): EsoSkillLine | undefined {
  return skillLineMap.get(id);
}

const traitMap = new Map<string, EsoTrait>(traits.map((t) => [t.id, t]));
const enchantMap = new Map<string, EsoEnchant>(enchants.map((e) => [e.id, e]));

export function traitsForCategory(cat: GearCategory): EsoTrait[] {
  return traits.filter((t) => t.category === cat);
}

export function enchantsForCategory(cat: GearCategory): EsoEnchant[] {
  return enchants.filter((e) => e.category === cat);
}

export function getTrait(id: string): EsoTrait | undefined {
  return traitMap.get(id);
}

export function getEnchant(id: string): EsoEnchant | undefined {
  return enchantMap.get(id);
}

// ── Champion Point slottable stars ────────────────────────────────────────
// cp-stars-index.json carries name + effect only (curated PvP set). Slug the
// names locally to get stable ids consistent with the rest of the project.
export type CpTree = "red" | "blue" | "green";
export type CpStar = { id: string; name: string; effect: string; tree: CpTree };

function slugifyCpName(s: string): string {
  return s
    .toLowerCase()
    .replace(/[''`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const rawCp = cpStarsJson as { warfare: { name: string; effect: string }[]; fitness: { name: string; effect: string }[] };
export const cpStarsByTree: Record<CpTree, CpStar[]> = {
  red: rawCp.warfare.map((s) => ({ ...s, id: slugifyCpName(s.name), tree: "red" })),
  blue: rawCp.fitness.map((s) => ({ ...s, id: slugifyCpName(s.name), tree: "blue" })),
  green: [],
};

const cpStarMap = new Map<string, CpStar>();
for (const tree of ["red", "blue", "green"] as const) {
  for (const s of cpStarsByTree[tree]) cpStarMap.set(`${tree}:${s.id}`, s);
}

export function getCpStar(tree: CpTree, id: string): CpStar | undefined {
  return cpStarMap.get(`${tree}:${id}`);
}

// ── Passive descriptions ──────────────────────────────────────────────────
// Data JSONs in src/data/eso/skills/**/ carry a description field that the
// leaner content JSONs omit. We glob them eagerly and expose a lookup by slug
// (which matches the content JSON id field 1-to-1).
type DataSkillEntry = { slug: string; description?: string };
const dataSkillModules = import.meta.glob<DataSkillEntry>(
  "/src/data/eso/skills/**/*.json",
  { eager: true, import: "default" },
);
const skillDescMap = new Map<string, string>();
for (const mod of Object.values(dataSkillModules)) {
  if (mod?.slug && mod?.description) skillDescMap.set(mod.slug, mod.description);
}
export function getSkillDesc(id: string): string | undefined {
  return skillDescMap.get(id);
}

// Passives slotted under a set of skill lines. Skill JSONs carry type:Passive
// after the M4 data patch, so filtering on type is now reliable.
export function passivesForLines(lineIds: string[]): EsoSkillIndex[] {
  const set = new Set(lineIds.filter(Boolean));
  if (!set.size) return [];
  return skillsIndex.filter(
    (s) => s.type === "Passive" && set.has(s.skill_line_id),
  );
}
