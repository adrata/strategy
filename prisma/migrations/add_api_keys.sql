-- Migration: Add API Keys table
-- Run this SQL manually in production if Prisma migrations fail

CREATE TABLE IF NOT EXISTS "api_keys" (
    "id" VARCHAR(30) NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "userId" VARCHAR(30) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "keyPrefix" VARCHAR(50) NOT NULL,
    "hashedKey" VARCHAR(255) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "api_keys_workspaceId_idx" ON "api_keys"("workspaceId");
CREATE INDEX IF NOT EXISTS "api_keys_userId_idx" ON "api_keys"("userId");
CREATE INDEX IF NOT EXISTS "api_keys_keyPrefix_idx" ON "api_keys"("keyPrefix");
CREATE INDEX IF NOT EXISTS "api_keys_isActive_idx" ON "api_keys"("isActive");
CREATE INDEX IF NOT EXISTS "api_keys_expiresAt_idx" ON "api_keys"("expiresAt");

ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

