---
title: Stormcaller
class: Sorcerer
role: DPS
resource: Magicka
gamemode:
  - Openworld
  - Duels
patch: U50
author: Kozy
difficulty: Advanced
featured: true
subclass: true
playstyle_tag: Range
race: breton
summary: Sorcerer built to kite and pressure from range, in solo and small-scale
  PvP, high movement speed while maintaining constant range pressure, through
  Crystal Frags procs for high burst damage.
sets:
  - roksa-the-warped
  - monomyth-reforged
  - twice-fanged-serpent
  - rallying-cry
  - armor-of-the-trainee
skills:
  bar1:
    - bound-armaments
    - crystal-fragments
    - streak
    - wield-soul
    - blinding-flare
    - dawnbreaker-of-smiting
  bar2:
    - elemental-susceptibility
    - resolving-vigor
    - haunting-curse
    - critical-surge
    - hurricane
    - temporal-guard
scribing:
  - skill: wield-soul
    focus: Healing
    signature: Druid's Resurgence
    affix: Vitality
stats:
  health:
    target: 28000
  magicka:
    target: 29000
  stamina:
    target: 19000
champion_points:
  warfare:
    - star: Master-at-Arms
      points: 50
      priority: 1
    - star: Deadly Aim
      points: 50
      priority: 2
    - star: Fighting Finesse
      points: 50
      priority: 3
    - star: Cleansing Revival
      points: 50
      priority: 4
  fitness:
    - star: Pain's Refuge
      points: 50
      priority: 1
    - star: Sustained by Suffering
      points: 50
      priority: 2
    - star: Survival Instincts
      points: 50
      priority: 3
    - star: Fortified
      points: 50
      priority: 4
consumables:
  food:
    id: bewitched-sugar-skulls
  potion:
    id: essence-of-health
  mundus:
    stone: The Shadow
    alt:
      stone: The Thief
      note: Bruh
playstyle:
  buffs:
    - uptime: full
      skill: Critical Surge
      stat: Major Brutality
      note: one of your best hot.
    - uptime: full
      skill: Hurricane
      stat: Major Resolve
      note: keep it 24/24 for speed and tankyness.
    - uptime: full
      skill: Resolving Vigor
      stat: Main HoT
      note: keep high uptime.
  combo:
    - skill: Elemental Susceptibility
      role: Debuff
    - skill: Haunting Curse
      role: Delayed Burst
    - skill: Bound Armaments
      skill_alt: null
      role: High DPS Burst
    - skill: Streak
      role: Stun
      skill_alt: Dawnbreaker of Smiting
    - skill: Crystal Fragments
      role: Final Burst — hard hitting
  rules:
    - body: Every skill you cast outside a window is a tell. Stack your burst, read
        the opening, release everything at once — if they survive, reset and
        wait for the next one.
      title: Don't rush the kill
    - body: CC is the kill condition in solo PvP. Break the moment you're grabbed — do
        not stand still.
      title: Break free immediately
    - body: Keep good uptime on Resolving Vigor, use your Burst Heal at ~60% HP, not
        20%. Panic heals at critical health are usually too late against burst
        compositions.
      title: Heal before panic
gear:
  weapons:
    - type: weapon
      slot: Main Hand
      barLabel: BAR I
      weapon_type: Lightning Staff
      setId: twice-fanged-serpent
      trait: sharpened
      enchant: glyph-of-shock
    - type: weapon
      barLabel: BAR II
      slot: Backup Main
      weapon_type: Ice Staff
      setId: rallying-cry
      trait: defending
      enchant: glyph-of-weapon-damage
  armor:
    - type: medium
      setId: roksa-the-warped
      trait: impenetrable
      enchant: glyph-of-prismatic-defense
      slot: Head
    - slot: Shoulders
      type: medium
      setId: roksa-the-warped
      trait: impenetrable
      enchant: glyph-of-prismatic-defense
    - slot: Chest
      type: heavy
      setId: armor-of-the-trainee
      trait: reinforced
      enchant: glyph-of-prismatic-defense
    - slot: Hands
      type: medium
      setId: twice-fanged-serpent
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
      setId: rallying-cry
      trait: protective
      enchant: glyph-of-increase-magical-harm
    - slot: Ring II
      type: jewelry
      setId: rallying-cry
      trait: protective
      enchant: glyph-of-increase-magical-harm
    - slot: Neck
      type: mythic
      setId: monomyth-reforged
      trait: infused-jewelry
      enchant: glyph-of-increase-magical-harm
---
