-- CreateTable
CREATE TABLE "email_messages" (
    "id" VARCHAR(30) NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "messageId" TEXT NOT NULL,
    "threadId" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "bodyHtml" TEXT,
    "from" VARCHAR(300) NOT NULL,
    "to" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "cc" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bcc" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sentAt" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isImportant" BOOLEAN NOT NULL DEFAULT false,
    "attachments" JSONB,
    "labels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "companyId" VARCHAR(30),
    "personId" VARCHAR(30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_messages_provider_messageId_workspaceId_key" ON "email_messages"("provider", "messageId", "workspaceId");

-- CreateIndex
CREATE INDEX "email_messages_workspaceId_idx" ON "email_messages"("workspaceId");

-- CreateIndex
CREATE INDEX "email_messages_companyId_idx" ON "email_messages"("companyId");

-- CreateIndex
CREATE INDEX "email_messages_personId_idx" ON "email_messages"("personId");

-- CreateIndex
CREATE INDEX "email_messages_workspaceId_receivedAt_idx" ON "email_messages"("workspaceId", "receivedAt");

-- CreateIndex
CREATE INDEX "email_messages_from_idx" ON "email_messages"("from");

-- AddForeignKey
ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_personId_fkey" FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;
