-- Increase column sizes for buyer group discovery
-- Fix potential length issues with various fields

-- Increase buyer group related fields
ALTER TABLE "contacts" ALTER COLUMN "buyerGroupRole" TYPE VARCHAR(100);
ALTER TABLE "contacts" ALTER COLUMN "decisionMakingPower" TYPE VARCHAR(100);
ALTER TABLE "contacts" ALTER COLUMN "efficiencyFocus" TYPE VARCHAR(50);
ALTER TABLE "contacts" ALTER COLUMN "seniority" TYPE VARCHAR(50);
ALTER TABLE "contacts" ALTER COLUMN "discoverySource" TYPE VARCHAR(100);

-- Increase ID fields to handle longer external IDs
ALTER TABLE "contacts" ALTER COLUMN "coresignalEmployeeId" TYPE VARCHAR(100);
ALTER TABLE "contacts" ALTER COLUMN "coresignalCompanyId" TYPE VARCHAR(100);

-- Increase other potentially problematic fields
ALTER TABLE "contacts" ALTER COLUMN "department" TYPE VARCHAR(200);
ALTER TABLE "contacts" ALTER COLUMN "vertical" TYPE VARCHAR(100);
ALTER TABLE "contacts" ALTER COLUMN "communicationStyle" TYPE VARCHAR(100);
ALTER TABLE "contacts" ALTER COLUMN "decisionMakingStyle" TYPE VARCHAR(100);

-- Make sure core name fields are adequate
ALTER TABLE "contacts" ALTER COLUMN "firstName" TYPE VARCHAR(100);
ALTER TABLE "contacts" ALTER COLUMN "lastName" TYPE VARCHAR(100);
ALTER TABLE "contacts" ALTER COLUMN "middleName" TYPE VARCHAR(100);
ALTER TABLE "contacts" ALTER COLUMN "fullName" TYPE VARCHAR(200);
ALTER TABLE "contacts" ALTER COLUMN "displayName" TYPE VARCHAR(200);

-- Job title and other professional fields
ALTER TABLE "contacts" ALTER COLUMN "jobTitle" TYPE VARCHAR(300);
ALTER TABLE "contacts" ALTER COLUMN "salutation" TYPE VARCHAR(50);
ALTER TABLE "contacts" ALTER COLUMN "suffix" TYPE VARCHAR(50);

-- Contact information fields
ALTER TABLE "contacts" ALTER COLUMN "email" TYPE VARCHAR(300);
ALTER TABLE "contacts" ALTER COLUMN "workEmail" TYPE VARCHAR(300);
ALTER TABLE "contacts" ALTER COLUMN "personalEmail" TYPE VARCHAR(300);
ALTER TABLE "contacts" ALTER COLUMN "secondaryEmail" TYPE VARCHAR(300);

-- LinkedIn and social URLs can be long
ALTER TABLE "contacts" ALTER COLUMN "linkedinUrl" TYPE VARCHAR(500);
ALTER TABLE "contacts" ALTER COLUMN "twitterHandle" TYPE VARCHAR(100);

-- Address fields
ALTER TABLE "contacts" ALTER COLUMN "address" TYPE VARCHAR(500);
ALTER TABLE "contacts" ALTER COLUMN "city" TYPE VARCHAR(100);
ALTER TABLE "contacts" ALTER COLUMN "state" TYPE VARCHAR(100);
ALTER TABLE "contacts" ALTER COLUMN "country" TYPE VARCHAR(100);
ALTER TABLE "contacts" ALTER COLUMN "postalCode" TYPE VARCHAR(50);

-- Notes and bio can be long
ALTER TABLE "contacts" ALTER COLUMN "notes" TYPE TEXT;
ALTER TABLE "contacts" ALTER COLUMN "bio" TYPE TEXT;

-- External IDs
ALTER TABLE "contacts" ALTER COLUMN "externalId" TYPE VARCHAR(200);
ALTER TABLE "contacts" ALTER COLUMN "zohoId" TYPE VARCHAR(100);
ALTER TABLE "contacts" ALTER COLUMN "personId" TYPE VARCHAR(100);
