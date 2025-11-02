/**
 * 🖥️ DESKTOP INITIALIZATION
 * Tauri commands for desktop app initialization and extension management
 */

use tauri::{command, Manager};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize)]
pub struct DesktopConfig {
    pub first_launch: bool,
    pub auto_download_extensions: bool,
    pub storage_limit_mb: u64,
    pub user_id: Option<String>,
    pub account_id: Option<String>,
    pub selected_region: String,
    pub currency: String,
    pub installed_extensions: Vec<InstalledExtension>,
    pub last_updated: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InstalledExtension {
    pub id: String,
    pub name: String,
    pub version: String,
    pub file_size_mb: f64,
    pub install_path: String,
    pub install_date: String,
    pub last_used: String,
    pub is_enabled: bool,
    pub license_key: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StorageInfo {
    pub total_used_mb: f64,
    pub total_available_mb: f64,
    pub extensions_path: String,
    pub applications_path: String,
    pub cache_size_mb: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DownloadProgress {
    pub extension_id: String,
    pub progress: u8,
    pub status: String,
    pub error: Option<String>,
}

impl Default for DesktopConfig {
    fn default() -> Self {
        Self {
            first_launch: true,
            auto_download_extensions: false, // Important: defaults to false
            storage_limit_mb: 1000,
            user_id: None,
            account_id: None,
            selected_region: "us".to_string(),
            currency: "USD".to_string(),
            installed_extensions: Vec::new(),
            last_updated: chrono::Utc::now().to_rfc3339(),
        }
    }
}

/// Initialize desktop app on first launch
#[command]
pub async fn initialize_desktop_app(app_handle: tauri::AppHandle<tauri::Wry>) -> Result<DesktopConfig, String> {
    let config_path = get_config_path(&app_handle)?;
    
    // Check if config exists
    if config_path.exists() {
        // Load existing config
        let config_content = fs::read_to_string(&config_path)
            .map_err(|e| format!("Failed to read config: {}", e))?;
        
        let mut config: DesktopConfig = serde_json::from_str(&config_content)
            .map_err(|e| format!("Failed to parse config: {}", e))?;
        
        // Update first_launch to false if it was true
        if config.first_launch {
            config.first_launch = false;
            save_config(&app_handle, &config)?;
        }
        
        Ok(config)
    } else {
        // Create new config with defaults
        let config = DesktopConfig::default();
        
        // Create necessary directories
        create_app_directories(&app_handle)?;
        
        // Save initial config
        save_config(&app_handle, &config)?;
        
        Ok(config)
    }
}

/// Get current storage information
#[command]
pub async fn get_storage_info(app_handle: tauri::AppHandle<tauri::Wry>) -> Result<StorageInfo, String> {
    let app_data_dir = get_app_data_dir(&app_handle)?;
    let extensions_dir = app_data_dir.join("extensions");
    let applications_dir = app_data_dir.join("applications");
    let cache_dir = app_data_dir.join("cache");
    
    let extensions_size = calculate_directory_size(&extensions_dir);
    let applications_size = calculate_directory_size(&applications_dir);
    let cache_size = calculate_directory_size(&cache_dir);
    
    let total_used = extensions_size + applications_size + cache_size;
    
    Ok(StorageInfo {
        total_used_mb: bytes_to_mb(total_used),
        total_available_mb: 1000.0, // Simplified - in production, get actual available space
        extensions_path: extensions_dir.to_string_lossy().to_string(),
        applications_path: applications_dir.to_string_lossy().to_string(),
        cache_size_mb: bytes_to_mb(cache_size),
    })
}

/// Check if extension is installed
#[command]
pub async fn is_extension_installed(app_handle: tauri::AppHandle<tauri::Wry>, extension_id: String) -> Result<bool, String> {
    let config = load_config(&app_handle)?;
    Ok(config.installed_extensions.iter().any(|ext| ext.id == extension_id))
}

/// Get list of installed extensions
#[command]
pub async fn get_installed_extensions(app_handle: tauri::AppHandle<tauri::Wry>) -> Result<Vec<InstalledExtension>, String> {
    let config = load_config(&app_handle)?;
    Ok(config.installed_extensions)
}

/// Download and install extension
#[command]
pub async fn download_extension(
    app_handle: tauri::AppHandle<tauri::Wry>,
    extension_id: String,
    _download_url: String,
    extension_name: String,
    version: String,
    file_size_mb: f64,
    license_key: Option<String>,
) -> Result<(), String> {
    // Check if already installed
    if is_extension_installed(app_handle.clone(), extension_id.clone()).await? {
        return Err("Extension is already installed".to_string());
    }
    
    // Check available space
    let storage_info = get_storage_info(app_handle.clone()).await?;
    if storage_info.total_used_mb + file_size_mb > storage_info.total_available_mb {
        return Err("Insufficient storage space".to_string());
    }
    
    // Create extension directory
    let app_data_dir = get_app_data_dir(&app_handle)?;
    let extension_dir = app_data_dir.join("extensions").join(&extension_id);
    fs::create_dir_all(&extension_dir)
        .map_err(|e| format!("Failed to create extension directory: {}", e))?;
    
    // Simulate download (in production, implement actual HTTP download)
    tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
    
    // Create mock files
    let mock_files = vec!["manifest.json", "index.js", "style.css", "icon.png"];
    for file_name in mock_files {
        let file_path = extension_dir.join(file_name);
        fs::write(&file_path, format!("Mock content for {}", file_name))
            .map_err(|e| format!("Failed to write file: {}", e))?;
    }
    
    // Update config with new extension
    let mut config = load_config(&app_handle)?;
    let installed_extension = InstalledExtension {
        id: extension_id,
        name: extension_name,
        version,
        file_size_mb,
        install_path: extension_dir.to_string_lossy().to_string(),
        install_date: chrono::Utc::now().to_rfc3339(),
        last_used: chrono::Utc::now().to_rfc3339(),
        is_enabled: true,
        license_key,
    };
    
    config.installed_extensions.push(installed_extension);
    config.last_updated = chrono::Utc::now().to_rfc3339();
    
    save_config(&app_handle, &config)?;
    
    Ok(())
}

/// Uninstall extension
#[command]
pub async fn uninstall_extension(app_handle: tauri::AppHandle<tauri::Wry>, extension_id: String) -> Result<(), String> {
    let mut config = load_config(&app_handle)?;
    
    // Find and remove extension from config
    let extension_index = config.installed_extensions
        .iter()
        .position(|ext| ext.id == extension_id)
        .ok_or("Extension not found")?;
    
    let extension = config.installed_extensions.remove(extension_index);
    
    // Remove extension files
    let extension_path = PathBuf::from(&extension.install_path);
    if extension_path.exists() {
        fs::remove_dir_all(&extension_path)
            .map_err(|e| format!("Failed to remove extension files: {}", e))?;
    }
    
    // Update config
    config.last_updated = chrono::Utc::now().to_rfc3339();
    save_config(&app_handle, &config)?;
    
    Ok(())
}

/// Toggle extension enabled/disabled
#[command]
pub async fn toggle_extension(app_handle: tauri::AppHandle<tauri::Wry>, extension_id: String, enabled: bool) -> Result<(), String> {
    let mut config = load_config(&app_handle)?;
    
    // Find and update extension
    if let Some(extension) = config.installed_extensions.iter_mut().find(|ext| ext.id == extension_id) {
        extension.is_enabled = enabled;
        extension.last_used = chrono::Utc::now().to_rfc3339();
        
        config.last_updated = chrono::Utc::now().to_rfc3339();
        save_config(&app_handle, &config)?;
        
        Ok(())
    } else {
        Err("Extension not found".to_string())
    }
}

/// Clean up cache and temporary files
#[command]
pub async fn cleanup_cache(app_handle: tauri::AppHandle<tauri::Wry>) -> Result<f64, String> {
    let app_data_dir = get_app_data_dir(&app_handle)?;
    let cache_dir = app_data_dir.join("cache");
    
    let cache_size = calculate_directory_size(&cache_dir);
    
    if cache_dir.exists() {
        fs::remove_dir_all(&cache_dir)
            .map_err(|e| format!("Failed to remove cache directory: {}", e))?;
        
        // Recreate empty cache directory
        fs::create_dir_all(&cache_dir)
            .map_err(|e| format!("Failed to recreate cache directory: {}", e))?;
    }
    
    Ok(bytes_to_mb(cache_size))
}

/// Update desktop configuration
#[command]
pub async fn update_desktop_config(
    app_handle: tauri::AppHandle<tauri::Wry>,
    auto_download_extensions: Option<bool>,
    storage_limit_mb: Option<u64>,
    selected_region: Option<String>,
    currency: Option<String>,
) -> Result<(), String> {
    let mut config = load_config(&app_handle)?;
    
    if let Some(auto_download) = auto_download_extensions {
        config.auto_download_extensions = auto_download;
    }
    
    if let Some(limit) = storage_limit_mb {
        config.storage_limit_mb = limit;
    }
    
    if let Some(region) = selected_region {
        config.selected_region = region;
    }
    
    if let Some(curr) = currency {
        config.currency = curr;
    }
    
    config.last_updated = chrono::Utc::now().to_rfc3339();
    save_config(&app_handle, &config)?;
    
    Ok(())
}

/// Export extension list for backup
#[command]
pub async fn export_extension_list(app_handle: tauri::AppHandle<tauri::Wry>) -> Result<String, String> {
    let config = load_config(&app_handle)?;
    
    let export_data = serde_json::json!({
        "extensions": config.installed_extensions,
        "export_date": chrono::Utc::now().to_rfc3339(),
        "version": "1.0.0"
    });
    
    serde_json::to_string_pretty(&export_data)
        .map_err(|e| format!("Failed to serialize export data: {}", e))
}

// Helper functions

fn get_app_data_dir(app_handle: &tauri::AppHandle<tauri::Wry>) -> Result<PathBuf, String> {
    app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))
}

fn get_config_path(app_handle: &tauri::AppHandle<tauri::Wry>) -> Result<PathBuf, String> {
    let app_data_dir = get_app_data_dir(app_handle)?;
    Ok(app_data_dir.join("config.json"))
}

fn load_config(app_handle: &tauri::AppHandle<tauri::Wry>) -> Result<DesktopConfig, String> {
    let config_path = get_config_path(app_handle)?;
    
    if config_path.exists() {
        let config_content = fs::read_to_string(&config_path)
            .map_err(|e| format!("Failed to read config: {}", e))?;
        
        serde_json::from_str(&config_content)
            .map_err(|e| format!("Failed to parse config: {}", e))
    } else {
        Ok(DesktopConfig::default())
    }
}

fn save_config(app_handle: &tauri::AppHandle<tauri::Wry>, config: &DesktopConfig) -> Result<(), String> {
    let config_path = get_config_path(app_handle)?;
    
    // Ensure parent directory exists
    if let Some(parent) = config_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create config directory: {}", e))?;
    }
    
    let config_json = serde_json::to_string_pretty(config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    
    fs::write(&config_path, config_json)
        .map_err(|e| format!("Failed to write config: {}", e))?;
    
    Ok(())
}

fn create_app_directories(app_handle: &tauri::AppHandle<tauri::Wry>) -> Result<(), String> {
    let app_data_dir = get_app_data_dir(app_handle)?;
    
    let directories = vec![
        app_data_dir.join("extensions"),
        app_data_dir.join("applications"),
        app_data_dir.join("cache"),
        app_data_dir.join("logs"),
    ];
    
    for dir in directories {
        fs::create_dir_all(&dir)
            .map_err(|e| format!("Failed to create directory {}: {}", dir.display(), e))?;
    }
    
    Ok(())
}

fn calculate_directory_size(dir: &PathBuf) -> u64 {
    if !dir.exists() {
        return 0;
    }
    
    let mut total_size = 0;
    
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                if let Ok(metadata) = fs::metadata(&path) {
                    total_size += metadata.len();
                }
            } else if path.is_dir() {
                total_size += calculate_directory_size(&path);
            }
        }
    }
    
    total_size
}

fn bytes_to_mb(bytes: u64) -> f64 {
    bytes as f64 / (1024.0 * 1024.0)
} 