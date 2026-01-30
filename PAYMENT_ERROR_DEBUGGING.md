# Payment Error Debugging Guide

## Current Issue: 403 Forbidden Error

The payment modal is showing a **403 Forbidden** error when trying to create a payment intent. This typically means one of the following:

### Possible Causes:

#### 1. **Authentication Token Issue** (Most Likely)
- The JWT token might be expired
- The token might be missing
- The user might not be authenticated

**How to Check:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for these logs:
   - `🔑 Auth token exists: true/false`
   - `🔑 Token preview: ...`
4. Go to Application tab → Local Storage → `ryvex-auth`
5. Check if the token exists and looks valid

**How to Fix:**
```bash
# Log out and log back in
1. Clear local storage in browser DevTools
2. Go to /login
3. Log in again
4. Try payment again
```

#### 2. **Backend Endpoint Not Implemented**
- The `/payments/stripe/create-intent` endpoint might not exist yet on the backend
- The endpoint might not be accessible to regular users

**How to Check:**
1. Look at the Network tab in DevTools
2. Find the failed request to `create-intent`
3. Click on it and check the Response tab
4. Look for error message from backend

**Expected Backend Response for 403:**
```json
{
  "message": "Forbidden",
  "error": "You don't have permission to access this resource"
}
```

**How to Fix:**
- Contact backend team to implement the payment endpoints
- Or wait for backend deployment

#### 3. **Backend Permission Issue**
- The user role might not have permission to create payments
- The booking might belong to another user

**How to Check:**
1. Console should show: `🔐 Creating payment intent for booking: <id>`
2. Verify the booking ID is correct
3. Check if the booking belongs to the logged-in user

**How to Fix:**
- Ensure the booking was created by the logged-in user
- Check backend permissions/roles

### Debugging Steps:

#### Step 1: Check Console Logs
Open the browser console and look for these messages when you click "Pagar y reservar":

```
💳 Opening payment modal for booking: <bookingId>
💳 PaymentModal mounted with bookingId: <bookingId>
🔑 Auth token exists: true
🔑 Token preview: eyJhbGciOiJIUzI1Ni...
🔐 Creating payment intent for booking: <bookingId>
```

If you see:
- ❌ `⚠️ No auth storage found` → **User not logged in**
- ❌ `🔑 Auth token exists: false` → **Token missing**
- ❌ `Failed to create payment intent: 403` → **Authentication or permission issue**

#### Step 2: Check Network Request
1. Open DevTools → Network tab
2. Click "Pagar y reservar"
3. Look for the POST request to `/payments/stripe/create-intent`
4. Check the Request Headers → Authorization header
5. Should see: `Authorization: Bearer eyJhbGciOiJIUzI1Ni...`

If Authorization header is **missing**:
- Token not in localStorage
- apiClient interceptor not working
- Need to log in again

#### Step 3: Check Backend Response
Click on the failed request in Network tab and check:

**Response Status: 403**
```json
{
  "message": "Forbidden",
  "error": "Insufficient permissions"
}
```

**Possible Backend Messages:**
- "Unauthorized" → Token invalid/expired
- "Forbidden" → No permission
- "Endpoint not found" → Backend not implemented
- "Invalid booking" → Booking doesn't exist or doesn't belong to user

#### Step 4: Test Authentication
Try another authenticated endpoint to verify token works:

```javascript
// Open browser console and run:
const authStorage = localStorage.getItem('ryvex-auth')
const authData = JSON.parse(authStorage)
console.log('Token:', authData.state?.token)
console.log('User:', authData.state?.user)

// Try fetching match summary (this should work)
fetch('https://lated-regardlessly-harland.ngrok-free.dev/api/v1/matches/<matchId>', {
  headers: {
    'Authorization': `Bearer ${authData.state?.token}`,
    'ngrok-skip-browser-warning': 'true'
  }
}).then(r => r.json()).then(console.log)
```

If match summary works but payment doesn't → **Backend payment endpoint issue**

### Solutions:

#### Solution 1: Re-authenticate
```bash
1. Click on your profile/logout
2. Log out completely
3. Log back in with your credentials
4. Navigate back to match summary
5. Try payment again
```

#### Solution 2: Check Booking ID
```javascript
// Open browser console
const draftStore = localStorage.getItem('ryvex-match-draft-storage')
const draft = JSON.parse(draftStore)
console.log('Booking ID:', draft.state.bookingId)

// If null → booking wasn't created properly
// Try scheduling the venue/court again
```

#### Solution 3: Clear and Restart
```bash
1. Clear browser cache and local storage
2. Close all browser tabs
3. Open new tab → navigate to app
4. Log in fresh
5. Create a new match
6. Schedule venue/court
7. Try payment
```

#### Solution 4: Contact Backend Team
If all above fails, the backend might not have the payment endpoints ready.

**Required Backend Endpoints:**
```
POST /api/v1/payments/stripe/create-intent
Body: { bookingId: string }
Headers: { Authorization: Bearer <token> }
Response: { paymentId: string, clientSecret: string, amount: number, currency: string }

POST /api/v1/payments/stripe/confirm  
Body: { paymentId: string }
Headers: { Authorization: Bearer <token> }
Response: { status: string, bookingId: string }
```

### Additional Checks:

#### Check if booking exists in backend
```bash
# In terminal/Postman, make request to:
GET https://lated-regardlessly-harland.ngrok-free.dev/api/v1/bookings/<bookingId>
Headers: 
  Authorization: Bearer <your-token>
  ngrok-skip-browser-warning: true

# Should return booking details
# If 404 → booking doesn't exist (need to reschedule)
```

#### Verify Stripe key is set
```bash
# Check .env file
cat .env | grep STRIPE

# Should see:
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# If missing, add it and restart dev server
```

### Quick Fix Checklist:

- [ ] User is logged in (check localStorage `ryvex-auth`)
- [ ] Token exists and is not expired
- [ ] Booking ID exists in draft store
- [ ] Backend is accessible (other API calls work)
- [ ] Backend payment endpoints are implemented
- [ ] Stripe key is set in .env
- [ ] Dev server was restarted after adding Stripe key
- [ ] Browser cache is cleared
- [ ] No CORS errors in console

### Contact Information:

**If issue persists:**
1. Take screenshot of Console tab (all errors)
2. Take screenshot of Network tab (failed request + response)
3. Copy the booking ID from console logs
4. Share with backend team or technical lead

**Logs to include:**
- All console messages starting with 🔐, 🔑, 💳, ✅, ❌
- Network request/response for `create-intent`
- Current booking ID
- User ID/email

---

## Current Enhanced Logging

The code now includes detailed console logging:

### When clicking "Pagar y reservar":
```
💳 Opening payment modal for booking: <id>
```

### When modal opens:
```
💳 PaymentModal mounted with bookingId: <id>
🔑 Auth token exists: true/false
🔑 Token preview: eyJ... (first 20 chars)
```

### When creating payment intent:
```
🔐 Creating payment intent for booking: <id>
✅ Payment intent created: { paymentId, clientSecret, ... }
// OR
❌ Failed to create payment intent: Error
Error response: { data, status, ... }
```

### When confirming payment:
```
✅ Confirming payment on backend: <paymentId>
✅ Payment confirmed on backend: { status, bookingId }
// OR
❌ Failed to confirm payment: Error
```

**Monitor these logs to identify the exact failure point!**
