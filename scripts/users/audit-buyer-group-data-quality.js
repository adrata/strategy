const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function auditDataQuality() {
  const workspaceId = '01K7DNYR5VZ7JY36KGKKN76XZ1';
  
  const noel = await prisma.users.findFirst({
    where: { email: { contains: 'noel', mode: 'insensitive' } }
  });
  
  console.log('📊 BUYER GROUP DATA QUALITY AUDIT\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Get all buyer groups
  const buyerGroups = await prisma.buyerGroups.findMany({
    where: { workspaceId }
  });
  
  // Get all buyer group members
  const allMembers = await prisma.buyerGroupMembers.findMany({
    where: {
      buyerGroupId: { in: buyerGroups.map(bg => bg.id) }
    }
  });
  
  console.log('📈 OVERALL STATS:');
  console.log('   • Total Buyer Groups: ' + buyerGroups.length);
  console.log('   • Total Members: ' + allMembers.length);
  console.log('');
  
  // Get all people in buyer groups
  const peopleInBGs = await prisma.people.findMany({
    where: {
      workspaceId,
      mainSellerId: noel.id,
      deletedAt: null,
      buyerGroupRole: { not: null }
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      workEmail: true,
      phone: true,
      workPhone: true,
      mobilePhone: true,
      linkedinUrl: true,
      jobTitle: true,
      buyerGroupRole: true,
      companyId: true
    }
  });
  
  console.log('👥 PEOPLE DATA COMPLETENESS:');
  console.log('   • Total People in Buyer Groups: ' + peopleInBGs.length);
  
  const withEmail = peopleInBGs.filter(p => p.email || p.workEmail).length;
  const withPhone = peopleInBGs.filter(p => p.phone || p.workPhone || p.mobilePhone).length;
  const withLinkedIn = peopleInBGs.filter(p => p.linkedinUrl).length;
  const withJobTitle = peopleInBGs.filter(p => p.jobTitle).length;
  const withCompany = peopleInBGs.filter(p => p.companyId).length;
  
  console.log('   • With Email: ' + withEmail + ' (' + ((withEmail / peopleInBGs.length) * 100).toFixed(1) + '%)');
  console.log('   • With Phone: ' + withPhone + ' (' + ((withPhone / peopleInBGs.length) * 100).toFixed(1) + '%)');
  console.log('   • With LinkedIn: ' + withLinkedIn + ' (' + ((withLinkedIn / peopleInBGs.length) * 100).toFixed(1) + '%)');
  console.log('   • With Job Title: ' + withJobTitle + ' (' + ((withJobTitle / peopleInBGs.length) * 100).toFixed(1) + '%)');
  console.log('   • With Company: ' + withCompany + ' (' + ((withCompany / peopleInBGs.length) * 100).toFixed(1) + '%)');
  console.log('');
  
  // Calculate completeness score per person
  const completenessScores = peopleInBGs.map(p => {
    let score = 0;
    if (p.email || p.workEmail) score += 1;
    if (p.phone || p.workPhone || p.mobilePhone) score += 1;
    if (p.linkedinUrl) score += 1;
    if (p.jobTitle) score += 1;
    if (p.companyId) score += 1;
    return { person: p, score: score / 5 };
  });
  
  const avgCompleteness = completenessScores.reduce((sum, p) => sum + p.score, 0) / completenessScores.length;
  console.log('   • Average Data Completeness: ' + (avgCompleteness * 100).toFixed(1) + '%');
  console.log('');
  
  // Find people missing critical data
  const missingEmail = peopleInBGs.filter(p => !p.email && !p.workEmail);
  const missingPhone = peopleInBGs.filter(p => !p.phone && !p.workPhone && !p.mobilePhone);
  const missingLinkedIn = peopleInBGs.filter(p => !p.linkedinUrl);
  
  console.log('⚠️  DATA GAPS:');
  console.log('   • Missing Email: ' + missingEmail.length);
  console.log('   • Missing Phone: ' + missingPhone.length);
  console.log('   • Missing LinkedIn: ' + missingLinkedIn.length);
  console.log('');
  
  // Buyer group member quality
  const memberStats = {
    withEmail: allMembers.filter(m => m.email).length,
    withPhone: allMembers.filter(m => m.phone).length,
    withLinkedIn: allMembers.filter(m => m.linkedin).length,
    total: allMembers.length
  };
  
  const avgMemberCompleteness = memberStats.total > 0
    ? (memberStats.withEmail + memberStats.withPhone + memberStats.withLinkedIn) / (memberStats.total * 3)
    : 0;
  
  console.log('📊 BUYER GROUP MEMBER QUALITY:');
  console.log('   • Members with Email: ' + memberStats.withEmail + ' (' + ((memberStats.withEmail / memberStats.total) * 100).toFixed(1) + '%)');
  console.log('   • Members with Phone: ' + memberStats.withPhone + ' (' + ((memberStats.withPhone / memberStats.total) * 100).toFixed(1) + '%)');
  console.log('   • Members with LinkedIn: ' + memberStats.withLinkedIn + ' (' + ((memberStats.withLinkedIn / memberStats.total) * 100).toFixed(1) + '%)');
  console.log('   • Average Member Data Completeness: ' + (avgMemberCompleteness * 100).toFixed(1) + '%');
  console.log('');
  
  // Buyer group quality by group
  const bgQuality = buyerGroups.map(bg => {
    const members = allMembers.filter(m => m.buyerGroupId === bg.id);
    const withEmail = members.filter(m => m.email).length;
    const withPhone = members.filter(m => m.phone).length;
    const withLinkedIn = members.filter(m => m.linkedin).length;
    const completeness = members.length > 0 
      ? (withEmail + withPhone + withLinkedIn) / (members.length * 3)
      : 0;
    return { bg, completeness, members: members.length };
  });
  
  const avgBGCompleteness = bgQuality.length > 0
    ? bgQuality.reduce((sum, bg) => sum + bg.completeness, 0) / bgQuality.length
    : 0;
  
  console.log('📊 BUYER GROUP QUALITY:');
  console.log('   • Average Group Data Completeness: ' + (avgBGCompleteness * 100).toFixed(1) + '%');
  console.log('   • Buyer Groups with 100% complete data: ' + bgQuality.filter(bg => bg.completeness === 1).length);
  console.log('   • Buyer Groups with <50% complete data: ' + bgQuality.filter(bg => bg.completeness < 0.5).length);
  console.log('');
  
  // Role distribution
  const roleStats = await prisma.people.groupBy({
    by: ['buyerGroupRole'],
    where: {
      workspaceId,
      mainSellerId: noel.id,
      deletedAt: null,
      buyerGroupRole: { not: null }
    },
    _count: true
  });
  
  console.log('🎯 ROLE DISTRIBUTION:');
  roleStats.sort((a, b) => b._count - a._count).forEach(r => {
    const roleName = r.buyerGroupRole.charAt(0).toUpperCase() + r.buyerGroupRole.slice(1);
    console.log('   • ' + roleName + ': ' + r._count);
  });
  console.log('');
  
  // Summary for client presentation
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 CLIENT-READY SUMMARY:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('✅ ' + buyerGroups.length + ' Buyer Groups Identified');
  console.log('✅ ' + allMembers.length + ' Total Buyer Group Members');
  console.log('✅ ' + ((avgCompleteness * 100).toFixed(0)) + '% Average Data Completeness');
  console.log('✅ ' + ((avgMemberCompleteness * 100).toFixed(0)) + '% Contact Data Coverage (Email/Phone/LinkedIn)');
  console.log('✅ ' + roleStats.find(r => r.buyerGroupRole === 'decision')?._count || 0 + ' Decision Makers Identified');
  console.log('✅ ' + roleStats.find(r => r.buyerGroupRole === 'champion')?._count || 0 + ' Champions Identified');
  console.log('');
  
  if (avgCompleteness < 0.8 || avgMemberCompleteness < 0.7) {
    console.log('⚠️  RECOMMENDATION: Run enrichment to improve data quality');
    console.log('   Missing: ' + missingEmail.length + ' emails, ' + missingPhone.length + ' phones, ' + missingLinkedIn.length + ' LinkedIn URLs');
  } else {
    console.log('✅ Data quality is excellent - ready for client presentation!');
  }
  
  await prisma.$disconnect();
}

auditDataQuality().catch(console.error);
