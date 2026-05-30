// ── Grimoires ─────────────────────────────────────────────────────────────────
// Each grimoire is tied to one skill line. The in-game name is "Arcanist's X"
// for the base version; permutation names vary by focus/affix combo.
// Icon filenames mirror the skill line icon, not a skill-specific icon.

export type GrimoireDef = {
  id:         string;
  name:       string;   // short grimoire name (e.g. "Smash")
  skill_line: string;   // display name for the source skill line
  skill_line_id: string;
  icon:       string;   // /assets/scribing/grimoire-*.png
};

export const GRIMOIRES: GrimoireDef[] = [
  { id: "smash",       name: "Smash",       skill_line: "Two Handed",          skill_line_id: "two-handed",          icon: "/assets/scribing/grimoire-2-handed.png"          },
  { id: "knife",       name: "Knife",        skill_line: "Dual Wield",           skill_line_id: "dual-wield",           icon: "/assets/scribing/grimoire-dual-wield.png"         },
  { id: "throw",       name: "Throw",        skill_line: "One Hand & Shield",    skill_line_id: "one-hand-and-shield",  icon: "/assets/scribing/grimoire-1-handed.png"           },
  { id: "vault",       name: "Vault",        skill_line: "Bow",                  skill_line_id: "bow",                  icon: "/assets/scribing/grimoire-bow.png"                },
  { id: "explosion",   name: "Explosion",    skill_line: "Destruction Staff",    skill_line_id: "destruction-staff",    icon: "/assets/scribing/grimoire-destruction-staff.png"  },
  { id: "bond",        name: "Bond",         skill_line: "Restoration Staff",    skill_line_id: "restoration-staff",    icon: "/assets/scribing/grimoire-restoration-staff.png"  },
  { id: "trample",     name: "Trample",      skill_line: "Assault",              skill_line_id: "assault",              icon: "/assets/scribing/grimoire-assault.png"            },
  { id: "banner",      name: "Banner",       skill_line: "Support",              skill_line_id: "support",              icon: "/assets/scribing/grimoire-support.png"            },
  { id: "torch",       name: "Torch",        skill_line: "Fighters Guild",       skill_line_id: "fighters-guild",       icon: "/assets/scribing/grimoire-fighters-guild.png"     },
  { id: "contingency", name: "Contingency",  skill_line: "Mages Guild",          skill_line_id: "mages-guild",          icon: "/assets/scribing/grimoire-mages-guild.png"        },
  { id: "burst",       name: "Burst",        skill_line: "Soul Magic",           skill_line_id: "soul-magic",           icon: "/assets/scribing/grimoire-soul-magic-02.png"      },
  { id: "soul",        name: "Soul",         skill_line: "Soul Magic",           skill_line_id: "soul-magic",           icon: "/assets/scribing/grimoire-soul-magic-02.png"      },
];

// ── Foci ──────────────────────────────────────────────────────────────────────
// A Focus Rune changes the damage type and primary mechanic of a grimoire skill.
// Not all foci are compatible with all grimoires; shown as a single list for now.

export type FocusDef = {
  id:          string;
  name:        string;
  icon:        string;
  damage_type?: string;
};

export const FOCI: FocusDef[] = [
  { id: "flame",           name: "Flame",            icon: "/assets/scribing/focus-flame.png",           damage_type: "Fire"    },
  { id: "frost",           name: "Frost",            icon: "/assets/scribing/focus-frost.png",           damage_type: "Frost"   },
  { id: "shock",           name: "Shock",            icon: "/assets/scribing/focus-shock.png",           damage_type: "Shock"   },
  { id: "poison",          name: "Poison",           icon: "/assets/scribing/focus-poison.png",          damage_type: "Poison"  },
  { id: "disease",         name: "Disease",          icon: "/assets/scribing/focus-disease.png",         damage_type: "Disease" },
  { id: "bleeding",        name: "Bleeding",         icon: "/assets/scribing/focus-bleeding.png",        damage_type: "Bleed"   },
  { id: "healing",         name: "Healing",          icon: "/assets/scribing/focus-healing.png"                                 },
  { id: "damage-shield",   name: "Damage Shield",    icon: "/assets/scribing/focus-damage-shield.png"                          },
  { id: "dispelled",       name: "Dispel",           icon: "/assets/scribing/focus-dispelled.png"                              },
  { id: "gain-ultimate",   name: "Gain Ultimate",    icon: "/assets/scribing/focus-gain-ultimate.png"                          },
  { id: "immobilized",     name: "Immobilize",       icon: "/assets/scribing/focus-immobilized.png"                            },
  { id: "increase-damage", name: "Increase Damage",  icon: "/assets/scribing/focus-increase-damage.png"                        },
  { id: "knockback",       name: "Knockback",        icon: "/assets/scribing/focus-knockback.png"                              },
  { id: "magicka",         name: "Magicka",          icon: "/assets/scribing/focus-magicka.png"                                },
  { id: "multihit",        name: "Multi-Hit",        icon: "/assets/scribing/focus-multihit.png"                               },
  { id: "pull",            name: "Pull",             icon: "/assets/scribing/focus-pull.png"                                   },
  { id: "resource-restore",name: "Resource Restore", icon: "/assets/scribing/focus-resource-restore.png"                       },
  { id: "stunned",         name: "Stun",             icon: "/assets/scribing/focus-stunned.png"                                },
  { id: "taunt",           name: "Taunt",            icon: "/assets/scribing/focus-taunt.png"                                  },
  { id: "transfer-buff",   name: "Transfer Buff",    icon: "/assets/scribing/focus-transfer-buff.png"                          },
  { id: "trauma",          name: "Trauma",           icon: "/assets/scribing/focus-trauma.png"                                 },
];

// ── Affixes ───────────────────────────────────────────────────────────────────
// An Affix Rune adds a secondary effect (usually a Major/Minor buff or debuff).
// buff_ids links to BUFF_DEFS ids in eso-bonuses.ts — used to highlight
// which Buffs tab toggles are relevant for the selected affix.

export type AffixDef = {
  id:        string;
  name:      string;
  icon:      string;
  hint:      string;      // short effect label shown in the selector
  buff_ids?: string[];    // matching ids in BUFF_DEFS (for cross-reference hint)
};

export const AFFIXES: AffixDef[] = [
  // ── Offense buffs ──
  { id: "brutality-sorcery",  name: "Major Brutality & Sorcery",  icon: "/assets/scribing/affix-brutality-sorcery.png",  hint: "+20% WD+SD",          buff_ids: ["major-brutality", "major-sorcery"]        },
  { id: "courage",            name: "Major Courage",              icon: "/assets/scribing/affix-courage.png",            hint: "+430 WD+SD",          buff_ids: ["major-courage"]                           },
  { id: "savage-prophecy",    name: "Maj. Savagery & Prophecy",   icon: "/assets/scribing/affix-savage-prophecy.png",    hint: "+2629 Crit Rating",   buff_ids: ["major-savagery", "major-prophecy"]         },
  { id: "force",              name: "Minor Force",                icon: "/assets/scribing/affix-force.png",              hint: "+10% Crit Dmg",       buff_ids: ["minor-force"]                             },
  { id: "berserk",            name: "Minor Berserk",              icon: "/assets/scribing/affix-berserk.png",            hint: "+5% Dmg Dealt"                                                              },
  { id: "enervation",         name: "Minor Enervation",           icon: "/assets/scribing/affix-enervation.png",         hint: "−10% Crit Dmg on target"                                                    },
  { id: "empower",            name: "Empower",                    icon: "/assets/scribing/affix-empower.png",            hint: "+40% Light/Heavy Atk"                                                       },

  // ── Defense buffs ──
  { id: "resolve",            name: "Major Resolve",              icon: "/assets/scribing/affix-resolve.png",            hint: "+5948 Resist",        buff_ids: ["major-resolve"]                           },
  { id: "protection",         name: "Major Protection",           icon: "/assets/scribing/affix-protection.png",         hint: "-10% Dmg Taken"                                                             },
  { id: "evasion",            name: "Major Evasion",              icon: "/assets/scribing/affix-evasion.png",            hint: "-20% AoE Dmg Taken"                                                         },

  // ── Utility / mobility ──
  { id: "heroism",            name: "Minor Heroism",              icon: "/assets/scribing/affix-heroism.png",            hint: "+1 Ult/1.5s"                                                                },
  { id: "expedition",         name: "Major Expedition",           icon: "/assets/scribing/affix-expedition.png",         hint: "+30% Move Speed"                                                            },
  { id: "vitality",           name: "Major Vitality",             icon: "/assets/scribing/affix-vitality.png",           hint: "+12% Healing Recv"                                                          },
  { id: "intellect-endurance",name: "Min. Intellect & Endurance", icon: "/assets/scribing/affix-intellect-endurance.png",hint: "+15% Mag/Stam Recov"                                                        },
  { id: "lifesteal",          name: "Life Steal",                 icon: "/assets/scribing/affix-lifesteal.png",          hint: "Restore HP on hit"                                                          },
  { id: "magicka-steal",      name: "Magicka Steal",              icon: "/assets/scribing/affix-magicka-steal.png",      hint: "Drain Mag from target"                                                      },
  { id: "interrupt",          name: "Interrupt",                  icon: "/assets/scribing/affix-interrupt.png",          hint: "Interrupt on block"                                                         },
  { id: "off-balance",        name: "Off Balance",                icon: "/assets/scribing/affix-off-balance.png",        hint: "Apply Off Balance"                                                          },

  // ── Debuffs on target ──
  { id: "breach",             name: "Major Breach",               icon: "/assets/scribing/affix-breach.png",             hint: "−5948 Target Resist"                                                        },
  { id: "defile",             name: "Major Defile",               icon: "/assets/scribing/affix-defile.png",             hint: "−12% Healing on target"                                                     },
  { id: "maim",               name: "Major Maim",                 icon: "/assets/scribing/affix-maim.png",               hint: "−10% Dmg on target"                                                         },
  { id: "vulnerability",      name: "Major Vulnerability",        icon: "/assets/scribing/affix-vulnerability.png",      hint: "+10% Dmg Taken on target"                                                   },
  { id: "cowardice",          name: "Major Cowardice",            icon: "/assets/scribing/affix-cowardice.png",          hint: "−430 WD+SD on target"                                                       },
  { id: "brittle",            name: "Minor Brittle",              icon: "/assets/scribing/affix-brittle.png",            hint: "+10% Crit Dmg on target"                                                    },
  { id: "mangle",             name: "Minor Mangle",               icon: "/assets/scribing/affix-mangle.png",             hint: "−10% Max HP on target"                                                      },
  { id: "uncertainty",        name: "Minor Uncertainty",          icon: "/assets/scribing/affix-uncertainty.png",        hint: "−6% Crit Rate on target"                                                    },
];

// ── Signatures ────────────────────────────────────────────────────────────────
// A Signature Rune adds a unique scribing-specific mechanic to the grimoire skill
// (the "signature" effect that makes each permutation distinctive).

export type SignatureDef = {
  id:   string;
  name: string;
  icon: string;
  hint: string;
};

export const SIGNATURES: SignatureDef[] = [
  { id: "battle-technique",     name: "Battle Technique",      icon: "/assets/scribing/sig-battle-technique.png",     hint: "Empower on cast"                },
  { id: "bladeturn",            name: "Bladeturn",             icon: "/assets/scribing/sig-bladeturn.png",            hint: "Deflect on dodge"               },
  { id: "break-snare",          name: "Break Snare",           icon: "/assets/scribing/sig-break-snare.png",          hint: "Remove snare on cast"           },
  { id: "charge-damage",        name: "Charge Damage",         icon: "/assets/scribing/sig-charge-damage.png",        hint: "Bonus dmg on charge"            },
  { id: "classmod",             name: "Class Modification",    icon: "/assets/scribing/sig-classmod.png",             hint: "Class-specific bonus effect"    },
  { id: "damage-over-time",     name: "Damage Over Time",      icon: "/assets/scribing/sig-damage-over-time.png",     hint: "Apply DoT on hit"               },
  { id: "damage-reduction",     name: "Damage Reduction",      icon: "/assets/scribing/sig-damage-reduction.png",     hint: "Reduce dmg taken briefly"       },
  { id: "damage-shield",        name: "Damage Shield",         icon: "/assets/scribing/sig-damage-shield.png",        hint: "Apply damage shield"            },
  { id: "give-ultimate",        name: "Give Ultimate",         icon: "/assets/scribing/sig-give-ultimate.png",        hint: "Restore Ultimate on hit"        },
  { id: "heal-over-time",       name: "Heal Over Time",        icon: "/assets/scribing/sig-heal-over-time.png",       hint: "Apply HoT on cast"              },
  { id: "immobilize",           name: "Immobilize",            icon: "/assets/scribing/sig-immobilize.png",           hint: "Root target briefly"            },
  { id: "life-steal",           name: "Life Steal",            icon: "/assets/scribing/sig-live-steal.png",           hint: "Drain HP from target"           },
  { id: "local-aoe-damage-buff",name: "AoE Damage Buff",       icon: "/assets/scribing/sig-local-aoe-damage-buff.png",hint: "+dmg in area around target"     },
  { id: "mobility",             name: "Mobility",              icon: "/assets/scribing/sig-mobility.png",             hint: "Speed bonus on cast"            },
  { id: "opportunism",          name: "Opportunism",           icon: "/assets/scribing/sig-opportunism.png",          hint: "Bonus dmg vs debuffed targets"  },
  { id: "resource-restore",     name: "Resource Restore",      icon: "/assets/scribing/sig-resource-restore.png",     hint: "Restore Mag or Stam on hit"     },
  { id: "shield-mastery",       name: "Shield Mastery",        icon: "/assets/scribing/sig-shield-mastery.png",       hint: "Bonus effect vs shields"        },
  { id: "snare",                name: "Snare",                 icon: "/assets/scribing/sig-snare.png",                hint: "Slow target on hit"             },
  { id: "soul-collapse",        name: "Soul Collapse",         icon: "/assets/scribing/sig-soul-collapse.png",        hint: "Burst dmg at low soul charge"   },
  { id: "status-effect",        name: "Status Effect",         icon: "/assets/scribing/sig-status-effect.png",        hint: "Apply elemental status"         },
];

// ── Lookup maps ───────────────────────────────────────────────────────────────

export const GRIMOIRE_MAP  = new Map(GRIMOIRES.map((g) => [g.id, g]));
export const FOCUS_MAP     = new Map(FOCI.map((f) => [f.id, f]));
export const AFFIX_MAP     = new Map(AFFIXES.map((a) => [a.id, a]));
export const SIGNATURE_MAP = new Map(SIGNATURES.map((s) => [s.id, s]));
