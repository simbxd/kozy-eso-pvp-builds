#!/usr/bin/env node
/**
 * Targeted patch for the skill `type` and `resource` fields.
 *
 * Background: fetch-eso-data.mjs's deriveType() looks for mechanic === "6"
 * to flag ultimates. The UESP esolog source actually flags ultimates with
 * mechanic === "8". Result: only ~2 ultimates ended up correctly typed in
 * src/content/skills/, breaking the build editor's Ultimate slot.
 *
 * This script ONLY edits `type` and `resource` on existing skill JSONs.
 * Every other field (morph_rationale, skill_line_id, all curated content)
 * is preserved untouched.
 *
 * Usage:
 *   node scripts/patch-skill-types.mjs              # DRY-RUN, prints diff
 *   APPLY=1 node scripts/patch-skill-types.mjs      # write changes
 */

import { readFile, writeFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const UESP_BASE = "https://esolog.uesp.net/exportJson.php";
const SKILLS_DIR = "./src/content/skills";
const APPLY = process.env.APPLY === "1";

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (kozy-patch-skill-types)",
  Accept: "application/json",
};

function slugify(str) {
  return String(str)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

async function fetchTable(table) {
  const url = new URL(UESP_BASE);
  url.searchParams.set("table", table);
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

console.log(`[patch] mode = ${APPLY ? "APPLY (will write)" : "DRY-RUN"}`);

const raw = await fetchTable("playerSkills").catch(() =>
  fetchTable("minedSkills"),
);
const rows = raw.playerSkills ?? raw.minedSkills ?? raw.records ?? raw;
const arr = Array.isArray(rows) ? rows : Object.values(rows);

// Index API rows by slugified name. If multiple ranks exist, keep the row
// whose mechanic is `8` if any (a few base skills have rank-2/3 rows with
// stale mechanic values; the rank-1 representative is what matters).
const apiBySlug = new Map();
for (const r of arr) {
  const name = r.name ?? r.skillName ?? r.abilityName;
  if (!name || String(name).startsWith("_")) continue;
  const slug = slugify(name);
  const prev = apiBySlug.get(slug);
  if (!prev) {
    apiBySlug.set(slug, r);
  } else if (String(r.mechanic) === "8" && String(prev.mechanic) !== "8") {
    apiBySlug.set(slug, r);
  }
}

const files = (await readdir(SKILLS_DIR)).filter((f) => f.endsWith(".json"));
console.log(`[patch] scanning ${files.length} skill JSONs`);

const changes = [];
const unmatched = [];

for (const file of files) {
  const path = join(SKILLS_DIR, file);
  const json = JSON.parse(await readFile(path, "utf8"));
  const apiRow = apiBySlug.get(json.id);
  if (!apiRow) {
    unmatched.push(json.id);
    continue;
  }
  const isUltimate = String(apiRow.mechanic) === "8";
  if (json.type === "Passive") continue; // never touch passives
  const wantType = isUltimate ? "Ultimate" : "Active";
  const wantResource = isUltimate ? "Ultimate" : json.resource;
  if (json.type !== wantType || (isUltimate && json.resource !== wantResource)) {
    changes.push({
      id: json.id,
      name: json.name,
      from: { type: json.type, resource: json.resource },
      to: { type: wantType, resource: wantResource },
    });
    if (APPLY) {
      json.type = wantType;
      if (isUltimate) json.resource = wantResource;
      await writeFile(path, JSON.stringify(json, null, 2) + "\n", "utf8");
    }
  }
}

const ultimateChanges = changes.filter((c) => c.to.type === "Ultimate");
const otherChanges = changes.filter((c) => c.to.type !== "Ultimate");

console.log(`\n[patch] would change ${changes.length} files`);
console.log(`  Active → Ultimate : ${ultimateChanges.length}`);
console.log(`  Ultimate → Active : ${otherChanges.length}`);
console.log(`  Unmatched files   : ${unmatched.length}`);

console.log(`\n— Sample Active → Ultimate (first 10) —`);
for (const c of ultimateChanges.slice(0, 10)) {
  console.log(`  ${c.id.padEnd(30)} ${c.from.type}/${c.from.resource}  →  ${c.to.type}/${c.to.resource}`);
}
if (otherChanges.length) {
  console.log(`\n— Ultimate → Active (all) —`);
  for (const c of otherChanges) {
    console.log(`  ${c.id.padEnd(30)} ${c.from.type}/${c.from.resource}  →  ${c.to.type}/${c.to.resource}`);
  }
}
if (unmatched.length) {
  console.log(
    `\n— Unmatched (first 10) — these files have no row in the current API:`,
  );
  for (const id of unmatched.slice(0, 10)) console.log(`  ${id}`);
}

console.log(
  `\n[patch] ${APPLY ? "DONE — wrote changes" : "DRY-RUN complete. Re-run with APPLY=1 to write."}`,
);
