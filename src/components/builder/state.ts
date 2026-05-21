import { create } from "zustand";

// ── Types ─────────────────────────────────────────────────────────────────────

export type TabKey =
  | "general" | "guide" | "pros" | "share"
  | "equipment" | "skills" | "passives" | "masteries"
  | "cp" | "attributes" | "consumables";

export type ArmorWeight = "heavy" | "medium" | "light";

export type ArmorPiece = {
  slot: "head" | "chest" | "shoulders" | "hands" | "waist" | "legs" | "feet";
  set?: string;
  trait?: string;
  enchant?: string;
  weight: ArmorWeight;
};

export type JewelryPiece = {
  slot: "necklace" | "ring1" | "ring2";
  set?: string;
  trait?: string;
  enchant?: string;
};

export type WeaponPiece = {
  slot: "bar1_main" | "bar1_off" | "bar2_main" | "bar2_off";
  set?: string;
  trait?: string;
  enchant?: string;
  type?: string;
};

export type Setup = {
  name: string;
  armor: ArmorPiece[];
  jewelry: JewelryPiece[];
  weapons: WeaponPiece[];
  bar1: string[];  // 6 items: [slot1, slot2, slot3, slot4, slot5, ultimate]
  bar2: string[];
  passives: Record<string, boolean>;   // key = individual passive skill ID
  cp: {
    warfare: Array<[string, number]>;
    fitness: Array<[string, number]>;
  };
  attributes: { health: number; magicka: number; stamina: number };
  consumables: {
    mundus?: string;
    food?: string;
    potion?: string;
    poison?: string;
  };
};

export type BuildMeta = {
  name: string;
  slug: string;
  author: string;
  patch: string;
  classId: string;
  race: string;
  mundus: string;
  subclasses: [string, string, string];
  mode: "cyro" | "bg" | "ic" | "duel";
  difficulty: "beginner" | "intermediate" | "advanced" | "expert";
  featured: boolean;
  summary: string;
  tags: string[];
  guide: string;
  pros: string[];
  cons: string[];
};

// ── Defaults ──────────────────────────────────────────────────────────────────

export const defaultSetup = (name = "Default"): Setup => ({
  name,
  armor: [
    { slot: "head",      weight: "heavy"  },
    { slot: "chest",     weight: "heavy"  },
    { slot: "shoulders", weight: "medium" },
    { slot: "hands",     weight: "medium" },
    { slot: "waist",     weight: "light"  },
    { slot: "legs",      weight: "light"  },
    { slot: "feet",      weight: "light"  },
  ],
  jewelry: [
    { slot: "necklace" },
    { slot: "ring1"    },
    { slot: "ring2"    },
  ],
  weapons: [
    { slot: "bar1_main" },
    { slot: "bar1_off"  },
    { slot: "bar2_main" },
    { slot: "bar2_off"  },
  ],
  bar1: ["", "", "", "", "", ""],
  bar2: ["", "", "", "", "", ""],
  passives: {},
  cp: { warfare: [], fitness: [] },
  attributes: { health: 0, magicka: 0, stamina: 0 },
  consumables: {},
});

const defaultMeta = (): BuildMeta => ({
  name: "", slug: "", author: "Kozy", patch: "U50",
  classId: "", race: "", mundus: "",
  subclasses: ["", "", ""],
  mode: "cyro",
  difficulty: "intermediate",
  featured: false,
  summary: "",
  tags: [],
  guide: "",
  pros: [],
  cons: [],
});

// ── Store ─────────────────────────────────────────────────────────────────────

type EditorState = {
  meta: BuildMeta;
  setups: Setup[];
  activeSetupIdx: number;
  activeTab: TabKey;

  setActiveTab: (tab: TabKey) => void;
  setActiveSetup: (idx: number) => void;
  addSetup: () => void;
  patchMeta: (patch: Partial<BuildMeta>) => void;
  patchSetup: (patch: Partial<Setup>) => void;
  patchArmorPiece: (slot: ArmorPiece["slot"], patch: Partial<ArmorPiece>) => void;
  patchJewelryPiece: (slot: JewelryPiece["slot"], patch: Partial<JewelryPiece>) => void;
  patchWeaponPiece: (slot: WeaponPiece["slot"], patch: Partial<WeaponPiece>) => void;
  setSkill: (bar: 0 | 1, idx: number, id: string) => void;
  togglePassive: (skillId: string) => void;
  setCpStar: (tree: "warfare" | "fitness", slotIdx: number, entry: [string, number] | null) => void;
  setAttr: (key: "health" | "magicka" | "stamina", val: number) => void;
  patchConsumables: (patch: Partial<Setup["consumables"]>) => void;
  loadState: (meta: BuildMeta, setups: Setup[]) => void;
  reset: () => void;
};

export const useEditorStore = create<EditorState>((set, get) => ({
  meta: defaultMeta(),
  setups: [defaultSetup()],
  activeSetupIdx: 0,
  activeTab: "equipment",

  setActiveTab: (tab) => set({ activeTab: tab }),
  setActiveSetup: (idx) => set({ activeSetupIdx: idx }),

  addSetup: () => set((s) => {
    if (s.setups.length >= 5) return s;
    const name = `Setup ${s.setups.length + 1}`;
    return {
      setups: [...s.setups, defaultSetup(name)],
      activeSetupIdx: s.setups.length,
    };
  }),

  patchMeta: (patch) => set((s) => ({ meta: { ...s.meta, ...patch } })),

  patchSetup: (patch) => set((s) => {
    const setups = [...s.setups];
    setups[s.activeSetupIdx] = { ...setups[s.activeSetupIdx], ...patch };
    return { setups };
  }),

  patchArmorPiece: (slot, patch) => set((s) => {
    const setup = s.setups[s.activeSetupIdx];
    const armor = setup.armor.map((p) => p.slot === slot ? { ...p, ...patch } : p);
    const setups = s.setups.map((su, i) => i === s.activeSetupIdx ? { ...su, armor } : su);
    return { setups };
  }),

  patchJewelryPiece: (slot, patch) => set((s) => {
    const setup = s.setups[s.activeSetupIdx];
    const jewelry = setup.jewelry.map((p) => p.slot === slot ? { ...p, ...patch } : p);
    const setups = s.setups.map((su, i) => i === s.activeSetupIdx ? { ...su, jewelry } : su);
    return { setups };
  }),

  patchWeaponPiece: (slot, patch) => set((s) => {
    const setup = s.setups[s.activeSetupIdx];
    const weapons = setup.weapons.map((p) => p.slot === slot ? { ...p, ...patch } : p);
    const setups = s.setups.map((su, i) => i === s.activeSetupIdx ? { ...su, weapons } : su);
    return { setups };
  }),

  setSkill: (bar, idx, id) => set((s) => {
    const setup = s.setups[s.activeSetupIdx];
    const key = bar === 0 ? "bar1" : "bar2";
    const arr = [...setup[key]];
    arr[idx] = id;
    const setups = s.setups.map((su, i) => i === s.activeSetupIdx ? { ...su, [key]: arr } : su);
    return { setups };
  }),

  togglePassive: (skillId) => set((s) => {
    const setup = s.setups[s.activeSetupIdx];
    const passives = { ...setup.passives };
    if (passives[skillId]) {
      delete passives[skillId];
    } else {
      passives[skillId] = true;
    }
    const setups = s.setups.map((su, i) => i === s.activeSetupIdx ? { ...su, passives } : su);
    return { setups };
  }),

  setCpStar: (tree, slotIdx, entry) => set((s) => {
    const setup = s.setups[s.activeSetupIdx];
    const arr: Array<[string, number]> = [...(setup.cp[tree] as Array<[string, number]>)];
    if (entry === null) {
      arr.splice(slotIdx, 1);
    } else {
      arr[slotIdx] = entry;
    }
    const cp = { ...setup.cp, [tree]: arr };
    const setups = s.setups.map((su, i) => i === s.activeSetupIdx ? { ...su, cp } : su);
    return { setups };
  }),

  setAttr: (key, val) => set((s) => {
    const setup = s.setups[s.activeSetupIdx];
    const cur = setup.attributes;
    const others = (cur.health + cur.magicka + cur.stamina) - cur[key];
    const clamped = Math.max(0, Math.min(val, 64 - others));
    const attributes = { ...cur, [key]: clamped };
    const setups = s.setups.map((su, i) => i === s.activeSetupIdx ? { ...su, attributes } : su);
    return { setups };
  }),

  patchConsumables: (patch) => set((s) => {
    const setup = s.setups[s.activeSetupIdx];
    const consumables = { ...setup.consumables, ...patch };
    const setups = s.setups.map((su, i) => i === s.activeSetupIdx ? { ...su, consumables } : su);
    return { setups };
  }),

  loadState: (meta, setups) => set({
    meta,
    setups,
    activeSetupIdx: 0,
    activeTab: "equipment",
  }),

  reset: () => set({
    meta: defaultMeta(),
    setups: [defaultSetup()],
    activeSetupIdx: 0,
    activeTab: "equipment",
  }),
}));

// ── Dev helper ────────────────────────────────────────────────────────────────
// Expose the store on window in development so preview tools can drive the UI.
// ── URL persistence ───────────────────────────────────────────────────────────
// Write `?b=` 300ms after the last state change (debounced, no history entry).
// Only `meta` and `setups` are encoded — activeTab is ephemeral.
if (typeof window !== "undefined") {
  // Lazy import to avoid pulling lz-string into the SSR bundle.
  import("@/lib/editor-codec").then(({ encodeEditor }) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let prevMeta   = useEditorStore.getState().meta;
    let prevSetups = useEditorStore.getState().setups;

    useEditorStore.subscribe((state) => {
      if (state.meta === prevMeta && state.setups === prevSetups) return;
      prevMeta   = state.meta;
      prevSetups = state.setups;

      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const { meta, setups } = useEditorStore.getState();
        const url = new URL(window.location.href);
        url.searchParams.set("b", encodeEditor(meta, setups));
        window.history.replaceState(window.history.state, "", url);
      }, 300);
    });
  });
}
