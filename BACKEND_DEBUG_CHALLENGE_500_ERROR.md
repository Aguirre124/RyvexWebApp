# Backend Debug: Challenge 500 Error

## Error Details

**Endpoint:** `POST /api/v1/challenge-invitations`
**Status:** 500 Internal Server Error
**Message:** "Internal server error"

## Frontend Request (Correct)

```json
POST /api/v1/challenge-invitations
Headers: {
  "Authorization": "Bearer {JWT_TOKEN}",
  "Content-Type": "application/json"
}
Body: {
  "sportId": "10399dae-7bcc-43df-a975-2c2c3e0666Sb",
  "matchType": "FRIENDLY",
  "homeTeamId": "592bde52-112d-466S-df8e-c0c6650dad",
  "awayTeamId": "42e03z1b-019c-4a55-81e9-123f9e9cba58",
  "awayCaptainUserId": "fbc1b311-fbcd-4199-9ce6-5eba0b8f2efe",
  "message": "¡Hola! Te reto a un partido amistoso en RYVEX. ¿Aceptas?"
}
```

## Common Causes of 500 Error

### 1. Database Table Doesn't Exist

**Check:**
```sql
SELECT * FROM information_schema.tables 
WHERE table_name = 'challenges';
```

**If missing, create:**
```sql
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sport_id UUID NOT NULL REFERENCES sports(id),
  match_type VARCHAR(20) NOT NULL,
  
  home_team_id UUID NOT NULL REFERENCES teams(id),
  home_captain_user_id UUID NOT NULL REFERENCES users(id),
  
  away_team_id UUID NOT NULL REFERENCES teams(id),
  away_captain_user_id UUID NOT NULL REFERENCES users(id),
  
  message TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  
  match_id UUID REFERENCES matches(id),
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  responded_at TIMESTAMP,
  decline_reason TEXT,
  
  CONSTRAINT check_status CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED'))
);

CREATE INDEX idx_challenges_away_captain ON challenges(away_captain_user_id, status);
CREATE INDEX idx_challenges_home_team ON challenges(home_team_id, status);
```

### 2. Controller Not Implemented

**Check if controller exists:**
```typescript
// src/challenges/challenges.controller.ts
import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChallengesService } from './challenges.service';
import { CreateChallengeInvitationDto } from './dto/create-challenge-invitation.dto';

@Controller('challenge-invitations')
@UseGuards(JwtAuthGuard)
export class ChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  @Post()
  async create(
    @Body() createDto: CreateChallengeInvitationDto,
    @Request() req
  ) {
    const userId = req.user.id;
    return this.challengesService.createChallengeInvitation(createDto, userId);
  }
}
```

### 3. DTO Missing or Invalid

**Create DTO:**
```typescript
// src/challenges/dto/create-challenge-invitation.dto.ts
import { IsEnum, IsUUID, IsString, IsOptional } from 'class-validator';

export class CreateChallengeInvitationDto {
  @IsUUID()
  sportId: string;

  @IsEnum(['FRIENDLY', 'COMPETITIVE'])
  matchType: string;

  @IsUUID()
  homeTeamId: string;

  @IsUUID()
  awayTeamId: string;

  @IsUUID()
  awayCaptainUserId: string;

  @IsString()
  @IsOptional()
  message?: string;

  @IsString()
  @IsOptional()
  proposedDateTime?: string;
}
```

### 4. Service Not Implemented

**Create Service:**
```typescript
// src/challenges/challenges.service.ts
import { Injectable, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Challenge } from './entities/challenge.entity';
import { Team } from '../teams/entities/team.entity';
import { CreateChallengeInvitationDto } from './dto/create-challenge-invitation.dto';

@Injectable()
export class ChallengesService {
  constructor(
    @InjectRepository(Challenge)
    private challengesRepository: Repository<Challenge>,
    @InjectRepository(Team)
    private teamsRepository: Repository<Team>,
  ) {}

  async createChallengeInvitation(
    createDto: CreateChallengeInvitationDto,
    userId: string,
  ) {
    // 1. Validate teams are different
    if (createDto.homeTeamId === createDto.awayTeamId) {
      throw new BadRequestException('Cannot challenge your own team');
    }

    // 2. Get home team and verify captain
    const homeTeam = await this.teamsRepository.findOne({
      where: { id: createDto.homeTeamId },
    });

    if (!homeTeam) {
      throw new BadRequestException('Home team not found');
    }

    if (homeTeam.captainId !== userId) {
      throw new ForbiddenException('Only team captain can send challenges');
    }

    // 3. Get away team and check visibility
    const awayTeam = await this.teamsRepository.findOne({
      where: { id: createDto.awayTeamId },
    });

    if (!awayTeam) {
      throw new BadRequestException('Away team not found');
    }

    if (awayTeam.visibility !== 'DISCOVERABLE' && awayTeam.visibility !== 'PUBLIC') {
      throw new ForbiddenException('Team is not available for challenges');
    }

    // 4. Check for duplicate pending challenges
    const existingChallenge = await this.challengesRepository.findOne({
      where: {
        homeTeamId: createDto.homeTeamId,
        awayTeamId: createDto.awayTeamId,
        status: 'PENDING',
      },
    });

    if (existingChallenge) {
      throw new ConflictException('Challenge already sent to this team');
    }

    // 5. Create challenge
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    const challenge = this.challengesRepository.create({
      sportId: createDto.sportId,
      matchType: createDto.matchType,
      homeTeamId: createDto.homeTeamId,
      homeCaptainUserId: userId,
      awayTeamId: createDto.awayTeamId,
      awayCaptainUserId: createDto.awayCaptainUserId,
      message: createDto.message,
      status: 'PENDING',
      expiresAt,
      createdAt: new Date(),
    });

    const saved = await this.challengesRepository.save(challenge);

    // 6. TODO: Send notification to away captain
    // await this.notificationsService.send({
    //   userId: createDto.awayCaptainUserId,
    //   type: 'CHALLENGE_RECEIVED',
    //   title: `${homeTeam.name} te ha retado!`,
    //   body: createDto.message || 'Han enviado un desafío a tu equipo',
    //   data: { challengeId: saved.id }
    // });

    // 7. Return response with team details
    return {
      challengeId: saved.id,
      status: saved.status,
      sportId: saved.sportId,
      matchType: saved.matchType,
      homeTeam: {
        id: homeTeam.id,
        name: homeTeam.name,
        captain: {
          id: userId,
          name: homeTeam.captainName || 'Captain', // Adjust based on your schema
        },
      },
      awayTeam: {
        id: awayTeam.id,
        name: awayTeam.name,
        captain: {
          id: createDto.awayCaptainUserId,
          name: awayTeam.captainName || 'Captain',
        },
      },
      message: saved.message,
      createdAt: saved.createdAt,
      expiresAt: saved.expiresAt,
    };
  }
}
```

### 5. Entity Not Defined

**Create Entity:**
```typescript
// src/challenges/entities/challenge.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('challenges')
export class Challenge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  sportId: string;

  @Column({ type: 'varchar', length: 20 })
  matchType: string;

  @Column('uuid')
  homeTeamId: string;

  @Column('uuid')
  homeCaptainUserId: string;

  @Column('uuid')
  awayTeamId: string;

  @Column('uuid')
  awayCaptainUserId: string;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  status: string;

  @Column({ type: 'uuid', nullable: true })
  matchId: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column('timestamp')
  expiresAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  respondedAt: Date;

  @Column({ type: 'text', nullable: true })
  declineReason: string;
}
```

### 6. Module Not Registered

**Create/Update Module:**
```typescript
// src/challenges/challenges.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChallengesController } from './challenges.controller';
import { ChallengesService } from './challenges.service';
import { Challenge } from './entities/challenge.entity';
import { Team } from '../teams/entities/team.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Challenge, Team]),
  ],
  controllers: [ChallengesController],
  providers: [ChallengesService],
  exports: [ChallengesService],
})
export class ChallengesModule {}
```

**Register in AppModule:**
```typescript
// src/app.module.ts
import { ChallengesModule } from './challenges/challenges.module';

@Module({
  imports: [
    // ... other modules
    ChallengesModule,
  ],
})
export class AppModule {}
```

## Debugging Steps

### Step 1: Check Backend Logs

Look for the actual error in the backend console:
```
[Nest] ERROR [ExceptionsHandler] ...
```

Common errors:
- `relation "challenges" does not exist` → Create table
- `Cannot find module` → Install dependencies or create missing files
- `Unknown column` → Check table schema matches entity
- `Validation failed` → Check DTO validation
- `Cannot read property 'id' of undefined` → User not authenticated properly

### Step 2: Add Logging to Service

```typescript
async createChallengeInvitation(createDto: CreateChallengeInvitationDto, userId: string) {
  console.log('=== Creating Challenge Invitation ===');
  console.log('DTO:', createDto);
  console.log('User ID:', userId);
  
  try {
    // ... validation code
    console.log('Validation passed');
    
    const challenge = await this.challengesRepository.save(/*...*/);
    console.log('Challenge saved:', challenge);
    
    return challenge;
  } catch (error) {
    console.error('Error creating challenge:', error);
    throw error;
  }
}
```

### Step 3: Test Database Connection

```typescript
@Get('test')
async test() {
  const count = await this.challengesRepository.count();
  return { message: 'Database connected', challengeCount: count };
}
```

### Step 4: Verify JWT Authentication

Make sure the JWT token is being extracted properly:
```typescript
@Post()
async create(@Body() createDto: CreateChallengeInvitationDto, @Request() req) {
  console.log('User from JWT:', req.user);
  if (!req.user || !req.user.id) {
    throw new UnauthorizedException('User not authenticated');
  }
  return this.challengesService.createChallengeInvitation(createDto, req.user.id);
}
```

## Quick Fix Checklist

- [ ] Database table `challenges` exists
- [ ] ChallengesModule registered in AppModule
- [ ] ChallengesController has `@Post()` endpoint
- [ ] ChallengesService has `createChallengeInvitation` method
- [ ] Challenge entity defined with all fields
- [ ] CreateChallengeInvitationDto validates input
- [ ] JWT authentication working (user.id available)
- [ ] Team repository injected and working
- [ ] Backend logs show actual error message

## Expected Response

When working correctly, should return:
```json
{
  "challengeId": "uuid",
  "status": "PENDING",
  "sportId": "uuid",
  "matchType": "FRIENDLY",
  "homeTeam": {
    "id": "uuid",
    "name": "Team A",
    "captain": { "id": "uuid", "name": "Captain" }
  },
  "awayTeam": {
    "id": "uuid",
    "name": "Team B",
    "captain": { "id": "uuid", "name": "Captain" }
  },
  "message": "Challenge message",
  "createdAt": "2026-02-01T10:00:00Z",
  "expiresAt": "2026-02-08T10:00:00Z"
}
```

## Priority: HIGH

The 500 error indicates the backend implementation is incomplete or has a bug. Check backend console logs for the actual error message.
