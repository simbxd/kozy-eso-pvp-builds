/**
 * tests/builds.test.mjs
 * Data integrity tests for src/content/builds/*.md
 * Checks that every set/skill ID referenced in a build resolves to an existing file,
 * and that icon PNG files exist for all skills used in builds.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT       = join(dirname(fileURLToPath(import.meta.url)), '..');
const BUILDS_DIR = join(ROOT, 'src', 'content', 'builds');
const SETS_DIR   = join(ROOT, 'src', 'content', 'sets');
const SKILLS_DIR = join(ROOT, 'src', 'content', 'skills');
const ICONS_DIR  = join(ROOT, 'public', 'assets', 'skills');

// Known valid classes (for frontmatter class field)
const VALID_CLASSES = new Set([
  'Dragonknight', 'Sorcerer', 'Nightblade', 'Templar',
  'Warden', 'Necromancer', 'Arcanist',
]);

// Build an ID→exists lookup from the filesystem
const setIds   = new Set((await readdir(SETS_DIR)).filter(f => f.endsWith('.json')).map(f => f.replace('.json', '')));
const skillIds = new Set((await readdir(SKILLS_DIR)).filter(f => f.endsWith('.json')).map(f => f.replace('.json', '')));

// ─── Parse frontmatter from .md files ───────────────────────────────────────
// Normalise CRLF → LF first, then extract YAML block between --- delimiters.

function parseFrontmatter(src) {
  const normalised = src.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const match = normalised.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const raw = match[1];

  // Single-line scalar: key: value  (handles quoted and unquoted values)
  const get = (key) => {
    const m = raw.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
    return m ? m[1].trim().replace(/^["']|["']$/g, '') : null;
  };

  // Top-level list:
  //   key:
  //     - item
  const getList = (key) => {
    const m = raw.match(new RegExp(`^${key}:\\s*\\n((?:[ \\t]+-[ \\t]+\\S.*\\n?)*)`, 'm'));
    if (!m) return [];
    return (m[1].match(/[-]\s+(\S.*)/g) ?? []).map(l => l.replace(/^-\s+/, '').trim());
  };

  // Nested skills.bar1 / skills.bar2
  const extractBar = (label) => {
    const m = raw.match(new RegExp(`^[ \\t]+${label}:\\s*\\n((?:[ \\t]+-[ \\t]+\\S.*\\n?)*)`, 'm'));
    if (!m) return [];
    return (m[1].match(/[-]\s+(\S.*)/g) ?? []).map(l => l.replace(/^-\s+/, '').trim());
  };

  return {
    title:      get('title'),
    class:      get('class'),
    role:       get('role'),
    resource:   get('resource'),
    gamemode:   get('gamemode'),
    patch:      get('patch'),
    difficulty: get('difficulty'),
    sets:       getList('sets'),
    bar1:       extractBar('bar1'),
    bar2:       extractBar('bar2'),
  };
}

// README.md documents the character-screenshot convention — not a build entry.
const buildFiles = (await readdir(BUILDS_DIR)).filter(f => f.endsWith('.md') && f !== 'README.md');
const builds = await Promise.all(
  buildFiles.map(async f => ({
    file: f,
    fm:   parseFrontmatter(await readFile(join(BUILDS_DIR, f), 'utf-8')),
  }))
);

// ─── Required frontmatter fields ─────────────────────────────────────────────

describe('builds — required frontmatter fields', () => {
  for (const { file, fm } of builds) {
    test(`${file} has required frontmatter`, () => {
      assert.ok(fm,               `${file}: could not parse frontmatter`);
      assert.ok(fm.title,         `${file}: missing title`);
      assert.ok(fm.class,         `${file}: missing class`);
      assert.ok(fm.role,          `${file}: missing role`);
      assert.ok(fm.resource,      `${file}: missing resource`);
      assert.ok(fm.gamemode,      `${file}: missing gamemode`);
      assert.ok(fm.patch,         `${file}: missing patch`);
      assert.ok(fm.difficulty,    `${file}: missing difficulty`);
    });
  }
});

// ─── class is valid ───────────────────────────────────────────────────────────

describe('builds — class is valid', () => {
  for (const { file, fm } of builds) {
    if (!fm?.class) continue;
    test(`${file} — class "${fm.class}" is valid`, () => {
      assert.ok(VALID_CLASSES.has(fm.class),
        `${file}: invalid class "${fm.class}"`);
    });
  }
});

// ─── Referenced sets exist ────────────────────────────────────────────────────

describe('builds — set IDs resolve to existing files', () => {
  for (const { file, fm } of builds) {
    for (const id of fm?.sets ?? []) {
      test(`${file} — set "${id}" exists`, () => {
        assert.ok(setIds.has(id),
          `${file}: set "${id}" has no JSON in src/content/sets/`);
      });
    }
  }
});

// ─── Referenced skills exist ──────────────────────────────────────────────────

describe('builds — skill IDs resolve to existing files', () => {
  for (const { file, fm } of builds) {
    for (const id of [...(fm?.bar1 ?? []), ...(fm?.bar2 ?? [])]) {
      test(`${file} — skill "${id}" exists`, () => {
        assert.ok(skillIds.has(id),
          `${file}: skill "${id}" has no JSON in src/content/skills/`);
      });
    }
  }
});

// ─── Icon files exist for skills used in builds ───────────────────────────────

const skillsInBuilds = new Set(
  builds.flatMap(({ fm }) => [...(fm?.bar1 ?? []), ...(fm?.bar2 ?? [])])
);

describe('builds — skill icons exist', () => {
  for (const id of skillsInBuilds) {
    test(`icon exists for "${id}"`, async () => {
      try {
        await access(join(ICONS_DIR, `${id}.png`));
      } catch {
        assert.fail(`Missing icon: public/assets/skills/${id}.png`);
      }
    });
  }
});
