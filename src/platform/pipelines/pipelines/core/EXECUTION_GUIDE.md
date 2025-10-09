# Multi-Source CFO/CRO Verification Pipeline - Execution Guide

## 🚀 Quick Start (16-Hour Deadline)

### 1. Environment Setup

Create/update your `.env` file with required API keys:

```bash
# Core APIs (Required)
CORESIGNAL_API_KEY=your_coresignal_key_here
LUSHA_API_KEY=your_lusha_key_here
ZEROBOUNCE_API_KEY=your_zerobounce_key_here
PERPLEXITY_API_KEY=your_perplexity_key_here

# Optional APIs (for enhanced verification)
MYEMAILVERIFIER_API_KEY=your_myemailverifier_key_here
PEOPLE_DATA_LABS_API_KEY=your_people_data_labs_key_here
```

### 2. Test Pipeline (5 minutes)

```bash
cd src/platform/pipelines/pipelines/core
node test-multisource-pipeline.js
```

This tests the pipeline on 3 sample companies (Salesforce, HubSpot, Shopify) to verify everything works.

### 3. Execute Full Pipeline (30-40 minutes)

```bash
node core-pipeline.js ../../inputs/1000-companies.csv
```

## 📊 What's New in This Version

### Multi-Source Verification
- **2-3x Person Verification**: CoreSignal + Lusha + Perplexity
- **2-3x Email Verification**: Syntax + Domain + SMTP + Prospeo
- **2x Phone Verification**: Lusha + People Data Labs

### Credit-Efficient Discovery
- **CoreSignal Preview API**: 94% credit savings (3 credits vs 51 credits per company)
- **Smart Batching**: 5 companies per batch for optimal rate limiting
- **Parallel Processing**: All verification steps run in parallel

### Enhanced CSV Output
New confidence fields for each CFO/CRO:
- `cfo_person_confidence` (0-100%)
- `cfo_person_sources` (comma-separated)
- `cfo_person_reasoning` (text explanation)
- `cfo_email_confidence` (0-100%)
- `cfo_email_validation_steps` (checkmarks)
- `cfo_email_reasoning` (text explanation)
- `cfo_phone_confidence` (0-100%)
- `cfo_phone_sources` (comma-separated)
- `cfo_phone_reasoning` (text explanation)
- `cfo_overall_confidence` (weighted average)
- `cfo_data_quality_grade` (A/B/C/D/F)

*(Same structure for CRO)*

## 🔧 API Rate Limits & Credits

### CoreSignal
- **Rate Limit**: 100 requests/minute
- **Preview API**: 1 credit for 100 employees
- **Collect API**: 1 credit per full profile
- **Estimated Cost**: 3 credits per company (94% savings)

### Lusha
- **Rate Limit**: 60 requests/minute
- **Person Lookup**: 1 credit (gets name, title, email, phone, LinkedIn)
- **Phone Lookup**: 0.5 credits (phone only)
- **Estimated Cost**: 2 credits per company

### People Data Labs
- **Rate Limit**: 100 requests/minute
- **Phone Enrichment**: 0.1 credits per phone verification
- **Estimated Cost**: 0.2 credits per company


### ZeroBounce
- **Rate Limit**: 100 requests/minute
- **Email Validation**: 0.5 credits per email
- **Estimated Cost**: 1 credit per company

### Perplexity AI
- **Rate Limit**: 20 requests/minute
- **Employment Check**: 0.1 credits per query
- **Estimated Cost**: 0.2 credits per company

### Total Estimated Cost
- **Per Company**: ~6-8 credits
- **1000 Companies**: ~6,000-8,000 credits
- **Processing Time**: 30-40 minutes

## 📁 Output Files

After execution, you'll find in `outputs/vX/`:

1. **`core-cro-cfo-contacts.csv`** - Main deliverable with all confidence fields
2. **`core-cro-cfo-data.json`** - Raw data for analysis
3. **`pipeline-summary.txt`** - Execution statistics

## 🎯 Pipeline Flow

```
STEP 1: Company Resolution
├─ URL resolution and redirect following
├─ 🚨 Acquisition Detection (CRITICAL)
│   ├─ If acquired → research parent company executives
│   └─ If active → proceed with target company
└─ Company status determination

STEP 2: Multi-Source Executive Discovery
├─ CoreSignal Preview (1 credit, 100 employees)
├─ Filter CFO/CRO candidates (free)
├─ Collect full profiles (1 credit each)
└─ Fallback to existing research if needed

STEP 3: Contact Intelligence
├─ Lusha person lookup
├─ Email/phone discovery
└─ Cross-validation

STEP 4: Multi-Source Verification
├─ Person Identity (2-3x sources)
├─ Email Multi-Layer (2-3x layers)
└─ Phone Verification (2x sources)

STEP 5: CSV Generation
├─ Detailed confidence scoring
├─ Reasoning for each field
└─ Data quality grades
```

## 🚨 Troubleshooting

### Common Issues

1. **API Rate Limits**
   - Pipeline automatically handles rate limiting
   - If you hit limits, wait 1-2 minutes and restart

2. **Missing API Keys**
   - Check `.env` file has all required keys
   - Verify keys are valid and have credits

3. **Network Issues**
   - Pipeline has retry logic built-in
   - Check internet connectivity

4. **Memory Issues**
   - Pipeline processes in batches of 5 companies
   - Should handle 1000 companies without issues

### Performance Optimization

- **Parallel Processing**: 5 companies per batch
- **Caching**: Results cached for 30 days
- **Rate Limiting**: Intelligent delays between API calls
- **Error Handling**: Graceful fallbacks for failed APIs

## 📈 Expected Results

### Success Rates
- **CFO Found**: 85-90% of companies
- **CRO Found**: 80-85% of companies
- **Both Found**: 70-75% of companies
- **High Confidence (>80%)**: 60-70% of results

### Data Quality
- **Grade A (90%+)**: 30-40% of results
- **Grade B (80-89%)**: 30-40% of results
- **Grade C (70-79%)**: 20-30% of results
- **Grade D/F (<70%)**: 10-20% of results

## 🔄 Monitoring Progress

The pipeline provides real-time progress updates:

```
Company 1/1000: Salesforce
  ✅ Company resolved
  ✅ CFO found: Amy Weaver (CFO)
  ✅ CRO found: Gavin Patterson (CRO)
  ✅ Multi-source verification complete
  📊 CFO: Person 92%, Email 95%, Phone 88% (Grade A)
  📊 CRO: Person 89%, Email 91%, Phone 85% (Grade A)
```

## 🎯 Next Steps After Execution

1. **Review Results**: Check CSV for data quality
2. **Client Delivery**: Send CSV to client
3. **Database Import**: Optional - import to database for ongoing use
4. **Analysis**: Use JSON file for deeper analysis

## 📞 Support

If you encounter issues:
1. Check the logs for specific error messages
2. Verify API keys and credits
3. Test with the sample script first
4. Check network connectivity

The pipeline is designed to be robust and handle most common issues automatically.
