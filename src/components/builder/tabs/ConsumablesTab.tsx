import { useEditorStore } from "../state";
import { T, F, SectionHead } from "../atoms";
import { SearchSelect, type SelectItem } from "../atoms/SearchSelect";

// ── Static data ───────────────────────────────────────────────────────────────

const FOOD_ITEMS: SelectItem[] = [
  // ── Tri-stat ──────────────────────────────────────────────────────────────────
  { id: "bewitched-sugar-skulls",               label: "Bewitched Sugar Skulls",               badge: "Food",  sub: "+Max Health · +Max Stamina · Health Rec"            },
  { id: "longfin-pasty-with-melon-sauce",        label: "Longfin Pasty with Melon Sauce",        badge: "Food",  sub: "+Max Health · +Max Magicka · +Max Stamina"          },
  // ── Health + Stamina ──────────────────────────────────────────────────────────
  { id: "braised-rabbit-with-spring-vegetables", label: "Braised Rabbit with Spring Vegetables", badge: "Food",  sub: "+Max Health · +Max Stamina"                         },
  { id: "dubious-camoran-throne",                label: "Dubious Camoran Throne",                badge: "Drink", sub: "+Max Health · +Max Stamina · Stamina Rec"           },
  { id: "lava-foot-soup-and-saltrice",           label: "Lava Foot Soup-and-Saltrice",           badge: "Food",  sub: "+Max Stamina · Stamina Rec"                         },
  // ── Health + Magicka ──────────────────────────────────────────────────────────
  { id: "artaeum-pickled-fish-bowl",             label: "Artaeum Pickled Fish Bowl",             badge: "Food",  sub: "+Max Health · +Max Magicka"                         },
  { id: "solitude-salmon-millet-soup",           label: "Solitude Salmon-Millet Soup",           badge: "Food",  sub: "+Max Health · +Max Magicka"                         },
  { id: "clockwork-citrus-filet",                label: "Clockwork Citrus Filet",                badge: "Food",  sub: "+Max Health · Health Rec · +Max Magicka · Magicka Rec"},
  // ── Recovery builds ───────────────────────────────────────────────────────────
  { id: "orzorgas-smoked-bear-haunch",           label: "Orzorga's Smoked Bear Haunch",          badge: "Food",  sub: "+Max Health · Health Rec · Magicka Rec"             },
  { id: "jewels-of-misrule",                     label: "Jewels of Misrule",                     badge: "Food",  sub: "+Max Health · Stamina Rec · Magicka Rec"            },
  { id: "witchmothers-potent-brew",              label: "Witchmother's Potent Brew",             badge: "Drink", sub: "+Max Health · +Max Magicka · Magicka Rec"           },
  { id: "ghastly-eye-bowl",                      label: "Ghastly Eye Bowl",                      badge: "Drink", sub: "+Max Magicka · Magicka Rec"                         },
];

const POTION_ITEMS: SelectItem[] = [
  { id: "essence-of-weapon-power",    label: "Essence of Weapon Power",    sub: "Major Brutality · +20% Weapon Damage"    },
  { id: "essence-of-spell-power",     label: "Essence of Spell Power",     sub: "Major Sorcery · +20% Spell Damage"       },
  { id: "essence-of-weapon-critical", label: "Essence of Weapon Critical", sub: "Major Savagery · 2629 Weapon Crit"       },
  { id: "essence-of-spell-critical",  label: "Essence of Spell Critical",  sub: "Major Prophecy · 2629 Spell Crit"        },
  { id: "essence-of-health",          label: "Essence of Health",          sub: "Restore HP/Mag/Stam · Major Fortitude/Intellect/Endurance" },
  { id: "essence-of-immovability",    label: "Essence of Immovability",    sub: "Immune to knockback & disabling effects" },
  { id: "essence-of-speed",           label: "Essence of Speed",           sub: "Major Expedition · +30% Move Speed"      },
  { id: "essence-of-invisibility",    label: "Essence of Invisibility",    sub: "Vanish for X seconds"                    },
  { id: "essence-of-detection",       label: "Essence of Detection",       sub: "+20m Stealth Detection"                  },
  { id: "alliance-battle-draught",    label: "Alliance Battle Draught",    sub: "Restore Stamina · PvP"                   },
  { id: "alliance-health-draught",    label: "Alliance Health Draught",    sub: "Restore Health · PvP"                    },
  { id: "alliance-spell-draught",     label: "Alliance Spell Draught",     sub: "Restore Magicka · PvP"                   },
];

const POISON_ITEMS: SelectItem[] = [
  { id: "drain-health-poison-ix",    label: "Drain Health Poison IX",    sub: "Ravage Health · Restore Health/Stamina"  },
  { id: "damage-health-poison-ix",   label: "Damage Health Poison IX",   sub: "Ravage Health · Hindrance · Uncertainty" },
  { id: "escapist-poison-ix",        label: "Escapist Poison IX",        sub: "Hindrance · Uncertainty · Ravage Stamina"},
  { id: "creeping-ravage-health",    label: "Creeping Ravage Health",    sub: "Gradual Ravage Health (long duration)"    },
];

// ── LabeledSelect ─────────────────────────────────────────────────────────────

function LabeledSelect({ label, value, onChange, items, placeholder, searchPlaceholder }: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  items: SelectItem[];
  placeholder?: string;
  searchPlaceholder?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{
        fontFamily: F.mono, fontSize: 9, letterSpacing: "0.32em",
        color: T.inkFaint, textTransform: "uppercase",
      }}>{label}</div>
      <SearchSelect
        value={value}
        onChange={onChange}
        items={items}
        placeholder={placeholder ?? "— none —"}
        searchPlaceholder={searchPlaceholder ?? "Search…"}
        popoverWidth={360}
      />
    </div>
  );
}

// ── ConsumablesTab ────────────────────────────────────────────────────────────

export default function ConsumablesTab() {
  const consumables      = useEditorStore((s) => s.setups[s.activeSetupIdx].consumables);
  const patchConsumables = useEditorStore((s) => s.patchConsumables);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, height: "100%" }}>

      {/* Food · Potion · Poison */}
      <div>
        <SectionHead title="Food & Potions" count="passive buffs" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          <LabeledSelect
            label="Food / Drink"
            value={consumables.food}
            onChange={(v) => patchConsumables({ food: v || undefined })}
            items={FOOD_ITEMS}
            searchPlaceholder="Search food…"
          />
          <LabeledSelect
            label="Potion"
            value={consumables.potion}
            onChange={(v) => patchConsumables({ potion: v || undefined })}
            items={POTION_ITEMS}
            searchPlaceholder="Search potions…"
          />
          <LabeledSelect
            label="Poison"
            value={consumables.poison}
            onChange={(v) => patchConsumables({ poison: v || undefined })}
            items={POISON_ITEMS}
            searchPlaceholder="Search poisons…"
          />
        </div>
      </div>

    </div>
  );
}
