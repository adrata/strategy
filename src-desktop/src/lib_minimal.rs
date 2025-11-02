use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            println!("🚀 [TAURI] Starting Adrata Desktop Application (Web Wrapper)");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Minimal commands for web wrapper
            greet
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

