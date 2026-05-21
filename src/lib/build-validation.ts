import type { Build } from "@/types/build";
import { getSkillLine } from "@/lib/eso-data";

// A subclass is valid as long as at least one slotted skill line belongs to
// the chosen base class. An unset class (no selection yet) is vacuously
// valid so the empty build never shows an error. M2 builds the picker UI on
// top of this; later milestones add more validators here.
export function isSubclassValid(build: Build): boolean {
  if (!build.c) return true;
  return build.sl.some((id) => {
    if (!id) return false;
    return getSkillLine(id)?.class_id === build.c;
  });
}
