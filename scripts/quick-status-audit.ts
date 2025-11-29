#!/usr/bin/env tsx
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function audit() {
  const ws = await prisma.workspaces.findFirst({
    where: { name: { contains: 'TOP Engineering', mode: 'insensitive' } }
  });
  
  if (!ws) {
    console.log('Workspace not found');
    return;
  }
  
  const wid = ws.id;
  console.log('Workspace:', ws.name);
  
  // People by status
  const people = await prisma.people.groupBy({
    by: ['status'],
    where: { workspaceId: wid, deletedAt: null },
    _count: true
  });
  console.log('\n👤 PEOPLE BY STATUS:');
  for (const p of people) {
    console.log('  ', p.status || 'NULL', ':', p._count);
  }
  
  // Companies by status
  const companies = await prisma.companies.groupBy({
    by: ['status'],
    where: { workspaceId: wid, deletedAt: null },
    _count: true
  });
  console.log('\n🏢 COMPANIES BY STATUS:');
  for (const c of companies) {
    console.log('  ', c.status || 'NULL', ':', c._count);
  }
  
  // Emails
  const totalEmails = await prisma.email_messages.count({ where: { workspaceId: wid } });
  const linkedEmails = await prisma.email_messages.count({ where: { workspaceId: wid, personId: { not: null } } });
  console.log('\n📧 EMAILS:', totalEmails, 'total,', linkedEmails, 'linked to people');
  
  // Calendar events
  const totalEvents = await prisma.events.count({ where: { workspaceId: wid } });
  const linkedEvents = await prisma.events.count({ where: { workspaceId: wid, personId: { not: null } } });
  console.log('📅 CALENDAR EVENTS:', totalEvents, 'total,', linkedEvents, 'linked to people');
  
  // Actions (represents opportunities/engagements)
  const actions = await prisma.actions.count({ where: { workspaceId: wid } });
  console.log('💼 ACTIONS:', actions);
  
  // Check classification service
  const withReason = await prisma.people.count({
    where: { workspaceId: wid, statusReason: { not: null }, deletedAt: null }
  });
  console.log('\n🔧 People with auto-classification reason:', withReason);
  
  // Show recent auto-classifications
  const recent = await prisma.people.findMany({
    where: { workspaceId: wid, statusReason: { not: null }, deletedAt: null },
    select: { fullName: true, status: true, statusReason: true, statusUpdateDate: true },
    orderBy: { statusUpdateDate: 'desc' },
    take: 10
  });
  
  if (recent.length > 0) {
    console.log('\n📊 Recent Auto-Classifications:');
    for (const p of recent) {
      console.log('  ', p.fullName, '-', p.status, '-', p.statusReason);
    }
  }
  
  await prisma.$disconnect();
  console.log('\n✅ Audit complete!');
}

audit().catch(console.error);

