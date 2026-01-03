#!/usr/bin/env node

/**
 * Audit Lusha phone number for Monica Fundak
 * Re-query Lusha API to see what number it returns
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

const TARGET_NUMBER = '+61 466 498 700';
const WORKSPACE_SLUG = 'notary-everyday';

async function auditLushaForMonicaFundak() {
  try {
    await prisma.$connect();
    console.log('Connected to database\n');

    // Find Notary Everyday workspace
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: 'Notary Everyday' },
          { name: { contains: 'Notary Everyday', mode: 'insensitive' } },
          { slug: { contains: 'notary-everyday', mode: 'insensitive' } }
        ],
        isActive: true
      }
    });

    if (!workspace) {
      throw new Error('Notary Everyday workspace not found!');
    }

    console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})\n`);

    // Find Monica Fundak
    console.log('🔍 Finding Monica Fundak...\n');
    const person = await prisma.people.findFirst({
      where: {
        workspaceId: workspace.id,
        OR: [
          { phone: { contains: '466498700', mode: 'insensitive' } },
          { fullName: { contains: 'Monica', mode: 'insensitive' } },
          { fullName: { contains: 'Fundak', mode: 'insensitive' } }
        ],
        deletedAt: null
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            website: true,
            domain: true
          }
        }
      }
    });

    if (!person) {
      throw new Error('Monica Fundak not found!');
    }

    console.log('='.repeat(80));
    console.log('MONICA FUNDAK - CURRENT RECORD');
    console.log('='.repeat(80));
    console.log(`ID: ${person.id}`);
    console.log(`Full Name: ${person.fullName || 'N/A'}`);
    console.log(`Email: ${person.email || 'N/A'}`);
    console.log(`Work Email: ${person.workEmail || 'N/A'}`);
    console.log(`LinkedIn: ${person.linkedinUrl || 'N/A'}`);
    console.log(`Phone: ${person.phone || 'N/A'}`);
    console.log(`Mobile: ${person.mobilePhone || 'N/A'}`);
    console.log(`Work Phone: ${person.workPhone || 'N/A'}`);
    console.log(`Company: ${person.company?.name || 'N/A'}`);
    console.log(`Company Domain: ${person.company?.domain || 'N/A'}`);
    console.log(`Job Title: ${person.jobTitle || 'N/A'}`);
    console.log(`Created: ${person.createdAt}`);
    console.log(`Updated: ${person.updatedAt}`);
    console.log('');

    // Check if we have Lusha API credentials
    const LUSHA_API_KEY = process.env.LUSHA_API_KEY;
    if (!LUSHA_API_KEY) {
      console.log('⚠️  LUSHA_API_KEY not found in environment variables');
      console.log('   Cannot query Lusha API directly\n');
      return;
    }

    console.log('='.repeat(80));
    console.log('QUERYING LUSHA API');
    console.log('='.repeat(80));
    console.log('');

    // Try different Lusha query methods
    const queries = [];

    // Method 1: Query by email
    if (person.email || person.workEmail) {
      const email = person.workEmail || person.email;
      queries.push({
        method: 'email',
        params: { email },
        description: `Query by email: ${email}`
      });
    }

    // Method 2: Query by name + company domain
    if (person.fullName && person.company?.domain) {
      const nameParts = person.fullName.split(' ');
      if (nameParts.length >= 2) {
        queries.push({
          method: 'name_company',
          params: {
            firstName: nameParts[0],
            lastName: nameParts.slice(1).join(' '),
            company: person.company.name,
            companyDomain: person.company.domain
          },
          description: `Query by name + company: ${person.fullName} @ ${person.company.name}`
        });
      }
    }

    // Method 3: Query by LinkedIn URL
    if (person.linkedinUrl) {
      queries.push({
        method: 'linkedin',
        params: { linkedinUrl: person.linkedinUrl },
        description: `Query by LinkedIn: ${person.linkedinUrl}`
      });
    }

    const lushaResults = [];

    for (const query of queries) {
      console.log(`🔍 ${query.description}...`);
      
      try {
        let response;
        
        if (query.method === 'email') {
          // Lusha Person API by email
          response = await axios.get('https://api.lusha.com/person', {
            params: {
              email: query.params.email
            },
            headers: {
              'api-key': LUSHA_API_KEY
            },
            timeout: 10000
          });
        } else if (query.method === 'name_company') {
          // Lusha Person API by name + company
          response = await axios.get('https://api.lusha.com/person', {
            params: {
              firstName: query.params.firstName,
              lastName: query.params.lastName,
              company: query.params.company,
              companyDomain: query.params.companyDomain
            },
            headers: {
              'api-key': LUSHA_API_KEY
            },
            timeout: 10000
          });
        } else if (query.method === 'linkedin') {
          // Extract LinkedIn username from URL
          const linkedinMatch = query.params.linkedinUrl.match(/linkedin\.com\/in\/([^\/\?]+)/);
          if (linkedinMatch) {
            response = await axios.get('https://api.lusha.com/person', {
              params: {
                linkedinUrl: `https://www.linkedin.com/in/${linkedinMatch[1]}`
              },
              headers: {
                'api-key': LUSHA_API_KEY
              },
              timeout: 10000
            });
          } else {
            console.log('   ⚠️  Could not extract LinkedIn username from URL\n');
            continue;
          }
        }

        if (response && response.data) {
          const data = response.data;
          
          console.log('   ✅ Lusha returned data:');
          console.log(`      Name: ${data.firstName || ''} ${data.lastName || ''}`);
          console.log(`      Email: ${data.emails?.[0]?.email || 'N/A'}`);
          console.log(`      Phone Numbers:`);
          
          if (data.phones && data.phones.length > 0) {
            data.phones.forEach((phone, i) => {
              console.log(`         ${i + 1}. ${phone.number || 'N/A'} (${phone.type || 'unknown'} - ${phone.country || 'unknown'})`);
            });
          } else {
            console.log(`         No phone numbers found`);
          }
          
          console.log(`      LinkedIn: ${data.linkedInUrl || 'N/A'}`);
          console.log(`      Company: ${data.company || 'N/A'}`);
          console.log('');

          lushaResults.push({
            method: query.method,
            data: data,
            phones: data.phones || []
          });
        } else {
          console.log('   ⚠️  No data returned from Lusha\n');
        }

      } catch (error) {
        if (error.response) {
          console.log(`   ❌ Lusha API error: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`);
          if (error.response.status === 404) {
            console.log('      Person not found in Lusha database');
          } else if (error.response.status === 429) {
            console.log('      Rate limit exceeded');
          }
        } else {
          console.log(`   ❌ Error: ${error.message}`);
        }
        console.log('');
      }

      // Wait between requests to respect rate limits
      if (queries.indexOf(query) < queries.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Summary
    console.log('='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    console.log(`Current number in database: ${TARGET_NUMBER}`);
    console.log(`Number format: ${TARGET_NUMBER.replace(/\s/g, '')}`);
    console.log('');

    if (lushaResults.length > 0) {
      const allPhones = lushaResults.flatMap(r => r.phones);
      const uniquePhones = [...new Set(allPhones.map(p => p.number))];
      
      console.log(`Lusha queries attempted: ${queries.length}`);
      console.log(`Successful queries: ${lushaResults.length}`);
      console.log(`Phone numbers found: ${uniquePhones.length}`);
      console.log('');

      if (uniquePhones.length > 0) {
        console.log('Phone numbers from Lusha:');
        uniquePhones.forEach((phone, i) => {
          const isCurrentNumber = phone.replace(/\s/g, '') === TARGET_NUMBER.replace(/\s/g, '');
          console.log(`   ${i + 1}. ${phone}${isCurrentNumber ? ' ✅ (matches current)' : ' ❌ (different)'}`);
        });
        console.log('');

        const currentNumberClean = TARGET_NUMBER.replace(/\s/g, '').replace(/-/g, '');
        const matchesCurrent = uniquePhones.some(p => {
          const clean = p.replace(/\s/g, '').replace(/-/g, '');
          return clean === currentNumberClean || clean.includes(currentNumberClean) || currentNumberClean.includes(clean);
        });

        if (matchesCurrent) {
          console.log('✅ Lusha returned the same number that is currently in the database');
        } else {
          console.log('⚠️  Lusha returned DIFFERENT number(s) than what is in the database');
          console.log('   This suggests the number may have been incorrectly enriched or changed');
        }
      } else {
        console.log('⚠️  Lusha did not return any phone numbers');
        console.log('   The current number may have come from a different source');
      }
    } else {
      console.log('⚠️  No successful Lusha queries');
      console.log('   Cannot verify if the number came from Lusha');
    }
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

auditLushaForMonicaFundak();













