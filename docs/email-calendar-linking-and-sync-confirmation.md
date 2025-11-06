# Email & Calendar Linking and Auto-Sync Confirmation

## ✅ Email Linking to Records

### 1. **Email Linking Process**

When emails are synced, they are automatically linked to:

- **People** (`people` table) - By matching email addresses:
  - `email`
  - `workEmail`
  - `personalEmail`
  - `secondaryEmail`

- **Companies** (`companies` table) - Via the linked person's `companyId`

- **Leads** (`leads` table) - By matching email addresses:
  - `email`
  - `workEmail`
  - `personalEmail`

- **Prospects** (`prospects` table) - By matching email addresses:
  - `email`
  - `workEmail`
  - `personalEmail`

- **Opportunities** (`opportunities` table) - Via linked company relationships

**Code Location:** `src/platform/services/UnifiedEmailSyncService.ts`
- `linkEmailsToEntities()` - Links emails to people/companies
- `linkExistingEmailsToPerson()` - Reverse linking when person is created

### 2. **Action Creation for Emails**

✅ **YES** - Emails create action records that display in the Actions tab:

- **Action Type:** `EMAIL`
- **Status:** `COMPLETED`
- **Fields:**
  - `subject` - Email subject
  - `description` - First 500 chars of email body
  - `completedAt` - Email received date
  - `personId` - Linked person
  - `companyId` - Linked company
  - `workspaceId` - Workspace

**Code Location:** `src/platform/services/UnifiedEmailSyncService.ts`
- `createEmailActions()` - Creates action records for linked emails

**Display Location:** 
- Actions Tab: `src/frontend/components/pipeline/tabs/UniversalActionsTab.tsx`
- Timeline: `src/platform/services/EnhancedTimelineService.ts`

---

## ✅ Calendar Event Linking to Records

### 1. **Calendar Event Linking Process**

Calendar events are automatically linked to:

- **People** (`people` table) - By matching attendee/organizer email addresses
- **Companies** (`companies` table) - By extracting company keywords from title/description
- **Leads** (`leads` table) - By matching attendee email addresses
- **Prospects** (`prospects` table) - By matching attendee email addresses
- **Opportunities** (`opportunities` table) - By matching company keywords in title/description
- **Accounts** (`accounts` table) - By matching company keywords in title/description
- **Contacts** (`contacts` table) - By matching attendee email addresses

**Code Location:** `src/platform/services/calendar-sync-service.ts`
- `linkEventToEntities()` - Links events to all entity types
- `extractCompanyKeywords()` - Extracts company names from event title/description

### 2. **Calendar Event Sync Status**

✅ **YES** - Calendar events are being pulled in via Nango:

- **Platform:** Microsoft Outlook (via Nango)
- **Method:** Uses Nango proxy to fetch from Microsoft Graph API
- **Endpoint:** `/v1.0/me/events`
- **Date Range:** Today to 30 days in the future
- **Fallback:** Falls back to token-based method if Nango connection not found

**Code Location:** `src/platform/services/calendar-sync-service.ts`
- `fetchEventsFromNango()` - Fetches events via Nango
- `syncCalendarEvents()` - Main sync orchestration

---

## ✅ Auto-Sync Mechanisms

### 1. **New Email Auto-Sync**

**How it works:**

1. **Webhook Trigger** (Primary Method):
   - Nango sends webhook to `/api/webhooks/nango/email` when new emails arrive
   - Webhook handler calls `UnifiedEmailSyncService.syncWorkspaceEmails()`
   - Emails are fetched, stored, linked, and actions created

2. **Manual Trigger** (Backup):
   - Endpoint: `/api/v1/integrations/nango/sync-now`
   - Can be called manually or scheduled

3. **Initial Sync**:
   - Automatically triggered when connection is created
   - Webhook handler `handleConnectionCreation()` triggers sync

**Code Locations:**
- Webhook: `src/app/api/webhooks/nango/email/route.ts`
- Sync Service: `src/platform/services/UnifiedEmailSyncService.ts`
- Manual Trigger: `src/app/api/v1/integrations/nango/sync-now/route.ts`

**Current Status:**
- ✅ Webhook configured to trigger on new emails
- ✅ Connection creation triggers initial sync
- ✅ Manual sync endpoint available

**Note:** For real-time sync, Nango webhooks must be configured in Nango dashboard:
- Webhook URL: `https://action.adrata.com/api/webhooks/nango/email`
- Enable "Send Email Sync Webhooks"

### 2. **New Calendar Event Auto-Sync**

**How it works:**

1. **On-Demand Sync**:
   - Calendar events are fetched when requested (e.g., Speedrun calendar view)
   - Uses `CalendarSyncService.getCalendarEvents()` or `syncCalendarEvents()`

2. **Scheduled Sync** (Potential):
   - Could be scheduled via cron job or background worker
   - Currently syncs on-demand when calendar is viewed

**Code Locations:**
- Calendar Service: `src/platform/services/calendar-sync-service.ts`
- API Endpoint: `src/app/api/v1/communications/calendar/events/route.ts`
- Speedrun Integration: `src/platform/services/speedrun-calendar.ts`

**Current Status:**
- ✅ Calendar events are fetched via Nango
- ✅ Events are linked to entities automatically
- ⚠️ **No automatic webhook sync yet** - Events sync on-demand when calendar is viewed

**Recommendation:** To enable auto-sync for calendar events:
1. Set up Nango webhook for calendar events (if available)
2. Create scheduled job to call `CalendarSyncService.syncCalendarEvents()` periodically
3. Or trigger sync when calendar view is opened

---

## Summary Checklist

### Emails:
- ✅ Linked to People by email address
- ✅ Linked to Companies via person's companyId
- ✅ Linked to Leads by email address
- ✅ Linked to Prospects by email address
- ✅ Linked to Opportunities via company relationships
- ✅ Create action records (type: EMAIL)
- ✅ Display in Actions tab
- ✅ Auto-sync via webhook when new emails arrive
- ✅ Initial sync on connection creation

### Calendar Events:
- ✅ Linked to People by attendee email
- ✅ Linked to Companies by keywords in title/description
- ✅ Linked to Leads by attendee email
- ✅ Linked to Prospects by attendee email
- ✅ Linked to Opportunities by company keywords
- ✅ Linked to Accounts by company keywords
- ✅ Fetched via Nango from Outlook
- ⚠️ Sync on-demand (when calendar is viewed)
- ⚠️ **No automatic webhook sync yet** (would need to be implemented)

---

## Next Steps for Full Auto-Sync

### Calendar Events Auto-Sync:

1. **Option 1: Scheduled Sync**
   - Create cron job or background worker
   - Call `CalendarSyncService.syncCalendarEvents()` every 15-30 minutes
   - Store in database for fast retrieval

2. **Option 2: Nango Webhook** (if available)
   - Configure Nango to send calendar event webhooks
   - Create webhook handler similar to email webhook
   - Trigger sync when new events are created/updated

3. **Option 3: On-View Sync**
   - Current implementation - syncs when calendar is viewed
   - Good for user-initiated sync
   - May have slight delay on first view

---

## Testing Verification

To verify everything is working:

```javascript
// 1. Check email linking
fetch('/api/v1/diagnostics/email-sync-status', {
  credentials: 'include'
}).then(r => r.json()).then(console.log);

// 2. Check actions created
// Query actions table: SELECT * FROM actions WHERE type = 'EMAIL' LIMIT 10;

// 3. Check calendar events
fetch('/api/v1/communications/calendar/events?start=2024-11-06&end=2024-12-06', {
  credentials: 'include'
}).then(r => r.json()).then(console.log);

// 4. Test email sync
fetch('/api/v1/integrations/nango/sync-now', {
  method: 'POST',
  credentials: 'include'
}).then(r => r.json()).then(console.log);
```

