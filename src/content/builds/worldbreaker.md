---
title: Worldbreaker
class: Dragonknight
role: DPS
resource: Hybrid
gamemode:
  - Openworld
patch: U50
author: Kozy
difficulty: Intermediate
featured: true
playstyle_tag: Melee
race: dunmer
summary: Dragonknight built to hold the line in solo and small-scale PvP. Hard
  to kill while maintaining constant pressure through Molten Whip procs and AoE
  pressure with Incinerate and Heart of Flame.
video_id: _paQrQeRtzg
sets:
  - mighty-chudan
  - markyn-ring-of-majesty
  - rallying-cry
  - twice-fanged-serpent
  - armor-of-the-trainee
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
    note: ""
  potion:
    id: essence-of-weapon-power
    note: ""
  mundus:
    stone: The Lady
    note: Recommended default for this build
    alt:
      stone: The Warrior
      note: Decent damage and healing increase — swap in if survivability is already
        covered
playstyle:
  buffs:
    - skill: Hearth and Home
      stat: Major Protection
      note: decent HoT — keep it below you.
      uptime: full
    - skill: Quick Cloak
      stat: Major Evasion
      note: +30% Move Speed 4s — should be up 24/24.
      uptime: full
    - skill: Resolving Vigor
      stat: Main HoT
      note: keep high uptime.
      uptime: full
    - skill: Race Against Time
      stat: Minor Force · Major Expedition
      note: speed-scaling — kite, don't camp.
      uptime: full
  combo:
    - skill: Incinerate
      role: Delayed AoE Burst
    - skill: Heart of Flame
      role: Delayed AoE Burst
    - skill: Disintegrating Dragonfire
      role: Debuff
    - skill: Shattering Rocks
      role: Stun your target
    - skill: Molten Whip
      skill_alt: Take Flight
      role: Final Burst
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
gear:
  armor:
    - slot: Head
      type: heavy
      setId: mighty-chudan
      trait: impenetrable
      enchant: glyph-of-prismatic-defense
    - slot: Shoulders
      type: medium
      setId: mighty-chudan
      trait: impenetrable
      enchant: glyph-of-prismatic-defense
    - slot: Chest
      type: heavy
      setId: armor-of-the-trainee
      trait: reinforced
      enchant: glyph-of-prismatic-defense
    - slot: Hands
      type: light
      setId: rallying-cry
      trait: impenetrable
      enchant: glyph-of-prismatic-defense
    - slot: Waist
      type: light
      setId: rallying-cry
      trait: impenetrable
      enchant: glyph-of-prismatic-defense
    - slot: Legs
      type: medium
      setId: twice-fanged-serpent
      trait: impenetrable
      enchant: glyph-of-prismatic-defense
    - slot: Feet
      type: medium
      setId: twice-fanged-serpent
      trait: impenetrable
      enchant: glyph-of-prismatic-defense
  jewelry:
    - slot: Ring I
      type: jewelry
      setId: twice-fanged-serpent
      trait: triune
      enchant: glyph-of-increase-physical-harm
    - slot: Ring II
      type: mythic
      setId: markyn-ring-of-majesty
      trait: infused-jewelry
      enchant: glyph-of-increase-physical-harm
    - slot: Neck
      type: jewelry
      setId: rallying-cry
      trait: triune
      enchant: glyph-of-increase-physical-harm
  weapons:
    - slot: Main Hand
      type: weapon
      barLabel: BAR I
      weapon_type: Mace
      setId: twice-fanged-serpent
      trait: nirnhoned-weapon
      enchant: glyph-of-absorb-magicka
    - slot: Off Hand
      type: weapon
      barLabel: BAR I
      weapon_type: Mace
      setId: twice-fanged-serpent
      trait: sharpened
      enchant: glyph-of-shock
    - slot: Backup Main
      type: weapon
      barLabel: BAR II
      weapon_type: Sword
      setId: rallying-cry
      trait: defending
      enchant: glyph-of-weapon-damage
    - slot: Backup Off
      type: weapon
      barLabel: BAR II
      weapon_type: Shield
      setId: rallying-cry
      trait: sturdy
      enchant: glyph-of-prismatic-defense
---
