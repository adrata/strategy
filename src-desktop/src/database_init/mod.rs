use std::sync::{Arc, OnceLock};
use crate::database::models::{HybridDatabaseManager, AuthUser, DatabaseState};
use crate::database::create_database_state;

// Global database state
static DATABASE_STATE: OnceLock<DatabaseState> = OnceLock::new();

// Initialize database manager with bulletproof environment loading
pub async fn init_database_manager(app_handle: &tauri::AppHandle<tauri::Wry>) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    println!("🔗 [TAURI] ===== COMPREHENSIVE DATABASE INITIALIZATION =====");
    
    // STEP 1: Bulletproof Environment Variable Loading
    println!("🔍 [TAURI] Step 1: Loading environment variables...");
    
    // Get current working directory for diagnostics
    let current_dir = std::env::current_dir().unwrap_or_else(|_| std::path::PathBuf::from("unknown"));
    println!("🔍 [TAURI] Current working directory: {:?}", current_dir);
    
    // Try multiple environment loading strategies (now using env/ folder)
    let env_strategies = [
        ("env/.env.development.local", "env folder development"),
        ("env/.env.production", "env folder production"),
        ("env/.env.local", "env folder local"),
        ("../env/.env.development.local", "parent env folder development"),
        ("../env/.env.production", "parent env folder production"),
    ];
    
    let mut env_loaded = false;
    for (path, desc) in &env_strategies {
        match dotenvy::from_filename(path) {
            Ok(loaded_path) => {
                println!("✅ [TAURI] Environment loaded from {} ({}): {:?}", desc, path, loaded_path);
                env_loaded = true;
                break;
            },
            Err(e) => {
                println!("🔍 [TAURI] Tried {} ({}): {:?}", desc, path, e);
            }
        }
    }
    
    // Also try default .env loading
    match dotenvy::dotenv() {
        Ok(path) => {
            println!("✅ [TAURI] Default dotenv loaded: {:?}", path);
            env_loaded = true;
        },
        Err(e) => {
            println!("🔍 [TAURI] Default dotenv failed: {:?}", e);
        }
    }
    
    if !env_loaded {
        println!("⚠️ [TAURI] No .env file found, will use hardcoded production credentials");
    }
    
    // STEP 2: Comprehensive Environment Variable Setup
    println!("🔍 [TAURI] Step 2: Setting up database credentials...");
    
    // SECURITY: Never hardcode credentials - always use environment variables
    // Get DATABASE_URL from environment - fail if not set
    let _database_url = match std::env::var("DATABASE_URL") {
        Ok(url) => {
            println!("✅ [TAURI] DATABASE_URL found in environment: {}...", &url[..50.min(url.len())]);
            url
        },
        Err(_) => {
            let error_msg = "❌ [TAURI] DATABASE_URL environment variable is required but not set. Please configure it in your .env file or environment.";
            println!("{}", error_msg);
            return Err(Box::new(std::io::Error::other(error_msg)));
        }
    };
    
    // Set other critical environment variables (optional - can be set in .env)
    if std::env::var("DEFAULT_WORKSPACE_ID").is_err() {
        println!("⚠️ [TAURI] DEFAULT_WORKSPACE_ID not set (optional)");
    }
    
    if std::env::var("DEFAULT_USER_ID").is_err() {
        println!("⚠️ [TAURI] DEFAULT_USER_ID not set (optional)");
    }
    
    // STEP 3: Test Database Connection Before Creating Manager
    println!("🔍 [TAURI] Step 3: Testing database connection...");
    
    // Create and test database manager
    match HybridDatabaseManager::new(app_handle).await {
        Ok(manager) => {
            println!("✅ [TAURI] Database manager created successfully");
            
            // Store the manager globally
            let db_state = DATABASE_STATE.get_or_init(create_database_state);
            *db_state.lock().unwrap() = Some(manager);
            
            println!("✅ [TAURI] Database initialization completed successfully");
            Ok(())
        },
        Err(e) => {
            println!("❌ [TAURI] Database initialization failed: {}", e);
            Err(Box::new(std::io::Error::other(format!("Database initialization failed: {}", e))))
        }
    }
}

// Get database manager instance
pub fn get_database_manager() -> Result<Arc<HybridDatabaseManager>, String> {
    let db_state = DATABASE_STATE.get()
        .ok_or_else(|| "Database not initialized. Call initialize_database first.".to_string())?;
    
    let manager_guard = db_state.lock().unwrap();
    match &*manager_guard {
        Some(manager) => Ok(Arc::new(manager.clone())),
        None => Err("Database manager not available".to_string())
    }
}

// Authentication command
#[tauri::command]
pub async fn authenticate_user_direct(email: String, password: String) -> Result<Option<AuthUser>, String> {
    println!("🔐 [TAURI] Authenticating user: {}", email);
    
    // Get database manager
    let db_manager = get_database_manager()?;
    
    // Authenticate user
    match db_manager.authenticate_user(&email, &password).await {
        Ok(user) => {
            if let Some(ref user) = user {
                println!("✅ [TAURI] User authenticated successfully: {}", user.name);
            } else {
                println!("❌ [TAURI] Authentication failed: Invalid credentials");
            }
            Ok(user)
        },
        Err(e) => {
            println!("❌ [TAURI] Authentication error: {}", e);
            Err(format!("Authentication failed: {}", e))
        }
    }
}

// Platform info command
#[tauri::command]
pub async fn _get_platform_info() -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({
        "platform": std::env::consts::OS,
        "arch": std::env::consts::ARCH,
        "family": std::env::consts::FAMILY
    }))
}

// Test database connection command
#[tauri::command]
pub async fn test_database_connection() -> Result<bool, String> {
    println!("🔌 [TAURI] Testing database connection...");
    
    let db_manager = get_database_manager()?;
    
    match db_manager.test_connection().await {
        Ok(is_connected) => {
            if is_connected {
                println!("✅ [TAURI] Database connection test successful");
            } else {
                println!("❌ [TAURI] Database connection test failed");
            }
            Ok(is_connected)
        },
        Err(e) => {
            let error_msg = format!("Database connection test error: {}", e);
            println!("❌ [TAURI] {}", error_msg);
            Err(error_msg)
        }
    }
}

#[tauri::command]
pub async fn initialize_user_auth(email: String, password: String) -> Result<serde_json::Value, String> {
    println!("🔐 [TAURI] Initializing user authentication for: {}", email);
    
    let db_manager = get_database_manager()?;
    
    match db_manager.authenticate_user(&email, &password).await {
        Ok(Some(user)) => {
            println!("✅ [TAURI] User authenticated successfully: {}", user.name);
            Ok(serde_json::json!({
                "success": true,
                "user": {
                    "id": user.id,
                    "name": user.name,
                    "email": user.email,
                    "workspaces": user.workspaces
                },
                "message": "Authentication successful",
                "timestamp": chrono::Utc::now().to_rfc3339()
            }))
        },
        Ok(None) => {
            let error_msg = "Invalid email or password".to_string();
            println!("❌ [TAURI] {}", error_msg);
            Err(error_msg)
        },
        Err(e) => {
            let error_msg = format!("Authentication error: {}", e);
            println!("❌ [TAURI] {}", error_msg);
            Err(error_msg)
        }
    }
}

#[tauri::command]
pub async fn initialize_database(app_handle: tauri::AppHandle<tauri::Wry>) -> Result<serde_json::Value, String> {
    println!("🚀 [TAURI] Initializing database system...");
    
    match init_database_manager(&app_handle).await {
        Ok(_) => {
            println!("✅ [TAURI] Database system initialized successfully");
            Ok(serde_json::json!({
                "success": true,
                "message": "Database system initialized successfully",
                "timestamp": chrono::Utc::now().to_rfc3339()
            }))
        },
        Err(e) => {
            let error_msg = format!("Failed to initialize database: {}", e);
            println!("❌ [TAURI] {}", error_msg);
            Err(error_msg)
        }
    }
} 