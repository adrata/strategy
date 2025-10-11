-- Add webhook and orchestration models for 2025 best practices

-- WebhookEvent: For receiving and tracking external webhooks
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- BuyerGroupRefreshLog: For tracking buyer group refresh operations
CREATE TABLE "buyer_group_refresh_logs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "triggeredBy" TEXT,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "changes" JSONB,
    "error" TEXT,

    CONSTRAINT "buyer_group_refresh_logs_pkey" PRIMARY KEY ("id")
);

-- PipelineOperation: For idempotent pipeline execution tracking
CREATE TABLE "pipeline_operations" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "pipelineName" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "output" JSONB,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "error" TEXT,

    CONSTRAINT "pipeline_operations_pkey" PRIMARY KEY ("id")
);

-- Create unique indexes for deduplication (idempotency)
CREATE UNIQUE INDEX "webhook_events_idempotencyKey_key" ON "webhook_events"("idempotencyKey");
CREATE UNIQUE INDEX "pipeline_operations_idempotencyKey_key" ON "pipeline_operations"("idempotencyKey");

-- Create indexes for performance
CREATE INDEX "webhook_events_source_eventType_idx" ON "webhook_events"("source", "eventType");
CREATE INDEX "webhook_events_processed_receivedAt_idx" ON "webhook_events"("processed", "receivedAt");
CREATE INDEX "webhook_events_idempotencyKey_idx" ON "webhook_events"("idempotencyKey");

CREATE INDEX "buyer_group_refresh_logs_companyId_startedAt_idx" ON "buyer_group_refresh_logs"("companyId", "startedAt");
CREATE INDEX "buyer_group_refresh_logs_workspaceId_status_idx" ON "buyer_group_refresh_logs"("workspaceId", "status");
CREATE INDEX "buyer_group_refresh_logs_status_startedAt_idx" ON "buyer_group_refresh_logs"("status", "startedAt");

CREATE INDEX "pipeline_operations_idempotencyKey_idx" ON "pipeline_operations"("idempotencyKey");
CREATE INDEX "pipeline_operations_pipelineName_status_idx" ON "pipeline_operations"("pipelineName", "status");
CREATE INDEX "pipeline_operations_createdAt_idx" ON "pipeline_operations"("createdAt");

