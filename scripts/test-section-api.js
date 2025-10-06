const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSectionAPI() {
  try {
    console.log('🧪 Testing section API logic directly...');
    
    const DEMO_WORKSPACE_ID = '01K1VBYX2YERMXBFJ60RC6J194';
    const DEMO_USER_ID = 'demo-user-2025';
    
    // Test the exact same query that the section API uses
    const speedrunLeads = await prisma.leads.findMany({
      where: {
        workspaceId: DEMO_WORKSPACE_ID,
        deletedAt: null,
        tags: { has: 'speedrun' },
        OR: [
          { assignedUserId: DEMO_USER_ID },
          { assignedUserId: null }
        ]
      },
      orderBy: [
        { updatedAt: 'desc' }
      ],
      take: 200
    });
    
    console.log('📊 Speedrun leads found:', speedrunLeads.length);
    
    if (speedrunLeads.length > 0) {
      console.log('📊 First speedrun lead:', {
        id: speedrunLeads[0].id,
        fullName: speedrunLeads[0].fullName,
        company: speedrunLeads[0].company,
        tags: speedrunLeads[0].tags
      });
      
      // Transform like the API does
      const transformedData = speedrunLeads.slice(0, 10).map((lead, index) => {
        const safeString = (str, maxLength = 1000) => {
          if (!str || typeof str !== 'string') return '';
          if (str.length <= maxLength) return str;
          return str.substring(0, maxLength) + '...';
        };

        return {
          id: lead.id,
          rank: index + 1,
          name: safeString(lead.fullName || `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Unknown', 200),
          company: safeString(lead.company || 'Unknown Company', 200),
          title: safeString(lead.jobTitle || 'Unknown Title', 300),
          stage: lead.status || 'Prospect',
          email: safeString(lead.email || 'Unknown Email', 300),
          phone: safeString(lead.phone || 'Unknown Phone', 50)
        };
      });
      
      console.log('📊 Transformed data (first 3):', transformedData.slice(0, 3));
      
      const expectedResponse = {
        success: true,
        data: {
          data: transformedData,
          count: transformedData.length,
          totalCount: speedrunLeads.length
        }
      };
      
      console.log('📊 Expected API response structure:');
      console.log(JSON.stringify(expectedResponse, null, 2));
      
    } else {
      console.log('❌ No speedrun leads found - this explains why middle panel is empty');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  testSectionAPI();
}
