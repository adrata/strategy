#!/usr/bin/env node

/**
 * Update Demo Workspace Timezone Script
 * Updates the demo workspace timezone to Arizona
 */

const { PrismaClient } = require('@prisma/client');

class DemoWorkspaceUpdater {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async updateDemoTimezone() {
    try {
      console.log('🕐 Updating demo workspace timezone to Arizona...');

      // Find the demo workspace
      const demoWorkspace = await this.prisma.workspaces.findFirst({
        where: {
          OR: [
            { slug: 'demo' },
            { name: { contains: 'demo', mode: 'insensitive' } }
          ]
        }
      });

      if (!demoWorkspace) {
        throw new Error('Demo workspace not found');
      }

      console.log(`✅ Found demo workspace: ${demoWorkspace.name} (${demoWorkspace.slug})`);
      console.log(`   Current timezone: ${demoWorkspace.timezone}`);

      // Update timezone to Arizona (America/Phoenix)
      const updatedWorkspace = await this.prisma.workspaces.update({
        where: { id: demoWorkspace.id },
        data: {
          timezone: 'America/Phoenix',
          updatedAt: new Date()
        }
      });

      console.log(`✅ Updated demo workspace timezone to: ${updatedWorkspace.timezone}`);

      return updatedWorkspace;

    } catch (error) {
      console.error('❌ Error updating demo workspace timezone:', error);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }
}

// Main execution
async function main() {
  const updater = new DemoWorkspaceUpdater();
  
  try {
    await updater.updateDemoTimezone();
    console.log('\n🎉 Demo workspace timezone updated successfully!');
  } catch (error) {
    console.error('❌ Demo workspace timezone update failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { DemoWorkspaceUpdater };
