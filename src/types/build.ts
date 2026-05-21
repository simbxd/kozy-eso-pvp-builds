// FROZEN SCHEMA v1 — do not edit field shapes. Bumping `v` is the only allowed
// breaking change. Every subsequent milestone reads/writes this exact shape.

export type BuildSchemaV1 = {
  v: 1;
  c: string;                          // base class id
  sl: [string, string, string];       // 3 skill line ids
  r: string;                          // race id
  g: GearPieceV1[];
  b: [BarSetupV1, BarSetupV1];
  cp: SlottedCPV1[];
  a: {
    mundus?: string;
    food?: string;
    attrPoints?: [number, number, number];
    // "Assume conditional set procs active" — turning this on assumes all
    // 5pc procs / stacking bonuses are at max value (best-case stat sheet).
    cb?: boolean;
  };
  bs?: boolean;                       // Battle Spirit toggle (default true)
  bx?: string[];                      // active buff IDs (Major Resolve, Brutality…)
  pa?: string[];                      // disabled passive IDs
  meta?: {
    name?: string;
    mode?: "cyro" | "bg" | "ic" | "duel";
    notes?: string;                   // max 500 chars
  };
};

export type GearSlotId =
  | "head" | "chest" | "shoulders" | "hands" | "waist" | "legs" | "feet"
  | "neck" | "ring1" | "ring2"
  | "mh1" | "oh1" | "mh2" | "oh2";

export type GearPieceV1 = {
  s: GearSlotId;
  id: string;
  t: string;
  e: string;
  q: 0 | 1;
  w?: 0 | 1 | 2;
  wp?: string;
  // Armor weight override. Required for Mixed/Monster sets where the player
  // chooses per-piece weight; for pure Light/Medium/Heavy sets this is
  // redundant with set.type. Omitted = fall back to set.type → weight.
  aw?: "heavy" | "medium" | "light";
};

export type BarSetupV1 = {
  w: string;
  sk: [string, string, string, string, string];
  u: string;
};

export type SlottedCPV1 = {
  tree: "red" | "blue" | "green";
  id: string;
};

export type Build = BuildSchemaV1;
