-- CreateTable
CREATE TABLE "strategic_action_outcomes" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "leadId" TEXT,
    "companyId" TEXT,
    "actionType" TEXT NOT NULL,
    "actionData" JSONB NOT NULL,
    "outcome" TEXT NOT NULL,
    "outcomeValue" DOUBLE PRECISION,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "businessStage" TEXT NOT NULL,
    "kpiCategory" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "strategic_action_outcomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_kpis" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "kpiName" TEXT NOT NULL,
    "kpiCategory" TEXT NOT NULL,
    "currentValue" DOUBLE PRECISION NOT NULL,
    "targetValue" DOUBLE PRECISION,
    "previousValue" DOUBLE PRECISION,
    "changePercent" DOUBLE PRECISION,
    "measurementPeriod" TEXT NOT NULL,
    "lastCalculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_kpis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strategic_weights" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "contextFactors" JSONB NOT NULL,
    "businessStage" TEXT NOT NULL,
    "kpiCategory" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "sampleSize" INTEGER NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "strategic_weights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_impact_predictions" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "leadId" TEXT,
    "companyId" TEXT,
    "actionType" TEXT NOT NULL,
    "actionData" JSONB NOT NULL,
    "predictedOutcome" TEXT NOT NULL,
    "predictedValue" DOUBLE PRECISION,
    "confidence" DOUBLE PRECISION NOT NULL,
    "businessStage" TEXT NOT NULL,
    "kpiCategory" TEXT NOT NULL,
    "reasoning" JSONB NOT NULL,
    "actualOutcome" TEXT,
    "actualValue" DOUBLE PRECISION,
    "predictionAccuracy" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_impact_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strategic_insights" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "insightType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "businessStage" TEXT NOT NULL,
    "kpiCategory" TEXT NOT NULL,
    "impactPotential" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "actionable" BOOLEAN NOT NULL,
    "supportingData" JSONB NOT NULL,
    "recommendedActions" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "strategic_insights_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "business_kpis_workspaceId_kpiName_measurementPeriod_key" ON "business_kpis"("workspaceId", "kpiName", "measurementPeriod");

-- CreateIndex
CREATE UNIQUE INDEX "strategic_weights_workspaceId_actionType_businessStage_kpiC_key" ON "strategic_weights"("workspaceId", "actionType", "businessStage", "kpiCategory");

-- AddForeignKey
ALTER TABLE "strategic_action_outcomes" ADD CONSTRAINT "strategic_action_outcomes_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategic_action_outcomes" ADD CONSTRAINT "strategic_action_outcomes_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategic_action_outcomes" ADD CONSTRAINT "strategic_action_outcomes_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_kpis" ADD CONSTRAINT "business_kpis_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategic_weights" ADD CONSTRAINT "strategic_weights_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_impact_predictions" ADD CONSTRAINT "business_impact_predictions_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_impact_predictions" ADD CONSTRAINT "business_impact_predictions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_impact_predictions" ADD CONSTRAINT "business_impact_predictions_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategic_insights" ADD CONSTRAINT "strategic_insights_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
