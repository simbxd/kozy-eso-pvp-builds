---
title: "Penetration Caps Explained — And Why Most Guides Get It Wrong"
category: Mechanics
tags: [penetration, damage, math, PvP]
summary: "A mathematical breakdown of how armor penetration actually interacts with resistances in ESO — and why the common advice of 'stack as much as possible' is wrong."
---

## The Short Version

Armor penetration in ESO reduces the effective resistance of your target. The cap at which penetration becomes useless is **not fixed** — it depends on your target's actual resistance value.

## How Resistance Works

Damage mitigation in ESO is **linear**, not logarithmic:

```
mitigation % = resistance / 660       (capped at 50%)
```

Every 660 points of resistance reduces incoming damage by 1%, up to a hard cap of **50% at 33,000 resistance**. Stacking resistance beyond 33k does nothing — it's the maximum mitigation a player can reach from armor alone.

Penetration subtracts directly from the target's resistance before that formula applies. So 5,000 penetration against a 33,000-resist target leaves them at 28,000 → ~42.4% mitigation instead of 50% — a ~7.6 percentage point damage gain.

## The Common Mistake

Most guides say "cap your penetration at 18,200." That number comes from the **standard PvE trial boss** resistance value. **In PvP, player resistance varies wildly.** A lightly-armored Sorcerer might sit at 12,000 resistance — building to 18,200 means you overshoot and waste stat budget. A fully resist-capped tank sits at 33,000 — and there, every point of penetration up to 33k is real damage.

## Practical Implications

- **Against tanks:** More penetration is almost always worth it
- **Against light armor:** Less penetration needed — redirect stat budget to damage or sustain
- **Solo vs group PvP:** In Cyrodiil large-scale, assume higher resistance — targets run more defensive builds
