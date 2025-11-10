/**
 * Upload CSV Data to Top-Temp Workspace
 * Processes final_top - Sheet1.csv and uploads companies and people data
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { ulid } = require('ulid');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Configuration
const CSV_FILE = 'final_top - Sheet1.csv';
const WORKSPACE_SLUG = 'top-temp';
const TEMP_USER_PASSWORD = 'TempUser123!';

// Temp users configuration
const TEMP_USERS = [
  { name: 'Victoria Leland', username: 'temp-victoria', email: 'temp-victoria@top-temp.com' },
  { name: 'Justin Bedard', username: 'temp-justin', email: 'temp-justin@top-temp.com' },
  { name: 'Judy Wigginton', username: 'temp-judy', email: 'temp-judy@top-temp.com' },
  { name: 'Hilary Tristan', username: 'temp-hilary', email: 'temp-hilary@top-temp.com' }
];

class TopTempDataUploader {
  constructor() {
    this.workspace = null;
    this.sellerMap = new Map(); // Maps Main_Seller name to user ID
    this.companyMap = new Map(); // Maps company name to company ID
    this.stats = {
      companiesCreated: 0,
      companiesUpdated: 0,
      peopleCreated: 0,
      peopleUpdated: 0,
      websitesExtracted: 0,
      errors: 0
    };
    this.missingWebsites = []; // Companies without websites
  }

  async execute() {
    try {
      console.log('🚀 Starting Top-Temp Data Upload\n');
      console.log('=' .repeat(60));

      // Step 1: Get workspace
      await this.getWorkspace();

      // Step 2: Remove TOP company and associated people
      await this.removeTopCompany();

      // Step 3: Create temp users
      await this.createTempUsers();

      // Step 4: Parse CSV
      const rows = await this.parseCSV();

      // Step 5: Validate separation - ensure no overlap
      await this.validateSeparation(rows);

      // Step 6: Process companies first
      await this.processCompanies(rows);

      // Step 7: Process people
      await this.processPeople(rows);

      // Step 7: Extract websites from people emails
      await this.extractWebsites();

      // Step 8: Export missing websites CSV
      await this.exportMissingWebsites();

      // Summary
      this.printSummary();

    } catch (error) {
      console.error('❌ Error:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  async getWorkspace() {
    console.log('\n🏢 Getting workspace...');
    this.workspace = await prisma.workspaces.findUnique({
      where: { slug: WORKSPACE_SLUG }
    });

    if (!this.workspace) {
      throw new Error(`Workspace "${WORKSPACE_SLUG}" not found`);
    }

    console.log(`✅ Found workspace: ${this.workspace.name} (${this.workspace.id})\n`);
  }

  async removeTopCompany() {
    console.log('🗑️  Removing TOP company and associated people...\n');

    try {
      // Find TOP company
      const topCompany = await prisma.companies.findFirst({
        where: {
          workspaceId: this.workspace.id,
          name: {
            equals: 'TOP',
            mode: 'insensitive'
          },
          deletedAt: null
        }
      });

      if (topCompany) {
        // Find all people associated with TOP company
        const associatedPeople = await prisma.people.findMany({
          where: {
            workspaceId: this.workspace.id,
            companyId: topCompany.id,
            deletedAt: null
          },
          select: { id: true, fullName: true }
        });

        console.log(`   Found TOP company with ${associatedPeople.length} associated people`);

        // Soft delete associated people
        if (associatedPeople.length > 0) {
          await prisma.people.updateMany({
            where: {
              id: { in: associatedPeople.map(p => p.id) }
            },
            data: {
              deletedAt: new Date(),
              updatedAt: new Date()
            }
          });
          console.log(`   ✅ Soft deleted ${associatedPeople.length} people associated with TOP`);
        }

        // Soft delete TOP company
        await prisma.companies.update({
          where: { id: topCompany.id },
          data: {
            deletedAt: new Date(),
            updatedAt: new Date()
          }
        });
        console.log(`   ✅ Soft deleted TOP company\n`);
      } else {
        console.log(`   ℹ️  TOP company not found (may already be deleted)\n`);
      }
    } catch (error) {
      console.error(`   ❌ Error removing TOP company:`, error.message);
      this.stats.errors++;
    }
  }

  async createTempUsers() {
    console.log('👥 Creating temp users...\n');

    const hashedPassword = await bcrypt.hash(TEMP_USER_PASSWORD, 12);
    const now = new Date();

    for (const userConfig of TEMP_USERS) {
      try {
        // Check if user exists
        let user = await prisma.users.findUnique({
          where: { email: userConfig.email },
          select: {
            id: true,
            email: true,
            username: true,
            name: true
          }
        });

        if (!user) {
          // Create user using raw SQL
          const userId = ulid();
          const nameParts = userConfig.name.split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';

          const result = await prisma.$queryRaw`
            INSERT INTO users (
              id, email, password, username, name, "firstName", "lastName", 
              timezone, "isActive", "activeWorkspaceId", "createdAt", "updatedAt"
            )
            VALUES (
              ${userId}, ${userConfig.email}, ${hashedPassword}, ${userConfig.username}, 
              ${userConfig.name}, ${firstName}, ${lastName},
              'UTC', true, ${this.workspace.id}, ${now}, ${now}
            )
            RETURNING id, email, username, name
          `;

          if (result && result.length > 0) {
            user = {
              id: result[0].id,
              email: result[0].email,
              username: result[0].username,
              name: result[0].name
            };
            console.log(`   ✅ Created user: ${user.name} (${user.email})`);
          } else {
            throw new Error('Failed to create user - no result returned');
          }
        } else {
          // Update password if user exists using raw SQL
          await prisma.$executeRaw`
            UPDATE users
            SET password = ${hashedPassword}, "updatedAt" = ${new Date()}
            WHERE id = ${user.id}
          `;
          console.log(`   ✅ User exists: ${user.name} (${user.email}) - password updated`);
        }

        // Ensure workspace membership
        const membership = await prisma.workspace_users.findFirst({
          where: {
            workspaceId: this.workspace.id,
            userId: user.id
          }
        });

        if (!membership) {
          await prisma.workspace_users.create({
            data: {
              workspaceId: this.workspace.id,
              userId: user.id,
              role: 'SELLER',
              isActive: true,
              joinedAt: new Date(),
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
          console.log(`   ✅ Added ${user.name} to workspace`);
        }

        // Map Main_Seller name to user ID
        this.sellerMap.set(userConfig.name, user.id);

      } catch (error) {
        console.error(`   ❌ Error creating user ${userConfig.name}:`, error.message);
        this.stats.errors++;
      }
    }

    // Map empty Main_Seller to Victoria Leland
    this.sellerMap.set('', this.sellerMap.get('Victoria Leland'));
    this.sellerMap.set(null, this.sellerMap.get('Victoria Leland'));

    console.log(`\n✅ Temp users ready (${this.sellerMap.size - 2} users + default)\n`);
  }

  async parseCSV() {
    console.log('📄 Parsing CSV file...\n');

    if (!fs.existsSync(CSV_FILE)) {
      throw new Error(`CSV file not found: ${CSV_FILE}`);
    }

    const rows = [];

    return new Promise((resolve, reject) => {
      fs.createReadStream(CSV_FILE)
        .pipe(csv())
        .on('data', (row) => {
          rows.push(row);
        })
        .on('end', () => {
          console.log(`✅ Parsed ${rows.length} rows from CSV\n`);
          resolve(rows);
        })
        .on('error', reject);
    });
  }

  parseTags(tagsString) {
    if (!tagsString || tagsString.trim() === '') {
      return [];
    }

    // Handle comma-separated tags, remove quotes, trim whitespace
    return tagsString
      .split(',')
      .map(tag => tag.replace(/^["']|["']$/g, '').trim())
      .filter(tag => tag.length > 0);
  }

  parseDate(dateString) {
    if (!dateString || dateString.trim() === '') {
      return null;
    }

    // Parse MM/DD/YYYY format
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const month = parseInt(parts[0], 10) - 1;
      const day = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }

    return null;
  }

  extractWebsiteFromEmail(email) {
    if (!email || !email.includes('@')) {
      return null;
    }

    const domain = email.split('@')[1];
    if (domain) {
      return `https://${domain}`;
    }

    return null;
  }

  async validateSeparation(rows) {
    console.log('🔍 Validating data separation (companies vs people)...\n');

    let companyCount = 0;
    let peopleCount = 0;
    let ambiguousCount = 0;
    const ambiguousRows = [];

    for (const row of rows) {
      const name = (row.Name || '').trim();
      const company = (row.Company || '').trim();
      const email = (row.Email || '').trim();
      const isTop = name.toLowerCase() === 'top' || company.toLowerCase() === 'top';

      if (isTop) {
        continue; // Skip TOP
      }

      // Company: Name == Company AND Email is empty
      const isCompany = name === company && (!email || email === '');
      
      // Person: Name != Company AND Email is present
      const isPerson = name !== company && email !== '' && email;
      
      // Ambiguous: Name == Company BUT has email (should be person)
      const isAmbiguous = name === company && email !== '' && email;

      if (isCompany) {
        companyCount++;
      } else if (isPerson) {
        peopleCount++;
      } else if (isAmbiguous) {
        ambiguousCount++;
        ambiguousRows.push({ name, company, email });
      } else {
        // Edge case: Name != Company but no email - might be invalid data
        ambiguousCount++;
        ambiguousRows.push({ name, company, email: '(empty)' });
      }
    }

    console.log(`   Companies identified: ${companyCount}`);
    console.log(`   People identified: ${peopleCount}`);
    console.log(`   Ambiguous/edge cases: ${ambiguousCount}`);

    if (ambiguousRows.length > 0 && ambiguousRows.length <= 10) {
      console.log(`\n   Ambiguous rows (will be handled as people if they have email):`);
      ambiguousRows.slice(0, 10).forEach((row, idx) => {
        console.log(`     ${idx + 1}. Name: "${row.name}", Company: "${row.company}", Email: "${row.email}"`);
      });
      if (ambiguousRows.length > 10) {
        console.log(`     ... and ${ambiguousRows.length - 10} more`);
      }
    }

    console.log(`\n✅ Separation validation complete\n`);
  }

  parseName(fullName) {
    if (!fullName || fullName.trim() === '') {
      return { firstName: '', lastName: '' };
    }

    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: '' };
    }

    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(' ')
    };
  }

  async processCompanies(rows) {
    console.log('🏢 Processing companies...\n');

    // Filter company rows (Name == Company and Email is empty)
    // Exclude "TOP" company
    // CRITICAL: Ensure Name === Company AND Email is empty to avoid misclassification
    const companyRows = rows.filter(row => {
      const name = (row.Name || '').trim();
      const company = (row.Company || '').trim();
      const email = (row.Email || '').trim();
      
      // Company criteria: Name equals Company AND Email is empty/blank
      const isCompany = name === company && (email === '' || !email);
      const isNotTop = name.toLowerCase() !== 'top' && company.toLowerCase() !== 'top';
      
      // Additional validation: if Name == Company but has email, skip (should be handled separately)
      if (name === company && email !== '' && email) {
        console.log(`   ⚠️  Skipping row with Name==Company but has email (${email}): ${name}`);
        return false;
      }
      
      return isCompany && isNotTop;
    });

    console.log(`   Found ${companyRows.length} company rows (excluding TOP)\n`);

    // Track processed company names to avoid duplicates in this batch
    const processedCompanyNames = new Set();

    for (const row of companyRows) {
      try {
        const companyName = (row.Name || row.Company || '').trim();
        if (!companyName) {
          continue;
        }

        // Validate this is actually a company row
        const nameValue = (row.Name || '').trim();
        const companyValue = (row.Company || '').trim();
        const emailValue = (row.Email || '').trim();
        
        if (nameValue !== companyValue) {
          console.log(`   ⚠️  Skipping invalid company row: Name="${nameValue}" != Company="${companyValue}"`);
          continue;
        }
        
        if (emailValue && emailValue.trim() !== '') {
          console.log(`   ⚠️  Skipping invalid company row: Has email "${emailValue}"`);
          continue;
        }

        // Skip if we've already processed this company name in this batch
        const normalizedName = companyName.toLowerCase();
        if (processedCompanyNames.has(normalizedName)) {
          console.log(`   ⏭️  Skipping duplicate in CSV: ${companyName}`);
          continue;
        }
        processedCompanyNames.add(normalizedName);

        // Check if company already exists in database
        let company = await prisma.companies.findFirst({
          where: {
            workspaceId: this.workspace.id,
            name: {
              equals: companyName,
              mode: 'insensitive'
            },
            deletedAt: null
          }
        });

        const tags = this.parseTags(row.Tags || '');
        const mainSeller = (row.Main_Seller || '').trim() || '';
        const sellerId = this.sellerMap.get(mainSeller) || this.sellerMap.get('Victoria Leland');

        const companyData = {
          name: companyName,
          address: (row.Street || '').trim() || null,
          city: (row.City || '').trim() || null,
          state: (row.State || '').trim() || null,
          postalCode: (row.Zipcode || '').trim() || null,
          country: (row['Mailing Country'] || '').trim() || null,
          tags: tags,
          mainSellerId: sellerId,
          workspaceId: this.workspace.id,
          status: 'LEAD', // Default to LEAD for newly uploaded companies
          notes: (row.Notes || '').trim() || null,
          lastActionDate: this.parseDate(row.Last_Action)
        };

        if (company) {
          // Update existing company
          await prisma.companies.update({
            where: { id: company.id },
            data: {
              ...companyData,
              updatedAt: new Date()
            }
          });
          this.stats.companiesUpdated++;
          console.log(`   🔄 Updated: ${companyName}`);
        } else {
          // Create new company - double check for duplicates before creating
          const duplicateCheck = await prisma.companies.findFirst({
            where: {
              workspaceId: this.workspace.id,
              name: {
                equals: companyName,
                mode: 'insensitive'
              },
              deletedAt: null
            }
          });

          if (duplicateCheck) {
            console.log(`   ⚠️  Duplicate detected, skipping: ${companyName}`);
            this.companyMap.set(companyName.toLowerCase(), duplicateCheck.id);
            continue;
          }

          company = await prisma.companies.create({
            data: companyData
          });
          this.stats.companiesCreated++;
          console.log(`   ✅ Created: ${companyName}`);
        }

        // Store in map for people association
        this.companyMap.set(companyName.toLowerCase(), company.id);

        // Track if website is missing
        if (!company.website) {
          this.missingWebsites.push({
            name: companyName,
            website: null
          });
        }

      } catch (error) {
        console.error(`   ❌ Error processing company ${row.Name}:`, error.message);
        this.stats.errors++;
      }
    }

    console.log(`\n✅ Companies processed: ${this.stats.companiesCreated} created, ${this.stats.companiesUpdated} updated\n`);
  }

  async processPeople(rows) {
    console.log('👤 Processing people...\n');

    // Filter people rows (Name != Company and Email is present)
    // Exclude people associated with "TOP" company
    // CRITICAL: Ensure Name !== Company AND Email is present to avoid misclassification
    const peopleRows = rows.filter(row => {
      const name = (row.Name || '').trim();
      const company = (row.Company || '').trim();
      const email = (row.Email || '').trim();
      
      // Person criteria: Name does NOT equal Company AND Email is present
      const isPerson = name !== company && email !== '' && email;
      const isNotTopCompany = company.toLowerCase() !== 'top';
      
      // Additional validation: if Name == Company but has email, this might be a company contact
      // We'll treat it as a person associated with that company
      if (name === company && email !== '' && email) {
        console.log(`   ⚠️  Row with Name==Company but has email - treating as person: ${name} (${email})`);
        return isNotTopCompany; // Still process as person if not TOP
      }
      
      return isPerson && isNotTopCompany;
    });

    console.log(`   Found ${peopleRows.length} people rows (excluding TOP company)\n`);

    // Track processed emails to avoid duplicates in this batch
    const processedEmails = new Set();

    for (const row of peopleRows) {
      try {
        const fullName = (row.Name || '').trim();
        const companyName = (row.Company || '').trim();
        const email = (row.Email || '').trim().toLowerCase();

        if (!fullName || !email) {
          console.log(`   ⚠️  Skipping invalid person row: Missing name or email`);
          continue;
        }

        // Validate this is actually a person row
        const nameValue = (row.Name || '').trim();
        const companyValue = (row.Company || '').trim();
        const emailRaw = (row.Email || '').trim();
        
        // If Name == Company and no email, this should have been filtered out
        if (nameValue === companyValue && (!emailRaw || emailRaw === '')) {
          console.log(`   ⚠️  Skipping invalid person row: Name==Company and no email: ${nameValue}`);
          continue;
        }

        // Skip if we've already processed this email in this batch
        if (processedEmails.has(email)) {
          console.log(`   ⏭️  Skipping duplicate email in CSV: ${email}`);
          continue;
        }
        processedEmails.add(email);

        const { firstName, lastName } = this.parseName(fullName);
        const tags = this.parseTags(row.Tags || '');
        const mainSeller = (row.Main_Seller || '').trim() || '';
        const sellerId = this.sellerMap.get(mainSeller) || this.sellerMap.get('Victoria Leland');

        // Find company ID
        let companyId = null;
        if (companyName) {
          companyId = this.companyMap.get(companyName.toLowerCase());
        }

        // Parse phone numbers
        const phoneNumber = (row.Phone_Number || '').trim() || null;
        const workPhone = (row.Work_Phone || '').trim() || null;
        const mobilePhone = (row.Mobile_Phone || '').trim() || null;

        // Parse dates
        const createdAt = this.parseDate(row.Created);
        const lastActionDate = this.parseDate(row.Last_Action);

        // Check if person already exists (by email) - case insensitive
        let person = await prisma.people.findFirst({
          where: {
            workspaceId: this.workspace.id,
            email: {
              equals: email,
              mode: 'insensitive'
            },
            deletedAt: null
          }
        });

        const personData = {
          workspaceId: this.workspace.id,
          companyId: companyId,
          firstName: firstName,
          lastName: lastName,
          fullName: fullName,
          email: email,
          workEmail: email, // Assume work email if not specified
          jobTitle: (row.Title || '').trim() || null,
          phone: phoneNumber,
          workPhone: workPhone,
          mobilePhone: mobilePhone,
          address: (row.Street || '').trim() || null,
          city: (row.City || '').trim() || null,
          state: (row.State || '').trim() || null,
          postalCode: (row.Zipcode || '').trim() || null,
          country: (row['Mailing Country'] || '').trim() || null,
          tags: tags,
          mainSellerId: sellerId,
          status: 'LEAD', // Default to LEAD for newly uploaded people
          notes: (row.Notes || '').trim() || null,
          createdAt: createdAt || new Date(),
          lastActionDate: lastActionDate
        };

        if (person) {
          // Update existing person
          await prisma.people.update({
            where: { id: person.id },
            data: {
              ...personData,
              updatedAt: new Date()
            }
          });
          this.stats.peopleUpdated++;
          console.log(`   🔄 Updated: ${fullName} (${email})`);
        } else {
          // Create new person - double check for duplicates before creating
          const duplicateCheck = await prisma.people.findFirst({
            where: {
              workspaceId: this.workspace.id,
              email: {
                equals: email,
                mode: 'insensitive'
              },
              deletedAt: null
            }
          });

          if (duplicateCheck) {
            console.log(`   ⚠️  Duplicate detected, skipping: ${fullName} (${email})`);
            continue;
          }

          person = await prisma.people.create({
            data: personData
          });
          this.stats.peopleCreated++;
          console.log(`   ✅ Created: ${fullName} (${email})`);
        }

        // Extract website from email for company
        if (companyId && email) {
          const website = this.extractWebsiteFromEmail(email);
          if (website) {
            // Update company website if empty
            const company = await prisma.companies.findUnique({
              where: { id: companyId },
              select: { website: true, name: true }
            });

            if (company && !company.website) {
              await prisma.companies.update({
                where: { id: companyId },
                data: {
                  website: website,
                  updatedAt: new Date()
                }
              });
              this.stats.websitesExtracted++;

              // Remove from missing websites list
              const index = this.missingWebsites.findIndex(c => c.name === company.name);
              if (index !== -1) {
                this.missingWebsites.splice(index, 1);
              }
            }
          }
        }

      } catch (error) {
        console.error(`   ❌ Error processing person ${row.Name}:`, error.message);
        this.stats.errors++;
      }
    }

    console.log(`\n✅ People processed: ${this.stats.peopleCreated} created, ${this.stats.peopleUpdated} updated\n`);
  }

  async extractWebsites() {
    console.log('🌐 Extracting websites from people emails...\n');
    console.log(`   Extracted ${this.stats.websitesExtracted} websites from people emails\n`);
  }

  async exportMissingWebsites() {
    console.log('📄 Exporting missing websites CSV...\n');

    // Get all companies without websites
    const companiesWithoutWebsites = await prisma.companies.findMany({
      where: {
        workspaceId: this.workspace.id,
        website: null,
        deletedAt: null
      },
      select: {
        name: true,
        website: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Ensure output directory exists
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const csvPath = path.join(outputDir, 'missing-websites-top-temp.csv');
    const csvLines = ['Company Name,Website'];

    for (const company of companiesWithoutWebsites) {
      csvLines.push(`"${company.name.replace(/"/g, '""')}",`);
    }

    fs.writeFileSync(csvPath, csvLines.join('\n'), 'utf8');
    console.log(`   ✅ Exported ${companiesWithoutWebsites.length} companies to ${csvPath}\n`);
  }

  printSummary() {
    console.log('=' .repeat(60));
    console.log('📊 UPLOAD SUMMARY');
    console.log('=' .repeat(60));
    console.log(`Workspace: ${this.workspace.name} (${this.workspace.slug})`);
    console.log(`Companies created: ${this.stats.companiesCreated}`);
    console.log(`Companies updated: ${this.stats.companiesUpdated}`);
    console.log(`People created: ${this.stats.peopleCreated}`);
    console.log(`People updated: ${this.stats.peopleUpdated}`);
    console.log(`Websites extracted: ${this.stats.websitesExtracted}`);
    console.log(`Errors: ${this.stats.errors}`);
    console.log('=' .repeat(60));
    console.log('✅ Upload complete!\n');
  }
}

// Run the upload
async function main() {
  const uploader = new TopTempDataUploader();
  await uploader.execute();
}

if (require.main === module) {
  main()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = TopTempDataUploader;

