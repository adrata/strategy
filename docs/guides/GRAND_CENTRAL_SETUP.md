# Grand Central Setup Guide

## Quick Start

Grand Central is now fully implemented and ready for use! Follow these steps to get started.

## 1. Environment Configuration

Add the following to your `.env` file:

```bash
# Nango API Keys (get from https://app.nango.dev/)
NANGO_SECRET_KEY=your_nango_secret_key_here
NANGO_PUBLIC_KEY=your_nango_public_key_here

# Optional configurations
NANGO_ENVIRONMENT=development  # or 'production'
```

## 2. Nango Account Setup

### Create Account
1. Go to https://nango.dev/
2. Sign up for a free account
3. Create a new project for Adrata

### Get API Keys
1. Navigate to Settings → API Keys
2. Copy your Secret Key and Public Key
3. Add them to your `.env` file

### Configure Integrations
1. Go to Integrations tab
2. Enable the integrations you want to use:
   - Salesforce
   - HubSpot
   - Slack
   - Google Workspace
   - etc.
3. For each integration:
   - Add your OAuth app credentials
   - Configure callback URLs
   - Set required scopes

## 3. Database Setup (If Not Already Done)

The Prisma schema has been updated with Grand Central tables. When ready to use the database:

```bash
# Generate Prisma client with new schema
npm run db:generate

# Run migrations (when ready for production)
npm run db:migrate
```

**Note:** Migrations can be skipped for now if you're not ready to apply database changes. The app will work with the schema defined, just won't persist workflows until migrations are run.

## 4. Start Development Server

```bash
npm run dev
```

## 5. Access Grand Central

Navigate to Grand Central:
- **URL**: `http://localhost:3000/[workspace]/grand-central`
- **From App**: Click profile menu → Grand Central
- **Keyboard**: `Cmd+Shift+G`

## 6. Test the Integration

### Create Your First Workflow

1. Click "Add Integration" button
2. Browse the integration library
3. Select an integration (e.g., Slack)
4. The node appears on the canvas
5. Drag it to position it
6. Click the node to configure it
7. Click "Execute" to run

### View in Code Mode

1. Click "Code" button in header
2. See JSON representation of your workflow
3. Copy/paste to share or backup

## Dependencies Installed

The following packages have been added to your project:

- `@nangohq/node` - Nango Node.js SDK
- `@nangohq/frontend` - Nango frontend components

These were already installed during the rebuild.

## File Structure

All Grand Central files are in:
```
src/app/[workspace]/grand-central/
```

See `GRAND_CENTRAL_REBUILD_SUMMARY.md` for complete file listing.

## Nango Integration Details

### OAuth Flow
1. User clicks "Add Integration"
2. Selects a provider (e.g., Salesforce)
3. Nango handles OAuth redirect
4. Tokens stored securely by Nango
5. Connection available for use in workflows

### API Calls
1. Workflow execution triggers API call
2. NangoService proxies the request
3. Nango handles authentication
4. Response returned to workflow
5. Results logged and displayed

### Token Management
- Nango automatically refreshes OAuth tokens
- No manual token management needed
- Connection status tracked per workspace

## Integration Categories Available

The following integration categories are pre-configured:

1. **CRM** (Salesforce, HubSpot, Pipedrive, Zoho CRM)
2. **Communication** (Slack, Microsoft Teams, Discord)
3. **Marketing** (Mailchimp, SendGrid)
4. **Productivity** (Google Workspace, Notion, Asana)
5. **Finance** (Stripe, QuickBooks, Xero)
6. **E-commerce** (Shopify, WooCommerce)
7. **Support** (Zendesk, Intercom, Freshdesk)
8. **Analytics** (Google Analytics, Mixpanel)

## Common Use Cases

### 1. CRM to Slack Notifications
- Trigger: New contact in Salesforce
- Action: Send message to Slack channel

### 2. Email to CRM Sync
- Trigger: New email in Gmail
- Action: Create contact in HubSpot

### 3. Support Ticket Routing
- Trigger: New ticket in Zendesk
- Condition: Check priority level
- Action: Assign to appropriate team

### 4. Analytics Pipeline
- Trigger: Daily schedule
- Action: Fetch data from Google Analytics
- Transform: Format for dashboard
- Action: Send to data warehouse

## Troubleshooting

### "Unauthorized" Error
- Check that Nango API keys are in `.env`
- Restart dev server after adding keys
- Verify keys are correct in Nango dashboard

### Integration Not Available
- Check that integration is enabled in Nango
- Verify OAuth app is configured
- Check callback URLs match your domain

### Execution Fails
- View execution logs in bottom-right corner
- Check node configuration is complete
- Verify API connection is active
- Test connection in Nango dashboard

### Database Errors
- Run `npm run db:generate` to update Prisma client
- Check database connection in `.env`
- Run migrations when ready: `npm run db:migrate`

## Next Steps

1. **Get Nango Account**: Sign up and get API keys
2. **Configure OAuth Apps**: Set up provider credentials
3. **Test Workflow**: Create and execute first workflow
4. **Add More Integrations**: Enable additional providers
5. **Build Templates**: Create reusable workflow patterns

## Support Resources

- **Nango Docs**: https://docs.nango.dev/
- **Grand Central README**: `src/app/[workspace]/grand-central/README.md`
- **Implementation Summary**: `GRAND_CENTRAL_REBUILD_SUMMARY.md`

## Security Best Practices

1. **Never commit** `.env` file with API keys
2. **Use separate** Nango accounts for dev/prod
3. **Rotate keys** periodically
4. **Monitor** API usage in Nango dashboard
5. **Enable** rate limiting on API routes
6. **Review** OAuth scopes regularly

## Performance Tips

1. **Limit** canvas to 50 nodes for best performance
2. **Use** code view for large workflows
3. **Batch** API calls where possible
4. **Cache** integration metadata
5. **Monitor** execution times

## Future Enhancements

- Workflow templates library
- Scheduled execution (cron)
- Webhook triggers
- Advanced data transformation UI
- Workflow versioning
- Team collaboration features
- Analytics dashboard
- Workflow marketplace

---

**Grand Central is ready to use!** Start by setting up your Nango account and creating your first integration workflow.

