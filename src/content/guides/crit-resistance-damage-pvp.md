---
title: Critical Resistance & Critical Damage in PvP — The Math Nobody Explains
category: Mechanics
tags:
  - critical
  - crit-res
  - crit-damage
  - PvP
  - math
patch: U50
summary: Why there is no universal Crit Resistance cap in PvP — and how the arms
  race between Crit Res and Crit Damage shifts the value of each stat depending
  on your opponent.
---
## The Short Version

Critical strikes deal a base **+50% bonus damage**. Critical Resistance reduces that bonus. At **3300 Crit Resistance**, the bonus from an attacker with *no Crit Damage investment* reaches zero. But if the attacker has Crit Damage Rating that pushes their bonus above 50%, you need more than 3300 to achieve immunity. There is no universal cap — it depends on the attacker's build.

## How Critical Damage Works

Every critical hit applies a multiplier on top of your base damage:

```
crit_hit = base_damage × (1 + crit_bonus)
```

The base crit bonus is **50%** (so a 10,000 hit crits for 15,000). Crit Damage Rating increases this above 50%.

> **Note on the ratio:** Based on community observations, approximately 660 points of Crit Damage Rating add ~1% to the bonus — but this ratio has not been confirmed by official patch notes or reliable datamining. Treat it as the best available approximation, and verify in-game if precision matters for your build.

## How Critical Resistance Reduces That

Crit Resistance subtracts from the effective crit bonus:

```
effective_bonus = max(0%, (50% + crit_damage_bonus%) − (crit_res / 66))
```

> **Same caveat applies to the `/66` divisor** — it follows directly from the community ratio above. The formula structure is correct; the exact constant may vary slightly.

At 3300 Crit Resistance against an attacker with 0% Crit Damage bonus:
`(50% + 0%) − (3300 / 66) = 50% − 50% = 0%`

But against an attacker with 20% Crit Damage bonus:
`(50% + 20%) − (3300 / 66) = 70% − 50% = +20%` — still taking extra damage.

## The Relative Cap (Not a Fixed Number)

There is no universal Crit Resistance immunity threshold in PvP.

The actual immunity threshold depends on the attacker:

```
immunity_threshold = (50 + crit_damage_bonus) × 66
```

| Attacker's Crit Damage bonus | Crit Res needed for immunity |
| ---------------------------- | ---------------------------- |
| 0% (base only)               | 3 300                        |
| 10%                          | 3 960                        |
| 20%                          | 4 620                        |
| 50%                          | 6 600                        |

The practical consequence: a player at 3300 Crit Res is immune to the majority of standard builds, but remains vulnerable to builds that specifically invest in Crit Damage Rating.

## The Arms Race: Crit Res vs Crit Damage

This is a dynamic mechanic, not a fixed threshold.

* An attacker who invests in Crit Damage forces the defender to raise their Crit Res higher to maintain immunity
* A defender at 3300 Crit Res has covered the base case — but a dedicated Crit Damage build punches through that
* Knowing the enemy build changes the value of each stat: 3300 Crit Res is strong in a vacuum; it's weak against a build sitting at +30% Crit Damage bonus

This is why PvP build decisions cannot be made in isolation. The same Crit Res value is either sufficient or insufficient depending entirely on what you're facing.

## The Common Mistake

Many offensive builds invest heavily in Crit Damage expecting crits to be their primary damage source, without accounting for the defender's Crit Res. Symmetrically, many defensive players assume 3300 Crit Res makes them crit-immune against everyone.

Both assumptions are wrong in the wrong matchup.

The most universally valuable damage investments remain:

* **Penetration** — reduces physical/spell resistance, scales all hits regardless of crit
* **Flat damage** (Weapon/Spell Damage) — scales every hit, crit or not
* **Major/Minor Breach** — fixed resistance reduction, independent of Crit Res

Crit Damage is high value against opponents with low Crit Res (light/medium armor). It loses value progressively as the defender stacks Crit Res, and becomes worthless at their specific immunity threshold.

## Quick Reference

*Attacker's Crit Damage bonus = extra % above the 50% base. CD = Crit Damage bonus.*

| Defender's Crit Res | Effective crit bonus (CD +0%) | Effective crit bonus (CD +20%) |
| ------------------- | ----------------------------- | ------------------------------ |
| 0                   | +50%                          | +70%                           |
| 1 320               | +30%                          | +50%                           |
| 3 300               | 0%                            | +20%                           |
| 4 620               | 0%                            | 0%                             |
| 6 600               | 0%                            | 0%                             |

At 3300 Crit Res, a +20% Crit Damage attacker still deals +20% on crits. Full immunity against that attacker requires 4620 Crit Res.
