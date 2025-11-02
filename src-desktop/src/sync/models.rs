// ====================================================================
// SYNC ENGINE MODELS
// ====================================================================
//
// This module defines the data structures used by the sync engine
// for managing offline-first synchronization between SQLite and PostgreSQL.
// ====================================================================

use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

// ====================================================================
// SYNC QUEUE MODELS
// ====================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncQueueItem {
    pub id: i64,
    pub table_name: String,
    pub record_id: String,
    pub operation: SyncOperation,
    pub data: Option<String>, // JSON object with change data
    pub created_at: String,
    pub synced_at: Option<String>,
    pub error_message: Option<String>,
    pub retry_count: i32,
    pub status: SyncQueueStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SyncOperation {
    Insert,
    Update,
    Delete,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SyncQueueStatus {
    Pending,
    InProgress,
    Completed,
    Failed,
}

// ====================================================================
// SYNC STATUS MODELS
// ====================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncStatus {
    pub id: i64,
    pub table_name: String,
    pub last_full_sync: Option<String>,
    pub last_incremental_sync: Option<String>,
    pub last_push_sync: Option<String>,
    pub total_records: i32,
    pub synced_records: i32,
    pub pending_records: i32,
    pub failed_records: i32,
    pub sync_version: i32,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncStatusResponse {
    pub is_online: bool,
    pub last_sync: Option<String>,
    pub tables: Vec<TableSyncStatus>,
    pub pending_changes: i32,
    pub conflicts: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TableSyncStatus {
    pub table_name: String,
    pub last_sync: Option<String>,
    pub total_records: i32,
    pub synced_records: i32,
    pub pending_records: i32,
    pub failed_records: i32,
    pub status: SyncTableStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SyncTableStatus {
    Synced,
    Pending,
    Error,
    NeverSynced,
}

// ====================================================================
// SYNC CONFLICT MODELS
// ====================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncConflict {
    pub id: i64,
    pub table_name: String,
    pub record_id: String,
    pub local_version: i32,
    pub remote_version: i32,
    pub local_data: Option<String>, // JSON object
    pub remote_data: Option<String>, // JSON object
    pub resolution: Option<ConflictResolution>,
    pub resolved_data: Option<String>, // JSON object
    pub created_at: String,
    pub resolved_at: Option<String>,
    pub resolved_by: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ConflictResolution {
    LocalWins,
    RemoteWins,
    Manual,
    Merge,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConflictResolutionRequest {
    pub conflict_id: i64,
    pub resolution: ConflictResolution,
    pub resolved_data: Option<String>, // JSON object for manual/merge
}

// ====================================================================
// SYNC REPORT MODELS
// ====================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncReport {
    pub success: bool,
    pub tables_synced: Vec<String>,
    pub records_processed: i32,
    pub records_created: i32,
    pub records_updated: i32,
    pub records_deleted: i32,
    pub conflicts_found: i32,
    pub errors: Vec<String>,
    pub duration_ms: i64,
    pub timestamp: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncResult {
    pub success: bool,
    pub records_processed: i32,
    pub records_created: i32,
    pub records_updated: i32,
    pub records_deleted: i32,
    pub errors: Vec<String>,
    pub duration_ms: i64,
}

// ====================================================================
// SYNC CONFIGURATION MODELS
// ====================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncConfig {
    pub remote_api_base: String,
    pub sync_interval_minutes: u32,
    pub max_retry_attempts: u32,
    pub batch_size: u32,
    pub conflict_resolution_strategy: ConflictResolutionStrategy,
    pub enable_background_sync: bool,
    pub enable_auto_retry: bool,
    pub enable_compression: bool,
    pub timeout_seconds: u32,
}

impl Default for SyncConfig {
    fn default() -> Self {
        Self {
            remote_api_base: "https://adrata.vercel.app/api/v1".to_string(),
            sync_interval_minutes: 5,
            max_retry_attempts: 3,
            batch_size: 100,
            conflict_resolution_strategy: ConflictResolutionStrategy::LastWriteWins,
            enable_background_sync: true,
            enable_auto_retry: true,
            enable_compression: true,
            timeout_seconds: 30,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ConflictResolutionStrategy {
    LastWriteWins,
    LocalWins,
    RemoteWins,
    Manual,
    Merge,
}

// ====================================================================
// SYNC BATCH MODELS
// ====================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncBatch {
    pub table_name: String,
    pub workspace_id: String,
    pub records: Vec<SyncRecord>,
    pub batch_id: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncRecord {
    pub id: String,
    pub operation: SyncOperation,
    pub data: String, // JSON object
    pub sync_version: i32,
    pub last_modified: String,
}

// ====================================================================
// SYNC METADATA MODELS
// ====================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncMetadata {
    pub table_name: String,
    pub last_synced_at: Option<String>,
    pub sync_version: i32,
    pub is_dirty: bool,
    pub record_count: i32,
    pub last_modified: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncWatermark {
    pub table_name: String,
    pub last_sync_timestamp: String,
    pub last_sync_version: i32,
    pub record_count: i32,
}

// ====================================================================
// SYNC ERROR MODELS
// ====================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncError {
    pub code: String,
    pub message: String,
    pub table_name: Option<String>,
    pub record_id: Option<String>,
    pub operation: Option<SyncOperation>,
    pub timestamp: String,
    pub retry_count: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncErrorReport {
    pub total_errors: i32,
    pub errors_by_table: std::collections::HashMap<String, i32>,
    pub errors_by_operation: std::collections::HashMap<String, i32>,
    pub recent_errors: Vec<SyncError>,
}

// ====================================================================
// SYNC PERFORMANCE MODELS
// ====================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncPerformanceMetrics {
    pub sync_duration_ms: i64,
    pub records_per_second: f64,
    pub network_latency_ms: i64,
    pub compression_ratio: f64,
    pub memory_usage_mb: f64,
    pub cpu_usage_percent: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncPerformanceReport {
    pub average_sync_time: i64,
    pub fastest_sync: i64,
    pub slowest_sync: i64,
    pub total_syncs: i32,
    pub success_rate: f64,
    pub average_records_per_sync: f64,
    pub performance_trend: Vec<SyncPerformanceMetrics>,
}

// ====================================================================
// SYNC NOTIFICATION MODELS
// ====================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncNotification {
    pub id: String,
    pub type_: SyncNotificationType,
    pub title: String,
    pub message: String,
    pub data: Option<String>, // JSON object
    pub created_at: String,
    pub read: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SyncNotificationType {
    SyncStarted,
    SyncCompleted,
    SyncFailed,
    ConflictDetected,
    OfflineMode,
    OnlineMode,
    BackgroundSyncEnabled,
    BackgroundSyncDisabled,
}

// ====================================================================
// UTILITY IMPLEMENTATIONS
// ====================================================================

impl SyncQueueItem {
    pub fn new(
        table_name: String,
        record_id: String,
        operation: SyncOperation,
        data: Option<String>,
    ) -> Self {
        Self {
            id: 0, // Will be set by database
            table_name,
            record_id,
            operation,
            data,
            created_at: chrono::Utc::now().to_rfc3339(),
            synced_at: None,
            error_message: None,
            retry_count: 0,
            status: SyncQueueStatus::Pending,
        }
    }
    
    pub fn is_retryable(&self) -> bool {
        self.retry_count < 3 && self.status == SyncQueueStatus::Failed
    }
    
    pub fn increment_retry(&mut self) {
        self.retry_count += 1;
    }
}

impl SyncReport {
    pub fn new() -> Self {
        Self {
            success: false,
            tables_synced: Vec::new(),
            records_processed: 0,
            records_created: 0,
            records_updated: 0,
            records_deleted: 0,
            conflicts_found: 0,
            errors: Vec::new(),
            duration_ms: 0,
            timestamp: chrono::Utc::now().to_rfc3339(),
        }
    }
    
    pub fn add_error(&mut self, error: String) {
        self.errors.push(error);
        self.success = false;
    }
    
    pub fn add_table_synced(&mut self, table: String) {
        if !self.tables_synced.contains(&table) {
            self.tables_synced.push(table);
        }
    }
    
    pub fn is_successful(&self) -> bool {
        self.success && self.errors.is_empty()
    }
}

impl SyncResult {
    pub fn new() -> Self {
        Self {
            success: false,
            records_processed: 0,
            records_created: 0,
            records_updated: 0,
            records_deleted: 0,
            errors: Vec::new(),
            duration_ms: 0,
        }
    }
    
    pub fn add_error(&mut self, error: String) {
        self.errors.push(error);
        self.success = false;
    }
    
    pub fn is_successful(&self) -> bool {
        self.success && self.errors.is_empty()
    }
}

impl SyncConflict {
    pub fn new(
        table_name: String,
        record_id: String,
        local_version: i32,
        remote_version: i32,
        local_data: Option<String>,
        remote_data: Option<String>,
    ) -> Self {
        Self {
            id: 0, // Will be set by database
            table_name,
            record_id,
            local_version,
            remote_version,
            local_data,
            remote_data,
            resolution: None,
            resolved_data: None,
            created_at: chrono::Utc::now().to_rfc3339(),
            resolved_at: None,
            resolved_by: None,
        }
    }
    
    pub fn is_resolved(&self) -> bool {
        self.resolution.is_some()
    }
    
    pub fn resolve(&mut self, resolution: ConflictResolution, resolved_data: Option<String>, resolved_by: String) {
        self.resolution = Some(resolution);
        self.resolved_data = resolved_data;
        self.resolved_at = Some(chrono::Utc::now().to_rfc3339());
        self.resolved_by = Some(resolved_by);
    }
}
