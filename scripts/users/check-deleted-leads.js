#!/usr/bin/env node
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const WORKSPACE_ID = '01KBDP8ZXDTAHJNT14S3WB1DTA';
const AZ_CODES = ['480', '520', '602', '623', '928'];

function getAreaCode(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) return digits.substring(0, 3);
  if (digits.length === 11 && digits.startsWith('1')) return digits.substring(1, 4);
  return null;
}

function isArizonaPhone(phone) {
  const areaCode = getAreaCode(phone);
  return areaCode && AZ_CODES.includes(areaCode);
}

async function main() {
  console.log('\n=== RUNE GATE CO. LEAD STATUS ===\n');
  
  // Get users
  const josh = await prisma.users.findFirst({ where: { email: 'finn@runegateco.com' } });
  const clients = await prisma.users.findFirst({ where: { email: 'clients@runegateco.com' } });
  
  console.log('USERS:');
  console.log('  Josh:', josh?.id);
  console.log('  Clients:', clients?.id);
  
  // Active leads
  const activeLeads = await prisma.people.findMany({
    where: { workspaceId: WORKSPACE_ID, deletedAt: null },
    select: { id: true, fullName: true, phone: true, mainSellerId: true }
  });
  
  console.log('\nACTIVE LEADS:', activeLeads.length);
  console.log('  Assigned to Josh:', activeLeads.filter(l => l.mainSellerId === josh?.id).length);
  console.log('  Assigned to Clients:', activeLeads.filter(l => l.mainSellerId === clients?.id).length);
  
  // Deleted leads
  const deletedLeads = await prisma.people.findMany({
    where: { workspaceId: WORKSPACE_ID, deletedAt: { not: null } },
    select: { id: true, fullName: true, phone: true }
  });
  
  const deletedWithAZ = deletedLeads.filter(l => isArizonaPhone(l.phone));
  const deletedNonAZ = deletedLeads.filter(l => !isArizonaPhone(l.phone));
  
  console.log('\nDELETED LEADS:', deletedLeads.length);
  console.log('  With AZ phones (restorable):', deletedWithAZ.length);
  console.log('  Non-AZ phones:', deletedNonAZ.length);
  
  if (deletedWithAZ.length > 0) {
    console.log('\nSample deleted AZ leads:');
    deletedWithAZ.slice(0, 5).forEach(l => {
      console.log('  -', l.fullName, '|', l.phone, '| Area:', getAreaCode(l.phone));
    });
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);
