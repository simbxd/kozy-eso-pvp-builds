import { useEditorStore } from "../state";
import { T, F, SectionHead } from "../atoms";
import { SearchSelect, type SelectItem } from "../atoms/SearchSelect";

// ── Static data ───────────────────────────────────────────────────────────────

const MUNDUS_LIST = [
  "Apprentice","Atronach","Lady","Lord","Lover",
  "Mage","Ritual","Serpent","Shadow","Steed","Thief","Tower","Warrior",
];

const FOOD_ITEMS: SelectItem[] = [
  { id: "bewitched-sugar-skulls",               label: "Bewitched Sugar Skulls",               badge: "Food",  sub: "+Max Health · +Max Stamina · Health Rec"       },
  { id: "artaeum-pickled-fish-bowl",             label: "Artaeum Pickled Fish Bowl",             badge: "Food",  sub: "+Max Health · +Max Magicka"                     },
  { id: "braised-rabbit-with-spring-vegetables", label: "Braised Rabbit with Spring Vegetables", badge: "Food",  sub: "+Max Health · +Max Stamina"                     },
  { id: "lava-foot-soup-and-saltrice",           label: "Lava Foot Soup-and-Saltrice",           badge: "Food",  sub: "+Max Stamina · Stamina Rec"                     },
  { id: "orzorgas-smoked-bear-haunch",           label: "Orzorga's Smoked Bear Haunch",          badge: "Food",  sub: "+Max Health · Health Rec · Magicka Rec"         },
  { id: "witchmothers-potent-brew",              label: "Witchmother's Potent Brew",             badge: "Drink", sub: "+Max Health · +Max Magicka · Magicka Rec"       },
  { id: "ghastly-eye-bowl",                      label: "Ghastly Eye Bowl",                      badge: "Drink", sub: "+Max Magicka · Magicka Rec"                     },
];

const POTION_ITEMS: SelectItem[] = [
  { id: "essence-of-weapon-power",   label: "Essence of Weapon Power",   sub: "Major Brutality · +20% Weapon Damage"     },
  { id: "essence-of-spell-power",    label: "Essence of Spell Power",    sub: "Major Sorcery · +20% Spell Damage"        },
  { id: "essence-of-weapon-critical",label: "Essence of Weapon Critical",sub: "Major Savagery · 2629 Weapon Crit"        },
  { id: "essence-of-spell-critical", label: "Essence of Spell Critical", sub: "Major Prophecy · 2629 Spell Crit"         },
  { id: "essence-of-health",         label: "Essence of Health",         sub: "Restore Health/Mag/Stam · Major Fortitude/Intellect/Endurance" },
  { id: "essence-of-immovability",   label: "Essence of Immovability",   sub: "Immune to knockback & disabling effects"  },
  { id: "essence-of-speed",          label: "Essence of Speed",          sub: "Major Expedition · +30% Move Speed"       },
  { id: "essence-of-invisibility",   label: "Essence of Invisibility",   sub: "Vanish for X seconds"                     },
  { id: "essence-of-detection",      label: "Essence of Detection",      sub: "+20m Stealth Detection"                   },
  { id: "alliance-battle-draught",   label: "Alliance Battle Draught",   sub: "Restore Stamina · PvP"                    },
  { id: "alliance-health-draught",   label: "Alliance Health Draught",   sub: "Restore Health · PvP"                     },
  { id: "alliance-spell-draught",    label: "Alliance Spell Draught",    sub: "Restore Magicka · PvP"                    },
];

// ── ConsumablesTab ────────────────────────────────────────────────────────────

export default function ConsumablesTab() {
  const consumables      = useEditorStore((s) => s.setups[s.activeSetupIdx].consumables);
  const patchConsumables = useEditorStore((s) => s.patchConsumables);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, height: "100%" }}>

      {/* Mundus */}
      <div>
        <SectionHead title="Mundus Stone" count="1 active · default" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
          {MUNDUS_LIST.map((m) => {
            const on = consumables.mundus === m;
            return (
              <button
                key={m} type="button"
                onClick={() => patchConsumables({ mundus: on ? undefined : m })}
                style={{
                  padding: "10px 8px", textAlign: "center",
                  border: `1px solid ${on ? T.accent : T.edge}`,
                  background: on ? "rgba(139,92,246,0.12)" : "rgba(10,6,18,0.4)",
                  color: on ? T.accentSoft : T.inkDim,
                  fontFamily: F.cinzel, fontSize: 13,
                  fontStyle: on ? "normal" : "italic",
                  fontWeight: on ? 600 : 400,
                  cursor: "pointer",
                }}
              >{m}</button>
            );
          })}
        </div>
      </div>

      {/* Food & Potions */}
      <div>
        <SectionHead title="Food & Potions" count="passive buffs" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

          {/* Food / Drink */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{
              fontFamily: F.mono, fontSize: 9, letterSpacing: "0.32em",
              color: T.inkFaint, textTransform: "uppercase",
            }}>Food / Drink</div>
            <SearchSelect
              value={consumables.food}
              onChange={(v) => patchConsumables({ food: v || undefined })}
              items={FOOD_ITEMS}
              placeholder="— none —"
              searchPlaceholder="Search food…"
              popoverWidth={400}
            />
          </div>

          {/* Potion */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{
              fontFamily: F.mono, fontSize: 9, letterSpacing: "0.32em",
              color: T.inkFaint, textTransform: "uppercase",
            }}>Potion</div>
            <SearchSelect
              value={consumables.potion}
              onChange={(v) => patchConsumables({ potion: v || undefined })}
              items={POTION_ITEMS}
              placeholder="— none —"
              searchPlaceholder="Search potions…"
              popoverWidth={400}
            />
          </div>

        </div>
      </div>

      {/* Companion / Pet */}
      <div>
        <SectionHead title="Companion / Pet" count="optional" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{
              fontFamily: F.mono, fontSize: 9, letterSpacing: "0.32em",
              color: T.inkFaint, textTransform: "uppercase",
            }}>Companion</div>
            <SearchSelect
              value={consumables.companion}
              onChange={(v) => patchConsumables({ companion: v || undefined })}
              items={[]}
              placeholder="— none —"
              searchPlaceholder="Search…"
              popoverWidth={300}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{
              fontFamily: F.mono, fontSize: 9, letterSpacing: "0.32em",
              color: T.inkFaint, textTransform: "uppercase",
            }}>Pet / Other</div>
            <SearchSelect
              value={undefined}
              onChange={() => {}}
              items={[]}
              placeholder="— none —"
              searchPlaceholder="Search…"
              popoverWidth={300}
            />
          </div>
        </div>
      </div>

    </div>
  );
}
