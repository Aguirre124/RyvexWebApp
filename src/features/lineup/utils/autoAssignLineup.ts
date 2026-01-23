// src/features/lineup/utils/autoAssignLineup.ts
import type { FieldLayout, RoleCode, FieldSlot } from "../layouts/soccerLayouts";

export type AcceptedPlayer = {
  userId: string;
  name: string;
  avatarUrl?: string | null;
  suggestedRoleCode?: RoleCode | string | null; // from backend invite/roster (GK/DEF/MID/ATT or empty)
};

export type SlotAssignment = {
  slot: FieldSlot;
  player?: AcceptedPlayer; // undefined when empty slot
};

export type AutoAssignResult = {
  starters: SlotAssignment[];      // one per slot (filled or empty)
  bench: AcceptedPlayer[];         // overflow accepted players
  unassigned: AcceptedPlayer[];    // accepted but not placed due to rules (rare for MVP)
};

// Normalize role to RoleCode union
function normalizeRole(role: any): RoleCode {
  const v = (role ?? "").toString().trim().toUpperCase();
  if (v === "GK" || v === "DEF" || v === "MID" || v === "ATT") return v;
  return "";
}

/**
 * MVP auto-assign:
 * - Fill each field slot with a compatible accepted player based on suggestedRoleCode.
 * - If none compatible, use a player with no role ("").
 * - Remaining accepted players go to bench (up to substitutesAllowed if you want to cap in UI).
 */
export function autoAssignLineup(
  layout: FieldLayout,
  acceptedPlayers: AcceptedPlayer[],
): AutoAssignResult {
  const remaining = [...acceptedPlayers];

  // bucket by role
  const buckets: Record<RoleCode, AcceptedPlayer[]> = { "": [], GK: [], DEF: [], MID: [], ATT: [] };
  for (const p of remaining) {
    const r = normalizeRole(p.suggestedRoleCode);
    buckets[r].push({ ...p, suggestedRoleCode: r });
  }

  // helper: pick player matching allowed roles first, then no-role
  const pickForSlot = (slot: FieldSlot): AcceptedPlayer | undefined => {
    for (const role of slot.allowedRoles) {
      const list = buckets[role];
      if (list && list.length) return list.shift();
    }
    // fallback to no preference
    if (buckets[""].length) return buckets[""].shift();
    return undefined;
  };

  const starters: SlotAssignment[] = layout.slots.map((slot) => ({
    slot,
    player: pickForSlot(slot),
  }));

  // collect leftover players from all buckets (bench)
  const bench: AcceptedPlayer[] = [
    ...buckets.GK,
    ...buckets.DEF,
    ...buckets.MID,
    ...buckets.ATT,
    ...buckets[""],
  ];

  return {
    starters,
    bench,
    unassigned: [], // reserved for future constraints
  };
}
