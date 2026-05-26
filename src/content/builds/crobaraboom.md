---
title: CroBaraBoom
class: Necromancer
role: DPS
resource: Hybrid
gamemode:
  - Cyrodiil / Imperial City
  - Battlegrounds
patch: "U50 "
author: MoistedKoziness
difficulty: Beginner
featured: false
race: khajiit
summary: dd
sets:
  - balorgh
  - vicious-death
  - dark-convergence
skills:
  bar1:
    - camouflaged-hunter
    - shadowy-disguise
    - brawler
    - blighted-blastbones
    - critical-surge
    - dawnbreaker
  bar2:
    - resolving-vigor
    - wield-soul
    - streak
    - shadow-image
    - twisting-path
    - pestilent-colossus
scribing:
  - skill: wield-soul
    focus: Healing
    signature: Druid's Resurgence
    affix: Vitality
stats:
  health:
    target: 25000
  magicka:
    target: 18000
  stamina:
    target: 28000
champion_points:
  warfare:
    - star: Fighting Finesse
      points: 50
      priority: 1
    - star: Master-at-Arms
      points: 50
      priority: 2
    - star: Biting Aura
      points: 50
      priority: 3
    - star: Wrathful Strikes
      points: 50
      priority: 3
  fitness:
    - star: Pain's Refuge
      points: 50
      priority: 1
    - star: Slippery
      points: 50
      priority: 2
    - star: Bastion
      points: 50
      priority: 3
    - star: Sustained by Suffering
      points: 50
      priority: 4
consumables:
  food:
    id: lava-foot-soup-and-saltrice
  potion:
    id: essence-of-health
  poison:
    id: escapist-poison-ix
  mundus:
    stone: The Thief
    alt:
      stone: The Shadow
playstyle:
  combo:
    - skill: Critical Surge
      role: buff
    - skill: Blighted Blastbones
      role: buffs
    - skill: Shadowy Disguise
      role: hide
    - skill: Pestilent Colossus
      role: dmg + pull
    - skill: Brawler
      role: spam
gear:
  weapons:
    - type: weapon
      slot: Main Hand
      barLabel: BAR I
      weapon_type: Battle Axe
      trait: precise
      enchant: glyph-of-weapon-damage
      setId: abyssal-brace
    - type: weapon
      slot: Main Hand
      barLabel: BAR II
      weapon_type: Restoration Staff
      setId: dark-convergence
      trait: infused-weapon
      enchant: glyph-of-weapon-damage
  armor:
    - slot: Head
      type: heavy
      setId: balorgh
      trait: divines
      enchant: glyph-of-stamina
    - slot: Shoulders
      type: medium
      setId: balorgh
      trait: divines
      enchant: glyph-of-stamina
    - slot: Chest
      type: light
      setId: vicious-death
      trait: divines
      enchant: glyph-of-stamina
    - slot: Hands
      type: light
      setId: dark-convergence
      trait: divines
      enchant: glyph-of-stamina
    - slot: Waist
      type: light
      setId: dark-convergence
      trait: divines
      enchant: glyph-of-stamina
    - slot: Legs
      type: light
      setId: dark-convergence
      trait: divines
      enchant: glyph-of-stamina
    - slot: Feet
      type: light
      setId: dark-convergence
      trait: divines
      enchant: glyph-of-stamina
  jewelry:
    - slot: Ring I
      type: jewelry
      setId: vicious-death
      trait: bloodthirsty
      enchant: glyph-of-increase-physical-harm
    - slot: Ring II
      type: jewelry
      setId: vicious-death
      trait: bloodthirsty
      enchant: glyph-of-increase-physical-harm
    - slot: Neck
      type: jewelry
      setId: vicious-death
      trait: bloodthirsty
      enchant: glyph-of-increase-physical-harm
---
