import CpTreeSection from "@/components/builder/cp/CpTree";

// Two constellations rendered: Warfare (red) + Fitness (blue). The schema
// tree enum still carries "green" (Craft) for forward compatibility, but the
// PvP curation skips it — no UI section. Old URLs with green entries are
// kept in build.cp untouched and simply unrendered.
export default function CpTab() {
  return (
    <div className="flex flex-col gap-4">
      <CpTreeSection tree="red" />
      <CpTreeSection tree="blue" />
    </div>
  );
}
