-- Add read tracking fields to ChronicleReport table
ALTER TABLE "ChronicleReport" ADD COLUMN "lastReadAt" TIMESTAMP(3);
ALTER TABLE "ChronicleReport" ADD COLUMN "lastReadBy" TEXT;
