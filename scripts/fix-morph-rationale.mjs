#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dir = 'D:/Dev/kozy-eso-pvp-builds/src/content/skills';

const fixes = {
  // === WRONG LABELS ===
  'blessing-of-restoration': "Group heal morph — heals you and allies in front of you and grants Minor Resolve, boosting Physical and Spell Resistance; preferred over Combat Prayer when sustained defense matters more than the Minor Berserk damage buff.",
  'combat-prayer': "Support morph — heals you and allies and adds Minor Berserk alongside Minor Resolve, increasing damage done by 5%; preferred over Blessing of Restoration when boosting group output alongside healing matters.",
  'endless-fury': "Resource recovery morph — restores 4860 Magicka when an enemy dies within 5 seconds of being struck; preferred over Mages' Wrath when sustaining Magicka in execute windows matters more than cleave damage.",
  'mages-wrath': "Execute AoE morph — the execute explosion damages all nearby enemies, not just the initial target; preferred over Endless Fury when cleave during execute windows matters more than resource recovery.",
  'northern-storm': "Damage amp morph — ramps damage output by up to +18% over 9 stacks and grants Major Protection to you and allies; preferred over Permafrost when sustained damage scaling matters more than maximum enemy slow.",
  'permafrost': "Snare morph — slows enemies by 70% instead of Northern Storm's 40% and applies Chilled; preferred when maximum enemy movement restriction matters more than the damage escalation.",
  'crippling-grasp': "CC morph — immobilizes the target for 2 seconds in addition to the DoT and 30% slow; preferred over Debilitate when a hard immobilize matters more than a stronger snare.",
  'debilitate': "Snare morph — applies a stronger 50% slow (vs 30%) and raises the chance of Overcharged status; preferred over Crippling Grasp when movement control and status procs matter more than the immobilize.",
  'radiant-aura': "Support morph — applies Minor Endurance, Fortitude, and Intellect to you and nearby group members for 1 minute, boosting all recovery; preferred over Repentance when long-duration passive recovery buffs matter more than burst group healing.",
  'renewing-animation': "Resurrection morph — revives up to 3 allies at the target location and restores Magicka and Stamina for each one revived; preferred over Animate Blastbones when group recovery after a wipe matters more than a damage summon.",
  'precognition': "Defensive Ultimate morph — resets position, Health, Magicka, and Stamina to 4 seconds ago and can be activated through crowd control; preferred over Temporal Guard when surviving a coordinated burst and escaping CC simultaneously matters.",
  'blood-sacrifice': "Multi-target heal morph — can consume a nearby corpse to simultaneously heal a second target; preferred over Resistant Flesh when double-heals or burst group sustain matter more.",
  'resistant-flesh': "Defensive heal morph — grants the healed target Physical and Spell Resistance equal to half the heal amount; preferred over Blood Sacrifice when protecting a single ally with both healing and resistance matters.",
  'bursting-vines': "Mobility heal morph — gap-closes to an ally to heal them and generates Ultimate when the target is below 60% Health; preferred over Nature's Embrace when rapid repositioning and ult generation on critical targets matter.",
  'grave-lords-sacrifice': "Self-buff morph — sacrifices a summoned skeleton to boost all Necromancer ability and DoT damage by 15% for 20 seconds; preferred over Blighted Blastbones when damage amplification matters more than applying Major Defile.",

  // === VAGUE EFFECTIVENESS ===
  'audacious-runemend': "Support morph — grants Minor Heroism to allies below 50% Health after healing, generating Ultimate; preferred over Evolving Runemend when conditional ult generation on critical targets matters.",
  'blood-of-the-green-dragon': "Recovery buff morph — heals and grants Major Endurance, Fortitude, and Minor Vitality for 20 seconds, boosting all recovery; preferred over Blood of the Elder Dragon when sustained recovery buffs matter more than burst healing.",
  'enchanted-growth': "Support morph — grants Minor Intellect and Minor Endurance to healed allies, boosting Magicka and Stamina Recovery; preferred over Soothing Spores when resource recovery buffs matter more than raw healing output.",
  'fire-keeper': "Support morph — grants Minor Fortitude and Minor Heroism to healed targets, generating Ultimate over time; preferred over Hearth and Home when sustained ult generation for the group matters more than Major Protection.",
  'healthy-offering': "Self-buff morph — heals for more Health at the cost of higher self-drain, then grants Minor Mending after cast; preferred over Shrewd Offering when the healing bonus and post-cast buff outweigh the extra self-damage.",
  'regenerative-ward': "Support morph — provides a damage shield and grants Minor Intellect and Minor Endurance to nearby allies, boosting resource recovery; preferred over Hardened Ward when group utility matters more than a larger personal shield.",
  'shimmering-shield': "Ultimate generation morph — absorbs up to 3 projectiles and grants Major Heroism on each hit, rapidly generating Ultimate; preferred over Crystallized Slab when ult economy matters more than the stun.",
  'soul-siphon': "Group sustain morph — heals nearby allies and grants Major Vitality, boosting healing received and damage shield strength; preferred over Soul Tether when group survivability matters more than the stun.",
  'vibrant-shroud': "Hybrid morph — heals you and allies with Minor Vitality while simultaneously applying Major Maim to nearby enemies; preferred over Shattering Spines when combining group sustain with damage mitigation.",

  // === OFFENSIVE FALLBACK ===
  'crystal-weapon': "Weapon buff morph — enchants the next two Light and Heavy Attacks to deal bonus damage and reduce the target's Armor by 1000; preferred over Crystal Fragments when sustained weapon pressure matters more than proc burst.",
  'elemental-weapon': "Status proc morph — infuses the next Light Attack with Magic damage and an elemental status effect; preferred over Crushing Weapon when triggering Burning, Concussion, or Chill matters more than direct armor reduction.",
  'evolving-runemend': "Sustained heal morph — adds a 6-second HoT to the three-pulse heal and scales its cost down with Crux stacks; preferred over Audacious Runemend when sustained healing outweighs conditional Minor Heroism.",
  'fire-ring': "Execute AoE morph — Ring Afterburn deals up to 300% more damage on targets below 50% Health; preferred over Elemental Ring when grouped low-health enemies are the primary target.",
  'frost-ring': "Defensive AoE morph — deals Frost damage and grants Minor Protection to you and nearby allies; preferred over Elemental Ring when reducing incoming damage alongside AoE output matters.",
  'shock-ring': "Scaling AoE morph — damage increases by 5% per enemy hit, up to 6 times; preferred over Elemental Ring when hitting multiple grouped enemies is the priority.",
  'focused-aim': "Armor debuff morph — applies the Sundered status effect, reducing the target's Physical Resistance; preferred over Lethal Arrow when Physical penetration matters more than anti-heal.",
  'passage-between-worlds': "Utility morph — creates a twin portal for teleportation that allies can use, generating Crux on each teleport; preferred over Fleet-Footed Gate when portal sharing and Crux generation matter more than the movement speed buff.",
  'power-overload': "Offensive Ultimate morph — replaces Light and Heavy Attacks with high-damage lightning abilities while draining Ultimate; preferred over Energy Overload when sustained offensive output matters more than resource management.",
  'power-slam': "Interrupt morph — deals higher damage and costs 50% less after blocking an attack via Resentment stacking; preferred over Reverberating Bash when blocking into a counterattack matters more than the stun.",
  'rapid-strikes': "Burst morph — lands four rapid hits with escalating damage per strike; preferred over Bloodthirst when sustained burst pressure matters more than self-healing between hits.",
  'rune-of-uncanny-adoration': "Crowd control morph — charms the target into moving toward you and applies Minor Vulnerability for 10 seconds, increasing their damage taken; preferred over Rune of the Colorless Pool when soft CC and damage amplification matter more than a hard stun.",
  'subterranean-assault': "Double-hit morph — shalk attack twice in delayed waves, dealing Poison damage; preferred over Deep Fissure when consistent DPS pressure matters more than armor penetration.",
  'shrewd-offering': "Self-preservation morph — heals an ally while draining less Health from yourself than Healthy Offering; preferred when minimizing self-damage matters more than the post-cast Minor Mending buff.",

  // === EXACT DUPLICATES — differentiated ===
  'arrow-barrage': "Burst AoE DoT morph — rains arrows for 8 seconds with higher damage per tick; preferred over Endless Hail when front-loaded burst pressure matters more than prolonged area coverage.",
  'endless-hail': "Sustained AoE DoT morph — extends the rain to 13 seconds at a lower per-tick rate; preferred over Arrow Barrage when prolonged area denial matters more than burst.",
  'steel-tornado': "AoE morph — hits all nearby enemies with up to 33% bonus damage on targets below 50% Health; preferred over Whirling Blades when hitting multiple targets consistently matters more than execute potential.",
  'whirling-blades': "Execute AoE morph — deals up to 100% bonus damage on targets below 50% Health; preferred over Steel Tornado when burst-finishing low-health enemies in melee range is the priority.",
  'daedric-prey': "Pet synergy morph — Daedric Summoning pets prioritize the cursed target and deal 50% more damage to them; preferred over Haunting Curse on pet-focused Sorcerer builds.",
  'haunting-curse': "Double detonation morph — the curse explodes twice (at 3.5 and 12 seconds) for greater total damage; preferred over Daedric Prey when burst without pet support matters.",
  'summon-twilight-matriarch': "Support summon morph — the Matriarch's active ability heals two allies; preferred over Summon Twilight Tormentor in group settings where ally sustain matters more than burst damage.",
  'summon-twilight-tormentor': "Offensive summon morph — the Tormentor's active ability deals 60% bonus damage to targets above 50% Health; preferred over Summon Twilight Matriarch when sustained offensive pressure matters more.",
  'berserker-rage': "Defensive Ultimate morph — grants immunity to disabling and snare effects and converts enemy Resistance into your own defenses; preferred over Onslaught when survivability during the engage matters more than maximum burst.",
  'onslaught': "Offensive Ultimate morph — converts enemy Resistance into Spell and Physical Penetration and grants 100% Critical Chance in PvP; preferred over Berserker Rage when maximum burst on the initial engage matters.",
  'camouflaged-hunter': "Crit-trigger morph — grants Minor Berserk for 5 seconds after dealing Critical Damage from an enemy's flank; preferred over Evil Hunter when burst windows from ambush position matter.",
  'evil-hunter': "Stamina Guild morph — increases the damage of Stamina Fighters Guild abilities by 25% while slotted; preferred over Camouflaged Hunter when those abilities are core to the rotation.",
  'defensive-rune': "Reactive CC morph — places a protective rune on yourself that stuns the next enemy to attack you, unblockable; preferred over Rune Cage when punishing incoming aggression matters more than initiating CC.",
  'rune-cage': "Offensive CC morph — imprisons a target in an unblockable stun that deals 1799 bonus damage if the stun lasts its full duration; preferred over Defensive Rune when initiating CC on a specific target.",
  'ice-comet': "CC Ultimate morph — stuns and slows enemies in the area by 50% for 5 seconds after impact; preferred over Shooting Star when maximum area disruption matters more than Ultimate generation.",
  'shooting-star': "Ultimate generation morph — generates up to 60 Ultimate from the initial blast based on enemies hit; preferred over Ice Comet when rapid Ultimate cycling matters more than the movement slow.",
  'borrowed-time': "Anti-heal CC morph — stuns enemies at channel end and applies 5000 Heal Absorption, negating the next burst of incoming heals; preferred over Time Freeze when anti-heal in the CC window matters.",
  'time-freeze': "CC morph — channels for 4 seconds then stuns enemies; preferred over Borrowed Time when a clean stun without the heal absorption mechanic is sufficient.",
  'explosive-charge': "AoE CC morph — strikes all enemies in the area and grants Major Protection for 15 seconds; preferred over Toppling Charge in multi-enemy situations or when longer damage reduction matters.",
  'toppling-charge': "Single-target CC morph — focuses the charge and taunt on one enemy with 7 seconds of Major Protection; preferred over Explosive Charge when single-target burst CC is the priority.",
  'eternal-guardian': "Summon morph — grizzly deals Magic damage with an execute ultimate that hits 150% harder below 25% HP; preferred over Wild Guardian when the execute burst matters more than sustained Bleed.",
  'wild-guardian': "Bleed summon morph — grizzly deals Bleed damage with increased Hemorrhaging chance; preferred over Eternal Guardian when sustained Bleed pressure and status effects matter more.",
  'radiant-glory': "Self-sustain execute morph — heals you for 15% of all damage dealt and triggers execute bonus below 33% HP; preferred over Radiant Oppression when sustaining Health during the execute phase matters.",
  'radiant-oppression': "Execute morph — triggers the execute bonus at 40% HP (vs 33%), accelerating the kill window; preferred over Radiant Glory when maximizing execute damage matters more than self-healing.",
  'solar-disturbance': "Synergy CC morph — the Supernova synergy deals 2607 AoE damage and stuns allies for 3 seconds; preferred over Solar Prison when a lighter synergy burst is acceptable alongside Major Maim.",
  'solar-prison': "Synergy CC morph — the Gravity Crush synergy deals 5215 AoE damage and stuns for 5 seconds; preferred over Solar Disturbance when maximum ally synergy damage and stun duration matter.",
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
