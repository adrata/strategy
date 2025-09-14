-- CreateTable: Executive Contact Intelligence System
CREATE TABLE "executive_contact" (
    "id" TEXT NOT NULL,
    "account_id" TEXT,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "role" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "linkedin_url" TEXT,
    "confidence_score" INTEGER NOT NULL DEFAULT 0,
    "research_methods" TEXT[],
    "selection_reasoning" TEXT,
    "last_verified" TIMESTAMP(3),
    "is_current" BOOLEAN NOT NULL DEFAULT true,
    "workspace_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "executive_contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Research Session Tracking
CREATE TABLE "research_session" (
    "id" TEXT NOT NULL,
    "account_ids" TEXT[],
    "target_roles" TEXT[],
    "research_depth" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "total_cost" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "executives_found" INTEGER NOT NULL DEFAULT 0,
    "confidence_avg" INTEGER NOT NULL DEFAULT 0,
    "processing_time_ms" INTEGER NOT NULL DEFAULT 0,
    "research_methods" TEXT[],
    "user_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "research_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Research Errors and Issues
CREATE TABLE "research_error" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "account_id" TEXT,
    "error_code" TEXT NOT NULL,
    "error_message" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "is_retryable" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "research_error_pkey" PRIMARY KEY ("id")
);

-- CreateTable: API Cost Tracking
CREATE TABLE "api_cost_tracking" (
    "id" TEXT NOT NULL,
    "session_id" TEXT,
    "api_name" TEXT NOT NULL,
    "requests_made" INTEGER NOT NULL DEFAULT 0,
    "cost_incurred" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "success_count" INTEGER NOT NULL DEFAULT 0,
    "failure_count" INTEGER NOT NULL DEFAULT 0,
    "user_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_cost_tracking_pkey" PRIMARY KEY ("id")
);

-- Add indexes for performance
CREATE INDEX "executive_contact_account_id_idx" ON "executive_contact"("account_id");
CREATE INDEX "executive_contact_workspace_id_idx" ON "executive_contact"("workspace_id");
CREATE INDEX "executive_contact_role_idx" ON "executive_contact"("role");
CREATE INDEX "executive_contact_email_idx" ON "executive_contact"("email");

CREATE INDEX "research_session_user_id_idx" ON "research_session"("user_id");
CREATE INDEX "research_session_workspace_id_idx" ON "research_session"("workspace_id");
CREATE INDEX "research_session_status_idx" ON "research_session"("status");
CREATE INDEX "research_session_created_at_idx" ON "research_session"("created_at");

CREATE INDEX "research_error_session_id_idx" ON "research_error"("session_id");
CREATE INDEX "research_error_account_id_idx" ON "research_error"("account_id");

CREATE INDEX "api_cost_tracking_session_id_idx" ON "api_cost_tracking"("session_id");
CREATE INDEX "api_cost_tracking_user_id_idx" ON "api_cost_tracking"("user_id");
CREATE INDEX "api_cost_tracking_date_idx" ON "api_cost_tracking"("date");
CREATE INDEX "api_cost_tracking_api_name_idx" ON "api_cost_tracking"("api_name");

-- Add foreign key constraints (optional - depends on your existing schema)
-- ALTER TABLE "executive_contact" ADD CONSTRAINT "executive_contact_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- ALTER TABLE "research_error" ADD CONSTRAINT "research_error_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "research_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
