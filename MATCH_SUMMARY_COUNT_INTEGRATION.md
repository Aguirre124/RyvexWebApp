# Match Summary `_count` Integration - Updated Implementation

## Overview
This document describes the production implementation of Match Summary integration that properly uses the `matchTeams[]._count` structure from the backend response to display accurate invitation and roster statistics per team.

## Backend Response Structure

The backend returns match summary with a `matchTeams` array where each team has embedded counts:

```json
{
  "id": "match-uuid",
  "formatId": "format-uuid",
  "status": "DRAFT",
  "matchTeams": [
    {
      "id": "uuid",
      "matchId": "match-uuid",
      "teamId": "team-uuid",
      "side": "HOME",
      "onFieldPlayers": 5,
      "substitutesAllowed": 3,
      "maxSquadSize": 12,
      "team": {
        "id": "team-uuid",
        "name": "Team Name",
        "logoUrl": null
      },
      "_count": {
        "invites": 3,
        "rosters": 2
      }
    },
    {
      "id": "uuid",
      "matchId": "match-uuid",
      "teamId": "team-uuid",
      "side": "AWAY",
      "onFieldPlayers": 5,
      "substitutesAllowed": 3,
      "maxSquadSize": 12,
      "team": {
        "id": "team-uuid",
        "name": "Team Name",
        "logoUrl": null
      },
      "_count": {
        "invites": 5,
        "rosters": 4
      }
    }
  ]
}
```

**Key Fields:**
- `_count.invites` = Total invitations sent to the team
- `_count.rosters` = Total players who have accepted (on the roster)

## Implementation

## Implementation

### 1. Updated TypeScript Types (`src/types/match.types.ts`)

Updated `MatchSummary` type to use `matchTeams` array as primary structure:

```typescript
export type MatchTeamSummary = {
  id: string
  matchId: string
  teamId: string
  side: 'HOME' | 'AWAY'
  onFieldPlayers: number
  substitutesAllowed: number
  maxSquadSize: number
  team: {
    id: string
    name: string
    logoUrl?: string | null
  }
  _count?: {
    invites?: number
    rosters?: number
  }
}

export type MatchSummary = {
  id: string
  formatId: string
  status: MatchStatus
  matchTeams: MatchTeamSummary[]
  // Legacy fields for backward compatibility
  match?: Match
  format?: FormatDetails
  homeTeam?: TeamRoster | null
  awayTeam?: TeamRoster | null
  challenge?: Challenge
}
```

**Key Points:**
- Primary structure is now `matchTeams[]` array
- Each team object contains `_count.invites` and `_count.rosters`
- Legacy fields remain for backward compatibility

### 2. Custom Hook (`src/features/matches/hooks/useMatchSummary.ts`)

```typescript
import { useQuery } from '@tanstack/react-query'
import { matchesApi } from '../../../services/endpoints'
import { useAuthStore } from '../../auth/auth.store'

export const useMatchSummary = (matchId: string | undefined) => {
  const token = useAuthStore((state) => state.token)

  return useQuery({
    queryKey: ['matchSummary', matchId],
    queryFn: () => matchesApi.getSummary(matchId!),
    enabled: !!matchId && !!token,
    refetchOnWindowFocus: true,
    staleTime: 10000, // 10 seconds
  })
}
```

**Benefits:**
- Centralized query configuration
- Automatic refetch on window focus
- Only enabled when matchId and token exist
- 10-second stale time for optimal UX
- Query key: `['matchSummary', matchId]` for precise invalidation

### 3. Updated MatchSummaryPage (`src/features/matches/summary/MatchSummaryPage.tsx`)

#### Extract Teams from matchTeams Array
```typescript
const { data: summary, isLoading, error, refetch } = useMatchSummary(matchId)

// Extract teams from matchTeams array
const homeTeam = summary.matchTeams?.find(t => t.side === 'HOME')
const awayTeam = summary.matchTeams?.find(t => t.side === 'AWAY')

// Extract counts from _count field
const homeInvited = homeTeam?._count?.invites ?? 0
const homeAccepted = homeTeam?._count?.rosters ?? 0
const awayInvited = awayTeam?._count?.invites ?? 0
const awayAccepted = awayTeam?._count?.rosters ?? 0

// Get format info (onFieldPlayers is the minimum required)
const minRequired = homeTeam?.onFieldPlayers ?? summary.format?.onFieldPlayers ?? 5

const homeReady = homeAccepted >= minRequired
const awayReady = awayAccepted >= minRequired
```

#### UI Display
```typescript
{/* HOME Team */}
{homeTeam && (
  <Card>
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{homeTeam.team.name}</h3>
        <Badge variant="info">LOCAL</Badge>
      </div>
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div>
          <div className="text-muted">Invitados</div>
          <div className="font-semibold">{homeInvited}</div>
        </div>
        <div>
          <div className="text-muted">Aceptados</div>
          <div className="font-semibold">{homeAccepted}</div>
        </div>
        <div>
          <div className="text-muted">Mínimo</div>
          <div className="font-semibold">{minRequired}</div>
        </div>
      </div>
      {homeReady ? (
        <Badge variant="success">✓ Listo</Badge>
      ) : (
        <Badge variant="warning">
          Faltan {minRequired - homeAccepted} jugadores
        </Badge>
      )}
    </div>
  </Card>
)}
```

**Extraction Flow:**
1. Find HOME/AWAY teams from `matchTeams` array using `side` field
2. Extract counts directly from `team._count.invites` and `team._count.rosters`
3. Use `??` operator with `0` fallback to prevent NaN
4. Calculate "Faltan X jugadores" using `minRequired - acceptedCount`

### 4. Query Invalidation

All invite actions now invalidate using the consistent query key: `['matchSummary', matchId]`

#### InvitePlayerModal
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['matchSummary', matchId] })
  queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
  queryClient.invalidateQueries({ queryKey: ['notifications', 'list'] })
}
```

#### NotificationCard - Accept Mutation
```typescript
const matchId = response?.matchId ?? notification.data?.matchId
if (matchId) {
  queryClient.invalidateQueries({ queryKey: ['matchSummary', matchId] })
} else {
  queryClient.invalidateQueries({ queryKey: ['matchSummary'] })
}
```

#### NotificationCard - Decline Mutation
```typescript
const matchId = notification.data?.matchId
if (matchId) {
  queryClient.invalidateQueries({ queryKey: ['matchSummary', matchId] })
} else {
  queryClient.invalidateQueries({ queryKey: ['matchSummary'] })
}
```

## Data Flow

```
1. User sends invite
   └─> InvitePlayerModal mutation
       └─> Backend creates invite record
           └─> invalidateQueries(['matchSummary', matchId])
               └─> useMatchSummary refetches
                   └─> Backend returns updated matchTeams[]._ count.invites
                       └─> UI extracts homeTeam._count.invites
                           └─> Displays new "Invitados" count

2. User accepts invite (from notification)
   └─> NotificationCard acceptMutation
       └─> Backend creates roster entry
           └─> invalidateQueries(['matchSummary', matchId])
               └─> useMatchSummary refetches
                   └─> Backend returns updated matchTeams[]._count.rosters
                       └─> UI extracts homeTeam._count.rosters
                           └─> Displays new "Aceptados" count

3. Real-time updates
   └─> User switches tabs → refetchOnWindowFocus triggers
   └─> 10 seconds pass → staleTime expires, next access refetches
```

## Testing Checklist

- [ ] Send invite to registered user → "Invitados" count increases immediately
- [ ] Send invite to email (non-user) → "Invitados" count increases (if backend counts these)
- [ ] Accept invite from notification → "Aceptados" count increases
- [ ] Decline invite from notification → counts remain accurate
- [ ] Navigate away and back → counts persist correctly
- [ ] Multiple invites in quick succession → all counted correctly
- [ ] Both HOME and AWAY teams track separately
- [ ] "Faltan X jugadores" calculates correctly (minRequired - acceptedCount)
- [ ] Team shows "✓ Listo" when acceptedCount >= minRequired
- [ ] Retry button works on error
- [ ] Loading state shows "Cargando resumen..."
- [ ] Error state shows helpful message and retry option

## Common Issues

### Issue: Counts show 0 after sending invite
**Check:**
1. Browser Network tab: verify `/matches/:id/summary` response includes `matchTeams[]._count`
2. Console: check for extraction errors
3. Verify `queryClient.invalidateQueries(['matchSummary', matchId])` is called

### Issue: Counts don't update immediately
**Expected behavior:**
- Mutation triggers invalidation
- Query refetches automatically
- UI updates within ~100-500ms
- If slow, check network latency

### Issue: NaN appears in UI
**Solution:**
- All counts use `?? 0` fallback
- Check: `homeTeam?._count?.invites ?? 0`
- Calculation: `minRequired - homeAccepted` (both guaranteed numbers)

### Issue: TypeScript errors on _count
**Solution:**
- All `_count` fields are optional: `_count?: { invites?: number; rosters?: number }`
- Use optional chaining: `homeTeam?._count?.invites`
- Always provide fallback: `?? 0`

## Query Keys Reference

| Component | Query Key | Purpose |
|-----------|-----------|---------|
| useMatchSummary | `['matchSummary', matchId]` | Fetch match summary with matchTeams[]._count |
| InvitePlayerModal | Invalidates above | After sending invite |
| NotificationCard (accept) | Invalidates above | After accepting invite |
| NotificationCard (decline) | Invalidates above | After declining invite |

**Note:** Changed from `'match-summary'` to `'matchSummary'` for consistency with camelCase convention.

## Backend Response Structure

Expected structure from `GET /api/v1/matches/:id/summary`:

```json
{
  "match": { ... },
  "format": { ... },
  "homeTeam": {
    "id": "uuid",
    "name": "Team Name",
    "minRequired": 5,
    "_count": {
      "invites": 3,
      "rosters": 2
    }
  },
  "awayTeam": {
    "id": "uuid",
    "name": "Team Name",
    "minRequired": 5,
    "_count": {
      "invites": 5,
      "rosters": 4
    }
  }
}
```

Or with matchTeams array:

```json
{
  "match": { ... },
  "format": { ... },
  "matchTeams": [
    {
      "id": "uuid",
      "side": "HOME",
      "team": { "name": "Team Name" },
      "_count": {
        "invites": 3,
        "rosters": 2
      }
    }
  ]
}
```

## Debug Console Logs

The `getTeamStats` function logs extraction details:

```
getTeamStats input: {
  teamData: { id: "...", name: "...", _count: { invites: 3, rosters: 2 } },
  _count: { invites: 3, rosters: 2 },
  extracted: { invitedCount: 3, acceptedCount: 2 }
}
```

Check browser console for these logs to verify correct extraction.

## Common Issues

### Issue: Counts still show 0 after sending invite
**Check:**
1. Browser console for `getTeamStats input` log
2. Backend response includes `_count` field
3. Query invalidation triggered (`['match-summary', matchId]`)

### Issue: Counts don't update in real-time
**Solution:** 
- useMatchSummary has `refetchOnWindowFocus: true`
- Switching tabs and back will refresh
- Or wait 10 seconds (staleTime)

### Issue: TypeScript errors on _count
**Solution:**
- Updated types include `_count?: { invites?: number; rosters?: number }`
- All fields are optional to support different response structures

## Files Modified

1. `src/types/match.types.ts` - Added `_count` to types
2. `src/features/matches/hooks/useMatchSummary.ts` - Created custom hook
3. `src/features/matches/summary/MatchSummaryPage.tsx` - Updated to use _count
4. `src/features/notifications/NotificationCard.tsx` - Fixed query invalidation

## Next Steps

1. Test in production with real backend responses
2. Remove console.logs from `getTeamStats` once confirmed working
3. Consider adding loading states for count updates
4. Add optimistic updates for better UX
