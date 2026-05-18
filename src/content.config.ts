import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// ── Decap-safety preprocessor ────────────────────────────────────────────────
// Decap CMS writes `null` (not an absent key) when an optional field — select,
// number, string — is left empty. Zod `.optional()` accepts `undefined`, never
// `null`, so a single empty optional field fails the whole static build and
// takes the site down. This recursively rewrites `null` → `undefined` before
// validation, neutralising that entire class of authoring errors at once.
// Genuinely-required fields left empty still fail (correct) — the CI build gate
// catches those on the PR before they can reach production.
function stripNull(value: unknown): unknown {
  if (value === null) return undefined;
  if (Array.isArray(value)) return value.map(stripNull);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, stripNull(v)])
    );
  }
  return value;
}

// Wrap a Decap-authored collection's object schema so `null` is tolerated.
const decapSafe = <T extends z.ZodTypeAny>(schema: T) => z.preprocess(stripNull, schema);

// ── Consumables ──────────────────────────────────────────────────────────────
// An effect is either a named stat + value (food/drink) or a free-text
// description (potions/poisons from UESP alchemy effect pages).
const consumableEffect = z.union([
  z.object({ stat: z.string(), value: z.union([z.number(), z.string()]) }),
  z.object({ description: z.string() }),
]);

const consumables = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/consumables' }),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(['food', 'drink', 'potion', 'poison']),
    patch_verified: z.string(),
    uesp_url: z.string().url(),
    effects: z.array(consumableEffect),
    duration_seconds: z.number().optional(),
    reagents: z.array(z.string()).optional(),
    crafted: z.boolean(),
  }),
});

const cpStar = z.object({ star: z.string(), points: z.number(), priority: z.number() });

const playstyleRule = z.object({ title: z.string(), body: z.string() });

const uptimeCategory = z.enum(['full', 'high', 'situational']);

const playstyleBuffItem = z.object({
  skill: z.string(),
  stat: z.string(),
  note: z.string(),
  uptime: uptimeCategory.default('full'),
});

const playstyleComboStep = z.object({
  skill: z.string(),
  skill_alt: z.string().optional(),
  role: z.string(),
});

const playstyle = z.object({
  buffs: z.array(playstyleBuffItem).optional(),
  combo: z.array(playstyleComboStep).optional(),
  rules: z.array(playstyleRule).optional(),
}).optional();

const builds = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/builds' }),
  schema: decapSafe(z.object({
    title: z.string(),
    class: z.enum(['Dragonknight', 'Sorcerer', 'Nightblade', 'Templar', 'Warden', 'Necromancer', 'Arcanist', 'Werewolf', 'Subclass']),
    role: z.enum(['DPS', 'Healer', 'Tank']),
    resource: z.enum(['Stamina', 'Magicka', 'Hybrid']),
    gamemode: z.array(z.enum(['Cyrodiil / Imperial City', 'Battlegrounds', 'Duels'])).min(1),
    patch: z.string(),
    author: z.string().default('Kozy'),
    difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']),
    featured: z.boolean().default(false),
    og_image: z.string().optional(),
    video_id: z.string().optional(),
    race: z.string().optional(),
    sets: z.array(z.string()),
    skills: z.object({
      bar1: z.array(z.string()),
      bar2: z.array(z.string()),
    }),
    // Scribing: maps a Grimoire skill ID (referenced in bar1/bar2) to its 3 chosen scripts.
    // Scripts are free-text — no dataset to maintain, author controls exact wording.
    scribing: z.array(z.object({
      skill: z.string(),
      focus: z.string(),
      signature: z.string(),
      affix: z.string(),
    })).optional(),
    summary: z.string(),
    pullquote: z.string().optional(),
    gear: z.object({
      armor:   z.array(z.object({ slot: z.string(), type: z.enum(['heavy','medium','light','mythic']), item: z.string().optional(), setId: z.string(), tier: z.string().optional(), trait: z.string(), enchant: z.string() })),
      jewelry: z.array(z.object({ slot: z.string(), type: z.enum(['jewelry','mythic']),       item: z.string().optional(), setId: z.string(), tier: z.string().optional(), trait: z.string(), enchant: z.string() })),
      weapons: z.array(z.object({ slot: z.string(), type: z.literal('weapon'), barLabel: z.string(), weapon_type: z.string().optional(), item: z.string().optional(), setId: z.string(), tier: z.string().optional(), trait: z.string(), enchant: z.string() })),
    }).optional(),
    stats: z.object({
      health:  z.object({ target: z.number().optional(), note: z.string().optional() }),
      magicka: z.object({ target: z.number().optional(), note: z.string().optional() }),
      stamina: z.object({ target: z.number().optional(), note: z.string().optional() }),
    }).optional(),
    champion_points: z.object({
      warfare: z.array(cpStar),
      fitness: z.array(cpStar),
    }).optional(),
    playstyle,
    consumables: z.object({
      // food/potion/poison reference a consumables collection entry by ID.
      // mundus stays text-based (not yet a separate collection).
      food:   z.object({ id: z.string(), note: z.string().optional(), alt: z.string().optional() }).optional(),
      potion: z.object({ id: z.string(), note: z.string().optional() }).optional(),
      poison: z.object({ id: z.string(), note: z.string().optional() }).optional(),
      mundus: z.object({ stone: z.string(), note: z.string().optional(), alt: z.object({ stone: z.string(), note: z.string().optional() }).optional() }).optional(),
    }).optional(),
  })),
});

const guides = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/guides' }),
  schema: decapSafe(z.object({
    title: z.string(),
    category: z.string(),
    tags: z.array(z.string()),
    og_image: z.string().optional(),
    summary: z.string(),
    patch: z.string().optional(),
    readTime: z.string().optional(),
  })),
});

const sets = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/sets' }),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(['Light Armor', 'Medium Armor', 'Heavy Armor', 'Jewelry', 'Weapon', 'Mixed', 'Monster', 'Mythic']),
    acquisition: z.enum(['Overland', 'Dungeon', 'Trial', 'PvP', 'Crafted', 'Mythic', 'Monster', 'Arena']),
    location: z.string(),
    dlc: z.string(),
    pieces: z.number(),
    slots: z.array(z.string()),
    patch_verified: z.string(),
    bonuses: z.array(z.object({
      count: z.number(),
      stat: z.string(),
      value: z.union([z.number(), z.string()]),
    })),
    uesp_url: z.string().url(),
    esohub_url: z.string().url(),
  }),
});

const skills = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/skills' }),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    base_skill: z.string().nullable(),
    morph_of: z.string().nullable(),
    morph_sibling: z.string().nullable(),
    morph_rationale: z.string().optional(),
    class: z.enum(['Dragonknight', 'Sorcerer', 'Nightblade', 'Templar', 'Warden', 'Necromancer', 'Arcanist', 'Guild', 'World', 'Alliance War', 'Craft', 'Racial', 'Weapon', 'Armor']),
    skill_line: z.string(),
    type: z.enum(['Active', 'Passive', 'Ultimate']),
    resource: z.string(),
    icon: z.string(),
    patch_verified: z.string(),
    esohub_url: z.string().url(),
    uesp_url: z.string().url(),
  }),
});

const races = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/races' }),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    alliance: z.enum(['Aldmeri Dominion', 'Daggerfall Covenant', 'Ebonheart Pact', 'Other']),
    passives: z.array(z.object({
      name: z.string(),
      description: z.string(),
    })),
    patch_verified: z.string(),
    uesp_url: z.string().url(),
  }),
});

export const collections = { builds, guides, sets, skills, races, consumables };
