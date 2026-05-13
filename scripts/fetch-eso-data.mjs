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

import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

// ---------- Config ----------
const UESP_BASE = 'https://esolog.uesp.net/exportJson.php';
// Sets go directly into src/content/sets/ (single source of truth)
// Skills + index files stay in src/data/eso/ (used by gen-decap-config.mjs)
const SETS_DIR   = process.env.SETS_DIR   || './src/content';
const SKILLS_DIR = process.env.SKILLS_DIR || './src/data/eso';
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

// Valid class names from UESP classType field (already human-readable strings)
const VALID_CLASSES = new Set([
  'Dragonknight', 'Sorcerer', 'Nightblade', 'Templar',
  'Warden', 'Necromancer', 'Arcanist',
]);

// skillType → class name (for non-class skills, skillType != "1")
const SKILL_TYPE_TO_CLASS = {
  '2': 'Weapon', '3': 'Armor',        '4': 'World',
  '5': 'Guild',  '6': 'Alliance War', '7': 'Racial', '8': 'Craft',
};

// mechanic value → resource name
const MECHANIC_TO_RESOURCE = {
  '0': 'None', '1': 'Magicka', '2': 'Health', '4': 'Stamina', '6': 'Ultimate',
};

// Craft skills excluded — not relevant for PvP builds
const EXCLUDED_CLASS = new Set(['Craft']);

function parseSkillRow(row) {
  const name = row.name ?? row.skillName ?? row.abilityName;
  if (!name) return null;
  if (String(name).startsWith('_')) return null;

  return {
    numericId: String(row.abilityId ?? row.id ?? ''),
    name:      String(name).trim(),
    skillType: String(row.skillType  ?? '').trim(),
    classType: String(row.classType  ?? '').trim(),
    skillLine: String(row.skillLine  ?? row.line ?? '').trim(),
    isPassive: String(row.isPassive  ?? '0').trim(),
    morph:     String(row.morph      ?? '0').trim(),
    prevSkill: String(row.prevSkill  ?? '0').trim(),
    nextSkill: String(row.nextSkill  ?? '0').trim(),
    mechanic:  String(row.mechanic   ?? '0').trim(),
    rank:      parseInt(row.rank ?? 0, 10) || 0,
  };
}

// Map every numeric ability ID → {name, slug}.
function buildIdMap(parsed) {
  const map = new Map();
  for (const r of parsed) {
    if (r.numericId && r.numericId !== '0' && r.numericId !== '-1' && !map.has(r.numericId)) {
      map.set(r.numericId, { name: r.name, slug: slugify(r.name) });
    }
  }
  return map;
}

// Dedup by skillLine::name. Keep highest-rank row for display fields,
// but keep lowest-rank row's morph/prevSkill — rank 1 of a morph always
// points directly to the base skill (rank 1 too), enabling sibling resolution.
function deduplicateByName(parsed) {
  const byKey = new Map();
  for (const r of parsed) {
    const key = `${r.skillLine}::${r.name}`;
    const cur = byKey.get(key);
    if (!cur) {
      byKey.set(key, { rep: r, minRankRow: r });
    } else {
      if (r.rank > cur.rep.rank) cur.rep = r;
      if (r.rank < cur.minRankRow.rank) cur.minRankRow = r;
    }
  }
  return [...byKey.values()].map(({ rep, minRankRow }) => ({
    ...rep,
    // Use rank-1 data for morph relationship fields
    morph:     minRankRow.morph,
    prevSkill: minRankRow.prevSkill,
    nextSkill: minRankRow.nextSkill,
  }));
}

// Build prevSkillId → [{slug, name}] for sibling lookup.
// Both morphs of a base skill share the same rank-1 prevSkill ID.
function buildSiblingMap(deduped) {
  const map = new Map();
  for (const r of deduped) {
    if (r.morph === '0' || !r.prevSkill || r.prevSkill === '0' || r.prevSkill === '-1') continue;
    if (!map.has(r.prevSkill)) map.set(r.prevSkill, []);
    map.get(r.prevSkill).push({ slug: slugify(r.name), name: r.name });
  }
  return map;
}

function deriveClass(skillType, classType) {
  if (skillType === '1' && VALID_CLASSES.has(classType)) return classType;
  return SKILL_TYPE_TO_CLASS[skillType] ?? 'World';
}

function deriveType(isPassive, mechanic) {
  if (isPassive === '1') return 'Passive';
  if (mechanic.split(',').some(m => m.trim() === '6')) return 'Ultimate';
  return 'Active';
}

function deriveResource(mechanic) {
  const first = mechanic.split(',')[0].trim();
  return MECHANIC_TO_RESOURCE[first] ?? 'None';
}

function normaliseToCurated(r, idMap, siblingMap) {
  const slug       = slugify(r.name);
  const skillClass = deriveClass(r.skillType, r.classType);
  const classSlug  = slugify(skillClass);
  const lineSlug   = slugify(r.skillLine);

  let baseSkillName = null;
  let morphOf       = null;
  let morphSibling  = null;

  if (r.morph !== '0' && r.prevSkill && r.prevSkill !== '0' && r.prevSkill !== '-1') {
    const base = idMap.get(r.prevSkill);
    if (base) { baseSkillName = base.name; morphOf = base.slug; }

    const siblings = siblingMap.get(r.prevSkill) ?? [];
    const other    = siblings.find(s => s.slug !== slug);
    if (other) morphSibling = other.slug;
  }

  return {
    id:             slug,
    name:           r.name,
    base_skill:     baseSkillName,
    morph_of:       morphOf,
    morph_sibling:  morphSibling,
    class:          skillClass,
    skill_line:     r.skillLine,
    skill_line_id:  lineSlug,
    type:           deriveType(r.isPassive, r.mechanic),
    resource:       deriveResource(r.mechanic),
    icon:           `/assets/skills/${slug}.png`,
    patch_verified: 'U49',
    esohub_url:     `https://eso-hub.com/en/skills/${classSlug}/${lineSlug}/${slug}`,
    uesp_url:       `https://en.uesp.net/wiki/Online:${r.name.replace(/ /g, '_')}`,
  };
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

  // Write sets directly to src/content/sets/ — skip files that already exist
  // (curated sets are manually maintained and must not be overwritten)
  const setsDir = join(SETS_DIR, 'sets');
  await mkdir(setsDir, { recursive: true });
  let written = 0, skipped = 0;
  for (const set of toWrite) {
    const dest = join(setsDir, `${set.id}.json`);
    if (existsSync(dest)) { skipped++; continue; }
    await writeJson(dest, set);
    written++;
  }
  log(`✓ Sets: ${written} written, ${skipped} skipped (curated)`);

  const index = final.map(s => ({ id: s.id, name: s.name, type: s.type, acquisition: s.acquisition }));
  await writeJson(join(SKILLS_DIR, 'sets-index.json'), index);

  log(`✓ sets-index.json written`);
  return final;
}

async function buildSkills() {
  const primaryTable  = tableName('playerSkills');
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

  const parsed = rows.map(parseSkillRow).filter(Boolean);

  if (!SKIP_VALIDATION && ESO_VERSION === 'live') {
    const names = new Set(parsed.map(s => s.name));
    const stillPresent = U49_OBSOLETE_SKILLS.filter(n => names.has(n));
    if (stillPresent.length > 0) {
      warn(`Found U48-era skill names: [${stillPresent.join(', ')}]. Data may be pre-U49.`);
    } else {
      log(`✓ U49 skill rename check passed`);
    }
  }

  // Build morph ID lookup before dedup (covers all rank variants)
  const idMap      = buildIdMap(parsed);
  const deduped    = deduplicateByName(parsed);
  const siblingMap = buildSiblingMap(deduped);

  const curated  = deduped
    .map(r => normaliseToCurated(r, idMap, siblingMap))
    .filter(s => !EXCLUDED_CLASS.has(s.class));

  log(`Deduplicated to ${deduped.length} skills, ${curated.length} after excluding Craft`);

  const final   = curated.sort((a, b) => a.name.localeCompare(b.name));
  const toWrite = SAMPLE ? final.slice(0, SAMPLE) : final;

  // Write to src/content/skills/ — skip curated files that already exist
  const skillsDir = join(SETS_DIR, 'skills');
  await mkdir(skillsDir, { recursive: true });
  let written = 0, skipped = 0;
  for (const skill of toWrite) {
    const dest = join(skillsDir, `${skill.id}.json`);
    if (existsSync(dest)) { skipped++; continue; }
    await writeJson(dest, skill);
    written++;
  }
  log(`✓ Skills: ${written} written, ${skipped} skipped (curated)`);

  const index = final.map(s => ({
    id:            s.id,
    name:          s.name,
    class:         s.class,
    skill_line:    s.skill_line,
    skill_line_id: s.skill_line_id,
    type:          s.type,
    icon:          s.icon,
    morph_of:      s.morph_of,
  }));
  await writeJson(join(SKILLS_DIR, 'skills-index.json'), index);
  log(`✓ skills-index.json written`);

  // skill-lines-index.json — class lines only (7 classes × 3 lines = 21 entries)
  const lineMap = new Map();
  for (const s of final) {
    if (!VALID_CLASSES.has(s.class)) continue;
    if (lineMap.has(s.skill_line_id)) {
      const existing = lineMap.get(s.skill_line_id);
      if (existing.class !== s.class) {
        throw new Error(
          `skill_line_id collision: "${s.skill_line_id}" used by both "${existing.class}" and "${s.class}"`
        );
      }
      continue;
    }
    lineMap.set(s.skill_line_id, {
      id:             s.skill_line_id,
      name:           s.skill_line,
      class:          s.class,
      class_id:       slugify(s.class),
      icon:           `/assets/skill-lines/${s.skill_line_id}.png`,
      patch_verified: 'U49',
    });
  }
  const skillLines = [...lineMap.values()].sort(
    (a, b) => a.class.localeCompare(b.class) || a.name.localeCompare(b.name)
  );
  await writeJson(join(SKILLS_DIR, 'skill-lines-index.json'), skillLines);
  log(`✓ skill-lines-index.json written (${skillLines.length} entries)`);

  return final;
}

// ---------- Run ----------
(async () => {
  log(`Sets → ${SETS_DIR}/sets/ | Skills → ${SKILLS_DIR}/skills/${DRY_RUN ? ' (DRY RUN)' : ''}${SAMPLE ? ` (SAMPLE=${SAMPLE})` : ''}`);
  try {
    const [sets, skills] = await Promise.all([buildSets(), buildSkills()]);
    log(`Done. ${sets.length} sets, ${skills.length} skills.`);
  } catch (err) {
    console.error('[eso-fetch] ✗ FATAL:', err.message);
    if (process.env.DEBUG) console.error(err.stack);
    process.exit(1);
  }
})();
