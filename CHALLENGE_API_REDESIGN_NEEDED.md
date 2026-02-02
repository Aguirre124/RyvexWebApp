# Challenge API Redesign Required

## Current Problem

The current API design requires creating a match BEFORE sending a challenge invitation:

```
1. POST /matches (creates match in DRAFT)
2. POST /matches/{matchId}/challenge (sends invitation)
```

**This is wrong!** The error shows:
```
POST /matches
400 Bad Request
"awayTeamId must be a UUID / awayTeamId should not be empty"
```

The match creation fails because we don't have an `awayTeamId` yet - that's the whole point of sending a challenge!

## Correct Flow

A challenge invitation should work like this:

```
1. POST /challenge-invitations (create invitation, NO match yet)
2. Away captain receives notification
3. POST /challenge-invitations/{id}/accept (THEN create match)
```

## Required Backend Changes

### New Endpoint: Create Challenge Invitation

```typescript
POST /api/v1/challenge-invitations

Body: {
  "sportId": "uuid",
  "matchType": "FRIENDLY" | "COMPETITIVE",
  "homeTeamId": "uuid",
  "awayTeamId": "uuid",
  "awayCaptainUserId": "uuid",
  "message": "Optional challenge message",
  "proposedDateTime": "2026-02-15T18:00:00Z" // Optional
}

Response: 201 Created
{
  "challengeId": "uuid",
  "status": "PENDING",
  "sportId": "uuid",
  "matchType": "FRIENDLY",
  "homeTeam": {
    "id": "uuid",
    "name": "Team A",
    "captain": { "id": "uuid", "name": "Captain A" }
  },
  "awayTeam": {
    "id": "uuid",
    "name": "Team B",
    "captain": { "id": "uuid", "name": "Captain B" }
  },
  "message": "Challenge message",
  "createdAt": "2026-02-01T10:00:00Z",
  "expiresAt": "2026-02-08T10:00:00Z"  // 7 days
}
```

### Accept Challenge

```typescript
POST /api/v1/challenge-invitations/{challengeId}/accept

Response: 200 OK
{
  "challengeId": "uuid",
  "status": "ACCEPTED",
  "matchId": "uuid",  // ← NOW the match is created
  "match": {
    "id": "uuid",
    "sportId": "uuid",
    "matchType": "FRIENDLY",
    "flowType": "CHALLENGE",
    "homeTeamId": "uuid",
    "awayTeamId": "uuid",
    "status": "DRAFT",
    "createdAt": "2026-02-01T10:05:00Z"
  }
}
```

### Decline Challenge

```typescript
POST /api/v1/challenge-invitations/{challengeId}/decline

Body: {
  "reason": "Optional decline reason"
}

Response: 200 OK
{
  "challengeId": "uuid",
  "status": "DECLINED",
  "declinedAt": "2026-02-01T10:05:00Z"
}
```

### Get My Challenge Invitations

```typescript
GET /api/v1/challenge-invitations?status=PENDING&type=received

Response: 200 OK
{
  "challenges": [
    {
      "challengeId": "uuid",
      "status": "PENDING",
      "homeTeam": { "id": "uuid", "name": "Team A" },
      "awayTeam": { "id": "uuid", "name": "My Team" },
      "message": "Challenge message",
      "createdAt": "2026-02-01T10:00:00Z",
      "expiresAt": "2026-02-08T10:00:00Z"
    }
  ]
}
```

## Database Schema

### challenges table

```sql
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sport_id UUID NOT NULL REFERENCES sports(id),
  match_type VARCHAR(20) NOT NULL, -- 'FRIENDLY', 'COMPETITIVE'
  
  home_team_id UUID NOT NULL REFERENCES teams(id),
  home_captain_user_id UUID NOT NULL REFERENCES users(id),
  
  away_team_id UUID NOT NULL REFERENCES teams(id),
  away_captain_user_id UUID NOT NULL REFERENCES users(id),
  
  message TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED'
  
  match_id UUID REFERENCES matches(id), -- NULL until accepted
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL, -- Default: created_at + 7 days
  responded_at TIMESTAMP,
  decline_reason TEXT,
  
  CONSTRAINT check_status CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED'))
);

CREATE INDEX idx_challenges_away_captain ON challenges(away_captain_user_id, status);
CREATE INDEX idx_challenges_home_team ON challenges(home_team_id, status);
CREATE INDEX idx_challenges_expires_at ON challenges(expires_at) WHERE status = 'PENDING';
```

## Business Logic

### Creating a Challenge

1. **Validate teams are different**
   ```typescript
   if (homeTeamId === awayTeamId) {
     throw new BadRequestException('Cannot challenge your own team');
   }
   ```

2. **Check away team visibility**
   ```typescript
   const awayTeam = await teamsRepo.findById(awayTeamId);
   if (awayTeam.visibility !== 'DISCOVERABLE' && awayTeam.visibility !== 'PUBLIC') {
     throw new ForbiddenException('Team is not available for challenges');
   }
   ```

3. **Verify captain permissions**
   ```typescript
   const homeTeam = await teamsRepo.findById(homeTeamId);
   if (homeTeam.captainId !== userId) {
     throw new ForbiddenException('Only team captain can send challenges');
   }
   ```

4. **Check for duplicate challenges**
   ```typescript
   const existing = await challengesRepo.findPending({
     homeTeamId,
     awayTeamId
   });
   if (existing) {
     throw new ConflictException('Challenge already sent to this team');
   }
   ```

5. **Create challenge record**
   ```typescript
   const challenge = await challengesRepo.create({
     ...data,
     status: 'PENDING',
     expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
   });
   ```

6. **Send notification to away captain**
   ```typescript
   await notificationsService.send({
     userId: awayCaptainUserId,
     type: 'CHALLENGE_RECEIVED',
     title: `${homeTeam.name} te ha retado!`,
     body: challenge.message || 'Han enviado un desafío a tu equipo',
     data: { challengeId: challenge.id }
   });
   ```

### Accepting a Challenge

1. **Verify recipient**
   ```typescript
   const challenge = await challengesRepo.findById(challengeId);
   if (challenge.awayCaptainUserId !== userId) {
     throw new ForbiddenException('Only the challenged captain can accept');
   }
   ```

2. **Check status**
   ```typescript
   if (challenge.status !== 'PENDING') {
     throw new BadRequestException('Challenge is no longer pending');
   }
   if (new Date() > challenge.expiresAt) {
     challenge.status = 'EXPIRED';
     await challengesRepo.update(challenge);
     throw new BadRequestException('Challenge has expired');
   }
   ```

3. **Create the match**
   ```typescript
   const match = await matchesRepo.create({
     sportId: challenge.sportId,
     matchType: challenge.matchType,
     flowType: 'CHALLENGE',
     homeTeamId: challenge.homeTeamId,
     awayTeamId: challenge.awayTeamId,
     status: 'DRAFT',
     createdById: challenge.homeCaptainUserId
   });
   ```

4. **Update challenge**
   ```typescript
   challenge.status = 'ACCEPTED';
   challenge.matchId = match.id;
   challenge.respondedAt = new Date();
   await challengesRepo.update(challenge);
   ```

5. **Notify home captain**
   ```typescript
   await notificationsService.send({
     userId: challenge.homeCaptainUserId,
     type: 'CHALLENGE_ACCEPTED',
     title: '¡Tu desafío fue aceptado!',
     body: `${awayTeam.name} aceptó tu desafío`,
     data: { matchId: match.id }
   });
   ```

### Declining a Challenge

1. **Verify recipient**
2. **Check status**
3. **Update challenge**
   ```typescript
   challenge.status = 'DECLINED';
   challenge.respondedAt = new Date();
   challenge.declineReason = reason;
   await challengesRepo.update(challenge);
   ```
4. **Notify home captain**

### Auto-expire Challenges

Run a cron job daily:

```typescript
@Cron('0 0 * * *') // Every day at midnight
async expireChallenges() {
  await challengesRepo.updateMany(
    { status: 'PENDING', expiresAt: { $lt: new Date() } },
    { status: 'EXPIRED' }
  );
}
```

## Frontend Changes Needed

### 1. Update API Client

```typescript
// src/services/challenges.api.ts
export const challengesApi = {
  // Send challenge invitation (NO match creation)
  createChallengeInvitation: async (payload: {
    sportId: string
    matchType: 'FRIENDLY' | 'COMPETITIVE'
    homeTeamId: string
    awayTeamId: string
    awayCaptainUserId: string
    message?: string
  }) => {
    const response = await apiClient.post('/challenge-invitations', payload)
    return response.data
  },

  // Accept challenge (creates match)
  acceptChallenge: async (challengeId: string) => {
    const response = await apiClient.post(`/challenge-invitations/${challengeId}/accept`)
    return response.data // Returns { challengeId, matchId, match }
  },

  // Decline challenge
  declineChallenge: async (challengeId: string, reason?: string) => {
    const response = await apiClient.post(`/challenge-invitations/${challengeId}/decline`, { reason })
    return response.data
  },

  // Get received challenges
  getReceivedChallenges: async (status: 'PENDING' | 'ACCEPTED' | 'DECLINED' = 'PENDING') => {
    const response = await apiClient.get('/challenge-invitations', {
      params: { status, type: 'received' }
    })
    return response.data.challenges
  },

  // Get sent challenges
  getSentChallenges: async (status?: string) => {
    const response = await apiClient.get('/challenge-invitations', {
      params: { status, type: 'sent' }
    })
    return response.data.challenges
  }
}
```

### 2. Update Challenge Flow

```typescript
// ChallengeSearchStep.tsx - SIMPLIFIED
const handleSendChallenge = async () => {
  if (!selectedTeam || isCreating) return

  setIsCreating(true)
  setSendError(null)

  try {
    const teamId = (selectedTeam as any).id || selectedTeam.teamId
    const captainId = selectedTeam.captain?.id

    if (!teamId || !captainId) {
      setSendError('Error: Datos del equipo incompletos')
      return
    }

    // NO MATCH CREATION - just send invitation
    await challengesApi.createChallengeInvitation({
      sportId: selectedSport!.id,
      matchType: 'FRIENDLY',
      homeTeamId: homeTeam!.id,
      awayTeamId: teamId,
      awayCaptainUserId: captainId,
      message: message.trim() || undefined
    })

    // Update store
    setAwayTeam({ id: teamId, name: selectedTeam.name })
    setAwayCaptain(captainId)
    setChallengeStatus('PENDING')
    setChallengeMessage(message)

    setShowSuccess(true)
  } catch (error: any) {
    setSendError(error.response?.data?.message || 'Error al enviar el desafío')
  } finally {
    setIsCreating(false)
  }
}
```

## Benefits of This Approach

✅ **Clean separation**: Challenge invitations are separate from matches
✅ **No orphaned matches**: Match only created when both teams agree
✅ **Better UX**: Clear pending/accepted/declined states
✅ **Notifications**: Proper notification flow for both captains
✅ **Expiration**: Challenges auto-expire after 7 days
✅ **History**: Track all challenges sent/received
✅ **Scalability**: Can add features like counter-proposals, scheduling, etc.

## Migration Path

1. **Create new challenges table and API endpoints**
2. **Keep old `/matches/{matchId}/challenge` for backward compatibility**
3. **Frontend uses new API**
4. **Deprecate old endpoint after migration**

## Priority: CRITICAL

This is blocking the entire Challenge flow. The current API design is fundamentally wrong for the challenge use case.
