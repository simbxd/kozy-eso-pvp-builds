---
title: Veilreaper
class: Nightblade
role: DPS
resource: Hybrid
gamemode:
  - Cyrodiil / Imperial City
patch: U50
author: Kozy
difficulty: Intermediate
featured: false
subclass: true
playstyle_tag: Melee
race: dunmer
summary: Nightblade paired with Necromancer and Templar, built for explosive AoE
  burst while maintaining strong single-target pressure in solo and small-scale
  PvP. Offers excellent sustain, high mobility, and lethal burst potential
  through powerful Blastbones combos and hard-hitting Merciless Resolve procs.
sets:
  - roksa-the-warped
  - monomyth-reforged
  - essence-thief
  - rallying-cry
  - armor-of-the-trainee
skills:
  bar1:
    - surprise-attack
    - blighted-blastbones
    - merciless-resolve
    - extended-ritual
    - skeletal-archer
    - dawnbreaker-of-smiting
  bar2:
    - race-against-time
    - resolving-vigor
    - wield-soul
    - elemental-susceptibility
    - restoring-focus
    - temporal-guard
scribing:
  - skill: wield-soul
    focus: Healing
    signature: Druid's Resurgence
    affix: Vitality
stats:
  health:
    target: 31000
  magicka:
    target: 17000
  stamina:
    target: 22500
champion_points:
  warfare:
    - star: Master-at-Arms
      points: 50
      priority: 1
    - star: Focused Mending
      points: 50
      priority: 2
    - star: Ironclad
      points: 50
      priority: 3
    - star: Fighting Finesse
      points: 50
      priority: 4
  fitness:
    - star: Pain's Refuge
      points: 50
      priority: 1
    - star: Survival Instincts
      points: 50
      priority: 2
    - star: Sustained by Suffering
      points: 50
      priority: 3
    - star: Celerity
      points: 50
      priority: 4
consumables:
  food:
    id: orzorgas-smoked-bear-haunch
    alt: Jewels of Misrule
  potion:
    id: essence-of-health
  poison:
    id: null
    note: ""
  mundus:
    stone: The Shadow
    alt:
      stone: The Lady
playstyle:
  buffs:
    - uptime: full
      skill: Restoring Focus
      stat: Major Resolve
      note: keep it 24/24 for sustain and tankyness.
    - uptime: full
      skill: Extended Ritual
      stat: Off HoT
      note: Keep this below you.
    - uptime: full
      skill: Skeletal Archer
      stat: Major Brutality
      note: "Decent DoT — "
    - uptime: full
      skill: Resolving Vigor
      stat: Main HoT
      note: keep high uptime.
  combo:
    - skill: Blighted Blastbones
      role: Delayed AoE Burst
    - skill: Elemental Susceptibility
      role: Debuff
    - skill: Surprise Attack
      role: Single Target Burst — you can medium weave to stun off-balanced targets.
    - skill: Dawnbreaker of Smiting
      role: Huge Burst — Also Dawnbreaker stun if you didnt medium weave.
      skill_alt: Merciless Resolve
    - skill: Surprise Attack
      skill_alt: Merciless Resolve
      role: Final Hit
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
      enchant: glyph-of-absorb-magicka
    - type: weapon
      slot: Backup Main
      barLabel: BAR II
      weapon_type: Ice Staff
      setId: rallying-cry
      trait: defending
      enchant: glyph-of-weapon-damage
  armor:
    - slot: Head
      type: medium
      setId: roksa-the-warped
      trait: impenetrable
      enchant: glyph-of-prismatic-defense
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
      setId: essence-thief
      trait: well-fitted
      enchant: glyph-of-prismatic-defense
    - slot: Waist
      type: light
      setId: rallying-cry
      trait: well-fitted
      enchant: glyph-of-prismatic-defense
    - slot: Legs
      type: medium
      setId: essence-thief
      trait: impenetrable
      enchant: glyph-of-prismatic-defense
    - slot: Feet
      type: medium
      setId: essence-thief
      trait: impenetrable
      enchant: glyph-of-prismatic-defense
  jewelry:
    - slot: Ring I
      type: mythic
      setId: monomyth-reforged
      trait: infused-jewelry
      enchant: glyph-of-increase-physical-harm
    - slot: Ring II
      type: jewelry
      setId: rallying-cry
      trait: infused-jewelry
      enchant: glyph-of-increase-physical-harm
    - slot: Neck
      type: jewelry
      setId: rallying-cry
      trait: infused-jewelry
      enchant: glyph-of-increase-physical-harm
---
