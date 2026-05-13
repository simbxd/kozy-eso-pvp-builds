#!/usr/bin/env node
/**
 * One-shot migration: backfill skill_line_id on existing skill JSONs.
 *
 * For every file in src/content/skills/:
 *   - no skill_line field → skip
 *   - skill_line_id already present → leave alone
 *   - otherwise → set skill_line_id = slugify(skill_line), rewrite file
 *
 * Idempotent: safe to run multiple times.
 *
 * Usage:
 *   node scripts/migrate-add-skill-line-id.mjs
 */

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const SKILLS_DIR = './src/content/skills';

// Identical to slugify() in fetch-eso-data.mjs — keep in sync until shared module refactor
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

let updated = 0, alreadyHad = 0, skipped = 0;

const files = (await readdir(SKILLS_DIR)).filter(f => f.endsWith('.json'));

for (const file of files) {
  const path = join(SKILLS_DIR, file);
  const raw = await readFile(path, 'utf8');
  let skill;
  try {
    skill = JSON.parse(raw);
  } catch {
    console.warn(`[migrate] Skipping unparseable file: ${file}`);
    skipped++;
    continue;
  }

  if (!skill.skill_line) {
    skipped++;
    continue;
  }

  if (skill.skill_line_id !== undefined) {
    alreadyHad++;
    continue;
  }

  // Insert skill_line_id right after skill_line, preserving key order
  const entries = Object.entries(skill);
  const idx = entries.findIndex(([k]) => k === 'skill_line');
  const newEntries = [
    ...entries.slice(0, idx + 1),
    ['skill_line_id', slugify(skill.skill_line)],
    ...entries.slice(idx + 1),
  ];

  await writeFile(path, JSON.stringify(Object.fromEntries(newEntries), null, 2) + '\n', 'utf8');
  updated++;
}

console.log(`Done: ${updated} updated, ${alreadyHad} already had skill_line_id, ${skipped} skipped (no skill_line or unparseable).`);
