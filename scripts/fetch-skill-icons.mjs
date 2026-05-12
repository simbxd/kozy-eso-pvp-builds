#!/usr/bin/env node
/**
 * Downloads skill icons from the UESP wiki into public/assets/skills/{id}.png
 *
 * Reads src/content/skills/*.json (all 1208 skills).
 * Uses the MediaWiki API with batch queries (50 files per request) and
 * concurrent downloads to stay fast without hammering the server.
 *
 * Usage:
 *   node scripts/fetch-skill-icons.mjs           # skip existing, fetch missing
 *   FORCE=1 node scripts/fetch-skill-icons.mjs   # re-download everything
 */

import { readdir, readFile, mkdir } from 'node:fs/promises';
import { existsSync, createWriteStream } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT       = join(__dirname, '..');
const SKILLS_DIR = join(ROOT, 'src', 'content', 'skills');
const OUTPUT_DIR = join(ROOT, 'public', 'assets', 'skills');

const FORCE            = process.env.FORCE === '1';
const BATCH_SIZE       = 50;   // MediaWiki API max titles per query
const DL_CONCURRENCY   = 8;    // parallel downloads per batch

const UA = 'kozy-eso-pvp-builds/1.0 (simbad14100@gmail.com)';

await mkdir(OUTPUT_DIR, { recursive: true });

// ---------- Helpers ----------

async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function downloadFile(url, dest) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  await pipeline(res.body, createWriteStream(dest));
}

function makeFileName(skill_line, name) {
  return `ON-icon-skill-${skill_line}-${name}.png`.replace(/ /g, '_');
}

// Query UESP MediaWiki API for up to 50 file titles at once.
// Returns Map<lowercased-title → imageUrl>
async function batchQueryUesp(titles) {
  const url = new URL('https://en.uesp.net/w/api.php');
  url.searchParams.set('action', 'query');
  url.searchParams.set('titles', titles.join('|'));
  url.searchParams.set('prop', 'imageinfo');
  url.searchParams.set('iiprop', 'url');
  url.searchParams.set('format', 'json');

  const data = await fetchJson(url.toString());

  // Build redirect map from normalized titles (MW may change casing/spaces)
  const redirects = new Map(
    (data.query.normalized ?? []).map(n => [n.from.toLowerCase(), n.to.toLowerCase()])
  );

  const byTitle = new Map();
  for (const page of Object.values(data.query.pages)) {
    if (page.missing !== undefined) continue;
    const imageUrl = page.imageinfo?.[0]?.url;
    if (imageUrl) byTitle.set(page.title.toLowerCase(), imageUrl);
  }

  // Resolve each queried title through the redirect map
  return new Map(
    titles.map(t => {
      const key = redirects.get(t.toLowerCase()) ?? t.toLowerCase();
      return [t.toLowerCase(), byTitle.get(key) ?? null];
    })
  );
}

// ---------- Main ----------

const files  = (await readdir(SKILLS_DIR)).filter(f => f.endsWith('.json'));
const skills = await Promise.all(
  files.map(async f => {
    const data = JSON.parse(await readFile(join(SKILLS_DIR, f), 'utf-8'));
    return { id: data.id, skill_line: data.skill_line, name: data.name };
  })
);

// Skip skills that already have an icon (unless FORCE)
const toFetch = FORCE
  ? skills
  : skills.filter(s => !existsSync(join(OUTPUT_DIR, `${s.id}.png`)));

console.log(`[icons] ${skills.length} skills total, ${toFetch.length} to fetch`);
if (toFetch.length === 0) { console.log('[icons] Nothing to do.'); process.exit(0); }

let downloaded = 0, notFound = 0, errors = 0;
const totalBatches = Math.ceil(toFetch.length / BATCH_SIZE);

for (let i = 0; i < toFetch.length; i += BATCH_SIZE) {
  const batch   = toFetch.slice(i, i + BATCH_SIZE);
  const batchNo = Math.floor(i / BATCH_SIZE) + 1;
  process.stdout.write(`[batch ${batchNo}/${totalBatches}] querying UESP… `);

  // Build title list and look up URLs
  const titles   = batch.map(s => `File:${makeFileName(s.skill_line, s.name)}`);
  let urlMap;
  try {
    urlMap = await batchQueryUesp(titles);
  } catch (err) {
    console.log(`API ERROR — ${err.message}`);
    errors += batch.length;
    continue;
  }

  const toDownload = batch
    .map(s => ({ s, url: urlMap.get(`file:${makeFileName(s.skill_line, s.name).toLowerCase()}`) }))
    .filter(({ url }) => url != null);

  notFound += batch.length - toDownload.length;
  process.stdout.write(`${toDownload.length} found, ${batch.length - toDownload.length} missing — downloading…\n`);

  // Download in parallel chunks
  for (let j = 0; j < toDownload.length; j += DL_CONCURRENCY) {
    const chunk = toDownload.slice(j, j + DL_CONCURRENCY);
    await Promise.all(chunk.map(async ({ s, url }) => {
      const dest = join(OUTPUT_DIR, `${s.id}.png`);
      try {
        await downloadFile(url, dest);
        downloaded++;
        process.stdout.write('.');
      } catch (err) {
        errors++;
        process.stdout.write(`\n  [${s.id}] ERROR — ${err.message}\n`);
      }
    }));
  }
  process.stdout.write('\n');
}

console.log(`\n[icons] Done — ✓ ${downloaded} downloaded, ✗ ${notFound} not found on UESP, ! ${errors} errors`);
