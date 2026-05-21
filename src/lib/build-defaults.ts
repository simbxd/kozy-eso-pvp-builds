import type { Build } from "@/types/build";

// The canonical "nothing selected yet" build. Every id field is an empty
// string so the codec round-trips a blank build and validators can treat
// "" as "unset" without special-casing undefined.
export function emptyBuild(): Build {
  return {
    v: 1,
    c: "",
    sl: ["", "", ""],
    r: "",
    g: [],
    b: [
      { w: "", sk: ["", "", "", "", ""], u: "" },
      { w: "", sk: ["", "", "", "", ""], u: "" },
    ],
    cp: [],
    a: {
      attrPoints: [0, 0, 64],
    },
    bs: true,
  };
}
