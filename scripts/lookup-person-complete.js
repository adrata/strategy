const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const PERSON_ID = '01K5D6AHYJC6FQWDG0R0QRYA0Z';

async function lookupPersonComplete() {
  try {
    await prisma.$connect();
    console.log('🔍 COMPLETE PERSON DATA LOOKUP');
    console.log('==============================');
    console.log(`Person ID: ${PERSON_ID}`);
    console.log('');

    // Get the person record with all related data
    const person = await prisma.people.findUnique({
      where: { id: PERSON_ID },
      include: {
        company: true,
        buyerGroups: true,
        actions: true
      }
    });

    if (!person) {
      console.log('❌ Person not found with ID:', PERSON_ID);
      return;
    }

    console.log('✅ PERSON FOUND:');
    console.log('================');
    console.log(`Name: ${person.fullName}`);
    console.log(`First Name: ${person.firstName || 'N/A'}`);
    console.log(`Last Name: ${person.lastName || 'N/A'}`);
    console.log(`Email: ${person.email || 'N/A'}`);
    console.log(`Phone: ${person.phone || 'N/A'}`);
    console.log(`Job Title: ${person.jobTitle || 'N/A'}`);
    console.log(`Title: ${person.title || 'N/A'}`);
    console.log(`Department: ${person.department || 'N/A'}`);
    console.log(`Status: ${person.status || 'N/A'}`);
    console.log(`Priority: ${person.priority || 'N/A'}`);
    console.log(`Source: ${person.source || 'N/A'}`);
    console.log(`Workspace ID: ${person.workspaceId}`);
    console.log(`Assigned User ID: ${person.assignedUserId || 'N/A'}`);
    console.log(`Created: ${person.createdAt}`);
    console.log(`Updated: ${person.updatedAt}`);
    console.log(`Last Contact Date: ${person.lastContactDate || 'N/A'}`);
    console.log(`Last Action Date: ${person.lastActionDate || 'N/A'}`);
    console.log(`Next Action: ${person.nextAction || 'N/A'}`);
    console.log(`Next Action Date: ${person.nextActionDate || 'N/A'}`);
    console.log('');

    // Company Information
    if (person.company) {
      console.log('🏢 COMPANY INFORMATION:');
      console.log('===============================');
      console.log(`Company ID: ${person.company.id}`);
      console.log(`Company Name: ${person.company.name}`);
      console.log(`Industry: ${person.company.industry || 'N/A'}`);
      console.log(`Vertical: ${person.company.vertical || 'N/A'}`);
      console.log(`Website: ${person.company.website || 'N/A'}`);
      console.log(`Description: ${person.company.description || 'N/A'}`);
      console.log(`Size: ${person.company.size || 'N/A'}`);
      console.log(`Revenue: ${person.company.revenue || 'N/A'}`);
      console.log(`Founded: ${person.company.founded || 'N/A'}`);
      console.log(`Headquarters: ${person.company.headquarters || 'N/A'}`);
      console.log(`LinkedIn: ${person.company.linkedinUrl || 'N/A'}`);
      console.log(`Twitter: ${person.company.twitterUrl || 'N/A'}`);
      console.log(`Facebook: ${person.company.facebookUrl || 'N/A'}`);
      console.log(`Instagram: ${person.company.instagramUrl || 'N/A'}`);
      console.log(`YouTube: ${person.company.youtubeUrl || 'N/A'}`);
      console.log(`TikTok: ${person.company.tiktokUrl || 'N/A'}`);
      console.log(`Status: ${person.company.status || 'N/A'}`);
      console.log(`Priority: ${person.company.priority || 'N/A'}`);
      console.log(`Source: ${person.company.source || 'N/A'}`);
      console.log(`Created: ${person.company.createdAt}`);
      console.log(`Updated: ${person.company.updatedAt}`);
      console.log('');
    }

    // Social Media & Contact Information
    console.log('📱 SOCIAL MEDIA & CONTACT:');
    console.log('==========================');
    console.log(`LinkedIn: ${person.linkedinUrl || 'N/A'}`);
    console.log(`Twitter: ${person.twitterUrl || 'N/A'}`);
    console.log(`Facebook: ${person.facebookUrl || 'N/A'}`);
    console.log(`Instagram: ${person.instagramUrl || 'N/A'}`);
    console.log(`YouTube: ${person.youtubeUrl || 'N/A'}`);
    console.log(`TikTok: ${person.tiktokUrl || 'N/A'}`);
    console.log(`Personal Website: ${person.personalWebsite || 'N/A'}`);
    console.log(`Bio: ${person.bio || 'N/A'}`);
    console.log('');

    // Professional Information
    console.log('💼 PROFESSIONAL INFORMATION:');
    console.log('=============================');
    console.log(`Skills: ${person.skills || 'N/A'}`);
    console.log(`Experience: ${person.experience || 'N/A'}`);
    console.log(`Education: ${person.education || 'N/A'}`);
    console.log(`Certifications: ${person.certifications || 'N/A'}`);
    console.log(`Languages: ${person.languages || 'N/A'}`);
    console.log(`Interests: ${person.interests || 'N/A'}`);
    console.log('');

    // Engagement & Activity Data
    console.log('📊 ENGAGEMENT & ACTIVITY:');
    console.log('==========================');
    console.log(`Engagement Score: ${person.engagementScore || 'N/A'}`);
    console.log(`Last Activity: ${person.lastActivity || 'N/A'}`);
    console.log(`Activity Count: ${person.activityCount || 'N/A'}`);
    console.log(`Interaction History: ${person.interactionHistory || 'N/A'}`);
    console.log(`Communication Preferences: ${person.communicationPreferences || 'N/A'}`);
    console.log('');

    // LinkedIn & Social Data
    console.log('🔗 LINKEDIN & SOCIAL DATA:');
    console.log('==========================');
    console.log(`LinkedIn Connections: ${person.linkedinConnections || 'N/A'}`);
    console.log(`LinkedIn Followers: ${person.linkedinFollowers || 'N/A'}`);
    console.log(`Twitter Followers: ${person.twitterFollowers || 'N/A'}`);
    console.log(`Owler Followers: ${person.owlerFollowers || 'N/A'}`);
    console.log('');

    // Enrichment Data
    console.log('🔍 ENRICHMENT DATA:');
    console.log('===================');
    console.log(`Company Updates: ${person.companyUpdates || 'N/A'}`);
    console.log(`Technologies Used: ${person.numTechnologiesUsed || 'N/A'}`);
    console.log(`Description Enriched: ${person.descriptionEnriched || 'N/A'}`);
    console.log(`Description Metadata: ${person.descriptionMetadataRaw || 'N/A'}`);
    console.log(`HQ Region: ${person.hqRegion || 'N/A'}`);
    console.log(`HQ Country ISO2: ${person.hqCountryIso2 || 'N/A'}`);
    console.log(`HQ Country ISO3: ${person.hqCountryIso3 || 'N/A'}`);
    console.log('');

    // Custom Fields Analysis
    if (person.customFields) {
      console.log('📋 CUSTOM FIELDS:');
      console.log('=================');
      try {
        const customFields = typeof person.customFields === 'string' 
          ? JSON.parse(person.customFields) 
          : person.customFields;
        
        Object.entries(customFields).forEach(([key, value]) => {
          console.log(`${key}: ${value}`);
        });
      } catch (error) {
        console.log('Custom Fields (raw):', person.customFields);
      }
      console.log('');
    }

    // Data Sources Analysis
    console.log('📊 DATA SOURCES ANALYSIS:');
    console.log('=========================');
    
    if (person.dataSources) {
      try {
        const dataSources = typeof person.dataSources === 'string' 
          ? JSON.parse(person.dataSources) 
          : person.dataSources;
        
        Object.entries(dataSources).forEach(([source, data]) => {
          console.log(`${source}:`, data);
        });
      } catch (error) {
        console.log('Data Sources (raw):', person.dataSources);
      }
    } else {
      console.log('No data sources information available');
    }
    console.log('');

    // Related Records
    console.log('🔗 RELATED RECORDS:');
    console.log('===================');
    
    // Buyer Groups
    if (person.buyerGroups && person.buyerGroups.length > 0) {
      console.log(`Buyer Groups (${person.buyerGroups.length}):`);
      person.buyerGroups.forEach((group, index) => {
        console.log(`  ${index + 1}. ${group.buyerGroup?.name || 'Unknown'} (ID: ${group.buyerGroupId})`);
        console.log(`     Role: ${group.role || 'N/A'}`);
        console.log(`     Influence: ${group.influence || 'N/A'}`);
        console.log(`     Is Primary: ${group.isPrimary ? 'Yes' : 'No'}`);
        console.log(`     Notes: ${group.notes || 'N/A'}`);
      });
    } else {
      console.log('Buyer Groups: None');
    }

    // Actions
    if (person.actions && person.actions.length > 0) {
      console.log(`Actions (${person.actions.length}):`);
      person.actions.forEach((action, index) => {
        console.log(`  ${index + 1}. ${action.type || 'Unknown'} - ${action.description || 'No description'} (${action.createdAt})`);
        console.log(`     Status: ${action.status || 'N/A'}`);
        console.log(`     Priority: ${action.priority || 'N/A'}`);
        console.log(`     Due Date: ${action.dueDate || 'N/A'}`);
      });
    } else {
      console.log('Actions: None');
    }

    console.log('');
    console.log('✅ COMPLETE DATA LOOKUP FINISHED');

  } catch (error) {
    console.error('❌ Error during lookup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

lookupPersonComplete();
