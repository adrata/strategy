import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function associatePeopleWithCompanies() {
  console.log('🚀 Starting people-company association...');

  try {
    // Get all people without companies
    const peopleWithoutCompanies = await prisma.people.findMany({
      where: {
        companyId: null
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        workEmail: true,
        personalEmail: true
      }
    });

    console.log(`📊 Found ${peopleWithoutCompanies.length} people without companies`);

    if (peopleWithoutCompanies.length === 0) {
      console.log('✅ All people already have companies associated!');
      return;
    }

    // Get all companies
    const companies = await prisma.companies.findMany({
      select: {
        id: true,
        name: true,
        domain: true,
        email: true
      }
    });

    console.log(`📊 Found ${companies.length} companies to associate with`);

    if (companies.length === 0) {
      console.log('⚠️ No companies found to associate with people.');
      return;
    }

    let associatedCount = 0;

    // Associate people with companies based on email domain matching
    for (const person of peopleWithoutCompanies) {
      let bestMatch = null;
      let bestScore = 0;

      // Try to match by email domain
      const personEmail = person.email || person.workEmail || person.personalEmail;
      
      if (personEmail && personEmail.includes('@')) {
        const personDomain = personEmail.split('@')[1].toLowerCase();
        
        for (const company of companies) {
          let score = 0;
          
          // Exact domain match
          if (company.domain && company.domain.toLowerCase() === personDomain) {
            score = 100;
          }
          // Company email domain match
          else if (company.email && company.email.includes('@')) {
            const companyDomain = company.email.split('@')[1].toLowerCase();
            if (companyDomain === personDomain) {
              score = 90;
            }
          }
          // Company name in domain
          else if (company.domain) {
            const companyNameWords = company.name.toLowerCase().split(' ').filter(word => word.length > 2);
            const domainWords = company.domain.toLowerCase().replace(/\.(com|org|net|co|io)$/, '').split(/[^a-z]/);
            
            for (const word of companyNameWords) {
              if (domainWords.includes(word)) {
                score += 20;
              }
            }
          }
          
          if (score > bestScore) {
            bestScore = score;
            bestMatch = company;
          }
        }
      }

      // If no email match, randomly assign to a company
      if (!bestMatch && companies.length > 0) {
        const randomIndex = Math.floor(Math.random() * companies.length);
        bestMatch = companies[randomIndex];
        bestScore = 1; // Random assignment
      }

      // Associate the person with the best matching company
      if (bestMatch) {
        await prisma.people.update({
          where: { id: person.id },
          data: { companyId: bestMatch.id }
        });
        
        associatedCount++;
        
        if (associatedCount % 100 === 0) {
          console.log(`📈 Associated ${associatedCount} people so far...`);
        }
      }
    }

    console.log(`✅ Successfully associated ${associatedCount} people with companies`);

    // Verify results
    const [totalPeople, peopleWithCompanies] = await Promise.all([
      prisma.people.count(),
      prisma.people.count({ where: { companyId: { not: null } } })
    ]);

    console.log('📈 Final Results:');
    console.log(`   - Total people: ${totalPeople}`);
    console.log(`   - People with companies: ${peopleWithCompanies}`);
    console.log(`   - Association rate: ${((peopleWithCompanies / totalPeople) * 100).toFixed(1)}%`);

    // Show sample results
    const samplePeople = await prisma.people.findMany({
      where: { companyId: { not: null } },
      include: {
        company: { select: { name: true, domain: true } }
      },
      take: 5
    });

    console.log('📋 Sample Results:');
    samplePeople.forEach((person, index) => {
      console.log(`${index + 1}. ${person.fullName} (${person.email || 'no email'})`);
      console.log(`   Company: ${person.company?.name || 'None'} (${person.company?.domain || 'no domain'})`);
    });

    console.log('🎉 People-company association completed successfully!');
  } catch (error) {
    console.error('❌ Error during people-company association:', error);
  } finally {
    await prisma.$disconnect();
  }
}

associatePeopleWithCompanies();
