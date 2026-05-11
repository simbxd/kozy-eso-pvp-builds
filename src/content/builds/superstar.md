---
title: "SUPERSTAR — Magicka Dragonknight PvP"
class: Dragonknight
role: DPS
resource: Magicka
gamemode: PvP
patch: "U50"
updatedAt: "2025-05-11"
difficulty: Advanced
featured: true
sets:
  - mighty-chudan
  - rallying-cry
  - two-fanged-snake
  - markyn-ring-of-majesty
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
summary: "Magicka Dragonknight built to hold the line in solo and small-scale PvP. Hard to kill while maintaining constant pressure through Molten Whip procs and Incinerate execute windows."
pullquote: "Hard to kill. Always relevant. The longer the fight goes, the more Snake stacks — and the harder you bite."
gear:
  armor:
    - { slot: "Head",      type: "heavy",  item: "Mighty Chudan Visage",           setId: "mighty-chudan",        tier: "2/2", trait: "Impenetrable", enchant: "Multi-Effect" }
    - { slot: "Shoulders", type: "medium", item: "Mighty Chudan Arm Cops",         setId: "mighty-chudan",        tier: "2/2", trait: "Impenetrable", enchant: "Multi-Effect" }
    - { slot: "Chest",     type: "heavy",  item: "Gallant Chain",                  setId: "armor-of-the-trainee", tier: "1/3", trait: "Reinforced",   enchant: "Multi-Effect" }
    - { slot: "Hands",     type: "light",  item: "Rallying Cry Gloves",            setId: "rallying-cry",         tier: "5/5", trait: "Impenetrable", enchant: "Multi-Effect" }
    - { slot: "Waist",     type: "light",  item: "Rallying Cry Sash",              setId: "rallying-cry",         tier: "5/5", trait: "Impenetrable", enchant: "Multi-Effect" }
    - { slot: "Legs",      type: "medium", item: "Guards of the Two-Fanged Snake", setId: "two-fanged-snake",     tier: "5/5", trait: "Impenetrable", enchant: "Multi-Effect" }
    - { slot: "Feet",      type: "medium", item: "Boots of the Two-Fanged Snake",  setId: "two-fanged-snake",     tier: "5/5", trait: "Impenetrable", enchant: "Multi-Effect" }
  jewelry:
    - { slot: "Ring I",  type: "jewelry", item: "Ring of the Two-Fanged Snake", setId: "two-fanged-snake",       tier: "5/5", trait: "Triune",  enchant: "Multi-Effect" }
    - { slot: "Ring II", type: "mythic",  item: "Markyn Ring of Majesty",       setId: "markyn-ring-of-majesty", tier: "1/1", trait: "Infused", enchant: "Multi-Effect" }
    - { slot: "Neck",    type: "jewelry", item: "Rallying Cry Amulet",          setId: "rallying-cry",           tier: "5/5", trait: "Triune",  enchant: "Multi-Effect" }
  weapons:
    - { slot: "Main Hand",   type: "weapon", barLabel: "BAR I",  item: "Mace of the Two-Fanged Snake", setId: "two-fanged-snake", tier: "5/5", trait: "Nirnhoned", enchant: "Absorb Magicka" }
    - { slot: "Off Hand",    type: "weapon", barLabel: "BAR I",  item: "Mace of the Two-Fanged Snake", setId: "two-fanged-snake", tier: "5/5", trait: "Sharpened", enchant: "Charged Weapon" }
    - { slot: "Backup Main", type: "weapon", barLabel: "BAR II", item: "Rallying Cry Dagger",          setId: "rallying-cry",     tier: "5/5", trait: "Defending", enchant: "Weapon Damage" }
    - { slot: "Backup Off",  type: "weapon", barLabel: "BAR II", item: "Rallying Cry Shield",          setId: "rallying-cry",     tier: "5/5", trait: "Sturdy",    enchant: "Multi-Effect" }
stats:
  health:
    target: 18000
    note: "minimum viable en Battlegrounds"
  magicka:
    target: 40000
    note: "avec Witchmother's Potent Brew"
  stamina:
    target: 12000
    note: "nécessaire pour break free et roll dodge"
champion_points:
  warfare:
    - { star: "Cleansing Revival", points: 50, priority: 1 }
    - { star: "Master-at-Arms",    points: 50, priority: 2 }
    - { star: "Ironclad",          points: 50, priority: 3 }
    - { star: "Fighting Finesse",  points: 50, priority: 4 }
  fitness:
    - { star: "Celerity",      points: 50, priority: 1 }
    - { star: "Slippery",      points: 50, priority: 2 }
    - { star: "Fortified",     points: 50, priority: 3 }
    - { star: "Pain's Refuge", points: 50, priority: 4 }
consumables:
  food:
    name: "Bewitched Sugar Skulls"
    stats: "Max Health + Max Magicka + Max Stamina"
    note: "Tri-stat food — covers all three resource pools in one slot"
  potion:
    name: "Essence of Weapon Power"
    ingredients: ["Dragonthorn", "Blessed Thistle", "Water Hyacinth or Wormwood"]
    note: "Grants Major Brutality + restore Stamina + Major Expedition on use"
  mundus:
    stone: "The Lady"
    effect: "Increases Physical and Spell Resistance"
    note: "Recommended default for this build"
    alt:
      stone: "The Warrior"
      effect: "Increases Weapon and Spell Damage"
      note: "Decent damage and healing increase — swap in if survivability is already covered"
---
