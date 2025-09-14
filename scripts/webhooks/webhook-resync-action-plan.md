# 🔄 WEBHOOK RESYNC ACTION PLAN FOR DANO

## 📊 Current Status Summary

### ✅ **What's Working:**
- Dano's user account: `dano@retail-products.com` (ID: `01K1VBYYV7TRPY04NW4TW4XWRB`)
- Workspace: Retail Product Solutions (`01K1VBYV8ETM2RCQA4GNN9EG72`)
- Production data: 1,344 leads, 279 prospects, real-time counts working
- Webhook endpoints: Both `/api/webhooks/outlook` and `/api/webhooks/zoho` are responding
- Database structure: All tables and relationships properly configured

### ⚠️ **What Needs Fixing:**

#### 1. Microsoft Graph Email Webhooks
- **Status**: Token EXPIRED (August 15, 2025)
- **Issue**: No active webhook subscriptions (0 found)
- **Impact**: New emails to dano@retail-products.com won't trigger real-time updates

#### 2. Zoho CRM Integration  
- **Status**: Token EXPIRED (August 15, 2025)
- **Issue**: Refresh token also expired/invalid
- **Impact**: Zoho CRM updates won't automatically sync to Adrata

---

## 🎯 **IMMEDIATE ACTION REQUIRED**

### Step 1: Reconnect Microsoft Account (5 minutes)
**Dano needs to:**
1. Go to: https://action.adrata.com
2. Login as `dano` (password: `danopass` or `DanoIsGreat01!`)
3. Click profile icon (bottom left)
4. Click "Grand Central" 
5. Click "Reconnect Microsoft Account"
6. Sign in with: `dano@retail-products.com`
7. Accept all permissions

**Result:** Real-time email notifications will be restored

### Step 2: Reconnect Zoho CRM Account (5 minutes)  
**Dano needs to:**
1. Same login process as above
2. In Grand Central, click "Reconnect Zoho CRM"
3. Sign in with Zoho CRM credentials
4. Accept all permissions

**Result:** Zoho API access will be restored

### Step 3: Configure Zoho Webhooks (15 minutes)
**Dano needs to set up in Zoho CRM UI:**

#### Create 4 Webhooks:
Go to: **Setup > Automation > Actions > Webhooks**

| Webhook Name | URL | Method | Module |
|--------------|-----|--------|---------|
| Adrata Lead Sync | https://action.adrata.com/api/webhooks/zoho | POST | Leads |
| Adrata Contact Sync | https://action.adrata.com/api/webhooks/zoho | POST | Contacts |
| Adrata Deal Sync | https://action.adrata.com/api/webhooks/zoho | POST | Deals |
| Adrata Account Sync | https://action.adrata.com/api/webhooks/zoho | POST | Accounts |

#### Create 4 Workflow Rules:
Go to: **Setup > Automation > Workflow Rules**

| Rule Name | Module | Trigger | Action |
|-----------|--------|---------|---------|
| Leads Auto-Sync | Leads | Create/Update/Delete | Adrata Lead Sync webhook |
| Contacts Auto-Sync | Contacts | Create/Update/Delete | Adrata Contact Sync webhook |
| Deals Auto-Sync | Deals | Create/Update/Delete | Adrata Deal Sync webhook |
| Accounts Auto-Sync | Accounts | Create/Update/Delete | Adrata Account Sync webhook |

---

## 🧪 **Testing & Verification**

### Test Email Sync:
1. Send email to: `dano@retail-products.com`
2. Check Adrata leads list within 30 seconds
3. Verify "Last Contact" timestamp updated

### Test Zoho Sync:
1. Update a lead/contact in Zoho CRM
2. Check Adrata interface within 30 seconds  
3. Verify changes appear automatically

---

## 🔧 **Technical Details**

### Webhook Endpoints Status:
- ✅ `https://action.adrata.com/api/webhooks/outlook` - Active
- ✅ `https://action.adrata.com/api/webhooks/zoho` - Active

### Database Tables Ready:
- ✅ `email_accounts` - Email account management
- ✅ `webhook_subscriptions` - Webhook tracking
- ✅ `provider_tokens` - OAuth token storage
- ✅ `leads`, `prospects`, `contacts` - Data storage

### Scripts Available:
- ✅ `scripts/webhooks/resync-dano-webhooks.js` - Microsoft Graph resync
- ✅ `scripts/webhooks/refresh-zoho-token.js` - Zoho token refresh
- ✅ `scripts/webhooks/check-zoho-status.js` - Status checking

---

## 🎉 **Expected Results After Resync**

### Real-time Email Integration:
- New emails → Instant webhook → Updated lead "Last Contact"
- Buying signals detected → Speedrun prioritization
- Email thread tracking → Complete conversation history

### Real-time Zoho Integration:
- Zoho lead update → Instant webhook → Adrata sync
- Zoho contact changes → Real-time reflection
- Zoho deal progress → Pipeline updates

### Data Flow:
```
Email Arrives → Microsoft Graph → Webhook → Adrata → UI Update (< 30 seconds)
Zoho Update → Webhook → Adrata → Database → UI Update (< 30 seconds)
```

---

## 🚨 **Troubleshooting**

If issues persist after reconnection:

### Microsoft Graph Issues:
```bash
node scripts/webhooks/resync-dano-webhooks.js
```

### Zoho Issues:
```bash
node scripts/webhooks/refresh-zoho-token.js
```

### Status Check:
```bash
node scripts/webhooks/check-zoho-status.js
```

---

## 📞 **Support**

If Dano encounters any issues:
1. Check this action plan first
2. Run the troubleshooting scripts
3. Contact development team with specific error messages

**Priority**: HIGH - Real-time data sync is critical for sales effectiveness
