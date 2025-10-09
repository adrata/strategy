-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('SUPER_ADMIN', 'WORKSPACE_ADMIN', 'MANAGER', 'SALES_REP', 'VIEWER');

-- CreateEnum
CREATE TYPE "public"."Permission" AS ENUM ('WORKSPACE_CREATE', 'WORKSPACE_UPDATE', 'WORKSPACE_DELETE', 'WORKSPACE_VIEW', 'USER_CREATE', 'USER_UPDATE', 'USER_DELETE', 'USER_VIEW', 'COMPANY_CREATE', 'COMPANY_UPDATE', 'COMPANY_DELETE', 'COMPANY_VIEW', 'PERSON_CREATE', 'PERSON_UPDATE', 'PERSON_DELETE', 'PERSON_VIEW', 'ACTION_CREATE', 'ACTION_UPDATE', 'ACTION_DELETE', 'ACTION_VIEW', 'AUDIT_VIEW', 'AUDIT_EXPORT');

-- CreateEnum
CREATE TYPE "public"."ActionStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."ActionPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."CompanyStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PROSPECT', 'CLIENT');

-- CreateEnum
CREATE TYPE "public"."CompanyPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "public"."PersonStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PROSPECT');

-- CreateEnum
CREATE TYPE "public"."PersonPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "public"."roles" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" VARCHAR(255),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."permissions" (
    "id" TEXT NOT NULL,
    "name" "public"."Permission" NOT NULL,
    "description" VARCHAR(255),
    "resource" VARCHAR(50) NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."role_permissions" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_roles" (
    "id" TEXT NOT NULL,
    "userId" VARCHAR(30) NOT NULL,
    "roleId" TEXT NOT NULL,
    "workspaceId" VARCHAR(30),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" VARCHAR(30),
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workspaces" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'UTC',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "name" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "timezone" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "activeWorkspaceId" VARCHAR(30),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workspace_users" (
    "id" TEXT NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "userId" VARCHAR(30) NOT NULL,
    "role" "public"."UserRole" NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."auth_sessions" (
    "id" TEXT NOT NULL,
    "userId" VARCHAR(30) NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "token" VARCHAR(500) NOT NULL,
    "refreshToken" VARCHAR(500) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAccessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reset_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."companies" (
    "id" VARCHAR(30) NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "assignedUserId" VARCHAR(30),
    "name" VARCHAR(255) NOT NULL,
    "legalName" VARCHAR(255),
    "tradingName" VARCHAR(255),
    "localName" VARCHAR(255),
    "description" TEXT,
    "website" VARCHAR(500),
    "email" VARCHAR(300),
    "phone" VARCHAR(50),
    "fax" VARCHAR(50),
    "address" TEXT,
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "country" VARCHAR(100),
    "postalCode" VARCHAR(20),
    "industry" VARCHAR(100),
    "sector" VARCHAR(100),
    "size" VARCHAR(100),
    "revenue" DECIMAL(15,2),
    "currency" VARCHAR(3) DEFAULT 'USD',
    "employeeCount" INTEGER,
    "foundedYear" INTEGER,
    "registrationNumber" VARCHAR(100),
    "taxId" VARCHAR(100),
    "vatNumber" VARCHAR(100),
    "domain" VARCHAR(255),
    "logoUrl" VARCHAR(500),
    "status" "public"."CompanyStatus" DEFAULT 'ACTIVE',
    "priority" "public"."CompanyPriority" DEFAULT 'MEDIUM',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "customFields" JSONB,
    "notes" JSONB,
    "lastAction" TEXT,
    "lastActionDate" TIMESTAMP(6),
    "nextAction" TEXT,
    "nextActionDate" TIMESTAMP(6),
    "actionStatus" TEXT,
    "globalRank" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "entityId" VARCHAR(30),

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."people" (
    "id" VARCHAR(30) NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "companyId" VARCHAR(30),
    "assignedUserId" VARCHAR(30),
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "fullName" VARCHAR(200) NOT NULL,
    "displayName" VARCHAR(200),
    "salutation" VARCHAR(50),
    "suffix" VARCHAR(50),
    "jobTitle" VARCHAR(300),
    "department" VARCHAR(200),
    "seniority" VARCHAR(50),
    "email" VARCHAR(300),
    "workEmail" VARCHAR(300),
    "personalEmail" VARCHAR(300),
    "phone" VARCHAR(50),
    "mobilePhone" VARCHAR(50),
    "workPhone" VARCHAR(50),
    "linkedinUrl" VARCHAR(500),
    "address" VARCHAR(500),
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "country" VARCHAR(100),
    "postalCode" VARCHAR(50),
    "dateOfBirth" TIMESTAMP(6),
    "gender" VARCHAR(20),
    "bio" TEXT,
    "profilePictureUrl" VARCHAR(500),
    "status" "public"."PersonStatus" DEFAULT 'ACTIVE',
    "priority" "public"."PersonPriority" DEFAULT 'MEDIUM',
    "source" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "customFields" JSONB,
    "notes" JSONB,
    "preferredLanguage" VARCHAR(10),
    "timezone" VARCHAR(50),
    "emailVerified" BOOLEAN DEFAULT false,
    "phoneVerified" BOOLEAN DEFAULT false,
    "lastAction" TEXT,
    "lastActionDate" TIMESTAMP(6),
    "nextAction" TEXT,
    "nextActionDate" TIMESTAMP(6),
    "actionStatus" TEXT,
    "engagementScore" DOUBLE PRECISION DEFAULT 0,
    "globalRank" INTEGER DEFAULT 0,
    "companyRank" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "entityId" VARCHAR(30),

    CONSTRAINT "people_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."actions" (
    "id" TEXT NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "userId" VARCHAR(30) NOT NULL,
    "companyId" VARCHAR(30),
    "personId" VARCHAR(30),
    "type" VARCHAR(30) NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "outcome" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "status" "public"."ActionStatus" NOT NULL DEFAULT 'PLANNED',
    "priority" "public"."ActionPriority" NOT NULL DEFAULT 'NORMAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" TEXT NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "userId" VARCHAR(30) NOT NULL,
    "entityType" VARCHAR(50) NOT NULL,
    "entityId" VARCHAR(30) NOT NULL,
    "action" VARCHAR(20) NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "success" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "public"."roles"("name");

-- CreateIndex
CREATE INDEX "roles_isActive_idx" ON "public"."roles"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "public"."permissions"("name");

-- CreateIndex
CREATE INDEX "permissions_resource_action_idx" ON "public"."permissions"("resource", "action");

-- CreateIndex
CREATE INDEX "permissions_isActive_idx" ON "public"."permissions"("isActive");

-- CreateIndex
CREATE INDEX "role_permissions_roleId_idx" ON "public"."role_permissions"("roleId");

-- CreateIndex
CREATE INDEX "role_permissions_permissionId_idx" ON "public"."role_permissions"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_roleId_permissionId_key" ON "public"."role_permissions"("roleId", "permissionId");

-- CreateIndex
CREATE INDEX "user_roles_userId_idx" ON "public"."user_roles"("userId");

-- CreateIndex
CREATE INDEX "user_roles_roleId_idx" ON "public"."user_roles"("roleId");

-- CreateIndex
CREATE INDEX "user_roles_workspaceId_idx" ON "public"."user_roles"("workspaceId");

-- CreateIndex
CREATE INDEX "user_roles_isActive_idx" ON "public"."user_roles"("isActive");

-- CreateIndex
CREATE INDEX "user_roles_expiresAt_idx" ON "public"."user_roles"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_userId_roleId_workspaceId_key" ON "public"."user_roles"("userId", "roleId", "workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_slug_key" ON "public"."workspaces"("slug");

-- CreateIndex
CREATE INDEX "workspaces_slug_idx" ON "public"."workspaces"("slug");

-- CreateIndex
CREATE INDEX "workspaces_isActive_idx" ON "public"."workspaces"("isActive");

-- CreateIndex
CREATE INDEX "workspaces_deletedAt_idx" ON "public"."workspaces"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_activeWorkspaceId_idx" ON "public"."users"("activeWorkspaceId");

-- CreateIndex
CREATE INDEX "workspace_users_workspaceId_idx" ON "public"."workspace_users"("workspaceId");

-- CreateIndex
CREATE INDEX "workspace_users_userId_idx" ON "public"."workspace_users"("userId");

-- CreateIndex
CREATE INDEX "workspace_users_workspaceId_role_idx" ON "public"."workspace_users"("workspaceId", "role");

-- CreateIndex
CREATE INDEX "workspace_users_isActive_idx" ON "public"."workspace_users"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "auth_sessions_token_key" ON "public"."auth_sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "auth_sessions_refreshToken_key" ON "public"."auth_sessions"("refreshToken");

-- CreateIndex
CREATE INDEX "auth_sessions_expiresAt_idx" ON "public"."auth_sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "auth_sessions_isActive_idx" ON "public"."auth_sessions"("isActive");

-- CreateIndex
CREATE INDEX "auth_sessions_refreshToken_idx" ON "public"."auth_sessions"("refreshToken");

-- CreateIndex
CREATE INDEX "auth_sessions_token_idx" ON "public"."auth_sessions"("token");

-- CreateIndex
CREATE INDEX "auth_sessions_userId_idx" ON "public"."auth_sessions"("userId");

-- CreateIndex
CREATE INDEX "auth_sessions_workspaceId_idx" ON "public"."auth_sessions"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "reset_tokens_token_key" ON "public"."reset_tokens"("token");

-- CreateIndex
CREATE INDEX "reset_tokens_expiresAt_idx" ON "public"."reset_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "reset_tokens_token_idx" ON "public"."reset_tokens"("token");

-- CreateIndex
CREATE INDEX "reset_tokens_used_idx" ON "public"."reset_tokens"("used");

-- CreateIndex
CREATE INDEX "reset_tokens_userId_idx" ON "public"."reset_tokens"("userId");

-- CreateIndex
CREATE INDEX "companies_workspaceId_idx" ON "public"."companies"("workspaceId");

-- CreateIndex
CREATE INDEX "companies_assignedUserId_idx" ON "public"."companies"("assignedUserId");

-- CreateIndex
CREATE INDEX "companies_entityId_idx" ON "public"."companies"("entityId");

-- CreateIndex
CREATE INDEX "companies_workspaceId_status_idx" ON "public"."companies"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "companies_workspaceId_assignedUserId_status_idx" ON "public"."companies"("workspaceId", "assignedUserId", "status");

-- CreateIndex
CREATE INDEX "companies_workspaceId_createdAt_idx" ON "public"."companies"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "companies_customFields_idx" ON "public"."companies" USING GIN ("customFields");

-- CreateIndex
CREATE INDEX "people_workspaceId_idx" ON "public"."people"("workspaceId");

-- CreateIndex
CREATE INDEX "people_companyId_idx" ON "public"."people"("companyId");

-- CreateIndex
CREATE INDEX "people_assignedUserId_idx" ON "public"."people"("assignedUserId");

-- CreateIndex
CREATE INDEX "people_entityId_idx" ON "public"."people"("entityId");

-- CreateIndex
CREATE INDEX "people_workspaceId_status_idx" ON "public"."people"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "people_workspaceId_assignedUserId_status_idx" ON "public"."people"("workspaceId", "assignedUserId", "status");

-- CreateIndex
CREATE INDEX "people_workspaceId_companyId_status_idx" ON "public"."people"("workspaceId", "companyId", "status");

-- CreateIndex
CREATE INDEX "people_workspaceId_createdAt_idx" ON "public"."people"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "people_customFields_idx" ON "public"."people" USING GIN ("customFields");

-- CreateIndex
CREATE INDEX "actions_workspaceId_idx" ON "public"."actions"("workspaceId");

-- CreateIndex
CREATE INDEX "actions_userId_idx" ON "public"."actions"("userId");

-- CreateIndex
CREATE INDEX "actions_companyId_idx" ON "public"."actions"("companyId");

-- CreateIndex
CREATE INDEX "actions_personId_idx" ON "public"."actions"("personId");

-- CreateIndex
CREATE INDEX "actions_type_idx" ON "public"."actions"("type");

-- CreateIndex
CREATE INDEX "actions_status_idx" ON "public"."actions"("status");

-- CreateIndex
CREATE INDEX "actions_workspaceId_status_idx" ON "public"."actions"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "actions_workspaceId_userId_status_idx" ON "public"."actions"("workspaceId", "userId", "status");

-- CreateIndex
CREATE INDEX "actions_workspaceId_scheduledAt_idx" ON "public"."actions"("workspaceId", "scheduledAt");

-- CreateIndex
CREATE INDEX "actions_workspaceId_createdAt_idx" ON "public"."actions"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_workspaceId_idx" ON "public"."audit_logs"("workspaceId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "public"."audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_idx" ON "public"."audit_logs"("entityType");

-- CreateIndex
CREATE INDEX "audit_logs_entityId_idx" ON "public"."audit_logs"("entityId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "public"."audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "public"."audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_workspaceId_entityType_timestamp_idx" ON "public"."audit_logs"("workspaceId", "entityType", "timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_workspaceId_action_timestamp_idx" ON "public"."audit_logs"("workspaceId", "action", "timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_success_idx" ON "public"."audit_logs"("success");

-- AddForeignKey
ALTER TABLE "public"."role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "public"."permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_roles" ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_roles" ADD CONSTRAINT "user_roles_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_activeWorkspaceId_fkey" FOREIGN KEY ("activeWorkspaceId") REFERENCES "public"."workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workspace_users" ADD CONSTRAINT "workspace_users_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workspace_users" ADD CONSTRAINT "workspace_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."auth_sessions" ADD CONSTRAINT "auth_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."auth_sessions" ADD CONSTRAINT "auth_sessions_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reset_tokens" ADD CONSTRAINT "reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."companies" ADD CONSTRAINT "companies_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."companies" ADD CONSTRAINT "companies_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."people" ADD CONSTRAINT "people_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."people" ADD CONSTRAINT "people_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."people" ADD CONSTRAINT "people_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."actions" ADD CONSTRAINT "actions_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."actions" ADD CONSTRAINT "actions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."actions" ADD CONSTRAINT "actions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."actions" ADD CONSTRAINT "actions_personId_fkey" FOREIGN KEY ("personId") REFERENCES "public"."people"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

