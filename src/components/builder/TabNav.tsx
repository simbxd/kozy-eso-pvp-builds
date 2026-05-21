import {
  Swords, Zap, Star, SlidersHorizontal, Flame, Share2,
  type LucideIcon,
} from "lucide-react";
import { useBuilderStore, type TabId } from "@/store/builder-store";

const TABS: Array<{ id: TabId; label: string; icon: LucideIcon }> = [
  { id: "gear", label: "Gear", icon: Swords },
  { id: "skills", label: "Skills", icon: Zap },
  { id: "cp", label: "CP", icon: Star },
  { id: "attr", label: "Attr", icon: SlidersHorizontal },
  { id: "buffs", label: "Buffs", icon: Flame },
  { id: "share", label: "Share", icon: Share2 },
];

export default function TabNav() {
  const activeTab = useBuilderStore((s) => s.activeTab);
  const setActiveTab = useBuilderStore((s) => s.setActiveTab);

  return (
    <nav
      aria-label="Builder sections"
      className="flex flex-col gap-1 self-start rounded-lg border border-border bg-surface p-2"
    >
      {TABS.map(({ id, label, icon: Icon }) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            type="button"
            aria-current={active ? "page" : undefined}
            onClick={() => setActiveTab(id)}
            className={`flex flex-col items-center gap-1 rounded px-1 py-2 text-xs font-body transition-colors ${
              active
                ? "bg-accent-glow text-accent"
                : "text-text-muted hover:text-text"
            }`}
          >
            <Icon size={18} aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
