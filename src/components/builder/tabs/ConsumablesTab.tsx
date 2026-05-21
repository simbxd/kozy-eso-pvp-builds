import { useEditorStore } from "../state";
import { T, F, FieldShell, SectionHead } from "../atoms";

const MUNDUS_LIST = [
  "Apprentice","Atronach","Lady","Lord","Lover",
  "Mage","Ritual","Serpent","Shadow","Steed","Thief","Tower","Warrior",
];

export default function ConsumablesTab() {
  const consumables     = useEditorStore((s) => s.setups[s.activeSetupIdx].consumables);
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
          <FieldShell
            label="Food / Drink" placeholder="Bewitched Sugar Skulls"
            value={consumables.food}
            onChange={(v) => patchConsumables({ food: v || undefined })}
          />
          <FieldShell
            label="Potion" placeholder="Tri-Stat / Weapon Power"
            value={consumables.potion}
            onChange={(v) => patchConsumables({ potion: v || undefined })}
          />
        </div>
      </div>

      {/* Companion / Pet */}
      <div>
        <SectionHead title="Companion / Pet" count="optional" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <FieldShell
            label="Companion" placeholder="— none —"
            value={consumables.companion}
            onChange={(v) => patchConsumables({ companion: v || undefined })}
          />
          <FieldShell
            label="Pet / other" placeholder="— none —"
          />
        </div>
      </div>

    </div>
  );
}
