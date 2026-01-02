#!/usr/bin/env node
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const https = require('https');
const FormData = require('form-data');

const prisma = new PrismaClient();
const WORKSPACE_ID = '01KBDP8ZXDTAHJNT14S3WB1DTA';
const AZ_CODES = ['480', '520', '602', '623', '928'];
const isAZ = p => { if (!p) return false; const d = String(p).replace(/\D/g,''); const a = d.length===10?d.slice(0,3):d.length===11&&d[0]==='1'?d.slice(1,4):null; return a && AZ_CODES.includes(a); };
const norm = p => p ? String(p).replace(/\D/g,'').slice(-10) : null;
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log('\n🚀 MULTI-CITY SEARCH (Low skip values work!)\n');
  
  await prisma.$connect();
  
  const existing = await prisma.people.findMany({ where: { workspaceId: WORKSPACE_ID }, select: { address: true, phone: true } });
  const existingAddrs = new Set(existing.map(e => e.address?.toLowerCase()).filter(Boolean));
  const existingPhones = new Set(existing.map(e => norm(e.phone)).filter(Boolean));
  console.log('Already have:', existingAddrs.size, 'addresses\n');

  // Multiple Arizona cities with low skip values
  const cities = ['Tempe, AZ', 'Mesa, AZ', 'Gilbert, AZ', 'Glendale, AZ', 'Peoria, AZ', 'Surprise, AZ', 'Goodyear, AZ', 'Avondale, AZ', 'Buckeye, AZ', 'Maricopa, AZ'];
  
  const properties = [];
  let creditsExhausted = false;

  for (const city of cities) {
    if (creditsExhausted || properties.length >= 300) break;
    
    console.log(`📍 ${city}...`);
    
    for (let skip = 0; skip < 200 && !creditsExhausted; skip += 50) {
      const res = await fetch('https://api.batchdata.com/api/v1/property/search', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.BATCHDATA_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchCriteria: { query: city }, options: { skip, take: 50, skipTrace: false } })
      });
      
      const data = await res.json();
      
      if (data.status?.code === 403) {
        console.log('   ⚠️ Credits exhausted');
        creditsExhausted = true;
        break;
      }
      
      if (data.status?.code !== 200 || !data.results?.properties?.length) break;
      
      let newCount = 0;
      for (const p of data.results.properties) {
        const addr = p.address?.street;
        if (addr && !existingAddrs.has(addr.toLowerCase())) {
          properties.push({
            address: addr,
            city: p.address?.city || city.split(',')[0],
            state: 'AZ',
            zip: p.address?.zip || '85001',
            firstName: p.owner?.names?.[0]?.first || '',
            lastName: p.owner?.names?.[0]?.last || ''
          });
          existingAddrs.add(addr.toLowerCase());
          newCount++;
        }
      }
      
      console.log(`   skip=${skip}: ${data.results.properties.length} found, ${newCount} new`);
      await sleep(200);
    }
  }

  console.log(`\n✅ Total new properties: ${properties.length}\n`);
  
  if (properties.length === 0) {
    console.log('No properties to process');
    await prisma.$disconnect();
    return;
  }

  // Submit to Tracerfy
  console.log('📤 Submitting to Tracerfy...');
  
  const csvPath = path.join(__dirname, 'multi-city.csv');
  const csv = [
    'address,city,state,zip,first_name,last_name,mail_address,mail_city,mail_state,mailing_zip',
    ...properties.map(p => `"${p.address}","${p.city}","${p.state}","${p.zip}","${p.firstName}","${p.lastName}","${p.address}","${p.city}","${p.state}","${p.zip}"`)
  ].join('\n');
  fs.writeFileSync(csvPath, csv);

  const formData = new FormData();
  formData.append('csv_file', fs.createReadStream(csvPath), { filename: 'props.csv', contentType: 'text/csv' });
  ['address','city','state','zip','first_name','last_name','mail_address','mail_city','mail_state','mailing_zip'].forEach(c => formData.append(c + '_column', c));

  const job = await new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'tracerfy.com', path: '/v1/api/trace/', method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.TRACERFY_API_KEY}`, ...formData.getHeaders() }
    }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { fs.unlinkSync(csvPath); try { resolve(JSON.parse(d)); } catch { reject(new Error(d)); } });
    });
    req.on('error', reject);
    formData.pipe(req);
  });

  console.log(`✅ Tracerfy job: ${job.queue_id}\n`);
  console.log('⏳ Waiting for results...\n');

  let downloadUrl = null, creditsUsed = 0;
  for (let i = 0; i < 30; i++) {
    await sleep(30000);
    try {
      const queues = await new Promise((resolve, reject) => {
        https.get({
          hostname: 'tracerfy.com', path: '/v1/api/queues/',
          headers: { 'Authorization': `Bearer ${process.env.TRACERFY_API_KEY}` }
        }, res => {
          let d = ''; res.on('data', c => d += c);
          res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve([]); } });
        }).on('error', () => resolve([]));
      });
      
      const j = queues.find(q => q.id === job.queue_id);
      if (j) {
        console.log(`Job: pending=${j.pending}, credits=${j.credits_deducted || 0}`);
        if (!j.pending && j.download_url) {
          downloadUrl = j.download_url;
          creditsUsed = j.credits_deducted || 0;
          break;
        }
      }
    } catch {}
  }

  if (!downloadUrl) { console.log('Timeout'); await prisma.$disconnect(); return; }

  console.log('\n📥 Downloading...');
  const csvData = await new Promise((resolve, reject) => {
    https.get(downloadUrl, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(d)); }).on('error', reject);
  });

  const lines = csvData.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.toLowerCase().replace(/[^a-z0-9]/g, '_'));
  const records = lines.slice(1).map(line => {
    const vals = []; let cur = '', inQ = false;
    for (const c of line) { if (c === '"') inQ = !inQ; else if (c === ',' && !inQ) { vals.push(cur); cur = ''; } else cur += c; }
    vals.push(cur);
    const rec = {}; headers.forEach((h, i) => rec[h] = (vals[i] || '').replace(/"/g, '')); return rec;
  });

  console.log(`Got ${records.length} results\n`);

  const josh = await prisma.users.findFirst({ where: { email: 'finn@runegateco.com' } });
  const clients = await prisma.users.findFirst({ where: { email: 'clients@runegateco.com' } });

  let imported = 0, noPhone = 0, nonAZ = 0, dupe = 0, toJosh = true;

  for (const r of records) {
    let azPhone = null;
    for (const f of ['primary_phone','mobile_1','mobile_2','mobile_3','landline_1','landline_2']) {
      if (r[f] && isAZ(r[f])) { azPhone = norm(r[f]); break; }
    }
    
    if (!azPhone) { ['primary_phone','mobile_1','landline_1'].some(f => r[f]) ? nonAZ++ : noPhone++; continue; }
    if (existingPhones.has(azPhone)) { dupe++; continue; }

    await prisma.people.create({
      data: {
        workspaceId: WORKSPACE_ID, mainSellerId: toJosh ? josh.id : clients.id,
        firstName: r.first_name || 'Homeowner', lastName: r.last_name || '',
        fullName: `${r.first_name || 'Homeowner'} ${r.last_name || ''}`.trim(),
        phone: azPhone, mobilePhone: azPhone, address: r.address,
        city: r.city || 'Arizona', state: 'AZ', postalCode: r.zip || '85001',
        country: 'US', status: 'LEAD', source: 'Multi-City AZ Pipeline'
      }
    });

    existingPhones.add(azPhone);
    imported++;
    console.log(`✅ ${r.first_name || 'Homeowner'} | ${azPhone} → ${toJosh ? 'Josh' : 'Clients'}`);
    toJosh = !toJosh;
  }

  const jc = await prisma.people.count({ where: { workspaceId: WORKSPACE_ID, mainSellerId: josh.id, deletedAt: null } });
  const cc = await prisma.people.count({ where: { workspaceId: WORKSPACE_ID, mainSellerId: clients.id, deletedAt: null } });
  await prisma.$disconnect();

  console.log('\n═══════════════════════════════════════════');
  console.log(`Properties:  ${properties.length}`);
  console.log(`Imported:    ${imported}`);
  console.log(`No phone:    ${noPhone}`);
  console.log(`Non-AZ:      ${nonAZ}`);
  console.log(`Duplicate:   ${dupe}`);
  console.log('───────────────────────────────────────────');
  console.log(`Josh:        ${jc}`);
  console.log(`Clients:     ${cc}`);
  console.log(`TOTAL:       ${jc + cc}`);
  console.log('═══════════════════════════════════════════\n');
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });












