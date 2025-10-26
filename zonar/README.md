# Zonar Enrichment Scripts

This folder contains scripts to check and enrich people and companies in the Notary Everyday workspace using the Coresignal API.

## Overview

The Zonar enrichment system helps identify which records in the Notary Everyday workspace have been enriched with Coresignal data and attempts to enrich unenriched records.

## Scripts

### `enrich-people.js`
Enriches people records with Coresignal employee data.

**Identifiers used:**
- LinkedIn URL (primary)
- Email (secondary) 
- Full Name + Company (fallback)

**Features:**
- Checks if person is already enriched
- Uses Coresignal employee search API
- Updates person records with enriched data
- Tracks API credits usage
- Batch processing with rate limiting

### `enrich-companies.js`
Enriches company records with Coresignal company data.

**Identifiers used:**
- LinkedIn URL (primary)
- Website/Domain (secondary)
- Email domain (tertiary)

**Features:**
- Checks if company is already enriched
- Uses Coresignal company search API
- Updates company records with enriched data
- Tracks API credits usage
- Batch processing with rate limiting

## Prerequisites

### Environment Variables

Create a `.env` file in the project root with:

```bash
CORESIGNAL_API_KEY=your_coresignal_api_key_here
DATABASE_URL=your_postgresql_connection_string
```

### Dependencies

The scripts use the following dependencies (already installed in the project):
- `@prisma/client` - Database access
- `dotenv` - Environment variable loading

## Usage

### Enrich People

```bash
node zonar/enrich-people.js
```

This will:
1. Query all people in Notary Everyday workspace
2. Check enrichment status for each person
3. Attempt to enrich unenriched people
4. Report statistics and credits used

### Enrich Companies

```bash
node zonar/enrich-companies.js
```

This will:
1. Query all companies in Notary Everyday workspace
2. Check enrichment status for each company
3. Attempt to enrich unenriched companies
4. Report statistics and credits used

## Enrichment Status Detection

### People
A person is considered enriched if they have:
- `coresignalId` in customFields
- `coresignalData` in customFields
- `lastEnrichedAt` timestamp in customFields
- Substantial bio content (>100 characters)

### Companies
A company is considered enriched if they have:
- `coresignalId` in customFields
- `coresignalData` in customFields
- `lastEnrichedAt` timestamp in customFields
- Substantial enriched description (>100 characters)

## API Rate Limiting

The scripts implement rate limiting to respect Coresignal API limits:
- Batch size: 10 records per batch
- Delay between batches: 2 seconds
- Error handling for rate limit responses

## Output

Each script provides detailed output including:
- Processing progress
- Enrichment status for each record
- Final statistics:
  - Total records processed
  - Already enriched
  - Successfully enriched
  - Failed enrichment
  - API credits used

## Workspace Configuration

The scripts are configured for the Notary Everyday workspace:
- Workspace ID: `01K7DNYR5VZ7JY36KGKKN76XZ1`

## Error Handling

The scripts include comprehensive error handling:
- API request failures
- Database connection issues
- Invalid responses
- Rate limiting
- Individual record processing errors

## Data Storage

Enriched data is stored in the `customFields` JSON column:
```json
{
  "coresignalId": "employee_or_company_id",
  "coresignalData": { /* full profile data */ },
  "lastEnrichedAt": "2025-01-26T10:30:00.000Z",
  "enrichmentSource": "coresignal"
}
```

## Monitoring

Monitor the scripts for:
- API credit usage
- Success/failure rates
- Processing time
- Database performance

## Troubleshooting

### Common Issues

1. **Missing API Key**
   - Ensure `CORESIGNAL_API_KEY` is set in `.env`
   - Verify the API key is valid and has sufficient credits

2. **Database Connection**
   - Ensure `DATABASE_URL` is correct
   - Verify database is accessible

3. **Rate Limiting**
   - Increase delay between batches if hitting rate limits
   - Reduce batch size if needed

4. **No Results Found**
   - Check if identifiers (LinkedIn, email, domain) are valid
   - Verify company/person names match Coresignal data

### Debug Mode

Add console logging to debug specific issues:
```javascript
console.log('Search query:', JSON.stringify(searchQuery, null, 2));
console.log('Profile data:', JSON.stringify(profileData, null, 2));
```
