import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function assignOwnersBalanced() {
  console.log('🚀 Starting balanced owner assignment...');

  try {
    // Find Dan and Ross users
    const dan = await prisma.users.findFirst({ where: { firstName: 'Dan', lastName: 'Mirolli' } });
    const ross = await prisma.users.findFirst({ where: { firstName: 'Ross', lastName: 'Sylvester' } });

    if (!dan) {
      console.error('❌ Dan Mirolli not found in users table.');
      return;
    }
    if (!ross) {
      console.error('❌ Ross Sylvester not found in users table.');
      return;
    }

    console.log(`✅ Found Dan: ${dan.name} (ID: ${dan.id})`);
    console.log(`✅ Found Ross: ${ross.name} (ID: ${ross.id})`);

    // Get all people
    const allPeople = await prisma.people.findMany({ 
      select: { id: true, ownerId: true, fullName: true },
      orderBy: { createdAt: 'asc' } // Consistent ordering
    });
    console.log(`📊 Found ${allPeople.length} people to update`);

    if (allPeople.length === 0) {
      console.log('⚠️ No people found to assign owners to.');
      return;
    }

    // Split people in half
    const halfPoint = Math.ceil(allPeople.length / 2);
    const firstHalf = allPeople.slice(0, halfPoint);
    const secondHalf = allPeople.slice(halfPoint);

    console.log(`👑 Assigning first ${firstHalf.length} people to Dan...`);
    console.log(`👑 Assigning remaining ${secondHalf.length} people to Ross...`);

    // Update first half to Dan
    if (firstHalf.length > 0) {
      const danUpdateResult = await prisma.people.updateMany({
        where: {
          id: {
            in: firstHalf.map(p => p.id)
          }
        },
        data: {
          ownerId: dan.id,
        }
      });
      console.log(`✅ Updated ${danUpdateResult.count} people with Dan as owner.`);
    }

    // Update second half to Ross
    if (secondHalf.length > 0) {
      const rossUpdateResult = await prisma.people.updateMany({
        where: {
          id: {
            in: secondHalf.map(p => p.id)
          }
        },
        data: {
          ownerId: ross.id,
        }
      });
      console.log(`✅ Updated ${rossUpdateResult.count} people with Ross as owner.`);
    }

    // Add Ross as co-seller for Dan's people
    console.log('🤝 Adding Ross as co-seller for Dan\'s people...');
    for (const person of firstHalf) {
      // Check if Ross is already a co-seller to avoid duplicates
      const existingCoSeller = await prisma.person_co_sellers.findUnique({
        where: {
          personId_userId: {
            personId: person.id,
            userId: ross.id,
          },
        },
      });

      if (!existingCoSeller) {
        await prisma.person_co_sellers.create({
          data: {
            personId: person.id,
            userId: ross.id,
          },
        });
      }
    }
    console.log('✅ Ross added as co-seller for Dan\'s people.');

    // Add Dan as co-seller for Ross's people
    console.log('🤝 Adding Dan as co-seller for Ross\'s people...');
    for (const person of secondHalf) {
      // Check if Dan is already a co-seller to avoid duplicates
      const existingCoSeller = await prisma.person_co_sellers.findUnique({
        where: {
          personId_userId: {
            personId: person.id,
            userId: dan.id,
          },
        },
      });

      if (!existingCoSeller) {
        await prisma.person_co_sellers.create({
          data: {
            personId: person.id,
            userId: dan.id,
          },
        });
      }
    }
    console.log('✅ Dan added as co-seller for Ross\'s people.');

    // Verify results
    console.log('🔍 Verifying results...');
    const [danOwnedCount, rossOwnedCount, danCoSellerCount, rossCoSellerCount] = await Promise.all([
      prisma.people.count({ where: { ownerId: dan.id } }),
      prisma.people.count({ where: { ownerId: ross.id } }),
      prisma.person_co_sellers.count({ where: { userId: dan.id } }),
      prisma.person_co_sellers.count({ where: { userId: ross.id } })
    ]);

    console.log('📈 Final Results:');
    console.log(`   - People with Dan as owner: ${danOwnedCount}`);
    console.log(`   - People with Ross as owner: ${rossOwnedCount}`);
    console.log(`   - People with Dan as co-seller: ${danCoSellerCount}`);
    console.log(`   - People with Ross as co-seller: ${rossCoSellerCount}`);

    // Show sample results
    const samplePeople = await prisma.people.findMany({
      where: { ownerId: { not: null } },
      include: {
        owner: { select: { name: true } },
        coSellers: { include: { user: { select: { name: true } } } }
      },
      take: 5
    });

    console.log('📋 Sample Results:');
    samplePeople.forEach((person, index) => {
      const coSellersNames = person.coSellers.map(cs => cs.user.name).join(', ');
      console.log(`${index + 1}. ${person.fullName} (${person.email || 'no email'})`);
      console.log(`   Owner: ${person.owner?.name || 'None'}`);
      console.log(`   Co-sellers: ${coSellersNames || 'None'}`);
    });

    console.log('🎉 Balanced owner assignment completed successfully!');
  } catch (error) {
    console.error('❌ Error during balanced owner assignment:', error);
  } finally {
    await prisma.$disconnect();
  }
}

assignOwnersBalanced();
