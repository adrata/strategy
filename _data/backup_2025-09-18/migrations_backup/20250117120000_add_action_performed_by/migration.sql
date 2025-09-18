-- AddActionPerformedBy
ALTER TABLE "speedrun_action_logs" ADD COLUMN "actionPerformedBy" VARCHAR(30);

-- Create index for actionPerformedBy
CREATE INDEX "speedrun_action_logs_actionPerformedBy_idx" ON "speedrun_action_logs"("actionPerformedBy");
