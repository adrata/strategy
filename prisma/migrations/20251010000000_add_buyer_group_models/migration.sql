-- CreateEnum
CREATE TYPE "BuyerGroupRole" AS ENUM ('decision', 'champion', 'stakeholder', 'blocker', 'introducer');

-- CreateTable
CREATE TABLE "BuyerGroups" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "website" TEXT,
    "industry" TEXT,
    "companySize" TEXT,
    "workspaceId" TEXT,
    "cohesionScore" DECIMAL(5,2) DEFAULT 0,
    "overallConfidence" DECIMAL(5,2) DEFAULT 0,
    "totalMembers" INTEGER DEFAULT 0,
    "processingTime" INTEGER DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuyerGroups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuyerGroupMembers" (
    "id" TEXT NOT NULL,
    "buyerGroupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "role" "BuyerGroupRole" NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "linkedin" TEXT,
    "confidence" DECIMAL(5,2) DEFAULT 0,
    "influenceScore" DECIMAL(5,2) DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuyerGroupMembers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BuyerGroups_companyName_idx" ON "BuyerGroups"("companyName");

-- CreateIndex
CREATE INDEX "BuyerGroups_workspaceId_idx" ON "BuyerGroups"("workspaceId");

-- CreateIndex
CREATE INDEX "BuyerGroups_createdAt_idx" ON "BuyerGroups"("createdAt");

-- CreateIndex
CREATE INDEX "BuyerGroupMembers_buyerGroupId_idx" ON "BuyerGroupMembers"("buyerGroupId");

-- CreateIndex
CREATE INDEX "BuyerGroupMembers_role_idx" ON "BuyerGroupMembers"("role");

-- AddForeignKey
ALTER TABLE "BuyerGroupMembers" ADD CONSTRAINT "BuyerGroupMembers_buyerGroupId_fkey" FOREIGN KEY ("buyerGroupId") REFERENCES "BuyerGroups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
