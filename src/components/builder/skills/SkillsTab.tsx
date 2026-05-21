import SkillBar from "@/components/builder/skills/SkillBar";
import PassivesSection from "@/components/builder/skills/PassivesSection";

// Bars 0/1 = front/back (matches gear bar order). Passives derive from the
// build's 3 slotted subclass lines; race / weapon-line / guild passives are
// out of scope for M5 — flagged in PassivesSection's empty-state copy.
export default function SkillsTab() {
  return (
    <div className="flex flex-col gap-4">
      <SkillBar bar={0} />
      <SkillBar bar={1} />
      <PassivesSection />
    </div>
  );
}
