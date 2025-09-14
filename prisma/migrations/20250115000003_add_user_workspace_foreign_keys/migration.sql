-- Add foreign key constraints for User/Workspace relationships
-- This ensures data integrity between users, workspaces, and memberships

-- Add foreign key constraint for WorkspaceMembership -> users
ALTER TABLE "WorkspaceMembership" ADD CONSTRAINT fk_workspace_membership_user 
  FOREIGN KEY ("userId") REFERENCES users("id") ON DELETE CASCADE;

-- Add foreign key constraint for WorkspaceMembership -> workspaces
ALTER TABLE "WorkspaceMembership" ADD CONSTRAINT fk_workspace_membership_workspace 
  FOREIGN KEY ("workspaceId") REFERENCES workspaces("id") ON DELETE CASCADE;

-- Add foreign key constraint for users.activeWorkspaceId -> workspaces
ALTER TABLE users ADD CONSTRAINT fk_users_active_workspace 
  FOREIGN KEY ("activeWorkspaceId") REFERENCES workspaces("id") ON DELETE SET NULL;

-- Add uniqueness constraint to prevent duplicate memberships
ALTER TABLE "WorkspaceMembership" ADD CONSTRAINT uk_user_workspace_membership 
  UNIQUE ("userId", "workspaceId");

-- Add indexes for performance
CREATE INDEX "idx_workspace_membership_user_id" ON "WorkspaceMembership"("userId");
CREATE INDEX "idx_workspace_membership_workspace_id" ON "WorkspaceMembership"("workspaceId");
CREATE INDEX "idx_users_active_workspace_id" ON users("activeWorkspaceId");
