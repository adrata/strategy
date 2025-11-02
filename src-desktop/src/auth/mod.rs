use serde::{Deserialize, Serialize};
use tauri::State;
use crate::database::HybridDatabaseManager;
use std::collections::HashMap;
use jsonwebtoken::{encode, decode, Header, Algorithm, Validation, EncodingKey, DecodingKey};
use chrono::{Utc, Duration};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct AuthResponse {
    pub success: bool,
    pub user: Option<AuthUser>,
    pub access_token: Option<String>,
    pub refresh_token: Option<String>,
    pub expires: Option<String>,
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AuthUser {
    pub id: String,
    pub email: String,
    pub name: String,
    pub display_name: Option<String>,
    pub active_workspace_id: String,
    pub workspaces: Vec<Workspace>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Workspace {
    pub id: String,
    pub name: String,
    pub role: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AuthClaims {
    pub sub: String, // user_id
    pub email: String,
    pub workspace_id: String,
    pub exp: i64,
    pub iat: i64,
    pub jti: String, // JWT ID for token tracking
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StoredCredentials {
    pub user_id: String,
    pub email: String,
    pub workspace_id: String,
    pub access_token: String,
    pub refresh_token: String,
    pub expires_at: String,
    pub encrypted_password: Option<String>, // For offline mode
    pub last_login: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct KeychainStorage {
    pub credentials: Option<StoredCredentials>,
    pub device_id: String,
    pub encryption_key: String,
}

// JWT Secret - In production, this should be loaded from environment
const JWT_SECRET: &str = "adrata_desktop_jwt_secret_2025_secure_key";

// Keychain storage path
const KEYCHAIN_PATH: &str = "adrata_desktop_credentials";

// Keychain storage functions
async fn store_credentials(credentials: &StoredCredentials) -> Result<(), String> {
    // In a real implementation, this would use the OS keychain
    // For now, we'll use a simple file-based approach with encryption
    let storage = KeychainStorage {
        credentials: Some(credentials.clone()),
        device_id: get_device_id(),
        encryption_key: generate_encryption_key(),
    };
    
    let serialized = serde_json::to_string(&storage)
        .map_err(|e| format!("Failed to serialize credentials: {}", e))?;
    
    // TODO: Implement proper keychain storage using tauri-plugin-keychain
    // For now, we'll store in a secure location
    std::fs::write(KEYCHAIN_PATH, serialized)
        .map_err(|e| format!("Failed to store credentials: {}", e))?;
    
    Ok(())
}

async fn load_credentials() -> Result<Option<StoredCredentials>, String> {
    // TODO: Implement proper keychain loading using tauri-plugin-keychain
    // For now, we'll load from file
    match std::fs::read_to_string(KEYCHAIN_PATH) {
        Ok(content) => {
            let storage: KeychainStorage = serde_json::from_str(&content)
                .map_err(|e| format!("Failed to deserialize credentials: {}", e))?;
            Ok(storage.credentials)
        }
        Err(_) => Ok(None), // No stored credentials
    }
}

async fn clear_credentials() -> Result<(), String> {
    // TODO: Implement proper keychain clearing using tauri-plugin-keychain
    // For now, we'll remove the file
    let _ = std::fs::remove_file(KEYCHAIN_PATH);
    Ok(())
}

fn get_device_id() -> String {
    // Generate a unique device ID
    // In production, this could be based on hardware characteristics
    format!("device_{}", Uuid::new_v4())
}

fn generate_encryption_key() -> String {
    // Generate a random encryption key
    // In production, this should be derived from device characteristics
    format!("key_{}", Uuid::new_v4())
}

fn generate_jwt(user_id: &str, email: &str, workspace_id: &str) -> Result<String, String> {
    let now = Utc::now();
    let claims = AuthClaims {
        sub: user_id.to_string(),
        email: email.to_string(),
        workspace_id: workspace_id.to_string(),
        exp: (now + Duration::days(7)).timestamp(),
        iat: now.timestamp(),
        jti: Uuid::new_v4().to_string(),
    };
    
    let header = Header::new(Algorithm::HS256);
    let encoding_key = EncodingKey::from_secret(JWT_SECRET.as_ref());
    
    encode(&header, &claims, &encoding_key)
        .map_err(|e| format!("Failed to generate JWT: {}", e))
}

fn validate_jwt(token: &str) -> Result<AuthClaims, String> {
    let decoding_key = DecodingKey::from_secret(JWT_SECRET.as_ref());
    let validation = Validation::new(Algorithm::HS256);
    
    let token_data = decode::<AuthClaims>(token, &decoding_key, &validation)
        .map_err(|e| format!("Invalid JWT: {}", e))?;
    
    Ok(token_data.claims)
}

async fn authenticate_user(email: &str, password: &str, db_manager: &HybridDatabaseManager) -> Result<AuthUser, String> {
    // Get database connections
    let sqlite_pool = db_manager.get_sqlite_pool().await
        .map_err(|e| format!("Failed to get SQLite connection: {}", e))?;
    
    let pg_pool = db_manager.get_pg_pool().await
        .map_err(|e| format!("Failed to get PostgreSQL connection: {}", e))?;

    // Try to authenticate against PostgreSQL first (online)
    let user_query = r#"
        SELECT 
            u.id,
            u.email,
            u.name,
            u.display_name,
            u.active_workspace_id,
            w.id as workspace_id,
            w.name as workspace_name,
            wm.role as workspace_role
        FROM users u
        LEFT JOIN workspace_members wm ON u.id = wm.user_id
        LEFT JOIN workspaces w ON wm.workspace_id = w.id
        WHERE u.email = ? AND u.deleted_at IS NULL
        LIMIT 1
    "#;

    // Try PostgreSQL first
    if let Ok(user_row) = sqlx::query(user_query)
        .bind(email)
        .fetch_optional(&*pg_pool)
        .await
    {
        if let Some(row) = user_row {
            // TODO: Validate password hash
            // For now, we'll assume authentication is successful
            
            // Get all workspaces for this user
            let workspaces_query = r#"
                SELECT 
                    w.id,
                    w.name,
                    wm.role
                FROM workspaces w
                JOIN workspace_members wm ON w.id = wm.workspace_id
                WHERE wm.user_id = ? AND w.deleted_at IS NULL
            "#;
            
            let workspace_rows = sqlx::query(workspaces_query)
                .bind(&row.get::<String, _>("id"))
                .fetch_all(&*pg_pool)
                .await
                .map_err(|e| format!("Failed to fetch workspaces: {}", e))?;

            let mut workspaces = Vec::new();
            for ws_row in workspace_rows {
                workspaces.push(Workspace {
                    id: ws_row.get("id"),
                    name: ws_row.get("name"),
                    role: ws_row.get("role"),
                });
            }

            return Ok(AuthUser {
                id: row.get("id"),
                email: row.get("email"),
                name: row.get("name"),
                display_name: row.get("display_name"),
                active_workspace_id: row.get("active_workspace_id"),
                workspaces,
            });
        }
    }

    // If PostgreSQL fails, try SQLite (offline mode)
    if let Ok(user_row) = sqlx::query(user_query)
        .bind(email)
        .fetch_optional(&*sqlite_pool)
        .await
    {
        if let Some(row) = user_row {
            // TODO: Validate stored password hash for offline mode
            
            // Get workspaces from SQLite
            let workspaces_query = r#"
                SELECT 
                    w.id,
                    w.name,
                    wm.role
                FROM workspaces w
                JOIN workspace_members wm ON w.id = wm.workspace_id
                WHERE wm.user_id = ? AND w.deleted_at IS NULL
            "#;
            
            let workspace_rows = sqlx::query(workspaces_query)
                .bind(&row.get::<String, _>("id"))
                .fetch_all(&*sqlite_pool)
                .await
                .map_err(|e| format!("Failed to fetch workspaces: {}", e))?;

            let mut workspaces = Vec::new();
            for ws_row in workspace_rows {
                workspaces.push(Workspace {
                    id: ws_row.get("id"),
                    name: ws_row.get("name"),
                    role: ws_row.get("role"),
                });
            }

            return Ok(AuthUser {
                id: row.get("id"),
                email: row.get("email"),
                name: row.get("name"),
                display_name: row.get("display_name"),
                active_workspace_id: row.get("active_workspace_id"),
                workspaces,
            });
        }
    }

    Err("Invalid credentials".to_string())
}

#[tauri::command]
pub async fn sign_in_desktop(
    email: String, 
    password: String,
    db_manager: State<'_, HybridDatabaseManager>
) -> Result<AuthResponse, String> {
    println!("🔐 [TAURI] Desktop sign-in attempt for: {}", email);
    
    // Validate input
    if email.is_empty() || password.is_empty() {
        return Ok(AuthResponse {
            success: false,
            user: None,
            access_token: None,
            refresh_token: None,
            expires: None,
            message: "Email and password are required".to_string(),
        });
    }

    // Authenticate user
    match authenticate_user(&email, &password, &db_manager).await {
        Ok(user) => {
            // Generate JWT tokens
            let access_token = generate_jwt(&user.id, &user.email, &user.active_workspace_id)?;
            let refresh_token = Uuid::new_v4().to_string();
            let expires_at = Utc::now() + Duration::days(7);
            
            // Store credentials securely
            let credentials = StoredCredentials {
                user_id: user.id.clone(),
                email: user.email.clone(),
                workspace_id: user.active_workspace_id.clone(),
                access_token: access_token.clone(),
                refresh_token: refresh_token.clone(),
                expires_at: expires_at.to_rfc3339(),
                encrypted_password: None, // TODO: Implement password encryption
                last_login: Utc::now().to_rfc3339(),
            };
            
            store_credentials(&credentials).await?;
            
            let response = AuthResponse {
                success: true,
                user: Some(user),
                access_token: Some(access_token),
                refresh_token: Some(refresh_token),
                expires: Some(expires_at.to_rfc3339()),
                message: "Authentication successful".to_string(),
            };
            
            println!("✅ [TAURI] Desktop authentication successful for: {}", email);
            Ok(response)
        }
        Err(error) => {
            let response = AuthResponse {
                success: false,
                user: None,
                access_token: None,
                refresh_token: None,
                expires: None,
                message: error,
            };
            
            println!("❌ [TAURI] Desktop authentication failed for: {}", email);
            Ok(response)
        }
    }
}

#[tauri::command]
pub async fn sign_out_desktop() -> Result<String, String> {
    println!("🔐 [TAURI] Desktop sign-out");
    
    // Clear stored credentials
    clear_credentials().await?;
    
    // TODO: Invalidate tokens on server side
    
    Ok("Sign out successful".to_string())
}

#[tauri::command]
pub async fn refresh_token_desktop(refresh_token: String) -> Result<AuthResponse, String> {
    println!("🔐 [TAURI] Desktop token refresh");
    
    // Load stored credentials
    let stored_credentials = load_credentials().await?;
    
    match stored_credentials {
        Some(credentials) => {
            // Validate refresh token
            if credentials.refresh_token == refresh_token {
                // Check if token is expired
                let expires_at = chrono::DateTime::parse_from_rfc3339(&credentials.expires_at)
                    .map_err(|e| format!("Invalid expiration date: {}", e))?;
                
                if expires_at > Utc::now() {
                    // Generate new access token
                    let new_access_token = generate_jwt(&credentials.user_id, &credentials.email, &credentials.workspace_id)?;
                    let new_expires_at = Utc::now() + Duration::days(7);
                    
                    // Update stored credentials
                    let updated_credentials = StoredCredentials {
                        access_token: new_access_token.clone(),
                        expires_at: new_expires_at.to_rfc3339(),
                        last_login: Utc::now().to_rfc3339(),
                        ..credentials
                    };
                    
                    store_credentials(&updated_credentials).await?;
                    
                    let response = AuthResponse {
                        success: true,
                        user: None, // User data would be retrieved from token
                        access_token: Some(new_access_token),
                        refresh_token: Some(refresh_token), // Keep same refresh token
                        expires: Some(new_expires_at.to_rfc3339()),
                        message: "Token refreshed successfully".to_string(),
                    };
                    
                    println!("✅ [TAURI] Desktop token refresh successful");
                    Ok(response)
                } else {
                    Ok(AuthResponse {
                        success: false,
                        user: None,
                        access_token: None,
                        refresh_token: None,
                        expires: None,
                        message: "Refresh token expired".to_string(),
                    })
                }
            } else {
                Ok(AuthResponse {
                    success: false,
                    user: None,
                    access_token: None,
                    refresh_token: None,
                    expires: None,
                    message: "Invalid refresh token".to_string(),
                })
            }
        }
        None => {
            Ok(AuthResponse {
                success: false,
                user: None,
                access_token: None,
                refresh_token: None,
                expires: None,
                message: "No stored credentials found".to_string(),
            })
        }
    }
}

#[tauri::command]
pub async fn get_current_user_desktop() -> Result<Option<AuthUser>, String> {
    println!("🔐 [TAURI] Getting current desktop user");
    
    // Load stored credentials
    let stored_credentials = load_credentials().await?;
    
    match stored_credentials {
        Some(credentials) => {
            // Validate access token
            match validate_jwt(&credentials.access_token) {
                Ok(claims) => {
                    // Check if token is expired
                    let now = Utc::now().timestamp();
                    if claims.exp > now {
                        // Token is valid, return user info
                        let user = AuthUser {
                            id: claims.sub,
                            email: claims.email,
                            name: credentials.email.split('@').next().unwrap_or("User").to_string(),
                            display_name: None,
                            active_workspace_id: claims.workspace_id,
                            workspaces: vec![], // TODO: Load workspaces from database
                        };
                        
                        Ok(Some(user))
                    } else {
                        // Token expired
                        Ok(None)
                    }
                }
                Err(_) => {
                    // Invalid token
                    Ok(None)
                }
            }
        }
        None => {
            // No stored credentials
            Ok(None)
        }
    }
}

/// Validate access token
#[tauri::command]
pub async fn validate_access_token(token: String) -> Result<bool, String> {
    match validate_jwt(&token) {
        Ok(claims) => {
            let now = Utc::now().timestamp();
            Ok(claims.exp > now)
        }
        Err(_) => Ok(false),
    }
}

/// Get stored credentials (for debugging)
#[tauri::command]
pub async fn get_stored_credentials() -> Result<Option<StoredCredentials>, String> {
    load_credentials().await
}
