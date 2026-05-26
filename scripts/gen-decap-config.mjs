#!/usr/bin/env node
/**
 * Generates public/admin/config.yml from ESO data indexes.
 *
 * Reads:
 *   src/data/eso/sets-index.json  → 712 set options (label=name, value=slug)
 *   src/content/skills/*.json     → curated skill options (only these work in builds)
 *
 * Run after fetch:eso or after adding new skills:
 *   node scripts/gen-decap-config.mjs
 *   npm run gen:decap
 *
 * Requires: Node.js 18+
 */

import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const ESO_DIR         = join(ROOT, 'src/data/eso');
const SKILLS_DIR      = join(ROOT, 'src/content/skills');
const CONSUMABLES_DIR = join(ROOT, 'src/content/consumables');
const OUT             = join(ROOT, 'public/admin/config.yml');

const log = (...a) => console.log('[gen-decap]', ...a);
const isLocal = process.argv.includes('--local');

// ---------- Load data ----------
const setsIndex = JSON.parse(
  await readFile(join(ESO_DIR, 'sets-index.json'), 'utf8')
);

const racesIndex = JSON.parse(
  await readFile(join(ESO_DIR, 'races-index.json'), 'utf8')
);

const mundusIndex = JSON.parse(
  await readFile(join(ESO_DIR, 'mundus-index.json'), 'utf8')
);

const cpStarsIndex = JSON.parse(
  await readFile(join(ESO_DIR, 'cp-stars-index.json'), 'utf8')
);

const traitsIndex = JSON.parse(
  await readFile(join(ESO_DIR, 'traits-index.json'), 'utf8')
);

const enchantsIndex = JSON.parse(
  await readFile(join(ESO_DIR, 'enchants-index.json'), 'utf8')
);

const classMasteriesIndex = JSON.parse(
  await readFile(join(ESO_DIR, 'class-masteries-index.json'), 'utf8')
);

// Scribing permutation skill IDs (e.g. "healing-soul", "arcanists-soul") —
// the named combos a grimoire becomes once scripted. They clutter the skill-bar
// dropdown and confuse authors (you slot the grimoire "Wield Soul", not its
// permutation "Healing Soul"). Derived from UESP real-skill lists; see
// scribing-permutations.json. Excluded from the bar dropdown only — the JSON
// files stay so existing pages/links keep working.
const scribingPermutationIds = new Set(JSON.parse(
  await readFile(join(ESO_DIR, 'scribing-permutations.json'), 'utf8')
));

// Skills: only curated files in src/content/skills/ (these are the ones assertIds() accepts)
const skillFiles = (await readdir(SKILLS_DIR)).filter(f => f.endsWith('.json'));
const skillsIndex = await Promise.all(
  skillFiles.map(async f => {
    const id   = f.replace('.json', '');
    const data = JSON.parse(await readFile(join(SKILLS_DIR, f), 'utf8'));
    return { id, name: data.name, skill_line: data.skill_line ?? '', type: data.type ?? '' };
  })
);
skillsIndex.sort((a, b) => a.name.localeCompare(b.name));

// Consumables: load all JSON, group by type
const consumableFiles = (await readdir(CONSUMABLES_DIR)).filter(f => f.endsWith('.json'));
const consumablesIndex = await Promise.all(
  consumableFiles.map(async f => {
    const data = JSON.parse(await readFile(join(CONSUMABLES_DIR, f), 'utf8'));
    return { id: data.id, name: data.name, type: data.type };
  })
);
consumablesIndex.sort((a, b) => a.name.localeCompare(b.name));

const foodIndex   = consumablesIndex.filter(c => c.type === 'food' || c.type === 'drink');
const potionIndex = consumablesIndex.filter(c => c.type === 'potion');
const poisonIndex = consumablesIndex.filter(c => c.type === 'poison');

log(`Loaded ${setsIndex.length} sets, ${skillsIndex.length} curated skills, ${racesIndex.length} races, ${cpStarsIndex.warfare.length} warfare stars, ${cpStarsIndex.fitness.length} fitness stars, ${consumablesIndex.length} consumables (${foodIndex.length} food, ${potionIndex.length} potions, ${poisonIndex.length} poisons), ${mundusIndex.length} mundus stones, ${traitsIndex.length} traits, ${enchantsIndex.length} enchants`);

// ---------- Build YAML option blocks ----------
function consumableOptions(list, indent = 14) {
  const pad = ' '.repeat(indent);
  return list
    .map(c => `${pad}- { label: "${c.name.replace(/"/g, '\\"')}", value: "${c.id}" }`)
    .join('\n');
}

function mundusOptions(indent = 14) {
  const pad = ' '.repeat(indent);
  return mundusIndex
    .map(m => `${pad}- { label: "${m.name} — ${m.effect}", value: "${m.name}" }`)
    .join('\n');
}

// Class Masteries — labels prefixed with class abbreviation so authors can spot
// the right ones. No way to filter Decap select by another field's value, so
// we surface all 35 and rely on naming clarity.
const CLASS_ABBR = {
  dragonknight: 'DK', sorcerer: 'Sorc', nightblade: 'NB', templar: 'Tmp',
  warden: 'Wdn', necromancer: 'Necro', arcanist: 'Arc',
};
function classMasteryOptions(indent = 14) {
  const pad = ' '.repeat(indent);
  return classMasteriesIndex
    .map(m => `${pad}- { label: "${CLASS_ABBR[m.class_id] ?? m.class_id} — ${m.name.replace(/"/g, '\\"')}", value: "${m.id}" }`)
    .join('\n');
}

function raceOptions(indent = 10) {
  const pad = ' '.repeat(indent);
  return racesIndex
    .map(r => `${pad}- { label: "${r.name} — ${r.alliance}", value: "${r.id}" }`)
    .join('\n');
}

function setOptions(indent = 10) {
  const pad = ' '.repeat(indent);
  return setsIndex
    .map(s => `${pad}- { label: "${s.name.replace(/"/g, '\\"')}", value: "${s.id}" }`)
    .join('\n');
}

function cpStarOptions(constellation, indent = 18) {
  const pad = ' '.repeat(indent);
  return cpStarsIndex[constellation]
    .map(s => `${pad}- "${s.name.replace(/"/g, '\\"')}"`)
    .join('\n');
}

// For weapons: show all traits/enchants with category label (shields use armor traits/enchants).
// For armor/jewelry: filter by category — label is the name alone (category is implicit).
function traitOptions(filterCategory, indent = 18) {
  const pad = ' '.repeat(indent);
  const items = filterCategory === 'weapon' ? traitsIndex : traitsIndex.filter(t => t.category === filterCategory);
  return items
    .map(t => {
      const label = filterCategory === 'weapon' ? `${t.name} (${t.category})` : t.name;
      return `${pad}- { label: "${label.replace(/"/g, '\\"')}", value: "${t.id}" }`;
    })
    .join('\n');
}

function enchantOptions(filterCategory, indent = 18) {
  const pad = ' '.repeat(indent);
  const items = filterCategory === 'weapon' ? enchantsIndex : enchantsIndex.filter(e => e.category === filterCategory);
  return items
    .map(e => {
      const label = filterCategory === 'weapon' ? `${e.name} (${e.category})` : e.name;
      return `${pad}- { label: "${label.replace(/"/g, '\\"')}", value: "${e.id}" }`;
    })
    .join('\n');
}

// Bars hold only Active/Ultimate skills — exclude Passives so an author
// can't accidentally slot one (builds fine but is wrong content).
const isBarSkill = s => s.type === 'Active' || s.type === 'Ultimate';

function skillOptions(indent = 12) {
  const pad = ' '.repeat(indent);
  return skillsIndex
    .filter(isBarSkill)
    .filter(s => !scribingPermutationIds.has(s.id))
    .map(s => {
      const label = s.skill_line ? `${s.name} — ${s.skill_line}` : s.name;
      return `${pad}- { label: "${label.replace(/"/g, '\\"')}", value: "${s.id}" }`;
    })
    .join('\n');
}

// Scribing Grimoires — no distinguishing flag in skill data, list is stable
// (grimoires are added per chapter). Update when ZOS ships new ones.
const GRIMOIRE_IDS = new Set([
  'wield-soul', 'vault', 'ulfsilds-contingency', 'trample', 'torchbearer',
  'soul-burst', 'smash', 'shield-throw', 'menders-bond', 'elemental-explosion',
  'banner-bearer',
]);

function grimoireOptions(indent = 16) {
  const pad = ' '.repeat(indent);
  return skillsIndex
    .filter(s => GRIMOIRE_IDS.has(s.id))
    .map(s => `${pad}- { label: "${s.name.replace(/"/g, '\\"')}", value: "${s.id}" }`)
    .join('\n');
}

// Playstyle stat/source dropdown — covers all Major/Minor buffs + common combos
const STAT_OPTIONS = [
  // ── Major — offensif ──────────────────────────────────────────
  'Major Brutality',
  'Major Sorcery',
  'Major Savagery',
  'Major Prophecy',
  'Major Force',
  'Major Berserk',
  // ── Major — défensif / utilitaire ────────────────────────────
  'Major Protection',
  'Major Evasion',
  'Major Resolve',
  'Major Mending',
  'Major Vitality',
  'Major Heroism',
  'Major Expedition',
  // ── Minor — offensif ──────────────────────────────────────────
  'Minor Brutality',
  'Minor Sorcery',
  'Minor Savagery',
  'Minor Prophecy',
  'Minor Force',
  'Minor Berserk',
  'Minor Courage',
  // ── Minor — défensif / utilitaire ────────────────────────────
  'Minor Protection',
  'Minor Resolve',
  'Minor Mending',
  'Minor Vitality',
  'Minor Heroism',
  'Minor Expedition',
  'Minor Endurance',
  'Minor Fortitude',
  // ── Combos courants ──────────────────────────────────────────
  'Minor Force · Major Expedition',
  'Major Brutality · Minor Expedition',
  'Minor Berserk · Minor Courage',
  'Major Brutality · Major Sorcery',
  'Minor Force · Minor Berserk',
  // ── Spéciaux ─────────────────────────────────────────────────
  'Main HoT',
  'Off HoT',
  'Ultimate Regen',
  'Damage Shield',
  'Empower',
];

function statOptions(indent = 18) {
  const pad = ' '.repeat(indent);
  return STAT_OPTIONS
    .map(s => `${pad}- { label: "${s}", value: "${s}" }`)
    .join('\n');
}

// Scribing scripts — extracted from UESP Online:Scribing (Focus/Signature/Affix
// tables). Scripts are grimoire-specific in-game, but Decap select can't do
// conditional options, so each is a flat list of every script of that type.
const FOCUS_SCRIPTS = [
  'Bleed Damage', 'Damage Shield', 'Disease Damage', 'Dispel', 'Flame Damage',
  'Frost Damage', 'Generate Ultimate', 'Healing', 'Immobilize', 'Knockback',
  'Magic Damage', 'Mitigation', 'Multi-Target', 'Physical Damage',
  'Poison Damage', 'Pull', 'Restore Resources', 'Shock Damage', 'Stun',
  'Taunt', 'Trauma',
];
const SIGNATURE_SCRIPTS = [
  "Anchorite's Cruelty", "Anchorite's Potency", "Assassin's Misery",
  "Cavalier's Charge", 'Class Flourish', "Crusader's Defiance",
  "Druid's Resurgence", "Fencer's Parry", "Gladiator's Tenacity",
  'Growing Impact', "Hunter's Snare", 'Immobilizing Strike', "Knight's Valor",
  'Leeching Thirst', 'Lingering Torment', "Sage's Remedy", "Thief's Swiftness",
  "Warmage's Defense", "Warrior's Opportunity", "Wayfarer's Mastery",
];
const AFFIX_SCRIPTS = [
  'Berserk', 'Breach', 'Brittle', 'Brutality and Sorcery', 'Courage',
  'Cowardice', 'Defile', 'Empower', 'Enervation', 'Evasion', 'Expedition',
  'Force', 'Heroism', 'Intellect and Endurance', 'Interrupt', 'Lifesteal',
  'Magickasteal', 'Maim', 'Mangle', 'Off Balance', 'Protection', 'Resolve',
  'Savagery and Prophecy', 'Uncertainty', 'Vitality', 'Vulnerability',
];

function scriptOptions(list, indent = 12) {
  const pad = ' '.repeat(indent);
  return list
    .map(s => `${pad}- { label: "${s}", value: "${s}" }`)
    .join('\n');
}

// Playstyle skill select: value = skill name (for icon lookup), label = name + skill line
function skillNameOptions(indent = 18) {
  const pad = ' '.repeat(indent);
  return skillsIndex
    .filter(isBarSkill)
    .map(s => {
      const label = s.skill_line ? `${s.name} — ${s.skill_line}` : s.name;
      return `${pad}- { label: "${label.replace(/"/g, '\\"')}", value: "${s.name.replace(/"/g, '\\"')}" }`;
    })
    .join('\n');
}

// ---------- Config template ----------
const config = `${isLocal ? 'local_backend: true\n\n' : ''}backend:
  name: github
  repo: simbxd/kozy-eso-pvp-builds
  branch: main
  base_url: https://kozy-eso-oauth.simbad14100.workers.dev

publish_mode: editorial_workflow

media_folder: public/assets/og
public_folder: /assets/og

# ── Collections ───────────────────────────────────────────────────────────────
# AUTO-GENERATED by scripts/gen-decap-config.mjs — do not edit manually.
# Run: npm run fetch:eso && npm run gen:decap

collections:

  # ── Builds ──────────────────────────────────────────────────────────────────
  - name: builds
    label: Builds
    folder: src/content/builds
    create: true
    slug: "{{slug}}"
    extension: md
    format: frontmatter
    fields:

      # Core metadata
      - { name: title,      label: Title,      widget: string }
      - name: class
        label: Class
        widget: select
        options: [Dragonknight, Sorcerer, Nightblade, Templar, Warden, Necromancer, Arcanist, Werewolf]
      - name: role
        label: Role
        widget: select
        options: [DPS, Healer, Tank]
      - name: resource
        label: Resource
        widget: select
        options: [Stamina, Magicka, Hybrid]
      - name: gamemode
        label: Gamemode
        widget: select
        multiple: true
        options: ["Cyrodiil / Imperial City", Battlegrounds, Duels]
      - { name: patch,      label: Patch,       widget: string,  hint: "ex: U50" }
      - { name: author,     label: Author,      widget: string,  default: "Kozy", required: false }
      - name: difficulty
        label: Difficulty
        widget: select
        options: [Beginner, Intermediate, Advanced]
      - { name: featured,   label: Featured,    widget: boolean, default: false }
      - { name: subclass,   label: Subclass,    widget: boolean, default: false, required: false, hint: "Enable the Subclass section (skill lines)" }
      - name: class_masteries
        label: Class Masteries Passives
        widget: select
        multiple: true
        min: 0
        max: 2
        required: false
        hint: "Pureclass only — pick up to 2 mastery passives (ignored if Subclass is enabled)"
        options:
${classMasteryOptions(14)}
      - name: playstyle_tag
        label: Playstyle Tag
        widget: select
        required: false
        options: [Melee, Range, Ganking, Bomber]
      - name: race
        label: Race
        widget: select
        required: false
        hint: "Recommended race for this build"
        options:
${raceOptions(10)}
      - { name: summary,    label: Summary,     widget: text, required: false }
      - { name: video_id,   label: Video Gameplay (YouTube ID), widget: string, required: false, hint: "ID only — ex: dQw4w9WgXcQ" }

      # Sets
      - name: sets
        label: Sets
        widget: list
        field:
          name: set
          label: Set
          widget: select
          options:
${setOptions(12)}

      # Skills
      - name: skills
        label: Skills
        widget: object
        fields:
          - name: bar1
            label: Bar I
            widget: list
            field:
              name: skill
              label: Skill
              widget: select
              options:
${skillOptions(16)}
          - name: bar2
            label: Bar II
            widget: list
            field:
              name: skill
              label: Skill
              widget: select
              options:
${skillOptions(16)}

      # Scribing — Grimoire + 3 scripts (free text)
      - name: scribing
        label: Scribing
        widget: list
        required: false
        label_singular: Scribed Skill
        summary: "{{fields.skill}}"
        fields:
          - name: skill
            label: Grimoire
            widget: select
            options:
${grimoireOptions(14)}
          - name: focus
            label: Focus Script
            widget: select
            options:
${scriptOptions(FOCUS_SCRIPTS, 14)}
          - name: signature
            label: Signature Script
            widget: select
            options:
${scriptOptions(SIGNATURE_SCRIPTS, 14)}
          - name: affix
            label: Affix Script
            widget: select
            options:
${scriptOptions(AFFIX_SCRIPTS, 14)}

      # Stats targets
      - name: stats
        label: Stats Targets
        widget: object
        required: false
        fields:
          - name: health
            label: Health
            widget: object
            fields:
              - { name: target, label: Target, widget: number, required: false }
              - { name: note,   label: Note,   widget: string, required: false }
          - name: magicka
            label: Magicka
            widget: object
            fields:
              - { name: target, label: Target, widget: number, required: false }
              - { name: note,   label: Note,   widget: string, required: false }
          - name: stamina
            label: Stamina
            widget: object
            fields:
              - { name: target, label: Target, widget: number, required: false }
              - { name: note,   label: Note,   widget: string, required: false }

      # Champion Points
      - name: champion_points
        label: Champion Points
        widget: object
        required: false
        fields:
          - name: warfare
            label: Warfare
            widget: list
            fields:
              - name: star
                label: Star
                widget: select
                options:
${cpStarOptions('warfare', 18)}
              - { name: points,   label: Points,   widget: number }
              - { name: priority, label: Priority, widget: number }
          - name: fitness
            label: Fitness
            widget: list
            fields:
              - name: star
                label: Star
                widget: select
                options:
${cpStarOptions('fitness', 18)}
              - { name: points,   label: Points,   widget: number }
              - { name: priority, label: Priority, widget: number }

      # Consumables
      - name: consumables
        label: Consumables
        widget: object
        required: false
        fields:
          - name: food
            label: Food
            widget: object
            required: false
            fields:
              - name: id
                label: Item
                widget: select
                required: false
                options:
${consumableOptions(foodIndex, 18)}
              - { name: note, label: Note,        widget: string, required: false }
              - { name: alt,  label: Alternative, widget: string, required: false }
          - name: potion
            label: Potion
            widget: object
            required: false
            fields:
              - name: id
                label: Item
                widget: select
                required: false
                options:
${consumableOptions(potionIndex, 18)}
              - { name: note, label: Note, widget: string, required: false }
          - name: poison
            label: Poison
            widget: object
            required: false
            fields:
              - name: id
                label: Item
                widget: select
                required: false
                options:
${consumableOptions(poisonIndex, 18)}
              - { name: note, label: Note, widget: string, required: false }
          - name: mundus
            label: Mundus Stone
            widget: object
            required: false
            fields:
              - name: stone
                label: Stone
                widget: select
                required: false
                options:
${mundusOptions(18)}
              - { name: note,   label: Note,   widget: string, required: false }
              - name: alt
                label: Alternative Stone
                widget: object
                required: false
                fields:
                  - name: stone
                    label: Stone
                    widget: select
                    required: false
                    options:
${mundusOptions(22)}
                  - { name: note,   label: Note,   widget: string, required: false }

      # Playstyle
      - name: playstyle
        label: Playstyle
        widget: object
        required: false
        fields:
          - name: buffs
            label: Buffs & Uptimes
            widget: list
            required: false
            fields:
              - name: skill
                label: Skill
                widget: select
                options:
${skillNameOptions(18)}
              - name: stat
                label: "Stat / Source"
                widget: select
                options:
${statOptions(18)}
              - { name: note,   label: Note,              widget: string, hint: "Short mechanical note + usage instruction" }
              - name: uptime
                label: Uptime
                widget: select
                required: false
                default: full
                options:
                  - { label: "Full — up 24/24",            value: full }
                  - { label: "High — uptime élevé",        value: high }
                  - { label: "Situational — kite / burst", value: situational }
          - name: combo
            label: Burst Combo
            widget: list
            required: false
            fields:
              - name: skill
                label: Skill
                widget: select
                options:
${skillNameOptions(18)}
              - name: skill_alt
                label: "Skill alternatif (optionnel)"
                widget: select
                required: false
                hint: "Fill in if the player can choose between two skills for this step"
                options:
${skillNameOptions(18)}
              - { name: role, label: Role, widget: string, hint: "ex: Delayed AoE Burst, Final Burst, Debuff" }
          - name: rules
            label: Key Rules
            widget: list
            required: false
            default:
              - title: "Don't rush the kill"
                body: "Every skill you cast outside a window is a tell. Stack your burst, read the opening, release everything at once — if they survive, reset and wait for the next one."
              - title: "Break free immediately"
                body: "CC is the kill condition in solo PvP. Break the moment you're grabbed — do not stand still."
              - title: "Heal before panic"
                body: "Keep good uptime on Resolving Vigor, use your Burst Heal at ~60% HP, not 20%. Panic heals at critical health are usually too late against burst compositions."
            fields:
              - { name: title, label: Title, widget: string }
              - { name: body,  label: Body,  widget: text }

      # Gear Sheet
      - name: gear
        label: Gear Sheet
        widget: object
        required: false
        fields:
          - name: armor
            label: Armor
            widget: list
            fields:
              - name: slot
                label: Slot
                widget: select
                options: [Head, Shoulders, Chest, Hands, Waist, Legs, Feet]
              - name: type
                label: Weight
                widget: select
                options:
                  - { label: Heavy,   value: heavy }
                  - { label: Medium,  value: medium }
                  - { label: Light,   value: light }
                  - { label: Mythic,  value: mythic }
              - name: setId
                label: Set
                widget: select
                options:
${setOptions(18)}
              - name: trait
                label: Trait
                widget: select
                options:
${traitOptions('armor', 18)}
              - name: enchant
                label: Enchantment
                widget: select
                options:
${enchantOptions('armor', 18)}
          - name: jewelry
            label: Jewelry
            widget: list
            fields:
              - name: slot
                label: Slot
                widget: select
                options: [Ring I, Ring II, Neck]
              - name: type
                label: Type
                widget: select
                options: [jewelry, mythic]
              - name: setId
                label: Set
                widget: select
                options:
${setOptions(18)}
              - name: trait
                label: Trait
                widget: select
                options:
${traitOptions('jewelry', 18)}
              - name: enchant
                label: Enchantment
                widget: select
                options:
${enchantOptions('jewelry', 18)}
          - name: weapons
            label: Weapons
            widget: list
            fields:
              - name: slot
                label: Slot
                widget: select
                options: [Main Hand, Off Hand, Backup Main, Backup Off]
              - { name: type,     label: Type,        widget: hidden, default: "weapon" }
              - name: barLabel
                label: Bar
                widget: select
                options: [BAR I, BAR II]
              - name: weapon_type
                label: Weapon Type
                widget: select
                required: false
                options:
                  - Sword
                  - Axe
                  - Mace
                  - Dagger
                  - Greatsword
                  - Battle Axe
                  - Maul
                  - Shield
                  - Bow
                  - Inferno Staff
                  - Ice Staff
                  - Lightning Staff
                  - Restoration Staff
              - name: setId
                label: Set
                widget: select
                options:
${setOptions(18)}
              - name: trait
                label: Trait
                widget: select
                hint: "Shields use armor traits — look for (armor) suffix"
                options:
${traitOptions('weapon', 18)}
              - name: enchant
                label: Enchantment
                widget: select
                hint: "Shields use armor enchants — look for (armor) suffix"
                options:
${enchantOptions('weapon', 18)}

  # ── Guides ──────────────────────────────────────────────────────────────────
  - name: guides
    label: Guides
    folder: src/content/guides
    create: true
    slug: "{{slug}}"
    extension: md
    format: frontmatter
    fields:
      - { name: title,     label: Title,    widget: string }
      - { name: category,  label: Category, widget: string, hint: "ex: Mechanics, Builds, PvP" }
      - name: tags
        label: Tags
        widget: list
      - { name: summary,   label: Summary,   widget: text }
      - { name: patch,     label: Patch,     widget: string, required: false, hint: "ex: U50" }
      - { name: readTime,  label: Read Time, widget: string, required: false, hint: "ex: 8 min" }
      - { name: body,      label: Content,   widget: markdown }
`;

await writeFile(OUT, config, 'utf8');
log(`✓ Written ${OUT} (${(config.length / 1024).toFixed(1)} KB)${isLocal ? ' [local_backend: true]' : ''}`);
