#!/usr/bin/env node
/**
 * fix-missing-icons.mjs
 * One-shot script that fills the 283 missing skill icons:
 *
 *   1. Scribing variants (ending in -<grimoire_id>):
 *      Copy the matching /assets/scribing/grimoire-*.png.
 *
 *   2. Other missing skills (non major-/minor-):
 *      Try UESP with several name transformations.
 *      Fall back to copying a sibling morph icon when known.
 */

import { readdir, readFile, copyFile, mkdir } from 'node:fs/promises';
import { existsSync, createWriteStream } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT        = join(__dirname, '..');
const SKILLS_DIR  = join(ROOT, 'src', 'content', 'skills');
const OUTPUT_DIR  = join(ROOT, 'public', 'assets', 'skills');
const SCRIBING_DIR = join(ROOT, 'public', 'assets', 'scribing');

await mkdir(OUTPUT_DIR, { recursive: true });

const UA = 'kozy-eso-pvp-builds/1.0 (simbad14100@gmail.com)';

// ── Grimoire icon map (skill_line_id → filename in /assets/scribing/) ──────────
const GRIMOIRE_ICON = {
  'dual-wield':          'grimoire-dual-wield.png',
  'two-handed':          'grimoire-2-handed.png',
  'one-hand-and-shield': 'grimoire-1-handed.png',
  'bow':                 'grimoire-bow.png',
  'destruction-staff':   'grimoire-destruction-staff.png',
  'restoration-staff':   'grimoire-restoration-staff.png',
  'assault':             'grimoire-assault.png',
  'support':             'grimoire-support.png',
  'fighters-guild':      'grimoire-fighters-guild.png',
  'mages-guild':         'grimoire-mages-guild.png',
  'soul-magic':          'grimoire-soul-magic-02.png',
};

const GRIMOIRE_IDS = new Set([
  'smash','knife','throw','vault','explosion','bond',
  'trample','banner','torch','contingency','burst','soul',
]);

// Skills whose UESP filename differs from our data, or that need a proxy icon.
// Format: id → { uesp: 'UESP name' } or { proxy: 'existing-skill-id' }
const MANUAL_MAP = {
  'bash':                           { proxy: 'deadly-bash' },
  'bash-stun':                      { proxy: 'power-bash' },
  'honor-the-dead':                 { uesp: 'Honor The Dead' },           // capital T
  'bone-goliath-transformation-d':  { proxy: 'bone-goliath-transformation' },
  'blessing-of-restoration':        { uesp: 'Blessing of Restoration' },
  'bannerman':                      { uesp: 'Bannerman' },
  'battle-resurrection-mastery':    { proxy: 'battle-resurrection' },
  'contingency':                    { uesp: 'Contingency' },              // Alliance War: Assault
  'continuous-attacks':             { uesp: 'Continuous Attack' },
  'elemental-explosion-dot':        { proxy: 'elemental-explosion' },
  'empower':                        { uesp: 'Empower' },
  'petrify-dummy':                  { proxy: 'petrify' },
  'torch-bearers-sweep':            { proxy: 'torchbearer' },
  'vault-fatigue':                  { proxy: 'vault' },
  'soul-burst-buffs':               { proxy: 'soul-burst' },
  'heavy-armor-bonuses':            { proxy: 'juggernaut' },
  'heavy-armor-penalties':          { proxy: 'constitution' },
  'light-armor-bonuses':            { proxy: 'concentration' },
  'light-armor-penalties':          { proxy: 'evocation' },
  'medium-armor-bonuses':           { proxy: 'athletics' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

async function downloadFile(url, dest) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  await pipeline(res.body, createWriteStream(dest));
}

async function uesp(line, name) {
  const filename = `File:ON-icon-skill-${line.replace(/ /g,'_')}-${name.replace(/ /g,'_')}.png`;
  const url = `https://en.uesp.net/w/api.php?action=query&titles=${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url&format=json`;
  const data = await (await fetch(url, { headers: { 'User-Agent': UA } })).json();
  const page = Object.values(data.query.pages)[0];
  return page.missing !== undefined ? null : (page.imageinfo?.[0]?.url ?? null);
}

// ── Load skill index ──────────────────────────────────────────────────────────

const files  = (await readdir(SKILLS_DIR)).filter(f => f.endsWith('.json'));
const skills = await Promise.all(
  files.map(async f => JSON.parse(await readFile(join(SKILLS_DIR, f), 'utf-8'))),
);

const existing  = new Set(await readdir(OUTPUT_DIR));
const missing   = skills.filter(s => !existing.has(s.id + '.png'));

console.log(`[fix-icons] ${missing.length} missing icons to process\n`);

let copied = 0, downloaded = 0, skipped = 0, failed = 0;

for (const s of missing) {
  const dest = join(OUTPUT_DIR, `${s.id}.png`);

  // ── 1. Skip major-/minor- buff entries — they're filtered from the UI ──────
  if (s.id.startsWith('major-') || s.id.startsWith('minor-')) {
    skipped++;
    continue;
  }

  // ── 2. Scribing variant: ends with a grimoire ID in a scribing skill line ──
  const lineIcon = GRIMOIRE_ICON[s.skill_line_id];
  const isScribingVariant = lineIcon && GRIMOIRE_IDS.has(s.id.split('-').pop());

  if (isScribingVariant) {
    const src = join(SCRIBING_DIR, lineIcon);
    if (existsSync(src)) {
      await copyFile(src, dest);
      copied++;
      process.stdout.write(`  [copy-grimoire] ${s.id}\n`);
    } else {
      process.stdout.write(`  [no-grimoire]   ${s.id} — ${lineIcon} missing\n`);
      failed++;
    }
    continue;
  }

  // ── 3. Manual map entry ────────────────────────────────────────────────────
  const manual = MANUAL_MAP[s.id];

  if (manual?.proxy) {
    const proxySrc = join(OUTPUT_DIR, `${manual.proxy}.png`);
    if (existsSync(proxySrc)) {
      await copyFile(proxySrc, dest);
      copied++;
      process.stdout.write(`  [copy-proxy]    ${s.id} ← ${manual.proxy}\n`);
    } else {
      process.stdout.write(`  [no-proxy]      ${s.id} — proxy ${manual.proxy} missing\n`);
      failed++;
    }
    continue;
  }

  if (manual?.uesp) {
    const imgUrl = await uesp(s.skill_line, manual.uesp);
    if (imgUrl) {
      try {
        await downloadFile(imgUrl, dest);
        downloaded++;
        process.stdout.write(`  [download-uesp] ${s.id}\n`);
      } catch (e) {
        process.stdout.write(`  [dl-error]      ${s.id} — ${e.message}\n`);
        failed++;
      }
    } else {
      process.stdout.write(`  [not-on-uesp]   ${s.id}\n`);
      failed++;
    }
    continue;
  }

  // ── 4. Standard UESP try ───────────────────────────────────────────────────
  const imgUrl = await uesp(s.skill_line, s.name);
  if (imgUrl) {
    try {
      await downloadFile(imgUrl, dest);
      downloaded++;
      process.stdout.write(`  [download-uesp] ${s.id}\n`);
    } catch (e) {
      process.stdout.write(`  [dl-error]      ${s.id} — ${e.message}\n`);
      failed++;
    }
  } else {
    process.stdout.write(`  [not-found]     ${s.id} (${s.name} / ${s.skill_line})\n`);
    failed++;
  }
}

console.log(`
[fix-icons] Done
  Copied from grimoire/proxy : ${copied}
  Downloaded from UESP       : ${downloaded}
  Skipped (major-/minor-)    : ${skipped}
  Not resolved               : ${failed}
`);
