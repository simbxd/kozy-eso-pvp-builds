/**
 * tests/skills.test.mjs
 * Data integrity tests for src/content/skills/*.json
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT       = join(dirname(fileURLToPath(import.meta.url)), '..');
const SKILLS_DIR = join(ROOT, 'src', 'content', 'skills');

const VALID_CLASSES = new Set([
  'Dragonknight', 'Sorcerer', 'Nightblade', 'Templar',
  'Warden', 'Necromancer', 'Arcanist',
  'Weapon', 'Guild', 'Armor', 'World', 'Alliance War',
  'Craft', 'Racial',
]);
const VALID_TYPES = new Set(['Active', 'Passive', 'Ultimate']);

// Load all skills once
const files  = (await readdir(SKILLS_DIR)).filter(f => f.endsWith('.json'));
const skills = await Promise.all(
  files.map(async f => JSON.parse(await readFile(join(SKILLS_DIR, f), 'utf-8')))
);
const idToSkill = new Map(skills.map(s => [s.id, s]));

// ─── Required fields ────────────────────────────────────────────────────────

describe('skills — required fields', () => {
  for (const skill of skills) {
    test(`${skill.id ?? '?'} has all required fields`, () => {
      assert.ok(skill.id,             `${skill.id}: missing id`);
      assert.ok(skill.name,           `${skill.id}: missing name`);
      assert.ok(skill.class,          `${skill.id}: missing class`);
      assert.ok(skill.skill_line,     `${skill.id}: missing skill_line`);
      assert.ok(skill.type,           `${skill.id}: missing type`);
      assert.ok(skill.patch_verified, `${skill.id}: missing patch_verified`);
    });
  }
});

// ─── No duplicate IDs ───────────────────────────────────────────────────────

test('skills — no duplicate IDs', () => {
  const seen = new Map();
  for (const skill of skills) {
    assert.ok(!seen.has(skill.id), `Duplicate skill ID: "${skill.id}"`);
    seen.set(skill.id, true);
  }
});

// ─── Valid enum values ───────────────────────────────────────────────────────

describe('skills — valid enum values', () => {
  for (const skill of skills) {
    test(`${skill.id} — class is valid`, () => {
      assert.ok(VALID_CLASSES.has(skill.class),
        `${skill.id}: invalid class "${skill.class}"`);
    });

    test(`${skill.id} — type is valid`, () => {
      assert.ok(VALID_TYPES.has(skill.type),
        `${skill.id}: invalid type "${skill.type}"`);
    });
  }
});

// ─── morph_of resolves ───────────────────────────────────────────────────────

describe('skills — morph_of references an existing skill', () => {
  for (const skill of skills) {
    if (!skill.morph_of) continue;
    test(`${skill.id} — morph_of "${skill.morph_of}" exists`, () => {
      assert.ok(idToSkill.has(skill.morph_of),
        `${skill.id}: morph_of "${skill.morph_of}" has no JSON file`);
    });
  }
});

// ─── morph_sibling resolves ──────────────────────────────────────────────────

describe('skills — morph_sibling references an existing skill', () => {
  for (const skill of skills) {
    if (!skill.morph_sibling) continue;
    test(`${skill.id} — morph_sibling "${skill.morph_sibling}" exists`, () => {
      assert.ok(idToSkill.has(skill.morph_sibling),
        `${skill.id}: morph_sibling "${skill.morph_sibling}" has no JSON file`);
    });
  }
});

// ─── morph_sibling is bidirectional ─────────────────────────────────────────
// For standard 2-morph skills: A.morph_sibling = B AND B.morph_sibling = A.
// For multi-morph families (e.g. elemental staves where one base has 3+ variants),
// strict bidirectionality doesn't hold — we verify instead that both skills
// share the same morph_of (same base skill).

describe('skills — morph_sibling shares the same base skill', () => {
  for (const skill of skills) {
    if (!skill.morph_sibling) continue;
    test(`${skill.id} ↔ ${skill.morph_sibling} share same base`, () => {
      const sibling = idToSkill.get(skill.morph_sibling);
      assert.ok(sibling,
        `${skill.id}: sibling "${skill.morph_sibling}" not found`);
      // Both must be morphs of the same base skill
      assert.equal(sibling.morph_of, skill.morph_of,
        `${skill.id} (morph_of: ${skill.morph_of}) and ${skill.morph_sibling} (morph_of: ${sibling.morph_of}) don't share the same base skill`);
    });
  }
});

// ─── morph_rationale on all morphs ──────────────────────────────────────────

describe('skills — all morphs have morph_rationale', () => {
  for (const skill of skills) {
    if (!skill.morph_of) continue;
    test(`${skill.id} has morph_rationale`, () => {
      assert.ok(skill.morph_rationale && skill.morph_rationale.trim().length > 0,
        `${skill.id}: morph_of is set but morph_rationale is missing`);
    });
  }
});

// ─── ID matches filename ─────────────────────────────────────────────────────

describe('skills — id matches filename', () => {
  for (const [i, skill] of skills.entries()) {
    const filename = files[i].replace('.json', '');
    test(`${filename} — id matches filename`, () => {
      assert.equal(skill.id, filename,
        `File "${files[i]}" has id "${skill.id}" — should be "${filename}"`);
    });
  }
});
