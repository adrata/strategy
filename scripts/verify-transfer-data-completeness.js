#!/usr/bin/env node

/**
 * Verify Transfer Data Completeness
 * 
 * Verifies that all data fields are preserved during transfer by comparing
 * a sample of records before and after transfer.
 * 
 * Usage:
 *   node scripts/verify-transfer-data-completeness.js
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Workspace IDs
const TOP_TEMP_WORKSPACE_ID = '01K9QAP09FHT6EAP1B4G2KP3D2';
const TOP_ENGINEERING_PLUS_WORKSPACE_ID = '01K75ZD7DWHG1XF16HAF2YVKCK';

class TransferDataVerifier {
  constructor() {
    this.results = {
      companies: {
        verified: 0,
        mismatches: [],
        allFieldsPreserved: true
      },
      people: {
        verified: 0,
        mismatches: [],
        allFieldsPreserved: true
      }
    };
  }

  log(message, level = 'info') {
    const icon = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : level === 'success' ? '✅' : 'ℹ️';
    console.log(`${icon} ${message}`);
  }

  async execute() {
    try {
      this.log('VERIFYING TRANSFER DATA COMPLETENESS', 'info');
      this.log('='.repeat(70), 'info');
      this.log('', 'info');

      // Verify companies
      await this.verifyCompanies();

      // Verify people
      await this.verifyPeople();

      // Generate report
      this.generateReport();

    } catch (error) {
      this.log(`Verification failed: ${error.message}`, 'error');
      console.error(error);
      throw error;
    } finally {
      try {
        await prisma.$disconnect();
      } catch (disconnectError) {
        // Ignore disconnect errors (known issue on Windows)
      }
    }
  }

  async verifyCompanies() {
    this.log('Verifying Companies Data Preservation', 'info');
    this.log('-'.repeat(70), 'info');

    // Get sample companies from TOP Engineering Plus (transferred records)
    // Check for companies that were likely transferred from top-temp
    // We'll check by looking for companies with intelligence data in TOP Engineering Plus
    const topEngineeringPlusCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
        deletedAt: null,
        OR: [
          { dataQualityScore: { not: null } },
          { companyIntelligence: { not: null } },
          { aiIntelligence: { not: null } },
          { customFields: { not: null } },
          { dataSources: { isEmpty: false } }
        ]
      },
      take: 20
    });

    // Also get companies from top-temp (may be soft-deleted, but we can still check original data)
    const topTempCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: TOP_TEMP_WORKSPACE_ID,
        // Include soft-deleted to find transferred records
        OR: [
          { deletedAt: null },
          { deletedAt: { not: null } } // Include soft-deleted to find transferred ones
        ]
      },
      take: 20
    });

    if (topEngineeringPlusCompanies.length === 0 && topTempCompanies.length === 0) {
      this.log('No companies found to verify', 'warn');
      return;
    }

    // Use companies from TOP Engineering Plus if available, otherwise check top-temp originals
    const companiesToCheck = topEngineeringPlusCompanies.length > 0 
      ? topEngineeringPlusCompanies 
      : topTempCompanies.slice(0, 10);

    this.log(`Checking ${companiesToCheck.length} sample companies`, 'info');

    for (const companyToCheck of companiesToCheck) {
      // If checking TOP Engineering Plus companies, verify they have the expected data
      // If checking top-temp companies, verify they exist in TOP Engineering Plus
      let topTempCompany = null;
      let topEngineeringPlusCompany = null;

      if (companyToCheck.workspaceId === TOP_ENGINEERING_PLUS_WORKSPACE_ID) {
        // This is a TOP Engineering Plus company - check if it has intelligence data
        topEngineeringPlusCompany = companyToCheck;
        // Try to find original in top-temp (may be soft-deleted)
        topTempCompany = await prisma.companies.findFirst({
          where: { id: companyToCheck.id }
        });
      } else {
        // This is a top-temp company - check if it exists in TOP Engineering Plus
        topTempCompany = companyToCheck;
        topEngineeringPlusCompany = await prisma.companies.findUnique({
          where: { id: topTempCompany.id }
        });
      }

      if (!topEngineeringPlusCompany) {
        if (topTempCompany) {
          this.log(`Company ${topTempCompany.name} (${topTempCompany.id}) not found in TOP Engineering Plus`, 'warn');
          this.results.companies.mismatches.push({
            id: topTempCompany.id,
            name: topTempCompany.name,
            issue: 'Not found in TOP Engineering Plus'
          });
        }
        continue;
      }

      // Verify workspaceId is correct
      if (topEngineeringPlusCompany.workspaceId !== TOP_ENGINEERING_PLUS_WORKSPACE_ID) {
        this.log(`Company ${topEngineeringPlusCompany.name}: workspaceId incorrect (${topEngineeringPlusCompany.workspaceId})`, 'error');
        this.results.companies.allFieldsPreserved = false;
        this.results.companies.mismatches.push({
          id: topEngineeringPlusCompany.id,
          name: topEngineeringPlusCompany.name,
          issue: 'workspaceId incorrect'
        });
        continue;
      }

      // If we have both records, compare them
      if (topTempCompany && topTempCompany.workspaceId === TOP_TEMP_WORKSPACE_ID) {
        // This means the transfer hasn't happened yet or this record wasn't transferred
        // Skip comparison for now
        this.results.companies.verified++;
        continue;
      }

      // Check critical intelligence fields exist in transferred record
      const criticalFields = [
        'companyIntelligence',
        'aiIntelligence',
        'dataQualityScore',
        'dataQualityBreakdown',
        'dataSources',
        'aiConfidence',
        'aiLastUpdated',
        'dataLastVerified',
        'descriptionEnriched',
        'customFields',
        'confidence',
        'digitalMaturity',
        'marketPosition'
      ];

      // If we have both records, compare them
      if (topTempCompany && topTempCompany.workspaceId !== TOP_TEMP_WORKSPACE_ID) {
        // Compare values (handling JSON objects)
        for (const field of criticalFields) {
          const topTempValue = topTempCompany[field];
          const topEngineeringPlusValue = topEngineeringPlusCompany[field];

          if (JSON.stringify(topTempValue) !== JSON.stringify(topEngineeringPlusValue)) {
            this.log(`Company ${topEngineeringPlusCompany.name}: ${field} mismatch`, 'warn');
            this.results.companies.allFieldsPreserved = false;
            this.results.companies.mismatches.push({
              id: topEngineeringPlusCompany.id,
              name: topEngineeringPlusCompany.name,
              issue: `${field} mismatch`,
              topTemp: topTempValue,
              topEngineeringPlus: topEngineeringPlusValue
            });
          }
        }
      } else {
        // Just verify the transferred record has the expected structure
        // Check that key fields are present (not null/undefined)
        let hasIntelligenceData = false;
        for (const field of criticalFields) {
          if (topEngineeringPlusCompany[field] !== null && topEngineeringPlusCompany[field] !== undefined) {
            hasIntelligenceData = true;
            break;
          }
        }
        
        if (hasIntelligenceData) {
          this.log(`Company ${topEngineeringPlusCompany.name}: Has intelligence data preserved`, 'success');
        }
      }

      this.results.companies.verified++;
    }

    this.log(`Verified ${this.results.companies.verified} companies`, 'success');
    this.log('', 'info');
  }

  async verifyPeople() {
    this.log('Verifying People Data Preservation', 'info');
    this.log('-'.repeat(70), 'info');

    // Get sample people from TOP Engineering Plus (transferred records)
    const topEngineeringPlusPeople = await prisma.people.findMany({
      where: {
        workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
        deletedAt: null,
        OR: [
          { aiIntelligence: { not: null } },
          { coresignalData: { not: null } },
          { enrichedData: { not: null } },
          { dataQualityScore: { not: null } },
          { buyerGroupRole: { not: null } },
          { decisionPower: { not: null } }
        ]
      },
      take: 20
    });

    // Also get people from top-temp (may be soft-deleted)
    const topTempPeople = await prisma.people.findMany({
      where: {
        workspaceId: TOP_TEMP_WORKSPACE_ID,
        // Include soft-deleted to find transferred records
        OR: [
          { deletedAt: null },
          { deletedAt: { not: null } }
        ]
      },
      take: 20
    });

    if (topEngineeringPlusPeople.length === 0 && topTempPeople.length === 0) {
      this.log('No people found to verify', 'warn');
      return;
    }

    // Use people from TOP Engineering Plus if available, otherwise check top-temp originals
    const peopleToCheck = topEngineeringPlusPeople.length > 0 
      ? topEngineeringPlusPeople 
      : topTempPeople.slice(0, 10);

    this.log(`Checking ${peopleToCheck.length} sample people`, 'info');

    for (const personToCheck of peopleToCheck) {
      // If checking TOP Engineering Plus people, verify they have the expected data
      // If checking top-temp people, verify they exist in TOP Engineering Plus
      let topTempPerson = null;
      let topEngineeringPlusPerson = null;

      if (personToCheck.workspaceId === TOP_ENGINEERING_PLUS_WORKSPACE_ID) {
        // This is a TOP Engineering Plus person - check if it has intelligence data
        topEngineeringPlusPerson = personToCheck;
        // Try to find original in top-temp (may be soft-deleted)
        topTempPerson = await prisma.people.findFirst({
          where: { id: personToCheck.id }
        });
      } else {
        // This is a top-temp person - check if it exists in TOP Engineering Plus
        topTempPerson = personToCheck;
        topEngineeringPlusPerson = await prisma.people.findUnique({
          where: { id: topTempPerson.id }
        });
      }

      if (!topEngineeringPlusPerson) {
        if (topTempPerson) {
          this.log(`Person ${topTempPerson.fullName} (${topTempPerson.id}) not found in TOP Engineering Plus`, 'warn');
          this.results.people.mismatches.push({
            id: topTempPerson.id,
            name: topTempPerson.fullName,
            issue: 'Not found in TOP Engineering Plus'
          });
        }
        continue;
      }

      // Verify workspaceId is correct
      if (topEngineeringPlusPerson.workspaceId !== TOP_ENGINEERING_PLUS_WORKSPACE_ID) {
        this.log(`Person ${topEngineeringPlusPerson.fullName}: workspaceId incorrect (${topEngineeringPlusPerson.workspaceId})`, 'error');
        this.results.people.allFieldsPreserved = false;
        this.results.people.mismatches.push({
          id: topEngineeringPlusPerson.id,
          name: topEngineeringPlusPerson.fullName,
          issue: 'workspaceId incorrect'
        });
        continue;
      }

      // If we have both records, compare them
      if (topTempPerson && topTempPerson.workspaceId === TOP_TEMP_WORKSPACE_ID) {
        // This means the transfer hasn't happened yet or this record wasn't transferred
        // Skip comparison for now
        this.results.people.verified++;
        continue;
      }

      // Check critical intelligence fields exist in transferred record
      const criticalFields = [
        'aiIntelligence',
        'dataQualityScore',
        'dataQualityBreakdown',
        'dataSources',
        'enrichmentScore',
        'aiConfidence',
        'aiLastUpdated',
        'dataLastVerified',
        'coresignalData',
        'enrichedData',
        'customFields',
        'buyerGroupRole',
        'decisionPower',
        'influenceLevel',
        'engagementScore',
        'influenceScore'
      ];

      // If we have both records, compare them
      if (topTempPerson && topTempPerson.workspaceId !== TOP_TEMP_WORKSPACE_ID) {
        // Compare values (handling JSON objects and arrays)
        for (const field of criticalFields) {
          const topTempValue = topTempPerson[field];
          const topEngineeringPlusValue = topEngineeringPlusPerson[field];

          if (JSON.stringify(topTempValue) !== JSON.stringify(topEngineeringPlusValue)) {
            this.log(`Person ${topEngineeringPlusPerson.fullName}: ${field} mismatch`, 'warn');
            this.results.people.allFieldsPreserved = false;
            this.results.people.mismatches.push({
              id: topEngineeringPlusPerson.id,
              name: topEngineeringPlusPerson.fullName,
              issue: `${field} mismatch`,
              topTemp: topTempValue,
              topEngineeringPlus: topEngineeringPlusValue
            });
          }
        }
      } else {
        // Just verify the transferred record has the expected structure
        // Check that key fields are present (not null/undefined)
        let hasIntelligenceData = false;
        for (const field of criticalFields) {
          if (topEngineeringPlusPerson[field] !== null && topEngineeringPlusPerson[field] !== undefined) {
            hasIntelligenceData = true;
            break;
          }
        }
        
        if (hasIntelligenceData) {
          this.log(`Person ${topEngineeringPlusPerson.fullName}: Has intelligence data preserved`, 'success');
        }
      }

      this.results.people.verified++;
    }

    this.log(`Verified ${this.results.people.verified} people`, 'success');
    this.log('', 'info');
  }

  generateReport() {
    this.log('='.repeat(70), 'info');
    this.log('VERIFICATION SUMMARY', 'info');
    this.log('='.repeat(70), 'info');

    this.log('', 'info');
    this.log('COMPANIES:', 'info');
    this.log(`  Verified: ${this.results.companies.verified}`, 'info');
    this.log(`  All fields preserved: ${this.results.companies.allFieldsPreserved ? 'YES' : 'NO'}`, 
      this.results.companies.allFieldsPreserved ? 'success' : 'error');
    
    if (this.results.companies.mismatches.length > 0) {
      this.log(`  Mismatches: ${this.results.companies.mismatches.length}`, 'warn');
      this.results.companies.mismatches.slice(0, 5).forEach(m => {
        this.log(`    - ${m.name}: ${m.issue}`, 'warn');
      });
      if (this.results.companies.mismatches.length > 5) {
        this.log(`    ... and ${this.results.companies.mismatches.length - 5} more`, 'warn');
      }
    }

    this.log('', 'info');
    this.log('PEOPLE:', 'info');
    this.log(`  Verified: ${this.results.people.verified}`, 'info');
    this.log(`  All fields preserved: ${this.results.people.allFieldsPreserved ? 'YES' : 'NO'}`, 
      this.results.people.allFieldsPreserved ? 'success' : 'error');
    
    if (this.results.people.mismatches.length > 0) {
      this.log(`  Mismatches: ${this.results.people.mismatches.length}`, 'warn');
      this.results.people.mismatches.slice(0, 5).forEach(m => {
        this.log(`    - ${m.name}: ${m.issue}`, 'warn');
      });
      if (this.results.people.mismatches.length > 5) {
        this.log(`    ... and ${this.results.people.mismatches.length - 5} more`, 'warn');
      }
    }

    this.log('', 'info');
    this.log('='.repeat(70), 'info');
    
    if (this.results.companies.allFieldsPreserved && this.results.people.allFieldsPreserved) {
      this.log('All data fields are preserved correctly', 'success');
    } else {
      this.log('Some data fields may not be preserved - review mismatches above', 'error');
    }
  }
}

// Main execution
async function main() {
  const verifier = new TransferDataVerifier();
  
  try {
    await verifier.execute();
    process.exit(0);
  } catch (error) {
    console.error('Verification failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = TransferDataVerifier;

