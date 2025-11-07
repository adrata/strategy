# 🚀 Production Deployment Guide - Vercel

## Overview

Complete production-ready system for ALL workspace customers with:
- Real-time data accuracy
- Automated enrichment
- Churn prediction & refresh scheduling
- Webhook integration
- AI proactive notifications

---

## ✅ What's Been Configured

### 1. Vercel Cron Jobs (vercel.json)

```json
{
  "crons": [
    // ... existing crons ...
    {
      "path": "/api/cron/data-refresh",
      "schedule": "0 2 * * *",
      "description": "Daily data refresh for high-risk contacts"
    },
    {
      "path": "/api/cron/enrich-all-workspaces",
      "schedule": "0 2 * * 0",
      "description": "Weekly enrichment for all workspace customers"
    }
  ]
}
```

**Cron Schedule:**
- **Daily (2am):** `/api/cron/data-refresh` - Refreshes red/orange/green priorities
- **Weekly (Sunday 2am):** `/api/cron/enrich-all-workspaces` - Enriches all workspaces

### 2. API Endpoints Created

| Endpoint | Purpose | Max Duration |
|----------|---------|--------------|
| `/api/v1/enrich` | Trigger enrichment for entities | 300s |
| `/api/v1/enrich/auto-trigger` | Auto-trigger on create/update | 30s |
| `/api/webhooks/coresignal-realtime` | Receive job change webhooks | 60s |
| `/api/ai/notifications` | Get AI proactive notifications | 30s |
| `/api/cron/data-refresh` | Scheduled data refresh | 300s |
| `/api/cron/enrich-all-workspaces` | Weekly workspace enrichment | 300s |

### 3. Real-Time System Components

**Scripts:**
- `real-time-system/RealTimeDataManager.js`
- `real-time-system/automated-refresh.js`
- `real-time-system/AINotificationGenerator.js`

**APIs:**
- Data refresh cron
- Webhook handler
- AI notifications

---

## 📦 Deployment Steps

### Step 1: Environment Variables

**Add to Vercel Dashboard** → Project Settings → Environment Variables:

```bash
# Core APIs
CORESIGNAL_API_KEY=your_key
ANTHROPIC_API_KEY=your_key

# Email Verification
ZEROBOUNCE_API_KEY=your_key
MYEMAILVERIFIER_API_KEY=your_key
PROSPEO_API_KEY=your_key

# Phone Verification
LUSHA_API_KEY=your_key
TWILIO_ACCOUNT_SID=your_key
TWILIO_AUTH_TOKEN=your_key

# Optional
PEOPLE_DATA_LABS_API_KEY=your_key
PERPLEXITY_API_KEY=your_key

# Security
CRON_SECRET=your_random_secret
CORESIGNAL_WEBHOOK_SECRET=your_webhook_secret
```

---

### Step 2: Deploy to Vercel

```bash
# Push to git
git add .
git commit -m "Add comprehensive enrichment and real-time system"
git push

# Vercel will auto-deploy from main branch
# Or manual deploy:
vercel --prod
```

**Vercel will automatically:**
- Set up cron jobs from vercel.json
- Configure API routes with maxDuration
- Enable webhooks
- Scale serverless functions

---

### Step 3: Initial Enrichment (One-Time)

**After deployment, run initial enrichment for all workspaces:**

```bash
# Trigger via API (runs async)
curl -X GET https://your-domain.vercel.app/api/cron/enrich-all-workspaces \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Or run locally:
```bash
cd scripts/_future_now/batch-enrichment

# Enrich each workspace
node enrich-all-workspaces.js "Adrata"
node enrich-all-workspaces.js "Notary Everyday"
node enrich-all-workspaces.js "CloudCaddie"
node enrich-all-workspaces.js "TOP Engineering Plus"
node enrich-all-workspaces.js "Demo"
node enrich-all-workspaces.js "Pinpoint"
```

---

### Step 4: Setup Coresignal Webhooks

```bash
# Setup webhooks for real-time job change detection
cd scripts/_future_now/scripts
node setup-coresignal-webhooks.js --workspace-id "01K7464TNANHQXPCZT1FYX205V"

# Webhook URL:
https://your-domain.vercel.app/api/webhooks/coresignal-realtime
```

---

### Step 5: Verify Cron Jobs

**Check Vercel Dashboard** → Project → Cron Jobs

Should see:
- ✅ `/api/cron/data-refresh` - Daily at 2am
- ✅ `/api/cron/enrich-all-workspaces` - Weekly (Sunday 2am)
- ✅ `/api/cron/email-sync` - Every 5 minutes
- ✅ `/api/cron/check-reminders` - Every minute

---

## 🔄 How It Works in Production

### Daily Data Refresh (2am)

```
EVERY DAY AT 2AM:
├── Vercel triggers /api/cron/data-refresh
├── Gets all active workspaces (6 workspaces)
│
├── For each workspace:
│   ├── Get people with refresh due (red/orange/green)
│   ├── Refresh data from Coresignal
│   ├── Detect changes
│   ├── Store changes for AI
│   └── Update refresh dates
│
└── Returns summary:
    {
      workspaces: 6,
      red: { checked: 24, refreshed: 24, changes: 2 },
      orange: { checked: 0, refreshed: 0, changes: 0 },
      green: { checked: 0, refreshed: 0, changes: 0 }
    }
```

### Weekly Enrichment (Sunday 2am)

```
EVERY SUNDAY AT 2AM:
├── Vercel triggers /api/cron/enrich-all-workspaces
├── Gets all active workspaces (6 workspaces)
│
├── For each workspace:
│   ├── Get people needing enrichment (unverified or stale)
│   ├── Get companies needing enrichment
│   ├── Queue enrichment jobs
│   └── Process enrichments
│
└── Returns summary:
    {
      workspaces: 6,
      peopleEnriched: 142,
      companiesEnriched: 38
    }
```

### Real-Time Webhooks (Instant)

```
WHEN PERSON CHANGES JOB:
├── Coresignal detects change on LinkedIn
├── Sends webhook to: /api/webhooks/coresignal-realtime
│
├── Our system:
│   ├── Verifies signature (security)
│   ├── Checks idempotency (no duplicates)
│   ├── Finds person in database
│   ├── Stores change for AI notification
│   ├── If in buyer group → triggers re-run
│   └── Updates person record
│
└── AI Panel (next poll):
    Shows: "🚨 Jane left Acme Corp"
    Action: "Re-run buyer group?"
```

---

## 🎯 Multi-Workspace Support

### Automatic for All Customers

The system automatically works for ALL workspaces:

**6 Active Workspaces:**
1. ✅ **Adrata** (Dan's) - Sales intelligence
2. ✅ **Notary Everyday** - Notary platform  
3. ✅ **CloudCaddie** - Golf management
4. ✅ **TOP Engineering Plus** - Engineering
5. ✅ **Demo** - Demo workspace
6. ✅ **Pinpoint** - (purpose TBD)

**Cron jobs process ALL workspaces automatically:**
- Daily refresh: Checks all 6 workspaces
- Weekly enrichment: Enriches all 6 workspaces
- Webhooks: Monitor people from all workspaces

**No manual intervention needed per workspace!**

---

## 📊 Monitoring

### Vercel Dashboard

**Cron Jobs Tab:**
- View execution history
- See success/failure rates
- Check duration per run
- View logs

**Functions Tab:**
- Monitor API endpoint performance
- Check execution duration
- View invocation counts

**Logs Tab:**
- Real-time logs
- Filter by endpoint
- Search for errors

### Database Monitoring

**Key Metrics:**
```sql
-- Email verification rate
SELECT 
  w.name,
  COUNT(*) as total,
  SUM(CASE WHEN email_verified THEN 1 ELSE 0 END) as verified,
  ROUND(SUM(CASE WHEN email_verified THEN 1 ELSE 0 END)::float / COUNT(*) * 100) as rate
FROM people p
JOIN workspaces w ON p.workspace_id = w.id
WHERE p.deleted_at IS NULL
GROUP BY w.name;

-- Phone discovery rate
SELECT 
  w.name,
  COUNT(*) as total,
  SUM(CASE WHEN phone_verified THEN 1 ELSE 0 END) as verified
FROM people p
JOIN workspaces w ON p.workspace_id = w.id
WHERE p.deleted_at IS NULL
GROUP BY w.name;

-- Churn risk distribution
SELECT 
  w.name,
  custom_fields->>'churnPrediction'->>'refreshColor' as color,
  COUNT(*) as count
FROM people p
JOIN workspaces w ON p.workspace_id = w.id
WHERE p.deleted_at IS NULL 
  AND p.is_buyer_group_member = true
GROUP BY w.name, color;
```

---

## 🧪 Testing in Production

### Test Cron Jobs

```bash
# Trigger manually (for testing)
curl https://your-domain.vercel.app/api/cron/data-refresh \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

curl https://your-domain.vercel.app/api/cron/enrich-all-workspaces \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Test Webhooks

```bash
# Send test webhook
curl -X POST https://your-domain.vercel.app/api/webhooks/coresignal-realtime \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test_123",
    "type": "person.company_change",
    "person": { "name": "Test", "email": "test@test.com" },
    "oldCompany": "Old Corp",
    "newCompany": "New Corp"
  }'
```

### Test AI Notifications

```bash
# Check notifications
curl https://your-domain.vercel.app/api/ai/notifications \
  -H "Cookie: your-session-cookie"
```

---

## 💰 Cost Management

### Vercel Costs
- **Cron executions:** Included in Pro plan
- **Function invocations:** 100GB-hours/month included
- **Expected:** Well within limits

### API Costs (Monthly)

**Per Workspace (100 people):**
- Red priority (10 people × daily): $3.00/month
- Orange priority (30 people × weekly): $1.20/month
- Green priority (60 people × monthly): $0.60/month
- **Total:** ~$4.80/month per 100 people

**All 6 Workspaces (~1,000 people):**
- Estimated: ~$48/month
- With webhooks: ~$38/month (20% savings)
- Weekly enrichment: ~$20/month
- **Total:** ~$60/month for complete system

---

## 🎯 Success Criteria

### System Health Checklist

- [ ] Cron jobs running daily/weekly
- [ ] All workspaces being processed
- [ ] Email verification rate > 90%
- [ ] Phone discovery rate > 75%
- [ ] No errors in Vercel logs
- [ ] AI notifications working
- [ ] Webhooks receiving events
- [ ] Buyer group re-runs triggering

### Data Quality Metrics

**Target (30 days after deployment):**
- ✅ 95%+ emails verified
- ✅ 80%+ phones discovered
- ✅ 100% companies enriched
- ✅ All churn predictions calculated
- ✅ All refresh schedules set

---

## 🚨 Troubleshooting

### Cron Jobs Not Running

1. Check Vercel Dashboard → Cron Jobs tab
2. Verify cron schedule syntax
3. Check function maxDuration (should be 300s)
4. Review logs for errors

### Enrichment Not Working

1. Check environment variables in Vercel
2. Verify API keys are valid
3. Check Vercel function logs
4. Test endpoint manually

### Webhooks Not Received

1. Verify webhook URL in Coresignal dashboard
2. Check webhook secret matches
3. Test with manual webhook
4. Review webhook event table

---

## 📋 Post-Deployment Checklist

### Day 1
- [ ] Deploy to Vercel
- [ ] Verify cron jobs scheduled
- [ ] Run initial enrichment for all 6 workspaces
- [ ] Setup Coresignal webhooks
- [ ] Test one complete flow end-to-end

### Week 1
- [ ] Monitor cron execution logs
- [ ] Check enrichment success rates
- [ ] Verify AI notifications appearing
- [ ] Test buyer group re-run
- [ ] Confirm all 6 workspaces processing

### Month 1
- [ ] Review data quality metrics
- [ ] Analyze cost vs budget
- [ ] Optimize refresh frequencies if needed
- [ ] Collect user feedback
- [ ] Fine-tune churn prediction thresholds

---

## 🎉 Result

**Once deployed:**
- ✅ ALL 6 workspaces automatically enriched
- ✅ Real-time data accuracy guaranteed
- ✅ Churn prediction for all buyer group members
- ✅ Automated refresh (red/orange/green)
- ✅ Webhook integration for instant updates
- ✅ AI proactive notifications
- ✅ Buyer group auto re-runs
- ✅ Works for current AND future workspaces

**No manual intervention needed per workspace!**

---

## 🚀 Status: READY TO DEPLOY

All code created, tested, and configured for Vercel.

**Next action:** Deploy to Vercel and system runs automatically for all customers! 🎯

