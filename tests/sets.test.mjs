/**
 * tests/sets.test.mjs
 * Data integrity tests for src/content/sets/*.json
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT      = join(dirname(fileURLToPath(import.meta.url)), '..');
const SETS_DIR  = join(ROOT, 'src', 'content', 'sets');

const VALID_TYPES = new Set([
  'Light Armor', 'Medium Armor', 'Heavy Armor',
  'Jewelry', 'Weapon', 'Mixed', 'Monster', 'Mythic',
]);
const VALID_ACQUISITIONS = new Set([
  'Overland', 'Dungeon', 'Trial', 'PvP',
  'Crafted', 'Mythic', 'Monster', 'Arena',
]);

// Load all sets once
const files = (await readdir(SETS_DIR)).filter(f => f.endsWith('.json'));
const sets  = await Promise.all(
  files.map(async f => JSON.parse(await readFile(join(SETS_DIR, f), 'utf-8')))
);

// ─── Required fields ────────────────────────────────────────────────────────

describe('sets — required fields', () => {
  for (const set of sets) {
    test(`${set.id ?? '?'} has all required fields`, () => {
      assert.ok(set.id,             `${set.id}: missing id`);
      assert.ok(set.name,           `${set.id}: missing name`);
      assert.ok(set.type,           `${set.id}: missing type`);
      assert.ok(set.patch_verified, `${set.id}: missing patch_verified`);
      assert.ok(Array.isArray(set.bonuses) && set.bonuses.length > 0,
        `${set.id}: bonuses must be a non-empty array`);
    });
  }
});

// ─── No duplicate IDs ───────────────────────────────────────────────────────

test('sets — no duplicate IDs', () => {
  const seen = new Map();
  for (const set of sets) {
    assert.ok(!seen.has(set.id), `Duplicate set ID: "${set.id}"`);
    seen.set(set.id, true);
  }
});

// ─── Valid enum values ───────────────────────────────────────────────────────

describe('sets — valid enum values', () => {
  for (const set of sets) {
    test(`${set.id} — type is valid`, () => {
      assert.ok(VALID_TYPES.has(set.type),
        `${set.id}: invalid type "${set.type}"`);
    });

    if (set.acquisition) {
      test(`${set.id} — acquisition is valid`, () => {
        assert.ok(VALID_ACQUISITIONS.has(set.acquisition),
          `${set.id}: invalid acquisition "${set.acquisition}"`);
      });
    }
  }
});

// ─── Bonus shape ─────────────────────────────────────────────────────────────

describe('sets — bonus shape', () => {
  for (const set of sets) {
    test(`${set.id} — each bonus has count and stat`, () => {
      for (const bonus of set.bonuses) {
        assert.ok(bonus.count != null, `${set.id}: bonus missing count`);
        assert.ok(bonus.stat,          `${set.id}: bonus missing stat`);
      }
    });
  }
});

// ─── ID matches filename ─────────────────────────────────────────────────────

describe('sets — id matches filename', () => {
  for (const [i, set] of sets.entries()) {
    const filename = files[i].replace('.json', '');
    test(`${filename} — id matches filename`, () => {
      assert.equal(set.id, filename,
        `File "${files[i]}" has id "${set.id}" — should be "${filename}"`);
    });
  }
});
