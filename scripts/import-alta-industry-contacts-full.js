const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const WORKSPACE_ID = '01K7DNYR5VZ7JY36KGKKN76XZ1';

// ALTA Industry Contacts Data (full dataset from user)
const altaContactsData = [
  {
    "name": "Michael Abbey",
    "title": "President & COO",
    "company": "President & COO Meadowlark Title, LLC Boston, MA 949-584-6658 mba@meadowlarktitle.com",
    "city": null,
    "state": null,
    "phone": null,
    "email": "mba@meadowlarktitle.com",
    "image_url": "https://www.alta.org/images/vippics/1242033.jpg",
    "badges": []
  },
  {
    "name": "Ranabir Acharjee",
    "title": "Chief Strategy Officer",
    "company": "Chief Strategy Officer Remedial Infotech USA INC Jonesboro, GA 770-749-7736 ra@remedialinfotech.com",
    "city": null,
    "state": null,
    "phone": null,
    "email": "ra@remedialinfotech.com",
    "image_url": "https://www.alta.org/images/vippics/1224877.jpg",
    "badges": []
  },
  {
    "name": "Andrew Acker",
    "title": "COO",
    "company": "COO D. Bello Newport Beach, CA 949-340-2660 aacker@dbello.com",
    "city": null,
    "state": null,
    "phone": null,
    "email": "aacker@dbello.com",
    "image_url": "https://www.alta.org/images/vippics/1115680.jpg",
    "badges": []
  },
  {
    "name": "Bayleigh Ackman",
    "title": "Director, Customer Success",
    "company": "Director, Customer Success Qualia Concord, NH bayleigh.ackman@qualia.com",
    "city": null,
    "state": null,
    "phone": null,
    "email": "bayleigh.ackman@qualia.com",
    "image_url": "https://www.alta.org/images/vippics/1242085.jpg",
    "badges": []
  },
  {
    "name": "Carmen Adams",
    "title": "Agency Manager",
    "company": "Agency Manager Fidelity National Title Insurance Co. Franklin, TN 615-259-1677 carmen.adams@fnf.com",
    "city": null,
    "state": null,
    "phone": null,
    "email": "carmen.adams@fnf.com",
    "image_url": "https://www.alta.org/images/vippics/1165275.jpg",
    "badges": []
  },
  {
    "name": "Tyler Adams",
    "title": "CEO & Co-founder",
    "company": "CEO & Co-founder CertifID Austin, TX 239-281-3707 Tadams@certifID.com",
    "city": null,
    "state": null,
    "phone": null,
    "email": "Tadams@certifID.com",
    "image_url": "https://www.alta.org/images/vippics/1166415.jpg",
    "badges": []
  },
  {
    "name": "Adeel Ahmad",
    "title": "Senior Vice President",
    "company": "Senior Vice President AtClose a Visionet Company Pittsburgh, PA Adeel.Ahmad@visionet.com",
    "city": null,
    "state": null,
    "phone": null,
    "email": "Adeel.Ahmad@visionet.com",
    "image_url": "https://www.alta.org/images/vippics/1240097.jpg",
    "badges": []
  },
  {
    "name": "Ellen C Albrecht NTP",
    "title": "Senior Underwriter",
    "company": "Senior Underwriter Security 1st Title LLC Wichita, KS 316-267-8371 ealbrecht@security1st.com",
    "city": null,
    "state": null,
    "phone": null,
    "email": "ealbrecht@security1st.com",
    "image_url": "https://www.alta.org/images/vippics/1165275.jpg",
    "badges": []
  }
];

// String similarity function for company matching
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = (s1, s2) => {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();
    const costs = [];
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
  };

  return (longer.length - editDistance(longer, shorter)) / parseFloat(longer.length);
}

// Parse company information from messy field
function parseCompanyInfo(contact) {
  const companyField = contact.company || '';
  const email = contact.email || '';
  
  // The company field format is: "Title Company Name City, State Phone Email"
  // We need to extract just the company name
  
  // First, remove the email (always at the end)
  let companyName = companyField.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, '').trim();
  
  // Remove phone number (pattern: 3-3-4 digits with various separators)
  companyName = companyName.replace(/\d{3}[-.]?\d{3}[-.]?\d{4}/, '').trim();
  
  // Remove location (City, State pattern)
  companyName = companyName.replace(/[A-Za-z\s]+,\s*[A-Z]{2}/, '').trim();
  
  // Now we should have: "Title Company Name"
  // Remove the title prefix by finding where the title ends
  const title = contact.title || '';
  if (title && companyName.toLowerCase().startsWith(title.toLowerCase())) {
    companyName = companyName.substring(title.length).trim();
  }
  
  // Clean up any remaining title words at the beginning
  const commonTitleWords = ['president', 'ceo', 'coo', 'cfo', 'cto', 'vp', 'vice', 'director', 'manager', 'senior', 'chief', 'founder', 'co-founder', '&'];
  const words = companyName.split(' ');
  let startIndex = 0;
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i].toLowerCase().replace(/[^a-zA-Z]/g, '');
    if (commonTitleWords.includes(word)) {
      startIndex = i + 1;
    } else {
      break;
    }
  }
  
  companyName = words.slice(startIndex).join(' ').trim();
  
  // If we still don't have a good company name, use email domain
  if (!companyName || companyName.length < 3) {
    const domain = email.split('@')[1];
    if (domain) {
      companyName = domain.split('.')[0].replace(/[^a-zA-Z0-9]/g, ' ');
      companyName = companyName.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ');
    }
  }
  
  // Extract location info
  let city = null;
  let state = null;
  
  const locationMatch = companyField.match(/([A-Za-z\s]+),\s*([A-Z]{2})/);
  if (locationMatch) {
    city = locationMatch[1].trim();
    state = locationMatch[2].trim();
  }
  
  // Extract phone
  let phone = null;
  const phoneMatch = companyField.match(/(\d{3}[-.]?\d{3}[-.]?\d{4})/);
  if (phoneMatch) {
    phone = phoneMatch[1].replace(/[-.]/g, '-');
  }
  
  return {
    companyName: companyName || 'Unknown Company',
    city,
    state,
    phone: phone || contact.phone
  };
}

// Find or create company
async function findOrCreateCompany(companyInfo) {
  const { companyName, city, state, phone } = companyInfo;
  
  // First, try exact name match
  let company = await prisma.companies.findFirst({
    where: {
      workspaceId: WORKSPACE_ID,
      name: { equals: companyName, mode: 'insensitive' },
      deletedAt: null
    }
  });
  
  if (company) {
    console.log(`   ✅ Found existing company: ${company.name}`);
    return company;
  }
  
  // Try fuzzy matching with existing companies
  const allCompanies = await prisma.companies.findMany({
    where: {
      workspaceId: WORKSPACE_ID,
      deletedAt: null
    },
    select: { id: true, name: true }
  });
  
  let bestMatch = null;
  let bestSimilarity = 0;
  
  for (const existingCompany of allCompanies) {
    const similarity = calculateSimilarity(companyName, existingCompany.name);
    if (similarity > bestSimilarity && similarity >= 0.85) {
      bestMatch = existingCompany;
      bestSimilarity = similarity;
    }
  }
  
  if (bestMatch) {
    console.log(`   ✅ Found similar company (${Math.round(bestSimilarity * 100)}%): ${bestMatch.name} -> ${companyName}`);
    return bestMatch;
  }
  
  // Create new company
  company = await prisma.companies.create({
    data: {
      workspaceId: WORKSPACE_ID,
      name: companyName,
      city: city,
      state: state,
      country: 'USA',
      phone: phone,
      status: 'ACTIVE',
      priority: 'MEDIUM',
      createdAt: new Date(),
      updatedAt: new Date(),
      customFields: {
        importSource: 'alta_industry_contacts',
        importedAt: new Date().toISOString()
      }
    }
  });
  
  console.log(`   ✅ Created new company: ${company.name}`);
  return company;
}

// Main import function
async function importAltaContacts() {
  console.log('🚀 ALTA INDUSTRY CONTACTS IMPORT');
  console.log('=' .repeat(60));
  console.log(`\n📊 Processing ${altaContactsData.length} contacts...\n`);
  
  let stats = {
    total: altaContactsData.length,
    peopleCreated: 0,
    peopleSkipped: 0,
    companiesCreated: 0,
    companiesFound: 0,
    errors: []
  };
  
  for (let i = 0; i < altaContactsData.length; i++) {
    const contact = altaContactsData[i];
    console.log(`\n[${i + 1}/${altaContactsData.length}] Processing: ${contact.name}`);
    
    try {
      // Check if person already exists
      const existingPerson = await prisma.people.findFirst({
        where: {
          workspaceId: WORKSPACE_ID,
          email: contact.email
        }
      });
      
      if (existingPerson) {
        console.log(`   ⏭️  Person already exists: ${contact.email}`);
        stats.peopleSkipped++;
        continue;
      }
      
      // Parse company information
      const companyInfo = parseCompanyInfo(contact);
      console.log(`   📋 Parsed company: "${companyInfo.companyName}"`);
      
      // Find or create company
      const company = await findOrCreateCompany(companyInfo);
      
      if (company.id.startsWith('temp_')) {
        stats.companiesCreated++;
      } else {
        stats.companiesFound++;
      }
      
      // Create person
      const newPerson = await prisma.people.create({
        data: {
          workspaceId: WORKSPACE_ID,
          companyId: company.id,
          fullName: contact.name,
          firstName: contact.name.split(' ')[0],
          lastName: contact.name.split(' ').slice(1).join(' '),
          email: contact.email,
          phone: companyInfo.phone,
          jobTitle: contact.title,
          city: companyInfo.city,
          state: companyInfo.state,
          country: 'USA',
          status: 'PROSPECT',
          priority: 'MEDIUM',
          createdAt: new Date(),
          updatedAt: new Date(),
          customFields: {
            importSource: 'alta_industry_contacts',
            originalData: contact,
            importedAt: new Date().toISOString()
          }
        }
      });
      
      console.log(`   ✅ Created person: ${newPerson.fullName} at ${company.name}`);
      stats.peopleCreated++;
      
    } catch (error) {
      console.error(`   ❌ Error processing ${contact.name}:`, error.message);
      stats.errors.push({
        person: contact.name,
        error: error.message
      });
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 IMPORT SUMMARY');
  console.log('=' .repeat(60));
  console.log(`Total contacts processed: ${stats.total}`);
  console.log(`People created: ${stats.peopleCreated}`);
  console.log(`People skipped (already exist): ${stats.peopleSkipped}`);
  console.log(`Companies created: ${stats.companiesCreated}`);
  console.log(`Companies found (existing): ${stats.companiesFound}`);
  console.log(`Errors: ${stats.errors.length}`);
  
  if (stats.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    stats.errors.forEach(error => {
      console.log(`   - ${error.person}: ${error.error}`);
    });
  }
  
  return stats;
}

// Run the import
importAltaContacts()
  .then(stats => {
    console.log('\n✅ Import completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  });
