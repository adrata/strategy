// ====================================================================
// SYNC CONFLICT RESOLVER
// ====================================================================
//
// This module handles conflict resolution when the same record has been
// modified both locally and remotely. It provides various resolution
// strategies and manual conflict resolution capabilities.
// ====================================================================

use super::models::*;
use sqlx::SqlitePool;
use serde_json::Value;
use std::collections::HashMap;

pub struct ConflictResolver {
    pool: SqlitePool,
}

impl ConflictResolver {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    /// Detect conflicts between local and remote data
    pub async fn detect_conflicts(
        &self,
        table_name: &str,
        local_data: &str,
        remote_data: &str,
        record_id: &str,
    ) -> Result<Option<SyncConflict>, sqlx::Error> {
        // Parse JSON data
        let local_json: Value = serde_json::from_str(local_data)
            .map_err(|e| sqlx::Error::Protocol(format!("Invalid local JSON: {}", e)))?;
        
        let remote_json: Value = serde_json::from_str(remote_data)
            .map_err(|e| sqlx::Error::Protocol(format!("Invalid remote JSON: {}", e)))?;

        // Check if there are actual differences
        if local_json == remote_json {
            return Ok(None); // No conflict
        }

        // Get current sync versions
        let local_version = self.get_local_sync_version(table_name, record_id).await?;
        let remote_version = self.get_remote_sync_version(&remote_json)?;

        // Create conflict record
        let conflict = SyncConflict::new(
            table_name.to_string(),
            record_id.to_string(),
            local_version,
            remote_version,
            Some(local_data.to_string()),
            Some(remote_data.to_string()),
        );

        // Store conflict in database
        let conflict_id = self.store_conflict(&conflict).await?;

        Ok(Some(conflict))
    }

    /// Resolve a conflict using the specified resolution strategy
    pub async fn resolve_conflict(
        &self,
        conflict_id: i64,
        resolution: ConflictResolution,
    ) -> Result<(), sqlx::Error> {
        let conflict = self.get_conflict(conflict_id).await?;
        
        if conflict.is_none() {
            return Err(sqlx::Error::RowNotFound);
        }

        let mut conflict = conflict.unwrap();
        
        // Apply resolution strategy
        let resolved_data = match resolution {
            ConflictResolution::LocalWins => {
                conflict.local_data.clone()
            }
            ConflictResolution::RemoteWins => {
                conflict.remote_data.clone()
            }
            ConflictResolution::Merge => {
                self.merge_data(
                    &conflict.local_data.unwrap_or_default(),
                    &conflict.remote_data.unwrap_or_default(),
                ).await?
            }
            ConflictResolution::Manual => {
                // For manual resolution, we expect the resolved data to be provided
                // This would typically come from the UI
                return Err(sqlx::Error::Protocol("Manual resolution requires resolved data".to_string()));
            }
        };

        // Update conflict record
        conflict.resolve(resolution, resolved_data, "system".to_string());
        
        // Update conflict in database
        self.update_conflict(&conflict).await?;

        // Apply resolved data to the actual record
        self.apply_resolved_data(&conflict).await?;

        Ok(())
    }

    /// Resolve conflict with manual data
    pub async fn resolve_conflict_manual(
        &self,
        conflict_id: i64,
        resolved_data: String,
    ) -> Result<(), sqlx::Error> {
        let conflict = self.get_conflict(conflict_id).await?;
        
        if conflict.is_none() {
            return Err(sqlx::Error::RowNotFound);
        }

        let mut conflict = conflict.unwrap();
        
        // Update conflict record
        conflict.resolve(ConflictResolution::Manual, Some(resolved_data), "user".to_string());
        
        // Update conflict in database
        self.update_conflict(&conflict).await?;

        // Apply resolved data to the actual record
        self.apply_resolved_data(&conflict).await?;

        Ok(())
    }

    /// Get all unresolved conflicts
    pub async fn get_unresolved_conflicts(&self) -> Result<Vec<SyncConflict>, sqlx::Error> {
        let query = r#"
            SELECT id, table_name, record_id, local_version, remote_version,
                   local_data, remote_data, resolution, resolved_data,
                   created_at, resolved_at, resolved_by
            FROM sync_conflicts
            WHERE resolution IS NULL
            ORDER BY created_at ASC
        "#;

        let rows = sqlx::query_as::<_, SyncConflict>(query)
            .fetch_all(&self.pool)
            .await?;

        Ok(rows)
    }

    /// Get conflicts for a specific table
    pub async fn get_conflicts_for_table(&self, table_name: &str) -> Result<Vec<SyncConflict>, sqlx::Error> {
        let query = r#"
            SELECT id, table_name, record_id, local_version, remote_version,
                   local_data, remote_data, resolution, resolved_data,
                   created_at, resolved_at, resolved_by
            FROM sync_conflicts
            WHERE table_name = ? AND resolution IS NULL
            ORDER BY created_at ASC
        "#;

        let rows = sqlx::query_as::<_, SyncConflict>(query)
            .bind(table_name)
            .fetch_all(&self.pool)
            .await?;

        Ok(rows)
    }

    /// Count total conflicts
    pub async fn count_conflicts(&self) -> Result<i32, sqlx::Error> {
        let query = r#"
            SELECT COUNT(*) as count
            FROM sync_conflicts
            WHERE resolution IS NULL
        "#;

        let row = sqlx::query(query)
            .fetch_one(&self.pool)
            .await?;

        Ok(row.get::<i64, _>("count") as i32)
    }

    /// Count conflicts for a specific table
    pub async fn count_conflicts_for_table(&self, table_name: &str) -> Result<i32, sqlx::Error> {
        let query = r#"
            SELECT COUNT(*) as count
            FROM sync_conflicts
            WHERE table_name = ? AND resolution IS NULL
        "#;

        let row = sqlx::query(query)
            .bind(table_name)
            .fetch_one(&self.pool)
            .await?;

        Ok(row.get::<i64, _>("count") as i32)
    }

    /// Get conflict statistics
    pub async fn get_conflict_statistics(&self) -> Result<ConflictStatistics, sqlx::Error> {
        let query = r#"
            SELECT 
                COUNT(*) as total_conflicts,
                SUM(CASE WHEN resolution IS NULL THEN 1 ELSE 0 END) as unresolved_conflicts,
                SUM(CASE WHEN resolution = 'LOCAL_WINS' THEN 1 ELSE 0 END) as local_wins,
                SUM(CASE WHEN resolution = 'REMOTE_WINS' THEN 1 ELSE 0 END) as remote_wins,
                SUM(CASE WHEN resolution = 'MERGE' THEN 1 ELSE 0 END) as merged,
                SUM(CASE WHEN resolution = 'MANUAL' THEN 1 ELSE 0 END) as manual_resolutions
            FROM sync_conflicts
        "#;

        let row = sqlx::query(query)
            .fetch_one(&self.pool)
            .await?;

        Ok(ConflictStatistics {
            total_conflicts: row.get::<i64, _>("total_conflicts") as i32,
            unresolved_conflicts: row.get::<i64, _>("unresolved_conflicts") as i32,
            local_wins: row.get::<i64, _>("local_wins") as i32,
            remote_wins: row.get::<i64, _>("remote_wins") as i32,
            merged: row.get::<i64, _>("merged") as i32,
            manual_resolutions: row.get::<i64, _>("manual_resolutions") as i32,
        })
    }

    /// Clear resolved conflicts older than specified days
    pub async fn cleanup_resolved_conflicts(&self, days: i32) -> Result<(), sqlx::Error> {
        let cutoff_date = chrono::Utc::now() - chrono::Duration::days(days as i64);
        
        let query = r#"
            DELETE FROM sync_conflicts 
            WHERE resolution IS NOT NULL AND resolved_at < ?
        "#;

        sqlx::query(query)
            .bind(cutoff_date.to_rfc3339())
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    /// Auto-resolve conflicts using the configured strategy
    pub async fn auto_resolve_conflicts(&self, strategy: ConflictResolutionStrategy) -> Result<i32, sqlx::Error> {
        let conflicts = self.get_unresolved_conflicts().await?;
        let mut resolved_count = 0;

        for conflict in conflicts {
            let resolution = match strategy {
                ConflictResolutionStrategy::LastWriteWins => {
                    if conflict.local_version > conflict.remote_version {
                        ConflictResolution::LocalWins
                    } else {
                        ConflictResolution::RemoteWins
                    }
                }
                ConflictResolutionStrategy::LocalWins => ConflictResolution::LocalWins,
                ConflictResolutionStrategy::RemoteWins => ConflictResolution::RemoteWins,
                ConflictResolutionStrategy::Merge => ConflictResolution::Merge,
                ConflictResolutionStrategy::Manual => continue, // Skip manual conflicts
            };

            if let Ok(()) = self.resolve_conflict(conflict.id, resolution).await {
                resolved_count += 1;
            }
        }

        Ok(resolved_count)
    }

    // ====================================================================
    // PRIVATE HELPER METHODS
    // ====================================================================

    async fn get_local_sync_version(&self, table_name: &str, record_id: &str) -> Result<i32, sqlx::Error> {
        let query = format!("SELECT sync_version FROM {} WHERE id = ?", table_name);
        
        let row = sqlx::query(&query)
            .bind(record_id)
            .fetch_optional(&self.pool)
            .await?;

        Ok(row.map(|r| r.get::<i32, _>("sync_version")).unwrap_or(0))
    }

    fn get_remote_sync_version(&self, remote_data: &Value) -> Result<i32, sqlx::Error> {
        match remote_data.get("sync_version") {
            Some(version) => {
                version.as_i64()
                    .map(|v| v as i32)
                    .ok_or_else(|| sqlx::Error::Protocol("Invalid sync_version in remote data".to_string()))
            }
            None => Ok(0),
        }
    }

    async fn store_conflict(&self, conflict: &SyncConflict) -> Result<i64, sqlx::Error> {
        let query = r#"
            INSERT INTO sync_conflicts (
                table_name, record_id, local_version, remote_version,
                local_data, remote_data, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        "#;

        let result = sqlx::query(query)
            .bind(&conflict.table_name)
            .bind(&conflict.record_id)
            .bind(conflict.local_version)
            .bind(conflict.remote_version)
            .bind(&conflict.local_data)
            .bind(&conflict.remote_data)
            .bind(&conflict.created_at)
            .execute(&self.pool)
            .await?;

        Ok(result.last_insert_rowid())
    }

    async fn get_conflict(&self, conflict_id: i64) -> Result<Option<SyncConflict>, sqlx::Error> {
        let query = r#"
            SELECT id, table_name, record_id, local_version, remote_version,
                   local_data, remote_data, resolution, resolved_data,
                   created_at, resolved_at, resolved_by
            FROM sync_conflicts
            WHERE id = ?
        "#;

        let row = sqlx::query_as::<_, SyncConflict>(query)
            .bind(conflict_id)
            .fetch_optional(&self.pool)
            .await?;

        Ok(row)
    }

    async fn update_conflict(&self, conflict: &SyncConflict) -> Result<(), sqlx::Error> {
        let query = r#"
            UPDATE sync_conflicts 
            SET resolution = ?, resolved_data = ?, resolved_at = ?, resolved_by = ?
            WHERE id = ?
        "#;

        sqlx::query(query)
            .bind(format!("{:?}", conflict.resolution.as_ref().unwrap()))
            .bind(&conflict.resolved_data)
            .bind(&conflict.resolved_at)
            .bind(&conflict.resolved_by)
            .bind(conflict.id)
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    async fn apply_resolved_data(&self, conflict: &SyncConflict) -> Result<(), sqlx::Error> {
        if let Some(resolved_data) = &conflict.resolved_data {
            let query = format!(
                "UPDATE {} SET data = ?, sync_version = sync_version + 1, last_synced_at = ?, is_dirty = ? WHERE id = ?",
                conflict.table_name
            );

            sqlx::query(&query)
                .bind(resolved_data)
                .bind(chrono::Utc::now().to_rfc3339())
                .bind(false)
                .bind(&conflict.record_id)
                .execute(&self.pool)
                .await?;
        }

        Ok(())
    }

    async fn merge_data(&self, local_data: &str, remote_data: &str) -> Result<Option<String>, sqlx::Error> {
        // Parse JSON data
        let local_json: Value = serde_json::from_str(local_data)
            .map_err(|e| sqlx::Error::Protocol(format!("Invalid local JSON: {}", e)))?;
        
        let remote_json: Value = serde_json::from_str(remote_data)
            .map_err(|e| sqlx::Error::Protocol(format!("Invalid remote JSON: {}", e)))?;

        // Simple merge strategy: prefer non-null values, remote wins on conflicts
        let mut merged = local_json.clone();
        
        if let Value::Object(ref mut local_obj) = merged {
            if let Value::Object(remote_obj) = remote_json {
                for (key, remote_value) in remote_obj {
                    if !remote_value.is_null() {
                        local_obj.insert(key, remote_value);
                    }
                }
            }
        }

        // Serialize merged data
        let merged_json = serde_json::to_string(&merged)
            .map_err(|e| sqlx::Error::Protocol(format!("Failed to serialize merged data: {}", e)))?;

        Ok(Some(merged_json))
    }
}

// ====================================================================
// CONFLICT STATISTICS MODEL
// ====================================================================

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ConflictStatistics {
    pub total_conflicts: i32,
    pub unresolved_conflicts: i32,
    pub local_wins: i32,
    pub remote_wins: i32,
    pub merged: i32,
    pub manual_resolutions: i32,
}

// ====================================================================
// UTILITY FUNCTIONS
// ====================================================================

impl ConflictResolver {
    /// Check if there are any unresolved conflicts
    pub async fn has_unresolved_conflicts(&self) -> Result<bool, sqlx::Error> {
        let count = self.count_conflicts().await?;
        Ok(count > 0)
    }

    /// Get conflict resolution suggestions
    pub async fn get_resolution_suggestions(&self, conflict_id: i64) -> Result<Vec<ConflictResolutionSuggestion>, sqlx::Error> {
        let conflict = self.get_conflict(conflict_id).await?;
        
        if conflict.is_none() {
            return Ok(Vec::new());
        }

        let conflict = conflict.unwrap();
        let mut suggestions = Vec::new();

        // Analyze the conflict and provide suggestions
        if let (Some(local_data), Some(remote_data)) = (&conflict.local_data, &conflict.remote_data) {
            let local_json: Value = serde_json::from_str(local_data).unwrap_or_default();
            let remote_json: Value = serde_json::from_str(remote_data).unwrap_or_default();

            // Check for common conflict patterns
            if self.is_timestamp_conflict(&local_json, &remote_json) {
                suggestions.push(ConflictResolutionSuggestion {
                    resolution: ConflictResolution::LastWriteWins,
                    confidence: 0.9,
                    reason: "Timestamp-based conflict detected".to_string(),
                });
            }

            if self.is_field_addition_conflict(&local_json, &remote_json) {
                suggestions.push(ConflictResolutionSuggestion {
                    resolution: ConflictResolution::Merge,
                    confidence: 0.8,
                    reason: "Field addition conflict - merge recommended".to_string(),
                });
            }
        }

        Ok(suggestions)
    }

    fn is_timestamp_conflict(&self, local: &Value, remote: &Value) -> bool {
        // Check if only timestamp fields differ
        if let (Some(local_updated), Some(remote_updated)) = (local.get("updated_at"), remote.get("updated_at")) {
            return local_updated != remote_updated;
        }
        false
    }

    fn is_field_addition_conflict(&self, local: &Value, remote: &Value) -> bool {
        // Check if remote has additional fields that local doesn't have
        if let (Value::Object(local_obj), Value::Object(remote_obj)) = (local, remote) {
            for key in remote_obj.keys() {
                if !local_obj.contains_key(key) {
                    return true;
                }
            }
        }
        false
    }
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ConflictResolutionSuggestion {
    pub resolution: ConflictResolution,
    pub confidence: f64,
    pub reason: String,
}
