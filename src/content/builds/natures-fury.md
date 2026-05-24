---
title: Nature's Fury
class: Warden
role: DPS
resource: Stamina
gamemode:
  - Cyrodiil / Imperial City
patch: U50
author: Kozy
difficulty: Intermediate
featured: true
subclass: true
playstyle_tag: Melee
race: dunmer
summary: Warden paired with Nightblade and Templar, built for massive burst
  damage while playing like a tanky brawler in Cyrodiil and Battlegrounds.
  Delivers exceptional sustain and survivability without sacrificing kill
  pressure, combining devastating Deep Fissure and Onslaught bursts with
  hard-hitting Merciless Resolve and Gorethief procs for explosive damage.
sets:
  - roksa-the-warped
  - monomyth-reforged
  - gorethief
  - rallying-cry
  - armor-of-the-trainee
skills:
  bar1:
    - wrecking-blow
    - deep-fissure
    - merciless-resolve
    - smash
    - bull-netch
    - onslaught
  bar2:
    - deceptive-predator
    - resolving-vigor
    - wield-soul
    - extended-ritual
    - restoring-focus
    - spell-wall
scribing:
  - skill: smash
    focus: Stun
    signature: Fencer's Parry
    affix: Mangle
  - skill: wield-soul
    focus: Healing
    signature: Druid's Resurgence
    affix: Vitality
stats:
  health:
    target: 32000
  magicka:
    target: 16000
  stamina:
    target: 21000
champion_points:
  warfare:
    - star: Master-at-Arms
      priority: 1
      points: 50
    - priority: 2
      star: Ironclad
      points: 50
    - priority: 3
      star: Focused Mending
      points: 50
    - priority: 4
      star: Fighting Finesse
      points: 50
  fitness:
    - priority: 1
      star: Pain's Refuge
      points: 50
    - priority: 2
      star: Sustained by Suffering
      points: 50
    - priority: 3
      star: Survival Instincts
      points: 50
    - priority: 4
      star: Juggernaut
      points: 50
consumables:
  food:
    id: orzorgas-smoked-bear-haunch
    alt: Jewels of Misrule
  potion:
    id: essence-of-health
  poison:
    id: escapist-poison-ix
    note: ""
  mundus:
    stone: The Thief
    alt:
      stone: The Shadow
      note: if you want more burst potential.
playstyle:
  buffs:
    - uptime: full
      skill: Restoring Focus
      stat: Minor Resolve
      note: keep it 24/24 for sustain and tankyness.
    - uptime: full
      skill: Extended Ritual
      note: keep this below you.
      stat: Off HoT
    - uptime: full
      skill: Resolving Vigor
      stat: Main HoT
      note: keep high uptime.
    - uptime: full
      skill: Bull Netch
      stat: Major Brutality
      note: ~200 stam recovery per sec + free cleanse — keep it 24/24.
  combo:
    - skill: Deep Fissure
      role: Delayed AoE Burst + Debuff
    - skill: Wrecking Blow
      role: Burst + Major Berserk source
    - skill: Smash
      role: Stun + Debuff
    - skill: Onslaught
      skill_alt: Merciless Resolve
      role: Final Burst — you need to Bash after this for Gorethief Burst.
    - skill: Merciless Resolve
      role: if your target is not down.
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
      weapon_type: Battle Axe
      setId: gorethief
      trait: sharpened
      enchant: glyph-of-weapon-damage
    - type: weapon
      slot: Backup Main
      barLabel: BAR II
      weapon_type: Sword
      setId: rallying-cry
      trait: defending
      enchant: glyph-of-absorb-magicka
    - type: weapon
      slot: Backup Off
      barLabel: BAR II
      weapon_type: Shield
      setId: rallying-cry
      trait: sturdy
      enchant: glyph-of-stamina
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
      setId: gorethief
      trait: impenetrable
      enchant: glyph-of-prismatic-defense
    - slot: Waist
      type: light
      setId: rallying-cry
      trait: impenetrable
      enchant: glyph-of-prismatic-defense
    - slot: Legs
      type: medium
      setId: gorethief
      trait: impenetrable
      enchant: glyph-of-prismatic-defense
    - slot: Feet
      type: medium
      setId: gorethief
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
      trait: protective
      enchant: glyph-of-increase-physical-harm
    - slot: Neck
      type: jewelry
      setId: rallying-cry
      trait: protective
      enchant: glyph-of-increase-physical-harm
---
