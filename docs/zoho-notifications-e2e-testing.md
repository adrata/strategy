# Zoho Notifications End-to-End Testing Guide

## 🧪 Complete E2E Testing Options

I've created multiple ways to test the Zoho notification system end-to-end in your browser:

### 1. **Next.js Test Page** (Recommended)
**URL:** `https://action.adrata.com/test-zoho-notifications`

This is a full React page with:
- ✅ Real-time notification display
- ✅ Interactive test buttons for all webhook types
- ✅ Live notification history
- ✅ API testing capabilities
- ✅ Beautiful UI with real-time updates

**Features:**
- Send test webhooks for leads, contacts, and deals
- View real-time notifications as they arrive
- Test the notifications API
- See notification history and details
- Mark notifications as read
- Auto-refresh and real-time updates

### 2. **Standalone HTML Test Page**
**URL:** `https://action.adrata.com/zoho-test.html`

A simple HTML page that works without React:
- ✅ Basic webhook testing
- ✅ API testing
- ✅ Results display
- ✅ Notification toasts
- ✅ Works in any browser

### 3. **Browser Console Script**
**File:** `public/zoho-notifications-test.js`

Run this in your browser console for programmatic testing:
```javascript
// Load the test script
fetch('/zoho-notifications-test.js').then(r => r.text()).then(eval);

// Then use the test functions:
zohoTest.sendWebhook('lead')           // Send lead webhook
zohoTest.sendWebhook('contact')        // Send contact webhook  
zohoTest.sendWebhook('deal')           // Send deal webhook
zohoTest.testAllWebhooks()             // Test all webhook types
zohoTest.testNotificationsAPI()        // Test notifications API
zohoTest.runCompleteTest()             // Run complete test suite
zohoTest.listenForNotifications()      // Set up real-time listener
```

## 🚀 How to Test

### **Step 1: Open the Test Page**
Navigate to: `https://action.adrata.com/test-zoho-notifications`

### **Step 2: Send Test Webhooks**
Click the test buttons to send webhooks:
- **👥 Test Lead Webhook** - Creates a test lead with buying signals
- **📞 Test Contact Webhook** - Creates a test contact
- **💼 Test Deal Webhook** - Creates a high-value test deal

### **Step 3: Watch for Notifications**
You should see:
1. **Toast Notifications** - Pop up in the top-right corner
2. **Real-time Updates** - Notifications appear in the "Recent Notifications" section
3. **Test Results** - Detailed results in the "Test Results" section

### **Step 4: Test the API**
Click **📡 Test API** to verify the notifications API is working

### **Step 5: Verify Real-time Updates**
- Notifications should appear instantly via Pusher
- Desktop notifications should show for high-priority updates
- All notifications should be stored in the database

## 🔍 What to Look For

### **Successful Test Indicators:**
- ✅ Webhook responses show `{"success": true, "message": "Webhook processed"}`
- ✅ Toast notifications appear with correct module icons (👥📞💼)
- ✅ Notifications show in the "Recent Notifications" section
- ✅ Priority levels are correct (HIGH for deals, MEDIUM for contacts, etc.)
- ✅ API returns notification data
- ✅ Real-time updates work via Pusher

### **Expected Notification Content:**
- **Title:** "Lead Created: [Name]", "Contact Updated: [Name]", etc.
- **Content:** Record details with company, title, status
- **Priority:** HIGH (deals >$10k, buying signals), MEDIUM (contacts/accounts), LOW (notes/tasks)
- **Module Icons:** 👥 (leads), 📞 (contacts), 💼 (deals), 🏢 (accounts)
- **Timestamps:** Recent timestamps showing real-time updates

## 🐛 Troubleshooting

### **If Webhooks Fail:**
- Check browser console for errors
- Verify the webhook URL is correct
- Check network tab for HTTP status codes
- Ensure workspace ID is correct

### **If Notifications Don't Appear:**
- Check if Pusher is configured correctly
- Verify the notifications API endpoint
- Check browser console for JavaScript errors
- Try refreshing the page

### **If API Tests Fail:**
- The API endpoint might not be deployed yet
- Check the network tab for 404 errors
- Verify the API route exists in the codebase

## 📊 Test Data

The test creates realistic data:
- **Leads:** With buying signals and urgent keywords
- **Contacts:** With departments and account associations  
- **Deals:** High-value deals with stages and probabilities
- **All records:** Include workspace ID for proper isolation

## 🎯 Success Criteria

A successful E2E test should show:
1. ✅ All webhook types process successfully
2. ✅ Notifications appear in real-time
3. ✅ Toast notifications display correctly
4. ✅ Notification history is maintained
5. ✅ API endpoints return data
6. ✅ Priority levels are appropriate
7. ✅ Module icons and content are correct
8. ✅ Real-time updates work via Pusher

## 🔧 Advanced Testing

### **Test Different Scenarios:**
- Send multiple webhooks quickly
- Test with different priority levels
- Verify workspace isolation
- Test notification dismissal and marking as read

### **Monitor Real-time Updates:**
- Open browser dev tools
- Watch the Network tab for Pusher connections
- Check Console for real-time event logs
- Verify WebSocket connections are active

This comprehensive testing setup ensures the Zoho notification system works end-to-end in the browser!
