use std::path::{Path, PathBuf};
use std::fs;
use std::io;
use tauri::command;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct EncodeFileInfo {
    pub name: String,
    pub path: String,
    pub is_directory: bool,
    pub size: u64,
    pub modified: String,
    pub content: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EncodeProjectInfo {
    pub name: String,
    pub path: String,
    pub files: Vec<EncodeFileInfo>,
}

/// Read directory contents
#[command]
pub async fn encode_read_directory(path: String) -> Result<Vec<EncodeFileInfo>, String> {
    let path = Path::new(&path);
    
    if !path.exists() {
        return Err("Path does not exist".to_string());
    }
    
    if !path.is_dir() {
        return Err("Path is not a directory".to_string());
    }
    
    let mut files = Vec::new();
    
    match fs::read_dir(path) {
        Ok(entries) => {
            for entry in entries {
                match entry {
                    Ok(entry) => {
                        let path = entry.path();
                        let metadata = match entry.metadata() {
                            Ok(meta) => meta,
                            Err(_) => continue,
                        };
                        
                        let name = match path.file_name() {
                            Some(name) => name.to_string_lossy().to_string(),
                            None => continue,
                        };
                        
                        let is_directory = metadata.is_dir();
                        let size = if is_directory { 0 } else { metadata.len() };
                        let modified = match metadata.modified() {
                            Ok(time) => format!("{:?}", time),
                            Err(_) => "Unknown".to_string(),
                        };
                        
                        files.push(EncodeFileInfo {
                            name,
                            path: path.to_string_lossy().to_string(),
                            is_directory,
                            size,
                            modified,
                            content: None,
                        });
                    }
                    Err(_) => continue,
                }
            }
        }
        Err(e) => return Err(format!("Failed to read directory: {}", e)),
    }
    
    // Sort files: directories first, then files, both alphabetically
    files.sort_by(|a, b| {
        match (a.is_directory, b.is_directory) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        }
    });
    
    Ok(files)
}

/// Read file content
#[command]
pub async fn encode_read_file(path: String) -> Result<String, String> {
    let path = Path::new(&path);
    
    if !path.exists() {
        return Err("File does not exist".to_string());
    }
    
    if path.is_dir() {
        return Err("Path is a directory, not a file".to_string());
    }
    
    match fs::read_to_string(path) {
        Ok(content) => Ok(content),
        Err(e) => Err(format!("Failed to read file: {}", e)),
    }
}

/// Write file content
#[command]
pub async fn encode_write_file(path: String, content: String) -> Result<(), String> {
    let path = Path::new(&path);
    
    // Create parent directories if they don't exist
    if let Some(parent) = path.parent() {
        if let Err(e) = fs::create_dir_all(parent) {
            return Err(format!("Failed to create parent directories: {}", e));
        }
    }
    
    match fs::write(path, content) {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Failed to write file: {}", e)),
    }
}

/// Create directory
#[command]
pub async fn encode_create_directory(path: String) -> Result<(), String> {
    let path = Path::new(&path);
    
    if path.exists() {
        return Err("Directory already exists".to_string());
    }
    
    match fs::create_dir_all(path) {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Failed to create directory: {}", e)),
    }
}

/// Delete file or directory
#[command]
pub async fn encode_delete_path(path: String) -> Result<(), String> {
    let path = Path::new(&path);
    
    if !path.exists() {
        return Err("Path does not exist".to_string());
    }
    
    if path.is_dir() {
        match fs::remove_dir_all(path) {
            Ok(_) => Ok(()),
            Err(e) => Err(format!("Failed to delete directory: {}", e)),
        }
    } else {
        match fs::remove_file(path) {
            Ok(_) => Ok(()),
            Err(e) => Err(format!("Failed to delete file: {}", e)),
        }
    }
}

/// Rename/move file or directory
#[command]
pub async fn encode_rename_path(old_path: String, new_path: String) -> Result<(), String> {
    let old_path = Path::new(&old_path);
    let new_path = Path::new(&new_path);
    
    if !old_path.exists() {
        return Err("Source path does not exist".to_string());
    }
    
    if new_path.exists() {
        return Err("Destination path already exists".to_string());
    }
    
    // Create parent directories for new path if needed
    if let Some(parent) = new_path.parent() {
        if let Err(e) = fs::create_dir_all(parent) {
            return Err(format!("Failed to create parent directories: {}", e));
        }
    }
    
    match fs::rename(old_path, new_path) {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Failed to rename/move: {}", e)),
    }
}

/// Copy file or directory
#[command]
pub async fn encode_copy_path(source_path: String, dest_path: String) -> Result<(), String> {
    let source = Path::new(&source_path);
    let dest = Path::new(&dest_path);
    
    if !source.exists() {
        return Err("Source path does not exist".to_string());
    }
    
    if dest.exists() {
        return Err("Destination path already exists".to_string());
    }
    
    // Create parent directories for destination if needed
    if let Some(parent) = dest.parent() {
        if let Err(e) = fs::create_dir_all(parent) {
            return Err(format!("Failed to create parent directories: {}", e));
        }
    }
    
    if source.is_dir() {
        copy_dir_recursive(source, dest)?;
    } else {
        match fs::copy(source, dest) {
            Ok(_) => Ok(()),
            Err(e) => Err(format!("Failed to copy file: {}", e)),
        }
    }
}

/// Recursively copy directory
fn copy_dir_recursive(src: &Path, dst: &Path) -> Result<(), String> {
    match fs::create_dir(dst) {
        Ok(_) => {},
        Err(e) => return Err(format!("Failed to create directory: {}", e)),
    }
    
    for entry in fs::read_dir(src).map_err(|e| format!("Failed to read directory: {}", e))? {
        let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());
        
        if src_path.is_dir() {
            copy_dir_recursive(&src_path, &dst_path)?;
        } else {
            fs::copy(&src_path, &dst_path).map_err(|e| format!("Failed to copy file: {}", e))?;
        }
    }
    
    Ok(())
}

/// Get file info
#[command]
pub async fn encode_get_file_info(path: String) -> Result<EncodeFileInfo, String> {
    let path = Path::new(&path);
    
    if !path.exists() {
        return Err("Path does not exist".to_string());
    }
    
    let metadata = match fs::metadata(path) {
        Ok(meta) => meta,
        Err(e) => return Err(format!("Failed to get file metadata: {}", e)),
    };
    
    let name = match path.file_name() {
        Some(name) => name.to_string_lossy().to_string(),
        None => return Err("Invalid file name".to_string()),
    };
    
    let is_directory = metadata.is_dir();
    let size = if is_directory { 0 } else { metadata.len() };
    let modified = match metadata.modified() {
        Ok(time) => format!("{:?}", time),
        Err(_) => "Unknown".to_string(),
    };
    
    Ok(EncodeFileInfo {
        name,
        path: path.to_string_lossy().to_string(),
        is_directory,
        size,
        modified,
        content: None,
    })
}

/// Check if path exists
#[command]
pub async fn encode_path_exists(path: String) -> Result<bool, String> {
    Ok(Path::new(&path).exists())
}

/// Get current working directory
#[command]
pub async fn encode_get_current_dir() -> Result<String, String> {
    match std::env::current_dir() {
        Ok(path) => Ok(path.to_string_lossy().to_string()),
        Err(e) => Err(format!("Failed to get current directory: {}", e)),
    }
}

/// Set current working directory
#[command]
pub async fn encode_set_current_dir(path: String) -> Result<(), String> {
    match std::env::set_current_dir(&path) {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Failed to set current directory: {}", e)),
    }
}

/// Get home directory
#[command]
pub async fn encode_get_home_dir() -> Result<String, String> {
    match dirs::home_dir() {
        Some(path) => Ok(path.to_string_lossy().to_string()),
        None => Err("Failed to get home directory".to_string()),
    }
}

/// Get documents directory
#[command]
pub async fn encode_get_documents_dir() -> Result<String, String> {
    match dirs::document_dir() {
        Some(path) => Ok(path.to_string_lossy().to_string()),
        None => Err("Failed to get documents directory".to_string()),
    }
}

/// Get desktop directory
#[command]
pub async fn encode_get_desktop_dir() -> Result<String, String> {
    match dirs::desktop_dir() {
        Some(path) => Ok(path.to_string_lossy().to_string()),
        None => Err("Failed to get desktop directory".to_string()),
    }
}

/// Get downloads directory
#[command]
pub async fn encode_get_downloads_dir() -> Result<String, String> {
    match dirs::download_dir() {
        Some(path) => Ok(path.to_string_lossy().to_string()),
        None => Err("Failed to get downloads directory".to_string()),
    }
}

/// Watch directory for changes (placeholder for future implementation)
#[command]
pub async fn encode_watch_directory(path: String) -> Result<String, String> {
    // This would require implementing file watching with notify crate
    // For now, return a placeholder
    Ok(format!("Watching directory: {}", path))
}

/// Stop watching directory (placeholder for future implementation)
#[command]
pub async fn encode_unwatch_directory(watch_id: String) -> Result<(), String> {
    // This would require implementing file watching with notify crate
    // For now, return success
    Ok(())
}
