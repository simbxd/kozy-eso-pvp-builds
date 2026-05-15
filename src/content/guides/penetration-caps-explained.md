---
title: "Penetration Caps Explained — And Why Most Guides Get It Wrong"
category: Mechanics
tags: [penetration, damage, math, PvP]
published: 2026-05-15
summary: "A mathematical breakdown of how armor penetration actually interacts with resistances in ESO — and why the common advice of 'stack as much as possible' is wrong."
---

## The Short Version

Armor penetration in ESO reduces the effective resistance of your target. The cap at which penetration becomes useless is **not fixed** — it depends on your target's actual resistance value.

## How Resistance Works

Damage mitigation follows this formula:

```
mitigation = resistance / (resistance + 660)
```

At 33,000 resistance (a typical tanked player), mitigation is roughly **98%** — you deal almost nothing. At 0 resistance, mitigation is 0% — full damage.

Penetration subtracts directly from that resistance value before the formula applies.

## The Common Mistake

Most guides say "cap your penetration at 18,200." That number comes from NPC resistances in PvE content. **In PvP, player resistance values vary wildly.** A lightly-armored Sorcerer might have 12,000 resistance — you would overcap penetration and waste stat budget if you build to 18,200.

## Practical Implications

- **Against tanks:** More penetration is almost always worth it
- **Against light armor:** Less penetration needed — redirect stat budget to damage or sustain
- **Solo vs group PvP:** In Cyrodiil large-scale, assume higher resistance — targets run more defensive builds
