// ====================================================================
// SYNC QUEUE MANAGER
// ====================================================================
//
// This module manages the offline change queue for the sync engine.
// It handles queuing, retrying, and tracking of local changes that
// need to be synchronized with the remote server.
// ====================================================================

use super::models::*;
use sqlx::SqlitePool;
use std::sync::Arc;

pub struct SyncQueue {
    pool: SqlitePool,
}

impl SyncQueue {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    /// Add a change to the sync queue
    pub async fn enqueue_change(
        &self,
        table_name: &str,
        record_id: &str,
        operation: SyncOperation,
        data: Option<String>,
    ) -> Result<i64, sqlx::Error> {
        let query = r#"
            INSERT INTO sync_queue (table_name, record_id, operation, data, created_at, status)
            VALUES (?, ?, ?, ?, ?, ?)
        "#;

        let result = sqlx::query(query)
            .bind(table_name)
            .bind(record_id)
            .bind(format!("{:?}", operation))
            .bind(data)
            .bind(chrono::Utc::now().to_rfc3339())
            .bind("PENDING")
            .execute(&self.pool)
            .await?;

        Ok(result.last_insert_rowid())
    }

    /// Get pending changes for a specific table
    pub async fn get_pending_changes(&self, table_name: &str) -> Result<Vec<SyncQueueItem>, sqlx::Error> {
        let query = r#"
            SELECT id, table_name, record_id, operation, data, created_at, 
                   synced_at, error_message, retry_count, status
            FROM sync_queue 
            WHERE table_name = ? AND status = 'PENDING'
            ORDER BY created_at ASC
        "#;

        let rows = sqlx::query_as::<_, SyncQueueItem>(query)
            .bind(table_name)
            .fetch_all(&self.pool)
            .await?;

        Ok(rows)
    }

    /// Get all pending changes
    pub async fn get_all_pending_changes(&self) -> Result<Vec<SyncQueueItem>, sqlx::Error> {
        let query = r#"
            SELECT id, table_name, record_id, operation, data, created_at, 
                   synced_at, error_message, retry_count, status
            FROM sync_queue 
            WHERE status = 'PENDING'
            ORDER BY created_at ASC
        "#;

        let rows = sqlx::query_as::<_, SyncQueueItem>(query)
            .fetch_all(&self.pool)
            .await?;

        Ok(rows)
    }

    /// Get failed changes that can be retried
    pub async fn get_retryable_changes(&self) -> Result<Vec<SyncQueueItem>, sqlx::Error> {
        let query = r#"
            SELECT id, table_name, record_id, operation, data, created_at, 
                   synced_at, error_message, retry_count, status
            FROM sync_queue 
            WHERE status = 'FAILED' AND retry_count < 3
            ORDER BY created_at ASC
        "#;

        let rows = sqlx::query_as::<_, SyncQueueItem>(query)
            .fetch_all(&self.pool)
            .await?;

        Ok(rows)
    }

    /// Mark a change as synced
    pub async fn mark_as_synced(&self, id: i64) -> Result<(), sqlx::Error> {
        let query = r#"
            UPDATE sync_queue 
            SET status = 'COMPLETED', synced_at = ?
            WHERE id = ?
        "#;

        sqlx::query(query)
            .bind(chrono::Utc::now().to_rfc3339())
            .bind(id)
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    /// Mark a change as failed
    pub async fn mark_as_failed(&self, id: i64, error_message: &str) -> Result<(), sqlx::Error> {
        let query = r#"
            UPDATE sync_queue 
            SET status = 'FAILED', error_message = ?, retry_count = retry_count + 1
            WHERE id = ?
        "#;

        sqlx::query(query)
            .bind(error_message)
            .bind(id)
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    /// Mark a change as in progress
    pub async fn mark_as_in_progress(&self, id: i64) -> Result<(), sqlx::Error> {
        let query = r#"
            UPDATE sync_queue 
            SET status = 'IN_PROGRESS'
            WHERE id = ?
        "#;

        sqlx::query(query)
            .bind(id)
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    /// Count pending changes
    pub async fn count_pending_changes(&self) -> Result<i32, sqlx::Error> {
        let query = r#"
            SELECT COUNT(*) as count
            FROM sync_queue 
            WHERE status = 'PENDING'
        "#;

        let row = sqlx::query(query)
            .fetch_one(&self.pool)
            .await?;

        Ok(row.get::<i64, _>("count") as i32)
    }

    /// Count pending changes for a specific table
    pub async fn count_pending_changes_for_table(&self, table_name: &str) -> Result<i32, sqlx::Error> {
        let query = r#"
            SELECT COUNT(*) as count
            FROM sync_queue 
            WHERE table_name = ? AND status = 'PENDING'
        "#;

        let row = sqlx::query(query)
            .bind(table_name)
            .fetch_one(&self.pool)
            .await?;

        Ok(row.get::<i64, _>("count") as i32)
    }

    /// Clear completed changes older than specified days
    pub async fn cleanup_old_changes(&self, days: i32) -> Result<(), sqlx::Error> {
        let cutoff_date = chrono::Utc::now() - chrono::Duration::days(days as i64);
        
        let query = r#"
            DELETE FROM sync_queue 
            WHERE status = 'COMPLETED' AND synced_at < ?
        "#;

        sqlx::query(query)
            .bind(cutoff_date.to_rfc3339())
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    /// Get sync queue statistics
    pub async fn get_queue_stats(&self) -> Result<QueueStats, sqlx::Error> {
        let query = r#"
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed
            FROM sync_queue
        "#;

        let row = sqlx::query(query)
            .fetch_one(&self.pool)
            .await?;

        Ok(QueueStats {
            total: row.get::<i64, _>("total") as i32,
            pending: row.get::<i64, _>("pending") as i32,
            in_progress: row.get::<i64, _>("in_progress") as i32,
            completed: row.get::<i64, _>("completed") as i32,
            failed: row.get::<i64, _>("failed") as i32,
        })
    }

    /// Get queue stats by table
    pub async fn get_queue_stats_by_table(&self) -> Result<Vec<TableQueueStats>, sqlx::Error> {
        let query = r#"
            SELECT 
                table_name,
                COUNT(*) as total,
                SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed
            FROM sync_queue
            GROUP BY table_name
            ORDER BY table_name
        "#;

        let rows = sqlx::query_as::<_, TableQueueStats>(query)
            .fetch_all(&self.pool)
            .await?;

        Ok(rows)
    }

    /// Retry failed changes
    pub async fn retry_failed_changes(&self) -> Result<i32, sqlx::Error> {
        let query = r#"
            UPDATE sync_queue 
            SET status = 'PENDING', error_message = NULL
            WHERE status = 'FAILED' AND retry_count < 3
        "#;

        let result = sqlx::query(query)
            .execute(&self.pool)
            .await?;

        Ok(result.rows_affected() as i32)
    }

    /// Clear all failed changes
    pub async fn clear_failed_changes(&self) -> Result<(), sqlx::Error> {
        let query = r#"
            DELETE FROM sync_queue 
            WHERE status = 'FAILED'
        "#;

        sqlx::query(query)
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    /// Get changes by operation type
    pub async fn get_changes_by_operation(&self, operation: SyncOperation) -> Result<Vec<SyncQueueItem>, sqlx::Error> {
        let query = r#"
            SELECT id, table_name, record_id, operation, data, created_at, 
                   synced_at, error_message, retry_count, status
            FROM sync_queue 
            WHERE operation = ? AND status = 'PENDING'
            ORDER BY created_at ASC
        "#;

        let rows = sqlx::query_as::<_, SyncQueueItem>(query)
            .bind(format!("{:?}", operation))
            .fetch_all(&self.pool)
            .await?;

        Ok(rows)
    }

    /// Get oldest pending change
    pub async fn get_oldest_pending_change(&self) -> Result<Option<SyncQueueItem>, sqlx::Error> {
        let query = r#"
            SELECT id, table_name, record_id, operation, data, created_at, 
                   synced_at, error_message, retry_count, status
            FROM sync_queue 
            WHERE status = 'PENDING'
            ORDER BY created_at ASC
            LIMIT 1
        "#;

        let row = sqlx::query_as::<_, SyncQueueItem>(query)
            .fetch_optional(&self.pool)
            .await?;

        Ok(row)
    }

    /// Get changes created after a specific timestamp
    pub async fn get_changes_since(&self, since: &str) -> Result<Vec<SyncQueueItem>, sqlx::Error> {
        let query = r#"
            SELECT id, table_name, record_id, operation, data, created_at, 
                   synced_at, error_message, retry_count, status
            FROM sync_queue 
            WHERE created_at > ?
            ORDER BY created_at ASC
        "#;

        let rows = sqlx::query_as::<_, SyncQueueItem>(query)
            .bind(since)
            .fetch_all(&self.pool)
            .await?;

        Ok(rows)
    }
}

// ====================================================================
// QUEUE STATISTICS MODELS
// ====================================================================

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct QueueStats {
    pub total: i32,
    pub pending: i32,
    pub in_progress: i32,
    pub completed: i32,
    pub failed: i32,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, sqlx::FromRow)]
pub struct TableQueueStats {
    pub table_name: String,
    pub total: i32,
    pub pending: i32,
    pub in_progress: i32,
    pub completed: i32,
    pub failed: i32,
}

// ====================================================================
// UTILITY FUNCTIONS
// ====================================================================

impl SyncQueue {
    /// Check if queue is healthy (not too many failed items)
    pub async fn is_healthy(&self) -> Result<bool, sqlx::Error> {
        let stats = self.get_queue_stats().await?;
        
        // Consider unhealthy if more than 10% of items are failed
        let failure_rate = if stats.total > 0 {
            stats.failed as f64 / stats.total as f64
        } else {
            0.0
        };
        
        Ok(failure_rate < 0.1)
    }

    /// Get queue health status
    pub async fn get_health_status(&self) -> Result<QueueHealthStatus, sqlx::Error> {
        let stats = self.get_queue_stats().await?;
        
        let failure_rate = if stats.total > 0 {
            stats.failed as f64 / stats.total as f64
        } else {
            0.0
        };

        let status = if failure_rate < 0.05 {
            QueueHealthStatus::Healthy
        } else if failure_rate < 0.1 {
            QueueHealthStatus::Warning
        } else {
            QueueHealthStatus::Critical
        };

        Ok(status)
    }
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub enum QueueHealthStatus {
    Healthy,
    Warning,
    Critical,
}
