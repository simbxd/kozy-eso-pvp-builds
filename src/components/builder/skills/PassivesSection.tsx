import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { passivesForLines, skillLinesIndex } from "@/lib/eso-data";
import { useBuilderStore } from "@/store/builder-store";
import type { Build } from "@/types/build";
import type { EsoSkillIndex } from "@/types/eso";

// ── Mapping helpers ──────────────────────────────────────────────────────────

const RACE_LINE: Record<string, string> = {
  breton: "breton-skills",
  altmer: "high-elf-skills",
  dunmer: "dark-elf-skills",
  argonian: "argonian-skills",
  khajiit: "khajiit-skills",
  nord: "nord-skills",
  orc: "orc-skills",
  bosmer: "wood-elf-skills",
  imperial: "imperial-skills",
  redguard: "redguard-skills",
};

const WEAPON_TYPE_TO_LINE: Record<string, string> = {
  "bow": "bow",
  "two-handed": "two-handed",
  "inferno-staff": "destruction-staff",
  "lightning-staff": "destruction-staff",
  "ice-staff": "destruction-staff",
  "restoration-staff": "restoration-staff",
};

const ONE_HAND_TYPES = new Set(["one-handed", "mace", "sword", "axe", "dagger"]);

// Display names for skill lines not present in skillLinesIndex (non-class lines)
const LINE_DISPLAY_NAME: Record<string, string> = {
  "breton-skills": "Breton",
  "high-elf-skills": "High Elf",
  "dark-elf-skills": "Dark Elf",
  "argonian-skills": "Argonian",
  "khajiit-skills": "Khajiit",
  "nord-skills": "Nord",
  "orc-skills": "Orc",
  "wood-elf-skills": "Wood Elf",
  "imperial-skills": "Imperial",
  "redguard-skills": "Redguard",
  "light-armor": "Light Armor",
  "medium-armor": "Medium Armor",
  "heavy-armor": "Heavy Armor",
  "bow": "Bow",
  "two-handed": "Two Handed",
  "dual-wield": "Dual Wield",
  "one-hand-and-shield": "One Hand and Shield",
  "destruction-staff": "Destruction Staff",
  "restoration-staff": "Restoration Staff",
  "fighters-guild": "Fighters Guild",
  "mages-guild": "Mages Guild",
  "undaunted": "Undaunted",
  "psijic-order": "Psijic Order",
  "assault": "Assault",
  "support": "Support",
  "emperor": "Emperor",
  "soul-magic": "Soul Magic",
  "vampire": "Vampire",
  "werewolf": "Werewolf",
};

// Derive weapon skill lines from all equipped weapon slots (both bars).
// In ESO, weapon passives are active as long as the weapon type is equipped
// anywhere — bar 1 or bar 2 — matching UESP's behaviour.
function weaponLinesFromBuild(build: Build): string[] {
  const lines = new Set<string>();

  const barSlots: Array<[string, string]> = [
    ["mh1", "oh1"],
    ["mh2", "oh2"],
  ];

  for (const [mhSlot, ohSlot] of barSlots) {
    const mhType = build.g.find((p) => p.s === mhSlot)?.wp ?? "";
    const ohType = build.g.find((p) => p.s === ohSlot)?.wp ?? "";

    if (WEAPON_TYPE_TO_LINE[mhType]) {
      lines.add(WEAPON_TYPE_TO_LINE[mhType]);
    } else if (ONE_HAND_TYPES.has(mhType)) {
      if (ONE_HAND_TYPES.has(ohType)) lines.add("dual-wield");
      else if (ohType === "shield")    lines.add("one-hand-and-shield");
      else                             lines.add("dual-wield");
    }

    if (WEAPON_TYPE_TO_LINE[ohType]) lines.add(WEAPON_TYPE_TO_LINE[ohType]);
  }

  return [...lines];
}

type PassiveGroup = {
  category: string;
  lineIds: string[];
};

function buildPassiveGroups(build: Build): PassiveGroup[] {
  const groups: PassiveGroup[] = [];

  // Race
  const raceLine = RACE_LINE[build.r];
  if (raceLine) groups.push({ category: "Race", lineIds: [raceLine] });

  // Class — all 3 lines for the selected class
  const classLines = skillLinesIndex
    .filter((l) => l.class?.toLowerCase() === build.c?.toLowerCase())
    .map((l) => l.id);
  if (classLines.length) groups.push({ category: "Class", lineIds: classLines });

  // Armor
  groups.push({ category: "Armor", lineIds: ["light-armor", "medium-armor", "heavy-armor"] });

  // Weapon — derived from equipped weapon types on both bars (like UESP)
  const weapLines = weaponLinesFromBuild(build);
  if (weapLines.length) groups.push({ category: "Weapon", lineIds: weapLines });

  // Guild
  groups.push({
    category: "Guild",
    lineIds: ["fighters-guild", "mages-guild", "undaunted", "psijic-order"],
  });

  // Alliance War
  groups.push({ category: "Alliance War", lineIds: ["assault", "support", "emperor"] });

  // World
  groups.push({ category: "World", lineIds: ["soul-magic", "vampire", "werewolf"] });

  return groups;
}

// ── Sub-components ───────────────────────────────────────────────────────────

function PassiveRow({
  passive,
  enabled,
  onToggle,
}: {
  passive: EsoSkillIndex;
  enabled: boolean;
  onToggle: () => void;
}) {
  const [iconOk, setIconOk] = useState(true);
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={enabled}
      className={`flex w-full items-center gap-2 rounded border px-2 py-1.5 text-left text-sm transition-colors ${
        enabled
          ? "border-border-2 bg-surface-2 text-text"
          : "border-border bg-surface text-text-muted line-through"
      }`}
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
          enabled ? "border-accent bg-accent-glow text-accent" : "border-border"
        }`}
      >
        {enabled && <Check size={12} aria-hidden="true" />}
      </span>
      {iconOk ? (
        <img
          src={passive.icon}
          alt=""
          onError={() => setIconOk(false)}
          className="h-5 w-5 shrink-0 rounded-full"
          style={{ clipPath: "circle(50%)" }}
        />
      ) : (
        <span className="h-5 w-5 shrink-0 rounded-full bg-surface-2" />
      )}
      <span className="min-w-0 flex-1 truncate font-body">{passive.name}</span>
    </button>
  );
}

function PassiveLineGroup({
  lineId,
  disabledSet,
  onToggle,
}: {
  lineId: string;
  disabledSet: Set<string>;
  onToggle: (id: string) => void;
}) {
  const passives = useMemo(() => passivesForLines([lineId]), [lineId]);
  const line = skillLinesIndex.find((l) => l.id === lineId);
  const displayName = line?.name ?? LINE_DISPLAY_NAME[lineId] ?? lineId;
  if (!passives.length) return null;

  return (
    <div>
      <p className="mb-1 text-[10px] uppercase tracking-wider text-text-muted font-mono">
        {displayName}
      </p>
      <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
        {passives.map((p) => (
          <PassiveRow
            key={p.id}
            passive={p}
            enabled={!disabledSet.has(p.id)}
            onToggle={() => onToggle(p.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function PassivesSection() {
  const build = useBuilderStore((s) => s.build);
  const togglePassive = useBuilderStore((s) => s.togglePassive);

  const groups = useMemo(() => buildPassiveGroups(build), [build]);
  const disabledSet = useMemo(() => new Set(build.pa ?? []), [build.pa]);

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="font-display text-sm uppercase tracking-wide text-text-muted">
          Passives
        </h3>
        <span className="text-[10px] text-text-muted font-mono">
          click to toggle — off = disabled
        </span>
      </div>

      <div className="flex flex-col gap-5">
        {groups.map(({ category, lineIds }) => {
          // Check if any line in this group has passives
          const anyPassives = lineIds.some(
            (id) => passivesForLines([id]).length > 0,
          );
          if (!anyPassives) return null;

          return (
            <div key={category}>
              <p className="mb-2 font-mono text-[9px] uppercase tracking-widest text-accent">
                {category}
              </p>
              <div className="flex flex-col gap-3">
                {lineIds.map((lineId) => (
                  <PassiveLineGroup
                    key={lineId}
                    lineId={lineId}
                    disabledSet={disabledSet}
                    onToggle={togglePassive}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
