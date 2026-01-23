// src/features/lineup/layouts/soccerLayouts.ts
// Coordinates are normalized to a 100x140 board (x: 0-100, y: 0-140).
// y=0 is top (opponent goal), y=140 is bottom (your goal).
// Slots count equals onFieldPlayers for each format.

export type RoleCode = "" | "GK" | "DEF" | "MID" | "ATT";

export type FieldSlot = {
  code: string;                 // unique slot id (e.g., "GK", "DEF_L")
  label: string;                // short label
  x: number;                    // 0..100
  y: number;                    // 0..140
  allowedRoles: RoleCode[];     // role compatibility
};

export type FieldLayout = {
  sportCode: "SOCCER";
  formatCode: string;           // matches backend format.code (e.g., "STANDARD_5V5")
  name: string;
  width: number;                // canvas width units (normalized)
  height: number;               // canvas height units (normalized)
  slots: FieldSlot[];
};

const common = {
  W: 100,
  H: 140,
};

// FUTSAL (5): GK + 2 DEF/MID + 2 ATT/MID
export const SOCCER_FUTSAL_5: FieldLayout = {
  sportCode: "SOCCER",
  formatCode: "FUTSAL_5V5",
  name: "Futsal 5v5",
  width: common.W,
  height: common.H,
  slots: [
    { code: "GK", label: "GK", x: 50, y: 124, allowedRoles: ["GK"] },
    { code: "DEF_L", label: "DEF", x: 32, y: 92, allowedRoles: ["DEF", "MID"] },
    { code: "DEF_R", label: "DEF", x: 68, y: 92, allowedRoles: ["DEF", "MID"] },
    { code: "ATT_L", label: "ATT", x: 38, y: 56, allowedRoles: ["ATT", "MID"] },
    { code: "ATT_R", label: "ATT", x: 62, y: 56, allowedRoles: ["ATT", "MID"] },
  ],
};

// STANDARD 5V5 (same geometry as futsal for MVP)
export const SOCCER_STANDARD_5V5: FieldLayout = {
  ...SOCCER_FUTSAL_5,
  formatCode: "STANDARD_5V5",
  name: "Standard 5v5",
};

// 7v7: GK + 3 DEF/MID + 3 MID/ATT
export const SOCCER_STANDARD_7V7: FieldLayout = {
  sportCode: "SOCCER",
  formatCode: "STANDARD_7V7",
  name: "Standard 7v7",
  width: common.W,
  height: common.H,
  slots: [
    { code: "GK", label: "GK", x: 50, y: 126, allowedRoles: ["GK"] },
    { code: "DEF_L", label: "DEF", x: 25, y: 98, allowedRoles: ["DEF", "MID"] },
    { code: "DEF_C", label: "DEF", x: 50, y: 102, allowedRoles: ["DEF", "MID"] },
    { code: "DEF_R", label: "DEF", x: 75, y: 98, allowedRoles: ["DEF", "MID"] },
    { code: "MID_L", label: "MID", x: 30, y: 68, allowedRoles: ["MID", "ATT", "DEF"] },
    { code: "MID_R", label: "MID", x: 70, y: 68, allowedRoles: ["MID", "ATT", "DEF"] },
    { code: "ATT_C", label: "ATT", x: 50, y: 44, allowedRoles: ["ATT", "MID"] },
  ],
};

// 11v11 (simplified 4-3-3 for MVP): GK + 4 DEF + 3 MID + 3 ATT
export const SOCCER_STANDARD_11V11: FieldLayout = {
  sportCode: "SOCCER",
  formatCode: "STANDARD_11V11",
  name: "Standard 11v11",
  width: common.W,
  height: common.H,
  slots: [
    { code: "GK", label: "GK", x: 50, y: 130, allowedRoles: ["GK"] },

    { code: "LB", label: "DEF", x: 18, y: 104, allowedRoles: ["DEF"] },
    { code: "LCB", label: "DEF", x: 38, y: 110, allowedRoles: ["DEF"] },
    { code: "RCB", label: "DEF", x: 62, y: 110, allowedRoles: ["DEF"] },
    { code: "RB", label: "DEF", x: 82, y: 104, allowedRoles: ["DEF"] },

    { code: "LM", label: "MID", x: 30, y: 76, allowedRoles: ["MID", "DEF"] },
    { code: "CM", label: "MID", x: 50, y: 82, allowedRoles: ["MID", "DEF", "ATT"] },
    { code: "RM", label: "MID", x: 70, y: 76, allowedRoles: ["MID", "DEF"] },

    { code: "LW", label: "ATT", x: 24, y: 46, allowedRoles: ["ATT", "MID"] },
    { code: "ST", label: "ATT", x: 50, y: 38, allowedRoles: ["ATT"] },
    { code: "RW", label: "ATT", x: 76, y: 46, allowedRoles: ["ATT", "MID"] },
  ],
};

// Registry to find layout by format.code
export const SOCCER_LAYOUTS_BY_FORMAT: Record<string, FieldLayout> = {
  [SOCCER_FUTSAL_5.formatCode]: SOCCER_FUTSAL_5,
  [SOCCER_STANDARD_5V5.formatCode]: SOCCER_STANDARD_5V5,
  [SOCCER_STANDARD_7V7.formatCode]: SOCCER_STANDARD_7V7,
  [SOCCER_STANDARD_11V11.formatCode]: SOCCER_STANDARD_11V11,
};
