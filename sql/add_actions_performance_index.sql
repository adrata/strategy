-- Performance index for actions table to optimize batch action count queries
-- This index will dramatically improve performance for groupBy queries on personId + status + deletedAt

CREATE INDEX IF NOT EXISTS "idx_actions_person_status_deleted" 
ON "actions" ("personId", "status", "deletedAt") 
WHERE "deletedAt" IS NULL AND "status" = 'COMPLETED';

-- This composite index optimizes queries like:
-- SELECT personId, COUNT(*) FROM actions 
-- WHERE personId IN (...) AND deletedAt IS NULL AND status = 'COMPLETED'
-- GROUP BY personId

