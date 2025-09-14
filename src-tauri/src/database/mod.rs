pub mod models;
pub mod auth;
pub mod crm;
pub mod speedrun;
pub mod calendar;

// Re-export commonly used types
pub use models::{
    HybridDatabaseManager, DatabaseState, DatabaseConnection
};

use sqlx::{SqlitePool, migrate::MigrateDatabase, Sqlite};
use tauri::Manager;
use std::sync::{Arc, Mutex};
use tokio::sync::RwLock;

impl HybridDatabaseManager {
    /// Initialize database manager
    pub async fn new(app_handle: &tauri::AppHandle<tauri::Wry>) -> Result<Self, Box<dyn std::error::Error + Send + Sync>> {
        println!("🔗 [DATABASE INIT] ===== INITIALIZING DATABASE MANAGER =====");
        
        // Environment variables should already be loaded by lib.rs
        println!("🔗 [DATABASE INIT] Using environment variables set by main initialization");
        
        // Get database URL (should be set by lib.rs initialization)
        let production_neon_url = std::env::var("DATABASE_URL")
            .expect("DATABASE_URL should have been set by lib.rs initialization");
        
        println!("🔗 [DATABASE INIT] Using production Neon database");
        println!("🔗 [DATABASE INIT] Database URL: postgresql://neondb_owner:***@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb");
        
        // Connect to production PostgreSQL with retry logic
        println!("🔗 [DATABASE INIT] Connecting to production PostgreSQL...");
        
        let postgres = match sqlx::PgPool::connect(&production_neon_url).await {
            Ok(pool) => {
                println!("✅ [DATABASE INIT] PostgreSQL connection successful!");
                
                // Verify connection with a simple query
                match sqlx::query("SELECT 1 as health_check").fetch_one(&pool).await {
                    Ok(_) => {
                        println!("✅ [DATABASE INIT] PostgreSQL health check passed");
                    },
                    Err(e) => {
                        println!("⚠️ [DATABASE INIT] PostgreSQL health check failed: {}", e);
                        // Continue anyway, might be a permissions issue with the health check query
                    }
                }
                
                pool
            },
            Err(e) => {
                println!("❌ [DATABASE INIT] PostgreSQL connection failed: {}", e);
                println!("❌ [DATABASE INIT] Attempted URL: {}...", &production_neon_url[..50]);
                return Err(Box::new(e));
            }
        };
        
        // Setup SQLite cache database with enhanced error handling
        println!("🔗 [DATABASE INIT] Setting up SQLite cache...");
        
        let app_data_dir = match app_handle.path().app_data_dir() {
            Ok(dir) => {
                println!("✅ [DATABASE INIT] App data directory: {:?}", dir);
                dir
            },
            Err(e) => {
                println!("❌ [DATABASE INIT] Failed to get app data directory: {}", e);
                return Err(format!("Failed to get app data directory: {}", e).into());
            }
        };
        
        if !app_data_dir.exists() {
            println!("🔗 [DATABASE INIT] Creating app data directory...");
            if let Err(e) = std::fs::create_dir_all(&app_data_dir) {
                println!("❌ [DATABASE INIT] Failed to create app data directory: {}", e);
                return Err(format!("Failed to create app data directory: {}", e).into());
            }
        }
        
        let cache_db_path = app_data_dir.join("cache.db");
        println!("🔗 [DATABASE INIT] SQLite cache path: {:?}", cache_db_path);
        
        let cache_db_url = format!("sqlite:{}", cache_db_path.to_string_lossy());
        
        // Create SQLite database if it doesn't exist
        if !Sqlite::database_exists(&cache_db_url).await.unwrap_or(false) {
            println!("🔗 [DATABASE INIT] Creating SQLite cache database...");
            if let Err(e) = Sqlite::create_database(&cache_db_url).await {
                println!("⚠️ [DATABASE INIT] Failed to create SQLite database: {}", e);
                // Continue without SQLite cache
            }
        }
        
        let sqlite = match SqlitePool::connect(&cache_db_url).await {
            Ok(pool) => {
                println!("✅ [DATABASE INIT] SQLite cache connection successful!");
                Some(pool)
            },
            Err(e) => {
                println!("⚠️ [DATABASE INIT] SQLite cache failed (continuing without cache): {}", e);
                None
            }
        };
        
        // Create hybrid database connection
        let connection = DatabaseConnection::Production { postgres, sqlite };
        
        println!("✅ [DATABASE INIT] Database manager initialized successfully!");
        println!("✅ [DATABASE INIT] Mode: Production (Neon PostgreSQL + SQLite cache)");
                
        Ok(Self {
            connection: Arc::new(RwLock::new(connection)),
        })
    }

    /// Test database connection
    pub async fn test_connection(&self) -> Result<bool, Box<dyn std::error::Error + Send + Sync>> {
        println!("🔍 [DATABASE] Testing database connection...");
        
        let connection = self.connection.read().await;
        
        match &*connection {
            DatabaseConnection::Production { postgres, .. } => {
                match sqlx::query("SELECT 1 as test").fetch_one(postgres).await {
                    Ok(_) => {
                        println!("✅ [DATABASE] Connection test successful");
                        Ok(true)
                    },
                    Err(e) => {
                        println!("❌ [DATABASE] Connection test failed: {}", e);
                        Err(e.into())
                    }
                }
            },
            DatabaseConnection::_Hybrid { sqlite } => {
                match sqlx::query("SELECT 1 as test").fetch_one(sqlite).await {
                    Ok(_) => {
                        println!("✅ [DATABASE] SQLite connection test successful");
                        Ok(true)
                    },
                    Err(e) => {
                        println!("❌ [DATABASE] SQLite connection test failed: {}", e);
                        Err(e.into())
                    }
                }
            }
        }
    }
}

/// Create database state for Tauri state management
pub fn create_database_state() -> DatabaseState {
    Arc::new(Mutex::new(None))
} 