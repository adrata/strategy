#!/usr/bin/env node

/**
 * 🎭 SETUP DANO'S AI PERSONALITY - TOUGH LOVE MODE
 * 
 * Sets Dano's AI personality to "Tough Love" (the "yell at me" mode)
 * while maintaining strong Adrata brand standards
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_DtnFYHvWj6m8@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require",
    },
  },
});

// Dano's specific configuration
const DANO_CONFIG = {
  userId: '01K1VBYYV7TRPY04NW4TW4XWRB', // Dano's actual user ID
  workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72', // Retail Product Solutions workspace
  email: 'dano@retail-products.com'
};

// Tough Love personality configuration
const TOUGH_LOVE_PERSONALITY = {
  personalityId: 'harsh',
  personalityName: 'Tough Love',
  tone: 'firm and demanding with Adrata excellence standards',
  style: 'challenging but professional',
  customPrompt: `You are Adrata's demanding AI sales manager who pushes for excellence while maintaining our world-class brand standards. 

BRAND REQUIREMENTS (NON-NEGOTIABLE):
- Always represent Adrata as a premium, professional sales intelligence platform
- Maintain Adrata's reputation for cutting-edge technology and results
- Be firm but never unprofessional or inappropriate
- Focus on driving results and performance improvements

TOUGH LOVE APPROACH:
- Be direct about missed opportunities and weak performance
- Challenge complacency and push for higher standards
- Demand better results and follow-through
- Use firm language but stay solution-focused
- Point out inefficiencies and wasted potential
- Set high expectations and hold accountable

EXAMPLE RESPONSES:
"Your conversion rate is unacceptable. Adrata's intelligence shows you have high-value prospects you're not pursuing. Step it up."
"You missed three follow-ups this week. With Adrata's data at your fingertips, there's no excuse for this level of performance."
"Stop making excuses. Adrata has identified your top opportunities - execute on them or explain why you're not hitting targets."

Balance firm coaching with Adrata's professional excellence. Push for results while showcasing our platform's capabilities.`
};

async function setupDanoPersonality() {
  console.log('🎭 SETTING UP DANO\'S TOUGH LOVE AI PERSONALITY\n');
  
  try {
    await prisma.$connect();
    
    // Verify Dano exists
    const dano = await prisma.user.findUnique({
      where: { id: DANO_CONFIG.userId },
      select: { 
        id: true, 
        email: true, 
        name: true 
      }
    });
    
    if (!dano) {
      console.error('❌ Dano not found with ID:', DANO_CONFIG.userId);
      return;
    }
    
    console.log('✅ Found Dano:', dano.email, `(${dano.name})`);
    
    // Verify workspace exists
    const workspace = await prisma.workspace.findUnique({
      where: { id: DANO_CONFIG.workspaceId },
      select: { 
        id: true, 
        name: true 
      }
    });
    
    if (!workspace) {
      console.error('❌ Workspace not found with ID:', DANO_CONFIG.workspaceId);
      return;
    }
    
    console.log('✅ Found workspace:', workspace.name);
    
    // Check if Dano's AI preferences already exist
    const existingPreferences = await prisma.user_ai_preferences.findFirst({
      where: {
        userId: DANO_CONFIG.userId,
        workspaceId: DANO_CONFIG.workspaceId
      }
    });

    let aiPreferences;
    if (existingPreferences) {
      // Update existing preferences
      aiPreferences = await prisma.user_ai_preferences.update({
        where: {
          id: existingPreferences.id
        },
        data: {
          ...TOUGH_LOVE_PERSONALITY,
          isActive: true,
          updatedAt: new Date()
        }
      });
    } else {
      // Create new preferences
      aiPreferences = await prisma.user_ai_preferences.create({
        data: {
          userId: DANO_CONFIG.userId,
          workspaceId: DANO_CONFIG.workspaceId,
          ...TOUGH_LOVE_PERSONALITY,
          isActive: true,
          updatedAt: new Date()
        }
      });
    }
    
    console.log('\n🎯 AI Personality Setup Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`👤 User: ${dano.name} (${dano.email})`);
    console.log(`🏢 Workspace: ${workspace.name}`);
    console.log(`🎭 Personality: ${aiPreferences.personalityName}`);
    console.log(`🎨 Tone: ${aiPreferences.tone}`);
    console.log(`📝 Style: ${aiPreferences.style}`);
    console.log(`✅ Active: ${aiPreferences.isActive}`);
    console.log(`🕐 Updated: ${aiPreferences.updatedAt.toISOString()}`);
    
    console.log('\n💡 What this means:');
    console.log('• Dano will now receive firm, demanding responses from the AI');
    console.log('• AI will challenge weak performance and missed opportunities');
    console.log('• Responses will be direct and accountability-focused');
    console.log('• Adrata brand standards remain high and professional');
    console.log('• Perfect for users who want tough love coaching style');
    
    console.log('\n🧪 Test it out:');
    console.log('Ask the AI: "I missed my sales targets this month"');
    console.log('Expected response: Firm but constructive coaching');
    
  } catch (error) {
    console.error('❌ Error setting up Dano\'s personality:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Export for testing
module.exports = {
  setupDanoPersonality,
  DANO_CONFIG,
  TOUGH_LOVE_PERSONALITY
};

// Run if called directly
if (require.main === module) {
  setupDanoPersonality().catch(console.error);
}
