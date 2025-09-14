#!/usr/bin/env node

/*
 * CoreSignal Smoke Test
 * Usage:
 *   CORESIGNAL_API_KEY=... node scripts/tests/coresignal-smoke-test.js --company "Dell" --limit 10
 */

const https = require('https');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { company: 'Dell', limit: 10 };
  for (let i = 0; i < args.length; i += 1) {
    const key = args[i];
    const val = args[i + 1];
    if (key === '--company' && val) out.company = val;
    if (key === '--limit' && val) out.limit = Number(val) || 10;
  }
  return out;
}

function postJson(url, headers, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const options = {
      method: 'POST',
      hostname: u.hostname,
      path: u.pathname + (u.search || ''),
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Adrata-CoreSignal-Smoke/1.0',
        ...headers,
      },
      timeout: 15000,
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
        } else if (res.statusCode === 401 && !headers.Authorization) {
          // Retry once with Bearer auth if apikey header was used
          try {
            const bearerHeaders = { ...headers };
            delete bearerHeaders.apikey;
            bearerHeaders.Authorization = `Bearer ${process.env.CORESIGNAL_API_KEY || ''}`;
            postJson(url, bearerHeaders, body).then(resolve).catch(reject);
          } catch (e) {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  const { company, limit } = parseArgs();
  const apiKey = process.env.CORESIGNAL_API_KEY || '';
  if (!apiKey) {
    console.error('CORESIGNAL_API_KEY not set');
    process.exit(1);
  }

  const esQuery = {
    query: {
      bool: {
        must: [
          {
            nested: {
              path: 'experience',
              query: {
                bool: {
                  should: [
                    { match: { 'experience.company_name': company } },
                    { match_phrase: { 'experience.company_name': company } },
                  ],
                },
              },
            },
          },
        ],
      },
    },
  };

  console.log(`Testing CoreSignal search for company="${company}" limit=${limit}`);
  // Per docs, search returns IDs and uses cdapi/v2 with apikey header
  // Use items_per_page in the query string (body must not include size/from)
  const searchUrl = `https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl?items_per_page=${encodeURIComponent(limit)}`;
  const headers = { apikey: apiKey, Accept: 'application/json' };
  const ids = await postJson(searchUrl, headers, esQuery);

  if (!Array.isArray(ids)) {
    console.log('Unexpected search response (expected array of IDs):', ids);
    process.exit(1);
  }
  console.log('IDs returned:', ids.length);
  if (ids[0]) {
    const firstId = ids[0];
    console.log('Fetching first profile via collect for sanity check:', firstId);
    const u = new URL(`https://api.coresignal.com/cdapi/v2/employee_multi_source/collect/${firstId}`);
    const options = {
      method: 'GET',
      hostname: u.hostname,
      path: u.pathname,
      headers: { apikey: apiKey, Accept: 'application/json' },
      timeout: 15000,
    };
    const profile = await new Promise((resolve, reject) => {
      const req = require('https').request(options, (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      });
      req.on('error', reject);
      req.end();
    });
    console.log('Profile keys:', Object.keys(profile).slice(0, 20));
  }
}

main().catch((err) => {
  console.error('Smoke test failed:', err.message);
  process.exit(1);
});


