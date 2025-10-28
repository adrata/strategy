-- CreateTable
CREATE TABLE "ChronicleReadStatus" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChronicleReadStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChronicleReadStatus_reportId_userId_key" ON "ChronicleReadStatus"("reportId", "userId");

-- CreateIndex
CREATE INDEX "ChronicleReadStatus_userId_idx" ON "ChronicleReadStatus"("userId");

-- CreateIndex
CREATE INDEX "ChronicleReadStatus_workspaceId_idx" ON "ChronicleReadStatus"("workspaceId");

-- CreateIndex
CREATE INDEX "ChronicleReadStatus_readAt_idx" ON "ChronicleReadStatus"("readAt");

-- AddForeignKey
ALTER TABLE "ChronicleReadStatus" ADD CONSTRAINT "ChronicleReadStatus_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "ChronicleReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
