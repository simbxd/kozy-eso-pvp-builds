---
title: Plarcro
class: Templar
role: DPS
resource: Hybrid
gamemode:
  - Duels
patch: U50
author: Kozy
difficulty: Advanced
featured: true
race: khajiit
summary: sssss
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
  rules: []
  combo:
    - skill: Blighted Blastbones
      role: aoe
    - skill: Elemental Susceptibility
      role: debuff
    - skill: Thrive in Chaos
      role: damage
    - skill: Binding Javelin
      role: stun
    - skill: Rending Slashes
      role: finisher
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
