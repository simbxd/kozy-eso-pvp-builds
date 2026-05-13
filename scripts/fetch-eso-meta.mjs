#!/usr/bin/env node
/**
 * ESO meta-data scraper — races, mundus stones, traits, enchants (glyphs)
 *
 * Scrapes UESP wiki pages for data not covered by esolog exportJson API.
 * Writes per-entity JSONs to src/content/{races,mundus,traits,enchants}/
 * and flat index files to src/data/eso/.
 *
 * Sources:
 *   Races    https://en.uesp.net/wiki/Online:Races  + 10 individual race pages
 *   Mundus   https://en.uesp.net/wiki/Online:Mundus_Stone
 *   Traits   https://en.uesp.net/wiki/Online:Traits
 *   Enchants https://en.uesp.net/wiki/Online:Glyphs
 *
 * Usage:
 *   node scripts/fetch-eso-meta.mjs
 *   DRY_RUN=1  node scripts/fetch-eso-meta.mjs   # fetch + log, no writes
 *   SAMPLE=3   node scripts/fetch-eso-meta.mjs   # write only first 3 per category
 *   SKIP_VALIDATION=1 node scripts/fetch-eso-meta.mjs
 *
 * Requires: Node 18+, cheerio (npm i -D cheerio)
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { load } from 'cheerio';

// ---------- Config ----------
const CONTENT_DIR      = process.env.CONTENT_DIR || './src/content';
const DATA_DIR         = process.env.DATA_DIR    || './src/data/eso';
const DRY_RUN          = process.env.DRY_RUN === '1';
const SAMPLE           = process.env.SAMPLE ? parseInt(process.env.SAMPLE, 10) : null;
const SKIP_VALIDATION  = process.env.SKIP_VALIDATION === '1';
const FETCH_TIMEOUT_MS = 120_000;

const UESP    = 'https://en.uesp.net';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (eso-data-fetcher; +https://github.com/simbxd/kozy-eso-pvp-builds)',
  'Accept': 'text/html,*/*',
};

// ---------- Utils ----------
const log  = (...a) => console.log('[eso-meta]', ...a);
const warn = (...a) => console.warn('[eso-meta] ⚠', ...a);

// Identical to slugify() in fetch-eso-data.mjs — keep in sync
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

async function fetchHtml(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers: HEADERS, signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
    return res.text();
  } finally {
    clearTimeout(timer);
  }
}

async function writeJson(path, obj) {
  if (DRY_RUN) return;
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

// Strip HTML tags and decode common entities; normalise whitespace.
// Also removes spaces before punctuation that appear when inline tags are replaced.
function stripHtml(el, $) {
  return ($(el).html() || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#160;|&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#[0-9]+;/g, ' ')
    .replace(/&[a-z]+;/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/ ([.%,;!?])/g, '$1')
    .trim();
}

// Extract the Normal→Legendary value range from a cheerio collection of <td> cells.
// Returns "X - Y" using first and last values.
function magnitudeRange($tds, $) {
  const vals = $tds.map((_, td) => $(td).text().trim()).get().filter(Boolean);
  if (vals.length === 0) return '';
  if (vals.length === 1) return vals[0];
  return `${vals[0]} - ${vals[vals.length - 1]}`;
}

// ---------- Parsers ----------

// Parse Online:Races → Map<displayName, { alliance, pageUrl }>
function parseRaceIndex(html) {
  const $   = load(html);
  const map = new Map();
  const alliances = ['Aldmeri Dominion', 'Daggerfall Covenant', 'Ebonheart Pact', 'Other'];

  $('table.wikitable.vtop tbody tr').each((rowIdx, row) => {
    if (rowIdx === 0) return;
    $(row).children('td').each((colIdx, td) => {
      const alliance = alliances[colIdx] ?? 'Other';
      $(td).find('li a').each((_, a) => {
        const name    = $(a).text().trim().split('(')[0].trim();
        const pageUrl = `${UESP}${$(a).attr('href')}`;
        map.set(name, { alliance, pageUrl });
      });
    });
  });

  return map;
}

// Parse an individual race page → race entity object.
// Table columns: icon(rowspan) | name(rowspan) | level | rank-icon | description
// Multiple rows per passive (one per rank). We want only the max-rank description.
// Detection: ≥4 td cells = new passive row; 3 td cells = continuation row.
function parseRacePage(html, name, alliance) {
  const $       = load(html);
  const passives = [];
  let currentName = null;
  let currentDesc = null;

  const flush = () => {
    if (currentName && currentDesc) passives.push({ name: currentName, description: currentDesc });
  };

  $('table.wikitable tbody tr').each((_, row) => {
    const $row    = $(row);
    const tdCount = $row.children('td').length;
    if (tdCount === 0) return; // header row (all <th>)

    if (tdCount >= 4) {
      flush();
      // td[1] = passive name cell (td[0] = icon)
      currentName = $row.children('td').eq(1).find('b a, b').first().text().trim();
      currentDesc = null;
    }

    // Description is always the last td of any row (new or continuation)
    const descText = stripHtml($row.children('td').last()[0], $);
    if (descText && descText.length > 5) currentDesc = descText;
  });
  flush();

  return {
    id:             slugify(name),
    name,
    alliance,
    passives,
    patch_verified: 'U49',
    uesp_url:       `${UESP}/wiki/Online:${name.replace(/ /g, '_')}`,
  };
}

// Parse Online:Mundus_Stone.
// Table: Stone(th) | Location×4(td) | Effect(td) | Value(td) | Full Divines(td)
function parseMundus(html) {
  const $       = load(html);
  const results = [];

  $('table.wikitable tbody tr').each((_, row) => {
    const $row = $(row);
    const $th  = $row.children('th').first();
    if (!$th.length) return;

    const $a  = $th.find('a').first();
    const name = $a.text().trim();
    if (!name.startsWith('The ')) return;

    const href      = $a.attr('href') || '';
    const tds       = $row.children('td');
    // td[0..3] = locations, td[4] = Effect, td[5] = Value, td[6] = Full Divines
    const effect     = $(tds[4]).text().trim();
    const valueRaw   = $(tds[5]).text().trim();
    const divinesRaw = $(tds[6]).text().trim();
    if (!effect) return;

    // Parse value: plain int or %-string
    const toVal = (raw) => {
      if (!raw) return undefined;
      if (raw.endsWith('%')) return raw;
      const n = Number(raw.replace(/,/g, ''));
      return Number.isFinite(n) ? n : raw;
    };

    const entry = {
      id:             slugify(name),
      name,
      effect,
      value_base:    toVal(valueRaw),
      patch_verified: 'U49',
      uesp_url:      href ? `${UESP}${href}` : `${UESP}/wiki/Online:${name.replace(/ /g, '_')}`,
    };
    const vd = toVal(divinesRaw);
    if (vd !== undefined) entry.value_divines = vd;
    results.push(entry);
  });

  return results;
}

// Parse Online:Traits.
// 5 wikitables: [0]=weapon [1]=armor [2]=jewelry [3]=common (skip) [4]=research (skip)
// Weapon traits may have 1H/2H sub-rows (rowspan="2" on <th>).
// Jewelry Triune has rowspan="2" for two stat ranges (not 1H/2H).
// Composite slug only for names that appear in multiple categories.
function parseTraits(html) {
  const $ = load(html);
  const TABLE_CATEGORIES = { 0: 'weapon', 1: 'armor', 2: 'jewelry' };
  const results = [];

  $('table.wikitable').each((tableIdx, table) => {
    const category = TABLE_CATEGORIES[tableIdx];
    if (!category) return;

    const rows = $(table).find('tbody tr').toArray();
    let i = 0;

    while (i < rows.length) {
      const $row = $(rows[i]);
      const $th  = $row.children('th').first();

      // Only process rows that open a new trait (th with a link to an Online: page)
      const $link = $th.find('a[href*="/wiki/Online:"]').first();
      if (!$link.length) { i++; continue; }

      const name    = $link.text().trim();
      if (!name) { i++; continue; }

      const href       = $link.attr('href') || '';
      const hasSubrows = parseInt($th.attr('rowspan') || '1', 10) >= 2;

      // Description: last non-img, non-esoqc, length>3 td (avoids "1H"/"2H" label cells)
      const $tds   = $row.children('td');
      const descTd = $tds.toArray()
        .filter(td =>
          !/esoqc/.test($(td).attr('class') || '') &&
          !$(td).find('img').length &&
          $(td).text().trim().length > 3
        )
        .pop();
      const effect = descTd ? stripHtml(descTd, $) : '';

      // Magnitude values: last 5 tds of the row
      const valueTds1 = $tds.toArray().slice(-5);
      const range1    = magnitudeRange($(valueTds1), $);

      let value_range;
      if (hasSubrows && i + 1 < rows.length) {
        const nextTds = $(rows[i + 1]).children('td').toArray().slice(-5);
        const range2  = magnitudeRange($(nextTds), $);
        // Weapon: label 1H/2H. Other categories (e.g. Triune jewelry): plain ranges.
        value_range = category === 'weapon'
          ? `1H: ${range1} / 2H: ${range2}`
          : `${range1} / ${range2}`;
        i += 2;
      } else {
        value_range = range1;
        i++;
      }

      results.push({
        id:             slugify(name), // composite suffix added below
        name,
        category,
        effect,
        value_range,
        patch_verified: 'U49',
        uesp_url:       href ? `${UESP}${href}` : `${UESP}/wiki/Online:${name.replace(/ /g, '_')}`,
      });
    }
  });

  // Post-process: composite slug only for names appearing in multiple categories
  const nameCount = new Map();
  for (const t of results) nameCount.set(t.name, (nameCount.get(t.name) || 0) + 1);
  for (const t of results) {
    if (nameCount.get(t.name) > 1) t.id = `${t.id}-${t.category}`;
  }

  return results;
}

// Parse Online:Glyphs → enchants.
// 4 wikitables: [0]=Glyph Strengths (skip), [1]=weapon, [2]=armor, [3]=jewelry
// Columns: Glyph(link) | Icon | Effect | Potency Rune (Add/Sub) | Essence Rune
function parseGlyphs(html) {
  const $          = load(html);
  const results    = [];
  const categories = ['weapon', 'armor', 'jewelry'];
  const tables     = $('table.wikitable').toArray();

  // tables[0] = Glyph Strengths (reference only) — skip; tables[1..3] = actual glyph tables
  tables.slice(1).forEach((table, idx) => {
    const category = categories[idx];
    if (!category) return;

    $(table).find('tr').each((rowIdx, row) => {
      if (rowIdx === 0) return; // header
      const tds = $(row).find('td');
      if (tds.length < 4) return;

      const $a  = $(tds[0]).find('a').first();
      const name = $a.text().trim();
      if (!name.startsWith('Glyph')) return;

      const href       = $a.attr('href') || '';
      const effect     = stripHtml(tds[2], $);
      const essenceRune = $(tds[4]).text().trim();

      const entry = {
        id:             slugify(name),
        name,
        category,
        effect,
        patch_verified: 'U49',
        uesp_url:       href ? `${UESP}${href}` : `${UESP}/wiki/Online:${name.replace(/ /g, '_')}`,
      };
      if (essenceRune) entry.rune_prefix = essenceRune;
      results.push(entry);
    });
  });

  return results;
}

// ---------- Builders ----------

async function buildRaces() {
  const indexHtml = await fetchHtml(`${UESP}/wiki/Online:Races`);
  const raceIndex = parseRaceIndex(indexHtml);
  log(`Race index: ${raceIndex.size} races found`);

  // Fetch all race pages in parallel
  const entries = [...raceIndex.entries()];
  const races   = await Promise.all(
    entries.map(([name, { alliance, pageUrl }]) =>
      fetchHtml(pageUrl).then(html => parseRacePage(html, name, alliance))
    )
  );
  races.sort((a, b) => a.name.localeCompare(b.name));
  log(`Parsed ${races.length} races`);

  if (!SKIP_VALIDATION) {
    if (!races.find(r => r.name === 'Imperial')) {
      throw new Error('Validation FAILED: race "Imperial" not found. Re-run with SKIP_VALIDATION=1 to bypass.');
    }
    log('✓ Race canary check passed: Imperial present');
  }

  const dir     = join(CONTENT_DIR, 'races');
  await mkdir(dir, { recursive: true });
  const toWrite = SAMPLE ? races.slice(0, SAMPLE) : races;
  let written = 0, skipped = 0;

  for (const race of toWrite) {
    const dest = join(dir, `${race.id}.json`);
    if (existsSync(dest)) { skipped++; continue; }
    await writeJson(dest, race);
    written++;
  }
  log(`✓ Races: ${written} written, ${skipped} skipped (curated)`);

  const index = races.map(r => ({ id: r.id, name: r.name, alliance: r.alliance }));
  await writeJson(join(DATA_DIR, 'races-index.json'), index);
  log('✓ races-index.json written');

  return written;
}

async function buildMundus() {
  const html   = await fetchHtml(`${UESP}/wiki/Online:Mundus_Stone`);
  const stones = parseMundus(html);
  log(`Parsed ${stones.length} mundus stones`);

  if (!SKIP_VALIDATION) {
    if (!stones.find(s => s.name === 'The Apprentice')) {
      throw new Error('Validation FAILED: mundus "The Apprentice" not found. Re-run with SKIP_VALIDATION=1 to bypass.');
    }
    log('✓ Mundus canary check passed: The Apprentice present');
  }

  const dir     = join(CONTENT_DIR, 'mundus');
  await mkdir(dir, { recursive: true });
  const toWrite = SAMPLE ? stones.slice(0, SAMPLE) : stones;
  let written = 0, skipped = 0;

  for (const stone of toWrite) {
    const dest = join(dir, `${stone.id}.json`);
    if (existsSync(dest)) { skipped++; continue; }
    await writeJson(dest, stone);
    written++;
  }
  log(`✓ Mundus: ${written} written, ${skipped} skipped (curated)`);

  const index = stones.map(s => ({
    id: s.id, name: s.name, effect: s.effect, value_base: s.value_base,
  }));
  await writeJson(join(DATA_DIR, 'mundus-index.json'), index);
  log('✓ mundus-index.json written');

  return written;
}

async function buildTraits() {
  const html   = await fetchHtml(`${UESP}/wiki/Online:Traits`);
  const traits = parseTraits(html);
  log(`Parsed ${traits.length} traits`);

  if (!SKIP_VALIDATION) {
    if (!traits.find(t => t.name === 'Divines' && t.category === 'armor')) {
      throw new Error('Validation FAILED: trait "Divines" (armor) not found. Re-run with SKIP_VALIDATION=1 to bypass.');
    }
    log('✓ Trait canary check passed: Divines (armor) present');
  }

  const dir     = join(CONTENT_DIR, 'traits');
  await mkdir(dir, { recursive: true });
  const toWrite = SAMPLE ? traits.slice(0, SAMPLE) : traits;
  let written = 0, skipped = 0;

  for (const trait of toWrite) {
    const dest = join(dir, `${trait.id}.json`);
    if (existsSync(dest)) { skipped++; continue; }
    await writeJson(dest, trait);
    written++;
  }
  log(`✓ Traits: ${written} written, ${skipped} skipped (curated)`);

  const index = traits.map(t => ({
    id: t.id, name: t.name, category: t.category, value_range: t.value_range,
  }));
  await writeJson(join(DATA_DIR, 'traits-index.json'), index);
  log('✓ traits-index.json written');

  return written;
}

async function buildEnchants() {
  const html     = await fetchHtml(`${UESP}/wiki/Online:Glyphs`);
  const enchants = parseGlyphs(html);
  log(`Parsed ${enchants.length} enchants`);

  if (!SKIP_VALIDATION) {
    if (!enchants.find(e => e.name === 'Glyph of Magicka')) {
      throw new Error('Validation FAILED: enchant "Glyph of Magicka" not found. Re-run with SKIP_VALIDATION=1 to bypass.');
    }
    log('✓ Enchant canary check passed: Glyph of Magicka present');
  }

  const dir     = join(CONTENT_DIR, 'enchants');
  await mkdir(dir, { recursive: true });
  const toWrite = SAMPLE ? enchants.slice(0, SAMPLE) : enchants;
  let written = 0, skipped = 0;

  for (const enchant of toWrite) {
    const dest = join(dir, `${enchant.id}.json`);
    if (existsSync(dest)) { skipped++; continue; }
    await writeJson(dest, enchant);
    written++;
  }
  log(`✓ Enchants: ${written} written, ${skipped} skipped (curated)`);

  const index = enchants.map(e => ({
    id: e.id, name: e.name, category: e.category,
    ...(e.rune_prefix ? { rune_prefix: e.rune_prefix } : {}),
    effect: e.effect,
  }));
  await writeJson(join(DATA_DIR, 'enchants-index.json'), index);
  log('✓ enchants-index.json written');

  return written;
}

// ---------- Run ----------
(async () => {
  log(`Content → ${CONTENT_DIR}/ | Data → ${DATA_DIR}/${DRY_RUN ? ' (DRY RUN)' : ''}${SAMPLE ? ` (SAMPLE=${SAMPLE})` : ''}`);
  try {
    const [races, mundus, traits, enchants] = await Promise.all([
      buildRaces(),
      buildMundus(),
      buildTraits(),
      buildEnchants(),
    ]);
    log(`Done. ${races} races, ${mundus} mundus, ${traits} traits, ${enchants} enchants written.`);
  } catch (err) {
    console.error('[eso-meta] ✗ FATAL:', err.message);
    if (process.env.DEBUG) console.error(err.stack);
    process.exit(1);
  }
})();
