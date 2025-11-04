#!/usr/bin/env node

/**
 * IMPORT CONTACTS TO NOTARY EVERYDAY WORKSPACE
 * 
 * Imports missing companies and people from contacts_list_updated.csv
 * into the Notary Everyday workspace and assigns noel as the main seller.
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Parse CSV file with proper handling of quoted fields
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

// Parse CSV file
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  const headers = parseCSVLine(lines[0]);
  
  const contacts = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length >= 4 && values[0]) {
      contacts.push({
        name: values[0].replace(/^"|"$/g, ''),
        company: values[1].replace(/^"|"$/g, ''),
        title: values[2].replace(/^"|"$/g, ''),
        email: values[3].replace(/^"|"$/g, '').trim()
      });
    }
  }
  
  return contacts;
}

// Normalize company name for matching
function normalizeCompanyName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()\[\]]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\b(inc|llc|ltd|corp|corporation|company|co|llp|plc|gmbh|ag|sa|srl|spa|bv|nv|ab|oy|asa|as)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Extract domain from email
function extractDomain(email) {
  if (!email || !email.includes('@')) return null;
  return email.split('@')[1].toLowerCase();
}

// Extract first and last name from full name
function parseName(fullName) {
  if (!fullName) return { firstName: '', lastName: '' };
  
  const parts = fullName.trim().split(/\s+/).filter(p => p.length > 0);
  
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  
  // Remove middle initials and suffixes
  const filteredParts = parts.filter(p => 
    !/^[A-Z]\.?$/.test(p) && 
    !/^(jr|sr|ii|iii|iv|esq|phd|md)$/i.test(p)
  );
  
  if (filteredParts.length === 0) {
    return { firstName: parts[0], lastName: parts[parts.length - 1] };
  }
  
  return {
    firstName: filteredParts[0],
    lastName: filteredParts[filteredParts.length - 1]
  };
}

async function importContactsToNotaryEveryday() {
  try {
    console.log('Importing contacts from CSV to Notary Everyday workspace...\n');
    
    // Parse CSV
    const csvPath = path.join(__dirname, '..', 'contacts_list_updated.csv');
    const contacts = parseCSV(csvPath);
    console.log(`Found ${contacts.length} contacts in CSV\n`);
    
    // Find Notary Everyday workspace
    const notaryWorkspace = await prisma.workspaces.findFirst({
      where: {
        name: {
          contains: 'Notary Everyday',
          mode: 'insensitive'
        }
      }
    });
    
    if (!notaryWorkspace) {
      throw new Error('Notary Everyday workspace not found!');
    }
    
    console.log(`Found workspace: ${notaryWorkspace.name} (${notaryWorkspace.id})\n`);
    
    // Find noel user
    const noelUser = await prisma.users.findFirst({
      where: {
        email: 'noel@notaryeveryday.com'
      }
    });
    
    if (!noelUser) {
      throw new Error('Noel user not found! Expected email: noel@notaryeveryday.com');
    }
    
    console.log(`Found seller: ${noelUser.name} (${noelUser.email}) - ID: ${noelUser.id}\n`);
    
    // Get existing companies in workspace
    const existingCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: notaryWorkspace.id
      },
      select: {
        id: true,
        name: true
      }
    });
    
    console.log(`Found ${existingCompanies.length} existing companies in workspace\n`);
    
    // Create a map of normalized company names to company IDs
    const companyMap = new Map();
    existingCompanies.forEach(company => {
      const normalized = normalizeCompanyName(company.name);
      if (!companyMap.has(normalized)) {
        companyMap.set(normalized, []);
      }
      companyMap.get(normalized).push(company);
    });
    
    // Get existing people in workspace
    const existingPeople = await prisma.people.findMany({
      where: {
        workspaceId: notaryWorkspace.id
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        workEmail: true,
        personalEmail: true
      }
    });
    
    console.log(`Found ${existingPeople.length} existing people in workspace\n`);
    
    // Create a map of emails to people
    const peopleEmailMap = new Map();
    existingPeople.forEach(person => {
      if (person.email) {
        peopleEmailMap.set(person.email.toLowerCase().trim(), person);
      }
      if (person.workEmail) {
        peopleEmailMap.set(person.workEmail.toLowerCase().trim(), person);
      }
      if (person.personalEmail) {
        peopleEmailMap.set(person.personalEmail.toLowerCase().trim(), person);
      }
    });
    
    // Statistics
    const stats = {
      companiesCreated: 0,
      companiesFound: 0,
      peopleCreated: 0,
      peopleFound: 0,
      errors: []
    };
    
    // Process each contact
    console.log('Processing contacts...\n');
    
    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      
      if (!contact.name || !contact.name.trim()) {
        console.log(`[${i + 1}/${contacts.length}] Skipping contact with no name`);
        continue;
      }
      
      console.log(`[${i + 1}/${contacts.length}] Processing: ${contact.name}${contact.company ? ` at ${contact.company}` : ''}`);
      
      try {
        // Step 1: Find or create company
        let companyId = null;
        
        if (contact.company && contact.company.trim()) {
          const normalizedCompanyName = normalizeCompanyName(contact.company);
          
          // Check if company already exists
          const existingCompanyMatches = Array.from(companyMap.entries())
            .filter(([normalized, companies]) => normalized === normalizedCompanyName)
            .flatMap(([_, companies]) => companies);
          
          if (existingCompanyMatches.length > 0) {
            // Use the first matching company
            companyId = existingCompanyMatches[0].id;
            stats.companiesFound++;
            console.log(`   ✓ Found existing company: ${existingCompanyMatches[0].name}`);
          } else {
            // Create new company
            const domain = contact.email ? extractDomain(contact.email) : null;
            
            const newCompany = await prisma.companies.create({
              data: {
                workspaceId: notaryWorkspace.id,
                name: contact.company.trim(),
                email: domain && contact.email ? contact.email : null,
                domain: domain,
                industry: 'Real Estate / Title Services',
                status: 'ACTIVE',
                mainSellerId: noelUser.id,
                createdAt: new Date(),
                updatedAt: new Date()
              }
            });
            
            companyId = newCompany.id;
            stats.companiesCreated++;
            
            // Add to map for future lookups
            companyMap.set(normalizedCompanyName, [newCompany]);
            
            console.log(`   ✓ Created new company: ${contact.company}`);
          }
        }
        
        // Step 2: Check if person already exists by email
        let personExists = false;
        if (contact.email && contact.email.trim()) {
          const emailKey = contact.email.toLowerCase().trim();
          if (peopleEmailMap.has(emailKey)) {
            personExists = true;
            stats.peopleFound++;
            console.log(`   ✓ Found existing person: ${peopleEmailMap.get(emailKey).fullName}`);
          }
        }
        
        // Step 3: Create person if not found
        if (!personExists) {
          const { firstName, lastName } = parseName(contact.name);
          
          // Ensure we have at least a first name
          const finalFirstName = firstName || contact.name.split(' ')[0] || 'Unknown';
          const finalLastName = lastName || contact.name.split(' ').slice(1).join(' ') || '';
          
          const newPerson = await prisma.people.create({
            data: {
              workspaceId: notaryWorkspace.id,
              companyId: companyId,
              firstName: finalFirstName,
              lastName: finalLastName,
              fullName: contact.name.trim(),
              email: contact.email && contact.email.trim() ? contact.email.trim() : null,
              jobTitle: contact.title && contact.title.trim() ? contact.title.trim() : null,
              mainSellerId: noelUser.id,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
          
          stats.peopleCreated++;
          
          // Add to email map
          if (newPerson.email) {
            peopleEmailMap.set(newPerson.email.toLowerCase().trim(), newPerson);
          }
          
          console.log(`   ✓ Created new person: ${contact.name}`);
        }
        
      } catch (error) {
        console.error(`   ❌ Error processing ${contact.name}:`, error.message);
        stats.errors.push({
          contact: contact.name,
          error: error.message
        });
      }
    }
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('IMPORT SUMMARY');
    console.log('='.repeat(60));
    console.log(`Companies created: ${stats.companiesCreated}`);
    console.log(`Companies found (already existed): ${stats.companiesFound}`);
    console.log(`People created: ${stats.peopleCreated}`);
    console.log(`People found (already existed): ${stats.peopleFound}`);
    
    if (stats.errors.length > 0) {
      console.log(`\nErrors: ${stats.errors.length}`);
      stats.errors.forEach(err => {
        console.log(`  - ${err.contact}: ${err.error}`);
      });
    }
    
    console.log('\n✅ Import complete!');
    
  } catch (error) {
    console.error('❌ Error during import:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
importContactsToNotaryEveryday()
  .then(() => {
    console.log('\n✅ Import script completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

