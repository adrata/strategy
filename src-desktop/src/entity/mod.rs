/**
 * Entity Service - 2025 Best Practices Implementation (Rust)
 * 
 * This service handles entity record generation following modern ULID-based
 * entity-centric data modeling patterns for unified tracking across all record types.
 */

use serde::{Deserialize, Serialize};
use sqlx::{PgPool, Row};
use chrono::Utc;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct EntityRecord {
    pub id: String,
    pub entity_type: String,
    pub workspace_id: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: Option<chrono::DateTime<chrono::Utc>>,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateEntityOptions {
    pub entity_type: String,
    pub workspace_id: String,
    pub metadata: Option<serde_json::Value>,
}

/**
 * Generate a new ULID-based entity ID
 * Following 2025 best practices for distributed systems
 */
pub fn generate_entity_id() -> String {
    // For now, use UUID v4 as ULID equivalent
    // TODO: Implement proper ULID generation in Rust
    Uuid::new_v4().to_string()
}

/**
 * Create a new entity record with ULID-based ID
 * This is the core of the entity-centric data model
 */
pub async fn create_entity_record(
    pool: &PgPool,
    options: CreateEntityOptions,
) -> Result<EntityRecord, Box<dyn std::error::Error + Send + Sync>> {
    let entity_id = generate_entity_id();
    let now = Utc::now();

    let insert_sql = r#"
        INSERT INTO entities (id, type, workspace_id, created_at, updated_at, metadata)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, type, workspace_id, created_at, updated_at, metadata
    "#;

    let row = sqlx::query(insert_sql)
        .bind(&entity_id)
        .bind(&options.entity_type)
        .bind(&options.workspace_id)
        .bind(now)
        .bind(now)
        .bind(&options.metadata)
        .fetch_one(pool)
        .await?;

    Ok(EntityRecord {
        id: row.get("id"),
        entity_type: row.get("type"),
        workspace_id: row.get("workspace_id"),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
        metadata: row.get("metadata"),
    })
}

/**
 * Get entity record by ID
 */
pub async fn get_entity_record(
    pool: &PgPool,
    entity_id: &str,
) -> Result<Option<EntityRecord>, Box<dyn std::error::Error + Send + Sync>> {
    let select_sql = "SELECT * FROM entities WHERE id = $1";
    
    let row = sqlx::query(select_sql)
        .bind(entity_id)
        .fetch_optional(pool)
        .await?;

    match row {
        Some(row) => Ok(Some(EntityRecord {
            id: row.get("id"),
            entity_type: row.get("type"),
            workspace_id: row.get("workspace_id"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
            metadata: row.get("metadata"),
        })),
        None => Ok(None),
    }
}

/**
 * Update entity record metadata
 */
pub async fn update_entity_record(
    pool: &PgPool,
    entity_id: &str,
    metadata: Option<serde_json::Value>,
) -> Result<EntityRecord, Box<dyn std::error::Error + Send + Sync>> {
    let update_sql = r#"
        UPDATE entities 
        SET metadata = $1, updated_at = $2
        WHERE id = $3
        RETURNING id, type, workspace_id, created_at, updated_at, metadata
    "#;

    let now = Utc::now();
    let row = sqlx::query(update_sql)
        .bind(&metadata)
        .bind(now)
        .bind(entity_id)
        .fetch_one(pool)
        .await?;

    Ok(EntityRecord {
        id: row.get("id"),
        entity_type: row.get("type"),
        workspace_id: row.get("workspace_id"),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
        metadata: row.get("metadata"),
    })
}

/**
 * Get all entities for a workspace
 */
pub async fn get_workspace_entities(
    pool: &PgPool,
    workspace_id: &str,
) -> Result<Vec<EntityRecord>, Box<dyn std::error::Error + Send + Sync>> {
    let select_sql = r#"
        SELECT * FROM entities 
        WHERE workspace_id = $1 
        ORDER BY created_at DESC
    "#;

    let rows = sqlx::query(select_sql)
        .bind(workspace_id)
        .fetch_all(pool)
        .await?;

    let entities: Vec<EntityRecord> = rows
        .into_iter()
        .map(|row| EntityRecord {
            id: row.get("id"),
            entity_type: row.get("type"),
            workspace_id: row.get("workspace_id"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
            metadata: row.get("metadata"),
        })
        .collect();

    Ok(entities)
}

/**
 * Get entities by type for a workspace
 */
pub async fn get_entities_by_type(
    pool: &PgPool,
    workspace_id: &str,
    entity_type: &str,
) -> Result<Vec<EntityRecord>, Box<dyn std::error::Error + Send + Sync>> {
    let select_sql = r#"
        SELECT * FROM entities 
        WHERE workspace_id = $1 AND type = $2
        ORDER BY created_at DESC
    "#;

    let rows = sqlx::query(select_sql)
        .bind(workspace_id)
        .bind(entity_type)
        .fetch_all(pool)
        .await?;

    let entities: Vec<EntityRecord> = rows
        .into_iter()
        .map(|row| EntityRecord {
            id: row.get("id"),
            entity_type: row.get("type"),
            workspace_id: row.get("workspace_id"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
            metadata: row.get("metadata"),
        })
        .collect();

    Ok(entities)
}

/**
 * Delete entity record (cascade delete all related records)
 * Use with caution - this will delete all records linked to this entity
 */
pub async fn delete_entity_record(
    pool: &PgPool,
    entity_id: &str,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let delete_sql = "DELETE FROM entities WHERE id = $1";
    
    sqlx::query(delete_sql)
        .bind(entity_id)
        .execute(pool)
        .await?;

    Ok(())
}

/**
 * Check if entity record exists
 */
pub async fn entity_exists(
    pool: &PgPool,
    entity_id: &str,
) -> Result<bool, Box<dyn std::error::Error + Send + Sync>> {
    let select_sql = "SELECT 1 FROM entities WHERE id = $1 LIMIT 1";
    
    let row = sqlx::query(select_sql)
        .bind(entity_id)
        .fetch_optional(pool)
        .await?;

    Ok(row.is_some())
}

/**
 * Get entity statistics for a workspace
 */
pub async fn get_entity_stats(
    pool: &PgPool,
    workspace_id: &str,
) -> Result<serde_json::Value, Box<dyn std::error::Error + Send + Sync>> {
    let select_sql = r#"
        SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN type = 'person' THEN 1 END) as person_count,
            COUNT(CASE WHEN type = 'company' THEN 1 END) as company_count,
            COUNT(CASE WHEN type = 'lead' THEN 1 END) as lead_count,
            COUNT(CASE WHEN type = 'prospect' THEN 1 END) as prospect_count,
            COUNT(CASE WHEN type = 'opportunity' THEN 1 END) as opportunity_count,
            COUNT(CASE WHEN type = 'client' THEN 1 END) as client_count
        FROM entities 
        WHERE workspace_id = $1
    "#;

    let row = sqlx::query(select_sql)
        .bind(workspace_id)
        .fetch_one(pool)
        .await?;

    Ok(serde_json::json!({
        "total": row.get::<i64, _>("total"),
        "byType": {
            "person": row.get::<i64, _>("person_count"),
            "company": row.get::<i64, _>("company_count"),
            "lead": row.get::<i64, _>("lead_count"),
            "prospect": row.get::<i64, _>("prospect_count"),
            "opportunity": row.get::<i64, _>("opportunity_count"),
            "client": row.get::<i64, _>("client_count")
        }
    }))
}
