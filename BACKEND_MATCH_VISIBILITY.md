# Backend: Match Visibility Implementation

## Problem
Currently, all matches are visible to all users in the home page. This is incorrect behavior.

**Expected Behavior:**
- Matches should only be visible to:
  1. The creator of the match
  2. Players invited to the match
  3. All users IF the match is marked as public

## Database Changes Required

### 1. Add columns to `matches` table

```sql
-- Add createdById to track match creator
ALTER TABLE matches ADD COLUMN "createdById" TEXT NOT NULL REFERENCES users(id);

-- Add isPublic flag to control visibility
ALTER TABLE matches ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- Add index for better query performance
CREATE INDEX idx_matches_created_by ON matches("createdById");
CREATE INDEX idx_matches_is_public ON matches("isPublic");
```

### 2. Prisma Schema Update

```prisma
model Match {
  id          String   @id @default(uuid())
  sportId     String
  formatId    String
  status      MatchStatus @default(DRAFT)
  homeTeamId  String?
  awayTeamId  String?
  createdById String
  isPublic    Boolean  @default(false)
  createdAt   DateTime @default(now())
  
  creator     User     @relation("MatchCreator", fields: [createdById], references: [id])
  // ... other relations
}

model User {
  id              String @id @default(uuid())
  // ... other fields
  createdMatches  Match[] @relation("MatchCreator")
  // ... other relations
}
```

## Backend API Changes Required

### 1. POST /matches - Create Match
Update to automatically set `createdById` from authenticated user:

```typescript
async createMatch(req, res) {
  const userId = req.user.id // from auth middleware
  const matchData = {
    ...req.body,
    createdById: userId,
    isPublic: false // default to private
  }
  
  const match = await prisma.match.create({
    data: matchData
  })
  
  res.json(match)
}
```

### 2. GET /matches - List Matches
**CRITICAL:** Update to filter matches based on user access:

```typescript
async getMyMatches(req, res) {
  const userId = req.user.id
  
  try {
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          // Matches created by the user
          { createdById: userId },
          
          // Public matches
          { isPublic: true },
          
          // Matches where user is invited
          {
            matchTeams: {
              some: {
                invites: {
                  some: {
                    OR: [
                      { inviteeUserId: userId },
                      { inviteeEmail: req.user.email }
                    ]
                  }
                }
              }
            }
          },
          
          // Matches where user is on the roster
          {
            matchTeams: {
              some: {
                rosters: {
                  some: { userId: userId }
                }
              }
            }
          }
        ]
      },
      include: {
        matchTeams: {
          include: {
            team: {
              select: {
                id: true,
                name: true,
                logoUrl: true
              }
            },
            _count: {
              select: {
                invites: true,
                rosters: true
              }
            }
          }
        },
        format: true,
        venue: {
          select: {
            id: true,
            name: true,
            city: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: req.query.limit ? parseInt(req.query.limit) : 50
    })
    
    // Transform to match frontend expectations
    const transformedMatches = matches.map(match => ({
      ...match,
      homeTeam: match.matchTeams?.find(mt => mt.side === 'HOME'),
      awayTeam: match.matchTeams?.find(mt => mt.side === 'AWAY')
    }))
    
    res.json(transformedMatches)
  } catch (error) {
    console.error('Error fetching matches:', error)
    res.status(500).json({ 
      error: 'Failed to fetch matches', 
      message: error.message 
    })
  }
}
```

**Alternative Simpler Version** (if above causes issues):
```typescript
async getMyMatches(req, res) {
  const userId = req.user.id
  
  try {
    // Get all matches for now, we'll add filtering incrementally
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { createdById: userId },
          { isPublic: true }
        ]
      },
      include: {
        matchTeams: {
          include: {
            team: true,
            _count: {
              select: {
                invites: true,
                rosters: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: req.query.limit ? parseInt(req.query.limit) : 50
    })
    
    const transformedMatches = matches.map(match => ({
      ...match,
      homeTeam: match.matchTeams?.find(mt => mt.side === 'HOME'),
      awayTeam: match.matchTeams?.find(mt => mt.side === 'AWAY')
    }))
    
    res.json(transformedMatches)
  } catch (error) {
    console.error('Error fetching matches:', error)
    res.status(500).json({ error: error.message })
  }
}
```

### 3. PATCH /matches/:matchId - Update Match
Add support for updating `isPublic`:

```typescript
async updateMatch(req, res) {
  const { matchId } = req.params
  const userId = req.user.id
  const { isPublic, ...otherUpdates } = req.body
  
  // Verify user is the creator
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { createdById: true }
  })
  
  if (!match || match.createdById !== userId) {
    return res.status(403).json({ error: 'Only the match creator can update visibility' })
  }
  
  const updated = await prisma.match.update({
    where: { id: matchId },
    data: {
      isPublic: isPublic !== undefined ? isPublic : undefined,
      ...otherUpdates
    }
  })
  
  res.json(updated)
}
```

### 4. GET /matches/:matchId/summary - Get Match Summary
Add `createdById` and `isPublic` to response:

```typescript
async getMatchSummary(req, res) {
  const { matchId } = req.params
  
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      id: true,
      formatId: true,
      status: true,
      createdById: true,  // ADD THIS
      isPublic: true,     // ADD THIS
      venueId: true,
      scheduledAt: true,
      durationMin: true,
      estimatedPrice: true,
      currency: true,
      bookingId: true,
      // ... other fields
    }
  })
  
  res.json(match)
}
```

## Migration Steps

1. **Run Database Migration:**
   ```bash
   # After updating Prisma schema
   npx prisma migrate dev --name add_match_visibility
   ```

2. **Backfill Existing Data:**
   ```sql
   -- Set a default creator for existing matches (use first user or system user)
   -- You'll need to determine appropriate createdById for existing matches
   UPDATE matches SET "createdById" = (SELECT id FROM users LIMIT 1) WHERE "createdById" IS NULL;
   ```

3. **Update API Endpoints** as described above

4. **Test:**
   - Create a new match as User A → should be private by default
   - User B should NOT see the match
   - Toggle visibility to public → User B should now see it
   - User B invited to match → should see it even if private

## Frontend Already Updated ✅
- Types updated with `isPublic` and `createdById`
- Visibility toggle added to MatchSummaryPage
- API calls configured to send/receive visibility status

## Troubleshooting

### Issue: 500 Error on GET /matches

**Symptoms:** Homepage shows "No tienes partidos creados" even though matches exist, console shows 500 error.

**Causes & Solutions:**

1. **Missing createdById on existing matches:**
   ```sql
   -- Check if matches have createdById
   SELECT id, "createdById" FROM matches WHERE "createdById" IS NULL;
   
   -- If NULL records exist, set them to a valid user
   UPDATE matches 
   SET "createdById" = (SELECT id FROM users LIMIT 1) 
   WHERE "createdById" IS NULL;
   ```

2. **Relation not properly loaded:**
   - Make sure `matchTeams` relation exists in Prisma schema
   - Check that includes are working: `include: { matchTeams: { include: { team: true } } }`

3. **Use simpler query first:**
   ```typescript
   // Start with this minimal version
   const matches = await prisma.match.findMany({
     where: { createdById: userId },
     include: { matchTeams: { include: { team: true } } }
   })
   ```

4. **Check backend logs:**
   - Look for specific Prisma error messages
   - Verify column names match exactly (case-sensitive)
   - Ensure foreign key constraints are satisfied

### Issue: Match creator can't see their matches

**Solution:** Verify that:
1. `createdById` is set when creating matches
2. GET /matches includes `{ createdById: userId }` in the OR clause
3. Backend is using `req.user.id` correctly from auth middleware

### Quick Test Query:
```typescript
// Test in your backend console/REPL
const testUserId = 'your-user-id-here'
const matches = await prisma.match.findMany({
  where: { 
    OR: [
      { createdById: testUserId },
      { isPublic: true }
    ]
  }
})
console.log('Found matches:', matches.length)
```
