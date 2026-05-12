#!/usr/bin/env node
/**
 * Generates morph_rationale texts for class/weapon/guild morph skills
 * that don't already have one.
 *
 * Usage:
 *   node scripts/gen-morph-rationale.mjs           # write files
 *   DRY_RUN=1 node scripts/gen-morph-rationale.mjs # preview only
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT       = join(__dirname, '..');
const SKILLS_DIR = join(ROOT, 'src', 'content', 'skills');
const DRY_RUN    = process.env.DRY_RUN === '1';

const TARGET_CLASSES = new Set([
  'Dragonknight','Sorcerer','Nightblade','Templar',
  'Warden','Necromancer','Arcanist','Weapon','Guild','Armor',
]);

// ---------- Fetch UESP ----------
const res  = await fetch('https://esolog.uesp.net/exportJson.php?table=playerSkills', {
  headers: { 'User-Agent': 'kozy-eso-pvp-builds/1.0 (simbad14100@gmail.com)' },
});
const data = await res.json();
const rows = Object.values(data.playerSkills ?? data);

function stripColors(s) {
  return String(s ?? '').replace(/\|c[0-9a-fA-F]{6}|\|r/g, '').replace(/\s+/g, ' ').trim();
}

// Build "name::skillLine" → description (highest rank)
const descMap = new Map();
for (const row of rows) {
  if (!row.name || !row.skillLine) continue;
  const key  = `${row.name}::${row.skillLine}`;
  const rank = parseInt(row.rank ?? 0, 10);
  const cur  = descMap.get(key);
  if (!cur || rank > cur.rank) {
    descMap.set(key, { desc: stripColors(row.description), rank });
  }
}

// ---------- Load skills ----------
const files  = (await readdir(SKILLS_DIR)).filter(f => f.endsWith('.json'));
const skills = await Promise.all(
  files.map(async f => ({
    file: join(SKILLS_DIR, f),
    data: JSON.parse(await readFile(join(SKILLS_DIR, f), 'utf-8')),
  }))
);
const slugToName = Object.fromEntries(skills.map(s => [s.data.id, s.data.name]));

// ---------- Rationale generation ----------

// Named buffs/debuffs worth mentioning explicitly
const BUFFS = [
  'Major Breach','Minor Breach','Major Fracture','Minor Fracture',
  'Major Sorcery','Minor Sorcery','Major Brutality','Minor Brutality',
  'Major Prophecy','Minor Prophecy','Major Savagery','Minor Savagery',
  'Major Vitality','Minor Vitality','Major Mending','Minor Mending',
  'Major Expedition','Minor Expedition','Major Evasion','Minor Evasion',
  'Major Protection','Minor Protection','Major Resolve','Minor Resolve',
  'Major Force','Minor Force','Major Heroism','Minor Heroism',
  'Major Slayer','Minor Slayer','Major Defile','Minor Defile',
  'Major Maim','Minor Maim','Major Cowardice','Minor Cowardice',
  'Major Vulnerability','Minor Vulnerability','Major Empower','Minor Empower',
  'Major Endurance','Minor Endurance','Major Fortitude','Minor Fortitude',
  'Major Courage','Minor Courage','Major Toughness',
];

const DEBUFF_BUFFS = new Set([
  'Major Breach','Minor Breach','Major Fracture','Minor Fracture',
  'Major Defile','Minor Defile','Major Maim','Minor Maim',
  'Major Cowardice','Minor Cowardice',
]);

// Damage-amplification debuffs (different description than anti-heal)
const DAMAGE_AMP_DEBUFFS = new Set([
  'Major Vulnerability','Minor Vulnerability',
]);

function findBuff(desc) {
  return BUFFS.find(b => desc.includes(b)) ?? null;
}

function generateRationale(name, siblingName, myDesc, siblingDesc, data = {}) {
  const d  = myDesc;
  const dl = d.toLowerCase();
  const sl = (siblingDesc ?? '').toLowerCase();

  // 1. Resource conversion morphs
  if (/\bstamina instead\b|\bstamina cost\b|\bconverts? .{0,30}stamina\b/i.test(d) && !/magicka instead/i.test(d))
    return `Stamina morph — converts the cost to Stamina, enabling use on non-Magicka builds.`;
  if (/\bmagicka instead\b|\bmagicka cost\b|\bconverts? .{0,30}magicka\b/i.test(d) && !/stamina instead/i.test(d))
    return `Magicka morph — converts the cost to Magicka for caster-focused builds.`;

  // 2. Explicit named buffs/debuffs
  const myBuff  = findBuff(d);
  const sibBuff = siblingDesc ? findBuff(siblingDesc) : null;
  if (myBuff && myBuff !== sibBuff) {
    const isDebuff    = DEBUFF_BUFFS.has(myBuff);
    const isDamageAmp = DAMAGE_AMP_DEBUFFS.has(myBuff);
    if (isDamageAmp)
      return `Debuff morph — applies ${myBuff} on hit, increasing all damage the target takes.`;
    if (isDebuff) {
      if (/armor|physical.*resistance|spell.*resistance|penetrat/i.test(dl))
        return `Armor penetration morph — applies ${myBuff} on hit, reducing enemy Physical and Spell Resistance.`;
      if (/defile/i.test(myBuff))
        return `Anti-heal morph — applies ${myBuff} on hit, reducing enemy healing received.`;
      if (/maim/i.test(myBuff))
        return `Damage mitigation morph — applies ${myBuff} on hit, reducing enemy damage output.`;
      return `Debuff morph — applies ${myBuff} on hit.`;
    }
    // Support buff
    const toAllies = /allies|nearby|group/i.test(d.slice(d.indexOf(myBuff) - 40, d.indexOf(myBuff) + 40));
    const auraNote = toAllies ? ' to you and nearby allies' : '';
    return `Support morph — grants ${myBuff}${auraNote}, increasing your ${myBuff.includes('Sorcery') || myBuff.includes('Brutality') ? 'Weapon and Spell Damage' : myBuff.includes('Force') ? 'Critical Damage' : myBuff.includes('Expedition') ? 'Movement Speed' : myBuff.includes('Protection') ? 'damage reduction' : myBuff.includes('Resolve') ? 'Physical and Spell Resistance' : 'effectiveness'}.`;
  }

  // 3. Damage shield
  if (/damage shield.*absorbs|absorbs.*damage/i.test(dl))
    return siblingDesc && /damage shield/i.test(sl)
      ? `Defensive morph — provides a damage shield on cast, with additional utility compared to ${siblingName}.`
      : `Defensive morph — provides a damage shield on cast.`;

  // 4. Healing (explicit heal keyword, not just "damage and then heal")
  const healsSelf    = /\bheal you\b|\bheal yourself\b|\bhealing you\b|\brestore.*health\b/i.test(dl);
  const healsAllies  = /\bheal.*allies\b|\bheal.*nearby\b|\bheal.*group\b/i.test(dl);
  const siblingHeals = /\bheal you\b|\bheal.*allies\b|\brestore.*health\b/i.test(sl);

  if (healsSelf && !siblingHeals && !healsAllies)
    return `Self-sustain morph — heals you for a portion of the damage dealt.`;
  if (healsAllies && !siblingHeals)
    return `Group heal morph — extends healing to nearby allies.`;
  if (healsSelf && siblingHeals)
    return `Self-sustain morph — prioritizes personal healing over ${siblingName}'s ${findBuff(siblingDesc ?? '') ?? 'alternative effect'}.`;

  // 5. CC (stun/knockback/immobilize)
  const hasCCSelf = /\bstun(?:s|ning|ned)?\b|knock.*back|immobilize|disorient\b|\broot\b/i.test(dl);
  const sibCC     = /\bstuns?\b.*\d|knock.*back|immobilize|disorient|root/i.test(sl);
  if (hasCCSelf && !sibCC)
    return `Crowd control morph — ${/knockback|knock.*back/i.test(dl) ? 'knocks enemies back' : /immobilize|root/i.test(dl) ? 'roots the target in place' : 'stuns the target'} on hit.`;

  // 6. AoE vs single target
  const hasAoE     = /nearby enemies|target area|around you|within \d+ meter|radius|in front of you.*all/i.test(dl);
  const siblingAoE = /nearby enemies|target area|around you|within \d+ meter|radius/i.test(sl);
  if (hasAoE && !siblingAoE)
    return `AoE morph — extends the effect to all nearby enemies instead of a single target.`;
  if (!hasAoE && siblingAoE && siblingName)
    return `Single-target morph — focuses the full damage on one enemy instead of splitting across targets like ${siblingName}.`;

  // 7. DoT (damage over time) vs burst
  const hasDot    = /every \d+\.?\d* second|over \d+\.?\d* seconds?/i.test(dl) && /damage/i.test(dl);
  const hasBurst  = !hasDot && /instantly|immediately|on hit|dealing \d/i.test(dl);
  const sibDot    = /every \d+\.?\d* second|over \d+\.?\d* seconds?/i.test(sl) && /damage/i.test(sl);
  if (hasDot && !sibDot)
    return `DoT morph — applies sustained damage over time rather than a single burst hit.`;
  if (!hasDot && sibDot && siblingName)
    return `Burst morph — deals damage instantly rather than over time like ${siblingName}.`;

  // 8. Summoned attacking entity / pet (excludes totems and fields)
  if (/\bsummon\b|\bconjure\b|\bcreate\b.*\b(skeleton|atronach|clannfear|shade|spectral|bear|feral|blastbone)/i.test(dl)
      && !/totem|field|wall|barrier|zone|ground/i.test(dl))
    return `Summon morph — deploys a persistent companion that attacks autonomously.`;

  // 9. Mobility / speed
  if (/\bmovement speed\b|\bexpedition\b.*speed|\bsprint\b/i.test(dl) && !myBuff?.includes('Expedition'))
    return `Mobility morph — increases Movement Speed on cast.`;

  // 10. Ultimate generation / cost reduction
  if (/\bultimate\b.*\bgenerat|\brestore.*ultimate|\bultimate.*cost.*reduc/i.test(dl))
    return `Ultimate morph — reduces cost or generates Ultimate on use.`;

  // 11. Fallback — clean generic statement based on detectable properties
  const isDoT   = /every \d+\.?\d* second|over \d+\.?\d* seconds?/i.test(dl) && /damage/i.test(dl);
  const isAoE   = /nearby enemies|target area|around you|within \d+ meter|in front of you.*(?:all|enemy)/i.test(dl);
  const isUlt   = data?.type === 'Ultimate';

  if (isUlt)  return `Ultimate morph — provides enhanced offensive or defensive utility.`;
  if (isDoT && isAoE) return `AoE DoT morph — applies sustained damage over time to multiple targets.`;
  if (isDoT)  return `DoT morph — deals sustained damage over time in addition to the initial hit.`;
  if (isAoE)  return `AoE morph — hits multiple targets simultaneously.`;
  return `Offensive morph — deals direct damage to the target.`;
}

// ---------- Main ----------
let written = 0, skipped = 0, noDesc = 0;

for (const { file, data } of skills) {
  if (!TARGET_CLASSES.has(data.class)) continue;
  if (!data.morph_of) continue;
  if (data.morph_rationale) { skipped++; continue; }

  const myKey   = `${data.name}::${data.skill_line}`;
  const sibName = data.morph_sibling ? (slugToName[data.morph_sibling] ?? null) : null;
  const sibKey  = sibName ? `${sibName}::${data.skill_line}` : null;

  const myEntry  = descMap.get(myKey);
  const sibEntry = sibKey ? descMap.get(sibKey) : null;

  if (!myEntry?.desc) { noDesc++; continue; }

  const rationale = generateRationale(data.name, sibName, myEntry.desc, sibEntry?.desc ?? null, data);

  if (DRY_RUN) {
    console.log(`[${data.name}]\n  → ${rationale}\n`);
  } else {
    const final = {
      id:              data.id,
      name:            data.name,
      base_skill:      data.base_skill,
      morph_of:        data.morph_of,
      morph_sibling:   data.morph_sibling,
      morph_rationale: rationale,
      class:           data.class,
      skill_line:      data.skill_line,
      type:            data.type,
      resource:        data.resource,
      icon:            data.icon,
      patch_verified:  data.patch_verified,
      esohub_url:      data.esohub_url,
      uesp_url:        data.uesp_url,
    };
    await writeFile(file, JSON.stringify(final, null, 2) + '\n', 'utf-8');
    written++;
  }
}

if (DRY_RUN) {
  console.log(`[dry-run] ${skills.filter(s => TARGET_CLASSES.has(s.data.class) && s.data.morph_of && !s.data.morph_rationale).length} skills would be updated, ${noDesc} skipped (no UESP description).`);
} else {
  console.log(`Done — ${written} written, ${skipped} already had rationale, ${noDesc} skipped (no description).`);
}
