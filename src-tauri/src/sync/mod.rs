// ====================================================================
// SYNC ENGINE MODULE
// ====================================================================
// 
// This module implements the offline-first sync engine for the Tauri
// desktop application. It provides:
// - Background sync with PostgreSQL
// - Conflict resolution
// - Offline change queue
// - Incremental sync
// - Full sync capabilities
//
// Architecture:
// - SyncEngine: Main orchestrator
// - ConflictResolver: Handles merge conflicts
// - SyncQueue: Manages offline changes
// - SyncStatus: Tracks sync state
// ====================================================================

pub mod engine;
pub mod conflict_resolver;
pub mod queue;
pub mod models;
pub mod status;
pub mod commands;

// Re-export main types
pub use engine::SyncEngine;
pub use conflict_resolver::ConflictResolver;
pub use queue::SyncQueue;
pub use status::SyncStatusManager;
pub use models::*;
pub use commands::*;

use crate::database::models::*;
use sqlx::{SqlitePool, PgPool};
use std::collections::HashMap;
use serde::{Deserialize, Serialize};

// ====================================================================
// SYNC ENGINE CONFIGURATION
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
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ConflictResolutionStrategy {
    LastWriteWins,
    LocalWins,
    RemoteWins,
    Manual,
    Merge,
}

// ====================================================================
// SYNC OPERATION TYPES
// ====================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SyncOperation {
    Insert { table: String, data: String },
    Update { table: String, id: String, data: String },
    Delete { table: String, id: String },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SyncResult {
    Success { records_processed: i32 },
    PartialSuccess { records_processed: i32, errors: Vec<String> },
    Failed { errors: Vec<String> },
}

// ====================================================================
// SYNC ENGINE TRAIT
// ====================================================================

#[async_trait::async_trait]
pub trait SyncEngineTrait {
    async fn sync_workspace(&self, workspace_id: &str) -> Result<SyncReport, String>;
    async fn sync_table(&self, table_name: &str, workspace_id: &str) -> Result<SyncResult, String>;
    async fn push_changes(&self, workspace_id: &str) -> Result<SyncResult, String>;
    async fn pull_changes(&self, workspace_id: &str) -> Result<SyncResult, String>;
    async fn resolve_conflict(&self, conflict_id: i64, resolution: ConflictResolution) -> Result<(), String>;
    async fn get_sync_status(&self) -> Result<SyncStatusResponse, String>;
    async fn enable_background_sync(&self, interval_minutes: u32) -> Result<(), String>;
    async fn disable_background_sync(&self) -> Result<(), String>;
}

// ====================================================================
// SYNC ERROR TYPES
// ====================================================================

#[derive(Debug, thiserror::Error)]
pub enum SyncError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
    
    #[error("Network error: {0}")]
    Network(String),
    
    #[error("Authentication error: {0}")]
    Authentication(String),
    
    #[error("Conflict resolution error: {0}")]
    ConflictResolution(String),
    
    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),
    
    #[error("Configuration error: {0}")]
    Configuration(String),
    
    #[error("Sync queue error: {0}")]
    Queue(String),
}

// ====================================================================
// SYNC UTILITIES
// ====================================================================

pub struct SyncUtils;

impl SyncUtils {
    /// Check if we're online by attempting to reach the remote API
    pub async fn is_online(api_base: &str) -> bool {
        match reqwest::get(&format!("{}/health", api_base)).await {
            Ok(response) => response.status().is_success(),
            Err(_) => false,
        }
    }
    
    /// Generate a ULID for new records
    pub fn generate_ulid() -> String {
        use ulid::Ulid;
        Ulid::new().to_string()
    }
    
    /// Parse JSON string safely
    pub fn parse_json<T>(json_str: &str) -> Result<T, SyncError>
    where
        T: serde::de::DeserializeOwned,
    {
        serde_json::from_str(json_str).map_err(SyncError::from)
    }
    
    /// Serialize to JSON string safely
    pub fn to_json<T>(value: &T) -> Result<String, SyncError>
    where
        T: serde::Serialize,
    {
        serde_json::to_string(value).map_err(SyncError::from)
    }
    
    /// Get current timestamp as ISO string
    pub fn current_timestamp() -> String {
        chrono::Utc::now().to_rfc3339()
    }
    
    /// Calculate sync version (increment by 1)
    pub fn increment_sync_version(current: i32) -> i32 {
        current + 1
    }
    
    /// Check if a record needs sync (is_dirty flag or sync_version mismatch)
    pub fn needs_sync(is_dirty: bool, local_version: i32, remote_version: i32) -> bool {
        is_dirty || local_version < remote_version
    }
}
