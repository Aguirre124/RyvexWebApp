# RYVEX - New Match Creation Flow Implementation

## Overview
Implemented new pre-flow steps (A, B, C, D) before creating a friendly match, integrating with the backend API.

## What Changed

### 🆕 New Flow
**OLD**: Click "Crear Partido" → Format Selection → Create Match

**NEW**: Click "Crear Partido" → Sport Selection → Home Team → Away Team → Format Selection → Create FRIENDLY Match

### API Integration
- **Base URL**: `https://lated-regardlessly-harland.ngrok-free.dev/api/v1`
- **Match Type**: FRIENDLY (tournament fields are null/omitted)

## Files Created

### State Management
- **`src/store/matchDraft.store.ts`**: New Zustand store with persistence for:
  - selectedSport: { id, name }
  - homeTeam: { id, name }
  - awayTeam: { id, name }
  - format: 'FUTSAL' | 'F5' | 'F7' | 'F11'

### New Steps
- **`src/features/matches/create/StepASportSelection.tsx`**: Sport selection with grid cards
- **`src/features/matches/create/StepBHomeTeamSelection.tsx`**: Home team search/selection
- **`src/features/matches/create/StepCAwayTeamSelection.tsx`**: Away team selection with validation
- **`src/features/matches/create/StepDFormatSelection.tsx`**: Format selection + match creation
- **`src/features/matches/create/MatchCreateLayout.tsx`**: Layout wrapper for create flow
- **`src/features/teams/TeamCreatePage.tsx`**: Team creation form

### Utilities
- **`src/hooks/useDebounce.ts`**: Debounce hook for search (350ms delay)

## API Endpoints Used

### Step A: Sports
```
GET /api/v1/sports
Response: [{ id, name }]
```

### Step B & C: Teams
```
GET /api/v1/teams?sportId=<id>&scope=mine&q=<search>
Response: [{ id, name, ... }]
```

### Team Creation
```
POST /api/v1/teams
Body: {
  name: string,
  sportId: string,
  captainId: string (from auth user),
  description?: string,
  logoUrl?: string
}
```

### Match Creation (Final Step)
```
POST /api/v1/matches
Body: {
  sportId: string,
  matchType: "FRIENDLY",
  homeTeamId: string,
  awayTeamId: string,
  tournamentId: null,
  venueId: null,
  scheduledAt: null,
  durationMin: null
}
```

## Routes Added

```
/matches/create              → Step A: Sport Selection
/matches/create/home-team    → Step B: Home Team Selection
/matches/create/away-team    → Step C: Away Team Selection
/matches/create/format       → Step D: Format Selection + Create Match
/teams/create?role=home|away → Team Creation Form
```

## Key Features

### ✅ Sport Selection (Step A)
- Grid display of available sports
- Loading skeleton
- Empty state handling
- Error handling with retry

### ✅ Home Team Selection (Step B)
- Search with debounce (350ms)
- Filter by `scope=mine` and `sportId`
- Empty state with "Create Team" CTA
- Card selection UI

### ✅ Team Creation
- Form validation (name min 2 chars, description max 120)
- Auto-sets captainId from logged-in user
- Returns to appropriate step after creation
- Automatically selects created team

### ✅ Away Team Selection (Step C)
- Same as home team
- **Validation**: Prevents selecting same team as HOME
- Shows selected HOME team as reference
- Disables HOME team in list

### ✅ Format Selection (Step D)
- Shows summary: Sport, HOME team, AWAY team
- Format cards: FUTSAL, F5, F7, F11
- Creates FRIENDLY match with all required fields
- Success message and navigation to /home
- Resets draft after creation

## Validations

1. **Sport**: Must be selected before continuing
2. **Home Team**: Required, must exist or be created
3. **Away Team**: Required, cannot be same as HOME team
4. **Format**: Must be selected before creating match
5. **Captain ID**: Auto-filled from auth user (not hardcoded)

## State Persistence

The `matchDraft` store persists to localStorage:
- User can refresh browser and continue from where they left off
- Draft is reset after successful match creation
- Guards prevent accessing steps without completing previous ones

## Error Handling

- API errors shown inline with red banners
- Loading states for all async operations
- Empty states with clear CTAs
- Validation errors prevent bad submissions

## Navigation Flow

```
HomePage
  ↓ Click "Crear Partido"
/matches/create (Sport Selection)
  ↓ Select Sport
/matches/create/home-team
  ↓ Select or Create Team
/matches/create/away-team
  ↓ Select or Create Different Team
/matches/create/format
  ↓ Select Format & Create Match
/home (Success + Draft Reset)
```

## Environment Variables

```env
VITE_API_URL=https://lated-regardlessly-harland.ngrok-free.dev/api/v1
```

## Build Status
✅ **Build successful** - All TypeScript errors resolved

## Testing Checklist

- [x] Sport selection with empty/error states
- [x] Team search with debounce
- [x] Team creation form validation
- [x] HOME team selection and creation
- [x] AWAY team selection with same-team validation
- [x] Format selection
- [x] FRIENDLY match creation with correct payload
- [x] State persistence across refreshes
- [x] Navigation guards
- [x] Back button functionality
- [x] Success flow to /home

## Notes

- Old wizard flow (`/matches/new`) is still accessible but not used in main flow
- Format options are hardcoded (FUTSAL, F5, F7, F11) as per requirements
- Match type is always "FRIENDLY" for MVP
- Tournament, venue, schedule fields are null/omitted as per MVP spec
- Captain ID automatically retrieved from auth store (logged-in user)

---

**Implementation Complete** ✅

All requirements implemented, tested, and building successfully.
