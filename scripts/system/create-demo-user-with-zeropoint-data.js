#!/usr/bin/env node

/**
 * 🎭 CREATE DEMO USER WITH ZEROPOINT DATA
 * Creates demo/demopass user with complete ZeroPoint cybersecurity demo scenario
 * Preserves Dan's production data while providing rich demo experience
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_DtnFYHvWj6m8@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require"
    }
  }
});

// Demo user configuration
const DEMO_USER_CONFIG = {
  id: "demo-user-2025",
  email: "demo@adrata.com", 
  password: "demopass",
  name: "James Gold",
  firstName: "James",
  lastName: "Gold",
  displayName: "James Gold"
};

// Demo workspace configuration  
const DEMO_WORKSPACE_CONFIG = {
  id: "demo-workspace",
  name: "ZeroPoint", 
  slug: "demo"
};

// ZeroPoint company configuration (Dan's template demo company)
const ZEROPOINT_COMPANY = {
  name: "ZeroPoint",
  industry: "Cybersecurity", 
  description: "Advanced cybersecurity company that protects against future quantum computer hacks",
  domain: "zeropoint.com",
  employeeCount: 500,
  revenue: "$50M+",
  location: "Austin, TX",
  foundedYear: 2018,
  techStack: ["Quantum Cryptography", "AI Security", "Blockchain", "Python", "React"],
  painPoints: ["Quantum-resistant security", "Scaling detection algorithms", "Enterprise integration"],
  businessPriorities: ["Product innovation", "Market expansion", "Talent acquisition"],
  icpScore: 95
};

// ZeroPoint demo leads (buyer group intelligence)
const ZEROPOINT_LEADS = [
  {
    firstName: "Sarah",
    lastName: "Mitchell", 
    fullName: "Sarah Mitchell",
    email: "sarah.mitchell@zeropoint.com",
    phone: "+1 (512) 555-0123",
    jobTitle: "Chief Technology Officer",
    company: "ZeroPoint",
    department: "Technology",
    buyerGroupRole: "Decision Maker",
    status: "qualified",
    priority: "high",
    source: "monaco",
    notes: "Primary technical decision maker for enterprise security solutions. Quantum cryptography expert.",
    currentStage: "discovery",
    linkedinUrl: "https://linkedin.com/in/sarah-mitchell-cto"
  },
  {
    firstName: "Marcus",
    lastName: "Rodriguez",
    fullName: "Marcus Rodriguez", 
    email: "marcus.rodriguez@zeropoint.com",
    phone: "+1 (512) 555-0124",
    jobTitle: "VP of Engineering",
    company: "ZeroPoint",
    department: "Engineering",
    buyerGroupRole: "Champion",
    status: "engaged",
    priority: "high", 
    source: "monaco",
    notes: "Engineering leader focused on quantum-resistant algorithms. Strong technical champion.",
    currentStage: "discovery",
    linkedinUrl: "https://linkedin.com/in/marcus-rodriguez-vp-eng"
  },
  {
    firstName: "Jessica",
    lastName: "Chen",
    fullName: "Jessica Chen",
    email: "jessica.chen@zeropoint.com", 
    phone: "+1 (512) 555-0125",
    jobTitle: "Chief Security Officer",
    company: "ZeroPoint",
    department: "Security",
    buyerGroupRole: "Decision Maker",
    status: "new",
    priority: "high",
    source: "monaco",
    notes: "Security executive driving quantum threat protection strategy. Budget authority.",
    currentStage: "initiate",
    linkedinUrl: "https://linkedin.com/in/jessica-chen-cso"
  },
  {
    firstName: "David",
    lastName: "Park",
    fullName: "David Park",
    email: "david.park@zeropoint.com",
    phone: "+1 (512) 555-0126", 
    jobTitle: "Director of Product Security",
    company: "ZeroPoint",
    department: "Product",
    buyerGroupRole: "Influencer", 
    status: "new",
    priority: "medium",
    source: "monaco",
    notes: "Product security lead working on quantum-safe implementations. Technical evaluator.",
    currentStage: "initiate",
    linkedinUrl: "https://linkedin.com/in/david-park-product-security"
  },
  {
    firstName: "Amanda",
    lastName: "Thompson",
    fullName: "Amanda Thompson",
    email: "amanda.thompson@zeropoint.com",
    phone: "+1 (512) 555-0127",
    jobTitle: "Head of Procurement",
    company: "ZeroPoint", 
    department: "Operations",
    buyerGroupRole: "Gatekeeper",
    status: "new",
    priority: "medium",
    source: "monaco", 
    notes: "Procurement leader managing vendor evaluations. Contracts and compliance focus.",
    currentStage: "initiate",
    linkedinUrl: "https://linkedin.com/in/amanda-thompson-procurement"
  }
];

// ZeroPoint demo opportunities
const ZEROPOINT_OPPORTUNITIES = [
  {
    name: "ZeroPoint Quantum Security Platform",
    description: "Enterprise-grade quantum-resistant security platform implementation",
    amount: 750000,
    stage: "discovery",
    probability: 65,
    expectedCloseDate: new Date('2025-04-15'),
    source: "Enterprise Sales",
    priority: "high",
    notes: "Strategic initiative to implement quantum-safe security across all products. High-value opportunity with strong technical buy-in. Primary contact: Sarah Mitchell"
  }
];

async function createDemoUserWithZeroPointData() {
  console.log("🎭 CREATING DEMO USER WITH ZEROPOINT DATA");
  console.log("==========================================");
  console.log("");

  try {
    await prisma.$connect();

    // Step 1: Create/update demo workspace
    console.log("🏢 Step 1: Creating/updating demo workspace...");
    const demoWorkspace = await prisma.workspace.upsert({
      where: { id: DEMO_WORKSPACE_CONFIG.id },
      update: {
        name: DEMO_WORKSPACE_CONFIG.name,
        slug: DEMO_WORKSPACE_CONFIG.slug,
        description: "Demo workspace for ZeroPoint cybersecurity scenarios"
      },
      create: {
        id: DEMO_WORKSPACE_CONFIG.id,
        name: DEMO_WORKSPACE_CONFIG.name,
        slug: DEMO_WORKSPACE_CONFIG.slug,
        description: "Demo workspace for ZeroPoint cybersecurity scenarios"
      }
    });
    console.log(`✅ Demo workspace: ${demoWorkspace.name}`);

    // Step 2: Create/update demo user
    console.log("\n👤 Step 2: Creating/updating demo user...");
    const hashedPassword = await bcrypt.hash(DEMO_USER_CONFIG.password, 10);
    
    const demoUser = await prisma.user.upsert({
      where: { email: DEMO_USER_CONFIG.email },
      update: {
        name: DEMO_USER_CONFIG.name,
        firstName: DEMO_USER_CONFIG.firstName,
        lastName: DEMO_USER_CONFIG.lastName,
        displayName: DEMO_USER_CONFIG.displayName,
        password: hashedPassword,
        isActive: true
      },
      create: {
        id: DEMO_USER_CONFIG.id,
        email: DEMO_USER_CONFIG.email,
        password: hashedPassword,
        name: DEMO_USER_CONFIG.name,
        firstName: DEMO_USER_CONFIG.firstName,
        lastName: DEMO_USER_CONFIG.lastName,
        displayName: DEMO_USER_CONFIG.displayName,
        isActive: true
      }
    });
    console.log(`✅ Demo user: ${demoUser.name} (${demoUser.email})`);

    // Step 3: Create workspace membership
    console.log("\n🔗 Step 3: Creating workspace membership...");
    let membership = await prisma.workspaceMembership.findFirst({
      where: {
        userId: demoUser.id,
        workspaceId: demoWorkspace.id
      }
    });

    if (!membership) {
      membership = await prisma.workspaceMembership.create({
        data: {
          userId: demoUser.id,
          workspaceId: demoWorkspace.id,
          role: "admin",
          isActive: true
        }
      });
      console.log(`✅ Created workspace membership for demo user`);
    } else {
      console.log(`✅ Workspace membership already exists`);
    }

    // Step 4: Create demo leads
    console.log("\n📋 Step 4: Creating ZeroPoint demo leads...");
    let createdLeads = 0;
    
    for (const leadData of ZEROPOINT_LEADS) {
      const existingLead = await prisma.lead.findFirst({
        where: {
          email: leadData.email,
          workspaceId: demoWorkspace.id
        }
      });

      if (!existingLead) {
        await prisma.lead.create({
          data: {
            ...leadData,
            workspaceId: demoWorkspace.id,
            assignedUserId: demoUser.id,
            tags: ["demo", "zeropoint", "cybersecurity"],
            customFields: {
              demoScenario: "quantum-cybersecurity",
              companyProfile: "zeropoint",
              industry: "cybersecurity"
            },
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        createdLeads++;
      }
    }
    console.log(`✅ Created ${createdLeads} demo leads`);

    // Step 5: Create demo opportunities
    console.log("\n💰 Step 5: Creating demo opportunities...");
    let createdOpportunities = 0;

    for (const oppData of ZEROPOINT_OPPORTUNITIES) {
      const existingOpp = await prisma.opportunity.findFirst({
        where: {
          name: oppData.name,
          workspaceId: demoWorkspace.id  
        }
      });

      if (!existingOpp) {
        await prisma.opportunity.create({
          data: {
            ...oppData,
            workspaceId: demoWorkspace.id,
            assignedUserId: demoUser.id,
            tags: ["demo", "zeropoint"],
            customFields: {
              demoScenario: "quantum-cybersecurity",
              dealType: "platform-implementation"
            },
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        createdOpportunities++;
      }
    }
    console.log(`✅ Created ${createdOpportunities} demo opportunities`);

    // Step 6: Create demo contacts (simplified - contacts created from leads automatically)
    console.log("\n👥 Step 6: Demo contacts (auto-generated from leads)...");
    console.log(`✅ ZeroPoint contacts are available through lead data`);

    // Step 7: Summary
    console.log("\n📊 Step 7: Demo Setup Summary");
    console.log("=============================");
    console.log(`Demo User: ${demoUser.email} (Password: ${DEMO_USER_CONFIG.password})`);
    console.log(`Demo Workspace: ${demoWorkspace.name} (${demoWorkspace.id})`);
    console.log(`Demo Company: ${ZEROPOINT_COMPANY.name} - ${ZEROPOINT_COMPANY.description}`);
    console.log(`Demo Leads: ${ZEROPOINT_LEADS.length} ZeroPoint stakeholders`);
    console.log(`Demo Opportunities: ${ZEROPOINT_OPPORTUNITIES.length} enterprise deals`);
    console.log("");
    console.log("🎯 LOGIN CREDENTIALS:");
    console.log("Demo User: demo / demopass (sees ZeroPoint data)");
    console.log("Production User: dan / danpass (sees production data)");
    console.log("");
    console.log("✅ Demo user setup complete! ZeroPoint cybersecurity scenario ready.");

  } catch (error) {
    console.error("❌ Error creating demo user:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  createDemoUserWithZeroPointData()
    .then(() => {
      console.log("🎉 Demo user creation completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Demo user creation failed:", error);
      process.exit(1);
    });
}

module.exports = { createDemoUserWithZeroPointData }; 