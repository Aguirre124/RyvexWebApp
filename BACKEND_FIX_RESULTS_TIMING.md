# URGENT: Backend Fix Required for Match Results

## Issue
The button to register results should be enabled when the match **STARTS**, not when it **ENDS**.

## Current Backend Logic (WRONG)
```typescript
// In GET /api/v1/matches/{matchId}/results
const canSubmitResults = serverNow > booking.endAt
```

## Required Backend Logic (CORRECT)
```typescript
// In GET /api/v1/matches/{matchId}/results
const canSubmitResults = serverNow >= booking.startAt && booking.paymentStatus === 'PAID'

// Update reason message
const reason = serverNow >= booking.startAt 
  ? 'You can now register results'
  : 'Match has not started yet'
```

## Why This Change?
Users want to register match results **as soon as the match begins**, not wait until it ends. This allows them to:
- Enter live statistics during the match
- Submit preliminary results
- Update scores in real-time

## Frontend Already Updated ✅
- Banner now says "Disponible cuando inicie el partido (15:00)" instead of "cuando finalice"
- Button text changed to "(disponible al inicio del partido)"
- Banner displays `booking.startAt` instead of `booking.endAt`

## Backend Changes Needed

Update the endpoint: **GET /api/v1/matches/:matchId/results**

```typescript
async getMatchResults(req, res) {
  const { matchId } = req.params
  const userId = req.user.id
  
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      booking: true,
      result: true
    }
  })
  
  if (!match) {
    return res.status(404).json({ error: 'Match not found' })
  }
  
  const serverNow = new Date().toISOString()
  
  // CHANGE THIS: Check if match has STARTED, not ended
  const canSubmitResults = 
    match.booking && 
    match.booking.paymentStatus === 'PAID' &&
    new Date(serverNow) >= new Date(match.booking.startAt) && // FIXED: startAt instead of endAt
    match.createdById === userId &&
    !match.result
  
  // Update reason message
  let reason = ''
  if (!match.booking) {
    reason = 'No booking found for this match'
  } else if (match.booking.paymentStatus !== 'PAID') {
    reason = 'Booking must be paid before submitting results'
  } else if (new Date(serverNow) < new Date(match.booking.startAt)) {
    reason = 'Match has not started yet' // FIXED: Better message
  } else if (match.createdById !== userId) {
    reason = 'Only match creator can submit results'
  } else if (match.result) {
    reason = 'Results already submitted'
  } else {
    reason = 'You can now register results'
  }
  
  res.json({
    matchId: match.id,
    status: match.status,
    booking: match.booking ? {
      startAt: match.booking.startAt,
      endAt: match.booking.endAt,
      durationMin: match.booking.durationMin,
      paymentStatus: match.booking.paymentStatus
    } : null,
    result: match.result,
    canSubmitResults,
    reason,
    serverNow
  })
}
```

## Testing After Fix

1. Create and pay for a match scheduled for the future
2. Before match start time: Button should be DISABLED
3. At exact match start time: Button should become ENABLED
4. User can immediately register results when match starts

## Impact
- ✅ Better user experience
- ✅ Allows live statistics entry
- ✅ Results can be entered during match, not just after
