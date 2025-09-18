-- Rename clients table back to customers
ALTER TABLE "clients" RENAME TO "customers";

-- Rename client_accounts table to customer_accounts
ALTER TABLE "client_accounts" RENAME TO "customer_accounts";

-- Rename client_users table to customer_users
ALTER TABLE "client_users" RENAME TO "customer_users";

-- Update the clientAccountId column in customer_users table
ALTER TABLE "customer_users" RENAME COLUMN "clientAccountId" TO "customerAccountId";
