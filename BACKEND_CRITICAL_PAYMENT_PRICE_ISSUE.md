# 🔴 CRITICAL: Payment Intent Using Stale Booking Price

**Status**: BLOCKING ALL PAYMENTS  
**Priority**: P0 - Critical  
**Date**: January 29, 2026

---

## 🚨 Issue Summary

**Payment creation fails because the backend is using the booking's saved price (500 COP) instead of recalculating from the court's current hourlyRate (50,000 COP).**

### Error Message:
```
Amount must convert to at least 50 cents. $500.00 COP converts to approximately $0.14 USD.
```

### Current State:
- ✅ Court hourlyRate updated to 50,000 COP in database
- ✅ Frontend displays correct price: $50,000 COP
- ❌ Backend sends wrong price to Stripe: $500 COP
- ❌ All payments fail with 400 error

---

## 🔍 Root Cause

**Endpoint**: `POST /api/v1/payments/stripe/create-intent`

**Current Logic (INCORRECT):**
```typescript
async createStripeIntent(bookingId: string) {
  const booking = await prisma.booking.findUnique({ 
    where: { id: bookingId } 
  })
  
  // ❌ WRONG: Using old saved price from booking
  const amount = booking.price // 500 COP from old booking
  
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100,
    currency: 'cop'
  })
}
```

**Problem**: The booking record was created when the court cost 500 COP. The booking saved that price to the database. Even though the court's hourlyRate was updated to 50,000 COP, the booking's saved price field still shows 500 COP.

---

## ✅ Required Fix

**Recalculate price from court's CURRENT hourlyRate when creating payment intent:**

```typescript
async createStripeIntent(bookingId: string, userId: string) {
  // 1. Fetch booking with court relationship
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { 
      court: true,
      match: true 
    }
  })
  
  if (!booking) {
    throw new NotFoundException('Booking not found')
  }
  
  // 2. Verify authorization
  const isAuthorized = 
    booking.userId === userId || 
    booking.match?.creatorId === userId
    
  if (!isAuthorized) {
    throw new ForbiddenException('Not authorized')
  }
  
  // 3. ✅ Recalculate price from CURRENT court hourlyRate
  const court = booking.court
  if (!court.hourlyRate) {
    throw new BadRequestException('Court has no hourlyRate')
  }
  
  const durationHours = booking.durationMin / 60
  const currentPrice = Math.round(court.hourlyRate * durationHours)
  
  // 4. Validate Stripe minimum ($0.50 USD ≈ 2,000 COP)
  if (currentPrice < 2000) {
    throw new BadRequestException(
      `Price ${currentPrice} COP is below Stripe minimum (2,000 COP required)`
    )
  }
  
  // 5. Create Stripe payment intent with RECALCULATED price
  const paymentIntent = await stripe.paymentIntents.create({
    amount: currentPrice * 100, // ✅ Use current price
    currency: booking.currency || 'cop',
    metadata: {
      bookingId: booking.id,
      courtId: booking.courtId,
      matchId: booking.matchId,
      userId: userId,
      originalBookingPrice: booking.price, // For audit
      recalculatedPrice: currentPrice
    }
  })
  
  // 6. Save payment record
  const payment = await prisma.payment.create({
    data: {
      bookingId: booking.id,
      userId: userId,
      amount: currentPrice, // ✅ Current price
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

---

## 🧪 Testing Steps

### 1. Test Payment Intent Creation
```bash
curl -X POST https://your-api.com/api/v1/payments/stripe/create-intent \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"bookingId": "408ebecd-29fb-48f0-b063-b567b8d1235"}'
```

**Expected Response:**
```json
{
  "paymentId": "xxx",
  "clientSecret": "pi_xxx_secret_xxx",
  "amount": 50000,
  "currency": "cop"
}
```

**NOT:**
```json
{
  "statusCode": 400,
  "message": "Amount must convert to at least 50 cents. $500.00 COP..."
}
```

### 2. Verify Price Calculation
- Court hourlyRate: 50,000 COP
- Booking duration: 60 minutes
- Expected price: 50,000 COP (50,000 * 1 hour)

### 3. Test Full Payment Flow
1. Create booking via frontend
2. Click "Pagar y reservar"
3. Enter test card: `4242 4242 4242 4242`
4. Payment should succeed
5. Check Stripe dashboard - should show 50,000 COP charge

---

## 📋 Checklist

- [ ] Update `createStripeIntent` to fetch court with booking
- [ ] Add price recalculation logic using current `court.hourlyRate`
- [ ] Add validation for Stripe minimum (2,000 COP)
- [ ] Update payment record to save recalculated price
- [ ] Test with existing bookings (old prices)
- [ ] Test with new bookings (current prices)
- [ ] Verify Stripe dashboard shows correct amounts
- [ ] Deploy to staging
- [ ] Test end-to-end on staging
- [ ] Deploy to production
- [ ] Notify frontend team to retest

---

## 💡 Additional Considerations

### Option 1: Update Booking Price on Payment
```typescript
// After creating payment intent, update booking with current price
await prisma.booking.update({
  where: { id: bookingId },
  data: { 
    price: currentPrice,
    priceUpdatedAt: new Date()
  }
})
```

### Option 2: Always Recalculate on Booking Confirmation
Update `/bookings/confirm` to ALWAYS use current court price:
```typescript
const currentPrice = Math.round(court.hourlyRate * (durationMin / 60))
// Ignore client-provided price, use calculated price
```

### Database Migration (Optional)
Add audit fields to track price changes:
```sql
ALTER TABLE bookings 
ADD COLUMN original_price INT,
ADD COLUMN price_updated_at TIMESTAMP;
```

---

## 📊 Impact

**Without Fix:**
- ❌ 100% of payments fail
- ❌ Users cannot complete bookings
- ❌ Revenue blocked
- ❌ MVP payment feature non-functional

**With Fix:**
- ✅ Payments succeed with correct amounts
- ✅ Prices always reflect current court rates
- ✅ Stripe minimum requirement met
- ✅ MVP payment flow complete

---

## 🔗 Related Issues

- Initial authorization issue (RESOLVED)
- Court price update to 50,000 COP (RESOLVED)
- Stripe minimum amount requirement (DOCUMENTED)

---

## 📞 Contact

**Frontend Team**: Integration complete, waiting on backend fix  
**Backend Team**: Implement price recalculation in payment intent creation  
**Priority**: Deploy ASAP - blocking all payments

**Test Booking IDs:**
- `408ebecd-29fb-48f0-b063-b567b8d1235` (old 500 COP booking)
- `7e696821-3516-42a8-9d4c-2be5b70753d6` (recent booking)

**Test Court ID:**
- `fbe96d77-e17b-4573-a066-636c1c4a68393` (El Golazo 1, should be 50,000 COP)
