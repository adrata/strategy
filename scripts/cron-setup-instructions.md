# Email Sync Cron Job Setup Instructions

## Option 1: System Cron Job (Recommended for Production)

### 1. Create the cron job script
The script `scripts/setup-email-sync-cron.js` is ready to use.

### 2. Make it executable
```bash
chmod +x scripts/setup-email-sync-cron.js
```

### 3. Add to crontab
```bash
# Edit crontab
crontab -e

# Add this line to run every 5 minutes
*/5 * * * * cd /path/to/adrata && node scripts/setup-email-sync-cron.js >> /var/log/adrata-email-sync.log 2>&1

# Or run every 10 minutes (less frequent)
*/10 * * * * cd /path/to/adrata && node scripts/setup-email-sync-cron.js >> /var/log/adrata-email-sync.log 2>&1
```

### 4. Test the cron job
```bash
# Run manually to test
node scripts/setup-email-sync-cron.js

# Check logs
tail -f /var/log/adrata-email-sync.log
```

## Option 2: PM2 Process Manager (Alternative)

### 1. Install PM2
```bash
npm install -g pm2
```

### 2. Create PM2 ecosystem file
Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [
    {
      name: 'adrata-email-sync',
      script: 'scripts/setup-email-sync-cron.js',
      cron_restart: '*/5 * * * *', // Every 5 minutes
      autorestart: false,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
```

### 3. Start with PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Option 3: Vercel Cron Jobs (For Vercel Deployments)

### 1. Create API route for cron
Create `src/app/api/cron/email-sync/route.ts`:
```typescript
import { NextRequest } from 'next/server';
import { EmailSyncScheduler } from '@/platform/services/EmailSyncScheduler';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await EmailSyncScheduler.scheduleSync();
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

### 2. Add to vercel.json
```json
{
  "crons": [
    {
      "path": "/api/cron/email-sync",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

## Option 4: GitHub Actions (For GitHub-hosted projects)

### 1. Create workflow file
Create `.github/workflows/email-sync.yml`:
```yaml
name: Email Sync
on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
  workflow_dispatch:  # Allow manual trigger

jobs:
  email-sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: node scripts/setup-email-sync-cron.js
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          NANGO_SECRET_KEY: ${{ secrets.NANGO_SECRET_KEY }}
```

## Monitoring and Logging

### 1. Log Rotation
Add to `/etc/logrotate.d/adrata-email-sync`:
```
/var/log/adrata-email-sync.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 root root
}
```

### 2. Health Check Script
Create `scripts/email-sync-health-check.js`:
```javascript
const { EmailSyncScheduler } = require('../src/platform/services/EmailSyncScheduler');

async function healthCheck() {
  try {
    const stats = await EmailSyncScheduler.getSyncStats();
    console.log('Email sync health check:', stats);
    
    // Alert if no recent syncs
    if (stats.recentSyncs === 0) {
      console.warn('⚠️ No recent email syncs detected');
    }
    
    return stats;
  } catch (error) {
    console.error('❌ Health check failed:', error);
    throw error;
  }
}

healthCheck();
```

### 3. Monitoring Alerts
Set up alerts for:
- Failed sync attempts
- No recent syncs (last 30 minutes)
- High error rates
- Database connection issues

## Recommended Schedule

- **Development**: Every 10 minutes
- **Production**: Every 5 minutes
- **High-volume**: Every 2-3 minutes

## Environment Variables Required

Make sure these are set in your environment:
```bash
DATABASE_URL=your_database_url
NANGO_SECRET_KEY=your_nango_secret_key
NODE_ENV=production
```

## Testing the Setup

1. **Manual Test**:
   ```bash
   node scripts/setup-email-sync-cron.js
   ```

2. **Check Logs**:
   ```bash
   tail -f /var/log/adrata-email-sync.log
   ```

3. **Verify Database**:
   ```bash
   node scripts/simple-email-test.js
   ```

4. **Monitor Performance**:
   ```bash
   node scripts/email-sync-health-check.js
   ```

## Troubleshooting

### Common Issues:
1. **Permission denied**: Check file permissions and user access
2. **Database connection**: Verify DATABASE_URL is correct
3. **Nango API errors**: Check NANGO_SECRET_KEY and connection status
4. **Memory issues**: Increase memory limits or reduce batch sizes

### Debug Mode:
Set `DEBUG=true` environment variable for verbose logging.
