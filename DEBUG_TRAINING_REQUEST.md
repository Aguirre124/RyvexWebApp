# Debug Training Match Request

## Added Logging

I've added comprehensive logging to help debug the issue:

### 1. TrainingInfoStep.tsx
Now logs the exact payload before sending:
```
🔍 Training Match Payload: {...}
✅ flowType: TRAINING
✅ homeTeamId: [uuid]
✅ awayTeamId: [uuid]
✅ Teams are identical: true
```

### 2. apiClient.ts
Now logs both request and response:
```
🚀 API Request: {method, url, data}
✅ API Response: {status, data}
❌ API Error Response: {status, data, message}
```

## How to Debug

1. **Open browser DevTools** (F12)
2. **Go to Console tab**
3. **Try creating a Training match**
4. **Look for these logs**:

### Expected Logs:
```
🔍 Training Match Payload:
{
  "sportId": "cm5blgkv70002upqaxabvb2ip",
  "matchType": "FRIENDLY",
  "flowType": "TRAINING",
  "homeTeamId": "cm5blshws0001140eocwsfjdw",
  "awayTeamId": "cm5blshws0001140eocwsfjdw"
}
✅ flowType: TRAINING
✅ homeTeamId: cm5blshws0001140eocwsfjdw
✅ awayTeamId: cm5blshws0001140eocwsfjdw
✅ Teams are identical: true

🚀 API Request:
{
  "method": "POST",
  "url": "/matches",
  "data": {
    "sportId": "cm5blgkv70002upqaxabvb2ip",
    "matchType": "FRIENDLY",
    "flowType": "TRAINING",
    "homeTeamId": "cm5blshws0001140eocwsfjdw",
    "awayTeamId": "cm5blshws0001140eocwsfjdw"
  }
}
```

### If Backend Returns Error:
```
❌ API Error Response:
{
  "status": 400,
  "data": {
    "message": "home team and away team must be different",
    "error": "Bad Request",
    "statusCode": 400
  }
}
```

## What to Share with Backend

Take a screenshot or copy the console logs and share with backend team. This will show them:

1. ✅ **Frontend IS sending flowType: "TRAINING"**
2. ✅ **Frontend IS sending identical homeTeamId and awayTeamId**
3. ✅ **Frontend IS verifying they're identical before sending**

## Possible Backend Issues

If the logs show we're sending correct data but still getting the error, the backend may have:

1. **Validation running before flowType is checked**
   - The validation might be in a DTO decorator that runs before the service logic
   - Solution: Move validation to service layer or add conditional logic in DTO

2. **Database trigger or constraint**
   - A CHECK constraint at database level rejecting same team
   - Solution: Update constraint to allow when flowType = 'TRAINING'

3. **Middleware or interceptor**
   - Some middleware validating before reaching the controller
   - Solution: Update middleware to skip validation for TRAINING

4. **TypeScript validation in DTO**
   - Class-validator decorators might be blocking
   - Example:
   ```typescript
   @Validate((value, args) => {
     // This runs BEFORE service logic
     if (args.object.homeTeamId === args.object.awayTeamId) {
       return false; // ❌ This blocks TRAINING
     }
     return true;
   })
   ```
   - Solution: Add flowType check in validator

## Next Steps

1. Run the app: `npm run dev`
2. Try creating a Training match
3. Check browser console
4. Share the logs with backend team showing we're sending correct data
5. Backend needs to check WHERE the validation is happening (DTO vs Service vs DB)
