const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Company data to upload
const companiesData = [
  {
    name: "Everee",
    city: "Salt Lake City",
    state: "UT",
    country: "United States",
    description: "Payroll and HR software solutions",
    industry: "Software",
    sector: "Technology"
  },
  {
    name: "Openprise",
    city: "Saratoga",
    state: "CA",
    country: "United States",
    description: "Revenue operations data automation",
    industry: "Software",
    sector: "Technology"
  },
  {
    name: "Arcoro",
    city: "Scottsdale",
    state: "AZ",
    country: "United States",
    description: "HR management software for construction",
    industry: "Software",
    sector: "Technology"
  },
  {
    name: "Coro Cybersecurity",
    city: "New York",
    state: "NY",
    country: "United States",
    description: "AI-based cybersecurity solutions",
    industry: "Cybersecurity",
    sector: "Technology"
  },
  {
    name: "Booksy",
    city: "San Francisco",
    state: "CA",
    country: "United States",
    description: "Appointment scheduling platform",
    industry: "Software",
    sector: "Technology"
  },
  {
    name: "Applied Software, GRAITEC Group",
    city: "Georgia",
    state: "GA",
    country: "United States",
    description: "AEC software solutions",
    industry: "Software",
    sector: "Technology"
  },
  {
    name: "Plixer",
    city: "Maine",
    state: "ME",
    country: "United States",
    description: "Network traffic analysis and security monitoring",
    industry: "Cybersecurity",
    sector: "Technology"
  },
  {
    name: "XMPro",
    city: "Texas",
    state: "TX",
    country: "United States",
    description: "Industrial IoT and real-time analytics",
    industry: "Software",
    sector: "Technology"
  },
  {
    name: "Wynne Systems",
    city: "California",
    state: "CA",
    country: "United States",
    description: "Equipment rental management software",
    industry: "Software",
    sector: "Technology"
  },
  {
    name: "Rev.io",
    city: "Georgia",
    state: "GA",
    country: "United States",
    description: "Billing software for telecom and IoT",
    industry: "Software",
    sector: "Technology"
  },
  {
    name: "Scivantage",
    city: "New Jersey",
    state: "NJ",
    country: "United States",
    description: "Financial technology for investment industry",
    industry: "Fintech",
    sector: "Financial Services"
  },
  {
    name: "ProMiles Software Development",
    city: "Texas",
    state: "TX",
    country: "United States",
    description: "Transportation software",
    industry: "Software",
    sector: "Technology"
  },
  {
    name: "Concord Technologies",
    city: "Washington",
    state: "WA",
    country: "United States",
    description: "Cloud fax and document management",
    industry: "Software",
    sector: "Technology"
  },
  {
    name: "Metafile Information Systems",
    city: "Minnesota",
    state: "MN",
    country: "United States",
    description: "Document management and workflow",
    industry: "Software",
    sector: "Technology"
  },
  {
    name: "Librestream",
    city: "Raleigh",
    state: "NC",
    country: "United States",
    description: "AR and AI for industrial workforce",
    industry: "Software",
    sector: "Technology"
  },
  {
    name: "SketchUp",
    city: "Colorado",
    state: "CO",
    country: "United States",
    description: "3D modeling software",
    industry: "Software",
    sector: "Technology"
  },
  {
    name: "Optitex",
    city: "New York",
    state: "NY",
    country: "United States",
    description: "CAD/CAM for fashion and apparel",
    industry: "Software",
    sector: "Technology"
  },
  {
    name: "Ocient",
    city: "Illinois",
    state: "IL",
    country: "United States",
    description: "Big data analytics software",
    industry: "Software",
    sector: "Technology"
  },
  {
    name: "FPX from Revalize",
    city: "Florida",
    state: "FL",
    country: "United States",
    description: "Configure-price-quote software",
    industry: "Software",
    sector: "Technology"
  },
  {
    name: "Lavastorm, an Infogix Company",
    city: "Massachusetts",
    state: "MA",
    country: "United States",
    description: "Data analytics automation",
    industry: "Software",
    sector: "Technology"
  },
  {
    name: "DealCloud, by Intapp",
    city: "New Jersey",
    state: "NJ",
    country: "United States",
    description: "Deal management for financial services",
    industry: "Software",
    sector: "Financial Services"
  }
];

async function uploadCompanies() {
  try {
    console.log('Starting company upload process...');

    // Get the Adrata workspace
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: { contains: 'adrata', mode: 'insensitive' } },
          { slug: { contains: 'adrata', mode: 'insensitive' } }
        ]
      },
      select: { id: true, name: true, slug: true }
    });

    if (!workspace) {
      throw new Error('Adrata workspace not found');
    }

    console.log(`Found workspace: ${workspace.name} (${workspace.slug}) - ID: ${workspace.id}`);

    // Get Dan's user ID
    const dan = await prisma.users.findFirst({
      where: {
        OR: [
          { name: { contains: 'dan', mode: 'insensitive' } },
          { email: { contains: 'dan', mode: 'insensitive' } }
        ]
      },
      select: { id: true, name: true, email: true }
    });

    if (!dan) {
      throw new Error('Dan user not found');
    }

    console.log(`Found user: ${dan.name} (${dan.email}) - ID: ${dan.id}`);

    // Upload companies
    const uploadedCompanies = [];
    
    for (const companyData of companiesData) {
      try {
        const company = await prisma.companies.create({
          data: {
            workspaceId: workspace.id,
            name: companyData.name,
            description: companyData.description,
            city: companyData.city,
            state: companyData.state,
            country: companyData.country,
            industry: companyData.industry,
            sector: companyData.sector,
            status: 'ACTIVE',
            priority: 'MEDIUM',
            mainSellerId: dan.id,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });

        uploadedCompanies.push(company);
        console.log(`✓ Uploaded: ${company.name}`);
      } catch (error) {
        console.error(`✗ Failed to upload ${companyData.name}:`, error.message);
      }
    }

    console.log(`\nUpload complete! Successfully uploaded ${uploadedCompanies.length} out of ${companiesData.length} companies.`);
    
    if (uploadedCompanies.length > 0) {
      console.log('\nUploaded companies:');
      uploadedCompanies.forEach(company => {
        console.log(`- ${company.name} (ID: ${company.id})`);
      });
    }

  } catch (error) {
    console.error('Error during upload:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the upload
uploadCompanies();
