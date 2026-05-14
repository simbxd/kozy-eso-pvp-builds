---
title: Solo Knight
class: Dragonknight
role: DPS
resource: Hybrid
gamemode: PvP
patch: U50
author: Kozy
difficulty: Intermediate
featured: true
summary: Dragonknight built to hold the line in solo and small-scale PvP. Hard
  to kill while maintaining constant pressure through Molten Whip procs and AoE
  pressure with Incinerate and Heart of Flame.
pullquote: Hard to kill. Always relevant. The longer the fight goes, the more
  Snake stacks — and the harder you bite.
race: dunmer
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
    - race-against-time
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
    target: 27000
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
    id: bewitched-sugar-skulls
    note: Tri-stat food — covers all three resource pools in one slot
  potion:
    id: essence-of-weapon-power
    note: Grants Major Brutality + restores Stamina
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
      trait: impenetrable
      enchant: glyph-of-prismatic-defense
    - slot: Shoulders
      type: medium
      item: Mighty Chudan Arm Cops
      setId: mighty-chudan
      tier: 2/2
      trait: impenetrable
      enchant: glyph-of-prismatic-defense
    - slot: Chest
      type: heavy
      item: Gallant Chain
      setId: armor-of-the-trainee
      tier: 1/3
      trait: reinforced
      enchant: glyph-of-prismatic-defense
    - slot: Hands
      type: light
      item: Rallying Cry Gloves
      setId: rallying-cry
      tier: 5/5
      trait: impenetrable
      enchant: glyph-of-prismatic-defense
    - slot: Waist
      type: light
      item: Rallying Cry Sash
      setId: rallying-cry
      tier: 5/5
      trait: impenetrable
      enchant: glyph-of-prismatic-defense
    - slot: Legs
      type: medium
      item: Guards of the Two-Fanged Snake
      setId: two-fanged-snake
      tier: 5/5
      trait: impenetrable
      enchant: glyph-of-prismatic-defense
    - slot: Feet
      type: medium
      item: Boots of the Two-Fanged Snake
      setId: two-fanged-snake
      tier: 5/5
      trait: impenetrable
      enchant: glyph-of-prismatic-defense
  jewelry:
    - slot: Ring I
      type: jewelry
      item: Ring of the Two-Fanged Snake
      setId: two-fanged-snake
      tier: 5/5
      trait: triune
      enchant: glyph-of-increase-physical-harm
    - slot: Ring II
      type: mythic
      item: Markyn Ring of Majesty
      setId: markyn-ring-of-majesty
      tier: 1/1
      trait: infused-jewelry
      enchant: glyph-of-increase-physical-harm
    - slot: Neck
      type: jewelry
      item: Rallying Cry Amulet
      setId: rallying-cry
      tier: 5/5
      trait: triune
      enchant: glyph-of-increase-physical-harm
  weapons:
    - slot: Main Hand
      type: weapon
      barLabel: BAR I
      item: Mace of the Two-Fanged Snake
      setId: two-fanged-snake
      tier: 5/5
      trait: nirnhoned-weapon
      enchant: glyph-of-absorb-magicka
    - slot: Off Hand
      type: weapon
      barLabel: BAR I
      item: Mace of the Two-Fanged Snake
      setId: two-fanged-snake
      tier: 5/5
      trait: sharpened
      enchant: glyph-of-shock
    - slot: Backup Main
      type: weapon
      barLabel: BAR II
      item: Rallying Cry Dagger
      setId: rallying-cry
      tier: 5/5
      trait: defending
      enchant: glyph-of-weapon-damage
    - slot: Backup Off
      type: weapon
      barLabel: BAR II
      item: Rallying Cry Shield
      setId: rallying-cry
      tier: 5/5
      trait: sturdy
      enchant: glyph-of-prismatic-defense
playstyle:
  buffs:
    - skill: Hearth and Home
      note: '"Major Protection" source, decent HoT — keep it below you. '
    - skill: Quick Cloak
      note: '"Major Evasion" source, +30% Movement speed for 4 seconds. —  should be
        up 24/24.'
    - skill: Resolving Vigor
      note: Main HoT — keep high uptime.
    - skill: Race Against Time
      note: Minor Force, Major Expedition, speed-scaling — kite, don't camp.
  combo:
    - Incinerate - Delayed AoE Burst
    - Heart of Flame — Delayed AoE Burst
    - Disintegrating Dragon Fire - Debuff
    - Shattering Rocks - Stun your target
    - Molten whip or Take Flight - Final Burst
  rules:
    - title: Don't rush the kill
      body: Every skill you cast outside a window is a tell. Stack your burst, read
        the opening, release everything at once — if they survive, reset and
        wait for the next one.
    - title: Break free immediately
      body: CC is the kill condition in solo PvP. Break the moment you're grabbed — do
        not stand still.
    - title: Heal before panic
      body: Keep good uptime on Resolving Vigor, use your Burst Heal at ~60% HP, not
        20%. Panic heals at critical health are usually too late against burst
        compositions.
---
