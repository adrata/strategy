#!/usr/bin/env node

/**
 * CHECK CONTACTS IN NOTARY EVERYDAY WORKSPACE
 * 
 * Checks if companies and people from contacts_list_updated.csv
 * exist in the Notary Everyday workspace.
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

// Normalize person name for matching
function normalizePersonName(name) {
  if (!name) return '';
  // Remove titles and suffixes
  return name
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()\[\]]/g, '')
    .replace(/\b(mr|mrs|ms|dr|prof|jr|sr|ii|iii|iv|esq|phd|md)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Extract key words from company name for better matching
function extractKeyWords(name) {
  if (!name) return [];
  const normalized = normalizeCompanyName(name);
  const words = normalized.split(/\s+/).filter(w => w.length > 2);
  return words.sort();
}

// Calculate similarity score between two strings (0-1)
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
  const norm1 = normalizeCompanyName(str1);
  const norm2 = normalizeCompanyName(str2);
  
  if (norm1 === norm2) return 1;
  
  // Exact match after normalization
  if (norm1 === norm2) return 1;
  
  // One contains the other (high similarity)
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    const longer = Math.max(norm1.length, norm2.length);
    const shorter = Math.min(norm1.length, norm2.length);
    return shorter / longer;
  }
  
  // Word-based matching
  const words1 = extractKeyWords(str1);
  const words2 = extractKeyWords(str2);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  const commonWords = words1.filter(w => words2.includes(w));
  const totalWords = new Set([...words1, ...words2]).size;
  
  if (commonWords.length === 0) return 0;
  
  // Calculate Jaccard similarity
  const jaccard = commonWords.length / totalWords;
  
  // Boost if key words match (like "title", "fidelity", "first american")
  const keyWords = ['title', 'fidelity', 'first', 'american', 'commonwealth', 'land', 'national', 'financial'];
  const keyWordMatches = keyWords.filter(kw => 
    norm1.includes(kw) && norm2.includes(kw)
  ).length;
  
  const boost = keyWordMatches * 0.2;
  
  return Math.min(1, jaccard + boost);
}

// Check if strings are similar (fuzzy matching with threshold)
function isSimilar(str1, str2, threshold = 0.6) {
  const similarity = calculateSimilarity(str1, str2);
  
  if (similarity >= threshold) return true;
  
  // Check for common variations and abbreviations
  const variations = [
    // FNF Family variations
    { pattern: /^fnf\s+family\s+of\s+companies$/i, match: /^fidelity$/i },
    { pattern: /^fnf\s+family\s+of\s+companies$/i, match: /^fidelity\s+national\s+financial$/i },
    { pattern: /^fidelity$/i, match: /^fidelity\s+national\s+financial$/i },
    { pattern: /^fidelity$/i, match: /^fnf$/i },
    
    // First American variations
    { pattern: /^first\s+american\s+title$/i, match: /^first\s+american$/i },
    { pattern: /^first\s+american\s+title\s+insurance\s+company$/i, match: /^first\s+american$/i },
    
    // Commonwealth variations
    { pattern: /^commonwealth\s+land\s+title$/i, match: /^commonwealth\s+land$/i },
    { pattern: /^commonwealth\s+land\s+title$/i, match: /^cltic$/i },
    { pattern: /^commonwealth\s+land\s+title\s+insurance\s+company$/i, match: /^commonwealth\s+land\s+title$/i },
    
    // Driggs variations
    { pattern: /^driggs\s+title$/i, match: /^driggs\s+title\s+agency$/i },
    
    // ClosingLock variations
    { pattern: /^closinglock$/i, match: /^closing\s+lock$/i },
  ];
  
  for (const variation of variations) {
    if (variation.pattern.test(str1) && variation.match.test(str2)) {
      return true;
    }
    if (variation.pattern.test(str2) && variation.match.test(str1)) {
      return true;
    }
  }
  
  return false;
}

// Match person names with better fuzzy matching
function matchPersonName(name1, name2) {
  if (!name1 || !name2) return false;
  
  const norm1 = normalizePersonName(name1);
  const norm2 = normalizePersonName(name2);
  
  if (norm1 === norm2) return true;
  
  // Extract first and last names
  const parts1 = norm1.split(/\s+/).filter(p => p.length > 0);
  const parts2 = norm2.split(/\s+/).filter(p => p.length > 0);
  
  if (parts1.length === 0 || parts2.length === 0) return false;
  
  // Check if last names match (most important for person matching)
  const last1 = parts1[parts1.length - 1];
  const last2 = parts2[parts2.length - 1];
  
  if (last1 === last2 && last1.length > 2) {
    // Last names match, check if first names match or are similar
    const first1 = parts1[0];
    const first2 = parts2[0];
    
    // Exact first name match
    if (first1 === first2) return true;
    
    // Check if first name is an initial (e.g., "t" matches "todd")
    if ((first1.length === 1 && first2.startsWith(first1)) ||
        (first2.length === 1 && first1.startsWith(first2))) {
      return true;
    }
    
    // Check if one first name is abbreviation of the other (e.g., "rob" matches "robert")
    if (first1.startsWith(first2) || first2.startsWith(first1)) {
      return true;
    }
    
    // If last name matches and first names are similar, it's likely the same person
    return calculateSimilarity(first1, first2) > 0.7;
  }
  
  // Check full name similarity
  return calculateSimilarity(norm1, norm2) > 0.7;
}

async function checkContactsInNotaryEveryday() {
  try {
    console.log('Checking contacts from CSV in Notary Everyday workspace...\n');
    
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
    
    // Get unique companies from CSV
    const uniqueCompanies = [...new Set(contacts
      .map(c => c.company)
      .filter(c => c && c.trim())
    )];
    
    console.log(`Checking ${uniqueCompanies.length} unique companies...\n`);
    
    // Get all companies in Notary Everyday workspace
    const workspaceCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: notaryWorkspace.id
      },
      select: {
        id: true,
        name: true,
        email: true,
        website: true
      }
    });
    
    console.log(`Found ${workspaceCompanies.length} companies in Notary Everyday workspace\n`);
    
    // Check each company from CSV
    const companyResults = [];
    for (const csvCompany of uniqueCompanies) {
      const normalizedCsv = normalizeCompanyName(csvCompany);
      
      // First try exact match after normalization
      let matches = workspaceCompanies.filter(wsCompany => {
        const normalizedWs = normalizeCompanyName(wsCompany.name);
        return normalizedCsv === normalizedWs;
      });
      
      // If no exact match, try fuzzy matching with higher threshold
      if (matches.length === 0) {
        matches = workspaceCompanies.filter(wsCompany => {
          const similarity = calculateSimilarity(csvCompany, wsCompany.name);
          // Use higher threshold for fuzzy matching (0.75 instead of 0.6)
          return similarity >= 0.75 || isSimilar(csvCompany, wsCompany.name, 0.75);
        });
      }
      
      companyResults.push({
        csvCompany,
        found: matches.length > 0,
        matches: matches.map(m => ({
          id: m.id,
          name: m.name,
          email: m.email,
          website: m.website
        }))
      });
    }
    
    // Check people
    const allPeople = await prisma.people.findMany({
      where: {
        workspaceId: notaryWorkspace.id
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        workEmail: true,
        personalEmail: true,
        companyId: true,
        company: {
          select: {
            name: true
          }
        }
      }
    });
    
    console.log(`Found ${allPeople.length} people in Notary Everyday workspace\n`);
    
    // Check each person from CSV
    const peopleResults = [];
    for (const contact of contacts) {
      if (!contact.name || !contact.name.trim()) continue;
      
      // Try to find by name (fuzzy matching)
      const nameMatches = allPeople.filter(person => 
        matchPersonName(contact.name, person.fullName)
      );
      
      // Try to find by email (exact match)
      const emailMatches = contact.email ? allPeople.filter(person => {
        const contactEmail = contact.email.toLowerCase().trim();
        return person.email?.toLowerCase().trim() === contactEmail ||
               person.workEmail?.toLowerCase().trim() === contactEmail ||
               person.personalEmail?.toLowerCase().trim() === contactEmail;
      }) : [];
      
      // Combine matches (deduplicate by ID)
      const allMatches = [...new Set([...nameMatches, ...emailMatches].map(p => p.id))]
        .map(id => {
          const person = allPeople.find(p => p.id === id);
          return person ? person : null;
        })
        .filter(Boolean);
      
      peopleResults.push({
        csvContact: contact,
        found: allMatches.length > 0,
        matches: allMatches.map(m => ({
          id: m.id,
          fullName: m.fullName,
          email: m.email || m.workEmail || m.personalEmail,
          company: m.company?.name || 'No company'
        }))
      });
    }
    
    // Generate report
    console.log('\n========================================');
    console.log('COMPANY CHECK RESULTS');
    console.log('========================================\n');
    
    const foundCompanies = companyResults.filter(r => r.found);
    const notFoundCompanies = companyResults.filter(r => !r.found);
    
    console.log(`✅ Found: ${foundCompanies.length}/${uniqueCompanies.length} companies\n`);
    foundCompanies.forEach(result => {
      console.log(`  ✓ ${result.csvCompany}`);
      result.matches.forEach(match => {
        console.log(`    → ${match.name} (ID: ${match.id})`);
      });
    });
    
    console.log(`\n❌ Not Found: ${notFoundCompanies.length}/${uniqueCompanies.length} companies\n`);
    notFoundCompanies.forEach(result => {
      console.log(`  ✗ ${result.csvCompany}`);
    });
    
    console.log('\n========================================');
    console.log('PEOPLE CHECK RESULTS');
    console.log('========================================\n');
    
    const foundPeople = peopleResults.filter(r => r.found);
    const notFoundPeople = peopleResults.filter(r => !r.found);
    
    console.log(`✅ Found: ${foundPeople.length}/${contacts.length} people\n`);
    foundPeople.forEach(result => {
      console.log(`  ✓ ${result.csvContact.name} (${result.csvContact.email || 'no email'})`);
      result.matches.forEach(match => {
        console.log(`    → ${match.fullName} (${match.email || 'no email'}) - Company: ${match.company}`);
      });
    });
    
    console.log(`\n❌ Not Found: ${notFoundPeople.length}/${contacts.length} people\n`);
    notFoundPeople.forEach(result => {
      console.log(`  ✗ ${result.csvContact.name} (${result.csvContact.email || 'no email'}) - ${result.csvContact.company || 'No company'}`);
    });
    
    // Summary
    console.log('\n========================================');
    console.log('SUMMARY');
    console.log('========================================\n');
    console.log(`Companies: ${foundCompanies.length}/${uniqueCompanies.length} found (${Math.round(foundCompanies.length / uniqueCompanies.length * 100)}%)`);
    console.log(`People: ${foundPeople.length}/${contacts.length} found (${Math.round(foundPeople.length / contacts.length * 100)}%)`);
    
  } catch (error) {
    console.error('Error during check:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkContactsInNotaryEveryday()
  .then(() => {
    console.log('\n✅ Check complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

