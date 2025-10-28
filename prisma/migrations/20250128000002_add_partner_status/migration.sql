-- Add PARTNER to PersonStatus enum
-- This is a safe operation that only adds a new enum value without affecting existing data

ALTER TYPE "PersonStatus" ADD VALUE 'PARTNER';
