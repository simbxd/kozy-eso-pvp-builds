import { readdir, readFile, mkdir } from 'fs/promises';
import { createWriteStream } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { pipeline } from 'stream/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT       = join(__dirname, '..');
const SKILLS_DIR = join(ROOT, 'src', 'content', 'skills');
const OUTPUT_DIR = join(ROOT, 'public', 'assets', 'skills');

await mkdir(OUTPUT_DIR, { recursive: true });

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function downloadFile(url, dest) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'kozy-eso-pvp-builds/1.0 (simbad14100@gmail.com)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  await pipeline(res.body, createWriteStream(dest));
}

async function getUespIconUrl(skillLine, skillName) {
  const fileName = `ON-icon-skill-${skillLine}-${skillName}.png`.replace(/ /g, '_');
  const api = `https://en.uesp.net/w/api.php?action=query&titles=File:${encodeURIComponent(fileName)}&prop=imageinfo&iiprop=url&format=json`;
  const data = await fetchJson(api);
  const page = Object.values(data.query.pages)[0];
  if (page.missing !== undefined) return null;
  return page.imageinfo?.[0]?.url ?? null;
}

const files = (await readdir(SKILLS_DIR)).filter(f => f.endsWith('.json'));

for (const file of files) {
  const skill     = JSON.parse(await readFile(join(SKILLS_DIR, file), 'utf-8'));
  const { id, skill_line, name } = skill;
  const dest = join(OUTPUT_DIR, `${id}.png`);

  process.stdout.write(`[${id}] `);

  try {
    const url = await getUespIconUrl(skill_line, name);
    if (!url) { console.log(`NOT FOUND (${skill_line} / ${name})`); continue; }
    await downloadFile(url, dest);
    console.log(`✓`);
  } catch (err) {
    console.log(`ERROR — ${err.message}`);
  }
}

console.log('\nDone.');
