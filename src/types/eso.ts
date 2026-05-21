// Types mirroring the on-disk JSON dataset in src/content/{sets,skills} and
// the static index in src/data/eso/skill-lines-index.json.

export type EsoSet = {
  id: string;
  name: string;
  type: string;
  acquisition: string;
  location: string;
  dlc: string;
  pieces: number;
  slots: string[];
  patch_verified: string;
  bonuses: Array<{ count: number; stat: string; value: string | number }>;
  uesp_url?: string;
  esohub_url?: string;
};

export type EsoSkill = {
  id: string;
  name: string;
  base_skill: string | null;
  morph_of: string | null;
  morph_sibling: string | null;
  morph_rationale?: string;
  class: string;
  skill_line: string;
  skill_line_id: string;
  type: "Active" | "Passive" | "Ultimate";
  resource: string;
  icon: string;
  patch_verified: string;
  esohub_url?: string;
  uesp_url?: string;
};

export type EsoSkillLine = {
  id: string;
  name: string;
  class: string;
  class_id: string;
  icon: string;
  patch_verified: string;
};

export type GearCategory = "weapon" | "armor" | "jewelry";

export type EsoTrait = {
  id: string;
  name: string;
  category: GearCategory;
  effect?: string;
  value_range?: string;
};

export type EsoEnchant = {
  id: string;
  name: string;
  category: GearCategory;
  rune_prefix?: string;
  effect?: string;
};

export type EsoSetIndex = Pick<EsoSet, "id" | "name" | "type" | "pieces" | "slots" | "acquisition">;
export type EsoSkillIndex = Pick<EsoSkill, "id" | "name" | "class" | "skill_line" | "skill_line_id" | "type" | "icon" | "morph_of">;
