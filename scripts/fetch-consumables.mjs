#!/usr/bin/env node
/**
 * ESO Consumables scraper — hardcoded item manifest.
 *
 * Two data sources, same output format:
 *   - esolog minedItem API  (food, drinks, Alliance Draughts)
 *   - UESP alchemy-effect pages  (crafted potions & poisons — no dedicated item pages exist)
 *
 * Output:
 *   src/content/consumables/{id}.json  (flat — no type subdirectory)
 *   data/consumables/_failed.json      (only written if errors)
 *
 * Usage:
 *   node scripts/fetch-consumables.mjs
 *
 * To add/remove items edit ITEMS below.
 * Requires: Node 22+ (native fetch), cheerio (devDep).
 */

import * as cheerio from 'cheerio';
import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';

// ---------- Config ----------

const ROOT    = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const OUT_DIR = join(ROOT, 'src/content/consumables');
const DELAY_MS = 700;

const HEADERS = {
  'User-Agent': 'eso-pvp-builds-dataset/1.0 (+https://github.com/simbxd/kozy-eso-pvp-builds)',
  'Accept': 'text/html,application/json,*/*',
};

// ---------- Item manifest ----------
//
// Each entry is ONE of:
//   { source:'esolog',  esologId:'153629', type:'food',   name:'Bewitched Sugar Skulls' }
//   { source:'uesp',    uespUrl:'https://en.uesp.net/wiki/Online:Restore_Health',
//                       section:'potion',  type:'potion', name:'Essence of Health' }
//
// UESP section = 'potion' | 'poison'  (which wikitable to read on the effect page)
//
// WHY esolog IDs:
//   Food/drink and Alliance Draughts have dedicated item pages on esoitem.uesp.net.
//   The minedItem endpoint returns a clean abilityDesc string — no scraping needed.
//
// WHY UESP effect pages for potions/poisons:
//   Crafted ESO potions (Essence of X) and poisons (X Poison IX) have NO individual
//   UESP pages. They are documented only as rows in the alchemy-effect tables on pages
//   like Online:Restore_Health. The 404 URLs in the original spec confirmed this.
//
// WHY Cloudy Damage Health Poison IX is absent:
//   No UESP page exists for this item (not under Online:Cloudy_Damage_Health or any
//   variant). Add it back when UESP creates a page or if you find another source.

const ITEMS = [

  // ── Potions (UESP effect pages) ─────────────────────────────────────────────
  { source: 'uesp', section: 'potion', type: 'potion',
    name: 'Essence of Health',
    uespUrl: 'https://en.uesp.net/wiki/Online:Restore_Health' },

  { source: 'uesp', section: 'potion', type: 'potion',
    name: 'Essence of Spell Power',
    uespUrl: 'https://en.uesp.net/wiki/Online:Increase_Spell_Power' },

  { source: 'uesp', section: 'potion', type: 'potion',
    name: 'Essence of Weapon Power',
    uespUrl: 'https://en.uesp.net/wiki/Online:Increase_Weapon_Power' },

  { source: 'uesp', section: 'potion', type: 'potion',
    name: 'Essence of Immovability',
    uespUrl: 'https://en.uesp.net/wiki/Online:Unstoppable' },   // effect page is "Unstoppable"

  { source: 'uesp', section: 'potion', type: 'potion',
    name: 'Essence of Invisibility',
    uespUrl: 'https://en.uesp.net/wiki/Online:Invisible' },     // effect page is "Invisible"

  { source: 'uesp', section: 'potion', type: 'potion',
    name: 'Essence of Detection',
    uespUrl: 'https://en.uesp.net/wiki/Online:Detection' },

  { source: 'uesp', section: 'potion', type: 'potion',
    name: 'Essence of Speed',
    uespUrl: 'https://en.uesp.net/wiki/Online:Speed' },

  { source: 'uesp', section: 'potion', type: 'potion',
    name: 'Essence of Spell Critical',
    uespUrl: 'https://en.uesp.net/wiki/Online:Spell_Critical' },

  { source: 'uesp', section: 'potion', type: 'potion',
    name: 'Essence of Weapon Critical',
    uespUrl: 'https://en.uesp.net/wiki/Online:Weapon_Critical' },

  // ── Alliance Draughts (esolog — purchased from PvP merchants, not crafted) ──
  { source: 'esolog', type: 'potion', name: 'Alliance Battle Draught',  esologId: '71073' },
  { source: 'esolog', type: 'potion', name: 'Alliance Spell Draught',   esologId: '71072' },
  { source: 'esolog', type: 'potion', name: 'Alliance Health Draught',  esologId: '71071' },

  // ── Poisons (UESP effect pages) ─────────────────────────────────────────────
  // "Creeping Ravage Health" was renamed "Gradual Ravage Health" post-U35 on UESP
  { source: 'uesp', section: 'poison', type: 'poison',
    name: 'Creeping Ravage Health',
    uespUrl: 'https://en.uesp.net/wiki/Online:Gradual_Ravage_Health' },

  { source: 'uesp', section: 'poison', type: 'poison',
    name: 'Damage Health Poison IX',
    uespUrl: 'https://en.uesp.net/wiki/Online:Ravage_Health' },

  { source: 'uesp', section: 'poison', type: 'poison',
    name: 'Drain Health Poison IX',
    uespUrl: 'https://en.uesp.net/wiki/Online:Restore_Health' },

  // Cloudy Damage Health Poison IX: no UESP page found — excluded
  // Add back once a source is located.

  // ── Food (esolog) ────────────────────────────────────────────────────────────
  { source: 'esolog', type: 'food',  name: 'Bewitched Sugar Skulls',               esologId: '153629' },
  { source: 'esolog', type: 'food',  name: 'Artaeum Pickled Fish Bowl',             esologId: '139016' },
  { source: 'esolog', type: 'food',  name: "Orzorga's Smoked Bear Haunch",          esologId: '71059'  },
  { source: 'esolog', type: 'food',  name: 'Lava Foot Soup-and-Saltrice',           esologId: '112425' },
  { source: 'esolog', type: 'food',  name: 'Braised Rabbit with Spring Vegetables', esologId: '68247'  },

  // ── Drinks (esolog) ──────────────────────────────────────────────────────────
  { source: 'esolog', type: 'drink', name: "Witchmother's Potent Brew",  esologId: '87697' },
  { source: 'esolog', type: 'drink', name: 'Ghastly Eye Bowl',           esologId: '87695' },
];

// ---------- Utils ----------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function toId(name) {
  return String(name)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[''']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function stripColorCodes(str) {
  // ESO item link color codes: |cRRGGBBtext|r  and  |Htype:...|htext|h
  return (str || '')
    .replace(/\|c[0-9a-f]{6}([\s\S]*?)\|r/gi, '$1')
    .replace(/\|H[^|]+\|h([^|]*)\|h/g, '$1')
    .trim();
}

// Canonical stat names (max first so "Max Health" matches before "Health")
const FOOD_STATS = [
  ['Max Health',             'Maximum Health'],
  ['Max Stamina',            'Maximum Stamina'],
  ['Max Magicka',            'Maximum Magicka'],
  ['Health Recovery',        'Health Recovery'],
  ['Stamina Recovery',       'Stamina Recovery'],
  ['Magicka Recovery',       'Magicka Recovery'],
  ['Maximum Health',         'Maximum Health'],
  ['Maximum Stamina',        'Maximum Stamina'],
  ['Maximum Magicka',        'Maximum Magicka'],
];

async function fetchHtml(url) {
  const r = await fetch(url, { headers: HEADERS });
  if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}`);
  return r.text();
}

async function writeJson(filePath, obj) {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

function subdirFor(type) {
  if (type === 'potion') return 'potions';
  if (type === 'poison') return 'poisons';
  return 'food'; // food + drink
}

// ---------- Parser A: esolog minedItem API ----------

async function parseEsologItem(cfg) {
  const url = `https://esolog.uesp.net/exportJson.php?table=minedItem&id=${cfg.esologId}`;
  const r = await fetch(url, { headers: HEADERS });
  if (!r.ok) throw new Error(`esolog HTTP ${r.status}`);
  const j = await r.json();
  const raw = j.minedItem?.[0];
  if (!raw) throw new Error(`No esolog record for id=${cfg.esologId}`);

  const desc = stripColorCodes(raw.abilityDesc || '');

  const effects = [];

  if (cfg.type === 'food' || cfg.type === 'drink') {
    // Parse "Increase Max Health by 4620, Max Stamina and Magicka by 4250 ..."
    // One regex pass: find every "by NUMBER" preceded by stat keywords
    const seen = new Set();
    for (const [alias, canonical] of FOOD_STATS) {
      if (seen.has(canonical)) continue;
      // Find alias in desc, then nearest "by NUMBER"
      const re = new RegExp(alias.replace(/ /g, '\\s+') + '[^.\\n]{0,120}?by\\s*([\\d,]+)', 'i');
      const m = desc.match(re);
      if (m) {
        const val = parseInt(m[1].replace(/,/g, ''), 10);
        if (!isNaN(val) && val > 0) {
          seen.add(canonical);
          effects.push({ stat: canonical, value: val });
        }
      }
    }
  } else {
    // Potion / drain — use the full abilityDesc as one block
    if (desc) effects.push({ description: desc });
  }

  // Duration: look for "N hours" or "N.N seconds"
  let duration_seconds = null;
  const dh = desc.match(/(\d+(?:\.\d+)?)\s*hours?/i);
  const dm = desc.match(/(\d+(?:\.\d+)?)\s*minutes?/i);
  const ds = desc.match(/(\d+(?:\.\d+)?)\s*seconds?/i);
  if (dh)       duration_seconds = Math.round(parseFloat(dh[1]) * 3600);
  else if (dm)  duration_seconds = Math.round(parseFloat(dm[1]) * 60);
  else if (ds)  duration_seconds = Math.round(parseFloat(ds[1]));

  const crafted  = raw.craftType === '5'; // 5 = provisioning/alchemy crafted

  const obj = {
    id:             toId(cfg.name),
    name:           cfg.name,
    type:           cfg.type,
    patch_verified: 'U49',
    uesp_url:       `https://esoitem.uesp.net/itemLink.php?itemid=${raw.itemId}&quality=${raw.quality}&lang=en`,
  };

  if (effects.length)       obj.effects           = effects;
  if (duration_seconds)     obj.duration_seconds  = duration_seconds;
  obj.crafted  = crafted;

  return obj;
}

// ---------- Parser B: UESP alchemy-effect page ----------
//
// These pages are structured as:
//   <p> "Potion description: [template]Poison description: [template]"
//   <table> infobox with reagents
//   <table> wikitable — potion tiers (last row = Lorkhan's Tears / Essence of X)
//   <table> wikitable — poison tiers (last row = Alkahest / X Poison IX)
//   <tables> formula ingredient combinations

async function parseUespEffectPage(cfg) {
  const html = await fetchHtml(cfg.uespUrl);
  const $    = cheerio.load(html);

  // ── Description template ─────────────────────────────────────────────────────
  // "Potion description: ... (cooldown)Poison description: ..."
  let potionDesc = '';
  let poisonDesc = '';
  $('.mw-parser-output > p').each((_, p) => {
    const text = $(p).text();
    if (text.includes('description:')) {
      const pm = text.match(/Potion description:\s*(.+?)(?=Poison description:|$)/s);
      const xm = text.match(/Poison description:\s*(.+)/s);
      if (pm) potionDesc = pm[1].replace(/\s+/g, ' ').trim();
      if (xm) poisonDesc = xm[1].replace(/\s+/g, ' ').trim();
    }
  });

  // ── Reagents: read from the "Availability" infobox (first table, ingredient links) ──
  // The infobox lists every ingredient that has this effect — clean, no effect-name noise.
  // The formula tables mix ingredient names with effect names in the same rows; avoid them.
  const reagents = $('table').first()
    .find('a[href*="/wiki/Online:"]')
    .map((_, a) => $(a).text().trim())
    .get()
    .filter(r => r.length > 2);

  // ── Wikitables: find potion and poison tier tables (identified by "Solvent" header) ──
  const tier = { potion: null, poison: null };

  $('table.wikitable').each((_, tbl) => {
    const headers = $(tbl).find('tr').first()
      .find('th').map((_, th) => $(th).text().trim().toLowerCase()).get();

    if (headers.includes('solvent')) {
      const section = headers.some(h => h.includes('poison')) ? 'poison' : 'potion';
      if (!tier[section]) { // take the first (and only) table per section
        const last  = $(tbl).find('tr').last();
        const cells = last.find('td, th').map((_, c) => $(c).text().trim()).get();
        tier[section] = { headers, cells };
      }
    }
  });

  const t     = tier[cfg.section];
  const rawDesc = cfg.section === 'potion' ? potionDesc : poisonDesc;

  if (!t) throw new Error(`No ${cfg.section} table found on ${cfg.uespUrl}`);

  // ── Map header → cell value ───────────────────────────────────────────────────
  const row = Object.fromEntries(t.headers.map((h, i) => [h, t.cells[i] ?? '']));

  // Item name from 3rd cell (index 2 in "Solvent | Level | Name | ...")
  const itemName   = t.cells[2] ?? cfg.name;
  // Duration: look for a "duration" column, or parse from description
  const durCol     = Object.entries(row).find(([h]) => h.includes('duration') && !h.includes('triple'));
  const durRaw     = durCol ? durCol[1] : '';
  const durSecs    = durRaw ? Math.round(parseFloat(durRaw) * 1) : null; // value is already in seconds on UESP

  // Build the effect description by substituting [M] and [D] in the template
  // First numeric column (after name) = amount [M], duration column = [D]
  const numerics = t.cells.slice(3).filter(v => v.match(/^[\d.]+$/));
  const M        = numerics[0] ?? '';
  const D        = durRaw || numerics[numerics.length - 2] || '';

  let effectDesc = rawDesc
    .replace(/\s*\(\d+\s*second\s*cooldown\)/gi, '')
    .replace(/\[M\]/g, M)
    .replace(/\[D\]/g, D)
    .replace(/\s+/g, ' ')
    .trim();

  // Fallback: build a minimal description from available data
  if (!effectDesc) {
    effectDesc = `${itemName}` + (D ? ` (${D} seconds)` : '');
  }

  const obj = {
    id:             toId(cfg.name),
    name:           cfg.name,
    type:           cfg.type,
    patch_verified: 'U49',
    uesp_url:       cfg.uespUrl,
  };

  if (effectDesc) obj.effects = [{ description: effectDesc }];
  if (durSecs && durSecs > 0 && cfg.type !== 'potion') obj.duration_seconds = durSecs; // duration only meaningful for food/drink
  if (reagents.length)  obj.reagents = reagents;
  obj.crafted = true; // all UESP effect page items are craftable

  return obj;
}

// ---------- Main ----------

async function main() {
  console.log(`Out → ${OUT_DIR}`);
  console.log(`Processing ${ITEMS.length} items…\n`);

  const failures = [];

  for (const cfg of ITEMS) {
    try {
      let item;
      if (cfg.source === 'esolog') {
        item = await parseEsologItem(cfg);
      } else {
        item = await parseUespEffectPage(cfg);
      }

      const dest = join(OUT_DIR, `${item.id}.json`);
      await writeJson(dest, item);
      console.log(`✓ ${item.name} [${cfg.source}] → ${item.id}.json`);
    } catch (err) {
      console.error(`✗ ${cfg.name} — ${err.message}`);
      failures.push({ name: cfg.name, source: cfg.source, error: err.message });
    }

    await sleep(DELAY_MS);
  }

  if (failures.length) {
    await writeJson(join(ROOT, 'data/consumables/_failed.json'), failures);
    console.log(`\n${failures.length} failure(s) → data/consumables/_failed.json`);
  }

  console.log(`\nDone. ${ITEMS.length - failures.length}/${ITEMS.length} succeeded.`);
}

main();
