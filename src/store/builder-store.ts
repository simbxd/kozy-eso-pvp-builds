import { create } from "zustand";
import type { Build, GearPieceV1, GearSlotId, BarSetupV1 } from "@/types/build";
import { emptyBuild } from "@/lib/build-defaults";
import { encodeBuild } from "@/lib/build-codec";

export type TabId = "gear" | "skills" | "cp" | "attr" | "buffs" | "share";

type BuilderState = {
  build: Build;
  activeTab: TabId;
  setClass: (id: string) => void;
  setRace: (id: string) => void;
  setMundus: (id: string) => void;
  setMode: (mode: NonNullable<Build["meta"]>["mode"]) => void;
  setSkillLine: (slot: 0 | 1 | 2, id: string) => void;
  setGearPiece: (slot: GearSlotId, patch: Partial<GearPieceV1>) => void;
  clearGearPiece: (slot: GearSlotId) => void;
  setBarSkill: (bar: 0 | 1, slot: 0 | 1 | 2 | 3 | 4, id: string) => void;
  setBarUltimate: (bar: 0 | 1, id: string) => void;
  setBarWeapon: (bar: 0 | 1, w: string) => void;
  togglePassive: (id: string) => void;
  setCpStar: (tree: "red" | "blue" | "green", fromId: string, toId: string) => void;
  setAttr: (idx: 0 | 1 | 2, val: number) => void;
  setFood: (id: string) => void;
  setBattleSpirit: (on: boolean) => void;
  toggleBuff: (id: string) => void;
  setConditionalBonuses: (on: boolean) => void;
  setActiveTab: (tab: TabId) => void;
  loadBuild: (build: Build) => void;
  reset: () => void;
};

export const useBuilderStore = create<BuilderState>((set) => ({
  build: emptyBuild(),
  activeTab: "gear",

  setClass: (id) => set((s) => ({ build: { ...s.build, c: id } })),
  setRace: (id) => set((s) => ({ build: { ...s.build, r: id } })),
  setMundus: (id) =>
    set((s) => ({ build: { ...s.build, a: { ...s.build.a, mundus: id } } })),
  setMode: (mode) =>
    set((s) => ({ build: { ...s.build, meta: { ...s.build.meta, mode } } })),
  setSkillLine: (slot, id) =>
    set((s) => {
      const sl: Build["sl"] = [...s.build.sl];
      sl[slot] = id;
      return { build: { ...s.build, sl } };
    }),

  // Upsert: merge into the existing piece for this slot, or create a fresh
  // one. A piece always carries its slot id `s` so build.g stays a flat list.
  setGearPiece: (slot, patch) =>
    set((s) => {
      const existing = s.build.g.find((p) => p.s === slot);
      const next: GearPieceV1 = existing
        ? { ...existing, ...patch }
        : { s: slot, id: "", t: "", e: "", q: 1, ...patch };
      const g = existing
        ? s.build.g.map((p) => (p.s === slot ? next : p))
        : [...s.build.g, next];
      return { build: { ...s.build, g } };
    }),
  clearGearPiece: (slot) =>
    set((s) => ({
      build: { ...s.build, g: s.build.g.filter((p) => p.s !== slot) },
    })),

  setBarSkill: (bar, slot, id) =>
    set((s) => {
      const b = [...s.build.b] as Build["b"];
      const sk = [...b[bar].sk] as BarSetupV1["sk"];
      sk[slot] = id;
      b[bar] = { ...b[bar], sk };
      return { build: { ...s.build, b } };
    }),
  setBarUltimate: (bar, id) =>
    set((s) => {
      const b = [...s.build.b] as Build["b"];
      b[bar] = { ...b[bar], u: id };
      return { build: { ...s.build, b } };
    }),
  setBarWeapon: (bar, w) =>
    set((s) => {
      const b = [...s.build.b] as Build["b"];
      b[bar] = { ...b[bar], w };
      return { build: { ...s.build, b } };
    }),
  // build.pa lists DISABLED passives — present means off, absent means on.
  // Toggling flips membership; empty array dropped to keep payload tidy.
  togglePassive: (id) =>
    set((s) => {
      const cur = s.build.pa ?? [];
      const next = cur.includes(id)
        ? cur.filter((x) => x !== id)
        : [...cur, id];
      const pa = next.length ? next : undefined;
      return { build: { ...s.build, pa } };
    }),
  setAttr: (idx, val) =>
    set((s) => {
      const cur = s.build.a.attrPoints ?? [0, 0, 64];
      const others = cur[0] + cur[1] + cur[2] - cur[idx];
      const next: [number, number, number] = [cur[0], cur[1], cur[2]];
      next[idx] = Math.max(0, Math.min(val, 64 - others));
      return { build: { ...s.build, a: { ...s.build.a, attrPoints: next } } };
    }),

  setFood: (id) =>
    set((s) => ({ build: { ...s.build, a: { ...s.build.a, food: id || undefined } } })),
  setBattleSpirit: (on) =>
    set((s) => ({ build: { ...s.build, bs: on } })),
  toggleBuff: (id) =>
    set((s) => {
      const cur = s.build.bx ?? [];
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
      return { build: { ...s.build, bx: next.length ? next : undefined } };
    }),
  setConditionalBonuses: (on) =>
    set((s) => ({ build: { ...s.build, a: { ...s.build.a, cb: on } } })),


  // Tri-state slot edit: empty fromId = add, empty toId = remove, both = swap.
  // 4-cap per tree, no duplicates per tree.
  setCpStar: (tree, fromId, toId) =>
    set((s) => {
      let cp = s.build.cp;
      if (fromId) cp = cp.filter((e) => !(e.tree === tree && e.id === fromId));
      if (toId) {
        if (cp.some((e) => e.tree === tree && e.id === toId)) return s;
        if (cp.filter((e) => e.tree === tree).length >= 4) return s;
        cp = [...cp, { tree, id: toId }];
      }
      return { build: { ...s.build, cp } };
    }),

  setActiveTab: (tab) => set({ activeTab: tab }),
  loadBuild: (build) => set({ build }),
  reset: () => set({ build: emptyBuild() }),
}));

// ── URL persistence ───────────────────────────────────────────────────────
// The build lives in `?b=`. We rewrite it with history.replaceState (no new
// history entry, no scroll) 300ms after the last edit so dragging a slider
// or fast typing doesn't thrash the URL. activeTab is intentionally NOT
// persisted here — only `build` changes trigger a rewrite.
if (typeof window !== "undefined") {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let prevBuild = useBuilderStore.getState().build;

  useBuilderStore.subscribe((state) => {
    if (state.build === prevBuild) return;
    prevBuild = state.build;

    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      const url = new URL(window.location.href);
      url.searchParams.set("b", encodeBuild(useBuilderStore.getState().build));
      window.history.replaceState(window.history.state, "", url);
    }, 300);
  });
}
