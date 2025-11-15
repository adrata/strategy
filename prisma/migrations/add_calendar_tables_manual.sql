-- Manual Migration: Add calendar and events tables for meeting/calendar sync
-- Run this SQL directly in your Neon database console
-- Created: 2025-11-15

-- Step 1: Create calendar table
CREATE TABLE IF NOT EXISTS calendar (
    id TEXT PRIMARY KEY,
    "workspaceId" VARCHAR(30) NOT NULL,
    "userId" VARCHAR(30) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    platform VARCHAR(50) NOT NULL,
    "externalId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT calendar_workspaceId_fkey FOREIGN KEY ("workspaceId") REFERENCES workspaces(id) ON DELETE CASCADE,
    CONSTRAINT calendar_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT calendar_unique_workspace_user_platform_external UNIQUE ("workspaceId", "userId", platform, "externalId")
);

-- Step 2: Create events table
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    "workspaceId" VARCHAR(30) NOT NULL,
    "userId" VARCHAR(30) NOT NULL,
    "calendarId" VARCHAR(30) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    "startTime" TIMESTAMP NOT NULL,
    "endTime" TIMESTAMP NOT NULL,
    "isAllDay" BOOLEAN NOT NULL DEFAULT false,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrenceRule" TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'confirmed',
    visibility VARCHAR(20) NOT NULL DEFAULT 'default',
    platform VARCHAR(50) NOT NULL,
    "externalId" TEXT NOT NULL,
    "meetingUrl" TEXT,
    attendees JSONB,
    organizer JSONB,
    reminders JSONB,
    attachments JSONB,
    "companyId" VARCHAR(30),
    "personId" VARCHAR(30),
    "syncedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT events_workspaceId_fkey FOREIGN KEY ("workspaceId") REFERENCES workspaces(id) ON DELETE CASCADE,
    CONSTRAINT events_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT events_calendarId_fkey FOREIGN KEY ("calendarId") REFERENCES calendar(id) ON DELETE CASCADE,
    CONSTRAINT events_companyId_fkey FOREIGN KEY ("companyId") REFERENCES companies(id),
    CONSTRAINT events_personId_fkey FOREIGN KEY ("personId") REFERENCES people(id),
    CONSTRAINT events_unique_platform_external_workspace UNIQUE (platform, "externalId", "workspaceId")
);

-- Step 3: Create indexes for calendar table
CREATE INDEX IF NOT EXISTS idx_calendar_workspaceId ON calendar("workspaceId");
CREATE INDEX IF NOT EXISTS idx_calendar_userId ON calendar("userId");
CREATE INDEX IF NOT EXISTS idx_calendar_platform ON calendar(platform);

-- Step 4: Create indexes for events table
CREATE INDEX IF NOT EXISTS idx_events_workspaceId ON events("workspaceId");
CREATE INDEX IF NOT EXISTS idx_events_userId ON events("userId");
CREATE INDEX IF NOT EXISTS idx_events_calendarId ON events("calendarId");
CREATE INDEX IF NOT EXISTS idx_events_companyId ON events("companyId");
CREATE INDEX IF NOT EXISTS idx_events_personId ON events("personId");
CREATE INDEX IF NOT EXISTS idx_events_workspace_startTime ON events("workspaceId", "startTime");
CREATE INDEX IF NOT EXISTS idx_events_platform_externalId ON events(platform, "externalId");

-- Step 5: Create function for calendar updatedAt trigger
CREATE OR REPLACE FUNCTION update_calendar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger for calendar updatedAt
DROP TRIGGER IF EXISTS calendar_updated_at ON calendar;
CREATE TRIGGER calendar_updated_at
    BEFORE UPDATE ON calendar
    FOR EACH ROW
    EXECUTE FUNCTION update_calendar_updated_at();

-- Step 7: Create function for events updatedAt trigger
CREATE OR REPLACE FUNCTION update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create trigger for events updatedAt
DROP TRIGGER IF EXISTS events_updated_at ON events;
CREATE TRIGGER events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_events_updated_at();

