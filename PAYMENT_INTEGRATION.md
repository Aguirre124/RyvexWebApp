# Stripe Payment Integration

## Overview
The application now includes Stripe payment integration for venue booking confirmation. Users can pay for their court reservations directly within the app using Stripe Elements.

## Setup

### 1. Install Dependencies
```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### 2. Environment Variables
Add the Stripe publishable key to your `.env` file:
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_STRIPE_TEST_KEY_HERE
```

For production, use a live key:
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_STRIPE_LIVE_KEY
```

### 3. Backend Integration
Ensure your backend has the following endpoints:

#### Create Payment Intent
```
POST /api/v1/payments/stripe/create-intent
Body: { bookingId: string }
Response: { paymentId: string, clientSecret: string, amount: number, currency: string }
```

#### Confirm Payment
```
POST /api/v1/payments/stripe/confirm
Body: { paymentId: string }
Response: { status: string, bookingId: string }
```

## Architecture

### Files Created

#### 1. `src/payments/stripe.ts`
- Initializes Stripe with the publishable key
- Exports `stripePromise` for use throughout the app

#### 2. `src/services/payments.api.ts`
- Contains API functions for payment operations
- `createStripeIntent(bookingId)` - Creates a payment intent
- `confirmStripePayment(paymentId)` - Confirms payment on the backend

#### 3. `src/features/payments/components/PaymentModal.tsx`
- Full payment UI with Stripe Elements
- Handles card input, validation, and submission
- Shows loading states and error messages
- Accepts props: open, onClose, bookingId, venueName, courtName, scheduledLabel, onSuccess

### Files Modified

#### 1. `src/store/matchDraft.store.ts`
- Added `bookingId` field to store the confirmed booking ID
- Updated `setVenueBooking` to accept `bookingId`

#### 2. `src/features/venues/components/SchedulingPanel.tsx`
- Saves `bookingId` when booking is confirmed
- Stores it in the draft store for later payment

#### 3. `src/features/matches/summary/MatchSummaryPage.tsx`
- Imports and displays `PaymentModal`
- Adds "Pagar y reservar" button when booking exists
- Handles payment success and refetches summary

## User Flow

1. User creates a match and selects teams/format
2. User navigates to venue selection
3. User selects venue → court → time slot
4. System creates a hold on the slot (15 min expiry)
5. System auto-confirms booking (creates booking record)
6. User is taken to match summary page
7. **NEW**: "Pagar y reservar" button appears
8. User clicks button → PaymentModal opens
9. User enters card details (test card: 4242 4242 4242 4242)
10. User clicks "Pagar" button
11. System processes payment via Stripe
12. On success, booking is marked as paid
13. Modal closes and summary refreshes

## Testing

### Test Cards (Stripe Test Mode)
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Auth**: `4000 0025 0000 3155`

Use any future expiry date, any 3-digit CVC, and any name.

### Test Flow
1. Start dev server: `npm run dev`
2. Create a new match
3. Select venue and schedule time
4. Verify booking is created (check store)
5. Click "Pagar y reservar" on summary page
6. Enter test card details
7. Submit payment
8. Verify success message
9. Check backend logs for payment confirmation

## UI Components

### PaymentModal Features
- **Dark Theme**: Styled to match app theme with #AAD62F primary color
- **Card Element**: Stripe-hosted secure card input
- **Name Input**: Cardholder name field
- **Amount Display**: Shows total in COP currency
- **Error Handling**: Inline error messages with red styling
- **Loading States**: Disabled buttons and "Procesando..." text
- **Responsive**: Works on mobile and desktop
- **Accessibility**: Proper labels and ARIA attributes

### Button States
- **Cancelar**: Secondary button to close modal
- **Pagar {amount}**: Primary button to submit payment
- Disabled during processing
- Shows amount in COP format (e.g., "Pagar $50.000")

## Error Handling

### Frontend Errors
- Card validation errors (invalid number, expired, etc.)
- Network errors (timeout, no connection)
- Backend errors (insufficient funds, etc.)
- All errors display inline with user-friendly messages

### Backend Integration
- 404: Court/booking not found
- 409: Booking already paid or cancelled
- 500: Server error
- All handled with appropriate user messages

## Security

### Best Practices Implemented
✅ Never store card details on frontend
✅ Use Stripe Elements for PCI compliance
✅ Transmit only payment intent secret
✅ Verify payment on backend
✅ JWT authentication for all API calls
✅ HTTPS required for production

### Environment Security
- Keep `.env` file out of version control
- Never commit Stripe keys
- Use different keys for test/production
- Rotate keys periodically

## Future Enhancements

### Possible Improvements
- [ ] Add payment status badge ("Pagado" indicator)
- [ ] Disable "Cambiar cancha" after payment
- [ ] Add payment receipt/confirmation email
- [ ] Support multiple payment methods (Apple Pay, Google Pay)
- [ ] Add refund functionality for cancellations
- [ ] Payment history page
- [ ] Split payments between multiple users
- [ ] Discount codes/promotions

## Troubleshooting

### "Stripe is not defined"
- Verify `VITE_STRIPE_PUBLISHABLE_KEY` is set
- Check `.env` file is in root directory
- Restart dev server after adding env var

### "Missing required parameter"
- Ensure backend returns correct structure
- Check API endpoint URLs match backend routes
- Verify JWT token is valid

### "Card declined"
- Use test card `4242 4242 4242 4242`
- Check backend has hourlyRate set for court
- Verify booking exists and is valid

### Modal not appearing
- Check `storedBookingId` exists in store
- Verify booking was confirmed successfully
- Check browser console for errors

## Support

For issues with:
- **Stripe SDK**: https://stripe.com/docs/js
- **Backend Integration**: Contact backend team
- **UI/UX**: Check component props and styling
