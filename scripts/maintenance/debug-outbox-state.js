#!/usr/bin/env node

/**
 * 🔍 OUTBOX STATE DEBUGGING SCRIPT
 *
 * This script helps debug the current state of the outbox system
 * to understand the numbering and state management issues.
 */

const { PrismaClient } = require("@prisma/client");

// Production configuration
const PRODUCTION_CONFIG = {
  databaseUrl:
    "postgresql://neondb_owner:npg_DtnFYHvWj6m8@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require",
  workspaceId: "adrata",
  userId: "dan",
};

class OutboxStateDebugger {
  constructor() {
    this.prisma = new PrismaClient({
      datasources: {
        db: { url: PRODUCTION_CONFIG.databaseUrl },
      },
    });
  }

  async debugCurrentState() {
    console.log("🔍 OUTBOX STATE DEBUGGING");
    console.log("=".repeat(50));

    try {
      // Get current leads from database
      const allLeads = await this.prisma.lead.findMany({
        where: {
          workspaceId: PRODUCTION_CONFIG.workspaceId,
          assignedUserId: PRODUCTION_CONFIG.userId,
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          fullName: true,
          company: true,
          email: true,
          phone: true,
          status: true,
          customFields: true,
          createdAt: true,
        },
      });

      console.log(`\n📊 Database State:`);
      console.log(`- Total leads: ${allLeads.length}`);

      // Simulate outbox people array (first 10 leads)
      const outboxPeople = allLeads.slice(0, 10).map((lead, index) => ({
        id: lead.id,
        name: lead.fullName || `${lead.firstName} ${lead.lastName}`,
        company: lead.company,
        email: lead.email,
        phone: lead.phone,
        originalIndex: index,
        databaseIndex: allLeads.findIndex((l) => l.id === lead.id),
      }));

      console.log(`\n📋 Outbox People (First 10):`);
      outboxPeople.forEach((person, index) => {
        console.log(
          `  ${index + 1}. ${person.name} (ID: ${person.id}) - DB Index: ${person.databaseIndex}`,
        );
      });

      // Simulate selecting a person (let's say the 3rd person)
      const selectedPerson = outboxPeople[2]; // Index 2 = 3rd person
      if (selectedPerson) {
        console.log(`\n🎯 Selected Person: ${selectedPerson.name}`);

        // Calculate current index the way the code does it
        const currentIndex = outboxPeople.findIndex(
          (p) => p.id === selectedPerson.id,
        );
        const displayIndex = currentIndex + 1;

        console.log(`- Current Index in outboxPeople: ${currentIndex}`);
        console.log(`- Display Index (currentIndex + 1): ${displayIndex}`);
        console.log(`- Should show in left panel: ${displayIndex}`);
        console.log(`- Should show in center panel: ${displayIndex}`);
      }

      // Simulate completion of first person
      console.log(`\n🔄 Simulating completion of first person...`);
      const completedPerson = outboxPeople[0];
      const remainingPeople = outboxPeople.slice(1); // Remove first person

      console.log(`Completed: ${completedPerson.name}`);
      console.log(`Remaining people:`);
      remainingPeople.forEach((person, index) => {
        const currentIndex = remainingPeople.findIndex(
          (p) => p.id === person.id,
        );
        const displayIndex = currentIndex + 1;
        console.log(`  ${displayIndex}. ${person.name} (ID: ${person.id})`);
      });

      // Now check what happens with the selected person
      if (
        selectedPerson &&
        remainingPeople.find((p) => p.id === selectedPerson.id)
      ) {
        const newCurrentIndex = remainingPeople.findIndex(
          (p) => p.id === selectedPerson.id,
        );
        const newDisplayIndex = newCurrentIndex + 1;
        console.log(`\n🎯 Selected person after completion:`);
        console.log(`- ${selectedPerson.name} new index: ${newCurrentIndex}`);
        console.log(
          `- ${selectedPerson.name} new display index: ${newDisplayIndex}`,
        );
        console.log(`- This person was #3, now shows as #${newDisplayIndex}`);
      }

      console.log(`\n💡 Issue Identified:`);
      console.log(
        `- When people are completed and removed from outboxPeople array`,
      );
      console.log(`- The indices of remaining people shift down`);
      console.log(
        `- A person who was #3 becomes #2 after the first person is completed`,
      );
      console.log(
        `- This causes the numbering mismatch between left and center panels`,
      );

      console.log(`\n🔧 Solution Needed:`);
      console.log(
        `- Use stable numbering that doesn't change when people are completed`,
      );
      console.log(
        `- Either use original indices or implement a different numbering system`,
      );
      console.log(`- Ensure both panels use the exact same calculation`);
    } catch (error) {
      console.error("❌ Debug failed:", error.message);
    } finally {
      await this.prisma.$disconnect();
    }
  }
}

// Run the debugger
async function main() {
  const stateDebugger = new OutboxStateDebugger();
  await stateDebugger.debugCurrentState();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { OutboxStateDebugger };
