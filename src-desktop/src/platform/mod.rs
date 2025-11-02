use tauri_plugin_updater::UpdaterExt;
use std::sync::Mutex;
use std::collections::HashMap;

// Global message store for notifications
static _MESSAGE_STORE: Mutex<Option<HashMap<String, Vec<serde_json::Value>>>> = Mutex::new(None);

// BADGE AND NOTIFICATIONS
#[tauri::command]
pub async fn set_badge_count(count: i32, _app_handle: tauri::AppHandle<tauri::Wry>) -> Result<(), String> {
    println!("🔴 [TAURI] Setting badge count to: {}", count);
    
    // Safe badge implementation using AppleScript for macOS
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        
        // ✅ FIX: Use correct app name "adrata" (matches binary name in Cargo.toml)
  let app_name = "adrata";
        
        // Use AppleScript to safely set dock badge without crashes
        let script = if count > 0 {
            format!(
                r#"tell application "System Events"
                    tell application process "{}"
                        set value of attribute "AXBadgeLabel" to "{}" as string
                    end tell
                end tell"#,
                app_name, count
            )
        } else {
            format!(
                r#"tell application "System Events"
                    tell application process "{}"
                        set value of attribute "AXBadgeLabel" to ""
                    end tell
                end tell"#,
                app_name
            )
        };
        
        println!("🍎 [TAURI] Executing AppleScript for app '{}': {}", app_name, script);
        
        match Command::new("osascript")
            .arg("-e")
            .arg(&script)
            .output()
        {
            Ok(output) => {
                if output.status.success() {
                    println!("✅ [TAURI] macOS dock badge set successfully to: {} for app '{}'", count, app_name);
                } else {
                    let error = String::from_utf8_lossy(&output.stderr);
                    let stdout = String::from_utf8_lossy(&output.stdout);
                    println!("⚠️ [TAURI] AppleScript error for app '{}': stderr: {}, stdout: {}", app_name, error, stdout);
                    
                    // Try alternative approach with bundle identifier
                    println!("🔄 [TAURI] Trying alternative approach with bundle identifier...");
                    let alt_script = if count > 0 {
                        format!(r#"tell application "System Events" to set value of attribute "AXBadgeLabel" of application process "adrata" to "{}" as string"#, count)
                    } else {
                        r#"tell application "System Events" to set value of attribute "AXBadgeLabel" of application process "adrata" to """#.to_string()
                    };
                    
                    let alt_result = Command::new("osascript")
                        .arg("-e")
                        .arg(&alt_script)
                        .output();
                        
                    match alt_result {
                        Ok(alt_output) => {
                            if alt_output.status.success() {
                                println!("✅ [TAURI] Alternative AppleScript succeeded for badge: {}", count);
                            } else {
                                let alt_error = String::from_utf8_lossy(&alt_output.stderr);
                                println!("❌ [TAURI] Alternative AppleScript also failed: {}", alt_error);
                            }
                        }
                        Err(e) => {
                            println!("❌ [TAURI] Failed to execute alternative AppleScript: {}", e);
                        }
                    }
                    
                    // Don't fail, just log the issue
                }
            },
            Err(e) => {
                println!("⚠️ [TAURI] Failed to execute AppleScript: {}", e);
                // Don't fail, just log the issue
            }
        }
    }
    
    #[cfg(target_os = "windows")]
    {
        println!("📱 [TAURI] Windows badge count: {} (OS not supported yet)", count);
    }
    
    #[cfg(target_os = "linux")]
    {
        println!("🐧 [TAURI] Linux badge count: {} (OS not supported yet)", count);
    }
    
    println!("✅ [TAURI] Badge count operation completed");
    Ok(())
}

#[tauri::command]
pub async fn clear_badge(app_handle: tauri::AppHandle<tauri::Wry>) -> Result<(), String> {
    println!("🔄 [TAURI] Clearing badge count");
    set_badge_count(0, app_handle).await
}

#[tauri::command]
pub async fn show_notification(title: String, body: String) -> Result<(), String> {
    println!("🔔 [TAURI] Showing notification: {} - {}", title, body);
    
    // Use Tauri's notification API
    #[cfg(feature = "notification")]
    {
        // Use tauri-plugin-notification for Tauri v2
        println!("🔔 [TAURI] Notification would be shown here (feature enabled): {} - {}", title, body);
        // In production, you would use the notification plugin
    }
    
    #[cfg(not(feature = "notification"))]
    {
        println!("📱 [TAURI] Notification feature not enabled");
    }
    
    Ok(())
}

// APP UPDATES
#[tauri::command]
pub async fn check_for_updates(app_handle: tauri::AppHandle<tauri::Wry>) -> Result<serde_json::Value, String> {
    println!("🔄 [TAURI] Checking for application updates...");
    
    match app_handle.updater() {
        Ok(updater) => {
            match updater.check().await {
                Ok(Some(update)) => {
                    let version = &update.version;
                    let body = &update.body;
                    let date = update.date.as_ref().map(|d| d.to_string()).unwrap_or_else(|| "Unknown".to_string());
                    
                    println!("✅ [TAURI] Update available: version {}", version);
                    
                    Ok(serde_json::json!({
                        "updateAvailable": true,
                        "version": version,
                        "releaseNotes": body,
                        "releaseDate": date,
                        "currentVersion": app_handle.package_info().version.to_string()
                    }))
                },
                Ok(None) => {
                    println!("✅ [TAURI] Application is up to date");
                    
                    Ok(serde_json::json!({
                        "updateAvailable": false,
                        "currentVersion": app_handle.package_info().version.to_string(),
                        "message": "Application is up to date"
                    }))
                },
                Err(e) => {
                    let error_msg = format!("Failed to check for updates: {}", e);
                    println!("❌ [TAURI] {}", error_msg);
                    Err(error_msg)
                }
            }
        },
        Err(e) => {
            let error_msg = format!("Updater not available: {}", e);
            println!("❌ [TAURI] {}", error_msg);
            Err(error_msg)
        }
    }
}

#[tauri::command]
pub async fn _install_update(app_handle: tauri::AppHandle<tauri::Wry>) -> Result<(), String> {
    println!("📦 [TAURI] Installing application update...");
    
    match app_handle.updater() {
        Ok(updater) => {
            match updater.check().await {
                Ok(Some(update)) => {
                    println!("🔄 [TAURI] Downloading and installing update...");
                    
                    match update.download_and_install(
                        |chunk_length, content_length| {
                            println!("📥 [TAURI] Downloaded {} of {:?} bytes", chunk_length, content_length);
                        },
                        || {
                            println!("✅ [TAURI] Download completed, installing...");
                        }
                    ).await {
                        Ok(_) => {
                            println!("✅ [TAURI] Update installed successfully. Restart required.");
                            Ok(())
                        },
                        Err(e) => {
                            let error_msg = format!("Failed to install update: {}", e);
                            println!("❌ [TAURI] {}", error_msg);
                            Err(error_msg)
                        }
                    }
                },
                Ok(None) => {
                    let error_msg = "No update available to install".to_string();
                    println!("⚠️ [TAURI] {}", error_msg);
                    Err(error_msg)
                },
                Err(e) => {
                    let error_msg = format!("Failed to check for updates: {}", e);
                    println!("❌ [TAURI] {}", error_msg);
                    Err(error_msg)
                }
            }
        },
        Err(e) => {
            let error_msg = format!("Updater not available: {}", e);
            println!("❌ [TAURI] {}", error_msg);
            Err(error_msg)
        }
    }
}

#[tauri::command]
pub async fn _get_app_version() -> Result<String, String> {
    println!("📱 [TAURI] Getting application version");
    let version = env!("CARGO_PKG_VERSION");
    Ok(version.to_string())
}

// ROSS-DAN CHAT INITIALIZATION - DATABASE BACKED
#[tauri::command]
pub async fn initialize_ross_dan_chat() -> Result<serde_json::Value, String> {
    println!("💬 [TAURI] Initializing Ross-Dan chat system with production database...");
    
    // 🌐 ENVIRONMENT-AWARE API URL: Dev calls localhost, Prod calls production
    let api_url = if cfg!(debug_assertions) {
        "http://localhost:3000/api/chat/ross-dan"  // Dev mode: local Next.js server
    } else {
        "https://action.adrata.com/api/chat/ross-dan"  // Production mode
    };
    
    println!("🔗 [TAURI] Calling API endpoint: {}", api_url);
    println!("🗄️ [TAURI] Database: Production PostgreSQL (via API route)");
    
    // 🗄️ PRODUCTION DATABASE: Call the API route for database persistence
    match reqwest::Client::new()
        .get(api_url)
        .header("User-Agent", "Adrata-Desktop/1.0")
        .timeout(std::time::Duration::from_secs(10))
        .send()
        .await
    {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<serde_json::Value>().await {
                    Ok(data) => {
                        if data.get("success").and_then(|s| s.as_bool()).unwrap_or(false) {
                            if let Some(chat) = data.get("chat") {
                                let message_count = chat.get("messages").and_then(|m| m.as_array()).map(|arr| arr.len()).unwrap_or(0);
                                println!("✅ [TAURI] Chat loaded from PRODUCTION DATABASE: {} messages", message_count);
                                println!("🗄️ [TAURI] Messages will persist across app restarts");
                                return Ok(chat.clone());
                            }
                        }
                    }
                    Err(e) => {
                        println!("❌ [TAURI] Failed to parse API response: {}", e);
                    }
                }
            } else {
                println!("❌ [TAURI] API returned error status: {}", response.status());
            }
        }
        Err(e) => {
            println!("❌ [TAURI] Failed to call API: {}", e);
        }
    }
    
    // 📦 FALLBACK: Use local data if API fails
    println!("⚠️ [TAURI] Using fallback data - Production database API unavailable");
    println!("⚠️ [TAURI] Messages will NOT persist in this mode");
    let fallback_data = serde_json::json!({
        "id": "ross-dan-fallback",
        "type": "dm",
        "name": "Ross & Dan",
        "messages": [{
            "id": "welcome-fallback",
            "content": "Welcome to a new world. Where the gap between what you want and what you can achieve disappears. (Note: Database unavailable - messages not persisting)",
            "createdAt": chrono::Utc::now().to_rfc3339(),
            "sender": {
                "id": "ross-1",
                "name": "Ross Sylvester",
                "email": "ross@adrata.com"
            }
        }],
        "members": [
            {
                "user": {
                    "id": "ross-1",
                    "name": "Ross Sylvester",
                    "email": "ross@adrata.com"
                }
            },
            {
                "user": {
                    "id": "dan-1",
                    "name": "Dan Mirolli",
                    "email": "dan@adrata.com"
                }
            }
        ]
    });
    
    Ok(fallback_data)
}

// SEND ROSS-DAN MESSAGE VIA TAURI - DATABASE BACKED
#[tauri::command]
pub async fn send_ross_dan_message(
    message: String,
    sender_email: String,
    workspace_id: String,
    user_id: String,
    skip_pusher: Option<bool>
) -> Result<serde_json::Value, String> {
    println!("📤 [TAURI] Sending Ross-Dan message to production database:");
    println!("  • Sender: {}", sender_email);
    println!("  • Workspace: {}", workspace_id);
    println!("  • User: {}", user_id);
    println!("  • Message: {}...", message.chars().take(50).collect::<String>());
    
    // Validate sender
    let valid_emails = &["ross@adrata.com", "dan@adrata.com"];
    if !valid_emails.contains(&sender_email.as_str()) {
        let error_msg = format!("Invalid sender email: {}", sender_email);
        println!("❌ [TAURI] {}", error_msg);
        return Err(error_msg);
    }
    
    // Validate workspace
    if workspace_id != "adrata" {
        let error_msg = format!("Invalid workspace: {}", workspace_id);
        println!("❌ [TAURI] {}", error_msg);
        return Err(error_msg);
    }
    
    // 🌐 ENVIRONMENT-AWARE API URL: Dev calls localhost, Prod calls production
    let api_url = if cfg!(debug_assertions) {
        "http://localhost:3000/api/chat/ross-dan"  // Dev mode: local Next.js server
    } else {
        "https://action.adrata.com/api/chat/ross-dan"  // Production mode
    };
    
    println!("🔗 [TAURI] Sending to API endpoint: {}", api_url);
    println!("🗄️ [TAURI] Target: Production PostgreSQL database (via API route)");
    
    // 🗄️ PRODUCTION DATABASE: Send via API for persistent storage
    let skip_pusher = skip_pusher.unwrap_or(false);
    let payload = serde_json::json!({
        "message": message,
        "senderEmail": sender_email,
        "skipPusher": skip_pusher
    });
    
    println!("🔗 [TAURI] Skip Pusher: {}", if skip_pusher { "YES (optimistic update)" } else { "NO (will send Pusher event)" });
    
    match reqwest::Client::new()
        .post(api_url)
        .header("User-Agent", "Adrata-Desktop/1.0")
        .header("Content-Type", "application/json")
        .timeout(std::time::Duration::from_secs(10))
        .json(&payload)
        .send()
        .await
    {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<serde_json::Value>().await {
                    Ok(data) => {
                        if data.get("success").and_then(|s| s.as_bool()).unwrap_or(false) {
                            if let Some(sent_message) = data.get("message") {
                                println!("✅ [TAURI] Message saved to PRODUCTION DATABASE successfully");
                                println!("🗄️ [TAURI] Message persisted and will survive app restarts");
                                return Ok(serde_json::json!({
                                    "success": true,
                                    "message": sent_message
                                }));
                            }
                        }
                        println!("❌ [TAURI] API returned unsuccessful response");
                    }
                    Err(e) => {
                        println!("❌ [TAURI] Failed to parse API response: {}", e);
                    }
                }
            } else {
                println!("❌ [TAURI] API returned error status: {}", response.status());
            }
        }
        Err(e) => {
            println!("❌ [TAURI] Failed to call API: {}", e);
        }
    }
    
    // 📦 FALLBACK: Create message locally if API fails
    println!("⚠️ [TAURI] Using fallback message creation - Production database API unavailable");
    println!("⚠️ [TAURI] This message will NOT persist");
    let message_id = format!("msg-fallback-{}-{}", 
        chrono::Utc::now().timestamp(), 
        rand::random::<u32>()
    );
    
    let sender_name = if sender_email == "ross@adrata.com" {
        "Ross Sylvester"
    } else {
        "Dan Mirolli"
    };
    
    let fallback_message = serde_json::json!({
        "id": message_id,
        "content": message,
        "createdAt": chrono::Utc::now().to_rfc3339(),
        "sender": {
            "id": if sender_email == "ross@adrata.com" { "ross-1" } else { "dan-1" },
            "name": sender_name,
            "email": sender_email
        }
    });
    
    Ok(serde_json::json!({
        "success": true,
        "message": fallback_message
    }))
}

// UPLOAD IMAGE TO ROSS-DAN CHAT - DATABASE BACKED
#[tauri::command]
pub async fn upload_ross_dan_image(
    image_data: String,    // Base64 encoded image data
    filename: String,      // Original filename
    sender_email: String,  // Who's uploading the image
    workspace_id: String,
    user_id: String
) -> Result<serde_json::Value, String> {
    println!("📸 [TAURI] Uploading image to Ross-Dan chat:");
    println!("  • Filename: {}", filename);
    println!("  • Sender: {}", sender_email);
    println!("  • Workspace: {}", workspace_id);
    println!("  • User: {}", user_id);
    println!("  • Data size: {} characters", image_data.len());
    
    // Validate sender
    let valid_emails = &["ross@adrata.com", "dan@adrata.com"];
    if !valid_emails.contains(&sender_email.as_str()) {
        let error_msg = format!("Invalid sender email: {}", sender_email);
        println!("❌ [TAURI] {}", error_msg);
        return Err(error_msg);
    }
    
    // Validate workspace
    if workspace_id != "adrata" {
        let error_msg = format!("Invalid workspace: {}", workspace_id);
        println!("❌ [TAURI] {}", error_msg);
        return Err(error_msg);
    }
    
    // 🌐 ENVIRONMENT-AWARE API URL
    let api_url = if cfg!(debug_assertions) {
        "http://localhost:3000/api/chat/ross-dan/upload"  // Dev mode
    } else {
        "https://action.adrata.com/api/chat/ross-dan/upload"  // Production mode
    };
    
    println!("🔗 [TAURI] Uploading to API endpoint: {}", api_url);
    println!("🗄️ [TAURI] Target: Production PostgreSQL database (via API route)");
    
    // Create multipart form data
    let client = reqwest::Client::new();
    let form = reqwest::multipart::Form::new()
        .text("senderEmail", sender_email.clone())
        .text("chatType", "ross-dan-real")
        .text("imageData", image_data)
        .text("filename", filename.clone());
    
    match client
        .post(api_url)
        .header("User-Agent", "Adrata-Desktop/1.0")
        .timeout(std::time::Duration::from_secs(30)) // Longer timeout for image uploads
        .multipart(form)
        .send()
        .await
    {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<serde_json::Value>().await {
                    Ok(data) => {
                        if data.get("success").and_then(|s| s.as_bool()).unwrap_or(false) {
                            if let Some(uploaded_images) = data.get("uploadedImages") {
                                println!("✅ [TAURI] Image uploaded to PRODUCTION DATABASE successfully");
                                println!("🗄️ [TAURI] Image persisted and will survive app restarts");
                                return Ok(serde_json::json!({
                                    "success": true,
                                    "uploadedImages": uploaded_images
                                }));
                            }
                        }
                        println!("❌ [TAURI] API returned unsuccessful response: {:?}", data);
                        Err("Image upload failed - API returned unsuccessful response".to_string())
                    }
                    Err(e) => {
                        println!("❌ [TAURI] Failed to parse API response: {}", e);
                        Err(format!("Failed to parse upload response: {}", e))
                    }
                }
            } else {
                let status = response.status();
                let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
                println!("❌ [TAURI] API returned error status: {} - {}", status, error_text);
                Err(format!("Upload failed with status {}: {}", status, error_text))
            }
        }
        Err(e) => {
            println!("❌ [TAURI] Failed to call upload API: {}", e);
            Err(format!("Network error during upload: {}", e))
        }
    }
}

// GET ALL ROSS CONVERSATIONS (for right panel display)
#[tauri::command]
pub async fn get_ross_conversations(workspace_id: String, user_id: String) -> Result<serde_json::Value, String> {
    println!("📋 [TAURI] Getting Ross conversations for user: {} in workspace: {}", user_id, workspace_id);
    
    // For Ross, show all conversations in the workspace
    let conversations = if user_id == "ross" && workspace_id == "adrata" {
        serde_json::json!([
            {
                "id": "ross-dan-real",
                "name": "Dan Mirolli",
                "company": "Adrata Engineering", 
                "lastMessage": "Welcome to a new world. Where the gap between what you want and what you can achieve disappears.",
                "timestamp": "now",
                "unread": 0,
                "avatar": "DM",
                "type": "dm",
                "email": "dan@adrata.com"
            },
            {
                "id": "ross-team-chat",
                "name": "Team Updates",
                "company": "Adrata Leadership",
                "lastMessage": "Latest product updates and roadmap discussion",
                "timestamp": "2h ago", 
                "unread": 3,
                "avatar": "TU",
                "type": "group"
            },
            {
                "id": "ross-sarah-chat",
                "name": "Sarah Johnson",
                "company": "Adrata Marketing",
                "lastMessage": "Campaign performance metrics are looking great!",
                "timestamp": "4h ago",
                "unread": 1, 
                "avatar": "SJ",
                "type": "dm",
                "email": "sarah@adrata.com"
            }
        ])
    } else {
        // For Dan and others, show standard conversations
        serde_json::json!([
            {
                "id": "ross-dan-real",
                "name": "Ross Sylvester", 
                "company": "Adrata Leadership",
                "lastMessage": "Welcome to a new world. Where the gap between what you want and what you can achieve disappears.",
                "timestamp": "now",
                "unread": 1,
                "avatar": "RS", 
                "type": "dm",
                "email": "ross@adrata.com"
            }
        ])
    };
    
    println!("✅ [TAURI] Retrieved {} conversations", conversations.as_array().unwrap().len());
    
    Ok(serde_json::json!({
        "success": true,
        "conversations": conversations
    }))
}

#[tauri::command]
pub async fn get_app_info() -> Result<serde_json::Value, String> {
    println!("📱 [TAURI] Getting application info");
    
    let app_info = serde_json::json!({
        "name": env!("CARGO_PKG_NAME"),
        "version": env!("CARGO_PKG_VERSION"),
        "description": env!("CARGO_PKG_DESCRIPTION"),
        "authors": env!("CARGO_PKG_AUTHORS").split(":").collect::<Vec<&str>>(),
        "repository": env!("CARGO_PKG_REPOSITORY"),
        "build_timestamp": chrono::Utc::now().to_rfc3339(),
        "tauri_version": "2.0",
        "platform": std::env::consts::OS,
        "arch": std::env::consts::ARCH
    });
    
    println!("✅ [TAURI] Application info retrieved");
    Ok(app_info)
}

#[tauri::command]
pub async fn open_url_in_browser(url: String) -> Result<(), String> {
    println!("🔗 [TAURI] Opening URL in system browser: {}", url);
    
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        match Command::new("open").arg(&url).spawn() {
            Ok(_) => {
                println!("✅ [TAURI] URL opened in system browser (macOS)");
                Ok(())
            },
            Err(e) => {
                println!("❌ [TAURI] Failed to open URL on macOS: {}", e);
                Err(format!("Failed to open URL: {}", e))
            }
        }
    }
    
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        match Command::new("cmd").args(&["/C", "start", "", &url]).spawn() {
            Ok(_) => {
                println!("✅ [TAURI] URL opened in system browser (Windows)");
                Ok(())
            },
            Err(e) => {
                println!("❌ [TAURI] Failed to open URL on Windows: {}", e);
                Err(format!("Failed to open URL: {}", e))
            }
        }
    }
    
    #[cfg(target_os = "linux")]
    {
        use std::process::Command;
        match Command::new("xdg-open").arg(&url).spawn() {
            Ok(_) => {
                println!("✅ [TAURI] URL opened in system browser (Linux)");
                Ok(())
            },
            Err(e) => {
                println!("❌ [TAURI] Failed to open URL on Linux: {}", e);
                Err(format!("Failed to open URL: {}", e))
            }
        }
    }
    
    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    {
        println!("❌ [TAURI] Unsupported platform for opening URLs");
        Err("Unsupported platform".to_string())
    }
}

#[tauri::command]
pub async fn test_dock_badge(test_count: i32, app_handle: tauri::AppHandle<tauri::Wry>) -> Result<String, String> {
    println!("🧪 [TAURI] Testing dock badge with count: {}", test_count);
    
    // Call the regular badge function
    set_badge_count(test_count, app_handle).await?;
    
    // Return success message
    Ok(format!("Dock badge test completed with count: {}", test_count))
}

// TYPING INDICATORS VIA TAURI - DESKTOP FRIENDLY
#[tauri::command]
pub async fn send_typing_indicator(
    sender_email: String,
    is_typing: bool,
    workspace_id: String
) -> Result<serde_json::Value, String> {
    println!("📝 [TAURI] Sending typing indicator:");
    println!("  • Sender: {}", sender_email);
    println!("  • Is Typing: {}", is_typing);
    println!("  • Workspace: {}", workspace_id);
    
    // Validate sender
    let valid_emails = &["ross@adrata.com", "dan@adrata.com"];
    if !valid_emails.contains(&sender_email.as_str()) {
        let error_msg = format!("Invalid sender email: {}", sender_email);
        println!("❌ [TAURI] {}", error_msg);
        return Err(error_msg);
    }
    
    // 🌐 ENVIRONMENT-AWARE API URL
    let api_url = if cfg!(debug_assertions) {
        "http://localhost:3000/api/chat/ross-dan/typing"
    } else {
        "https://action.adrata.com/api/chat/ross-dan/typing"
    };
    
    println!("🔗 [TAURI] Sending typing indicator to: {}", api_url);
    
    let payload = serde_json::json!({
        "senderEmail": sender_email,
        "isTyping": is_typing
    });
    
    match reqwest::Client::new()
        .post(api_url)
        .header("Content-Type", "application/json")
        .header("User-Agent", "Adrata-Desktop/1.0")
        .json(&payload)
        .timeout(std::time::Duration::from_secs(5))
        .send()
        .await
    {
        Ok(response) => {
            if response.status().is_success() {
                println!("✅ [TAURI] Typing indicator sent successfully");
                Ok(serde_json::json!({
                    "success": true,
                    "senderEmail": sender_email,
                    "isTyping": is_typing
                }))
            } else {
                let error_msg = format!("API returned error status: {}", response.status());
                println!("❌ [TAURI] {}", error_msg);
                Err(error_msg)
            }
        }
        Err(e) => {
            println!("❌ [TAURI] Failed to send typing indicator: {}", e);
            // Don't fail completely - typing indicators are not critical
            Ok(serde_json::json!({
                "success": false,
                "error": "Network error - typing indicator not sent",
                "senderEmail": sender_email,
                "isTyping": is_typing
            }))
        }
    }
}

// POLL FOR NEW MESSAGES - FALLBACK WHEN PUSHER FAILS
#[tauri::command]
pub async fn poll_ross_dan_messages(
    last_message_id: Option<String>,
    workspace_id: String
) -> Result<serde_json::Value, String> {
    println!("🔄 [TAURI] Polling for new Ross-Dan messages");
    println!("  • Last Message ID: {:?}", last_message_id);
    println!("  • Workspace: {}", workspace_id);
    
    // 🌐 ENVIRONMENT-AWARE API URL
    let api_url = if cfg!(debug_assertions) {
        "http://localhost:3000/api/chat/ross-dan"
    } else {
        "https://action.adrata.com/api/chat/ross-dan"
    };
    
    match reqwest::Client::new()
        .get(api_url)
        .header("User-Agent", "Adrata-Desktop/1.0")
        .timeout(std::time::Duration::from_secs(5))
        .send()
        .await
    {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<serde_json::Value>().await {
                    Ok(data) => {
                        if let Some(chat) = data.get("chat") {
                            if let Some(messages) = chat.get("messages").and_then(|m| m.as_array()) {
                                // Filter messages newer than last_message_id
                                let new_messages: Vec<&serde_json::Value> = if let Some(last_id) = last_message_id {
                                    // Find index of last message and return everything after it
                                    let last_index = messages.iter().position(|msg| {
                                        msg.get("id").and_then(|id| id.as_str()) == Some(&last_id)
                                    });
                                    
                                    if let Some(index) = last_index {
                                        messages.iter().skip(index + 1).collect()
                                    } else {
                                        // If last_id not found, return all messages (safe fallback)
                                        messages.iter().collect()
                                    }
                                } else {
                                    // No last_id provided, return all messages
                                    messages.iter().collect()
                                };
                                
                                println!("✅ [TAURI] Found {} new messages", new_messages.len());
                                
                                Ok(serde_json::json!({
                                    "success": true,
                                    "newMessages": new_messages,
                                    "totalMessages": messages.len(),
                                    "timestamp": chrono::Utc::now().to_rfc3339()
                                }))
                            } else {
                                Ok(serde_json::json!({
                                    "success": true,
                                    "newMessages": [],
                                    "totalMessages": 0
                                }))
                            }
                        } else {
                            Err("No chat data in response".to_string())
                        }
                    }
                    Err(e) => {
                        Err(format!("Failed to parse response: {}", e))
                    }
                }
            } else {
                Err(format!("API returned error status: {}", response.status()))
            }
        }
        Err(e) => {
            println!("❌ [TAURI] Failed to poll messages: {}", e);
            Err(format!("Network error: {}", e))
        }
    }
}

// CHECK PUSHER CONNECTION STATUS FROM DESKTOP
#[tauri::command]
pub async fn check_pusher_connection() -> Result<serde_json::Value, String> {
    println!("📡 [TAURI] Checking Pusher connection capability");
    
    // Test basic connectivity to Pusher
    let pusher_test_url = "https://ws-us3.pusher.com/";
    
    match reqwest::Client::new()
        .get(pusher_test_url)
        .timeout(std::time::Duration::from_secs(3))
        .send()
        .await
    {
        Ok(response) => {
            let can_connect = response.status().is_success() || response.status().as_u16() == 426; // 426 = Upgrade Required (WebSocket)
            
            Ok(serde_json::json!({
                "canConnectToPusher": can_connect,
                "pusherEndpoint": pusher_test_url,
                "recommendedFallback": !can_connect,
                "timestamp": chrono::Utc::now().to_rfc3339()
            }))
        }
        Err(e) => {
            println!("⚠️ [TAURI] Pusher connectivity test failed: {}", e);
            Ok(serde_json::json!({
                "canConnectToPusher": false,
                "error": e.to_string(),
                "recommendedFallback": true,
                "timestamp": chrono::Utc::now().to_rfc3339()
            }))
        }
    }
} 