-- Add pipeline results table for TOP100 data storage
CREATE TABLE IF NOT EXISTS "PipelineResult" (
    "id" SERIAL PRIMARY KEY,
    "runId" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "companyName" TEXT,
    "accountOwner" TEXT,
    "industry" TEXT,
    "employeeCount" TEXT,
    "headquarters" TEXT,
    "isPublic" BOOLEAN DEFAULT false,
    "parentCompany" TEXT,
    "relationType" TEXT DEFAULT 'original',
    
    -- CFO data
    "cfoName" TEXT,
    "cfoTitle" TEXT,
    "cfoEmail" TEXT,
    "cfoPhone" TEXT,
    "cfoLinkedIn" TEXT,
    "cfoConfidence" INTEGER DEFAULT 0,
    "cfoTier" INTEGER,
    "cfoRole" TEXT,
    
    -- CRO data
    "croName" TEXT,
    "croTitle" TEXT,
    "croEmail" TEXT,
    "croPhone" TEXT,
    "croLinkedIn" TEXT,
    "croConfidence" INTEGER DEFAULT 0,
    "croTier" INTEGER,
    "croRole" TEXT,
    
    -- Metadata
    "processingTime" INTEGER,
    "totalCost" DECIMAL(10,4) DEFAULT 0,
    "batchId" TEXT,
    "processedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "PipelineResult_runId_idx" ON "PipelineResult"("runId");
CREATE INDEX IF NOT EXISTS "PipelineResult_website_idx" ON "PipelineResult"("website");
CREATE INDEX IF NOT EXISTS "PipelineResult_accountOwner_idx" ON "PipelineResult"("accountOwner");
CREATE INDEX IF NOT EXISTS "PipelineResult_processedAt_idx" ON "PipelineResult"("processedAt");

-- Add to Prisma schema
-- model PipelineResult {
--   id              Int      @id @default(autoincrement())
--   runId           String
--   website         String
--   companyName     String?
--   accountOwner    String?
--   industry        String?
--   employeeCount   String?
--   headquarters    String?
--   isPublic        Boolean  @default(false)
--   parentCompany   String?
--   relationType    String   @default("original")
--   
--   // CFO data
--   cfoName         String?
--   cfoTitle        String?
--   cfoEmail        String?
--   cfoPhone        String?
--   cfoLinkedIn     String?
--   cfoConfidence   Int      @default(0)
--   cfoTier         Int?
--   cfoRole         String?
--   
--   // CRO data
--   croName         String?
--   croTitle        String?
--   croEmail        String?
--   croPhone        String?
--   croLinkedIn     String?
--   croConfidence   Int      @default(0)
--   croTier         Int?
--   croRole         String?
--   
--   // Metadata
--   processingTime  Int?
--   totalCost       Decimal  @default(0) @db.Decimal(10,4)
--   batchId         String?
--   processedAt     DateTime @default(now())
--   createdAt       DateTime @default(now())
--   updatedAt       DateTime @updatedAt
--   
--   @@index([runId])
--   @@index([website])
--   @@index([accountOwner])
--   @@index([processedAt])
-- }
