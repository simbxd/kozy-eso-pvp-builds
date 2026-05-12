#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dir = 'D:/Dev/kozy-eso-pvp-builds/src/content/skills';

const fixes = {
  // === MIRROR PAIRS (same-category, both reference each other with no real info) ===
  'absorb-missile':
    "Projectile heal morph — heals you for 2560 Health the next time a projectile hits the shield; preferred over Defensive Stance when self-sustain on defense matters more than reflecting projectiles back.",
  'defensive-stance':
    "Counter morph — reflects the next projectile back at the attacker and passively reduces block cost and increases block damage with a shield equipped; preferred over Absorb Missile when punishing ranged enemies and block efficiency matter.",

  'blazing-shield':
    "Burst morph — the shield explodes when it expires, dealing 33% of all absorbed damage to nearby enemies; preferred over Radiant Ward when the reactive AoE burst on expiry matters more than maximum shield size.",
  'radiant-ward':
    "Scale morph — deals upfront damage before forming the shield and scales 20% per enemy hit (up to 120% bonus strength); preferred over Blazing Shield when absorbing as much damage as possible matters more than the expiry explosion.",

  'brawler':
    "Scaling shield morph — the damage shield grows by 50% per enemy hit, up to 300% of its base strength; preferred over Carve when fighting multiple enemies to maximize the shield value.",
  'carve':
    "Sustained Bleed morph — applies a Bleed DoT that extends by 10 seconds with each hit, up to 32 seconds; preferred over Brawler when sustained single-target Bleed pressure matters more than a scaling shield.",

  'dark-conversion':
    "Magicka sustain morph — restores Magicka instantly and over time alongside Minor Berserk; preferred over Dark Deal on Magicka Sorcerer builds where Magicka sustain matters more than Stamina.",
  'dark-deal':
    "Stamina sustain morph — restores Stamina instantly and over time alongside Minor Berserk; preferred over Dark Conversion on Stamina Sorcerer builds where Stamina sustain matters more than Magicka.",

  'enchanted-forest':
    "Ultimate generation morph — generates 20 Ultimate when the initial heal lands on a target below 50% Health; preferred over Healing Thicket when ult generation on critical targets matters more than the extended out-of-area HoT.",
  'healing-thicket':
    "Sustained HoT morph — healing persists on allies for 4 extra seconds after they leave the forest; preferred over Enchanted Forest when keeping mobile allies healed matters more than Ultimate generation.",

  'enduring-undeath':
    "Extended HoT morph — consumes up to 5 additional corpses to extend the healing over time by 5 seconds each; preferred over Renewing Undeath when prolonged group healing matters more than cleansing debuffs.",
  'renewing-undeath':
    "Cleanse morph — consumes a corpse to remove up to 3 negative effects alongside the group HoT; preferred over Enduring Undeath when debuff removal matters more than extended healing duration.",

  'expansive-frost-cloak':
    "Group resistance morph — extends Major Resolve to all grouped allies for 20 seconds; preferred over Ice Fortress when spreading resistance across the group matters more than the extra duration and personal Minor Protection.",
  'ice-fortress':
    "Enhanced resistance morph — extends the buff to 30 seconds and adds Minor Protection for you personally; preferred over Expansive Frost Cloak when longer uptime and personal damage reduction matter more.",

  'fragmented-shield':
    "Group shield morph — grants equal-strength damage shields to you and nearby allies, scaling off your Max Magicka or Stamina; preferred over Igneous Shield when spreading uniform protection to allies matters more than a larger personal shield.",
  'igneous-shield':
    "Tank shield morph — provides a significantly larger personal shield (3824 vs 2400) that scales off Max Health; preferred over Fragmented Shield when maximizing your own absorption matters more than group shield equity.",

  'gibbering-shelter':
    "Group cascade morph — whenever the main shield absorbs damage it cascades a secondary shield to up to 11 nearby allies; preferred over Sanctum of the Abyssal Sea in group play where spreading protection matters more than damage retaliation.",
  'sanctum-of-the-abyssal-sea':
    "Retaliation morph — provides a larger max shield (up to 37697) and releases all absorbed damage as Magic Damage to nearby enemies when it collapses; preferred over Gibbering Shelter when solo damage retaliation matters more than group shield sharing.",

  'green-lotus':
    "Multi-target heal morph — Heavy Attacks restore Health to you and 2 nearby allies simultaneously; preferred over Lotus Blossom in group play when multi-target sustain matters more than the longer buff duration.",
  'lotus-blossom':
    "Uptime morph — lasts 1 minute (3x longer than Green Lotus) for consistent Critical rating uptime; preferred over Green Lotus when reducing rebuff frequency and solo self-sustain matter more than multi-target healing.",

  'healing-springs':
    "Resource recovery morph — restores Magicka Recovery for each ally healed, stacking up to 20 times; preferred over Illustrious Healing when self-sustaining Magicka for continued healing output matters.",
  'illustrious-healing':
    "Pure HoT morph — heals for more total Health over a longer 15-second window; preferred over Healing Springs when maximizing raw group healing throughput matters more than Magicka recovery.",

  'healing-ward':
    "Sustain morph — the shield heals the target for 33% of its remaining strength every second while it persists; preferred over Ward Ally when sustained healing through the shield duration matters more than dual coverage.",
  'ward-ally':
    "Dual shield morph — simultaneously shields both you and the lowest health ally in range; preferred over Healing Ward when protecting two targets at once matters more than the self-healing component.",

  'overflowing-altar':
    "High-synergy morph — the Blood Feast synergy heals allies for 65% of their Max Health; preferred over Sanguine Altar when maximizing the burst healing from the ally synergy is the priority.",
  'sanguine-altar':
    "Moderate-synergy morph — the Blood Funnel synergy heals allies for 40% of their Max Health; preferred over Overflowing Altar when a less powerful synergy is sufficient or multiple activations are expected.",

  'pummeling-goliath':
    "Melee burst morph — Bash attacks hit multiple enemies in front for 1799 Physical Damage; preferred over Ravenous Goliath when target-focused melee burst matters more than passive AoE presence.",
  'ravenous-goliath':
    "AoE sustain morph — passively deals 826 Magic Damage per second to all nearby enemies and heals for the same amount; preferred over Pummeling Goliath when sustained AoE pressure and automatic healing matter more.",

  'rune-of-the-colorless-pool':
    "Hard CC morph — stuns for 4 seconds and applies Minor Vulnerability and Minor Brittle, increasing damage taken and Critical Damage taken by 5% and 10%; preferred over Rune of Uncanny Adoration when hard CC plus critical damage amplification matter more than the charm.",

  'runeguard-of-freedom':
    "CC immunity morph — when taken below 50% Health, grants CC Immunity and bonus Armor for 7 seconds; preferred over Runeguard of Still Waters when escaping crowd control on low health matters more than the larger emergency heal.",
  'runeguard-of-still-waters':
    "Emergency heal morph — triggers a 4800 Health heal (double Freedom's amount) when taken below 50% Health, and immobilizes nearby enemies on cast; preferred over Runeguard of Freedom when the larger emergency heal matters more than CC immunity.",

  'aurora-javelin':
    "Range-scaling CC morph — knocks the target back 8 meters and deals up to 40% bonus damage based on distance; preferred over Binding Javelin when repositioning and long-range burst damage matter more than holding enemies in place.",

  'hearth-and-home':
    "Defensive zone morph — grants you Major Protection while inside and slows enemies within by 70%, combining group healing with zone control; preferred over Fire Keeper when personal protection and enemy movement restriction matter more than ult generation outside the area.",

  // === EXACT DUPLICATES — differentiated ===
  'agony-totem':
    "Synergy totem morph — summons at your feet with an ally-activatable Pure Agony synergy dealing 2100 Magic Damage; preferred over Remote Totem when staying near the totem and having an ally synergy matter.",
  'remote-totem':
    "Ranged placement morph — projects the totem to a target location instead of at your feet; preferred over Agony Totem when controlling a specific distant area matters more than the ally synergy.",

  'ballista':
    "Turret morph — deploys a stationary crossbow that attacks the target autonomously for 5 seconds; preferred over Toxic Barrage when hands-free deployment and freedom to act during the duration matter.",
  'toxic-barrage':
    "Channel morph — you channel the barrage directly while moving freely and immune to disabling effects, then applies a follow-up Poison DoT; preferred over Ballista when higher total damage output and channel immunity matter.",

  'barbed-trap':
    "Hemorrhaging morph — applies the Hemorrhaging status effect in addition to the Bleed and 2-second immobilize, placed at your location; preferred over Lightweight Beast Trap when status effect pressure and a melee-range trap matter.",
  'lightweight-beast-trap':
    "Ranged placement morph — launches the trap to a target location instead of placing it at your feet; preferred over Barbed Trap when controlling a specific area at range matters more than the Hemorrhaging status.",

  'beckoning-armor':
    "Anti-ranged morph — pulls ranged attackers to you and taunts them every 2 seconds while active; preferred over Summoner's Armor when punishing and repositioning ranged enemies into melee matters more than summon cost reduction.",
  'summoners-armor':
    "Summon efficiency morph — reduces the cost of Blastbones, Skeletal Mage, and Spirit Mender by 15% with a longer 30-second duration; preferred over Beckoning Armor when Necromancer summon uptime matters more than anti-ranged utility.",

  'bird-of-prey':
    "Offensive mobility morph — grants Minor Berserk while slotted, increasing damage done by 5%; preferred over Deceptive Predator when offensive output alongside the mobility matters more than area damage reduction.",
  'deceptive-predator':
    "Defensive mobility morph — grants Minor Evasion while slotted, reducing area attack damage by 10%; preferred over Bird of Prey when reducing AoE burst damage matters more than the damage bonus.",

  'blockade-of-fire':
    "Fire morph — deals Flame Damage and hits Burning enemies for 10% more; preferred over Elemental Blockade when reliable Burning synergy on a Flame staff build matters.",
  'elemental-blockade':
    "Base morph — applies different bonus effects depending on your equipped staff element; preferred when flexibility across multiple elemental builds matters more than a single specialized morph.",
  'blockade-of-storms':
    "Storm morph — deals Shock Damage and sets Concussed enemies Off Balance for Heavy Attack setups; preferred on Lightning staff builds when Concussion exploitation matters.",

  'breath-of-life':
    "Dual heal morph — heals a second injured nearby target in addition to the primary; preferred over Honor the Dead when spreading instant heals to two critical targets simultaneously matters more than Magicka sustain.",
  'honor-the-dead':
    "Magicka sustain morph — restores 18% of the ability cost as Magicka every 2 seconds when healing a target below 75% Health; preferred over Breath of Life when self-sustaining Magicka for continued healing matters more than dual coverage.",

  'burning-embers':
    "Self-sustain morph — heals you for a significant amount from the initial hit and on each subsequent tick; preferred over Searing Claw when maintaining Health in sustained combat matters more than escalating damage.",
  'searing-claw':
    "Damage escalation morph — deals 10% more damage every 2 seconds over the DoT duration; preferred over Burning Embers when maximizing damage output matters more than self-healing.",

  'cascading-fortune':
    "Triage heal morph — heals for up to 50% more based on the severity of the target's wounds; preferred over Curative Surge when prioritizing critically injured targets matters more than a sustained ramp.",
  'curative-surge':
    "Ramp morph — healing gradually increases up to 192% stronger at the end of the channel; preferred over Cascading Fortune when maximizing total output during a full uninterrupted channel matters.",

  'cephaliachs-flail':
    "Self-sustain morph — heals you for 1000 Health on hit and generates Crux; preferred over Tentacular Dread when trading burst potential for self-sustain during combat.",
  'tentacular-dread':
    "Crux burst morph — consumes all Crux to deal 33% more damage with escalating Abyssal Ink bonus per Crux; preferred over Cephaliarch's Flail when converting Crux into maximum burst damage matters more than self-healing.",

  'chakram-of-destiny':
    "Stack morph — recasting on an already-shielded target grants a 30% stronger shield and generates Crux; preferred over Tidal Chakram when layering shields and generating Crux matter more than converting shields to healing.",
  'tidal-chakram':
    "Shield-to-heal morph — consumes Crux to heal targets for 33% of the remaining shield strength per second; preferred over Chakram of Destiny when converting active shields into sustained healing matters.",

  'channeled-focus':
    "Magicka sustain morph — recovers 242 Magicka per second over the duration; preferred over Restoring Focus on Magicka Templar builds where Magicka sustain matters more than Stamina.",
  'restoring-focus':
    "Stamina sustain morph — recovers 242 Stamina per second with a slightly higher baseline heal; preferred over Channeled Focus on Stamina Templar builds where Stamina sustain matters more than Magicka.",

  'crescent-sweep':
    "Directional burst morph — enemies directly in your path take 60% more damage; preferred over Everlasting Sweep when a front-focused high-damage pass matters more than an extended DoT duration.",
  'everlasting-sweep':
    "Sustained DoT morph — extends the bleed by 2 seconds per enemy hit for prolonged AoE coverage; preferred over Crescent Sweep when fighting multiple enemies and maximizing DoT duration matter more than the directional bonus.",

  'deep-thoughts':
    "Resource recovery morph — restores 1900 Magicka and Stamina per second (vs Introspection's 1500); preferred over Introspection when maximum resource regeneration during the channel matters more than escalating healing.",
  'introspection':
    "Escalating heal morph — self-healing increases by 10% per tick up to 50% bonus at the end; preferred over Deep Thoughts when maximizing Health recovery over a sustained channel matters more than resource restoration.",

  'destructive-reach':
    "Base morph — deals Magic damage and always applies your equipped staff's status effect; preferred when element-agnostic damage or staff flexibility matters.",
  'flame-reach':
    "Fire morph — deals Flame Damage and guarantees the Burning status effect on hit; preferred on Flame staff builds when reliable Burning application matters.",
  'frost-reach':
    "Frost morph — deals higher initial Frost Damage (2091 vs 1161) and guarantees the Chilled status effect; preferred on Frost staff builds when burst and Chilled application matter.",
  'shock-reach':
    "Shock morph — deals Shock Damage and guarantees the Concussion status effect for Off Balance setup; preferred on Lightning staff builds when Concussion exploitation matters.",

  'detonating-siphon':
    "Burst DoT morph — the siphoned corpse explodes for 1799 additional AoE damage when the duration ends; preferred over Mystic Siphon when burst AoE on channel expiry matters more than passive recovery.",
  'mystic-siphon':
    "Sustain DoT morph — grants 150 Health, Magicka, and Stamina Recovery while the siphon is active; preferred over Detonating Siphon when passive recovery during the channel matters more than the final explosion.",

  'elemental-drain':
    "Magicka leech morph — applies Minor Magickasteal alongside Major Breach, restoring 168 Magicka per second to you and allies when damaging the target; preferred over Elemental Susceptibility when group Magicka sustain matters more than status effects.",
  'elemental-susceptibility':
    "Status chain morph — applies Burning, Chilled, and Concussion every 7.5 seconds; preferred over Elemental Drain when stacking all three elemental status effects for follow-up abilities matters more than the Magicka leech.",

  'expunge-and-modify':
    "Resource cleanse morph — restores 515 Magicka and Stamina for each of the 2 effects removed; preferred over Hexproof when resource restoration alongside cleansing matters more than removing more debuffs.",
  'hexproof':
    "Deep cleanse morph — removes up to 4 negative effects instead of 2; preferred over Expunge and Modify when clearing more debuffs in one cast matters more than the resource restoration.",

  'fetcher-infection':
    "Double damage morph — every second cast deals 60% more damage; preferred over Growing Swarm when burst on a single target and combo casting matter more than AoE spread.",
  'growing-swarm':
    "AoE spread morph — nearby enemies take Bleed damage every 2 seconds for the duration; preferred over Fetcher Infection when spreading damage to clustered enemies matters more than single-target burst.",

  'flying-blade':
    "Burst mobility morph — marks a target for a free gap-close reactivation dealing 2160 bonus damage, with a 40-second Major Brutality buff; preferred over Shrouded Daggers when burst follow-up and longer buff uptime matter more.",
  'shrouded-daggers':
    "Multi-target interrupt morph — bounces to up to 3 nearby enemies, interrupting and potentially stunning multiple casters; preferred over Flying Blade when chain-interrupting multiple targets matters more than single-target burst.",

  'greater-storm-atronach':
    "Sustained DPS atronach — attacks the closest enemy every second for reliable focused damage with an ally synergy granting Major Berserk; preferred over Summon Charged Atronach when consistent single-target output matters more than AoE bursts.",
  'summon-charged-atronach':
    "AoE atronach — calls lightning storms every 2 seconds dealing damage to all nearby enemies and applying Concussion; preferred over Greater Storm Atronach when AoE pressure and Off Balance setup matter more.",

  'impale':
    "Execute morph — deals 330% more damage to targets below 25% Health; preferred over Killer's Blade when a deep, narrow execute window matters.",
  'killers-blade':
    "Execute heal morph — deals up to 400% more damage below 50% Health and heals you for 2399 if the target dies within 2 seconds; preferred over Impale when an earlier execute threshold and self-healing on kills matter.",

  'impervious-runeward':
    "Burst shield morph — provides an enormous initial shield for 1 second before settling into a sustained secondary shield; preferred over Spiteward of the Lucid Mind when absorbing a single large incoming burst matters more than cost efficiency.",
  'spiteward-of-the-lucid-mind':
    "Cost-efficient shield morph — spending Crux also refunds 30% of the ability cost per Crux spent; preferred over Impervious Runeward when sustained shielding and Crux economy matter more than the initial burst absorption.",

  'inspired-scholarship':
    "Crux generation morph — pulses every 3 seconds (vs 5), generating Crux more frequently for faster combo access; preferred over Recuperative Treatise when Crux uptime matters more than per-pulse resource restoration.",
  'recuperative-treatise':
    "Resource sustain morph — pulses every 5 seconds for higher per-hit damage and restores 600 Magicka and Stamina per pulse; preferred over Inspired Scholarship when resource sustain matters more than Crux generation speed.",

  'lightning-flood':
    "Burst AoE morph — deals higher Shock damage per tick over 10 seconds; preferred over Liquid Lightning when front-loaded burst matters more than prolonged area coverage.",
  'liquid-lightning':
    "Sustained AoE morph — extends to 15 seconds at a lower per-tick rate; preferred over Lightning Flood when prolonged area denial and DoT uptime matter more than burst.",

  'merciless-resolve':
    "Self-sustain proc morph — fires the spectral arrow at 5 stacks, healing for 50% of damage dealt in melee range; preferred over Relentless Focus when self-healing on the proc matters more than faster stack consumption.",
  'relentless-focus':
    "Faster proc morph — fires the spectral arrow at 4 stacks instead of 5, triggering more frequently; preferred over Merciless Resolve when proc frequency matters more than the larger self-heal.",

  'mirage':
    "Resistance morph — adds Minor Resolve alongside Major Evasion, increasing Physical and Spell Resistance; preferred over Phantasmal Escape when stacking evasion with armor resistance matters more than snare removal.",
  'phantasmal-escape':
    "Escape morph — removes all snares and immobilizations on cast and grants immunity for 4 seconds; preferred over Mirage when breaking CC and preventing reapplication matters more than the resistance bonus.",

  'pierce-armor':
    "Dual breach morph — applies both Minor and Major Breach, reducing enemy Physical and Spell Resistance by a combined 8922; preferred over Ransack when maximum armor penetration on the taunted target matters.",
  'ransack':
    "Self-protection taunt morph — applies Major Breach and grants Minor Protection, reducing your own damage taken by 5%; preferred over Pierce Armor when personal survivability alongside armor penetration matters more.",

  'piercing-mark':
    "Anti-stealth morph — exposes nearby stealthed enemies when the mark is applied in addition to Major Breach; preferred over Reaper's Mark when tracking invisible targets matters more than the post-kill damage burst.",
  'reapers-mark':
    "Execute reward morph — grants Major Berserk for 10 seconds on kill in addition to the full Health restore; preferred over Piercing Mark when a damage burst after the kill matters more than stealth detection.",

  'rend':
    "Sustained Bleed morph — deals higher total damage over 16 seconds with consistent self-healing; preferred over Thrive in Chaos when prolonged sustained pressure on a single target matters more than stacking damage bonuses.",
  'thrive-in-chaos':
    "Damage stack morph — gains 6% bonus damage per enemy hit, up to 36% with 6 targets; preferred over Rend when fighting multiple enemies and escalating damage from stacks matter more than single-target output.",

  'shield-discipline':
    "Cost-free block morph — all One Hand and Shield abilities cost nothing while active; preferred over Spell Wall when chaining shield abilities without cost during the block window matters more than projectile reflection.",
  'spell-wall':
    "Projectile reflection morph — reflects all projectiles cast at you while auto-blocking; preferred over Shield Discipline when countering ranged heavy attackers matters more than free ability costs.",

  'skeletal-arcanist':
    "AoE mage morph — the skeletal mage hits the closest enemy and all nearby enemies with each attack; preferred over Skeletal Archer when AoE minion damage matters more than single-target escalation.",
  'skeletal-archer':
    "Escalating damage morph — each attack by the archer deals 15% more than the previous, building in damage over time; preferred over Skeletal Arcanist when focused single-target escalating damage matters more.",

  'unstable-wall-of-elements':
    "Base unstable morph — applies element-dependent effects and explodes for 1199 bonus Magic Damage when the barrier ends; preferred when element flexibility alongside the expiry burst matters.",
  'unstable-wall-of-fire':
    "Fire unstable morph — hits Burning enemies for 10% more and explodes for 1199 Flame AoE on expiry; preferred on Flame staff builds when Burning synergy and end-of-duration burst matter.",
  'unstable-wall-of-storms':
    "Storm unstable morph — sets Concussed enemies Off Balance and explodes for 1199 Shock AoE on expiry; preferred on Lightning staff builds when Off Balance exploitation and the burst on expiry matter.",
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
