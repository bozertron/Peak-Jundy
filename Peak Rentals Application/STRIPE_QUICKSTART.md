# Quick Start: Stripe Connect Integration

## 🚀 5-Minute Setup

### 1. Get Your Stripe Keys
1. Go to https://dashboard.stripe.com
2. Click **Developers** (bottom left)
3. Select **API Keys**
4. Copy your test keys

### 2. Configure Environment
```bash
cd "Peak Rentals Project"
cp .env.example .env.local
```

Edit `.env.local` and add:
```dotenv
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLIC_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_test_YOUR_WEBHOOK_SECRET_HERE
PLATFORM_FEE_BPS=1000  # 10% platform fee
```

### 3. Set Up Webhooks (Local Testing)
```bash
# Install Stripe CLI from https://stripe.com/docs/stripe-cli

# Start listening for events
stripe listen --forward-to http://localhost:3000/api/stripe/webhook

# Copy the webhook secret output and add to .env.local
```

### 4. Start the App
```bash
npm run dev
```

Visit http://localhost:3000

---

## 🔄 Owner Onboarding Flow

### Step 1: Owner Signs Up
- User creates account and verifies email

### Step 2: Owner Clicks "Get Started with Stripe"
- Button sends request to `POST /api/stripe/connect/account`
- Connected account created automatically
- Owner redirected to Stripe's onboarding page

### Step 3: Owner Completes Onboarding
- Verify identity
- Add banking information
- Accept agreement
- Redirect back to dashboard

### Step 4: Check Status
- Dashboard polls `GET /api/stripe/connect/account-status`
- Shows requirements and readiness
- Green checkmark when ready! ✅

---

## 💳 Customer Checkout Flow

### Step 1: Customer Browses Equipment
- Visits `/browse` page
- Sees storefront with all equipment

### Step 2: Customer Clicks "Rent Now"
- App creates checkout session
- `POST /api/stripe/checkout`
- Redirected to Stripe's payment page

### Step 3: Customer Pays
- Enters card details securely
- Stripe processes payment
- Funds split automatically:
  - Platform fee (10%)
  - Owner payout (90%)

### Step 4: Confirmation
- Success page shown
- Owner receives payout to bank account
- Email confirmation sent

---

## 🧪 Test Data

### Test Cards (Stripe Test Mode)
```
Success: 4242 4242 4242 4242
Requires Auth: 4000 0025 0000 3155
Declined: 4000 0000 0000 0002
```

Expiry: Any future date (e.g., 12/25)  
CVC: Any 3 digits (e.g., 123)

---

## 📡 API Examples

### Create Connected Account
```bash
curl -X POST http://localhost:3000/api/stripe/connect/account \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "John Doe",
    "contactEmail": "john@example.com"
  }'
```

Response:
```json
{
  "success": true,
  "accountId": "acct_1234567890"
}
```

### Get Account Status
```bash
curl http://localhost:3000/api/stripe/connect/account-status?accountId=acct_1234567890
```

Response:
```json
{
  "success": true,
  "status": {
    "accountId": "acct_1234567890",
    "readyForPayments": true,
    "currentlyDue": [],
    "pastDue": []
  }
}
```

### Create Checkout Session
```bash
curl -X POST http://localhost:3000/api/stripe/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "priceId": "price_1234567890",
    "quantity": 1,
    "connectedAccountId": "acct_1234567890"
  }'
```

Response:
```json
{
  "success": true,
  "sessionId": "cs_test_1234567890",
  "url": "https://checkout.stripe.com/pay/cs_test_1234567890"
}
```

---

## 🔍 Debugging Tips

### Check Webhook Events
```bash
# View recent events
stripe events list

# Trigger test event
stripe trigger account.updated
```

### View Connected Account in Dashboard
```bash
stripe trigger account.external_account.created --account acct_YOUR_ACCOUNT_ID
```

### Monitor Logs
```bash
# Terminal 1: Start Next.js
npm run dev

# Terminal 2: Start Stripe CLI
stripe listen --forward-to http://localhost:3000/api/stripe/webhook

# Terminal 3: Watch logs
tail -f .env.local | grep STRIPE
```

---

## 🚨 Common Issues & Solutions

### "STRIPE_SECRET_KEY is not configured"
**Solution:** Add `STRIPE_SECRET_KEY=sk_test_...` to `.env.local`

### "Webhook signature verification failed"
**Solution:** 
1. Make sure `STRIPE_WEBHOOK_SECRET` matches Stripe CLI output
2. Restart Stripe CLI listener
3. Check Stripe CLI is running on correct port

### "Account not ready for payments"
**Solution:**
1. Complete owner onboarding at Stripe
2. Verify identity and banking
3. Wait 24-48 hours for Stripe review
4. Check for pending requirements

### "Checkout not redirecting"
**Solution:**
1. Make sure `NEXTAUTH_URL` is set correctly
2. Verify Stripe publishable key is correct
3. Check browser console for errors

---

## 📚 Next Steps

1. ✅ Test owner onboarding
2. ✅ Test customer checkout
3. ✅ Verify funds in test Stripe account
4. ✅ Check webhook events
5. ✅ Deploy to staging
6. ✅ Get Stripe account review approval
7. ✅ Switch to production keys
8. ✅ Go live!

---

## 💡 Pro Tips

### Viewing Test Funds
After a test payment:
1. Go to https://dashboard.stripe.com
2. Navigate to **Payments**
3. Click on the charge to see details
4. Check **Connected Accounts** for owner payouts

### Simulating Requirement Updates
```bash
# Create test event for requirement updates
stripe trigger account.updated --account acct_YOUR_ACCOUNT_ID
```

### Testing Webhook Failures
```bash
# Manually send webhook
stripe trigger account.updated --account acct_YOUR_ACCOUNT_ID
```

### Monitor Performance
- Check API response times in browser DevTools
- Monitor Stripe Dashboard for transaction volume
- Review webhook delivery status in Developers > Webhooks

---

## ✅ Success Checklist

- [ ] Stripe keys configured in `.env.local`
- [ ] Stripe CLI listening for webhooks
- [ ] Owner can create connected account
- [ ] Owner can complete onboarding
- [ ] Storefront displays equipment
- [ ] Customer can checkout with test card
- [ ] Webhook events received and logged
- [ ] Status updates in real-time
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] Build succeeds: `npm run build`

---

## 🎉 You're Ready!

Your Stripe Connect integration is ready to use. Start testing now and proceed to production when ready.

Need help? Check the [IMPLEMENTATION_REPORT.md](/workspaces/Peak-R/IMPLEMENTATION_REPORT.md) for detailed documentation.

**Happy coding! 🚀**
