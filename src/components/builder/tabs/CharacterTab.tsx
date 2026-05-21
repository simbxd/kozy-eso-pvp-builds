import { useEditorStore } from "../state";
import { T, F, FieldShell, PillBtn, SectionHead } from "../atoms";

type Difficulty = "beginner" | "intermediate" | "advanced" | "expert";

const DIFFICULTIES: Array<[Difficulty, string]> = [
  ["beginner",     "Beginner"    ],
  ["intermediate", "Intermediate"],
  ["advanced",     "Advanced"    ],
  ["expert",       "Expert"      ],
];

export default function CharacterTab() {
  const meta      = useEditorStore((s) => s.meta);
  const patchMeta = useEditorStore((s) => s.patchMeta);

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18,
      height: "100%", overflow: "hidden",
    }}>
      {/* Left — Identity */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <SectionHead title="Identity" count="display info" />

        <FieldShell label="Build name" placeholder="Untitled Build"
          value={meta.name} onChange={(v) => patchMeta({ name: v })} />

        <FieldShell label="Author" placeholder="Kozy"
          value={meta.author} onChange={(v) => patchMeta({ author: v })} />

        <FieldShell label="Patch" placeholder="U50"
          value={meta.patch} mono onChange={(v) => patchMeta({ patch: v })} />
      </div>

      {/* Right — Long-form */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <SectionHead title="Summary" count="2-3 sentences" />
        <textarea
          value={meta.summary}
          onChange={(e) => patchMeta({ summary: e.target.value })}
          placeholder="Describe the build concept and playstyle..."
          style={{
            height: 110, padding: "10px 12px",
            border: `1px dashed ${T.edgeStrong}`,
            background: "rgba(10,6,18,0.55)",
            color: meta.summary ? T.ink : T.inkMute,
            fontFamily: F.display, fontStyle: "italic", fontSize: 14,
            lineHeight: 1.5, resize: "vertical",
            outline: "none",
          }}
        />

        <SectionHead title="Difficulty" count="self-rated" />
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {DIFFICULTIES.map(([key, label]) => (
            <PillBtn
              key={key}
              active={meta.difficulty === key}
              onClick={() => patchMeta({ difficulty: key })}
            >{label}</PillBtn>
          ))}
        </div>

        <SectionHead title="Featured" count="show in highlights" />
        <div style={{ display: "flex", gap: 6 }}>
          <PillBtn active={!meta.featured} onClick={() => patchMeta({ featured: false })}>Off</PillBtn>
          <PillBtn active={meta.featured}  onClick={() => patchMeta({ featured: true  })}>On</PillBtn>
        </div>
      </div>
    </div>
  );
}
