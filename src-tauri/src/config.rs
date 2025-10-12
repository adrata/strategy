use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Tauri application configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub database: DatabaseConfig,
    pub auth: AuthConfig,
    pub features: FeatureConfig,
    pub performance: PerformanceConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatabaseConfig {
    pub url: String,
    pub connection_limit: u32,
    pub timeout_seconds: u64,
    pub enable_cache: bool,
    pub cache_ttl_seconds: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthConfig {
    pub jwt_secret: String,
    pub session_timeout_hours: u64,
    pub enable_auto_refresh: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FeatureConfig {
    pub enable_voice: bool,
    pub enable_ai: bool,
    pub enable_calling: bool,
    pub enable_notifications: bool,
    pub enable_offline_mode: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceConfig {
    pub max_concurrent_requests: u32,
    pub cache_size_mb: u64,
    pub enable_compression: bool,
    pub log_level: String,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            database: DatabaseConfig {
                url: std::env::var("DATABASE_URL")
                    .unwrap_or_else(|_| "postgresql://localhost/adrata".to_string()),
                connection_limit: 20,
                timeout_seconds: 30,
                enable_cache: true,
                cache_ttl_seconds: 300, // 5 minutes
            },
            auth: AuthConfig {
                jwt_secret: std::env::var("JWT_SECRET")
                    .unwrap_or_else(|_| "desktop-jwt-secret".to_string()),
                session_timeout_hours: 24,
                enable_auto_refresh: true,
            },
            features: FeatureConfig {
                enable_voice: true,
                enable_ai: true,
                enable_calling: true,
                enable_notifications: true,
                enable_offline_mode: true,
            },
            performance: PerformanceConfig {
                max_concurrent_requests: 10,
                cache_size_mb: 100,
                enable_compression: true,
                log_level: "info".to_string(),
            },
        }
    }
}

/// Get application configuration
pub fn get_config() -> AppConfig {
    AppConfig::default()
}

/// Configuration validation
pub fn validate_config(config: &AppConfig) -> Result<(), String> {
    if config.database.url.is_empty() {
        return Err("Database URL cannot be empty".to_string());
    }
    
    if config.database.connection_limit == 0 {
        return Err("Database connection limit must be greater than 0".to_string());
    }
    
    if config.auth.jwt_secret.is_empty() {
        return Err("JWT secret cannot be empty".to_string());
    }
    
    Ok(())
}

/// Environment-specific configuration overrides
pub fn load_environment_config() -> HashMap<String, String> {
    let mut config = HashMap::new();
    
    // Load from environment variables
    if let Ok(workspace_id) = std::env::var("DEFAULT_WORKSPACE_ID") {
        config.insert("workspace_id".to_string(), workspace_id);
    }
    
    if let Ok(user_id) = std::env::var("DEFAULT_USER_ID") {
        config.insert("user_id".to_string(), user_id);
    }
    
    if let Ok(is_desktop) = std::env::var("NEXT_PUBLIC_IS_DESKTOP") {
        config.insert("is_desktop".to_string(), is_desktop);
    }
    
    config
}
