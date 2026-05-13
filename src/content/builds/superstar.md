---
title: SUPERSTAR — Hybrid Dragonknight PvP
class: Dragonknight
role: DPS
resource: Hybrid
gamemode: PvP
patch: U50
updatedAt: 2025-05-11
difficulty: Intermediate
featured: true
summary: Dragonknight built to hold the line in solo and small-scale PvP. Hard
  to kill while maintaining constant pressure through Molten Whip procs and AoE
  pressure with Incinerate and Heart of Flame.
pullquote: Hard to kill. Always relevant. The longer the fight goes, the more
  Snake stacks — and the harder you bite.
sets:
  - mighty-chudan
  - rallying-cry
  - markyn-ring-of-majesty
  - armor-of-the-trainee
  - twice-fanged-serpent
skills:
  bar1:
    - molten-whip
    - disintegrating-dragonfire
    - shattering-rocks
    - quick-cloak
    - incinerate
    - take-flight
  bar2:
    - biting-jabs
    - resolving-vigor
    - blood-of-the-elder-dragon
    - heart-of-flame
    - heart-and-home
    - temporal-guard
stats:
  health:
    target: 32000
    note: "minimum viable "
  magicka:
    target: 26000
    note: ""
  stamina:
    target: 20000
    note: needed to break free & roll dodge
champion_points:
  warfare:
    - star: Cleansing Revival
      points: 50
      priority: 1
    - star: Master-at-Arms
      points: 50
      priority: 2
    - star: Ironclad
      points: 50
      priority: 3
    - star: Fighting Finesse
      points: 50
      priority: 4
  fitness:
    - star: Celerity
      points: 50
      priority: 1
    - star: Slippery
      points: 50
      priority: 2
    - star: Fortified
      points: 50
      priority: 3
    - star: Pain's Refuge
      points: 50
      priority: 4
consumables:
  food:
    name: Bewitched Sugar Skulls
    stats: Max Health + Max Magicka + Max Stamina
    note: Tri-stat food — covers all three resource pools in one slot
  potion:
    name: Essence of Weapon Power
    ingredients:
      - Dragonthorn
      - Blessed Thistle
      - Water Hyacinth or Wormwood
    note: "Grants Major Brutality + restore Stamina "
  mundus:
    stone: The Lady
    effect: Increases Physical and Spell Resistance
    note: Recommended default for this build
    alt:
      stone: The Warrior
      effect: Increases Weapon and Spell Damage
      note: Decent damage and healing increase — swap in if survivability is already
        covered
gear:
  armor:
    - slot: Head
      type: heavy
      item: Mighty Chudan Visage
      setId: mighty-chudan
      tier: 2/2
      trait: Impenetrable
      enchant: Multi-Effect
    - slot: Shoulders
      type: medium
      item: Mighty Chudan Arm Cops
      setId: mighty-chudan
      tier: 2/2
      trait: Impenetrable
      enchant: Multi-Effect
    - slot: Chest
      type: heavy
      item: Gallant Chain
      setId: armor-of-the-trainee
      tier: 1/3
      trait: Reinforced
      enchant: Multi-Effect
    - slot: Hands
      type: light
      item: Rallying Cry Gloves
      setId: rallying-cry
      tier: 5/5
      trait: Impenetrable
      enchant: Multi-Effect
    - slot: Waist
      type: light
      item: Rallying Cry Sash
      setId: rallying-cry
      tier: 5/5
      trait: Impenetrable
      enchant: Multi-Effect
    - slot: Legs
      type: medium
      item: Guards of the Two-Fanged Snake
      setId: two-fanged-snake
      tier: 5/5
      trait: Impenetrable
      enchant: Multi-Effect
    - slot: Feet
      type: medium
      item: Boots of the Two-Fanged Snake
      setId: two-fanged-snake
      tier: 5/5
      trait: Impenetrable
      enchant: Multi-Effect
  jewelry:
    - slot: Ring I
      type: jewelry
      item: Ring of the Two-Fanged Snake
      setId: two-fanged-snake
      tier: 5/5
      trait: Triune
      enchant: Multi-Effect
    - slot: Ring II
      type: mythic
      item: Markyn Ring of Majesty
      setId: markyn-ring-of-majesty
      tier: 1/1
      trait: Infused
      enchant: Multi-Effect
    - slot: Neck
      type: jewelry
      item: Rallying Cry Amulet
      setId: rallying-cry
      tier: 5/5
      trait: Triune
      enchant: Multi-Effect
  weapons:
    - slot: Main Hand
      type: weapon
      barLabel: BAR I
      item: Mace of the Two-Fanged Snake
      setId: two-fanged-snake
      tier: 5/5
      trait: Nirnhoned
      enchant: Absorb Magicka
    - slot: Off Hand
      type: weapon
      barLabel: BAR I
      item: Mace of the Two-Fanged Snake
      setId: two-fanged-snake
      tier: 5/5
      trait: Sharpened
      enchant: Charged Weapon
    - slot: Backup Main
      type: weapon
      barLabel: BAR II
      item: Rallying Cry Dagger
      setId: rallying-cry
      tier: 5/5
      trait: Defending
      enchant: Weapon Damage
    - slot: Backup Off
      type: weapon
      barLabel: BAR II
      item: Rallying Cry Shield
      setId: rallying-cry
      tier: 5/5
      trait: Sturdy
      enchant: Multi-Effect
---

## Opening

Engage on **Bar II**. Pre-cast **Heart of Flame** before committing — it applies immediate AoE pressure and forces the enemy to react. Follow immediately with **Blood of the Elder Dragon** to put a damage shield up before the first retaliation lands. Once both are out, swap to **Bar I** and close in.

## Pressure Loop (Bar I)

Bar I is your damage engine. The core loop revolves around **Molten Whip**: weave your other skills on this bar to build Seething Fury stacks, then spend them on a Molten Whip hit for amplified burst. Keep **Incinerate** refreshed — it's your sustained DoT and should never fall off. **Disintegrating Dragonfire** and **Shattering Rocks** fill the gaps and maintain pressure between Whip procs.

**Quick Cloak** is dual-purpose: use it to disengage briefly when you need to let a cooldown reset, or to make the enemy lose target lock while your resources recover.

## Sustain & Recovery (Bar II)

Bar II is your survival window. **Resolving Vigor** is your primary heal — use it *proactively* when health dips below ~60%, not in panic at 20%. **Heart and Home** stacks a shield on top of Vigor's HoT; rotate both on cooldown under sustained burst.

When you feel pressure stacking up, bar-swap to II, land both defensives, then immediately swap back to I to maintain your damage presence. Letting the fight drag is fine — this build is built for it.

## Ultimates

**Take Flight** (Bar I) is your offensive ultimate. Use it when the enemy is commitment-locked: post-dodge, post-break-free, or when a heal is on cooldown. The AoE knockback disrupts clusters in small-scale fights.

**Temporal Guard** (Bar II) is your panic button. Save it for burst windows you cannot otherwise survive. Do not burn it for damage — its value is time bought.

## Two-Fanged Serpent Stacks

The longer the fight, the more Snake stacks accumulate and the harder each proc hits. Resist the urge to force a kill early. If you're holding your own, sustained pressure compounds — the set does increasing work as the fight extends.

## Break-Free Priority

In solo PvP, crowd control is the kill condition. **Break free the moment you are grabbed** — waiting until you're fully stunned and stacked on by follow-up skills is almost always fatal. Keep at least one bar of Stamina reserved for a break free at all times.
