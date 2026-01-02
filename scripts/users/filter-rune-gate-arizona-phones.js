#!/usr/bin/env node

/**
 * Filter Rune Gate Co. Leads - Arizona Phone Numbers Only
 * 
 * This script:
 * 1. Counts all leads in Rune Gate Co. workspace
 * 2. Identifies leads with non-Arizona phone numbers
 * 3. Removes (soft deletes) leads that don't have Arizona area codes
 * 
 * Arizona area codes: 480, 520, 602, 623, 928
 * 
 * Usage: node scripts/users/filter-rune-gate-arizona-phones.js [--dry-run]
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const RUNE_GATE_WORKSPACE_ID = '01KBDP8ZXDTAHJNT14S3WB1DTA';

// Arizona area codes
const ARIZONA_AREA_CODES = ['480', '520', '602', '623', '928'];

class ArizonaPhoneFilter {
  constructor() {
    this.prisma = new PrismaClient();
    this.dryRun = process.argv.includes('--dry-run');
    this.stats = {
      totalLeads: 0,
      leadsWithPhone: 0,
      leadsWithoutPhone: 0,
      arizonaLeads: 0,
      nonArizonaLeads: 0,
      removed: 0
    };
  }

  /**
   * Extract area code from a phone number
   */
  extractAreaCode(phone) {
    if (!phone) return null;
    
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    
    // Handle different formats
    if (digits.length === 10) {
      return digits.substring(0, 3);
    } else if (digits.length === 11 && digits.startsWith('1')) {
      return digits.substring(1, 4);
    }
    
    return null;
  }

  /**
   * Check if a phone number is Arizona-based
   */
  isArizonaPhone(phone) {
    const areaCode = this.extractAreaCode(phone);
    return areaCode && ARIZONA_AREA_CODES.includes(areaCode);
  }

  /**
   * Get the best available phone number for a lead
   */
  getBestPhone(lead) {
    return lead.phone || lead.mobilePhone || lead.workPhone;
  }

  async run() {
    console.log('\n============================================================');
    console.log('   RUNE GATE CO. - ARIZONA PHONE FILTER');
    console.log('============================================================\n');

    if (this.dryRun) {
      console.log('🔍 DRY RUN MODE - No changes will be made\n');
    }

    try {
      await this.prisma.$connect();
      console.log('Connected to database\n');

      // Step 1: Get all active leads
      const leads = await this.prisma.people.findMany({
        where: {
          workspaceId: RUNE_GATE_WORKSPACE_ID,
          deletedAt: null
        },
        select: {
          id: true,
          fullName: true,
          phone: true,
          mobilePhone: true,
          workPhone: true,
          city: true,
          state: true
        }
      });

      this.stats.totalLeads = leads.length;
      console.log(`📊 LEAD STATISTICS`);
      console.log('─'.repeat(50));
      console.log(`Total active leads: ${leads.length}\n`);

      // Step 2: Categorize leads by phone number
      const arizonaLeads = [];
      const nonArizonaLeads = [];
      const noPhoneLeads = [];

      for (const lead of leads) {
        const phone = this.getBestPhone(lead);
        
        if (!phone) {
          noPhoneLeads.push(lead);
          this.stats.leadsWithoutPhone++;
        } else if (this.isArizonaPhone(phone)) {
          arizonaLeads.push({ ...lead, phone });
          this.stats.leadsWithPhone++;
          this.stats.arizonaLeads++;
        } else {
          nonArizonaLeads.push({ ...lead, phone, areaCode: this.extractAreaCode(phone) });
          this.stats.leadsWithPhone++;
          this.stats.nonArizonaLeads++;
        }
      }

      console.log(`📞 PHONE NUMBER BREAKDOWN`);
      console.log('─'.repeat(50));
      console.log(`Leads with phone numbers: ${this.stats.leadsWithPhone}`);
      console.log(`  ✅ Arizona (480, 520, 602, 623, 928): ${this.stats.arizonaLeads}`);
      console.log(`  ❌ Non-Arizona: ${this.stats.nonArizonaLeads}`);
      console.log(`Leads without phone numbers: ${this.stats.leadsWithoutPhone}\n`);

      // Step 3: Show sample of non-Arizona leads
      if (nonArizonaLeads.length > 0) {
        console.log(`🚫 NON-ARIZONA LEADS TO REMOVE (${nonArizonaLeads.length} total)`);
        console.log('─'.repeat(50));
        
        // Show first 10
        const sample = nonArizonaLeads.slice(0, 10);
        for (const lead of sample) {
          console.log(`  - ${lead.fullName}`);
          console.log(`    Phone: ${lead.phone} (Area code: ${lead.areaCode})`);
          console.log(`    Location: ${lead.city || 'N/A'}, ${lead.state || 'N/A'}`);
        }
        
        if (nonArizonaLeads.length > 10) {
          console.log(`  ... and ${nonArizonaLeads.length - 10} more\n`);
        }
        console.log('');
      }

      // Step 4: Show sample of leads without phone (these will also be removed)
      if (noPhoneLeads.length > 0) {
        console.log(`📵 LEADS WITHOUT PHONE NUMBERS (${noPhoneLeads.length} total) - WILL ALSO BE REMOVED`);
        console.log('─'.repeat(50));
        
        const sample = noPhoneLeads.slice(0, 5);
        for (const lead of sample) {
          console.log(`  - ${lead.fullName}`);
          console.log(`    Location: ${lead.city || 'N/A'}, ${lead.state || 'N/A'}`);
        }
        
        if (noPhoneLeads.length > 5) {
          console.log(`  ... and ${noPhoneLeads.length - 5} more\n`);
        }
        console.log('');
      }

      // Step 5: Remove non-Arizona and no-phone leads
      const leadsToRemove = [...nonArizonaLeads, ...noPhoneLeads];
      
      if (leadsToRemove.length > 0 && !this.dryRun) {
        console.log(`🗑️  REMOVING ${leadsToRemove.length} LEADS...`);
        console.log('─'.repeat(50));
        
        const result = await this.prisma.people.updateMany({
          where: {
            id: { in: leadsToRemove.map(l => l.id) }
          },
          data: {
            deletedAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        this.stats.removed = result.count;
        console.log(`✅ Removed ${result.count} leads (soft delete)\n`);
      } else if (this.dryRun && leadsToRemove.length > 0) {
        console.log(`🔍 DRY RUN: Would remove ${leadsToRemove.length} leads\n`);
        this.stats.removed = leadsToRemove.length;
      }

      // Final summary
      console.log('============================================================');
      console.log('   SUMMARY');
      console.log('============================================================');
      console.log(`Total leads before: ${this.stats.totalLeads}`);
      console.log(`Arizona leads (kept): ${this.stats.arizonaLeads}`);
      console.log(`Non-Arizona leads removed: ${this.stats.nonArizonaLeads}`);
      console.log(`No-phone leads removed: ${this.stats.leadsWithoutPhone}`);
      console.log(`Total removed: ${this.stats.removed}`);
      console.log(`Leads remaining: ${this.stats.arizonaLeads}`);
      console.log('============================================================\n');

      if (this.dryRun) {
        console.log('To apply changes, run without --dry-run flag:\n');
        console.log('  node scripts/users/filter-rune-gate-arizona-phones.js\n');
      }

    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    } finally {
      await this.prisma.$disconnect();
    }
  }
}

const filter = new ArizonaPhoneFilter();
filter.run().catch(console.error);
