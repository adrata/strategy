-- Add meeting_transcripts table for meeting intelligence from Zoom, Fireflies, Otter, Teams
CREATE TABLE IF NOT EXISTS "meeting_transcripts" (
    "id" VARCHAR(30) NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "userId" VARCHAR(30),
    "connectionId" VARCHAR(30) NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "externalMeetingId" VARCHAR(255) NOT NULL,
    "meetingTitle" VARCHAR(500),
    "meetingDate" TIMESTAMP(3),
    "duration" INTEGER,
    "participants" JSONB DEFAULT '[]',
    "transcript" TEXT,
    "summary" TEXT,
    "keyPoints" JSONB DEFAULT '[]',
    "actionItems" JSONB DEFAULT '[]',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "linkedCompanyId" VARCHAR(30),
    "linkedPeopleIds" JSONB DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_transcripts_pkey" PRIMARY KEY ("id")
);

-- Add documents table for proposal and contract tracking
CREATE TABLE IF NOT EXISTS "documents" (
    "id" VARCHAR(30) NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "userId" VARCHAR(30) NOT NULL,
    "companyId" VARCHAR(30) NOT NULL,
    "personId" VARCHAR(30),
    "documentType" VARCHAR(50) NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "fileUrl" VARCHAR(500),
    "fileSize" INTEGER,
    "fileType" VARCHAR(50),
    "status" VARCHAR(50) NOT NULL DEFAULT 'draft',
    "sentAt" TIMESTAMP(3),
    "firstViewedAt" TIMESTAMP(3),
    "lastViewedAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "signedAt" TIMESTAMP(3),
    "proposedValue" DECIMAL(15,2),
    "currency" VARCHAR(3) DEFAULT 'USD',
    "externalId" VARCHAR(255),
    "provider" VARCHAR(50),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints for meeting_transcripts
ALTER TABLE "meeting_transcripts" DROP CONSTRAINT IF EXISTS "meeting_transcripts_workspaceId_fkey";
ALTER TABLE "meeting_transcripts" ADD CONSTRAINT "meeting_transcripts_workspaceId_fkey" 
    FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "meeting_transcripts" DROP CONSTRAINT IF EXISTS "meeting_transcripts_userId_fkey";
ALTER TABLE "meeting_transcripts" ADD CONSTRAINT "meeting_transcripts_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "meeting_transcripts" DROP CONSTRAINT IF EXISTS "meeting_transcripts_linkedCompanyId_fkey";
ALTER TABLE "meeting_transcripts" ADD CONSTRAINT "meeting_transcripts_linkedCompanyId_fkey" 
    FOREIGN KEY ("linkedCompanyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "meeting_transcripts" DROP CONSTRAINT IF EXISTS "meeting_transcripts_connectionId_fkey";
ALTER TABLE "meeting_transcripts" ADD CONSTRAINT "meeting_transcripts_connectionId_fkey" 
    FOREIGN KEY ("connectionId") REFERENCES "grand_central_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add foreign key constraints for documents
ALTER TABLE "documents" DROP CONSTRAINT IF EXISTS "documents_workspaceId_fkey";
ALTER TABLE "documents" ADD CONSTRAINT "documents_workspaceId_fkey" 
    FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "documents" DROP CONSTRAINT IF EXISTS "documents_userId_fkey";
ALTER TABLE "documents" ADD CONSTRAINT "documents_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "documents" DROP CONSTRAINT IF EXISTS "documents_companyId_fkey";
ALTER TABLE "documents" ADD CONSTRAINT "documents_companyId_fkey" 
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "documents" DROP CONSTRAINT IF EXISTS "documents_personId_fkey";
ALTER TABLE "documents" ADD CONSTRAINT "documents_personId_fkey" 
    FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create indexes for meeting_transcripts
CREATE INDEX IF NOT EXISTS "meeting_transcripts_workspaceId_meetingDate_idx" ON "meeting_transcripts"("workspaceId", "meetingDate");
CREATE INDEX IF NOT EXISTS "meeting_transcripts_workspaceId_provider_idx" ON "meeting_transcripts"("workspaceId", "provider");
CREATE INDEX IF NOT EXISTS "meeting_transcripts_linkedCompanyId_idx" ON "meeting_transcripts"("linkedCompanyId");
CREATE INDEX IF NOT EXISTS "meeting_transcripts_userId_idx" ON "meeting_transcripts"("userId");
CREATE INDEX IF NOT EXISTS "meeting_transcripts_connectionId_idx" ON "meeting_transcripts"("connectionId");

-- Create unique constraint for meeting_transcripts
CREATE UNIQUE INDEX IF NOT EXISTS "meeting_transcripts_provider_externalMeetingId_workspaceId_key" 
    ON "meeting_transcripts"("provider", "externalMeetingId", "workspaceId");

-- Create indexes for documents
CREATE INDEX IF NOT EXISTS "documents_workspaceId_sentAt_idx" ON "documents"("workspaceId", "sentAt");
CREATE INDEX IF NOT EXISTS "documents_companyId_status_idx" ON "documents"("companyId", "status");
CREATE INDEX IF NOT EXISTS "documents_documentType_status_idx" ON "documents"("documentType", "status");
CREATE INDEX IF NOT EXISTS "documents_status_idx" ON "documents"("status");
CREATE INDEX IF NOT EXISTS "documents_workspaceId_documentType_idx" ON "documents"("workspaceId", "documentType");

-- Add comments for documentation
COMMENT ON TABLE "meeting_transcripts" IS 'Meeting transcripts and notes from Zoom, Fireflies, Otter, Microsoft Teams';
COMMENT ON TABLE "documents" IS 'Proposals, contracts, and other sales documents with status tracking';

