-- Add username field to users table
-- This allows users to log in with either email or username

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "username" VARCHAR(50);

-- Create unique index on username field
CREATE UNIQUE INDEX IF NOT EXISTS "users_username_key" ON "users"("username");

-- Add index for faster username lookups
CREATE INDEX IF NOT EXISTS "idx_users_username" ON "users"("username");
