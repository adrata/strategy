import { z } from 'zod';

/**
 * Validation schemas for API v1
 * Based on the streamlined Prisma schema
 */

// Base schemas
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const WorkspaceIdSchema = z.object({
  workspaceId: z.string().min(1).max(30),
});

// Company schemas
export const CompanyStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'PROSPECT', 'CLIENT']);
export const CompanyPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);

export const CreateCompanySchema = z.object({
  name: z.string().min(1).max(255),
  legalName: z.string().max(255).optional(),
  tradingName: z.string().max(255).optional(),
  localName: z.string().max(255).optional(),
  description: z.string().optional(),
  website: z.string().url().max(500).optional(),
  email: z.string().email().max(300).optional(),
  phone: z.string().max(50).optional(),
  fax: z.string().max(50).optional(),
  address: z.string().optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  industry: z.string().max(100).optional(),
  sector: z.string().max(100).optional(),
  size: z.string().max(100).optional(),
  revenue: z.number().positive().optional(),
  currency: z.string().length(3).default('USD'),
  employeeCount: z.number().int().positive().optional(),
  foundedYear: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  registrationNumber: z.string().max(100).optional(),
  taxId: z.string().max(100).optional(),
  vatNumber: z.string().max(100).optional(),
  domain: z.string().max(255).optional(),
  logoUrl: z.string().url().max(500).optional(),
  status: CompanyStatusSchema.default('ACTIVE'),
  priority: CompanyPrioritySchema.default('MEDIUM'),
  tags: z.array(z.string()).default([]),
  customFields: z.record(z.any()).optional(),
  notes: z.record(z.any()).optional(),
  lastAction: z.string().optional(),
  lastActionDate: z.string().datetime().optional(),
  nextAction: z.string().optional(),
  nextActionDate: z.string().datetime().optional(),
  actionStatus: z.string().optional(),
  globalRank: z.number().int().min(0).default(0),
});

export const UpdateCompanySchema = CreateCompanySchema.partial();
export const CompanyIdSchema = z.object({ id: z.string().min(1).max(30) });

// Person schemas
export const PersonStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'PROSPECT']);
export const PersonPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);

export const CreatePersonSchema = z.object({
  companyId: z.string().max(30).optional(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  fullName: z.string().min(1).max(200),
  displayName: z.string().max(200).optional(),
  salutation: z.string().max(50).optional(),
  suffix: z.string().max(50).optional(),
  jobTitle: z.string().max(300).optional(),
  department: z.string().max(200).optional(),
  seniority: z.string().max(50).optional(),
  email: z.string().email().max(300).optional(),
  workEmail: z.string().email().max(300).optional(),
  personalEmail: z.string().email().max(300).optional(),
  phone: z.string().max(50).optional(),
  mobilePhone: z.string().max(50).optional(),
  workPhone: z.string().max(50).optional(),
  linkedinUrl: z.string().url().max(500).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  postalCode: z.string().max(50).optional(),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.string().max(20).optional(),
  bio: z.string().optional(),
  profilePictureUrl: z.string().url().max(500).optional(),
  status: PersonStatusSchema.default('ACTIVE'),
  priority: PersonPrioritySchema.default('MEDIUM'),
  source: z.string().optional(),
  tags: z.array(z.string()).default([]),
  customFields: z.record(z.any()).optional(),
  notes: z.record(z.any()).optional(),
  preferredLanguage: z.string().max(10).optional(),
  timezone: z.string().max(50).optional(),
  emailVerified: z.boolean().default(false),
  phoneVerified: z.boolean().default(false),
  lastAction: z.string().optional(),
  lastActionDate: z.string().datetime().optional(),
  nextAction: z.string().optional(),
  nextActionDate: z.string().datetime().optional(),
  actionStatus: z.string().optional(),
  engagementScore: z.number().min(0).max(100).default(0),
  globalRank: z.number().int().min(0).default(0),
  companyRank: z.number().int().min(0).default(0),
});

export const UpdatePersonSchema = CreatePersonSchema.partial();
export const PersonIdSchema = z.object({ id: z.string().min(1).max(30) });

// Action schemas
export const ActionStatusSchema = z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']);
export const ActionPrioritySchema = z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']);

export const CreateActionSchema = z.object({
  companyId: z.string().max(30).optional(),
  personId: z.string().max(30).optional(),
  type: z.string().min(1).max(30),
  subject: z.string().min(1),
  description: z.string().optional(),
  outcome: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  status: ActionStatusSchema.default('PLANNED'),
  priority: ActionPrioritySchema.default('NORMAL'),
});

export const UpdateActionSchema = CreateActionSchema.partial();
export const ActionIdSchema = z.object({ id: z.string().min(1) });

// User schemas
export const UserRoleSchema = z.enum(['SUPER_ADMIN', 'WORKSPACE_ADMIN', 'MANAGER', 'SALES_REP', 'VIEWER']);

export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).optional(),
  name: z.string().min(1),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  timezone: z.string().max(50).optional(),
  isActive: z.boolean().default(true),
  activeWorkspaceId: z.string().max(30).optional(),
});

export const UpdateUserSchema = CreateUserSchema.partial().omit({ email: true });
export const UserIdSchema = z.object({ id: z.string().min(1) });

// Workspace schemas
export const CreateWorkspaceSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).max(50),
  timezone: z.string().max(50).default('UTC'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const UpdateWorkspaceSchema = CreateWorkspaceSchema.partial();
export const WorkspaceIdParamSchema = z.object({ id: z.string().min(1) });

// Search and filter schemas
export const CompanySearchSchema = z.object({
  q: z.string().optional(),
  status: CompanyStatusSchema.optional(),
  priority: CompanyPrioritySchema.optional(),
  industry: z.string().optional(),
  assignedUserId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
}).merge(PaginationSchema);

export const PersonSearchSchema = z.object({
  q: z.string().optional(),
  status: PersonStatusSchema.optional(),
  priority: PersonPrioritySchema.optional(),
  companyId: z.string().optional(),
  assignedUserId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
}).merge(PaginationSchema);

export const ActionSearchSchema = z.object({
  q: z.string().optional(),
  status: ActionStatusSchema.optional(),
  priority: ActionPrioritySchema.optional(),
  type: z.string().optional(),
  companyId: z.string().optional(),
  personId: z.string().optional(),
  userId: z.string().optional(),
  scheduledAfter: z.string().datetime().optional(),
  scheduledBefore: z.string().datetime().optional(),
}).merge(PaginationSchema);

// Bulk operation schemas
export const BulkUpdateSchema = z.object({
  ids: z.array(z.string()).min(1).max(100),
  updates: z.record(z.any()),
});

export const BulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1).max(100),
});

// Export types
export type CreateCompanyInput = z.infer<typeof CreateCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof UpdateCompanySchema>;
export type CreatePersonInput = z.infer<typeof CreatePersonSchema>;
export type UpdatePersonInput = z.infer<typeof UpdatePersonSchema>;
export type CreateActionInput = z.infer<typeof CreateActionSchema>;
export type UpdateActionInput = z.infer<typeof UpdateActionSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof UpdateWorkspaceSchema>;
export type CompanySearchInput = z.infer<typeof CompanySearchSchema>;
export type PersonSearchInput = z.infer<typeof PersonSearchSchema>;
export type ActionSearchInput = z.infer<typeof ActionSearchSchema>;
export type BulkUpdateInput = z.infer<typeof BulkUpdateSchema>;
export type BulkDeleteInput = z.infer<typeof BulkDeleteSchema>;
