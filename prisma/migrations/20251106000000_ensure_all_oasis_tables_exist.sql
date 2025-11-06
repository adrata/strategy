-- Comprehensive Oasis Tables Migration
-- This migration ensures all Oasis tables exist with proper structure, indexes, and foreign keys
-- Safe to run multiple times (uses IF NOT EXISTS)

-- 1. OasisChannel - Communication channels within workspaces
-- Matches streamlined schema (no createdById field)
CREATE TABLE IF NOT EXISTS "OasisChannel" (
    "id" TEXT NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OasisChannel_pkey" PRIMARY KEY ("id")
);

-- 2. OasisChannelMember - Members of channels
CREATE TABLE IF NOT EXISTS "OasisChannelMember" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "userId" VARCHAR(30) NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OasisChannelMember_pkey" PRIMARY KEY ("id")
);

-- 3. OasisDirectMessage - Direct message conversations
CREATE TABLE IF NOT EXISTS "OasisDirectMessage" (
    "id" TEXT NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OasisDirectMessage_pkey" PRIMARY KEY ("id")
);

-- 4. OasisDMParticipant - Participants in direct messages
CREATE TABLE IF NOT EXISTS "OasisDMParticipant" (
    "id" TEXT NOT NULL,
    "dmId" TEXT NOT NULL,
    "userId" VARCHAR(30) NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OasisDMParticipant_pkey" PRIMARY KEY ("id")
);

-- 5. OasisMessage - Messages in channels and DMs
CREATE TABLE IF NOT EXISTS "OasisMessage" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "channelId" TEXT,
    "dmId" TEXT,
    "senderId" VARCHAR(30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parentMessageId" TEXT,

    CONSTRAINT "OasisMessage_pkey" PRIMARY KEY ("id")
);

-- 6. OasisReaction - Emoji reactions to messages
CREATE TABLE IF NOT EXISTS "OasisReaction" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" VARCHAR(30) NOT NULL,
    "emoji" VARCHAR(10) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OasisReaction_pkey" PRIMARY KEY ("id")
);

-- 7. OasisReadReceipt - Track which messages users have read
CREATE TABLE IF NOT EXISTS "OasisReadReceipt" (
    "id" TEXT NOT NULL,
    "userId" VARCHAR(30) NOT NULL,
    "messageId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OasisReadReceipt_pkey" PRIMARY KEY ("id")
);

-- 8. OasisExternalConnection - External connections for Oasis
-- Matches streamlined schema structure
CREATE TABLE IF NOT EXISTS "OasisExternalConnection" (
    "id" TEXT NOT NULL,
    "userId" VARCHAR(30) NOT NULL,
    "externalUserId" VARCHAR(30) NOT NULL,
    "externalWorkspaceId" VARCHAR(30) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OasisExternalConnection_pkey" PRIMARY KEY ("id")
);

-- ===========================================
-- INDEXES
-- ===========================================

-- OasisChannel indexes
CREATE INDEX IF NOT EXISTS "OasisChannel_workspaceId_idx" ON "OasisChannel"("workspaceId");
CREATE INDEX IF NOT EXISTS "OasisChannel_workspaceId_name_idx" ON "OasisChannel"("workspaceId", "name");

-- OasisChannelMember indexes
CREATE UNIQUE INDEX IF NOT EXISTS "OasisChannelMember_channelId_userId_key" ON "OasisChannelMember"("channelId", "userId");
CREATE INDEX IF NOT EXISTS "OasisChannelMember_channelId_idx" ON "OasisChannelMember"("channelId");
CREATE INDEX IF NOT EXISTS "OasisChannelMember_userId_idx" ON "OasisChannelMember"("userId");

-- OasisDirectMessage indexes
CREATE INDEX IF NOT EXISTS "OasisDirectMessage_workspaceId_idx" ON "OasisDirectMessage"("workspaceId");

-- OasisDMParticipant indexes
CREATE UNIQUE INDEX IF NOT EXISTS "OasisDMParticipant_dmId_userId_key" ON "OasisDMParticipant"("dmId", "userId");
CREATE INDEX IF NOT EXISTS "OasisDMParticipant_dmId_idx" ON "OasisDMParticipant"("dmId");
CREATE INDEX IF NOT EXISTS "OasisDMParticipant_userId_idx" ON "OasisDMParticipant"("userId");

-- OasisMessage indexes
CREATE INDEX IF NOT EXISTS "OasisMessage_channelId_idx" ON "OasisMessage"("channelId");
CREATE INDEX IF NOT EXISTS "OasisMessage_dmId_idx" ON "OasisMessage"("dmId");
CREATE INDEX IF NOT EXISTS "OasisMessage_senderId_idx" ON "OasisMessage"("senderId");
CREATE INDEX IF NOT EXISTS "OasisMessage_createdAt_idx" ON "OasisMessage"("createdAt");
CREATE INDEX IF NOT EXISTS "OasisMessage_parentMessageId_idx" ON "OasisMessage"("parentMessageId");

-- OasisReaction indexes
CREATE UNIQUE INDEX IF NOT EXISTS "OasisReaction_messageId_userId_emoji_key" ON "OasisReaction"("messageId", "userId", "emoji");
CREATE INDEX IF NOT EXISTS "OasisReaction_messageId_idx" ON "OasisReaction"("messageId");
CREATE INDEX IF NOT EXISTS "OasisReaction_userId_idx" ON "OasisReaction"("userId");

-- OasisReadReceipt indexes
CREATE UNIQUE INDEX IF NOT EXISTS "OasisReadReceipt_userId_messageId_key" ON "OasisReadReceipt"("userId", "messageId");
CREATE INDEX IF NOT EXISTS "OasisReadReceipt_userId_idx" ON "OasisReadReceipt"("userId");
CREATE INDEX IF NOT EXISTS "OasisReadReceipt_messageId_idx" ON "OasisReadReceipt"("messageId");
CREATE INDEX IF NOT EXISTS "OasisReadReceipt_readAt_idx" ON "OasisReadReceipt"("readAt");

-- OasisExternalConnection indexes
CREATE UNIQUE INDEX IF NOT EXISTS "OasisExternalConnection_userId_externalUserId_externalWorkspaceId_key" ON "OasisExternalConnection"("userId", "externalUserId", "externalWorkspaceId");
CREATE INDEX IF NOT EXISTS "OasisExternalConnection_externalUserId_idx" ON "OasisExternalConnection"("externalUserId");
CREATE INDEX IF NOT EXISTS "OasisExternalConnection_externalWorkspaceId_idx" ON "OasisExternalConnection"("externalWorkspaceId");
CREATE INDEX IF NOT EXISTS "OasisExternalConnection_status_idx" ON "OasisExternalConnection"("status");
CREATE INDEX IF NOT EXISTS "OasisExternalConnection_userId_idx" ON "OasisExternalConnection"("userId");

-- ===========================================
-- FOREIGN KEYS
-- ===========================================

-- OasisChannel foreign keys
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'OasisChannel_workspaceId_fkey'
    ) THEN
        ALTER TABLE "OasisChannel" 
        ADD CONSTRAINT "OasisChannel_workspaceId_fkey" 
        FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- OasisChannelMember foreign keys
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'OasisChannelMember_channelId_fkey'
    ) THEN
        ALTER TABLE "OasisChannelMember" 
        ADD CONSTRAINT "OasisChannelMember_channelId_fkey" 
        FOREIGN KEY ("channelId") REFERENCES "OasisChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'OasisChannelMember_userId_fkey'
    ) THEN
        ALTER TABLE "OasisChannelMember" 
        ADD CONSTRAINT "OasisChannelMember_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- OasisDirectMessage foreign keys
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'OasisDirectMessage_workspaceId_fkey'
    ) THEN
        ALTER TABLE "OasisDirectMessage" 
        ADD CONSTRAINT "OasisDirectMessage_workspaceId_fkey" 
        FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- OasisDMParticipant foreign keys
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'OasisDMParticipant_dmId_fkey'
    ) THEN
        ALTER TABLE "OasisDMParticipant" 
        ADD CONSTRAINT "OasisDMParticipant_dmId_fkey" 
        FOREIGN KEY ("dmId") REFERENCES "OasisDirectMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'OasisDMParticipant_userId_fkey'
    ) THEN
        ALTER TABLE "OasisDMParticipant" 
        ADD CONSTRAINT "OasisDMParticipant_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- OasisMessage foreign keys
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'OasisMessage_channelId_fkey'
    ) THEN
        ALTER TABLE "OasisMessage" 
        ADD CONSTRAINT "OasisMessage_channelId_fkey" 
        FOREIGN KEY ("channelId") REFERENCES "OasisChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'OasisMessage_dmId_fkey'
    ) THEN
        ALTER TABLE "OasisMessage" 
        ADD CONSTRAINT "OasisMessage_dmId_fkey" 
        FOREIGN KEY ("dmId") REFERENCES "OasisDirectMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'OasisMessage_senderId_fkey'
    ) THEN
        ALTER TABLE "OasisMessage" 
        ADD CONSTRAINT "OasisMessage_senderId_fkey" 
        FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'OasisMessage_parentMessageId_fkey'
    ) THEN
        ALTER TABLE "OasisMessage" 
        ADD CONSTRAINT "OasisMessage_parentMessageId_fkey" 
        FOREIGN KEY ("parentMessageId") REFERENCES "OasisMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- OasisReaction foreign keys
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'OasisReaction_messageId_fkey'
    ) THEN
        ALTER TABLE "OasisReaction" 
        ADD CONSTRAINT "OasisReaction_messageId_fkey" 
        FOREIGN KEY ("messageId") REFERENCES "OasisMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'OasisReaction_userId_fkey'
    ) THEN
        ALTER TABLE "OasisReaction" 
        ADD CONSTRAINT "OasisReaction_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- OasisReadReceipt foreign keys
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'OasisReadReceipt_messageId_fkey'
    ) THEN
        ALTER TABLE "OasisReadReceipt" 
        ADD CONSTRAINT "OasisReadReceipt_messageId_fkey" 
        FOREIGN KEY ("messageId") REFERENCES "OasisMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'OasisReadReceipt_userId_fkey'
    ) THEN
        ALTER TABLE "OasisReadReceipt" 
        ADD CONSTRAINT "OasisReadReceipt_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- OasisExternalConnection foreign keys
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'OasisExternalConnection_externalWorkspaceId_fkey'
    ) THEN
        ALTER TABLE "OasisExternalConnection" 
        ADD CONSTRAINT "OasisExternalConnection_externalWorkspaceId_fkey" 
        FOREIGN KEY ("externalWorkspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'OasisExternalConnection_userId_fkey'
    ) THEN
        ALTER TABLE "OasisExternalConnection" 
        ADD CONSTRAINT "OasisExternalConnection_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'OasisExternalConnection_externalUserId_fkey'
    ) THEN
        ALTER TABLE "OasisExternalConnection" 
        ADD CONSTRAINT "OasisExternalConnection_externalUserId_fkey" 
        FOREIGN KEY ("externalUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Verify tables were created
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN (
        'OasisChannel',
        'OasisChannelMember',
        'OasisDirectMessage',
        'OasisDMParticipant',
        'OasisMessage',
        'OasisReaction',
        'OasisReadReceipt',
        'OasisExternalConnection'
    );
    
    RAISE NOTICE 'Oasis tables verified: % of 8 tables exist', table_count;
END $$;

