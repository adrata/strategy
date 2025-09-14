#!/usr/bin/env node

/*
 * CoreSignal Buyer Group Example
 * 
 * Pipeline (defensible heuristic):
 * 1) Candidate generation: ES DSL filter for company + departments + title keywords; is_working=1; exclude interns.
 * 2) Scoring: seniority, department alignment, role keywords, function proximity, geography, tenure.
 * 3) Role classification: decision_maker, champion, stakeholder, blocker, introducer.
 * 4) Selection: If candidates are many, narrow to outer ring (~100); otherwise skip narrowing.
 *    Always return a final set of 8–12 with caps by role.
 * 5) Optional collect (disabled by default to save credits).
 *
 * Usage:
 *   CORESIGNAL_API_KEY=... node scripts/tests/coresignal-buyer-group-example.js \
 *     --company "Dell" \
 *     --sell "Cloud Security Platform" \
 *     --limit 300 \
 *     --outfile data/production/reports/coresignal-buyer-group-dell.json
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { company: 'Dell', sell: 'Security Platform', limit: 300, outfile: '', outerThreshold: 150, outerSize: 100, finalCount: 12 };
  for (let i = 0; i < args.length; i += 1) {
    const key = args[i];
    const val = args[i + 1];
    if (key === '--company' && val) out.company = val;
    if (key === '--sell' && val) out.sell = val;
    if (key === '--limit' && val) out.limit = Number(val) || 300;
    if (key === '--outfile' && val) out.outfile = val;
    if (key === '--outer-threshold' && val) out.outerThreshold = Number(val) || 150;
    if (key === '--outer-size' && val) out.outerSize = Number(val) || 100;
    if (key === '--final' && val) out.finalCount = Number(val) || 12;
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
        'User-Agent': 'Adrata-CoreSignal-BuyerGroup/1.0',
        ...headers,
      },
      timeout: 25000,
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
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

// Heuristic dictionaries (defensible, transparent)
const PRIMARY_DEPARTMENTS = [
  'Security', 'Information Security', 'Cyber', 'IT', 'Infrastructure', 'Cloud', 'Platform',
  'Data', 'Engineering', 'DevOps', 'SRE', 'Architecture', 'Networking', 'Operations',
];
const ADJACENT_DEPARTMENTS = [
  'Finance', 'FP&A', 'Procurement', 'Sourcing', 'Legal', 'Compliance', 'Privacy', 'Risk',
  'Enablement', 'Sales Operations', 'BizOps', 'HR', 'Learning', 'IT Audit'
];
const DECISION_TITLE_TOKENS = ['chief', 'ciso', 'cio', 'cto', 'vp', 'vice president', 'director', 'head of'];
const CHAMPION_TITLE_TOKENS = ['lead', 'principal', 'staff', 'senior', 'architect', 'engineer', 'manager'];
const BLOCKER_TOKENS = ['security', 'infosec', 'risk', 'compliance', 'legal', 'counsel', 'procurement', 'sourcing', 'privacy'];
const INTRODUCER_TOKENS = ['chief of staff', 'executive assistant', 'program manager', 'project manager', 'operations manager', 'business operations'];

function text(val) {
  return (val || '').toString().toLowerCase();
}

function departmentMatchScore(dept) {
  const d = text(dept);
  if (!d) return 0;
  if (PRIMARY_DEPARTMENTS.some((p) => d.includes(p.toLowerCase()))) return 3;
  if (ADJACENT_DEPARTMENTS.some((p) => d.includes(p.toLowerCase()))) return 2;
  return 0;
}

function titleTokensScore(title) {
  const t = text(title);
  if (!t) return 0;
  let s = 0;
  if (DECISION_TITLE_TOKENS.some((k) => t.includes(k))) s += 4;
  if (CHAMPION_TITLE_TOKENS.some((k) => t.includes(k))) s += 2;
  return s;
}

function blockerScore(profile) {
  const fields = [profile.active_experience_department, profile.position_title, profile.headline]
    .map(text)
    .join(' ');
  return BLOCKER_TOKENS.some((k) => fields.includes(k)) ? 3 : 0;
}

function introducerScore(profile) {
  const fields = [profile.position_title, profile.headline]
    .map(text)
    .join(' ');
  return INTRODUCER_TOKENS.some((k) => fields.includes(k)) ? 2 : 0;
}

function managementLevelScore(level) {
  const l = text(level);
  if (!l) return 0;
  if (['c', 'executive'].some((k) => l.includes(k))) return 5;
  if (l.includes('vp')) return 4;
  if (l.includes('director')) return 3;
  if (l.includes('manager')) return 2;
  return 1; // IC
}

function getCurrentExperience(profile) {
  const experiences = (profile.experience || profile.experiences || []);
  if (!Array.isArray(experiences) || experiences.length === 0) return undefined;
  // Prefer explicitly current entries
  const current = experiences.find((e) => (e?.is_current === 1 || e?.is_current === true || (e?.end_date == null)));
  if (current) return current;
  // Fallback: latest by end_date or start_date
  const sorted = [...experiences].sort((a, b) => new Date(b?.end_date || b?.start_date || 0) - new Date(a?.end_date || a?.start_date || 0));
  return sorted[0];
}

function normalizeCurrentFields(profile) {
  const current = getCurrentExperience(profile);
  return {
    company_name: current?.company_name || profile.active_experience_company_name || profile.company_name || '',
    title: current?.title || profile.active_experience_title || profile.position_title || profile.headline || '',
    department: current?.department || profile.active_experience_department || '',
    management_level: current?.management_level || profile.active_experience_management_level || '',
  };
}

function roleScores(profile) {
  const current = normalizeCurrentFields(profile);
  const deptScore = departmentMatchScore(current.department);
  const titleScore = titleTokensScore(current.title);
  const mgmtScore = managementLevelScore(current.management_level);
  const blkScore = blockerScore(profile);
  const introScore = introducerScore(profile);

  // Base role scores
  // Decision-makers must be Director+ and in primary or adjacent departments; penalize specialists
  const decision = (mgmtScore >= 3 ? mgmtScore : 0) + (deptScore >= 2 ? 2 : 0) + (titleScore >= 4 ? 2 : 0) - (mgmtScore <= 2 ? 2 : 0);
  const champion = (deptScore >= 2 ? 2 : 0) + (titleScore >= 2 ? 2 : 0) + (mgmtScore <= 3 ? 1 : 0);
  const stakeholder = (deptScore >= 2 ? 2 : 0) + (titleScore >= 1 ? 1 : 0);
  const blocker = blkScore;
  const introducer = introScore;

  return { decision, champion, stakeholder, blocker, introducer };
}

function bestRole(scores) {
  const entries = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return entries[0]?.[0] || 'stakeholder';
}

function buildEsQuery(company) {
  // Per docs: use match; body must NOT include size/from; paging via query params
  return {
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
}

function normalizeResults(json) {
  if (!json) return [];
  if (Array.isArray(json.data)) return json.data;
  if (Array.isArray(json.results)) return json.results;
  return [];
}

function scoreCandidates(candidates) {
  const scored = candidates.map((p) => {
    const scores = roleScores(p);
    const composite = scores.champion * 2 + scores.stakeholder * 1.5 + scores.decision * 1.25 + scores.blocker + scores.introducer;
    const role = bestRole(scores);
    return { profile: p, scores, composite, role };
  });
  scored.sort((a, b) => b.composite - a.composite);
  return scored;
}

function selectFinalGroup(scored, caps = { decision: 2, champion: 3, stakeholder: 5, blocker: 2, introducer: 2 }, total = 12) {
  const buckets = { decision: [], champion: [], stakeholder: [], blocker: [], introducer: [] };
  for (const item of scored) {
    const r = item.role;
    if (buckets[r] && buckets[r].length < (caps[r] || 0)) buckets[r].push(item);
  }
  // Assemble with ordering preference
  let ordered = [
    ...buckets.decision,
    ...buckets.champion,
    ...buckets.stakeholder,
    ...buckets.blocker,
    ...buckets.introducer,
  ].slice(0, total);
  // If underfilled due to caps, top-up with remaining highest scorers not already included
  if (ordered.length < total) {
    const selectedSet = new Set(ordered.map((i) => i.profile?.id || i.profile?.public_profile_id || i.profile?.linkedin_url || i.profile?.full_name));
    for (const item of scored) {
      const key = item.profile?.id || item.profile?.public_profile_id || item.profile?.linkedin_url || item.profile?.full_name;
      if (!selectedSet.has(key)) {
        ordered.push(item);
        selectedSet.add(key);
        if (ordered.length >= total) break;
      }
    }
  }
  return { ordered, buckets };
}

async function main() {
  const { company, sell, limit, outfile, outerThreshold, outerSize, finalCount } = parseArgs();
  const apiKey = process.env.CORESIGNAL_API_KEY || '';
  if (!apiKey) { console.error('CORESIGNAL_API_KEY not set'); process.exit(1); }

  let esQuery = buildEsQuery(company);
  // Per docs: cdapi/v2 + apikey header; search returns array of IDs
  // Use items_per_page in query string; body must not include size/from
  const url = `https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl?items_per_page=${encodeURIComponent(limit)}`;
  const headers = { apikey: apiKey, Accept: 'application/json' };
  console.log(`🔍 Searching CoreSignal: company="${company}" limit=${limit}`);
  let json;
  try {
    json = await postJson(url, headers, esQuery);
  } catch (e) {
    // If unauthorized with apikey header, retry with Bearer per docs variance
    if (String(e.message || '').includes('HTTP 401')) {
      json = await postJson(url, { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' }, esQuery);
    } else {
      throw e;
    }
  }
  if (!Array.isArray(json)) {
    // Fallback: try matching on active_experience_company_name
    esQuery = {
      query: {
        bool: {
          must: [
            { match: { active_experience_company_name: { query: company, operator: 'and' } } },
          ],
          filter: [ { term: { is_working: 1 } } ],
        },
      },
    };
    try {
      json = await postJson(url, headers, esQuery);
    } catch (e) {
      if (String(e.message || '').includes('HTTP 401')) {
        json = await postJson(url, { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' }, esQuery);
      } else {
        throw e;
      }
    }
    if (!Array.isArray(json)) {
      throw new Error('Search did not return an array of IDs. Check credentials or endpoint.');
    }
  }
  const idList = json;
  console.log(`Found candidate IDs: ${idList.length}`);

  // Collect up to limit profiles for scoring (respect costs)
  const take = Math.min(idList.length, limit);
  const collectOne = (id) => new Promise((resolve) => {
    const u = new URL(`https://api.coresignal.com/cdapi/v2/employee_multi_source/collect/${id}`);
    const options = { method: 'GET', hostname: u.hostname, path: u.pathname, headers: { apikey: apiKey, Accept: 'application/json' }, timeout: 20000 };
    const req = require('https').request(options, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) return resolve(JSON.parse(data));
        } catch {}
        resolve(null);
      });
    });
    req.on('error', () => resolve(null));
    req.end();
  });
  const collected = [];
  for (let i = 0; i < take; i += 1) {
    // Simple pacing to avoid bursts
    // eslint-disable-next-line no-await-in-loop
    const p = await collectOne(idList[i]);
    if (p) collected.push(p);
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, 100));
  }
  const candidates = collected;
  console.log(`Collected profiles for scoring: ${candidates.length}`);

  // Filter to current company match and remove interns/apprentices
  const companySynonyms = [company, `${company} Technologies`].map((s) => s.toLowerCase());
  const filtered = candidates.filter((p) => {
    const current = normalizeCurrentFields(p);
    const name = text(current.company_name);
    const title = text(current.title);
    const companyMatch = companySynonyms.some((c) => name.includes(c));
    const notIntern = !title.includes('intern') && !title.includes('apprentice');
    return companyMatch && notIntern;
  });
  const filteredCount = filtered.length;
  console.log(`After current-company filter: ${filteredCount}`);

  // Score everyone first
  const scoredAll = scoreCandidates(filteredCount > 0 ? filtered : candidates);
  // Only narrow to outer ring if candidate pool is large
  const useOuter = scoredAll.length > outerThreshold;
  const outerRing = useOuter ? scoredAll.slice(0, Math.min(outerSize, scoredAll.length)) : scoredAll;
  const { ordered: finalGroup, buckets } = selectFinalGroup(outerRing, undefined, finalCount);

  const summary = {
    company,
    sell,
    totals: {
      candidates: candidates.length,
      outerRing: outerRing.length,
      final: finalGroup.length,
      narrowed: useOuter,
    },
    buckets: Object.fromEntries(Object.entries(buckets).map(([k, arr]) => [k, arr.length])),
  };

  const formatPerson = (x) => ({
    role: x.role,
    scores: x.scores,
    full_name: x.profile.full_name || `${x.profile.first_name || ''} ${x.profile.last_name || ''}`.trim(),
    title: normalizeCurrentFields(x.profile).title,
    department: normalizeCurrentFields(x.profile).department,
    management_level: normalizeCurrentFields(x.profile).management_level,
    location: x.profile.location_full || x.profile.location_country || '',
    company: normalizeCurrentFields(x.profile).company_name,
    id: String(x.profile.id ?? x.profile.public_profile_id ?? x.profile.linkedin_shorthand_names?.[0] ?? ''),
    url: x.profile.linkedin_url || '',
  });

  const report = {
    summary,
    final_group: finalGroup.map(formatPerson),
    outer_ring_preview: outerRing.slice(0, 20).map(formatPerson),
  };

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = outfile || path.join('data/production/reports', `coresignal-buyer-group-${company.toLowerCase().replace(/\s+/g, '-')}-${ts}.json`);
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  fs.writeFileSync(filename, JSON.stringify(report, null, 2));
  console.log(`✅ Report written: ${filename}`);
}

main().catch((err) => {
  console.error('Buyer group example failed:', err.message);
  process.exit(1);
});


