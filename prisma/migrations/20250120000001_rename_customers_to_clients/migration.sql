-- Rename customers table to clients
ALTER TABLE "customers" RENAME TO "clients";

-- Rename customer_accounts table to client_accounts
ALTER TABLE "customer_accounts" RENAME TO "client_accounts";

-- Rename customer_users table to client_users
ALTER TABLE "customer_users" RENAME TO "client_users";

-- Rename columns in clients table
ALTER TABLE "clients" RENAME COLUMN "customerSince" TO "clientSince";
ALTER TABLE "clients" RENAME COLUMN "customerStatus" TO "clientStatus";
ALTER TABLE "clients" RENAME COLUMN "customerType" TO "clientType";

-- Rename column in client_users table
ALTER TABLE "client_users" RENAME COLUMN "customerAccountId" TO "clientAccountId";

-- Update indexes
DROP INDEX IF EXISTS "customers_workspace_since_idx";
CREATE INDEX IF NOT EXISTS "clients_workspace_since_idx" 
ON "clients" ("workspaceId", "clientSince" DESC);

-- Update any foreign key constraints if they exist
-- (These would need to be updated if there are references to the old table names)
