#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRedundancies() {
  try {
    console.log('🔍 Redundancy Analysis:');
    
    // Check for duplicate emails across contacts, leads, prospects
    const contactEmails = await prisma.contacts.findMany({
      where: { email: { not: null } },
      select: { email: true, workspaceId: true }
    });
    
    const leadEmails = await prisma.leads.findMany({
      where: { email: { not: null } },
      select: { email: true, workspaceId: true }
    });
    
    const prospectEmails = await prisma.prospects.findMany({
      where: { email: { not: null } },
      select: { email: true, workspaceId: true }
    });
    
    // Find common emails
    const allEmails = [...contactEmails, ...leadEmails, ...prospectEmails];
    const emailMap = new Map();
    
    allEmails.forEach(item => {
      const key = `${item.email}-${item.workspaceId}`;
      if (!emailMap.has(key)) {
        emailMap.set(key, []);
      }
      emailMap.get(key).push(item);
    });
    
    const duplicates = Array.from(emailMap.entries()).filter(([key, items]) => items.length > 1);
    console.log('Duplicate emails across entities:', duplicates.length);
    
    // Check for duplicate company names across accounts and Company
    const accountCompanies = await prisma.accounts.findMany({
      select: { name: true, workspaceId: true }
    });
    
    const companyCompanies = await prisma.company.findMany({
      select: { name: true, workspaceId: true }
    });
    
    const allCompanies = [...accountCompanies, ...companyCompanies];
    const companyMap = new Map();
    
    allCompanies.forEach(item => {
      const key = `${item.name}-${item.workspaceId}`;
      if (!companyMap.has(key)) {
        companyMap.set(key, []);
      }
      companyMap.get(key).push(item);
    });
    
    const duplicateCompanies = Array.from(companyMap.entries()).filter(([key, items]) => items.length > 1);
    console.log('Duplicate company names across entities:', duplicateCompanies.length);
    
    // Check Person vs contacts/leads/prospects overlap
    const personEmails = await prisma.person.findMany({
      where: { email: { not: null } },
      select: { email: true, workspaceId: true }
    });
    
    const personEmailSet = new Set(personEmails.map(p => `${p.email}-${p.workspaceId}`));
    const contactEmailSet = new Set(contactEmails.map(c => `${c.email}-${c.workspaceId}`));
    const leadEmailSet = new Set(leadEmails.map(l => `${l.email}-${l.workspaceId}`));
    const prospectEmailSet = new Set(prospectEmails.map(p => `${p.email}-${p.workspaceId}`));
    
    const personContactOverlap = [...personEmailSet].filter(email => contactEmailSet.has(email)).length;
    const personLeadOverlap = [...personEmailSet].filter(email => leadEmailSet.has(email)).length;
    const personProspectOverlap = [...personEmailSet].filter(email => prospectEmailSet.has(email)).length;
    
    console.log('Person-Contact email overlap:', personContactOverlap);
    console.log('Person-Lead email overlap:', personLeadOverlap);
    console.log('Person-Prospect email overlap:', personProspectOverlap);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

checkRedundancies();
