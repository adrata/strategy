// ====================================================================
// SYNC STATUS MANAGER
// ====================================================================
//
// This module manages sync status tracking for tables and provides
// information about the current state of synchronization.
// ====================================================================

use super::models::*;
use sqlx::SqlitePool;
use std::collections::HashMap;

pub struct SyncStatusManager {
    pool: SqlitePool,
}

impl SyncStatusManager {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    /// Get sync status for a specific table
    pub async fn get_table_sync_status(&self, table_name: &str) -> Result<Option<SyncStatus>, sqlx::Error> {
        let query = r#"
            SELECT id, table_name, last_full_sync, last_incremental_sync, last_push_sync,
                   total_records, synced_records, pending_records, failed_records,
                   sync_version, created_at, updated_at
            FROM sync_status 
            WHERE table_name = ?
        "#;

        let row = sqlx::query_as::<_, SyncStatus>(query)
            .bind(table_name)
            .fetch_optional(&self.pool)
            .await?;

        Ok(row)
    }

    /// Get sync status for all tables
    pub async fn get_all_table_status(&self) -> Result<Vec<TableSyncStatus>, sqlx::Error> {
        let query = r#"
            SELECT table_name, last_incremental_sync, total_records, synced_records, 
                   pending_records, failed_records,
                   CASE 
                       WHEN failed_records > 0 THEN 'ERROR'
                       WHEN pending_records > 0 THEN 'PENDING'
                       WHEN last_incremental_sync IS NULL THEN 'NEVER_SYNCED'
                       ELSE 'SYNCED'
                   END as status
            FROM sync_status
            ORDER BY table_name
        "#;

        let rows = sqlx::query_as::<_, TableSyncStatus>(query)
            .fetch_all(&self.pool)
            .await?;

        Ok(rows)
    }

    /// Update sync status for a table
    pub async fn update_table_sync_status(&self, table_name: &str, result: &SyncResult) -> Result<(), sqlx::Error> {
        let now = chrono::Utc::now().to_rfc3339();

        // Check if status record exists
        let exists = self.get_table_sync_status(table_name).await?.is_some();

        if exists {
            // Update existing record
            let query = r#"
                UPDATE sync_status 
                SET last_incremental_sync = ?, 
                    total_records = total_records + ?,
                    synced_records = synced_records + ?,
                    pending_records = pending_records - ?,
                    failed_records = failed_records + ?,
                    updated_at = ?
                WHERE table_name = ?
            "#;

            sqlx::query(query)
                .bind(&now)
                .bind(result.records_processed)
                .bind(result.records_processed)
                .bind(result.records_processed)
                .bind(result.errors.len() as i32)
                .bind(&now)
                .bind(table_name)
                .execute(&self.pool)
                .await?;
        } else {
            // Create new record
            let query = r#"
                INSERT INTO sync_status (
                    table_name, last_incremental_sync, total_records, synced_records,
                    pending_records, failed_records, sync_version, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#;

            sqlx::query(query)
                .bind(table_name)
                .bind(&now)
                .bind(result.records_processed)
                .bind(result.records_processed)
                .bind(0)
                .bind(result.errors.len() as i32)
                .bind(1)
                .bind(&now)
                .bind(&now)
                .execute(&self.pool)
                .await?;
        }

        Ok(())
    }

    /// Update full sync timestamp for a table
    pub async fn update_full_sync_timestamp(&self, table_name: &str) -> Result<(), sqlx::Error> {
        let now = chrono::Utc::now().to_rfc3339();

        let query = r#"
            UPDATE sync_status 
            SET last_full_sync = ?, updated_at = ?
            WHERE table_name = ?
        "#;

        sqlx::query(query)
            .bind(&now)
            .bind(&now)
            .bind(table_name)
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    /// Update push sync timestamp for a table
    pub async fn update_push_sync_timestamp(&self, table_name: &str) -> Result<(), sqlx::Error> {
        let now = chrono::Utc::now().to_rfc3339();

        let query = r#"
            UPDATE sync_status 
            SET last_push_sync = ?, updated_at = ?
            WHERE table_name = ?
        "#;

        sqlx::query(query)
            .bind(&now)
            .bind(&now)
            .bind(table_name)
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    /// Get last sync timestamp for a table
    pub async fn get_last_sync_timestamp(&self, table_name: &str) -> Result<Option<String>, sqlx::Error> {
        let query = r#"
            SELECT last_incremental_sync
            FROM sync_status 
            WHERE table_name = ?
        "#;

        let row = sqlx::query(query)
            .bind(table_name)
            .fetch_optional(&self.pool)
            .await?;

        Ok(row.map(|r| r.get::<String, _>("last_incremental_sync")))
    }

    /// Get last global sync timestamp
    pub async fn get_last_global_sync(&self) -> Result<Option<String>, sqlx::Error> {
        let query = r#"
            SELECT MAX(last_incremental_sync) as last_sync
            FROM sync_status
        "#;

        let row = sqlx::query(query)
            .fetch_optional(&self.pool)
            .await?;

        Ok(row.and_then(|r| r.get::<Option<String>, _>("last_sync")))
    }

    /// Get sync statistics
    pub async fn get_sync_statistics(&self) -> Result<SyncStatistics, sqlx::Error> {
        let query = r#"
            SELECT 
                COUNT(*) as total_tables,
                SUM(total_records) as total_records,
                SUM(synced_records) as synced_records,
                SUM(pending_records) as pending_records,
                SUM(failed_records) as failed_records,
                MIN(last_incremental_sync) as oldest_sync,
                MAX(last_incremental_sync) as newest_sync
            FROM sync_status
        "#;

        let row = sqlx::query(query)
            .fetch_one(&self.pool)
            .await?;

        Ok(SyncStatistics {
            total_tables: row.get::<i64, _>("total_tables") as i32,
            total_records: row.get::<i64, _>("total_records") as i32,
            synced_records: row.get::<i64, _>("synced_records") as i32,
            pending_records: row.get::<i64, _>("pending_records") as i32,
            failed_records: row.get::<i64, _>("failed_records") as i32,
            oldest_sync: row.get::<Option<String>, _>("oldest_sync"),
            newest_sync: row.get::<Option<String>, _>("newest_sync"),
        })
    }

    /// Get tables that need sync
    pub async fn get_tables_needing_sync(&self) -> Result<Vec<String>, sqlx::Error> {
        let query = r#"
            SELECT table_name
            FROM sync_status
            WHERE pending_records > 0 OR failed_records > 0
            ORDER BY pending_records DESC, failed_records DESC
        "#;

        let rows = sqlx::query(query)
            .fetch_all(&self.pool)
            .await?;

        Ok(rows.iter().map(|r| r.get::<String, _>("table_name")).collect())
    }

    /// Get tables that have never been synced
    pub async fn get_never_synced_tables(&self) -> Result<Vec<String>, sqlx::Error> {
        let query = r#"
            SELECT table_name
            FROM sync_status
            WHERE last_incremental_sync IS NULL
            ORDER BY table_name
        "#;

        let rows = sqlx::query(query)
            .fetch_all(&self.pool)
            .await?;

        Ok(rows.iter().map(|r| r.get::<String, _>("table_name")).collect())
    }

    /// Get tables with failed syncs
    pub async fn get_failed_sync_tables(&self) -> Result<Vec<String>, sqlx::Error> {
        let query = r#"
            SELECT table_name
            FROM sync_status
            WHERE failed_records > 0
            ORDER BY failed_records DESC
        "#;

        let rows = sqlx::query(query)
            .fetch_all(&self.pool)
            .await?;

        Ok(rows.iter().map(|r| r.get::<String, _>("table_name")).collect())
    }

    /// Reset sync status for a table
    pub async fn reset_table_sync_status(&self, table_name: &str) -> Result<(), sqlx::Error> {
        let query = r#"
            DELETE FROM sync_status 
            WHERE table_name = ?
        "#;

        sqlx::query(query)
            .bind(table_name)
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    /// Initialize sync status for a table
    pub async fn initialize_table_sync_status(&self, table_name: &str, total_records: i32) -> Result<(), sqlx::Error> {
        let now = chrono::Utc::now().to_rfc3339();

        let query = r#"
            INSERT OR REPLACE INTO sync_status (
                table_name, total_records, synced_records, pending_records, 
                failed_records, sync_version, created_at, updated_at
            ) VALUES (?, ?, 0, ?, 0, 1, ?, ?)
        "#;

        sqlx::query(query)
            .bind(table_name)
            .bind(total_records)
            .bind(total_records)
            .bind(&now)
            .bind(&now)
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    /// Get sync health status
    pub async fn get_sync_health(&self) -> Result<SyncHealthStatus, sqlx::Error> {
        let stats = self.get_sync_statistics().await?;
        
        let sync_rate = if stats.total_records > 0 {
            stats.synced_records as f64 / stats.total_records as f64
        } else {
            1.0
        };

        let failure_rate = if stats.total_records > 0 {
            stats.failed_records as f64 / stats.total_records as f64
        } else {
            0.0
        };

        let status = if failure_rate > 0.1 {
            SyncHealthStatus::Critical
        } else if failure_rate > 0.05 || sync_rate < 0.9 {
            SyncHealthStatus::Warning
        } else {
            SyncHealthStatus::Healthy
        };

        Ok(status)
    }

    /// Get sync performance metrics
    pub async fn get_sync_performance(&self) -> Result<SyncPerformanceMetrics, sqlx::Error> {
        let query = r#"
            SELECT 
                AVG(
                    CASE 
                        WHEN last_incremental_sync IS NOT NULL 
                        THEN (julianday('now') - julianday(last_incremental_sync)) * 24 * 60 * 60 * 1000
                        ELSE 0
                    END
                ) as avg_sync_age_ms,
                COUNT(CASE WHEN last_incremental_sync IS NOT NULL THEN 1 END) as synced_tables,
                COUNT(*) as total_tables
            FROM sync_status
        "#;

        let row = sqlx::query(query)
            .fetch_one(&self.pool)
            .await?;

        Ok(SyncPerformanceMetrics {
            sync_duration_ms: 0, // Would be calculated during actual sync
            records_per_second: 0.0, // Would be calculated during actual sync
            network_latency_ms: 0, // Would be measured during actual sync
            compression_ratio: 1.0, // Would be calculated during actual sync
            memory_usage_mb: 0.0, // Would be measured during actual sync
            cpu_usage_percent: 0.0, // Would be measured during actual sync
        })
    }
}

// ====================================================================
// SYNC STATUS MODELS
// ====================================================================

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct SyncStatistics {
    pub total_tables: i32,
    pub total_records: i32,
    pub synced_records: i32,
    pub pending_records: i32,
    pub failed_records: i32,
    pub oldest_sync: Option<String>,
    pub newest_sync: Option<String>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub enum SyncHealthStatus {
    Healthy,
    Warning,
    Critical,
}

// ====================================================================
// UTILITY FUNCTIONS
// ====================================================================

impl SyncStatusManager {
    /// Check if a table needs sync
    pub async fn table_needs_sync(&self, table_name: &str) -> Result<bool, sqlx::Error> {
        let status = self.get_table_sync_status(table_name).await?;
        
        match status {
            Some(status) => Ok(status.pending_records > 0 || status.failed_records > 0),
            None => Ok(true), // Never synced
        }
    }

    /// Get sync progress percentage for a table
    pub async fn get_sync_progress(&self, table_name: &str) -> Result<f64, sqlx::Error> {
        let status = self.get_table_sync_status(table_name).await?;
        
        match status {
            Some(status) => {
                if status.total_records == 0 {
                    Ok(100.0)
                } else {
                    Ok((status.synced_records as f64 / status.total_records as f64) * 100.0)
                }
            }
            None => Ok(0.0),
        }
    }

    /// Get overall sync progress
    pub async fn get_overall_sync_progress(&self) -> Result<f64, sqlx::Error> {
        let stats = self.get_sync_statistics().await?;
        
        if stats.total_records == 0 {
            Ok(100.0)
        } else {
            Ok((stats.synced_records as f64 / stats.total_records as f64) * 100.0)
        }
    }
}
