// ====================================================================
// SYNC ENGINE TAURI COMMANDS
// ====================================================================
//
// This module provides Tauri commands for the sync engine,
// allowing the frontend to interact with the offline-first
// synchronization system.
// ====================================================================

use super::*;
use crate::database_init::get_database_manager;
use serde::{Deserialize, Serialize};

// ====================================================================
// SYNC WORKSPACE COMMAND
// ====================================================================

#[tauri::command]
pub async fn sync_workspace(workspace_id: String) -> Result<SyncReport, String> {
    println!("🔄 [SYNC COMMAND] Starting workspace sync for: {}", workspace_id);
    
    // Get database manager
    let db_manager = get_database_manager()?;
    
    // Create sync engine
    let config = SyncConfig::default();
    let sync_engine = SyncEngine::new(
        db_manager.get_sqlite_pool().await?,
        db_manager.get_postgres_pool().await?,
        config,
    );
    
    // Perform sync
    match sync_engine.sync_workspace(&workspace_id).await {
        Ok(report) => {
            println!("✅ [SYNC COMMAND] Workspace sync completed successfully");
            Ok(report)
        }
        Err(e) => {
            println!("❌ [SYNC COMMAND] Workspace sync failed: {}", e);
            Err(e.to_string())
        }
    }
}

// ====================================================================
// SYNC TABLE COMMAND
// ====================================================================

#[tauri::command]
pub async fn sync_table(table_name: String, workspace_id: String) -> Result<SyncResult, String> {
    println!("🔄 [SYNC COMMAND] Syncing table: {} for workspace: {}", table_name, workspace_id);
    
    // Get database manager
    let db_manager = get_database_manager()?;
    
    // Create sync engine
    let config = SyncConfig::default();
    let sync_engine = SyncEngine::new(
        db_manager.get_sqlite_pool().await?,
        db_manager.get_postgres_pool().await?,
        config,
    );
    
    // Perform table sync
    match sync_engine.sync_table(&table_name, &workspace_id).await {
        Ok(result) => {
            println!("✅ [SYNC COMMAND] Table sync completed successfully");
            Ok(result)
        }
        Err(e) => {
            println!("❌ [SYNC COMMAND] Table sync failed: {}", e);
            Err(e.to_string())
        }
    }
}

// ====================================================================
// PUSH CHANGES COMMAND
// ====================================================================

#[tauri::command]
pub async fn push_changes(workspace_id: String) -> Result<SyncResult, String> {
    println!("📤 [SYNC COMMAND] Pushing changes for workspace: {}", workspace_id);
    
    // Get database manager
    let db_manager = get_database_manager()?;
    
    // Create sync engine
    let config = SyncConfig::default();
    let sync_engine = SyncEngine::new(
        db_manager.get_sqlite_pool().await?,
        db_manager.get_postgres_pool().await?,
        config,
    );
    
    // Push changes
    match sync_engine.push_changes(&workspace_id).await {
        Ok(result) => {
            println!("✅ [SYNC COMMAND] Push changes completed successfully");
            Ok(result)
        }
        Err(e) => {
            println!("❌ [SYNC COMMAND] Push changes failed: {}", e);
            Err(e.to_string())
        }
    }
}

// ====================================================================
// PULL CHANGES COMMAND
// ====================================================================

#[tauri::command]
pub async fn pull_changes(workspace_id: String) -> Result<SyncResult, String> {
    println!("📥 [SYNC COMMAND] Pulling changes for workspace: {}", workspace_id);
    
    // Get database manager
    let db_manager = get_database_manager()?;
    
    // Create sync engine
    let config = SyncConfig::default();
    let sync_engine = SyncEngine::new(
        db_manager.get_sqlite_pool().await?,
        db_manager.get_postgres_pool().await?,
        config,
    );
    
    // Pull changes
    match sync_engine.pull_changes(&workspace_id).await {
        Ok(result) => {
            println!("✅ [SYNC COMMAND] Pull changes completed successfully");
            Ok(result)
        }
        Err(e) => {
            println!("❌ [SYNC COMMAND] Pull changes failed: {}", e);
            Err(e.to_string())
        }
    }
}

// ====================================================================
// RESOLVE CONFLICT COMMAND
// ====================================================================

#[tauri::command]
pub async fn resolve_conflict(conflict_id: i64, resolution: ConflictResolution) -> Result<(), String> {
    println!("🔧 [SYNC COMMAND] Resolving conflict: {} with resolution: {:?}", conflict_id, resolution);
    
    // Get database manager
    let db_manager = get_database_manager()?;
    
    // Create conflict resolver
    let conflict_resolver = ConflictResolver::new(db_manager.get_sqlite_pool().await?);
    
    // Resolve conflict
    match conflict_resolver.resolve_conflict(conflict_id, resolution).await {
        Ok(()) => {
            println!("✅ [SYNC COMMAND] Conflict resolved successfully");
            Ok(())
        }
        Err(e) => {
            println!("❌ [SYNC COMMAND] Conflict resolution failed: {}", e);
            Err(e.to_string())
        }
    }
}

// ====================================================================
// GET SYNC STATUS COMMAND
// ====================================================================

#[tauri::command]
pub async fn get_sync_status() -> Result<SyncStatusResponse, String> {
    println!("📊 [SYNC COMMAND] Getting sync status");
    
    // Get database manager
    let db_manager = get_database_manager()?;
    
    // Create sync engine
    let config = SyncConfig::default();
    let sync_engine = SyncEngine::new(
        db_manager.get_sqlite_pool().await?,
        db_manager.get_postgres_pool().await?,
        config,
    );
    
    // Get sync status
    match sync_engine.get_sync_status().await {
        Ok(status) => {
            println!("✅ [SYNC COMMAND] Sync status retrieved successfully");
            Ok(status)
        }
        Err(e) => {
            println!("❌ [SYNC COMMAND] Failed to get sync status: {}", e);
            Err(e.to_string())
        }
    }
}

// ====================================================================
// ENABLE BACKGROUND SYNC COMMAND
// ====================================================================

#[tauri::command]
pub async fn enable_background_sync(interval_minutes: u32) -> Result<(), String> {
    println!("🔄 [SYNC COMMAND] Enabling background sync with {} minute interval", interval_minutes);
    
    // Get database manager
    let db_manager = get_database_manager()?;
    
    // Create sync engine
    let config = SyncConfig::default();
    let sync_engine = SyncEngine::new(
        db_manager.get_sqlite_pool().await?,
        db_manager.get_postgres_pool().await?,
        config,
    );
    
    // Enable background sync
    match sync_engine.enable_background_sync(interval_minutes).await {
        Ok(()) => {
            println!("✅ [SYNC COMMAND] Background sync enabled successfully");
            Ok(())
        }
        Err(e) => {
            println!("❌ [SYNC COMMAND] Failed to enable background sync: {}", e);
            Err(e.to_string())
        }
    }
}

// ====================================================================
// DISABLE BACKGROUND SYNC COMMAND
// ====================================================================

#[tauri::command]
pub async fn disable_background_sync() -> Result<(), String> {
    println!("⏹️ [SYNC COMMAND] Disabling background sync");
    
    // Get database manager
    let db_manager = get_database_manager()?;
    
    // Create sync engine
    let config = SyncConfig::default();
    let sync_engine = SyncEngine::new(
        db_manager.get_sqlite_pool().await?,
        db_manager.get_postgres_pool().await?,
        config,
    );
    
    // Disable background sync
    match sync_engine.disable_background_sync().await {
        Ok(()) => {
            println!("✅ [SYNC COMMAND] Background sync disabled successfully");
            Ok(())
        }
        Err(e) => {
            println!("❌ [SYNC COMMAND] Failed to disable background sync: {}", e);
            Err(e.to_string())
        }
    }
}

// ====================================================================
// ADDITIONAL SYNC COMMANDS
// ====================================================================

#[tauri::command]
pub async fn get_sync_queue_stats() -> Result<QueueStats, String> {
    println!("📊 [SYNC COMMAND] Getting sync queue statistics");
    
    // Get database manager
    let db_manager = get_database_manager()?;
    
    // Create sync queue
    let sync_queue = SyncQueue::new(db_manager.get_sqlite_pool().await?);
    
    // Get queue stats
    match sync_queue.get_queue_stats().await {
        Ok(stats) => {
            println!("✅ [SYNC COMMAND] Queue statistics retrieved successfully");
            Ok(stats)
        }
        Err(e) => {
            println!("❌ [SYNC COMMAND] Failed to get queue statistics: {}", e);
            Err(e.to_string())
        }
    }
}

#[tauri::command]
pub async fn get_conflict_statistics() -> Result<ConflictStatistics, String> {
    println!("📊 [SYNC COMMAND] Getting conflict statistics");
    
    // Get database manager
    let db_manager = get_database_manager()?;
    
    // Create conflict resolver
    let conflict_resolver = ConflictResolver::new(db_manager.get_sqlite_pool().await?);
    
    // Get conflict stats
    match conflict_resolver.get_conflict_statistics().await {
        Ok(stats) => {
            println!("✅ [SYNC COMMAND] Conflict statistics retrieved successfully");
            Ok(stats)
        }
        Err(e) => {
            println!("❌ [SYNC COMMAND] Failed to get conflict statistics: {}", e);
            Err(e.to_string())
        }
    }
}

#[tauri::command]
pub async fn retry_failed_syncs() -> Result<i32, String> {
    println!("🔄 [SYNC COMMAND] Retrying failed syncs");
    
    // Get database manager
    let db_manager = get_database_manager()?;
    
    // Create sync queue
    let sync_queue = SyncQueue::new(db_manager.get_sqlite_pool().await?);
    
    // Retry failed syncs
    match sync_queue.retry_failed_changes().await {
        Ok(count) => {
            println!("✅ [SYNC COMMAND] Retried {} failed syncs", count);
            Ok(count)
        }
        Err(e) => {
            println!("❌ [SYNC COMMAND] Failed to retry syncs: {}", e);
            Err(e.to_string())
        }
    }
}

#[tauri::command]
pub async fn clear_failed_syncs() -> Result<(), String> {
    println!("🗑️ [SYNC COMMAND] Clearing failed syncs");
    
    // Get database manager
    let db_manager = get_database_manager()?;
    
    // Create sync queue
    let sync_queue = SyncQueue::new(db_manager.get_sqlite_pool().await?);
    
    // Clear failed syncs
    match sync_queue.clear_failed_changes().await {
        Ok(()) => {
            println!("✅ [SYNC COMMAND] Failed syncs cleared successfully");
            Ok(())
        }
        Err(e) => {
            println!("❌ [SYNC COMMAND] Failed to clear failed syncs: {}", e);
            Err(e.to_string())
        }
    }
}

#[tauri::command]
pub async fn get_sync_health() -> Result<SyncHealthStatus, String> {
    println!("🏥 [SYNC COMMAND] Getting sync health status");
    
    // Get database manager
    let db_manager = get_database_manager()?;
    
    // Create sync status manager
    let status_manager = SyncStatusManager::new(db_manager.get_sqlite_pool().await?);
    
    // Get sync health
    match status_manager.get_sync_health().await {
        Ok(health) => {
            println!("✅ [SYNC COMMAND] Sync health status retrieved successfully");
            Ok(health)
        }
        Err(e) => {
            println!("❌ [SYNC COMMAND] Failed to get sync health: {}", e);
            Err(e.to_string())
        }
    }
}
