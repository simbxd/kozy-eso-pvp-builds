#!/usr/bin/env node
// Probe UESP playerSkills/minedSkills to find the field that reliably flags
// ultimates. Inspect raw rows for a handful of canonical ultimates and a
// matched group of regular actives, then print only the keys that differ.

const UESP_BASE = "https://esolog.uesp.net/exportJson.php";
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (kozy-probe)",
  Accept: "application/json",
};

const ULTIMATES = [
  "Death Stroke", "Soul Harvest", "Incapacitating Strike",
  "Dragon Leap", "Take Flight", "Ferocious Leap",
  "Dawnbreaker", "Flawless Dawnbreaker",
  "Eye of the Storm", "Suppression Field", "Energy Overload",
  "Standard of Might", "Shifting Standard",
  "Magma Armor", "Corrosive Armor",
  "Permafrost",
];

const ACTIVES = [
  "Concealed Weapon", "Fragmented Shield", "Crushing Shock",
  "Dark Flare", "Critical Surge", "Cliff Racer",
];

async function fetchTable(table) {
  const url = new URL(UESP_BASE);
  url.searchParams.set("table", table);
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const rawAll = await fetchTable("playerSkills").catch(() =>
  fetchTable("minedSkills"),
);
const rows =
  rawAll.playerSkills ?? rawAll.minedSkills ?? rawAll.records ?? rawAll;
const arr = Array.isArray(rows) ? rows : Object.values(rows);

const byName = new Map();
for (const r of arr) {
  const name = r.name ?? r.skillName ?? r.abilityName;
  if (!name) continue;
  // Keep first occurrence per name (rank 1) — keeps payload small
  if (!byName.has(name)) byName.set(name, r);
}

function pick(name) {
  return byName.get(name) ?? null;
}

const ultRows = ULTIMATES.map((n) => [n, pick(n)]).filter(([, r]) => r);
const actRows = ACTIVES.map((n) => [n, pick(n)]).filter(([, r]) => r);

console.log(`\nULTIMATES found: ${ultRows.length}/${ULTIMATES.length}`);
console.log(`ACTIVES found:   ${actRows.length}/${ACTIVES.length}\n`);

// Print all keys of first ultimate row to learn the schema
if (ultRows.length) {
  console.log("Keys on a sample ultimate row:");
  console.log(Object.keys(ultRows[0][1]).sort().join(", "), "\n");
}

// For each candidate field, check whether ultimates and actives disagree on
// its value (i.e. the field discriminates).
const sample = ultRows[0]?.[1] ?? {};
for (const key of Object.keys(sample)) {
  const ultVals = new Set(ultRows.map(([, r]) => String(r[key] ?? "")));
  const actVals = new Set(actRows.map(([, r]) => String(r[key] ?? "")));
  const overlap = [...ultVals].filter((v) => actVals.has(v));
  if (overlap.length === 0 && ultVals.size <= 3) {
    console.log(
      `★ DISCRIMINATOR  ${key.padEnd(20)} ult=${[...ultVals].join("|")}  act=${[...actVals].join("|")}`,
    );
  }
}

// Print mechanic / isPassive / skillType for each sample so we can see clearly
console.log("\nULTIMATE rows (selected fields):");
for (const [n, r] of ultRows.slice(0, 8)) {
  console.log(
    `  ${n.padEnd(28)} skillType=${r.skillType ?? "-"} isPassive=${r.isPassive ?? "-"} mechanic=${r.mechanic ?? "-"} morph=${r.morph ?? "-"} rank=${r.rank ?? "-"}`,
  );
}
console.log("\nACTIVE rows (selected fields):");
for (const [n, r] of actRows.slice(0, 6)) {
  console.log(
    `  ${n.padEnd(28)} skillType=${r.skillType ?? "-"} isPassive=${r.isPassive ?? "-"} mechanic=${r.mechanic ?? "-"} morph=${r.morph ?? "-"} rank=${r.rank ?? "-"}`,
  );
}
