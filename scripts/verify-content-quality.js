const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function verifyContentQuality() {
  try {
    console.log('🔍 Verifying content quality across all workspaces...');

    // Check Adrata workspace
    const adrataWorkspace = await prisma.workspaces.findFirst({
      where: { name: 'Adrata' }
    });

    if (adrataWorkspace) {
      console.log(`\n📊 Adrata Workspace Content Analysis:`);
      
      const adrataDocs = await prisma.workshopDocument.findMany({
        where: {
          workspaceId: adrataWorkspace.id,
          reportType: 'SALES_ENABLEMENT',
          deletedAt: null
        },
        select: {
          title: true,
          content: true,
          updatedAt: true
        }
      });

      let adrataPlaceholderCount = 0;
      let adrataComprehensiveCount = 0;

      adrataDocs.forEach(doc => {
        const contentStr = JSON.stringify(doc.content);
        const hasPlaceholder = contentStr.includes('placeholder') || contentStr.includes('Please add') || contentStr.includes('*This document is a placeholder');
        const isComprehensive = contentStr.length > 2000;
        
        if (hasPlaceholder) adrataPlaceholderCount++;
        if (isComprehensive) adrataComprehensiveCount++;
        
        console.log(`   - ${doc.title}: ${isComprehensive ? '✅' : '❌'} Comprehensive (${contentStr.length} chars) ${hasPlaceholder ? '⚠️ Has placeholders' : ''}`);
      });

      console.log(`   Summary: ${adrataComprehensiveCount}/${adrataDocs.length} comprehensive, ${adrataPlaceholderCount} with placeholders`);
    }

    // Check Notary Everyday workspace
    const notaryWorkspace = await prisma.workspaces.findFirst({
      where: { name: 'Notary Everyday' }
    });

    if (notaryWorkspace) {
      console.log(`\n📊 Notary Everyday Workspace Content Analysis:`);
      
      const notaryDocs = await prisma.workshopDocument.findMany({
        where: {
          workspaceId: notaryWorkspace.id,
          reportType: 'SALES_ENABLEMENT',
          deletedAt: null
        },
        select: {
          title: true,
          content: true,
          updatedAt: true
        }
      });

      let notaryPlaceholderCount = 0;
      let notaryComprehensiveCount = 0;

      notaryDocs.forEach(doc => {
        const contentStr = JSON.stringify(doc.content);
        const hasPlaceholder = contentStr.includes('placeholder') || contentStr.includes('Please add') || contentStr.includes('*This document is a placeholder');
        const isComprehensive = contentStr.length > 2000;
        
        if (hasPlaceholder) notaryPlaceholderCount++;
        if (isComprehensive) notaryComprehensiveCount++;
        
        console.log(`   - ${doc.title}: ${isComprehensive ? '✅' : '❌'} Comprehensive (${contentStr.length} chars) ${hasPlaceholder ? '⚠️ Has placeholders' : ''}`);
      });

      console.log(`   Summary: ${notaryComprehensiveCount}/${notaryDocs.length} comprehensive, ${notaryPlaceholderCount} with placeholders`);
    }

    // Overall summary
    console.log(`\n🎯 Overall Content Quality Summary:`);
    console.log(`   - Adrata: Focus on Buyer Group Intelligence, RevenueOS, Go To Buyer Platform`);
    console.log(`   - Notary Everyday: Focus on traditional notary service sales enablement`);
    console.log(`   - All documents should have comprehensive, real content`);

  } catch (error) {
    console.error('❌ Error verifying content quality:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyContentQuality();
