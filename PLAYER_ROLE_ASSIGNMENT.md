# Player Role Assignment on Invitations

## Overview
This feature allows match organizers/captains to suggest a playing position (role) when inviting players to a match. The role is optional and helps organize team formations.

## Implementation

### 1. Backend Integration

**Endpoint:** `POST /api/v1/invites/matches/{matchId}`

**Updated Payload:**
```typescript
{
  teamId: string
  inviteeUserId?: string        // for registered users
  inviteeEmail?: string          // for non-registered users
  inviteePhone?: string          // optional
  message?: string               // optional
  suggestedRoleCode?: string     // NEW: "GK" | "DEF" | "MID" | "ATT" | ""
}
```

**Normalization:**
- Empty strings are converted to `undefined` before sending
- This prevents sending empty strings to the backend

### 2. Data Model

**PendingInvite Type:**
```typescript
type PendingInvite =
  | { 
      kind: 'user'
      userId: string
      name: string
      email?: string | null
      phoneNumber?: string | null
      suggestedRoleCode: string
    }
  | { 
      kind: 'email'
      email: string
      suggestedRoleCode: string
    }
```

### 3. Role Definitions (Football - MVP)

```typescript
const FOOTBALL_ROLES = [
  { code: '', label: 'Sin preferencia' },
  { code: 'GK', label: 'Arquero' },
  { code: 'DEF', label: 'Defensa' },
  { code: 'MID', label: 'Mediocampo' },
  { code: 'ATT', label: 'Delantero' }
]
```

**Extensibility:**
- Roles are defined in `src/utils/roles.ts`
- Easy to add basketball, volleyball, etc. roles per sport in future iterations
- Use sport-specific role sets based on match sport type

### 4. UI Components

#### RoleSelect Component
**Location:** `src/components/RoleSelect.tsx`

**Props:**
- `value: string` - Current selected role code
- `onChange: (value: string) => void` - Callback when role changes
- `disabled?: boolean` - Disable the select
- `className?: string` - Additional CSS classes

**Usage:**
```tsx
<RoleSelect
  value={selectedRole}
  onChange={setSelectedRole}
/>
```

#### InvitePlayerModal Updates
**Location:** `src/features/matches/invites/InvitePlayerModal.tsx`

**New Features:**
1. Global role selector (sets role for next invite added)
2. Inline role editor in pending invites list
3. Role persists with each pending invite
4. Role is included in API payload when sending invites

**User Flow:**
1. User searches for player or enters email
2. User selects suggested role from dropdown (optional)
3. User adds player to pending list
4. Role is saved with that pending invite
5. User can edit role inline in pending list
6. When "Enviar invitación" clicked, role is sent to backend

### 5. API Service Update

**Location:** `src/services/endpoints.ts`

**Changes:**
```typescript
invitesApi.send: async (matchId, payload) => {
  // Normalize suggestedRoleCode: empty string becomes undefined
  const normalizedPayload = {
    ...payload,
    suggestedRoleCode: payload.suggestedRoleCode?.trim() || undefined
  }
  await apiClient.post(`/invites/matches/${matchId}`, normalizedPayload)
}
```

### 6. State Management

**Component State:**
- `selectedRole: string` - Currently selected role in dropdown (resets after adding invite)
- `pendingInvites: PendingInvite[]` - List of pending invites with their roles

**Functions:**
- `handleSelectUser()` - Adds user to pending list with selected role
- `handleAddEmail()` - Adds email to pending list with selected role
- `handleUpdateRole()` - Updates role of a pending invite inline
- `handleRemoveInvite()` - Removes pending invite from list

### 7. Query Invalidation

After successful invite submission:
```typescript
queryClient.invalidateQueries({ queryKey: ['matchSummary', matchId] })
queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
queryClient.invalidateQueries({ queryKey: ['notifications', 'list'] })
```

## User Experience

### Default Behavior
- Role defaults to empty string ("Sin preferencia")
- User can add invites without selecting a role
- Role can be changed before sending

### Inline Editing
- Each pending invite shows a role dropdown
- User can change role after adding to pending list
- Changes are saved immediately in component state

### Visual Feedback
- Role dropdown labeled "Posición sugerida"
- Options show both label and code: "Arquero (GK)"
- Pending invites show editable role selector

## Edge Cases Handled

### Empty Role
- Empty string normalized to `undefined` before sending
- Backend interprets as "no preference"

### Multiple Invites
- Each invite can have different role
- Roles persist independently per pending invite
- If one invite fails, others succeed with their roles

### Role Reset
- After adding invite, global role selector resets to ""
- Allows fresh selection for next invite
- Prevents accidental role reuse

### Validation
- Role is optional - no validation required
- Invalid role codes handled by backend
- Empty strings safely converted to undefined

## Future Enhancements

### Sport-Specific Roles
```typescript
// Example: Basketball roles
const BASKETBALL_ROLES = [
  { code: '', label: 'Sin preferencia' },
  { code: 'PG', label: 'Base' },
  { code: 'SG', label: 'Escolta' },
  { code: 'SF', label: 'Alero' },
  { code: 'PF', label: 'Ala-Pívot' },
  { code: 'C', label: 'Pívot' }
]

// Usage in RoleSelect:
<RoleSelect
  value={role}
  onChange={setRole}
  sport={match.sportId} // Pass sport context
/>
```

### Role Recommendations
- AI-based role suggestions based on player history
- Show player's most played positions
- Auto-fill role from player profile

### Formation Visualization
- Show team formation with roles
- Validate minimum players per position
- Highlight missing roles in formation

## Testing Checklist

- [ ] Select role and add registered user → role persisted
- [ ] Select role and add email invite → role persisted
- [ ] Add invite without role → "" sent as undefined
- [ ] Edit role inline in pending list → role updated
- [ ] Send multiple invites with different roles → all sent correctly
- [ ] Backend receives suggestedRoleCode in payload
- [ ] Empty role handled gracefully by backend
- [ ] Role selector resets after adding invite
- [ ] Remove pending invite → no error
- [ ] Send invites → match summary refreshes

## Files Modified/Created

**Created:**
- `src/components/RoleSelect.tsx` - Role selection dropdown component
- `src/utils/roles.ts` - Role definitions and utilities
- `PLAYER_ROLE_ASSIGNMENT.md` - This documentation

**Modified:**
- `src/features/matches/invites/InvitePlayerModal.tsx` - Added role selection UI and logic
- `src/services/endpoints.ts` - Updated invite payload to include suggestedRoleCode

## API Contract

**Request:**
```http
POST /api/v1/invites/matches/{matchId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "teamId": "uuid",
  "inviteeUserId": "uuid",
  "message": "Te invito...",
  "suggestedRoleCode": "DEF"
}
```

**Response:**
```http
204 No Content
```

**Error Responses:**
- `400 Bad Request` - Invalid role code or missing required fields
- `404 Not Found` - Match not found
- `409 Conflict` - Duplicate invitation
- `401 Unauthorized` - Invalid or missing token
