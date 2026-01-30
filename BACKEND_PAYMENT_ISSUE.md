# Backend Payment Authorization Issue - Action Required

## Issue Summary
The payment endpoint `/api/v1/payments/stripe/create-intent` is returning a 403 Forbidden error with the message:
```json
{
  "message": "You are not authorized to pay for this booking",
  "error": "Forbidden",
  "statusCode": 403
}
```

## Problem Details
- **Booking ID**: `83fcd710-fe31-4e27-86ab-b5f2cc8a1651`
- **Error**: User cannot pay for their own booking
- **Root Cause**: The booking's `userId` doesn't match the authenticated user's ID making the payment request

## Frontend Flow (Working Correctly)
1. User creates a match
2. User schedules venue/court via `POST /bookings/confirm` (this creates the booking)
3. User navigates to match summary page
4. User clicks "Pagar y reservar" 
5. Frontend calls `POST /payments/stripe/create-intent` with `{ bookingId: "83fcd710-..." }`
6. **Backend rejects with 403** because booking userId ≠ authenticated userId

## Backend Tasks

### Task 1: Investigate Booking Creation
Check the `POST /api/v1/bookings/confirm` endpoint:

```
When a booking is created via the scheduling flow, verify:
1. Does it correctly extract the userId from the JWT token?
2. Is the userId being saved to the booking record?
3. Is there any user mismatch happening?

Query the database:
SELECT id, userId, matchId, courtId, status, createdAt 
FROM bookings 
WHERE id = '83fcd710-fe31-4e27-86ab-b5f2cc8a1651';

Compare the userId in the booking record with the userId from the JWT token that's making the payment request.
```

### Task 2: Review Payment Authorization Logic
Check the `POST /api/v1/payments/stripe/create-intent` endpoint:

```
Current logic appears to be:
1. Extract bookingId from request body
2. Fetch booking from database
3. Check if booking.userId === authenticatedUser.id
4. If not, return 403 Forbidden

Issues with this approach:
- The match creator should be able to pay, not just the booking creator
- The authorization check should verify if the user is the match owner
- Or, the booking creation should use the match creator's userId, not a different user
```

### Task 3: Fix Authorization Logic (Choose One)

#### Option A: Fix Booking Creation (Recommended)
When creating a booking in `POST /bookings/confirm`:
```typescript
// CURRENT (possibly wrong):
const booking = await prisma.booking.create({
  data: {
    courtId: req.body.courtId,
    start: req.body.start,
    end: req.body.end,
    userId: someOtherUserId, // ❌ Wrong user?
    // ...
  }
})

// SHOULD BE:
const booking = await prisma.booking.create({
  data: {
    courtId: req.body.courtId,
    start: req.body.start,
    end: req.body.end,
    userId: req.user.id, // ✅ Use authenticated user from JWT
    matchId: req.body.matchId, // ✅ Link to match
    // ...
  }
})
```

#### Option B: Fix Payment Authorization
Update the authorization check in `POST /payments/stripe/create-intent`:
```typescript
// CURRENT (too restrictive):
const booking = await prisma.booking.findUnique({
  where: { id: bookingId }
})

if (booking.userId !== req.user.id) {
  throw new ForbiddenException('You are not authorized to pay for this booking')
}

// BETTER APPROACH:
const booking = await prisma.booking.findUnique({
  where: { id: bookingId },
  include: { match: true }
})

// Allow payment if user is booking creator OR match creator
const isAuthorized = 
  booking.userId === req.user.id || 
  booking.match?.creatorId === req.user.id ||
  booking.match?.homeTeam?.creatorId === req.user.id

if (!isAuthorized) {
  throw new ForbiddenException('You are not authorized to pay for this booking')
}
```

### Task 4: Verify Match Association
Ensure bookings are properly linked to matches:

```sql
-- Check if booking is linked to a match
SELECT 
  b.id as booking_id,
  b.userId as booking_user_id,
  b.matchId,
  m.creatorId as match_creator_id,
  u1.email as booking_user_email,
  u2.email as match_creator_email
FROM bookings b
LEFT JOIN matches m ON b.matchId = m.id
LEFT JOIN users u1 ON b.userId = u1.id
LEFT JOIN users u2 ON m.creatorId = u2.id
WHERE b.id = '83fcd710-fe31-4e27-86ab-b5f2cc8a1651';
```

If `matchId` is NULL, the booking isn't linked to the match properly during creation.

## Expected Behavior

### When user schedules a court:
1. `POST /bookings/confirm` receives holdId, price, currency
2. Backend validates the hold exists and hasn't expired
3. Backend creates booking with:
   - `userId` = authenticated user ID from JWT
   - `matchId` = the match ID from the hold/session
   - `courtId`, `start`, `end` from the hold
4. Return booking with `id`, `price`, `status: 'CONFIRMED'`

### When user pays for booking:
1. `POST /payments/stripe/create-intent` receives bookingId
2. Backend validates booking exists
3. Backend checks authorization:
   - User is booking creator, OR
   - User is match creator/owner
4. Backend creates Stripe PaymentIntent
5. Return `{ paymentId, clientSecret, amount, currency }`

## Testing Steps

### After Fix:
1. Create a new match as User A
2. Schedule a court (creates booking)
3. Verify booking userId = User A's ID
4. Click "Pagar y reservar"
5. Should successfully create payment intent
6. Process test payment (card: 4242 4242 4242 4242)
7. Verify payment confirms successfully

### Test with Different Users:
1. User A creates match
2. User A schedules court (booking created)
3. User A should be able to pay ✅
4. User B (not involved) tries to pay → 403 ❌ (correct)
5. User C (team member) tries to pay → depends on business logic

## Debugging Queries

```sql
-- Find all bookings for this match
SELECT * FROM bookings WHERE matchId = '<matchId>';

-- Check who created the match
SELECT * FROM matches WHERE id = '<matchId>';

-- Compare user IDs
SELECT 
  (SELECT userId FROM bookings WHERE id = '83fcd710-fe31-4e27-86ab-b5f2cc8a1651') as booking_user,
  (SELECT creatorId FROM matches WHERE id = (SELECT matchId FROM bookings WHERE id = '83fcd710-fe31-4e27-86ab-b5f2cc8a1651')) as match_creator;
```

## API Contract (for reference)

### POST /bookings/confirm
```typescript
Request:
{
  holdId: string
  price: number
  currency: string
}

Response:
{
  id: string          // Booking ID
  matchId?: string    // Should be populated!
  courtId: string
  venueId: string
  userId: string      // Should match JWT user
  start: string       // ISO timestamp
  end: string         // ISO timestamp
  durationMin: number
  price: number
  currency: string
  status: 'CONFIRMED'
  createdAt: string
}
```

### POST /payments/stripe/create-intent
```typescript
Request:
{
  bookingId: string
}

Response:
{
  paymentId: string      // Internal payment record ID
  clientSecret: string   // Stripe client secret
  amount: number         // Amount in cents/smallest currency unit
  currency: string       // e.g., "cop"
}
```

## Priority
**HIGH** - This blocks the entire payment flow and is a critical MVP feature.

---

# NEW ISSUE: Stripe Minimum Amount Requirement

## Issue Summary
Payment is failing with a 400 error:
```json
{
  "statusCode": 400,
  "message": "Amount must convert to at least 50 cents. $500.00 COP converts to approximately $0.14 USD.",
  "error": "Bad Request"
}
```

## Problem
**Stripe requires a minimum of $0.50 USD (approximately 2,000 COP) for all payments.**

The current court hourlyRate is set to **500 COP**, which is:
- Too low for a realistic soccer court rental
- Below Stripe's minimum payment amount
- Causing all payments to fail

## Required Fix

### Update Court Pricing
Set realistic hourly rates for all courts. Typical Colombian soccer court rates:

- **Fútbol 5 (small court)**: 50,000 - 80,000 COP/hour
- **Fútbol 7 (medium court)**: 80,000 - 120,000 COP/hour  
- **Fútbol 11 (full field)**: 150,000 - 250,000 COP/hour
- **Indoor/covered**: Add 20-30% premium

### Minimum Requirements
```sql
-- Update all courts to have realistic prices (minimum 2,000 COP)
UPDATE courts 
SET hourlyRate = CASE 
  WHEN format LIKE '%5%' THEN 60000  -- Fútbol 5
  WHEN format LIKE '%7%' THEN 100000 -- Fútbol 7
  WHEN format LIKE '%11%' THEN 180000 -- Fútbol 11
  ELSE 50000 -- Default minimum
END
WHERE hourlyRate < 2000;
```

### For Testing Only
If you need to test with low amounts, set **minimum 2,000 COP** (meets Stripe's $0.50 USD requirement):
```sql
UPDATE courts SET hourlyRate = 2000 WHERE id = '<court-id>';
```

### Validation Rule
Add backend validation when creating/updating courts:
```typescript
if (hourlyRate < 2000) {
  throw new BadRequestException(
    'El precio por hora debe ser mínimo $2.000 COP (requerimiento de Stripe)'
  )
}
```

## Impact
- ❌ **ALL payments are currently failing** due to this
- ❌ Users cannot complete bookings
- ❌ MVP payment flow is completely blocked

## Action Items
1. ✅ Update all courts in database to have realistic hourlyRate (minimum 2,000 COP)
2. ✅ Add validation to prevent setting prices below Stripe minimum
3. ✅ Update seed data / fixtures with proper prices
4. ❌ **CRITICAL**: Fix payment intent to use CURRENT court price, not saved booking price
5. ⏳ Test payment flow with updated prices
6. ⏳ Deploy to production

---

## NEW CRITICAL ISSUE: Payment Intent Using Old Booking Price

### Problem
Even after updating court prices, payments still fail because the payment intent is using the booking's saved `price` field instead of recalculating from the court's current `hourlyRate`.

**Current Flow (WRONG):**
```typescript
// POST /payments/stripe/create-intent
const booking = await prisma.booking.findUnique({ where: { id: bookingId } })
const amount = booking.price // ❌ Using old saved price (500 COP)
const paymentIntent = await stripe.paymentIntents.create({
  amount: amount * 100, // Still 500 COP - fails Stripe minimum!
  currency: 'cop'
})
```

**Correct Flow (REQUIRED):**
```typescript
// POST /payments/stripe/create-intent
const booking = await prisma.booking.findUnique({ 
  where: { id: bookingId },
  include: { court: true } // ✅ Include court to get current hourlyRate
})

// ✅ Recalculate price using CURRENT court hourlyRate
const court = await prisma.court.findUnique({ where: { id: booking.courtId } })
const hourlyRate = court.hourlyRate // Current price from database
const durationHours = booking.durationMin / 60
const currentPrice = Math.round(hourlyRate * durationHours) // Recalculated!

// Validate minimum Stripe amount
if (currentPrice < 2000) {
  throw new BadRequestException(
    `El precio es muy bajo (${currentPrice} COP). El mínimo permitido es 2.000 COP`
  )
}

const paymentIntent = await stripe.paymentIntents.create({
  amount: currentPrice * 100, // ✅ Use recalculated price
  currency: 'cop',
  metadata: {
    bookingId: booking.id,
    courtId: court.id,
    originalBookingPrice: booking.price, // For reference
    recalculatedPrice: currentPrice // For audit trail
  }
})

// ✅ Optionally update booking price with current rate
await prisma.booking.update({
  where: { id: bookingId },
  data: { price: currentPrice }
})
```

### Why This Happens
1. Booking was created when court price was 500 COP
2. Booking saved `price: 500` to database
3. Admin updated court to 50,000 COP hourlyRate
4. User tries to pay → backend uses booking's saved price (500) → Stripe rejects

### Required Backend Changes

#### 1. Update Payment Intent Creation
File: `src/payments/payments.service.ts` or similar

```typescript
async createStripeIntent(bookingId: string, userId: string) {
  // Fetch booking with court details
  const booking = await this.prismaService.booking.findUnique({
    where: { id: bookingId },
    include: { 
      court: true,
      match: true 
    }
  })
  
  if (!booking) {
    throw new NotFoundException('Booking not found')
  }
  
  // Authorization check
  if (booking.userId !== userId && booking.match?.creatorId !== userId) {
    throw new ForbiddenException('You are not authorized to pay for this booking')
  }
  
  // ✅ CRITICAL: Recalculate price from current court rate
  const court = booking.court
  if (!court.hourlyRate) {
    throw new BadRequestException('Court does not have a hourlyRate configured')
  }
  
  const durationHours = booking.durationMin / 60
  const currentPrice = Math.round(court.hourlyRate * durationHours)
  
  // Validate Stripe minimum (2,000 COP ≈ $0.50 USD)
  if (currentPrice < 2000) {
    throw new BadRequestException(
      `Price too low: ${currentPrice} COP. Minimum required: 2,000 COP (Stripe requirement)`
    )
  }
  
  // Create Stripe payment intent
  const paymentIntent = await this.stripeService.paymentIntents.create({
    amount: currentPrice * 100, // Convert to cents
    currency: booking.currency || 'cop',
    metadata: {
      bookingId: booking.id,
      matchId: booking.matchId,
      courtId: booking.courtId,
      userId: userId,
      originalPrice: booking.price,
      recalculatedPrice: currentPrice
    }
  })
  
  // Create payment record
  const payment = await this.prismaService.payment.create({
    data: {
      bookingId: booking.id,
      userId: userId,
      amount: currentPrice,
      currency: booking.currency || 'cop',
      provider: 'STRIPE',
      stripePaymentIntentId: paymentIntent.id,
      status: 'PENDING'
    }
  })
  
  return {
    paymentId: payment.id,
    clientSecret: paymentIntent.client_secret,
    amount: currentPrice,
    currency: booking.currency || 'cop'
  }
}
```

#### 2. Alternative: Update Booking Price on Confirmation
If you want bookings to always reflect current prices, update the price when confirming:

```typescript
// POST /bookings/confirm
async confirmBooking(holdId: string, userId: string) {
  const hold = await this.prismaService.hold.findUnique({
    where: { id: holdId },
    include: { court: true }
  })
  
  // ✅ Use CURRENT court hourlyRate, not client-provided price
  const durationHours = hold.durationMin / 60
  const currentPrice = Math.round(hold.court.hourlyRate * durationHours)
  
  const booking = await this.prismaService.booking.create({
    data: {
      userId: userId,
      courtId: hold.courtId,
      matchId: hold.matchId,
      start: hold.start,
      end: hold.end,
      durationMin: hold.durationMin,
      price: currentPrice, // ✅ Use current price from court
      currency: 'COP',
      status: 'CONFIRMED'
    }
  })
  
  return booking
}
```

### Testing
After implementing the fix:

```bash
# 1. Create a booking (should use current court price)
curl -X POST http://localhost:3000/api/v1/bookings/confirm \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"holdId": "xxx", "price": 50000, "currency": "COP"}'

# 2. Try to create payment intent
curl -X POST http://localhost:3000/api/v1/payments/stripe/create-intent \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"bookingId": "xxx"}'

# Expected response:
# {
#   "paymentId": "...",
#   "clientSecret": "pi_xxx_secret_xxx",
#   "amount": 50000,  // ✅ Should be 50,000 COP, not 500
#   "currency": "cop"
# }
```

### Summary
**Root Cause**: Backend using stale booking price instead of current court price  
**Impact**: All payments fail with Stripe minimum amount error  
**Fix**: Recalculate price from court's current hourlyRate when creating payment intent  
**Priority**: 🔴 CRITICAL - Blocks all payments

## Contact
Frontend team has confirmed:
- ✅ JWT token is being sent correctly
- ✅ Booking ID is correct
- ✅ User is authenticated
- ✅ Request format is correct
- ✅ Stripe integration is working correctly
- ❌ **Backend court prices are below Stripe's minimum**

## Next Steps
1. Backend team investigates booking creation in `/bookings/confirm`
2. Verify userId assignment during booking creation
3. Update payment authorization logic if needed
4. Test with the problematic booking ID
5. Deploy fix
6. Notify frontend team to retest
