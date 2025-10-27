use tauri::{command, AppHandle, Manager, Window, WindowBuilder, WindowUrl};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct BrowserWindowConfig {
    pub url: String,
    pub title: Option<String>,
    pub width: Option<f64>,
    pub height: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NavigationResult {
    pub success: bool,
    pub message: String,
}

// Custom user agent to bypass restrictions (mobile/tablet)
const CUSTOM_USER_AGENT: &str = "Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1";

#[command]
pub async fn create_browser_window(
    app: AppHandle,
    config: BrowserWindowConfig,
) -> Result<NavigationResult, String> {
    let window_id = format!("browser_{}", chrono::Utc::now().timestamp_millis());
    
    let title = config.title.unwrap_or_else(|| "Nova Browser".to_string());
    let width = config.width.unwrap_or(1200.0);
    let height = config.height.unwrap_or(800.0);
    
    // Validate URL
    let url = if config.url.starts_with("http://") || config.url.starts_with("https://") {
        config.url
    } else if config.url.contains('.') && !config.url.contains(' ') {
        format!("https://{}", config.url)
    } else {
        // Treat as search query
        format!("https://www.google.com/search?q={}", urlencoding::encode(&config.url))
    };

    match WindowBuilder::new(&app, window_id, WindowUrl::External(url.parse().map_err(|e| format!("Invalid URL: {}", e))?))
        .title(&title)
        .inner_size(width, height)
        .min_inner_size(800.0, 600.0)
        .resizable(true)
        .center()
        .decorations(true)
        .always_on_top(false)
        .skip_taskbar(false)
        .user_agent(CUSTOM_USER_AGENT)
        .build()
    {
        Ok(window) => {
            println!("🌌 Nova Browser window created: {}", window.label());
            Ok(NavigationResult {
                success: true,
                message: "Browser window opened successfully".to_string(),
            })
        }
        Err(e) => {
            eprintln!("❌ Failed to create browser window: {}", e);
            Ok(NavigationResult {
                success: false,
                message: format!("Failed to open browser: {}", e),
            })
        }
    }
}

#[command]
pub async fn navigate_browser_window(
    app: AppHandle,
    window_id: String,
    url: String,
) -> Result<NavigationResult, String> {
    if let Some(window) = app.get_window(&window_id) {
        let processed_url = if url.starts_with("http://") || url.starts_with("https://") {
            url
        } else if url.contains('.') && !url.contains(' ') {
            format!("https://{}", url)
        } else {
            format!("https://www.google.com/search?q={}", urlencoding::encode(&url))
        };

        match window.navigate(WindowUrl::External(processed_url.parse().map_err(|e| format!("Invalid URL: {}", e))?)) {
            Ok(_) => Ok(NavigationResult {
                success: true,
                message: "Navigation successful".to_string(),
            }),
            Err(e) => Ok(NavigationResult {
                success: false,
                message: format!("Navigation failed: {}", e),
            }),
        }
    } else {
        Ok(NavigationResult {
            success: false,
            message: "Browser window not found".to_string(),
        })
    }
}

#[command]
pub async fn close_browser_window(
    app: AppHandle,
    window_id: String,
) -> Result<NavigationResult, String> {
    if let Some(window) = app.get_window(&window_id) {
        match window.close() {
            Ok(_) => Ok(NavigationResult {
                success: true,
                message: "Browser window closed".to_string(),
            }),
            Err(e) => Ok(NavigationResult {
                success: false,
                message: format!("Failed to close browser: {}", e),
            }),
        }
    } else {
        Ok(NavigationResult {
            success: false,
            message: "Browser window not found".to_string(),
        })
    }
}

#[command]
pub async fn list_browser_windows(app: AppHandle) -> Result<Vec<String>, String> {
    let windows = app.windows();
    let browser_windows: Vec<String> = windows
        .values()
        .filter(|window| window.label().starts_with("browser_"))
        .map(|window| window.label().to_string())
        .collect();
    
    Ok(browser_windows)
}
