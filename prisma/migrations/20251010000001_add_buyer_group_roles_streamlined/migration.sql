-- CreateEnum
CREATE TYPE "BuyerGroupRole" AS ENUM ('decision', 'champion', 'stakeholder', 'blocker', 'introducer');

-- AlterTable
ALTER TABLE "people" ADD COLUMN "buyerGroupRole" "BuyerGroupRole";
ALTER TABLE "people" ADD COLUMN "buyerGroupConfidence" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "people" ADD COLUMN "influenceScore" DOUBLE PRECISION DEFAULT 0;

-- CreateIndex
CREATE INDEX "people_workspaceId_buyerGroupRole_idx" ON "people"("workspaceId", "buyerGroupRole");
