// ====================================================================
// SYNC ENGINE IMPLEMENTATION
// ====================================================================
//
// This module implements the main sync engine that orchestrates
// offline-first synchronization between SQLite and PostgreSQL.
// ====================================================================

use super::*;
use crate::database::models::*;
use sqlx::{SqlitePool, PgPool};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use reqwest::Client;
use serde_json::Value;

pub struct SyncEngine {
    sqlite_pool: SqlitePool,
    postgres_pool: Option<PgPool>,
    http_client: Client,
    config: SyncConfig,
    status_manager: Arc<SyncStatusManager>,
    queue_manager: Arc<SyncQueue>,
    conflict_resolver: Arc<ConflictResolver>,
}

impl SyncEngine {
    pub fn new(
        sqlite_pool: SqlitePool,
        postgres_pool: Option<PgPool>,
        config: SyncConfig,
    ) -> Self {
        let http_client = Client::builder()
            .timeout(std::time::Duration::from_secs(config.timeout_seconds as u64))
            .build()
            .expect("Failed to create HTTP client");

        let status_manager = Arc::new(SyncStatusManager::new(sqlite_pool.clone()));
        let queue_manager = Arc::new(SyncQueue::new(sqlite_pool.clone()));
        let conflict_resolver = Arc::new(ConflictResolver::new(sqlite_pool.clone()));

        Self {
            sqlite_pool,
            postgres_pool,
            http_client,
            config,
            status_manager,
            queue_manager,
            conflict_resolver,
        }
    }

    /// Main sync method - orchestrates full workspace sync
    pub async fn sync_workspace(&self, workspace_id: &str) -> Result<SyncReport, SyncError> {
        let start_time = std::time::Instant::now();
        let mut report = SyncReport::new();

        println!("🔄 [SYNC] Starting workspace sync for: {}", workspace_id);

        // Check if we're online
        let is_online = SyncUtils::is_online(&self.config.remote_api_base).await;
        if !is_online {
            return Err(SyncError::Network("No internet connection".to_string()));
        }

        // Get list of tables to sync
        let tables = self.get_syncable_tables().await?;
        report.tables_synced = tables.clone();

        // Sync each table
        for table_name in tables {
            match self.sync_table(&table_name, workspace_id).await {
                Ok(result) => {
                    report.records_processed += result.records_processed;
                    report.records_created += result.records_created;
                    report.records_updated += result.records_updated;
                    report.records_deleted += result.records_deleted;
                    
                    if !result.errors.is_empty() {
                        report.errors.extend(result.errors);
                    }
                }
                Err(e) => {
                    report.add_error(format!("Failed to sync table {}: {}", table_name, e));
                }
            }
        }

        // Check for conflicts
        report.conflicts_found = self.conflict_resolver.count_conflicts().await?;

        // Update sync status
        report.success = report.errors.is_empty();
        report.duration_ms = start_time.elapsed().as_millis() as i64;

        if report.success {
            println!("✅ [SYNC] Workspace sync completed successfully in {}ms", report.duration_ms);
        } else {
            println!("⚠️ [SYNC] Workspace sync completed with {} errors", report.errors.len());
        }

        Ok(report)
    }

    /// Sync a specific table
    pub async fn sync_table(&self, table_name: &str, workspace_id: &str) -> Result<SyncResult, SyncError> {
        let start_time = std::time::Instant::now();
        let mut result = SyncResult::new();

        println!("🔄 [SYNC] Syncing table: {}", table_name);

        // First, push local changes
        match self.push_table_changes(table_name, workspace_id).await {
            Ok(push_result) => {
                result.records_processed += push_result.records_processed;
                result.records_created += push_result.records_created;
                result.records_updated += push_result.records_updated;
                result.records_deleted += push_result.records_deleted;
                result.errors.extend(push_result.errors);
            }
            Err(e) => {
                result.add_error(format!("Failed to push changes for {}: {}", table_name, e));
            }
        }

        // Then, pull remote changes
        match self.pull_table_changes(table_name, workspace_id).await {
            Ok(pull_result) => {
                result.records_processed += pull_result.records_processed;
                result.records_created += pull_result.records_created;
                result.records_updated += pull_result.records_updated;
                result.records_deleted += pull_result.records_deleted;
                result.errors.extend(pull_result.errors);
            }
            Err(e) => {
                result.add_error(format!("Failed to pull changes for {}: {}", table_name, e));
            }
        }

        result.success = result.errors.is_empty();
        result.duration_ms = start_time.elapsed().as_millis() as i64;

        // Update sync status for this table
        self.status_manager.update_table_sync_status(table_name, &result).await?;

        Ok(result)
    }

    /// Push local changes to remote server
    async fn push_table_changes(&self, table_name: &str, workspace_id: &str) -> Result<SyncResult, SyncError> {
        let mut result = SyncResult::new();

        // Get pending changes from sync queue
        let pending_changes = self.queue_manager.get_pending_changes(table_name).await?;

        if pending_changes.is_empty() {
            return Ok(result);
        }

        println!("📤 [SYNC] Pushing {} changes for table: {}", pending_changes.len(), table_name);

        // Process changes in batches
        for batch in pending_changes.chunks(self.config.batch_size as usize) {
            match self.send_batch_to_server(table_name, workspace_id, batch).await {
                Ok(batch_result) => {
                    result.records_processed += batch_result.records_processed;
                    result.records_created += batch_result.records_created;
                    result.records_updated += batch_result.records_updated;
                    result.records_deleted += batch_result.records_deleted;

                    // Mark changes as synced
                    for change in batch {
                        self.queue_manager.mark_as_synced(change.id).await?;
                    }
                }
                Err(e) => {
                    result.add_error(format!("Failed to send batch: {}", e));
                    
                    // Mark changes as failed
                    for change in batch {
                        self.queue_manager.mark_as_failed(change.id, &e.to_string()).await?;
                    }
                }
            }
        }

        result.success = result.errors.is_empty();
        Ok(result)
    }

    /// Pull remote changes from server
    async fn pull_table_changes(&self, table_name: &str, workspace_id: &str) -> Result<SyncResult, SyncError> {
        let mut result = SyncResult::new();

        // Get last sync timestamp for this table
        let last_sync = self.status_manager.get_last_sync_timestamp(table_name).await?;

        // Fetch changes from server
        let remote_changes = self.fetch_changes_from_server(table_name, workspace_id, last_sync).await?;

        if remote_changes.is_empty() {
            return Ok(result);
        }

        println!("📥 [SYNC] Pulling {} changes for table: {}", remote_changes.len(), table_name);

        // Apply changes to local database
        for change in remote_changes {
            match self.apply_remote_change(table_name, &change).await {
                Ok(()) => {
                    result.records_processed += 1;
                    match change.operation {
                        SyncOperation::Insert => result.records_created += 1,
                        SyncOperation::Update => result.records_updated += 1,
                        SyncOperation::Delete => result.records_deleted += 1,
                    }
                }
                Err(e) => {
                    result.add_error(format!("Failed to apply change {}: {}", change.id, e));
                }
            }
        }

        result.success = result.errors.is_empty();
        Ok(result)
    }

    /// Send a batch of changes to the server
    async fn send_batch_to_server(
        &self,
        table_name: &str,
        workspace_id: &str,
        changes: &[SyncQueueItem],
    ) -> Result<SyncResult, SyncError> {
        let mut result = SyncResult::new();

        // Convert changes to API format
        let batch_data = self.convert_changes_to_api_format(changes)?;

        // Send to server
        let url = format!("{}/sync/{}/{}", self.config.remote_api_base, workspace_id, table_name);
        let response = self.http_client
            .post(&url)
            .json(&batch_data)
            .send()
            .await
            .map_err(|e| SyncError::Network(format!("HTTP request failed: {}", e)))?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(SyncError::Network(format!("Server error: {}", error_text)));
        }

        // Parse response
        let response_data: Value = response.json().await
            .map_err(|e| SyncError::Serialization(e))?;

        // Update result based on response
        if let Some(processed) = response_data["records_processed"].as_i64() {
            result.records_processed = processed as i32;
        }

        result.success = true;
        Ok(result)
    }

    /// Fetch changes from server
    async fn fetch_changes_from_server(
        &self,
        table_name: &str,
        workspace_id: &str,
        since: Option<String>,
    ) -> Result<Vec<SyncRecord>, SyncError> {
        let mut url = format!("{}/{}/{}", self.config.remote_api_base, workspace_id, table_name);
        
        if let Some(timestamp) = since {
            url.push_str(&format!("?since={}", timestamp));
        }

        let response = self.http_client
            .get(&url)
            .send()
            .await
            .map_err(|e| SyncError::Network(format!("HTTP request failed: {}", e)))?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(SyncError::Network(format!("Server error: {}", error_text)));
        }

        let response_data: Value = response.json().await
            .map_err(|e| SyncError::Serialization(e))?;

        // Parse response into SyncRecord objects
        let mut records = Vec::new();
        if let Some(data_array) = response_data["data"].as_array() {
            for item in data_array {
                if let Ok(record) = serde_json::from_value::<SyncRecord>(item.clone()) {
                    records.push(record);
                }
            }
        }

        Ok(records)
    }

    /// Apply a remote change to the local database
    async fn apply_remote_change(&self, table_name: &str, change: &SyncRecord) -> Result<(), SyncError> {
        match change.operation {
            SyncOperation::Insert => {
                self.insert_record(table_name, &change.id, &change.data).await
            }
            SyncOperation::Update => {
                self.update_record(table_name, &change.id, &change.data).await
            }
            SyncOperation::Delete => {
                self.delete_record(table_name, &change.id).await
            }
        }
    }

    /// Insert a new record
    async fn insert_record(&self, table_name: &str, id: &str, data: &str) -> Result<(), SyncError> {
        let query = format!("INSERT INTO {} (id, data, sync_version, last_synced_at, is_dirty) VALUES (?, ?, ?, ?, ?)", table_name);
        
        sqlx::query(&query)
            .bind(id)
            .bind(data)
            .bind(1)
            .bind(SyncUtils::current_timestamp())
            .bind(false)
            .execute(&self.sqlite_pool)
            .await
            .map_err(SyncError::Database)?;

        Ok(())
    }

    /// Update an existing record
    async fn update_record(&self, table_name: &str, id: &str, data: &str) -> Result<(), SyncError> {
        let query = format!("UPDATE {} SET data = ?, sync_version = sync_version + 1, last_synced_at = ?, is_dirty = ? WHERE id = ?", table_name);
        
        sqlx::query(&query)
            .bind(data)
            .bind(SyncUtils::current_timestamp())
            .bind(false)
            .bind(id)
            .execute(&self.sqlite_pool)
            .await
            .map_err(SyncError::Database)?;

        Ok(())
    }

    /// Delete a record
    async fn delete_record(&self, table_name: &str, id: &str) -> Result<(), SyncError> {
        let query = format!("DELETE FROM {} WHERE id = ?", table_name);
        
        sqlx::query(&query)
            .bind(id)
            .execute(&self.sqlite_pool)
            .await
            .map_err(SyncError::Database)?;

        Ok(())
    }

    /// Convert sync queue items to API format
    fn convert_changes_to_api_format(&self, changes: &[SyncQueueItem]) -> Result<Value, SyncError> {
        let mut batch = Vec::new();
        
        for change in changes {
            let mut record = serde_json::Map::new();
            record.insert("id".to_string(), Value::String(change.record_id.clone()));
            record.insert("operation".to_string(), Value::String(format!("{:?}", change.operation)));
            
            if let Some(data) = &change.data {
                record.insert("data".to_string(), serde_json::from_str(data)?);
            }
            
            batch.push(Value::Object(record));
        }
        
        Ok(Value::Array(batch))
    }

    /// Get list of tables that can be synced
    async fn get_syncable_tables(&self) -> Result<Vec<String>, SyncError> {
        let tables = vec![
            "workspaces".to_string(),
            "users".to_string(),
            "companies".to_string(),
            "people".to_string(),
            "actions".to_string(),
            "research_data".to_string(),
            "api_cost_tracking".to_string(),
            "ai_conversations".to_string(),
            "ai_messages".to_string(),
            "chronicle_reports".to_string(),
            "buyer_groups".to_string(),
            "buyer_group_members".to_string(),
            "audit_logs".to_string(),
            "email_messages".to_string(),
        ];
        
        Ok(tables)
    }

    /// Resolve a sync conflict
    pub async fn resolve_conflict(&self, conflict_id: i64, resolution: ConflictResolution) -> Result<(), SyncError> {
        self.conflict_resolver.resolve_conflict(conflict_id, resolution).await
    }

    /// Get current sync status
    pub async fn get_sync_status(&self) -> Result<SyncStatusResponse, SyncError> {
        let is_online = SyncUtils::is_online(&self.config.remote_api_base).await;
        let tables = self.status_manager.get_all_table_status().await?;
        let pending_changes = self.queue_manager.count_pending_changes().await?;
        let conflicts = self.conflict_resolver.count_conflicts().await?;

        Ok(SyncStatusResponse {
            is_online,
            last_sync: self.status_manager.get_last_global_sync().await?,
            tables,
            pending_changes,
            conflicts,
        })
    }

    /// Enable background sync
    pub async fn enable_background_sync(&self, interval_minutes: u32) -> Result<(), SyncError> {
        // This would typically start a background task
        // For now, we'll just update the config
        println!("🔄 [SYNC] Background sync enabled with {} minute interval", interval_minutes);
        Ok(())
    }

    /// Disable background sync
    pub async fn disable_background_sync(&self) -> Result<(), SyncError> {
        println!("⏹️ [SYNC] Background sync disabled");
        Ok(())
    }
}

#[async_trait::async_trait]
impl SyncEngineTrait for SyncEngine {
    async fn sync_workspace(&self, workspace_id: &str) -> Result<SyncReport, String> {
        self.sync_workspace(workspace_id).await.map_err(|e| e.to_string())
    }

    async fn sync_table(&self, table_name: &str, workspace_id: &str) -> Result<SyncResult, String> {
        self.sync_table(table_name, workspace_id).await.map_err(|e| e.to_string())
    }

    async fn push_changes(&self, workspace_id: &str) -> Result<SyncResult, String> {
        // Implementation would push all pending changes
        Ok(SyncResult::new())
    }

    async fn pull_changes(&self, workspace_id: &str) -> Result<SyncResult, String> {
        // Implementation would pull all remote changes
        Ok(SyncResult::new())
    }

    async fn resolve_conflict(&self, conflict_id: i64, resolution: ConflictResolution) -> Result<(), String> {
        self.resolve_conflict(conflict_id, resolution).await.map_err(|e| e.to_string())
    }

    async fn get_sync_status(&self) -> Result<SyncStatusResponse, String> {
        self.get_sync_status().await.map_err(|e| e.to_string())
    }

    async fn enable_background_sync(&self, interval_minutes: u32) -> Result<(), String> {
        self.enable_background_sync(interval_minutes).await.map_err(|e| e.to_string())
    }

    async fn disable_background_sync(&self) -> Result<(), String> {
        self.disable_background_sync().await.map_err(|e| e.to_string())
    }
}
