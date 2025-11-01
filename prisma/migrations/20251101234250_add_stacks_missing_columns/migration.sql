-- Add missing columns to Stacks tables to match schema-streamlined.prisma

-- Add viewType, product, and section columns to StacksStory (nullable, as defined in schema)
ALTER TABLE "StacksStory" ADD COLUMN IF NOT EXISTS "viewType" VARCHAR(20);
ALTER TABLE "StacksStory" ADD COLUMN IF NOT EXISTS "product" VARCHAR(50);
ALTER TABLE "StacksStory" ADD COLUMN IF NOT EXISTS "section" VARCHAR(50);

-- Add product and section columns to StacksTask (nullable, as defined in schema)
ALTER TABLE "StacksTask" ADD COLUMN IF NOT EXISTS "product" VARCHAR(50);
ALTER TABLE "StacksTask" ADD COLUMN IF NOT EXISTS "section" VARCHAR(50);

-- Add product and section columns to StacksEpic (nullable, as defined in schema)
ALTER TABLE "StacksEpic" ADD COLUMN IF NOT EXISTS "product" VARCHAR(50);
ALTER TABLE "StacksEpic" ADD COLUMN IF NOT EXISTS "section" VARCHAR(50);

