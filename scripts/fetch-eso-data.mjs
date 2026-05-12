#!/usr/bin/env node
/**
 * ESO Sets & Skills fetcher for Decap CMS
 *
 * Pulls data from UESP's public esolog JSON API:
 *   https://esolog.uesp.net/exportJson.php?table=<tableName>
 *
 * Targets ESO Update 49+ (launched March 9, 2026). Validates freshness by
 * checking for known U49 sets (Gorethief, Shattered Paths Signet) in the
 * response. If validation fails the script bails — pass SKIP_VALIDATION=1
 * to override (e.g. for future updates that rename or remove these canaries).
 *
 * Tables used:
 *   - setSummary  : one row per item set with bonuses 2/3/4/5...
 *   - playerSkills: skills accessible to players (virtual filter on minedSkills)
 *
 * Writes to OUT_DIR (default src/data/eso):
 *   sets/<slug>.json                ← one file per set
 *   skills/<category>/<slug>.json   ← one file per skill, grouped by category
 *   sets-index.json                 ← flat list for build-time lookups
 *   skills-index.json
 *
 * Craft skills (Provisioning, Alchemy, etc.) are excluded — not relevant for PvP builds.
 *
 * Usage:
 *   node scripts/fetch-eso-data.mjs                    # default src/data/eso
 *   SAMPLE=5 node scripts/fetch-eso-data.mjs           # only first 5 (testing)
 *   DRY_RUN=1 node scripts/fetch-eso-data.mjs          # fetch + log, no writes
 *   SKIP_VALIDATION=1 node scripts/fetch-eso-data.mjs  # bypass U49 canary check
 *
 * Requires: Node.js 18+
 */

import { writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

// ---------- Config ----------
const UESP_BASE = 'https://esolog.uesp.net/exportJson.php';
const OUT_DIR = process.env.OUT_DIR || './src/data/eso';
const DRY_RUN = process.env.DRY_RUN === '1';
const SAMPLE = process.env.SAMPLE ? parseInt(process.env.SAMPLE, 10) : null;
const FETCH_TIMEOUT_MS = 120_000;
const SKIP_VALIDATION = process.env.SKIP_VALIDATION === '1';

const ESO_VERSION = process.env.ESO_VERSION || 'live';

function tableName(base) {
  if (ESO_VERSION === 'live') return base;
  return `${base}${ESO_VERSION}`;
}

// Update 49 canaries — used to detect if UESP has actually mined U49 data.
const U49_CANARY_SETS = [
  "Gorethief",               // new PvP set (U49)
  "Shattered Paths Signet",  // new Mythic (U49)
];

const U49_OBSOLETE_SKILLS = [
  "Fiery Breath",  // → "Dragonfire Breath" in U49 Dragonknight rework
];

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (eso-data-fetcher; +https://github.com/simbxd/kozy-eso-pvp-builds)',
  'Accept': 'application/json, text/plain, */*',
};

// ---------- Utils ----------
const log = (...a) => console.log('[eso-fetch]', ...a);
const warn = (...a) => console.warn('[eso-fetch] ⚠', ...a);

function slugify(str) {
  return String(str)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

async function fetchTable(table, extraParams = {}) {
  const url = new URL(UESP_BASE);
  url.searchParams.set('table', table);
  for (const [k, v] of Object.entries(extraParams)) url.searchParams.set(k, v);

  log(`Fetching ${table} from ${url.toString()}`);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, { headers: HEADERS, signal: controller.signal });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText} for table=${table}`);
    }
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error(
        `Response was not valid JSON (first 200 chars): ${text.slice(0, 200)}`
      );
    }
    if (data.error) {
      throw new Error(`UESP API error: ${JSON.stringify(data.error)}`);
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

async function writeJson(path, obj) {
  if (DRY_RUN) return;
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

// ---------- Set normalisation ----------

// UESP type → acquisition enum (matches src/content/sets schema)
const UESP_TYPE_TO_ACQUISITION = {
  'Arena':    'Arena',
  'Class':    'Dungeon',   // class sets drop from dungeons
  'Crafted':  'Crafted',
  'Dungeon':  'Dungeon',
  'Monster':  'Monster',
  'Mythic':   'Mythic',
  'Other':    'Overland',
  'Overland': 'Overland',
  'PVP':      'PvP',
  'Trial':    'Trial',
};

// Derive our type enum from itemSlots + maxPieces + UESP type
function deriveSetType(itemSlots, maxPieces, uespType) {
  if (maxPieces === 1)                    return 'Mythic';
  if (uespType === 'Monster' || maxPieces === 2) return 'Monster';

  const s = (itemSlots || '').toLowerCase();
  const hasLight   = s.includes('light');
  const hasMedium  = s.includes('medium');
  const hasHeavy   = s.includes('heavy');
  const hasArmor   = hasLight || hasMedium || hasHeavy;
  const hasJewelry = s.includes('neck') || s.includes('ring');
  const hasWeapon  = s.includes('weapon') || s.includes('shield');

  if (!hasArmor && hasJewelry && !hasWeapon) return 'Jewelry';
  if (!hasArmor && !hasJewelry && hasWeapon) return 'Weapon';

  const armorWeights = [hasLight, hasMedium, hasHeavy].filter(Boolean).length;
  if (armorWeights === 1 && !hasJewelry && !hasWeapon) {
    if (hasLight)  return 'Light Armor';
    if (hasMedium) return 'Medium Armor';
    return 'Heavy Armor';
  }
  return 'Mixed';
}

// Parse itemSlots string → array of slot names
function parseSlots(itemSlots) {
  if (!itemSlots) return [];
  const s = itemSlots.toLowerCase();
  const slots = [];
  if (s.includes('head'))     slots.push('head');
  if (s.includes('shoulder')) slots.push('shoulders');
  if (s.includes('chest'))    slots.push('chest');
  if (s.includes('hands'))    slots.push('hands');
  if (s.includes('waist'))    slots.push('waist');
  if (s.includes('legs'))     slots.push('legs');
  if (s.includes('feet'))     slots.push('feet');
  if (s.includes('neck'))     slots.push('necklace');
  if (s.includes('ring'))     slots.push('ring');
  if (s.includes('weapon'))   slots.push('weapon');
  if (s.includes('shield'))   slots.push('off-hand');
  return slots;
}

// Parse a single UESP bonus description into {count, stat, value}
function parseBonus(rawDesc) {
  const desc = String(rawDesc).replace(/\|c[0-9a-fA-F]{6}|\|r/g, '').trim();
  const pieceMatch = desc.match(/^\((\d+) items?\)\s*/i);
  const count = pieceMatch ? parseInt(pieceMatch[1]) : 1;
  const rest  = pieceMatch ? desc.slice(pieceMatch[0].length) : desc;

  // "Adds VALUE STAT" or "Adds MIN-MAX STAT"
  const addsMatch = rest.match(/^Adds (\d+(?:-\d+)?)\s+(.+)$/);
  if (addsMatch) {
    const rawVal = addsMatch[1];
    const stat   = addsMatch[2].trim();
    const value  = rawVal.includes('-')
      ? parseInt(rawVal.split('-')[1])   // use max of range
      : parseInt(rawVal);
    return { count, stat, value };
  }

  // Fallback: full description as stat, no numeric value
  return { count, stat: rest, value: '' };
}

function normaliseSet(row) {
  const name = row.setName ?? row.name ?? row.set_name;
  if (!name) return null;

  const slug      = slugify(name);
  const maxPieces = parseInt(row.setMaxEquipCount ?? row.maxEquipCount ?? 0, 10) || 1;
  const uespType  = String(row.type ?? '').trim();
  const itemSlots = String(row.itemSlots ?? '').trim();
  const sources   = String(row.sources ?? '').trim();

  const setType    = deriveSetType(itemSlots, maxPieces, uespType);
  const acquisition = UESP_TYPE_TO_ACQUISITION[uespType] ?? 'Overland';

  // Parse bonuses into structured format (same as src/content/sets schema)
  const bonuses = [];
  for (let i = 1; i <= 12; i++) {
    const desc = row[`setBonusDesc${i}`] ?? row[`bonus${i}`] ?? null;
    if (desc && String(desc).trim()) {
      bonuses.push(parseBonus(desc));
    }
  }

  return {
    id:             slug,
    name,
    type:           setType,
    acquisition,
    location:       sources || '',
    dlc:            'Base Game',   // not available from UESP API
    pieces:         maxPieces,
    slots:          parseSlots(itemSlots),
    patch_verified: 'U49',
    bonuses,
    uesp_url:       `https://en.uesp.net/wiki/Online:${name.replace(/ /g, '_')}`,
    esohub_url:     `https://eso-hub.com/en/sets/${slug}`,
  };
}

// ---------- Skill normalisation ----------
// Numeric skillType values from UESP playerSkills (verified U49)
const SKILL_CATEGORY_MAP = {
  '1': 'classes',
  '2': 'weapons',
  '3': 'armor',
  '4': 'world',
  '5': 'guild',
  '6': 'pvp',
  '7': 'racial',
  '8': 'craft',
};

// Craft skills excluded — not relevant for PvP builds
const EXCLUDED_CATEGORIES = new Set(['craft']);

function categoriseSkill(row) {
  const raw = String(row.skillType ?? '').trim();
  return SKILL_CATEGORY_MAP[raw] || 'other';
}

function normaliseSkillRow(row) {
  const name = row.name ?? row.skillName ?? row.abilityName;
  if (!name) return null;
  if (String(name).startsWith('_')) return null;

  const rawDesc = row.description ?? row.desc ?? null;
  const description = rawDesc
    ? String(rawDesc).replace(/\|c[0-9a-fA-F]{6}|\|r/g, '').trim()
    : null;

  return {
    id: row.abilityId ?? row.id ?? null,
    name: String(name).trim(),
    description,
    category: categoriseSkill(row),
    skillLine: row.skillLine ?? row.line ?? null,
    isPassive: !!(row.isPassive ?? row.passive),
    isUltimate: !!(row.isUltimate ?? row.ultimate),
    morph: row.morph ?? null,
    rank: parseInt(row.rank ?? 0, 10) || null,
  };
}

function deduplicateSkills(rows) {
  const grouped = new Map();
  for (const r of rows) {
    if (!r) continue;
    const key = `${r.skillLine ?? 'unknown'}::${r.name}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(r);
  }

  const out = [];
  for (const [, group] of grouped) {
    group.sort((a, b) => (b.rank ?? 0) - (a.rank ?? 0));
    const rep = group[0];
    out.push({
      id: rep.id,
      slug: slugify(rep.name),
      name: rep.name,
      description: rep.description,
      category: rep.category,
      skill_line: rep.skillLine,
      is_passive: rep.isPassive,
      is_ultimate: rep.isUltimate,
      max_rank: rep.rank,
    });
  }
  return out;
}

// ---------- Main ----------
async function buildSets() {
  const table = tableName('setSummary');
  const raw = await fetchTable(table);
  const records = raw[table] ?? raw.setSummary ?? raw.records ?? raw.data ?? raw;
  const rows = Array.isArray(records) ? records : Object.values(records);
  log(`Got ${rows.length} raw set rows`);

  const sets = rows.map(normaliseSet).filter(Boolean);
  log(`Normalised ${sets.length} sets`);

  if (!SKIP_VALIDATION && ESO_VERSION === 'live') {
    const names = new Set(sets.map(s => s.name));
    const foundCanaries = U49_CANARY_SETS.filter(n => names.has(n));
    if (foundCanaries.length === 0) {
      throw new Error(
        `U49 freshness check FAILED. None of [${U49_CANARY_SETS.join(', ')}] ` +
        `found. Re-run with SKIP_VALIDATION=1 to bypass.`
      );
    }
    log(`✓ U49 canary check passed: found ${foundCanaries.join(', ')}`);
  }

  const seen = new Map();
  for (const s of sets) {
    if (!seen.has(s.id)) seen.set(s.id, s);
  }
  const final = [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
  log(`After dedupe: ${final.length} sets`);

  const toWrite = SAMPLE ? final.slice(0, SAMPLE) : final;

  const setsDir = join(OUT_DIR, 'sets');
  if (!DRY_RUN && existsSync(setsDir)) {
    await rm(setsDir, { recursive: true, force: true });
  }
  for (const set of toWrite) {
    await writeJson(join(setsDir, `${set.id}.json`), set);
  }

  const index = final.map(s => ({ id: s.id, name: s.name, type: s.type, acquisition: s.acquisition }));
  await writeJson(join(OUT_DIR, 'sets-index.json'), index);

  log(`✓ Wrote ${toWrite.length} set files + sets-index.json`);
  return final;
}

async function buildSkills() {
  const primaryTable = tableName('playerSkills');
  const fallbackTable = tableName('minedSkills');
  let raw;
  try {
    raw = await fetchTable(primaryTable);
  } catch (e) {
    warn(`${primaryTable} failed (${e.message}), falling back to ${fallbackTable}`);
    raw = await fetchTable(fallbackTable);
  }
  const records =
    raw[primaryTable] ?? raw[fallbackTable] ??
    raw.playerSkills ?? raw.minedSkills ??
    raw.records ?? raw.data ?? raw;
  const rows = Array.isArray(records) ? records : Object.values(records);
  log(`Got ${rows.length} raw skill rows`);

  const normalised = rows.map(normaliseSkillRow).filter(Boolean);

  if (!SKIP_VALIDATION && ESO_VERSION === 'live') {
    const names = new Set(normalised.map(s => s.name));
    const stillPresent = U49_OBSOLETE_SKILLS.filter(n => names.has(n));
    if (stillPresent.length > 0) {
      warn(`Found U48-era skill names: [${stillPresent.join(', ')}]. Data may be pre-U49.`);
    } else {
      log(`✓ U49 skill rename check passed`);
    }
  }

  const dedup = deduplicateSkills(normalised);
  const filtered = dedup.filter(s => !EXCLUDED_CATEGORIES.has(s.category));
  log(`Deduplicated to ${dedup.length} skills, ${filtered.length} after excluding craft`);

  const final = filtered.sort((a, b) => a.name.localeCompare(b.name));
  const toWrite = SAMPLE ? final.slice(0, SAMPLE) : final;

  const skillsDir = join(OUT_DIR, 'skills');
  if (!DRY_RUN && existsSync(skillsDir)) {
    await rm(skillsDir, { recursive: true, force: true });
  }

  for (const skill of toWrite) {
    const path = join(skillsDir, skill.category, `${skill.slug}.json`);
    await writeJson(path, skill);
  }

  const index = final.map(s => ({
    id: s.id,
    name: s.name,
    category: s.category,
    skill_line: s.skill_line,
  }));
  await writeJson(join(OUT_DIR, 'skills-index.json'), index);

  log(`✓ Wrote ${toWrite.length} skill files + skills-index.json`);
  return final;
}

// ---------- Run ----------
(async () => {
  log(`Output dir: ${OUT_DIR}${DRY_RUN ? ' (DRY RUN)' : ''}${SAMPLE ? ` (SAMPLE=${SAMPLE})` : ''}`);
  try {
    const [sets, skills] = await Promise.all([buildSets(), buildSkills()]);
    log(`Done. ${sets.length} sets, ${skills.length} skills.`);
  } catch (err) {
    console.error('[eso-fetch] ✗ FATAL:', err.message);
    if (process.env.DEBUG) console.error(err.stack);
    process.exit(1);
  }
})();
