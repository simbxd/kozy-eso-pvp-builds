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

<div class="ps-sequence">
  <div class="ps-step">
    <div class="ps-step__num">1</div>
    <div class="ps-step__body">
      <div class="ps-step__title">Open on Bar II</div>
      <div class="ps-step__desc">Pre-cast <span class="ps-skill">Heart of Flame</span> before engaging — forces the enemy to react immediately. Follow with <span class="ps-skill">Blood of the Elder Dragon</span> for the damage shield, then swap to Bar I and close in.</div>
    </div>
  </div>
  <div class="ps-step">
    <div class="ps-step__num">2</div>
    <div class="ps-step__body">
      <div class="ps-step__title">Pressure loop on Bar I</div>
      <div class="ps-step__desc">Weave <span class="ps-skill">Disintegrating Dragonfire</span> and <span class="ps-skill">Shattering Rocks</span> to build Seething Fury stacks, then spend them on <span class="ps-skill">Molten Whip</span> for burst. Keep <span class="ps-skill">Incinerate</span> refreshed at all times — it's your primary sustained damage.</div>
    </div>
  </div>
  <div class="ps-step">
    <div class="ps-step__num">3</div>
    <div class="ps-step__body">
      <div class="ps-step__title">Rotate bars on pressure</div>
      <div class="ps-step__desc">When burst hits, swap to Bar II: <span class="ps-skill">Resolving Vigor</span> then <span class="ps-skill">Heart and Home</span>. Return to Bar I immediately — don't linger on the defensive bar.</div>
    </div>
  </div>
</div>

<div class="ps-bars">
  <div class="ps-bar">
    <div class="ps-bar__header">
      <span class="ps-bar__badge ps-bar__badge--1">BAR I</span>
      <span class="ps-bar__role">Offense</span>
    </div>
    <ul class="ps-bar__skills">
      <li><span class="ps-skill">Molten Whip</span><span class="ps-bar__note">burst — consume Seething Fury stacks</span></li>
      <li><span class="ps-skill">Incinerate</span><span class="ps-bar__note">sustained DoT — never let it drop</span></li>
      <li><span class="ps-skill">Disintegrating Dragonfire</span><span class="ps-bar__note">stack builder + Major Breach</span></li>
      <li><span class="ps-skill">Shattering Rocks</span><span class="ps-bar__note">stack builder + AoE pressure</span></li>
      <li><span class="ps-skill">Quick Cloak</span><span class="ps-bar__note">disengage + resource reset window</span></li>
      <li><span class="ps-skill ps-skill--ult">Take Flight</span><span class="ps-bar__note">offensive — commit when enemy is locked</span></li>
    </ul>
  </div>
  <div class="ps-bar">
    <div class="ps-bar__header">
      <span class="ps-bar__badge ps-bar__badge--2">BAR II</span>
      <span class="ps-bar__role">Sustain</span>
    </div>
    <ul class="ps-bar__skills">
      <li><span class="ps-skill">Resolving Vigor</span><span class="ps-bar__note">primary heal — use proactively at ~60%</span></li>
      <li><span class="ps-skill">Heart and Home</span><span class="ps-bar__note">shield layer — rotate on cooldown</span></li>
      <li><span class="ps-skill">Heart of Flame</span><span class="ps-bar__note">opener AoE, reapply in extended fights</span></li>
      <li><span class="ps-skill">Blood of the Elder Dragon</span><span class="ps-bar__note">damage shield — cast pre-engage</span></li>
      <li><span class="ps-skill">Biting Jabs</span><span class="ps-bar__note">filler pressure on Bar II</span></li>
      <li><span class="ps-skill ps-skill--ult">Temporal Guard</span><span class="ps-bar__note">panic button — save for burst windows</span></li>
    </ul>
  </div>
</div>

<div class="ps-rules">
  <div class="ps-rule">
    <div class="ps-rule__title">Don't rush the kill</div>
    <div class="ps-rule__body">Two-Fanged Serpent stacks compound over time. The longer the fight, the harder each proc hits — sustained pressure beats early aggression.</div>
  </div>
  <div class="ps-rule">
    <div class="ps-rule__title">Break free immediately</div>
    <div class="ps-rule__body">CC is the kill condition in solo PvP. Break the moment you're grabbed — waiting until you're fully stacked on is almost always fatal.</div>
  </div>
  <div class="ps-rule">
    <div class="ps-rule__title">Heal before panic</div>
    <div class="ps-rule__body">Use Resolving Vigor at ~60% HP, not 20%. Panic heals at critical health are usually too late against burst compositions.</div>
  </div>
</div>
