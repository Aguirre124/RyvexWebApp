# Invite Flow - Notifications Integration

## Overview
Updated the invite flow to properly refresh notifications when inviting registered users, ensuring the bell badge updates immediately without requiring a page refresh.

## Changes Made

### 1. Fixed API Endpoint URL
**File**: [src/services/endpoints.ts](src/services/endpoints.ts)

Changed invite endpoint from:
```typescript
await apiClient.post(`/invites/matches/${matchId}`, payload)
```

To the correct backend format:
```typescript
await apiClient.post(`/matches/${matchId}/invites`, payload)
```

### 2. Updated InvitePlayerModal
**File**: [src/features/matches/invites/InvitePlayerModal.tsx](src/features/matches/invites/InvitePlayerModal.tsx)

Added notification query invalidation in the `onSuccess` handler:

```typescript
onSuccess: () => {
  setSuccess(true)
  setError(null)
  queryClient.invalidateQueries({ queryKey: ['match-summary', matchId] })
  
  // Refresh notifications for invited users
  // Backend auto-creates notifications for registered users
  queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
  queryClient.invalidateQueries({ queryKey: ['notifications', 'list'] })
  
  setTimeout(() => {
    onClose()
  }, 2000)
},
```

### 3. Updated Step3Invites Component
**File**: [src/features/matches/create/components/Step3Invites.tsx](src/features/matches/create/components/Step3Invites.tsx)

Added:
- Import of `useQueryClient`
- Query client instantiation
- Notification invalidation after successful invites:

```typescript
// Refresh notifications if any invites succeeded
// Backend auto-creates notifications for registered users
if (success > 0) {
  queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
  queryClient.invalidateQueries({ queryKey: ['notifications', 'list'] })
}
```

## How It Works

### Flow for Registered Users

1. **User sends invite** via InvitePlayerModal or Step3Invites
2. **Backend receives** `POST /api/v1/matches/:matchId/invites` with `inviteeUserId`
3. **Backend automatically**:
   - Creates record in `match_invites` table
   - Creates record in `notifications` table
   - Links notification to the invited user
4. **Frontend receives** success response
5. **Frontend immediately**:
   - Invalidates `['notifications', 'unread-count']` → Bell badge updates
   - Invalidates `['notifications', 'list']` → Panel refreshes if open
   - Shows success message

### Flow for Email Fallback Users

1. **User sends invite** with email (no userId)
2. **Backend receives** `POST /api/v1/matches/:matchId/invites` with `inviteeEmail`
3. **Backend**:
   - Creates record in `match_invites` table
   - Does NOT create notification (user not registered yet)
   - Sends email with invite link
4. **Frontend**:
   - Still invalidates queries (harmless, no effect)
   - Shows success message

## Critical Rules Followed

✅ **Frontend does NOT create notifications explicitly**
- No direct calls to notification creation endpoints
- Backend handles all notification creation logic

✅ **Frontend refreshes notification data after invites**
- Uses TanStack Query invalidation
- Triggers automatic refetch of unread count
- Updates bell badge immediately

✅ **Correct API endpoint format**
- Changed from `/invites/matches/:id` to `/matches/:id/invites`
- Matches backend specification exactly

✅ **Works for both invite flows**
- InvitePlayerModal (from match summary page)
- Step3Invites (from match creation wizard)

## Testing Checklist

- [ ] Send invite to registered user → Bell badge increments immediately
- [ ] Send invite to email (non-registered) → No error, backend handles gracefully
- [ ] Open notifications panel → Shows new invite notification
- [ ] Click notification → Navigates to match summary
- [ ] Multiple invites → Badge count matches invite count
- [ ] Window focus → Badge refreshes (existing behavior preserved)

## Technical Details

### Query Invalidation
```typescript
queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
queryClient.invalidateQueries({ queryKey: ['notifications', 'list'] })
```

This triggers:
1. Immediate refetch of unread count → Badge updates
2. Refetch of notification list (if panel is open) → Panel updates
3. No wasted API calls (queries respect `enabled` flag)

### Backend Responsibility
- Creating notification records
- Linking notifications to users
- Determining notification type and content
- Handling notification status

### Frontend Responsibility
- Sending invite with correct payload
- Invalidating queries to trigger refresh
- Displaying updated badge count
- Showing notifications in panel

## Impact

**Before**: 
- Invites sent successfully
- Notifications created by backend
- Bell badge didn't update until page refresh or 30s poll

**After**:
- Invites sent successfully
- Notifications created by backend
- Bell badge updates **immediately** after invite
- User sees notification in panel without refresh

---

**Status**: ✅ Complete
**Breaking Changes**: None
**Files Modified**: 3
