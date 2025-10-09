# API Credit Monitoring System

## Overview

The API Credit Monitoring System provides comprehensive tracking, alerting, and cost management for all API services used in the multi-source verification pipeline. This system helps you:

- **Track API usage** in real-time with cost calculations
- **Get alerts** before running out of credits
- **Stop the pipeline** automatically when limits are reached
- **Generate reports** for cost analysis and budgeting
- **Log everything** to database for historical analysis

## 🚨 Key Features

### 1. Real-Time Monitoring
- **Live cost tracking** for each API call
- **Credit limit monitoring** with configurable thresholds
- **Usage percentage** calculations
- **Remaining credit** tracking

### 2. Smart Alerting
- **Warning alerts** at 80% of credit limit
- **Critical alerts** at 95% of credit limit
- **Automatic pipeline stops** at 95% to prevent overages
- **Database logging** of all alerts

### 3. Cost Management
- **Per-operation pricing** for all APIs
- **Daily/monthly/yearly projections**
- **Service breakdown** analytics
- **Cost optimization** recommendations

### 4. Database Logging
- **All API calls** logged with metadata
- **Daily summaries** for reporting
- **Pipeline run records** with costs
- **Alert history** for analysis

## 📊 API Cost Structure

| Service | Operation | Cost | Description |
|---------|-----------|------|-------------|
| **CoreSignal** | preview | $0.10 | Employee preview (94% credit savings) |
| **CoreSignal** | full_profile | $0.50 | Complete employee profile |
| **CoreSignal** | company_data | $0.20 | Company intelligence lookup |
| **Lusha** | person_lookup | $0.15 | Person identity verification |
| **Lusha** | phone_verify | $0.10 | Phone number verification |
| **Lusha** | email_verify | $0.08 | Email verification |
| **ZeroBounce** | email_verify | $0.005 | Email validation |
| **Perplexity** | query | $0.20 | AI-powered research queries |
| **People Data Labs** | person_lookup | $0.12 | Person data enrichment |

## 🛡️ Credit Limits & Alerts

### Default Credit Limits
```javascript
{
    CORESIGNAL: 1000,      // $1000 limit
    LUSHA: 500,            // $500 limit  
    ZEROBOUNCE: 200,       // $200 limit
    PERPLEXITY: 300,       // $300 limit
    PEOPLE_DATA_LABS: 200  // $200 limit
}
```

### Alert Thresholds
- **Warning**: 80% of credit limit
- **Critical**: 95% of credit limit
- **Auto-Stop**: 95% of credit limit

## 🚀 Usage Examples

### 1. Check Current Usage
```bash
# Generate comprehensive usage report
node scripts/api-usage-report.js
```

### 2. Run Pipeline with Monitoring
```bash
# Pipeline automatically monitors API usage
node pipelines/core/core-pipeline.js inputs/companies.csv
```

### 3. Demo the System
```bash
# See monitoring in action with simulated usage
node scripts/demo-api-monitoring.js
```

## 📈 Pipeline Integration

### Automatic Monitoring
The pipeline now includes **STEP 0: API Credit Monitoring** that:

1. **Checks current usage** before starting
2. **Displays service status** with color-coded indicators
3. **Shows daily/total costs**
4. **Stops pipeline** if critical limits reached

### Example Output
```
STEP 0: API Credit Monitoring
   🔍 Checking API credit status...
   📊 Current API Usage:
      ✅ CORESIGNAL: $45.20/1000 (5%)
      ⚠️ LUSHA: $420.50/500 (84%)
      ✅ ZEROBOUNCE: $12.30/200 (6%)
      ✅ PERPLEXITY: $89.40/300 (30%)
      ✅ PEOPLE_DATA_LABS: $45.60/200 (23%)
   💰 Daily Total: $612.00
   💰 Total Cost: $2,847.50
```

## 🚨 Alert System

### Warning Alerts (80% threshold)
```
⚠️ WARNING ALERT: LUSHA API: WARNING - 84% of credits used ($420.50/500) - $79.50 remaining
```

### Critical Alerts (95% threshold)
```
🚨 CRITICAL ALERT: LUSHA API: CRITICAL - 96% of credits used ($480.00/500) - Only $20.00 remaining!
```

### Pipeline Auto-Stop
```
🛑 STOPPING PIPELINE: LUSHA API at critical limit
```

## 📊 Reporting & Analytics

### Daily Usage Report
```bash
node scripts/api-usage-report.js
```

**Sample Output:**
```
📊 API USAGE REPORT GENERATOR
============================================================

🔍 CURRENT API USAGE STATUS
📅 Date: 2025-10-09
💰 Daily Total: $612.00
💰 Total Cost: $2,847.50

📈 SERVICE BREAKDOWN:
   CORESIGNAL: ✅ OK
     Usage: $45.20/1000 (5%)
     Remaining: $954.80
     Total Calls: 452

🚨 RECENT ALERTS (Last 24 hours):
   ⚠️ WARNING: LUSHA API: 84% of credits used

📊 30-DAY ANALYTICS:
Total API Calls: 15,420
Total Cost: $2,847.50
Daily Average: 514 calls, $94.92

🔮 COST PROJECTIONS:
Daily Average: $94.92
Weekly Projection: $664.44
Monthly Projection: $2,847.60
Yearly Projection: $34,645.80

💡 RECOMMENDATIONS:
⚠️ MONITOR CLOSELY:
   - LUSHA: Consider purchasing credits soon
```

## 🗄️ Database Logging

### Log Files Created
- `logs/api-usage.json` - Real-time usage tracking
- `logs/credit-alerts.json` - Alert history
- `logs/daily-usage.json` - Daily summaries
- `logs/api-usage-db.json` - Database records
- `logs/api-usage-export.json` - Export data

### Database Schema
```javascript
{
  api_usage_records: [
    {
      id: "unique_id",
      timestamp: "2025-10-09T23:30:00.000Z",
      service: "CORESIGNAL",
      operation: "preview",
      count: 1,
      cost: 0.10,
      daily_total: 45.20,
      service_total: 45.20,
      metadata: { company: "salesforce" }
    }
  ],
  credit_alerts: [
    {
      id: "unique_id",
      timestamp: "2025-10-09T23:30:00.000Z",
      service: "LUSHA",
      level: "WARNING",
      message: "LUSHA API: WARNING - 84% of credits used",
      details: { usage_percentage: 84, remaining_credits: 79.50 }
    }
  ],
  daily_summaries: [...],
  pipeline_runs: [...]
}
```

## ⚙️ Configuration

### Environment Variables
```bash
# Credit limits (optional - defaults provided)
CORESIGNAL_CREDIT_LIMIT=1000
LUSHA_CREDIT_LIMIT=500
ZEROBOUNCE_CREDIT_LIMIT=200
PERPLEXITY_CREDIT_LIMIT=300
PDL_CREDIT_LIMIT=200
```

### Custom Configuration
```javascript
const apiMonitor = new ApiCreditMonitor({
    CORESIGNAL_CREDIT_LIMIT: 2000,  // Custom limit
    LUSHA_CREDIT_LIMIT: 1000,       // Custom limit
    // ... other settings
});
```

## 🛠️ Troubleshooting

### Common Issues

1. **API keys not loading**
   - Check `.env` file path in pipeline
   - Verify API key format (no quotes needed)

2. **Monitoring not working**
   - Ensure `logs/` directory exists
   - Check file permissions

3. **Alerts not triggering**
   - Verify credit limits are set correctly
   - Check alert thresholds (80%, 95%)

### Debug Commands
```bash
# Check if monitoring is working
node scripts/demo-api-monitoring.js

# Generate usage report
node scripts/api-usage-report.js

# Check log files
ls -la logs/
```

## 💡 Best Practices

### 1. Set Appropriate Limits
- **Start conservative** with lower limits
- **Monitor usage patterns** for 1-2 weeks
- **Adjust limits** based on actual usage

### 2. Regular Monitoring
- **Check reports daily** during active periods
- **Set up alerts** for critical thresholds
- **Review projections** weekly

### 3. Cost Optimization
- **Use CoreSignal preview** for 94% credit savings
- **Cache results** to avoid duplicate calls
- **Batch operations** when possible

### 4. Budget Planning
- **Use monthly projections** for budgeting
- **Track trends** over time
- **Plan for peak usage** periods

## 🎯 Benefits

### For You
- **Never run out of credits** unexpectedly
- **Track costs** in real-time
- **Plan budgets** with projections
- **Optimize usage** with analytics

### For the Business
- **Predictable costs** with monitoring
- **Prevent overages** with auto-stops
- **Data-driven decisions** with reports
- **Scalable operations** with proper tracking

## 📞 Support

If you need help with the API monitoring system:

1. **Check the logs** in `logs/` directory
2. **Run the demo** to verify functionality
3. **Generate reports** to see current status
4. **Review this guide** for configuration options

The system is designed to be **self-monitoring** and **self-protecting** - it will automatically stop the pipeline before you run out of credits, giving you time to purchase more! 🛡️
