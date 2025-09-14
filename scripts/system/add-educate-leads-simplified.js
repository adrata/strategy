#!/usr/bin/env node

/**
 * 🎯 ADD EDUCATE LEADS FOR DAN - SIMPLIFIED VERSION
 * 
 * This script adds 51 specific leads to the "Educate" stage 
 * using simplified data that fits database constraints.
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Simplified leads data with shorter values
const EDUCATE_LEADS = [
  { name: "Matt Green", title: "CRO", company: "SalesAssembly", status: "Demo" },
  { name: "Danny Garcia", title: "VP Sales", company: "Saleo", status: "Pitched" },
  { name: "Seamus Ruiz", title: "MD", company: "Carabiner", status: "Demo" },
  { name: "Curtis Matznick", title: "VP Sales", company: "PredHealth", status: "Demo" },
  { name: "Emma Galler", title: "SVP Sales", company: "Intellistack", status: "Intro" },
  { name: "Kristin Bourgeois", title: "AE", company: "DocuSign", status: "Engaged" },
  { name: "Erik Mathew", title: "Dir Sales", company: "Enverus", status: "Engaged" },
  { name: "Ethan Schechter", title: "SVP Sales", company: "Qodo", status: "Intro" },
  { name: "David Voss", title: "Coach", company: "Lennox", status: "Pitched" },
  { name: "Beau Brooks", title: "VP Sales", company: "Rentvine", status: "Demoed" },
  { name: "Adam Kincaid", title: "Head Enable", company: "Payscale", status: "Demo" },
  { name: "Garner White", title: "Dir Sales", company: "Segment", status: "Pitched" },
  { name: "Cameron Cross", title: "VP Marketing", company: "Courtesy", status: "Pitched" },
  { name: "Brittany Craig", title: "AM", company: "Rippling", status: "Pitched" },
  { name: "Jarred Young", title: "VP Sales", company: "ChiroHD", status: "Demo" },
  { name: "Cole Rickels", title: "AE", company: "DocuSign", status: "Pitched" },
  { name: "Ally Sirois", title: "Sales", company: "Qodo", status: "Pitched" },
  { name: "Bill MacDonald", title: "AVP", company: "Splunk", status: "Pitched" },
  { name: "Mark Pickart", title: "Manager", company: "Zoom", status: "Engaged" },
  { name: "Taylor Jones", title: "CSM Manager", company: "DataDog", status: "Demoed" },
  { name: "Isis Benson", title: "SDR", company: "Greenhouse", status: "Pitched" },
  { name: "John Barbieri", title: "Dir Sales", company: "ChiliPiper", status: "Pitched" },
  { name: "Steven Birdsall", title: "CRO", company: "Alteryx", status: "Engaged" },
  { name: "Jake Bennett", title: "AM", company: "Mixpanel", status: "Engaged" },
  { name: "Erich Beer", title: "RevOps", company: "Talkdesk", status: "Engaged" },
  { name: "Geno Hammer", title: "AM", company: "ChiliPiper", status: "Engaged" },
  { name: "Jerry Kirby", title: "AE", company: "Twilio", status: "Pitched" },
  { name: "Mike Lynch", title: "Dir Sales", company: "LeadIQ", status: "Engaged" },
  { name: "Rick Juretic", title: "Sales", company: "Talkdesk", status: "Engaged" },
  { name: "Brian Muench", title: "AE", company: "ServiceTitan", status: "Engaged" },
  { name: "August Buettner", title: "AE", company: "HGInsights", status: "Engaged" },
  { name: "Michelle Hood", title: "Manager", company: "Smartsheet", status: "Engaged" },
  { name: "Brandon Zinn", title: "AE", company: "Statsig", status: "Engaged" },
  { name: "Colleen Goodwin", title: "AM", company: "Adobe", status: "Pitched" },
  { name: "Rodolfo Cid", title: "AE", company: "Miro", status: "Engaged" },
  { name: "Ryan Olsen", title: "RVP", company: "UIPath", status: "Engaged" },
  { name: "Aaron Goldey", title: "RVP", company: "DataDog", status: "Engaged" },
  { name: "Matthew Morris", title: "AE", company: "Confluent", status: "Engaged" },
  { name: "Gretchen Sweet", title: "Manager", company: "Asana", status: "Engaged" },
  { name: "Alex Amaya", title: "AE", company: "Cloudflare", status: "Engaged" },
  { name: "Keith Hoffman", title: "AE", company: "Airtable", status: "Engaged" },
  { name: "Tiffany Situ", title: "Strategy", company: "Carta", status: "Engaged" },
  { name: "Daniel Elsa", title: "AE", company: "Carta", status: "Engaged" },
  { name: "Chris Poshni", title: "Head Sales", company: "Wix", status: "Engaged" },
  { name: "Gary Carlin", title: "AE", company: "Atlassian", status: "Pitched" },
  { name: "John Agnello", title: "Head Recruit", company: "Finally", status: "Engaged" },
  { name: "Thomas Chong", title: "AE", company: "Brex", status: "Engaged" },
  { name: "Joe White", title: "Strategy", company: "Okta", status: "Engaged" },
  { name: "Joel Houghton", title: "AE", company: "Otelier", status: "Engaged" },
  { name: "Dillon Rohrich", title: "AM", company: "NetSuite", status: "Engaged" },
  { name: "Justin Ilacqua", title: "AE", company: "DataDog", status: "Engaged" },
  { name: "Rich Morgan", title: "Dir Sales", company: "Absorb", status: "Engaged" },
  { name: "Kevin Kenney", title: "Leader", company: "GitLab", status: "Pitched" }
];

async function main() {
  try {
    console.log('🚀 Starting simplified lead addition...\n');
    
    // Connect to database
    await prisma.$connect();
    console.log('✅ Connected to database');
    
    // Find workspace and user
    const workspace = await prisma.workspace.findFirst({
      where: { id: "adrata" }
    });
    
    const user = await prisma.user.findFirst({
      where: { 
        OR: [
          { name: { contains: "Dan", mode: 'insensitive' } },
          { email: { contains: "dan", mode: 'insensitive' } }
        ]
      }
    });
    
    if (!workspace || !user) {
      throw new Error('Workspace or user not found');
    }
    
    console.log(`✅ Found workspace: ${workspace.name}`);
    console.log(`✅ Found user: ${user.name}`);
    
    let addedCount = 0;
    
    console.log('\n📋 Adding 51 leads to Educate stage...');
    
    for (const leadData of EDUCATE_LEADS) {
      try {
        const [firstName, ...lastNameParts] = leadData.name.split(' ');
        const lastName = lastNameParts.join(' ') || '';
        
        // Create with minimal required fields and short values
        await prisma.lead.create({
          data: {
            firstName: firstName.substring(0, 50), // Limit length
            lastName: lastName.substring(0, 50),
            fullName: leadData.name.substring(0, 100),
            jobTitle: leadData.title.substring(0, 100),
            status: 'contacted', // Maps to "educate" stage
            source: 'Pipeline',
            workspaceId: workspace.id,
            assignedUserId: user.id,
            notes: `${leadData.status} at ${leadData.company}`,
            estimatedValue: Math.floor(Math.random() * 40000) + 15000,
            currency: 'USD',
            priority: 'medium',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        console.log(`✅ Added: ${leadData.name} (${leadData.title}) at ${leadData.company}`);
        addedCount++;
        
      } catch (error) {
        console.error(`❌ Error adding ${leadData.name}: ${error.message}`);
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   • Successfully added: ${addedCount} leads`);
    console.log(`   • All leads are in "contacted" status (Educate stage)`);
    console.log(`   • Ready to view in Pipeline > Leads`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 