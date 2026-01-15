# RYVEX - Create Match Wizard Implementation

## Overview
This implementation provides a complete "Create Match" wizard flow for RYVEX, a multi-sport amateur competition platform (MVP focused on football).

## Tech Stack
- **React** + **TypeScript** + **Vite**
- **Tailwind CSS** (dark theme, mobile-first)
- **React Router** (navigation)
- **TanStack Query** (server state management)
- **Zustand** (client state: auth + wizard)
- **React Hook Form** + **Zod** (form validation)
- **Axios** (HTTP client with auth headers)

## Project Structure

```
src/
├── app/                          # App configuration
│   └── layout/                   # Layout components
├── components/                   # Reusable UI components
│   ├── Badge.tsx
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Divider.tsx
│   ├── Header.tsx
│   ├── Input.tsx
│   ├── Tabs.tsx
│   ├── BottomNav.tsx
│   └── WizardProgress.tsx
├── features/                     # Feature-based modules
│   ├── auth/                     # Authentication
│   │   ├── auth.service.ts
│   │   ├── auth.store.ts
│   │   ├── auth.types.ts
│   │   ├── LoginPage.tsx
│   │   └── GoogleCallbackPage.tsx
│   ├── home/
│   │   └── HomePage.tsx
│   ├── matches/
│   │   ├── create/               # Create Match Wizard
│   │   │   ├── CreateMatchWizardPage.tsx
│   │   │   └── steps/
│   │   │       ├── Step1Format.tsx
│   │   │       ├── Step2Teams.tsx
│   │   │       ├── Step3Invites.tsx
│   │   │       └── Step4Summary.tsx
│   │   └── summary/
│   │       └── MatchSummaryPage.tsx
│   ├── challenge/
│   │   └── ChallengePage.tsx     # Public challenge acceptance
│   └── invites/
│       └── InviteAcceptPage.tsx  # Public invite acceptance
├── services/                     # API layer
│   ├── apiClient.ts              # Axios instance with auth
│   └── endpoints.ts              # Typed API functions
├── store/                        # Zustand stores
│   └── wizard.store.ts           # Wizard state management
├── types/                        # TypeScript types
│   └── match.types.ts
└── App.tsx                       # Root component with routes
```

## Features Implemented

### 1. Four-Step Wizard Flow

#### **Step 1: Format Selection**
- User selects football format: FUTSAL, F5, F7, or F11
- Each format displays:
  - Number of on-field players
  - Substitutes allowed (5)
  - Maximum squad size
- Creates match as DRAFT via `POST /api/v1/matches`
- Stores `matchId` in wizard store

#### **Step 2: Team Selection**
- **HOME Team**: Must be from user's teams (`scope=mine`)
- **AWAY Team**: Can be from user's teams OR public teams
- Search functionality for both
- Assigns teams via `POST /api/v1/matches/:matchId/teams`
- **Challenge Flow**: If AWAY is public and not managed by user:
  - Automatically creates challenge via `POST /api/v1/matches/:matchId/challenges`
  - Shows share link for challenge
  - Updates wizard state

#### **Step 3: Player Invitations**
- Tabs for HOME and AWAY teams
- Real-time roster counters:
  - Invited count
  - Accepted count
  - Minimum required (= onFieldPlayers)
  - Maximum allowed (= maxSquadSize)
- Invite form supports:
  - Email
  - Phone (optional)
  - User ID (optional)
- **AWAY Team Logic**:
  - If challenge pending → shows locked state with share link
  - If challenge accepted → shows invite form
- Progress bars showing completion status
- Validates maximum squad size
- Sends invites via `POST /api/v1/matches/:matchId/invites`

#### **Step 4: Summary/Review**
- Displays complete match overview:
  - Format details
  - Team rosters with counts
  - Challenge status (if applicable)
- Status badges:
  - "Listo" (Ready) - both teams meet minimums
  - "Pendiente" (Pending) - waiting for players/challenge
- Copy challenge link button
- Option to go back and modify
- Finish button to complete wizard

### 2. Public Pages

#### **Challenge Page** (`/challenge/:token`)
- Displays challenge invitation
- Accept/Decline buttons
- Redirects to login if not authenticated
- On accept: calls `POST /api/v1/challenges/:token/accept`
- Redirects to match summary after acceptance

#### **Invite Accept Page** (`/invites/:token`)
- Displays player invitation
- Accept button
- Requires authentication
- On accept: calls `POST /api/v1/invites/:token/accept`
- Redirects to match summary

#### **Match Summary Page** (`/matches/:matchId/summary`)
- View-only page showing match details
- Team rosters and status
- Challenge status
- Can be accessed after accepting invites/challenges

### 3. State Management

#### **Zustand Stores**
- **`auth.store.ts`**: User authentication (token, user data)
- **`wizard.store.ts`**: Wizard flow state
  - Persisted in localStorage
  - Stores: matchId, format, teams, challenge status, current step
  - Enables wizard resumption after page refresh

#### **TanStack Query**
- Teams search queries
- Match summary queries (with refetch)
- Mutations for:
  - Create match
  - Assign teams
  - Create challenges
  - Send invites
  - Accept challenges/invites

### 4. API Integration

All endpoints are typed and implemented in `endpoints.ts`:

- `GET /api/v1/teams?scope=mine,public&q=<search>`
- `POST /api/v1/matches`
- `POST /api/v1/matches/:matchId/teams`
- `POST /api/v1/matches/:matchId/challenges`
- `POST /api/v1/challenges/:token/accept`
- `POST /api/v1/challenges/:token/decline`
- `POST /api/v1/matches/:matchId/invites`
- `POST /api/v1/invites/:token/accept`
- `GET /api/v1/matches/:matchId/summary`

### 5. UI Components

All components follow dark theme with Tailwind CSS:

- **Card**: Container with borders and hover effects
- **Badge**: Status indicators (success, warning, error, info)
- **Tabs**: Tab navigation for HOME/AWAY teams
- **WizardProgress**: Step indicator with progress bar
- **Button**: Primary/Secondary variants
- **Input**: Form input with labels

### 6. Routing

```typescript
// Protected Routes (require authentication)
/home                          - Home page
/matches/new                   - Create match wizard
/matches/:matchId/summary      - Match summary view

// Public Routes
/challenge/:token              - Accept/decline challenge
/invites/:token               - Accept invitation

// Auth Routes
/login                        - Login page
/auth/callback                - OAuth callback
```

## Environment Variables

Create a `.env` file with:

```bash
VITE_API_URL=http://localhost:3000/api/v1
VITE_APP_URL=http://localhost:5173
```

## Running the Application

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Key Design Decisions

1. **Mobile-First**: All components designed for mobile with responsive layouts
2. **Dark Theme**: Consistent dark UI throughout the app
3. **Wizard Persistence**: State saved to localStorage for resumable experience
4. **Error Handling**: Inline error messages and loading states
5. **Type Safety**: Full TypeScript coverage for API and state
6. **Minimal Taps**: Wizard flow designed for efficiency
7. **Real-time Updates**: TanStack Query refetches data after mutations

## Future Enhancements

- Tournament creation (currently placeholder)
- Match start/live scoring
- Referee assignment
- Venue selection
- Team creation flow
- Player profile management
- Notifications for invites/challenges
- Match history and statistics

## Notes

- MVP focuses on **football only**, but architecture supports multi-sport
- Format data is currently hardcoded (FUTSAL, F5, F7, F11)
- In production, formats would come from API
- Challenge decline endpoint may need backend support
- JWT stored in localStorage (consider httpOnly cookies for production)

## Testing

The application has been built successfully. To test:

1. Start the backend API server
2. Run `npm run dev`
3. Navigate to `/home` (will redirect to login if not authenticated)
4. Click "Crear Partido" to start the wizard
5. Test the complete flow from format selection to summary

---

**Implementation Status**: ✅ Complete

All requirements from the specification have been implemented and the application builds successfully.
