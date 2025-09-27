/**
 * Entity Service - 2025 Best Practices Implementation
 * 
 * This service handles entity record generation following modern ULID-based
 * entity-centric data modeling patterns for unified tracking across all record types.
 */

import { ulid } from 'ulid';
import { prisma } from '@/platform/database/prisma-client';

export interface EntityRecord {
  id: string;
  type: 'person' | 'company' | 'lead' | 'prospect' | 'opportunity' | 'client';
  workspace_id: string;
  created_at: Date;
  updated_at?: Date;
  metadata?: Record<string, any>;
}

export interface CreateEntityOptions {
  type: EntityRecord['type'];
  workspaceId: string;
  metadata?: Record<string, any>;
}

/**
 * Generate a new ULID-based entity ID
 * Following 2025 best practices for distributed systems
 */
export function generateEntityId(): string {
  return ulid();
}

/**
 * Create a new entity record with ULID-based ID
 * This is the core of the entity-centric data model
 */
export async function createEntityRecord(options: CreateEntityOptions): Promise<EntityRecord> {
  const entityId = generateEntityId();
  const now = new Date();

  const entityRecord = await prisma.entities.create({
    data: {
      id: entityId,
      type: options.type,
      workspace_id: options.workspaceId,
      created_at: now,
      updated_at: now,
      metadata: options.metadata || {}
    }
  });

  return entityRecord as EntityRecord;
}

/**
 * Get entity record by ID
 */
export async function getEntityRecord(entityId: string): Promise<EntityRecord | null> {
  const entity = await prisma.entities.findUnique({
    where: { id: entityId }
  });

  return entity as EntityRecord | null;
}

/**
 * Update entity record metadata
 */
export async function updateEntityRecord(
  entityId: string, 
  updates: Partial<Pick<EntityRecord, 'metadata' | 'updated_at'>>
): Promise<EntityRecord> {
  const updatedEntity = await prisma.entities.update({
    where: { id: entityId },
    data: {
      ...updates,
      updated_at: new Date()
    }
  });

  return updatedEntity as EntityRecord;
}

/**
 * Get all entities for a workspace
 */
export async function getWorkspaceEntities(workspaceId: string): Promise<EntityRecord[]> {
  const entities = await prisma.entities.findMany({
    where: { workspace_id: workspaceId },
    orderBy: { created_at: 'desc' }
  });

  return entities as EntityRecord[];
}

/**
 * Get entities by type for a workspace
 */
export async function getEntitiesByType(
  workspaceId: string, 
  type: EntityRecord['type']
): Promise<EntityRecord[]> {
  const entities = await prisma.entities.findMany({
    where: { 
      workspace_id: workspaceId,
      type: type
    },
    orderBy: { created_at: 'desc' }
  });

  return entities as EntityRecord[];
}

/**
 * Delete entity record (cascade delete all related records)
 * Use with caution - this will delete all records linked to this entity
 */
export async function deleteEntityRecord(entityId: string): Promise<void> {
  // Note: This should be handled by database cascade rules
  // or manual cleanup of related records
  await prisma.entities.delete({
    where: { id: entityId }
  });
}

/**
 * Check if entity record exists
 */
export async function entityExists(entityId: string): Promise<boolean> {
  const entity = await prisma.entities.findUnique({
    where: { id: entityId },
    select: { id: true }
  });

  return !!entity;
}

/**
 * Get entity statistics for a workspace
 */
export async function getEntityStats(workspaceId: string): Promise<{
  total: number;
  byType: Record<EntityRecord['type'], number>;
}> {
  const entities = await prisma.entities.findMany({
    where: { workspace_id: workspaceId },
    select: { type: true }
  });

  const stats = {
    total: entities.length,
    byType: {
      person: 0,
      company: 0,
      lead: 0,
      prospect: 0,
      opportunity: 0,
      client: 0
    } as Record<EntityRecord['type'], number>
  };

  entities.forEach(entity => {
    stats.byType[entity.type]++;
  });

  return stats;
}
