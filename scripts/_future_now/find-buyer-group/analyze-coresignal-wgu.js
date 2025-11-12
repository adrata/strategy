const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeWGU() {
  try {
    const company = await prisma.companies.findFirst({
      where: {
        name: { contains: 'Western Governors' }
      },
      select: {
        name: true,
        employeeCount: true,
        customFields: true
      }
    });

    if (!company) {
      console.log('❌ No company found');
      return;
    }

    console.log('✅ Found company:', company.name);
    console.log('📊 Employee Count (DB):', company.employeeCount);

    if (company.customFields && company.customFields.coresignalData) {
      const cs = company.customFields.coresignalData;
      
      console.log('\n📈 CORESIGNAL DATA ANALYSIS:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Employee count fields
      console.log('\n👥 EMPLOYEE COUNT DATA:');
      console.log('  employees_count:', cs.employees_count || 'N/A');
      console.log('  employees_count_inferred:', cs.employees_count_inferred || 'N/A');
      
      // Breakdowns
      if (cs.employees_count_breakdown_by_seniority) {
        console.log('\n📊 SENIORITY BREAKDOWN:');
        console.log(JSON.stringify(cs.employees_count_breakdown_by_seniority, null, 2));
      } else {
        console.log('\n⚠️  No seniority breakdown available');
      }
      
      if (cs.employees_count_breakdown_by_department) {
        console.log('\n🏢 DEPARTMENT BREAKDOWN:');
        console.log(JSON.stringify(cs.employees_count_breakdown_by_department, null, 2));
      } else {
        console.log('\n⚠️  No department breakdown available');
      }
      
      // Historical data
      if (cs.employees_count_by_month) {
        console.log('\n📅 EMPLOYEE COUNT BY MONTH (last 6 months):');
        const months = Array.isArray(cs.employees_count_by_month) 
          ? cs.employees_count_by_month.slice(-6)
          : Object.entries(cs.employees_count_by_month).slice(-6);
        console.log(JSON.stringify(months, null, 2));
      }
      
      // Key insights
      console.log('\n🔍 KEY INSIGHTS:');
      console.log('  Total employees (Coresignal):', cs.employees_count || 'N/A');
      console.log('  Total employees (DB):', company.employeeCount || 'N/A');
      
      if (cs.employees_count_breakdown_by_department) {
        const deptTotal = Object.values(cs.employees_count_breakdown_by_department)
          .reduce((sum, count) => sum + (count || 0), 0);
        console.log('  Sum of department breakdown:', deptTotal);
        console.log('  ⚠️  Gap:', (cs.employees_count || 0) - deptTotal, 'employees not categorized by department');
      }
      
      // Check for any flags or notes
      console.log('\n📝 OTHER FIELDS:');
      const importantFields = [
        'type',
        'industry',
        'linkedin_url',
        'website',
        'employees_count_change',
        'active_job_postings_count'
      ];
      
      importantFields.forEach(field => {
        if (cs[field] !== undefined) {
          console.log(`  ${field}:`, JSON.stringify(cs[field]));
        }
      });
      
    } else {
      console.log('⚠️  No Coresignal data cached in database');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeWGU();

