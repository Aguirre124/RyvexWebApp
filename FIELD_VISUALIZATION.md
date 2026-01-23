# Field Visualization Feature

## Overview
The field visualization feature displays a mini soccer field with player positions on the Match Summary page. Players are automatically assigned to field positions based on their suggested roles (GK, DEF, MID, ATT).

## Architecture

### 1. Field Layouts (`src/features/lineup/layouts/soccerLayouts.ts`)
Defines field slot positions for different soccer formats:
- **FUTSAL_5V5**: 5 players (1 GK, 2 DEF, 2 ATT)
- **STANDARD_5V5**: 5 players (1 GK, 2 DEF, 2 ATT)
- **STANDARD_7V7**: 7 players (1 GK, 3 DEF, 2 MID, 1 ATT)
- **STANDARD_11V11**: 11 players in 4-3-3 formation

Each layout uses normalized coordinates (100 width × 140 height):
- **y=0**: Opponent goal (top)
- **y=140**: Own goal (bottom)

Each slot has:
- `code`: Unique identifier (e.g., "GK", "DEF_L", "MID_C")
- `label`: Display label (e.g., "POR", "DF")
- `x, y`: Position coordinates
- `allowedRoles`: Array of compatible roles (e.g., ["GK"] for goalkeeper)

### 2. Auto-Assignment Algorithm (`src/features/lineup/utils/autoAssignLineup.ts`)
Assigns accepted players to field slots:

```typescript
function autoAssignLineup(layout: FieldLayout, acceptedPlayers: AcceptedPlayer[]): {
  starters: SlotAssignment[]
  bench: AcceptedPlayer[]
  unassigned: AcceptedPlayer[]
}
```

**Algorithm Steps:**
1. Normalize role codes to uppercase (GK/DEF/MID/ATT)
2. Bucket players by role
3. For each slot, pick a compatible player:
   - Match by suggestedRoleCode
   - Fallback to any unassigned player
4. Remaining players go to bench
5. Return starters, bench, and unassigned arrays

**Example:**
```typescript
const players = [
  { userId: '1', name: 'Juan Pérez', suggestedRoleCode: 'GK' },
  { userId: '2', name: 'Luis García', suggestedRoleCode: 'DEF' },
  { userId: '3', name: 'Carlos López', suggestedRoleCode: 'ATT' }
]

const result = autoAssignLineup(SOCCER_STANDARD_5V5, players)
// result.starters: 3 assigned slots (GK, DEF, ATT)
// result.bench: Empty (all players fit)
// result.unassigned: Empty
```

### 3. FieldMini Component (`src/features/lineup/components/FieldMini.tsx`)
Renders the mini field with player positions:

**Props:**
```typescript
{
  layout: FieldLayout          // Field layout definition
  starters: SlotAssignment[]   // Assigned players to slots
  title?: string               // Optional section title
  bench?: AcceptedPlayer[]     // Players on bench
  showBench?: boolean          // Show bench section (default: true)
}
```

**Visual Elements:**
- **Field background**: Green gradient with field markings (border, midfield line, center circle, goal boxes)
- **Player slots**: 
  - Filled: Circular avatar with initials, player name below
  - Empty: Dashed circle with position label
- **Bench section**: Chips showing player name and role

**Styling:**
- Fixed aspect ratio container (preserves 100:140 ratio)
- Absolute positioned slots using percentage coordinates
- Dark theme compatible (#0b1220, #1f2937)
- Primary color for filled slots

### 4. Match Summary Integration
Updated `MatchSummaryPage.tsx` to display field visualization:

**Data Flow:**
1. Get format code from match summary
2. Load layout: `SOCCER_LAYOUTS_BY_FORMAT[formatCode]`
3. Extract accepted players from `matchTeam.rosters[]`:
   ```typescript
   {
     userId: string
     name: string
     avatarUrl?: string
     suggestedRoleCode?: string
   }
   ```
4. Call `autoAssignLineup(layout, players)`
5. Render `FieldMini` component with starters and bench

**Display Conditions:**
- Field only shows if `acceptedCount > 0`
- Both HOME and AWAY teams have their own field visualization
- Fields appear below team stats in their respective cards

## Usage

### In Match Summary Page
```tsx
import FieldMini from '../../lineup/components/FieldMini'
import { SOCCER_LAYOUTS_BY_FORMAT } from '../../lineup/layouts/soccerLayouts'
import { autoAssignLineup } from '../../lineup/utils/autoAssignLineup'

const formatCode = summary.format?.code || 'STANDARD_5V5'
const layout = SOCCER_LAYOUTS_BY_FORMAT[formatCode]

const players = homeTeam.rosters?.map(r => ({
  userId: r.userId,
  name: r.user?.name ?? 'Jugador',
  avatarUrl: r.user?.avatarUrl,
  suggestedRoleCode: r.suggestedRoleCode
})) ?? []

const { starters, bench } = autoAssignLineup(layout, players)

<FieldMini
  layout={layout}
  starters={starters}
  bench={bench}
  showBench={true}
/>
```

## Backend Requirements

The backend should return `rosters` array in the match summary response:

```json
{
  "matchTeams": [
    {
      "id": "...",
      "side": "HOME",
      "team": { "name": "Team A" },
      "_count": {
        "invites": 5,
        "rosters": 3
      },
      "rosters": [
        {
          "userId": "user-1",
          "suggestedRoleCode": "GK",
          "user": {
            "name": "Juan Pérez",
            "avatarUrl": "https://..."
          }
        }
      ]
    }
  ]
}
```

## Future Enhancements
- [ ] Click on slot to edit player assignment
- [ ] Drag & drop players between positions
- [ ] Formation selector (4-3-3, 4-4-2, etc.)
- [ ] Visual indicators for player fitness/rating
- [ ] Support for other sports (basketball, volleyball)
- [ ] Export lineup as image
- [ ] Tactical notes/annotations on field

## Related Files
- `src/features/lineup/layouts/soccerLayouts.ts`
- `src/features/lineup/utils/autoAssignLineup.ts`
- `src/features/lineup/components/FieldMini.tsx`
- `src/features/matches/summary/MatchSummaryPage.tsx`
- `src/types/match.types.ts`
- `src/utils/roles.ts`
- `PLAYER_ROLE_ASSIGNMENT.md`
