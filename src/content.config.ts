import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const cpStar = z.object({ star: z.string(), points: z.number(), priority: z.number() });

const playstyleRule    = z.object({ title: z.string(), body: z.string() });
const playstyleBuffItem = z.object({ skill: z.string(), note: z.string() });
const playstyle = z.object({
  buffs: z.array(playstyleBuffItem).optional(),
  combo: z.array(z.string()).optional(),
  rules: z.array(playstyleRule).optional(),
}).optional();

const builds = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/builds' }),
  schema: z.object({
    title: z.string(),
    class: z.enum(['Dragonknight', 'Sorcerer', 'Nightblade', 'Templar', 'Warden', 'Necromancer', 'Arcanist']),
    role: z.enum(['DPS', 'Healer', 'Tank']),
    resource: z.enum(['Stamina', 'Magicka', 'Hybrid']),
    gamemode: z.enum(['PvP', 'PvE', 'Both']),
    patch: z.string(),
    updatedAt: z.union([z.string(), z.date()])
      .transform(v => v instanceof Date ? v.toISOString().split('T')[0] : v)
      .optional(),
    difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']),
    featured: z.boolean().default(false),
    og_image: z.string().optional(),
    sets: z.array(z.string()),
    skills: z.object({
      bar1: z.array(z.string()),
      bar2: z.array(z.string()),
    }),
    summary: z.string(),
    pullquote: z.string().optional(),
    gear: z.object({
      armor:   z.array(z.object({ slot: z.string(), type: z.enum(['heavy','medium','light']), item: z.string(), setId: z.string(), tier: z.string(), trait: z.string(), enchant: z.string() })),
      jewelry: z.array(z.object({ slot: z.string(), type: z.enum(['jewelry','mythic']),       item: z.string(), setId: z.string(), tier: z.string(), trait: z.string(), enchant: z.string() })),
      weapons: z.array(z.object({ slot: z.string(), type: z.literal('weapon'), barLabel: z.string(), item: z.string(), setId: z.string(), tier: z.string(), trait: z.string(), enchant: z.string() })),
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
      food:   z.object({ name: z.string().optional(), stats: z.string().optional(), note: z.string().optional(), alt: z.string().optional() }).optional(),
      potion: z.object({ name: z.string().optional(), ingredients: z.array(z.string()).optional(), note: z.string().optional() }).optional(),
      poison: z.object({ name: z.string().optional(), note: z.string().optional() }).optional(),
      mundus: z.object({ stone: z.string().optional(), effect: z.string().optional(), note: z.string().optional(), alt: z.object({ stone: z.string().optional(), effect: z.string().optional(), note: z.string().optional() }).optional() }).optional(),
    }).optional(),
  }),
});

const guides = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/guides' }),
  schema: z.object({
    title: z.string(),
    category: z.string(),
    tags: z.array(z.string()),
    published: z.coerce.date(),
    og_image: z.string().optional(),
    summary: z.string(),
    patch: z.string().optional(),
    readTime: z.string().optional(),
    updatedAt: z.union([z.string(), z.date()])
      .transform(v => v instanceof Date ? v.toISOString().split('T')[0] : v)
      .optional(),
  }),
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

export const collections = { builds, guides, sets, skills };
