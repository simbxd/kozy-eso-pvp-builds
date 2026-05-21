import { useBuilderStore, type TabId } from "@/store/builder-store";
import GearTab from "@/components/builder/gear/GearTab";
import SkillsTab from "@/components/builder/skills/SkillsTab";
import CpTab from "@/components/builder/cp/CpTab";
import AttrTab from "@/components/builder/attr/AttrTab";
import BuffsTab from "@/components/builder/buffs/BuffsTab";

// Tabs not yet built show a placeholder noting the milestone they land in.
const PLACEHOLDER: Partial<Record<TabId, string>> = {
  share: "Share — coming in M10",
};

export default function TabContent() {
  const activeTab = useBuilderStore((s) => s.activeTab);

  if (activeTab === "gear")   return <GearTab />;
  if (activeTab === "skills") return <SkillsTab />;
  if (activeTab === "cp")     return <CpTab />;
  if (activeTab === "attr")   return <AttrTab />;
  if (activeTab === "buffs")  return <BuffsTab />;

  const msg = PLACEHOLDER[activeTab];
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <h2 className="font-display text-xl text-text">{msg ?? activeTab}</h2>
    </div>
  );
}
