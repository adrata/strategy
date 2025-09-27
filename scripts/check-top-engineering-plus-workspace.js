#!/usr/bin/env node

/**
 * 🔍 CHECK TOP ENGINEERING PLUS WORKSPACE
 * 
 * Find who is connected to the TOP Engineering Plus workspace
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

class CheckTopEngineeringPlusWorkspace {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async checkWorkspace() {
    console.log('🔍 CHECKING TOP ENGINEERING PLUS WORKSPACE');
    console.log('==========================================');
    console.log('Finding who is connected to the TOP Engineering Plus workspace');
    console.log('');
    
    try {
      // Test database connection first
      await this.prisma.$connect();
      console.log('✅ Database connected successfully');
      console.log('');
      // First, let's find the TOP Engineering Plus workspace
      const workspace = await this.prisma.workspaces.findFirst({
        where: {
          name: {
            contains: 'TOP',
            mode: 'insensitive'
          }
        },
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true
        }
      });
      
      if (workspace) {
        console.log('📊 WORKSPACE FOUND:');
        console.log('==================');
        console.log(`   ID: ${workspace.id}`);
        console.log(`   Name: ${workspace.name}`);
        console.log(`   Created: ${workspace.createdAt}`);
        console.log(`   Updated: ${workspace.updatedAt}`);
        console.log('');
        
        // Get all people in this workspace
        const people = await this.prisma.people.findMany({
          where: {
            workspaceId: workspace.id
          },
          select: {
            id: true,
            fullName: true,
            workEmail: true,
            jobTitle: true,
            linkedinUrl: true,
            company: {
              select: {
                name: true
              }
            },
            createdAt: true,
            updatedAt: true
          },
          orderBy: {
            fullName: 'asc'
          }
        });
        
        console.log(`📋 PEOPLE IN WORKSPACE (${people.length} total):`);
        console.log('===============================================');
        
        if (people.length > 0) {
          people.forEach((person, index) => {
            console.log(`${index + 1}. ${person.fullName}`);
            console.log(`   Company: ${person.company?.name || 'Unknown'}`);
            console.log(`   Email: ${person.workEmail || 'None'}`);
            console.log(`   Title: ${person.jobTitle || 'None'}`);
            console.log(`   LinkedIn: ${person.linkedinUrl || 'None'}`);
            console.log(`   Added: ${person.createdAt.toISOString().split('T')[0]}`);
            console.log('');
          });
          
          // Get summary statistics
          console.log('📊 WORKSPACE SUMMARY:');
          console.log('=====================');
          console.log(`   Total People: ${people.length}`);
          
          const withLinkedIn = people.filter(p => p.linkedinUrl).length;
          console.log(`   With LinkedIn: ${withLinkedIn} (${Math.round((withLinkedIn / people.length) * 100)}%)`);
          
          const withEmail = people.filter(p => p.workEmail).length;
          console.log(`   With Email: ${withEmail} (${Math.round((withEmail / people.length) * 100)}%)`);
          
          const withTitle = people.filter(p => p.jobTitle).length;
          console.log(`   With Title: ${withTitle} (${Math.round((withTitle / people.length) * 100)}%)`);
          
          // Get unique companies
          const companies = [...new Set(people.map(p => p.company?.name).filter(Boolean))];
          console.log(`   Unique Companies: ${companies.length}`);
          console.log('');
          
          // Show top companies
          const companyCounts = {};
          people.forEach(p => {
            const companyName = p.company?.name || 'Unknown';
            companyCounts[companyName] = (companyCounts[companyName] || 0) + 1;
          });
          
          const topCompanies = Object.entries(companyCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
          
          console.log('🏢 TOP COMPANIES:');
          console.log('=================');
          topCompanies.forEach(([company, count], index) => {
            console.log(`${index + 1}. ${company}: ${count} people`);
          });
          
        } else {
          console.log('❌ No people found in this workspace');
        }
        
      } else {
        console.log('❌ TOP Engineering Plus workspace not found');
        
        // Let's see what workspaces exist
        const allWorkspaces = await this.prisma.workspaces.findMany({
          select: {
            id: true,
            name: true,
            createdAt: true
          },
          orderBy: {
            name: 'asc'
          }
        });
        
        console.log('');
        console.log('📋 ALL WORKSPACES:');
        console.log('==================');
        allWorkspaces.forEach((ws, index) => {
          console.log(`${index + 1}. ${ws.name} (ID: ${ws.id})`);
        });
      }
      
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
    }
    
    await this.prisma.$disconnect();
  }
}

// Run workspace check
async function main() {
  const checker = new CheckTopEngineeringPlusWorkspace();
  await checker.checkWorkspace();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = CheckTopEngineeringPlusWorkspace;
