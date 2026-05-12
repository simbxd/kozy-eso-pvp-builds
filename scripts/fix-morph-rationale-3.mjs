#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dir = 'D:/Dev/kozy-eso-pvp-builds/src/content/skills';

const fixes = {
  // === ALLIANCE WAR — ASSAULT ===
  'aggressive-horn':
    "Offensive group morph — grants Major Force to you and allies for 10 seconds, increasing Critical Damage by 20%; preferred over Sturdy Horn when boosting group burst output matters more than Crit Resistance.",
  'sturdy-horn':
    "Defensive group morph — grants 1320 Critical Resistance to you and allies for 10 seconds, reducing incoming Critical Damage by 20%; preferred over Aggressive Horn when survivability against burst matters more than offensive output.",

  'razor-caltrops':
    "Armor pen morph — applies Major Breach to enemies inside the area, reducing their Physical and Spell Resistance by 5948; preferred over Anti-Cavalry Caltrops when armor penetration in foot combat matters more than mount disruption.",
  'anti-cavalry-caltrops':
    "Anti-mount morph — drains Mount Stamina from enemies in the area, dismounting riders; preferred over Razor Caltrops in siege scenarios where preventing mounted movement matters.",

  'charging-maneuver':
    "Speed stack morph — grants both Major and Minor Expedition to the group for up to 45% total Movement Speed increase; preferred over Retreating Maneuver when maximum approach speed matters more than rear damage reduction.",
  'retreating-maneuver':
    "Defensive retreat morph — reduces damage taken from behind by 15% while the group moves at Major Expedition speed; preferred over Charging Maneuver when protecting the group during withdrawals matters more than peak speed.",

  'echoing-vigor':
    "Group heal morph — extends the heal over time to you and all allies in the area; preferred over Resolving Vigor when group sustain matters more than personal Stamina restoration.",

  'inevitable-detonation':
    "Target bomb morph — places the detonation on an enemy and triggers immediately if the debuff is dispelled; preferred over Proximity Detonation when punishing enemy purges and targeting specific opponents matters.",
  'proximity-detonation':
    "Self-bomb morph — activates the explosion centered on yourself, including you in the enemy count for damage scaling; preferred over Inevitable Detonation when baiting enemies into melee range for maximum AoE matters.",

  // === ALLIANCE WAR — SUPPORT ===
  'blinding-flare':
    "CC reveal morph — stuns exposed enemies for 4 seconds immediately after revealing them; preferred over Lingering Flare when punishing stealth classes with an unblockable stun matters more than extended reveal duration.",
  'lingering-flare':
    "Extended reveal morph — doubles the reveal duration to 10 seconds, keeping enemies exposed and out of stealth longer; preferred over Blinding Flare when sustained area denial against stealth matters more than the stun.",

  'cleanse':
    "Heal-on-cleanse morph — heals each target for 5% of their Max Health per negative effect removed; preferred over Efficient Purge when combining debuff removal with group healing matters.",
  'efficient-purge':
    "Pure cleanse morph — removes up to 3 negative effects at lower cost without conditional healing; preferred over Cleanse when spamming cleanses cost-efficiently matters more than the heal.",

  'mystic-guard':
    "Defensive guard morph — grants Minor Vitality to you and the bonded ally, increasing healing received and shield strength by 6%; preferred over Stalwart Guard when maximizing the survivability of a protected target matters.",
  'stalwart-guard':
    "Offensive guard morph — grants Minor Force to you and the bonded ally, increasing Critical Damage by 10%; preferred over Mystic Guard when boosting burst damage on a protected target matters.",

  'propelling-shield':
    "Range extension morph — increases the range of abilities over 28 meters by 7 additional meters; preferred over Siege Weapon Shield when extending reach for ranged players matters more than protecting siege equipment.",
  'siege-weapon-shield':
    "Siege protection morph — reduces damage to allied siege weapons by 75% in addition to the standard player protection; preferred over Propelling Shield when defending siege equipment in keep defense matters.",

  'replenishing-barrier':
    "Resource recovery morph — restores 1500 Magicka each time a ward dissolves; preferred over Reviving Barrier when sustaining Magicka economy through extended fights matters more than the group heal over time.",
  'reviving-barrier':
    "Group sustain morph — adds a 5370 Health over 15 seconds heal over time to all warded allies; preferred over Replenishing Barrier when keeping the group healthy through attrition matters more than Magicka return.",

  // === WORLD — SOUL MAGIC ===
  'consuming-trap':
    "Self-sustain trap morph — heals for 3200 Health and restores 2400 Magicka and Stamina when an affected enemy dies; preferred over Soul Splitting Trap when resource recovery on kills matters more than AoE spread.",
  'soul-splitting-trap':
    "AoE trap morph — spreads the DoT to nearby enemies in addition to the primary target; preferred over Consuming Trap when trapping grouped enemies matters more than personal sustain on kill.",

  'shatter-soul':
    "AoE burst morph — the soulfire overflows and explodes on all nearby enemies after the channel, dealing 2399 bonus Magic Damage; preferred over Soul Assault when hitting clustered enemies after the channel matters.",
  'soul-assault':
    "Maximum damage morph — deals 20400 Magic Damage to a single target over 6 seconds (vs Shatter Soul's 14814); preferred when maximizing focused burst on one target matters more than the AoE explosion.",

  // === WORLD — VAMPIRE ===
  'arterial-burst':
    "Guaranteed crit execute morph — always Critically Strikes when cast below 50% Health, dealing up to 33% more damage based on missing Health; preferred over Blood for Blood when reliable critical burst matters more than extreme execute scaling.",
  'blood-for-blood':
    "Extreme execute morph — deals up to 75% more damage based on missing Health (vs 33%), massively amplifying low-Health burst; preferred over Arterial Burst when raw execute damage matters more than the guaranteed crit.",

  'blood-mist':
    "Sustain mist morph — drains blood from nearby enemies for 20 seconds after dispersing, dealing damage and healing you for 45% of it; preferred over Elusive Mist when sustained self-healing during the form matters more than post-dash movement buffs.",
  'elusive-mist':
    "Mobility mist morph — grants Major Expedition and Major Evasion on reappearing, boosting speed and reducing AoE damage by 20%; preferred over Blood Mist when escaping and evading after the dash matters more than sustain.",

  'drain-vigor':
    "Stamina sustain morph — restores 10% of missing Stamina per second alongside the heal over the 3-second channel; preferred over Exhilarating Drain when dual-resource recovery during the drain matters more than Ultimate generation.",
  'exhilarating-drain':
    "Ultimate generation morph — generates 5 Ultimate per second over the channel duration; preferred over Drain Vigor when fueling Ultimate abilities matters more than Stamina restoration.",

  'hypnosis':
    "AoE stun morph — affects all nearby enemies facing you rather than only those in front; preferred over Stupefy when stunning multiple surrounding enemies simultaneously matters.",
  'stupefy':
    "Snare follow-up morph — applies a 53% Movement Speed reduction after the 5-second stun expires, extending control beyond the initial stun window; preferred over Hypnosis when prolonged chase-prevention on a single target matters.",

  'perfect-scion':
    "Penalty-free Ultimate morph — reaches Vampire Stage 5 with none of the usual drawbacks (fire weakness, detection), granting all Stage 4 benefits without penalties; preferred over Swarming Scion when removing Vampire Stage penalties during combat matters more than AoE damage.",
  'swarming-scion':
    "Offensive Ultimate morph — summons bats that deal 870 Magic Damage per second to surrounding enemies during transformation; preferred over Perfect Scion when continuous AoE pressure matters more than negating Vampire Stage drawbacks.",

  'simmering-frenzy':
    "Maximum damage morph — stacks up to 400 Weapon and Spell Damage (vs 300), prioritizing peak offensive output; preferred over Sated Fury when sustaining maximum damage per second during the frenzy matters more than recovering Health on deactivation.",
  'sated-fury':
    "Sustain frenzy morph — heals for 33% of the total Health spent when toggled off, recovering the self-damage cost; preferred over Simmering Frenzy when offsetting Health drain matters more than maximum damage stacking.",

  // === WORLD — WEREWOLF ===
  'brutal-pounce':
    "AoE pounce morph — initial hit applies Hemorrhaging to all nearby enemies and stacks up to 600 Weapon and Spell Damage based on enemies hit; preferred over Feral Pounce when engaging multiple targets simultaneously matters.",
  'feral-pounce':
    "Sustain pounce morph — each hit restores 100 Stamina and extends the Werewolf Transformation by 1 second; preferred over Brutal Pounce when prolonging the transformation and sustaining Stamina in single-target combat matters.",

  'claws-of-anguish':
    "Anti-heal morph — applies Major Defile for 4 seconds on hit, reducing enemy healing received and shield strength by 12%; preferred over Claws of Life when countering enemy sustain matters more than personal healing.",
  'claws-of-life':
    "Self-sustain morph — heals you for 66% of the Disease damage over time caused, generating significant passive healing during the DoT; preferred over Claws of Anguish when recovering Health through sustained combat matters more than anti-heal.",

  'deafening-roar':
    "Debuff morph — applies Major Breach (−5948 Physical and Spell Resistance) and Minor Maim (−5% damage dealt) to feared enemies for 10 seconds; preferred over Ferocious Roar when sustained armor penetration and damage mitigation on enemies matters.",
  'ferocious-roar':
    "Offensive morph — speeds up your Heavy Attacks by 33% for 10 seconds and grants Major Savagery and Prophecy while slotted, boosting Weapon and Spell Critical; preferred over Deafening Roar when maximizing personal Heavy Attack pressure matters.",

  'hircines-fortitude':
    "Sustain heal morph — heals for 8002 Health (vs 6197) and grants Minor Endurance and Fortitude at full Health, boosting all recovery by 15% for 20 seconds; preferred over Hircine's Rage when maximizing healing output and long-term sustain matters.",
  'hircines-rage':
    "Offensive conditional morph — grants Major Berserk at full Health, increasing damage done by 10% at the cost of taking 5% more damage; preferred over Hircine's Fortitude when burst damage windows matter more than sustained healing.",

  'howl-of-agony':
    "Double condition morph — deals 10% bonus damage to both Terrified and Off Balance enemies simultaneously; preferred over Howl of Despair when stacking damage bonuses from Roar's debuffs matters more than providing ally synergies.",
  'howl-of-despair':
    "Synergy morph — provides the Feeding Frenzy synergy, granting allies Empower and Minor Force (+10% Critical Damage) for 20 seconds; preferred over Howl of Agony when enabling ally Heavy Attack burst and group critical damage matters.",

  'pack-leader':
    "Group support Ultimate morph — summons two direwolves and grants Minor Courage to the group, increasing Weapon and Spell Damage by 215; preferred over Werewolf Berserker when contributing group utility alongside 10% personal damage reduction matters.",
  'werewolf-berserker':
    "Offensive Ultimate morph — Light Attacks apply a 3716 Bleed DoT and Heavy Attacks deal AoE damage during transformation; preferred over Pack Leader when maximizing personal offensive output in the werewolf form matters.",
};

let count = 0, missing = 0;
for (const [id, rationale] of Object.entries(fixes)) {
  const file = join(dir, id + '.json');
  if (!existsSync(file)) { console.log('MISSING:', id); missing++; continue; }
  const data = JSON.parse(readFileSync(file, 'utf-8'));
  data.morph_rationale = rationale;
  writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  count++;
}
console.log(`Fixed: ${count} — Missing: ${missing}`);
