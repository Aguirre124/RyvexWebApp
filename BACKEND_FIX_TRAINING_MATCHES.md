# Backend Fix Required: Training Match Creation - URGENT

## Current Error
```
"home team and away team must be different"
statusCode: 400
```

**This validation MUST be removed or updated for TRAINING matches!**

## Issue
The backend is rejecting TRAINING match creation because it has a validation that requires homeTeamId !== awayTeamId. However, **for TRAINING matches, both teams MUST be the same.**

## Why Home and Away Are the Same for Training

In a TRAINING match:
- It's the **same team** practicing internally
- The team is **divided into two sides**: Side A (HOME) vs Side B (AWAY)
- Both sides use the **same base team** but with different labels ("A" and "B")
- The organizer manages both sides and invites players to each side

**This is the CORE FEATURE of training matches** - one team playing against itself for practice.

## Frontend Request (CORRECT)
```json
POST /api/v1/matches
{
  "sportId": "cm5blgkv70002upqaxabvb2ip",
  "matchType": "FRIENDLY",
  "flowType": "TRAINING",
  "homeTeamId": "cm5blshws0001140eocwsfjdw",  // ← Same team
  "awayTeamId": "cm5blshws0001140eocwsfjdw"   // ← Same team (INTENTIONAL)
}
```

**Current Backend Response (WRONG):**
```json
{
  "message": "home team and away team must be different",
  "error": "Bad Request",
  "statusCode": 400
}
```

## Root Cause
1. ❌ **Backend has a validation that prevents homeTeamId === awayTeamId**
2. ✅ **For TRAINING matches, homeTeamId MUST equal awayTeamId**
3. The backend needs to **exempt TRAINING from this validation**
4. Database constraints may also need updating (see below)

## Required Backend Fixes

### 🚨 CRITICAL: Update Validation Logic

**File:** `src/matches/matches.dto.ts` or validation layer

**REMOVE or UPDATE this validation:**
```typescript
// ❌ WRONG - This breaks TRAINING matches
if (homeTeamId === awayTeamId) {
  throw new BadRequestException('home team and away team must be different');
}
```

**REPLACE WITH:**
```typescript
// ✅ CORRECT - Allow same team for TRAINING
if (homeTeamId === awayTeamId && flowType !== 'TRAINING') {
  throw new BadRequestException('home team and away team must be different');
}

// OR even better:
if (flowType === 'TRAINING') {
  // For TRAINING, teams MUST be the same
  if (homeTeamId !== awayTeamId) {
    throw new BadRequestException('Training matches must use the same team for home and away');
  }
} else if (flowType === 'CHALLENGE') {
  // For CHALLENGE, teams MUST be different
  if (homeTeamId === awayTeamId) {
    throw new BadRequestException('Challenge matches must use different teams');
  }
}
```

### 2. Update Match Creation Service
**File:** `src/matches/matches.service.ts` (or similar)

The backend MUST handle the TRAINING flow differently:

```typescript
async createMatch(createMatchDto: CreateMatchDto) {
  const { sportId, matchType, flowType, homeTeamId, awayTeamId } = createMatchDto;

  // Validate based on flowType
  if (flowType === 'TRAINING') {
    // ✅ For TRAINING matches, both teams MUST be the same
    if (homeTeamId !== awayTeamId) {
      throw new BadRequestException('Training matches must use the same team for home and away');
    }
    
    // Create match with special handling for training
    const match = await this.matchesRepository.create({
      sportId,
      matchType,
      flowType: 'TRAINING',
      homeTeamId,
      awayTeamId,  // Same as homeTeamId
      status: 'DRAFT'
    });

    // Create matchTeams with labels A and B
    await this.matchTeamsRepository.createMany([
      {
        matchId: match.id,
        teamId: homeTeamId,
        side: 'HOME',
        label: 'A',  // Training label for side A
        // ... other fields from format
      },
      {
        matchId: match.id,
        teamId: awayTeamId, // Same team ID
        side: 'AWAY',
        label: 'B',  // Training label for side B
        // ... other fields from format
      }
    ]);

    return match;
  }

  if (flowType === 'CHALLENGE') {
    // ✅ For CHALLENGE matches, teams MUST be different
    if (homeTeamId === awayTeamId) {
      throw new BadRequestException('Challenge matches must use different teams');
    }
    // Regular challenge creation logic...
  }

  // Regular CHALLENGE flow logic here...
}
```

### 3. Database Schema Validation
Ensure the database allows:
- ✅ Same teamId for both HOME and AWAY sides (when flowType = TRAINING)
- ✅ `flowType` enum includes 'TRAINING' and 'CHALLENGE'
- ✅ `matchTeams` table has a `label` column (varchar, nullable)
- ✅ Remove or update any CHECK constraints that prevent homeTeamId = awayTeamId

### 4. Match Teams Creation Logic
Update the match teams creation to:

```typescript
// For TRAINING matches
if (flowType === 'TRAINING') {
  // Both matchTeams use the same base team but with different labels
  const homeMatchTeam = {
    matchId,
    teamId: homeTeamId,
    side: 'HOME',
    label: 'A',
    onFieldPlayers: formatDetails.onFieldPlayers,
    substitutesAllowed: formatDetails.substitutesAllowed,
    maxSquadSize: formatDetails.maxSquadSize
  };

  const awayMatchTeam = {
    matchId,
    teamId: awayTeamId, // Same as homeTeamId
    side: 'AWAY',
    label: 'B',
    onFieldPlayers: formatDetails.onFieldPlayers,
    substitutesAllowed: formatDetails.substitutesAllowed,
    maxSquadSize: formatDetails.maxSquadSize
  };

  await this.matchTeamsRepository.createMany([homeMatchTeam, awayMatchTeam]);
}
```

### 4. Unique Constraints
Check if there's a unique constraint on `(matchId, teamId)` in the `matchTeams` table.

**If YES:**
- Change the unique constraint to `(matchId, teamId, side)` or remove it entirely
- The side (HOME/AWAY) differentiates the two entries

**Database Migration:**
```sql
-- Remove old constraint
ALTER TABLE match_teams DROP CONSTRAINT IF EXISTS unique_match_team;

-- Add new constraint allowing same team on different sides
ALTER TABLE match_teams 
ADD CONSTRAINT unique_match_team_side 
UNIQUE (match_id, team_id, side);
```

### 5. Permissions Logic
Ensure permissions return correct values for TRAINING:

```typescript
getMatchPermissions(match, userId) {
  if (match.flowType === 'TRAINING') {
    // For training, the creator (who is the captain) can invite to both sides
    const isCreator = match.createdById === userId;
    return {
      canInviteHome: isCreator,
      canInviteAway: isCreator
    };
  }
  
  // CHALLENGE logic...
}
```

## Testing the Fix

### 1. Create a Training Match
```bash
curl -X POST http://localhost:3000/api/v1/matches \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "sportId": "valid-sport-uuid",
    "matchType": "FRIENDLY",
    "flowType": "TRAINING",
    "homeTeamId": "valid-team-uuid",
    "awayTeamId": "valid-team-uuid"
  }'
```

### 2. Expected Response
```json
{
  "matchId": "uuid",
  "status": "DRAFT",
  "flowType": "TRAINING",
  "homeTeamId": "uuid",
  "awayTeamId": "uuid",
  "matchTeams": [
    {
      "teamId": "uuid",
      "side": "HOME",
      "label": "A",
      "team": { "name": "Team Name" }
    },
    {
      "teamId": "uuid",
      "side": "AWAY",
      "label": "B",
      "team": { "name": "Team Name" }
    }
  ]
}
```

### 3. Verify Match Summary
```bash
curl http://localhost:3000/api/v1/matches/{matchId}/summary \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Should return:
- ✅ `flowType: "TRAINING"`
- ✅ Both matchTeams with labels "A" and "B"
- ✅ Same team for both sides
- ✅ `permissions.canInviteHome: true` and `permissions.canInviteAway: true` (for creator)

## Summary of Changes Needed

1. ✅ **Add TRAINING flow logic** in match creation service
2. ✅ **Handle same team for HOME/AWAY** without errors
3. ✅ **Add labels "A" and "B"** to matchTeams for training
4. ✅ **Update database constraints** to allow same team on different sides
5. ✅ **Fix permissions logic** to allow creator to invite to both sides
6. ✅ **Add proper error handling** with descriptive messages

## Priority: HIGH
This blocks the entire Training match feature from working.

---

**Frontend is ready and waiting for backend fix.**
