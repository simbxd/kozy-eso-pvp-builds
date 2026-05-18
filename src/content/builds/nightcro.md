---
title: Nightcro
class: Subclass
role: DPS
resource: Hybrid
gamemode:
  - Cyrodiil / Imperial City
patch: U50
author: Kozy
difficulty: Advanced
featured: false
race: dunmer
summary: Nightblade-Necromancer subclass hybrid built around Essence Thief
  sustain and Rallying Cry pressure. Healing Soul scribing keeps you alive
  while dual axes carry the burst in solo and small-scale PvP.
pullquote: Subclass flexibility — Assassination openers, Grave Lord pressure,
  Restoring Light to stay up.
sets:
  - engine-guardian
  - armor-of-the-trainee
  - essence-thief
  - rallying-cry
  - monomyth-reforged
skills:
  bar1:
    - merciless-resolve
    - killers-blade
    - relentless-focus
    - shadowy-disguise
    - wield-soul
    - soul-tether
  bar2:
    - blighted-blastbones
    - skeletal-arcanist
    - ricochet-skull
    - resistant-flesh
    - spirit-mender
    - soul-assault
scribing:
  - skill: wield-soul
    focus: Healing
    signature: Druid's Resurgence
    affix: Vitality
stats:
  health:
    target: 18000
  magicka:
    target: 30000
  stamina:
    target: 24000
champion_points:
  warfare:
    - star: Fighting Finesse
      points: 50
      priority: 1
    - star: Master-at-Arms
      points: 50
      priority: 2
    - star: Force of Nature
      points: 50
      priority: 3
    - star: Focused Mending
      points: 50
      priority: 4
  fitness:
    - star: Pain's Refuge
      points: 50
      priority: 1
    - star: Sustained by Suffering
      points: 50
      priority: 2
    - star: Celerity
      points: 50
      priority: 3
    - star: Survival Instincts
      points: 50
      priority: 4
consumables:
  food:
    id: orzorgas-smoked-bear-haunch
  mundus:
    stone: The Shadow
gear:
  weapons:
    - type: weapon
      slot: Main Hand
      barLabel: BAR I
      weapon_type: Axe
      setId: essence-thief
      trait: nirnhoned-weapon
      enchant: glyph-of-absorb-stamina
    - type: weapon
      slot: Off Hand
      barLabel: BAR I
      weapon_type: Axe
      setId: essence-thief
      trait: sharpened
      enchant: glyph-of-absorb-stamina
    - type: weapon
      slot: Backup Main
      barLabel: BAR II
      weapon_type: Ice Staff
      setId: rallying-cry
      trait: defending
      enchant: glyph-of-weapon-damage
  armor:
    - slot: Head
      type: heavy
      setId: engine-guardian
      trait: impenetrable
      enchant: glyph-of-prismatic-defense
    - slot: Shoulders
      type: heavy
      setId: engine-guardian
      trait: well-fitted
      enchant: glyph-of-health
    - slot: Chest
      type: medium
      setId: armor-of-the-trainee
      trait: reinforced
      enchant: glyph-of-prismatic-defense
    - slot: Hands
      type: medium
      setId: essence-thief
      trait: impenetrable
      enchant: glyph-of-prismatic-defense
    - slot: Waist
      type: medium
      setId: rallying-cry
      trait: impenetrable
      enchant: glyph-of-prismatic-defense
    - slot: Legs
      type: medium
      setId: essence-thief
      trait: well-fitted
      enchant: glyph-of-prismatic-defense
    - slot: Feet
      type: medium
      setId: essence-thief
      trait: impenetrable
      enchant: glyph-of-prismatic-defense
  jewelry:
    - slot: Ring I
      type: jewelry
      setId: rallying-cry
      trait: infused-jewelry
      enchant: glyph-of-prismatic-recovery
    - slot: Ring II
      type: mythic
      setId: monomyth-reforged
      trait: infused-jewelry
      enchant: glyph-of-prismatic-recovery
    - slot: Neck
      type: jewelry
      setId: rallying-cry
      trait: infused-jewelry
      enchant: glyph-of-prismatic-recovery
---
