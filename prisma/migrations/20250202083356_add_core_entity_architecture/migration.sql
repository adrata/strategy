-- CreateTable: core_companies
CREATE TABLE IF NOT EXISTS "core_companies" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "normalizedName" VARCHAR(255) NOT NULL,
    "legalName" VARCHAR(255),
    "tradingName" VARCHAR(255),
    "website" VARCHAR(500),
    "domain" VARCHAR(255),
    "industry" VARCHAR(100),
    "sector" VARCHAR(100),
    "size" VARCHAR(100),
    "employeeCount" INTEGER,
    "foundedYear" INTEGER,
    "description" TEXT,
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "country" VARCHAR(100),
    "hqCity" VARCHAR(100),
    "hqState" VARCHAR(100),
    "hqCountryIso2" VARCHAR(2),
    "hqCountryIso3" VARCHAR(3),
    "linkedinUrl" VARCHAR(500),
    "linkedinFollowers" INTEGER,
    "revenue" DECIMAL(15,2),
    "currency" VARCHAR(3) DEFAULT 'USD',
    "stockSymbol" VARCHAR(20),
    "logoUrl" VARCHAR(500),
    "lastVerified" TIMESTAMP(3),
    "dataLastVerified" TIMESTAMP(3),
    "dataQualityScore" DOUBLE PRECISION DEFAULT 0,
    "dataSources" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "core_companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable: core_people
CREATE TABLE IF NOT EXISTS "core_people" (
    "id" VARCHAR(30) NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "fullName" VARCHAR(200) NOT NULL,
    "normalizedFullName" VARCHAR(200) NOT NULL,
    "email" VARCHAR(300),
    "workEmail" VARCHAR(300),
    "personalEmail" VARCHAR(300),
    "linkedinUrl" VARCHAR(500),
    "jobTitle" VARCHAR(300),
    "department" VARCHAR(200),
    "companyName" VARCHAR(200),
    "currentCompany" VARCHAR(200),
    "currentRole" VARCHAR(200),
    "phone" VARCHAR(50),
    "mobilePhone" VARCHAR(50),
    "workPhone" VARCHAR(50),
    "linkedinConnections" INTEGER,
    "linkedinFollowers" INTEGER,
    "profilePictureUrl" VARCHAR(500),
    "bio" TEXT,
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "country" VARCHAR(100),
    "lastVerified" TIMESTAMP(3),
    "dataLastVerified" TIMESTAMP(3),
    "dataQualityScore" DOUBLE PRECISION DEFAULT 0,
    "dataSources" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "core_people_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: core_companies_name_unique
CREATE UNIQUE INDEX IF NOT EXISTS "core_companies_name_key" ON "core_companies"("name");

-- CreateIndex: core_companies_normalizedName_unique
CREATE UNIQUE INDEX IF NOT EXISTS "core_companies_normalizedName_key" ON "core_companies"("normalizedName");

-- CreateIndex: core_companies_normalizedName
CREATE INDEX IF NOT EXISTS "core_companies_normalizedName_idx" ON "core_companies"("normalizedName");

-- CreateIndex: core_companies_domain
CREATE INDEX IF NOT EXISTS "core_companies_domain_idx" ON "core_companies"("domain");

-- CreateIndex: core_companies_lastVerified
CREATE INDEX IF NOT EXISTS "core_companies_lastVerified_idx" ON "core_companies"("lastVerified");

-- CreateIndex: core_companies_dataLastVerified
CREATE INDEX IF NOT EXISTS "core_companies_dataLastVerified_idx" ON "core_companies"("dataLastVerified");

-- CreateIndex: core_people_normalizedFullName_unique
CREATE UNIQUE INDEX IF NOT EXISTS "core_people_normalizedFullName_key" ON "core_people"("normalizedFullName");

-- CreateIndex: core_people_email_unique (partial index for nullable)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'core_people_email_key') THEN
        CREATE UNIQUE INDEX "core_people_email_key" ON "core_people"("email") WHERE "email" IS NOT NULL;
    END IF;
END $$;

-- CreateIndex: core_people_workEmail_unique (partial index for nullable)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'core_people_workEmail_key') THEN
        CREATE UNIQUE INDEX "core_people_workEmail_key" ON "core_people"("workEmail") WHERE "workEmail" IS NOT NULL;
    END IF;
END $$;

-- CreateIndex: core_people_personalEmail_unique (partial index for nullable)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'core_people_personalEmail_key') THEN
        CREATE UNIQUE INDEX "core_people_personalEmail_key" ON "core_people"("personalEmail") WHERE "personalEmail" IS NOT NULL;
    END IF;
END $$;

-- CreateIndex: core_people_linkedinUrl_unique (partial index for nullable)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'core_people_linkedinUrl_key') THEN
        CREATE UNIQUE INDEX "core_people_linkedinUrl_key" ON "core_people"("linkedinUrl") WHERE "linkedinUrl" IS NOT NULL;
    END IF;
END $$;

-- CreateIndex: core_people_normalizedFullName
CREATE INDEX IF NOT EXISTS "core_people_normalizedFullName_idx" ON "core_people"("normalizedFullName");

-- CreateIndex: core_people_email
CREATE INDEX IF NOT EXISTS "core_people_email_idx" ON "core_people"("email");

-- CreateIndex: core_people_workEmail
CREATE INDEX IF NOT EXISTS "core_people_workEmail_idx" ON "core_people"("workEmail");

-- CreateIndex: core_people_personalEmail
CREATE INDEX IF NOT EXISTS "core_people_personalEmail_idx" ON "core_people"("personalEmail");

-- CreateIndex: core_people_linkedinUrl
CREATE INDEX IF NOT EXISTS "core_people_linkedinUrl_idx" ON "core_people"("linkedinUrl");

-- CreateIndex: core_people_lastVerified
CREATE INDEX IF NOT EXISTS "core_people_lastVerified_idx" ON "core_people"("lastVerified");

-- CreateIndex: core_people_dataLastVerified
CREATE INDEX IF NOT EXISTS "core_people_dataLastVerified_idx" ON "core_people"("dataLastVerified");

-- AlterTable: companies - Add core entity linking fields
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "coreCompanyId" VARCHAR(30);
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "nameOverride" VARCHAR(255);
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "industryOverride" VARCHAR(100);
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "websiteOverride" VARCHAR(500);

-- AlterTable: people - Add core entity linking fields
ALTER TABLE "people" ADD COLUMN IF NOT EXISTS "corePersonId" VARCHAR(30);
ALTER TABLE "people" ADD COLUMN IF NOT EXISTS "fullNameOverride" VARCHAR(200);
ALTER TABLE "people" ADD COLUMN IF NOT EXISTS "emailOverride" VARCHAR(300);
ALTER TABLE "people" ADD COLUMN IF NOT EXISTS "jobTitleOverride" VARCHAR(300);

-- CreateIndex: companies_coreCompanyId
CREATE INDEX IF NOT EXISTS "companies_coreCompanyId_idx" ON "companies"("coreCompanyId");

-- CreateIndex: people_corePersonId
CREATE INDEX IF NOT EXISTS "people_corePersonId_idx" ON "people"("corePersonId");

-- AddForeignKey: companies_coreCompanyId -> core_companies_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'companies_coreCompanyId_fkey'
    ) THEN
        ALTER TABLE "companies" ADD CONSTRAINT "companies_coreCompanyId_fkey" 
        FOREIGN KEY ("coreCompanyId") REFERENCES "core_companies"("id") 
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey: people_corePersonId -> core_people_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'people_corePersonId_fkey'
    ) THEN
        ALTER TABLE "people" ADD CONSTRAINT "people_corePersonId_fkey" 
        FOREIGN KEY ("corePersonId") REFERENCES "core_people"("id") 
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

