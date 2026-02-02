# Backend Fix Required: Challenge Flow Type Issue

## Current Error (NEW)
```
POST /api/v1/matches/{matchId}/challenge
Status: 400 Bad Request
Message: "Match must have CHALLENGE flow type"
```

**Issue:** The match is being created but the `flowType` field is not being saved as 'CHALLENGE'.

## Root Cause
The backend is receiving `flowType: "CHALLENGE"` in the match creation request, but it's either:
1. Not accepting the `flowType` field in the DTO
2. Not saving it to the database
3. Defaulting to 'STANDARD' or null

## Frontend Request (CORRECT)
```json
POST /api/v1/matches
Body: {
  "sportId": "10399dae-7bcc-43df-a975-2c2c3e0666Sb",
  "matchType": "FRIENDLY",
  "flowType": "CHALLENGE",  ← Frontend IS sending this
  "homeTeamId": "42e03z1b-019c-4a55-81e9-123f9e9cba58"
}
```

## Required Backend Fixes

### Fix 1: Accept flowType in Match DTO

**File:** `src/matches/dto/create-match.dto.ts`

```typescript
import { IsEnum, IsUUID, IsOptional } from 'class-validator';

export enum FlowType {
  TRAINING = 'TRAINING',
  CHALLENGE = 'CHALLENGE',
  STANDARD = 'STANDARD'  // Legacy/default
}

export class CreateMatchDto {
  @IsUUID()
  sportId: string;

  @IsEnum(['FRIENDLY', 'COMPETITIVE'])
  matchType: string;

  @IsEnum(FlowType)  // ← ADD THIS
  @IsOptional()      // ← Optional for backward compatibility
  flowType?: FlowType;

  @IsUUID()
  homeTeamId: string;

  @IsUUID()
  @IsOptional()
  awayTeamId?: string;
}
```

### Fix 2: Save flowType to Database

**File:** `src/matches/matches.service.ts`

```typescript
async createMatch(createMatchDto: CreateMatchDto, userId: string) {
  const match = await this.matchRepository.create({
    sportId: createMatchDto.sportId,
    matchType: createMatchDto.matchType,
    flowType: createMatchDto.flowType || 'STANDARD',  // ← SAVE flowType
    homeTeamId: createMatchDto.homeTeamId,
    awayTeamId: createMatchDto.awayTeamId,
    createdById: userId,
    status: 'DRAFT'
  });
  
  console.log('Match created with flowType:', match.flowType);  // Debug
  
  return match;
}
```

### Fix 3: Validate flowType in Challenge Creation

**File:** `src/matches/matches.service.ts` or `src/challenges/challenges.service.ts`

```typescript
async createChallenge(
  matchId: string,
  createChallengeDto: CreateChallengeDto,
  userId: string
) {
  const match = await this.matchRepository.findById(matchId);
  
  if (!match) {
    throw new NotFoundException('Match not found');
  }
  
  // Check authorization
  if (match.createdById !== userId) {
    throw new ForbiddenException('Only match creator can create challenges');
  }
  
  // Check flow type
  if (match.flowType !== 'CHALLENGE') {
    console.log('Invalid flowType:', {  // Debug
      matchId: match.id,
      actualFlowType: match.flowType,
      expectedFlowType: 'CHALLENGE'
    });
    throw new BadRequestException('Match must have CHALLENGE flow type');
  }
  
  // Create the challenge...
}
```

### Fix 4: Database Schema

Ensure the `matches` table has `flowType` column:

```sql
-- Check if column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'matches' AND column_name = 'flowType';

-- If missing, add it
ALTER TABLE matches 
ADD COLUMN "flowType" VARCHAR(20) DEFAULT 'STANDARD';

-- Create enum type (PostgreSQL)
CREATE TYPE flow_type AS ENUM ('TRAINING', 'CHALLENGE', 'STANDARD');

ALTER TABLE matches 
ALTER COLUMN "flowType" TYPE flow_type USING "flowType"::flow_type;
```

## Testing

1. **Create match with flowType logging:**
```typescript
console.log('Received DTO:', createMatchDto);
console.log('flowType from DTO:', createMatchDto.flowType);

const match = await this.matchRepository.create({
  ...data,
  flowType: createMatchDto.flowType
});

console.log('Created match:', match);
console.log('Saved flowType:', match.flowType);
```

2. **Verify in database:**
```sql
SELECT id, "flowType", "createdById", "homeTeamId" 
FROM matches 
WHERE id = 'ececf4a5-327b-4b09-b3af-66474080da17';

-- Should show:
-- flowType: 'CHALLENGE'
```

## Expected Behavior

### Match Creation Response
```json
{
  "id": "uuid",
  "sportId": "uuid",
  "flowType": "CHALLENGE",  ← Must be returned
  "matchType": "FRIENDLY",
  "homeTeamId": "uuid",
  "createdById": "uuid",
  "status": "DRAFT"
}
```

### Challenge Creation
- ✅ Check `match.flowType === 'CHALLENGE'`
- ✅ If CHALLENGE: allow challenge creation
- ❌ If TRAINING or STANDARD: reject with appropriate error

## Priority: HIGH

The authorization fix worked! Now we just need to ensure `flowType` is properly saved and validated.

## Root Cause Analysis

The frontend is correctly:
1. ✅ Creating a CHALLENGE match with JWT authentication
2. ✅ Sending POST /matches with flowType: "CHALLENGE" and homeTeamId
3. ✅ Receiving matchId in response: `ececf4a5-327b-4b09-b3af-66474080da17`
4. ✅ Sending challenge request with awayTeamId and awayCaptainUserId
5. ❌ Getting rejected with 403 "Only match creator can create challenges"

**The problem:** When creating the match, the backend is either:
- Not setting `createdById` from the JWT token, OR
- Not properly checking authorization when creating a challenge

## Frontend Request Logs

### 1. Match Creation (SUCCESS)
```json
POST /api/v1/matches
Headers: {
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}
Body: {
  "sportId": "10399dae-7bcc-43df-a975-2c2c3e0666Sb",
  "matchType": "FRIENDLY",
  "flowType": "CHALLENGE",
  "homeTeamId": "42e03z1b-019c-4a55-81e9-123f9e9cba58"
}
Response: 201 Created
{
  "id": "ececf4a5-327b-4b09-b3af-66474080da17",
  ...
}
```

### 2. Challenge Creation (FAILED)
```json
POST /api/v1/matches/ececf4a5-327b-4b09-b3af-66474080da17/challenge
Headers: {
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}
Body: {
  "awayTeamId": "42e03z1b-019c-4a55-81e9-123f9e9cba58",
  "awayCaptainUserId": "fbc1b311-fbcd-4199-9ce6-5eba0b8f2efe",
  "message": "¡Hola! Te reto a un partido amistoso en RYVEX. ¿Aceptas?"
}
Response: 403 Forbidden
{
  "message": "Only match creator can create challenges",
  "error": "Forbidden",
  "statusCode": 403
}
```

**SAME JWT TOKEN** is being used for both requests, so the user IS the match creator.

## Required Backend Fixes

### Fix 1: Ensure Match Creation Sets createdById

**File:** `src/matches/matches.service.ts` (or similar)

The match creation endpoint MUST extract the user ID from the JWT token and set it as `createdById`.

```typescript
// ❌ WRONG - createdById not set from request
async createMatch(createMatchDto: CreateMatchDto) {
  const match = await this.matchRepository.create({
    sportId: createMatchDto.sportId,
    matchType: createMatchDto.matchType,
    flowType: createMatchDto.flowType,
    homeTeamId: createMatchDto.homeTeamId,
    awayTeamId: createMatchDto.awayTeamId,
    status: 'DRAFT'
  });
  return match;
}

// ✅ CORRECT - createdById set from authenticated user
async createMatch(createMatchDto: CreateMatchDto, userId: string) {
  const match = await this.matchRepository.create({
    sportId: createMatchDto.sportId,
    matchType: createMatchDto.matchType,
    flowType: createMatchDto.flowType,
    homeTeamId: createMatchDto.homeTeamId,
    awayTeamId: createMatchDto.awayTeamId,
    createdById: userId,  // ← CRITICAL: Set from JWT
    status: 'DRAFT'
  });
  return match;
}
```

**Controller update needed:**
```typescript
@Post()
@UseGuards(JwtAuthGuard)
async create(
  @Body() createMatchDto: CreateMatchDto,
  @Request() req
) {
  const userId = req.user.id; // Extract from JWT payload
  return this.matchesService.createMatch(createMatchDto, userId);
}
```

### Fix 2: Verify Challenge Authorization Logic

**File:** `src/matches/matches.service.ts` or `src/challenges/challenges.service.ts`

```typescript
async createChallenge(
  matchId: string,
  createChallengeDto: CreateChallengeDto,
  userId: string  // From JWT
) {
  // 1. Get the match
  const match = await this.matchRepository.findById(matchId);
  
  if (!match) {
    throw new NotFoundException('Match not found');
  }
  
  // 2. Check authorization
  if (match.createdById !== userId) {
    // ⚠️ THIS CHECK IS FAILING - Debug it!
    console.log('Authorization check:', {
      matchCreatedById: match.createdById,
      requestUserId: userId,
      areEqual: match.createdById === userId,
      typeofMatchCreatedById: typeof match.createdById,
      typeofRequestUserId: typeof userId
    });
    
    throw new ForbiddenException('Only match creator can create challenges');
  }
  
  // 3. Create the challenge
  const challenge = await this.challengeRepository.create({
    matchId,
    awayTeamId: createChallengeDto.awayTeamId,
    awayCaptainUserId: createChallengeDto.awayCaptainUserId,
    message: createChallengeDto.message,
    status: 'PENDING',
    createdAt: new Date()
  });
  
  return challenge;
}
```

### Fix 3: Check Database Schema

Ensure the `matches` table has `createdById` column:

```sql
-- Verify column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'matches' AND column_name = 'createdById';

-- If missing, add it
ALTER TABLE matches 
ADD COLUMN "createdById" UUID NOT NULL REFERENCES users(id);

-- Update existing matches (if any)
UPDATE matches 
SET "createdById" = (
  SELECT "captainId" FROM teams WHERE teams.id = matches."homeTeamId"
)
WHERE "createdById" IS NULL;
```

## Testing Steps

1. **Test match creation with logging:**
```typescript
const match = await this.matchRepository.create({...});
console.log('Match created:', {
  id: match.id,
  createdById: match.createdById,
  userId: userId
});
```

2. **Test challenge creation:**
```bash
# Create match
curl -X POST http://localhost:3000/api/v1/matches \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "sportId": "uuid",
    "matchType": "FRIENDLY",
    "flowType": "CHALLENGE",
    "homeTeamId": "uuid"
  }'

# Response should include createdById
# {
#   "id": "match-uuid",
#   "createdById": "user-uuid",  ← Should match JWT user
#   ...
# }

# Create challenge (should now work)
curl -X POST http://localhost:3000/api/v1/matches/{matchId}/challenge \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "awayTeamId": "uuid",
    "awayCaptainUserId": "uuid",
    "message": "Challenge message"
  }'
```

## Expected Behavior After Fix

### 1. Match Creation
- ✅ Extract `userId` from JWT token
- ✅ Set `match.createdById = userId`
- ✅ Return match with createdById in response

### 2. Challenge Creation
- ✅ Extract `userId` from JWT token
- ✅ Get match and verify `match.createdById === userId`
- ✅ Create challenge record with status: 'PENDING'
- ✅ Return challenge data

### 3. Challenge Response Structure
```json
{
  "challengeId": "uuid",
  "matchId": "uuid",
  "status": "PENDING",
  "awayTeamId": "uuid",
  "awayCaptainUserId": "uuid",
  "message": "Challenge message",
  "createdAt": "2026-02-01T12:00:00.000Z"
}
```

## Common Issues to Check

### Issue 1: UUID vs String Type Mismatch
```typescript
// If createdById is UUID type and userId is string:
if (match.createdById.toString() === userId.toString()) {
  // ...
}
```

### Issue 2: Nullable createdById
```typescript
// If createdById can be null, handle it:
if (!match.createdById) {
  throw new BadRequestException('Match has no creator assigned');
}
```

### Issue 3: JWT Payload Structure
```typescript
// Verify JWT payload structure:
@Request() req
console.log('JWT payload:', req.user);
// Should be: { id: "uuid", email: "...", ... }
```

### Issue 4: ORM Not Loading createdById
```typescript
// Ensure ORM query includes createdById:
const match = await this.matchRepository.findOne({
  where: { id: matchId },
  select: ['id', 'createdById', 'flowType', 'status']  // Include createdById
});
```

## Database Migration (If Needed)

If `createdById` column doesn't exist:

```typescript
// Prisma migration
model Match {
  id          String   @id @default(uuid())
  createdBy   User     @relation(fields: [createdById], references: [id])
  createdById String   // ← Add this field
  sportId     String
  flowType    FlowType
  // ... other fields
}

// Run: npx prisma migrate dev --name add_match_creator
```

## Priority: CRITICAL

This blocks the entire Challenge match flow. The frontend is fully implemented and correct. Only backend authorization logic needs fixing.

## Contact

If you need more context or have questions, check:
- Frontend logs in browser console
- JWT token payload structure
- Database schema for matches table
- Authorization guard implementation

---

**Summary:** The same user creates the match AND tries to create the challenge using the same JWT token. The authorization check is incorrectly rejecting this valid request. Fix by ensuring `createdById` is properly set during match creation and properly checked during challenge creation.
