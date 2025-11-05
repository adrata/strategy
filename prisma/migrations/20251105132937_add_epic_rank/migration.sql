-- AlterTable
ALTER TABLE "StacksEpic" ADD COLUMN IF NOT EXISTS "rank" INTEGER;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "StacksEpic_projectId_rank_idx" ON "StacksEpic"("projectId", "rank");

