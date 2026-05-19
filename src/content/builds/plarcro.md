---
title: Dueling "Plarcro"
class: Templar
role: DPS
resource: Hybrid
gamemode:
  - Duels
patch: U50
author: MoistBro
difficulty: Advanced
featured: true
race: khajiit
summary: Plarcro built to pressure and high burst in duels, squishy but deadly
  while maintaining high pressure, with a good burst potential through Blighted
  Blastbones and Thrive in Chaos.
sets:
  - maarselok
  - perfected-wrath-of-elements
  - serpents-disdain
  - essence-thief
skills:
  bar1:
    - mystic-siphon
    - blighted-blastbones
    - rending-slashes
    - binding-javelin
    - skeletal-archer
    - thrive-in-chaos
  bar2:
    - resolving-vigor
    - wield-soul
    - extended-ritual
    - elemental-susceptibility
    - restoring-focus
    - temporal-guard
scribing:
  - skill: wield-soul
    focus: Healing
    signature: Class Flourish
    affix: Vitality
stats:
  health:
    target: 21500
    note: "28000"
  magicka:
    target: 15000
  stamina:
    target: 35000
champion_points:
  warfare:
    - star: Focused Mending
      points: 50
      priority: 1
    - star: Cleansing Revival
      points: 50
      priority: 2
    - star: Resilience
      points: 50
      priority: 3
    - star: Force of Nature
      points: 50
      priority: 4
  fitness:
    - star: Boundless Vitality
      points: 50
      priority: 1
    - star: Pain's Refuge
      points: 50
      priority: 2
    - star: Bracing Anchor
      points: 50
      priority: 3
    - star: Survival Instincts
      points: 50
      priority: 4
consumables:
  mundus:
    stone: The Shadow
    note: ""
    alt:
      stone: The Lover
  food:
    id: lava-foot-soup-and-saltrice
    alt: Bewitched Sugar Skulls
  potion:
    id: essence-of-health
  poison:
    id: escapist-poison-ix
playstyle:
  buffs: []
  rules:
    - body: Every skill you cast outside a window is a tell. Stack your burst, read
        the opening, release everything at once — if they survive, reset and
        wait for the next one.
      title: Don't rush the kill
    - body: CC is the kill condition in solo PvP. Break the moment you're grabbed — do
        not stand still.
      title: Break free immediately
    - body: Keep a really high uptime on Resolving Vigor, use your Burst Heal at ~60%
        HP, not 20%. Panic heals at critical health are usually too late against
        burst compositions.
      title: Heal before panic
  combo:
    - skill: Blighted Blastbones
      role: Delayed AoE Burst
    - skill: Elemental Susceptibility
      role: Debuff
    - skill: Thrive in Chaos
      role: Massive AoE DoT
    - skill: Binding Javelin
      role: Stun
    - skill: Blighted Blastbones
      role: Delayed AoE Burst
    - skill: Rending Slashes
      role: Finisher
gear:
  weapons:
    - type: weapon
      slot: Main Hand
      barLabel: BAR I
      weapon_type: Axe
      setId: essence-thief
      trait: nirnhoned-weapon
      enchant: glyph-of-poison
    - type: weapon
      slot: Off Hand
      barLabel: BAR I
      weapon_type: Axe
      setId: essence-thief
      trait: sharpened
      enchant: glyph-of-absorb-stamina
    - type: weapon
      slot: Main Hand
      barLabel: BAR II
      weapon_type: Ice Staff
      setId: perfected-wrath-of-elements
      trait: infused-weapon
      enchant: glyph-of-weapon-damage
  armor:
    - slot: Head
      type: medium
      setId: maarselok
      trait: divines
      enchant: glyph-of-stamina
    - slot: Shoulders
      type: medium
      setId: maarselok
      trait: divines
      enchant: glyph-of-stamina
    - slot: Chest
      type: heavy
      setId: serpents-disdain
      trait: reinforced
      enchant: glyph-of-stamina
    - slot: Hands
      type: medium
      setId: essence-thief
      trait: divines
      enchant: glyph-of-stamina
    - slot: Waist
      type: light
      setId: serpents-disdain
      trait: divines
      enchant: glyph-of-stamina
    - slot: Legs
      type: medium
      setId: essence-thief
      trait: divines
      enchant: glyph-of-stamina
    - slot: Feet
      type: medium
      setId: essence-thief
      trait: divines
      enchant: glyph-of-stamina
  jewelry:
    - slot: Ring I
      type: jewelry
      setId: serpents-disdain
      trait: bloodthirsty
      enchant: glyph-of-increase-physical-harm
    - slot: Ring II
      type: jewelry
      setId: serpents-disdain
      trait: bloodthirsty
      enchant: glyph-of-increase-physical-harm
    - slot: Neck
      type: jewelry
      setId: serpents-disdain
      trait: bloodthirsty
      enchant: glyph-of-increase-physical-harm
---
