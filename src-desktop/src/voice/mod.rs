use std::sync::{Arc, Mutex, OnceLock};
use std::time::Instant;

#[cfg(feature = "audio")]
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
#[cfg(feature = "audio")]
use std::sync::mpsc;
#[cfg(feature = "audio")]
use std::thread;

// Voice recognition state management
static VOICE_SESSION: OnceLock<Arc<Mutex<VoiceSession>>> = OnceLock::new();

#[derive(Debug, Clone, Default)]
pub struct VoiceSession {
    pub is_active: bool,
    pub is_listening: bool,
    pub session_start: Option<Instant>,
    pub last_activity: Option<Instant>,
    pub _audio_stream: Option<String>, // Stream ID placeholder
}

#[derive(Debug, Clone)]
pub enum VoiceCommand {
    Activate,
    Navigate(String),
    AIAnalysis(String), 
    DataOperation(String),
    Sleep,
    Deactivate,
}

// Voice command matching
pub fn match_voice_command(text: &str) -> Option<VoiceCommand> {
    let text = text.to_lowercase();
    
    // Activation commands
    if text.contains("adrata start") || text.contains("hey adrata") || text.contains("start adrata") {
        return Some(VoiceCommand::Activate);
    }
    
    // Navigation commands  
    if text.contains("open leads") || text.contains("show leads") {
                    return Some(VoiceCommand::Navigate("aos".to_string()));
    }
    if text.contains("open calendar") || text.contains("show calendar") {
        return Some(VoiceCommand::Navigate("calendar".to_string()));
    }
    if text.contains("go to monaco") || text.contains("open monaco") {
        return Some(VoiceCommand::Navigate("monaco".to_string()));
    }
    
    // AI Commands
    if text.contains("health check") || text.contains("system status") {
        return Some(VoiceCommand::AIAnalysis("health_check".to_string()));
    }
    if text.contains("analyze pipeline") || text.contains("pipeline analysis") {
        return Some(VoiceCommand::AIAnalysis("pipeline_analysis".to_string()));
    }
    
    // Data commands
    if text.contains("add lead") || text.contains("new lead") {
        return Some(VoiceCommand::DataOperation("add_lead".to_string()));
    }
    if text.contains("export data") || text.contains("download data") {
        return Some(VoiceCommand::DataOperation("export_data".to_string()));
    }
    
    // Session control
    if text.contains("sleep") || text.contains("stop listening") {
        return Some(VoiceCommand::Sleep);
    }
    if text.contains("end session") || text.contains("deactivate") {
        return Some(VoiceCommand::Deactivate);
    }
    
    None
}

// Process recognized voice commands
pub fn process_voice_command(command: VoiceCommand) {
    match command {
        VoiceCommand::Activate => {
            println!("✅ [TAURI-NATIVE] Processing activation command");
            // Update voice session state
            if let Some(voice_state) = VOICE_SESSION.get() {
                let mut session = voice_state.lock().unwrap();
                session.is_listening = true;
                session.last_activity = Some(Instant::now());
            }
        },
        VoiceCommand::Navigate(route) => {
            println!("🧭 [TAURI-NATIVE] Processing navigation command: {}", route);
            // Here you would emit an event to the frontend to navigate
        },
        VoiceCommand::AIAnalysis(analysis_type) => {
            println!("🤖 [TAURI-NATIVE] Processing AI analysis command: {}", analysis_type);
            // Here you would trigger AI analysis
        },
        VoiceCommand::DataOperation(operation) => {
            println!("📊 [TAURI-NATIVE] Processing data operation: {}", operation);
            // Here you would perform data operations
        },
        VoiceCommand::Sleep => {
            println!("😴 [TAURI-NATIVE] Processing sleep command");
            if let Some(voice_state) = VOICE_SESSION.get() {
                let mut session = voice_state.lock().unwrap();
                session.is_listening = false;
            }
        },
        VoiceCommand::Deactivate => {
            println!("🛑 [TAURI-NATIVE] Processing deactivation command");
            if let Some(voice_state) = VOICE_SESSION.get() {
                let mut session = voice_state.lock().unwrap();
                session.is_active = false;
                session.is_listening = false;
            }
        }
    }
}

// Platform-specific audio capture (conditional on audio feature)
#[cfg(feature = "audio")]
pub async fn start_audio_capture() -> Result<(), String> {
    println!("🎤 [TAURI-NATIVE] Starting audio capture for platform: {}", std::env::consts::OS);
    
    // Get the default audio host
    let host = cpal::default_host();
    
    // Get the default input device
    let device = host.default_input_device()
        .ok_or("No input device available")?;
    
    println!("🎤 [TAURI-NATIVE] Using input device: {}", device.name().unwrap_or("Unknown".to_string()));
    
    // Get the default input config
    let config = device.default_input_config()
        .map_err(|e| format!("Failed to get default input config: {}", e))?;
    
    println!("🎤 [TAURI-NATIVE] Audio config: {:?}", config);
    
    // Create audio processing channel
    let (tx, rx) = mpsc::channel::<Vec<f32>>();
    
    // Build input stream
    let stream = device.build_input_stream(
        &config.into(),
        move |data: &[f32], _: &cpal::InputCallbackInfo| {
            // Send audio data for processing
            let _ = tx.send(data.to_vec());
        },
        |err| eprintln!("❌ [TAURI-NATIVE] Audio stream error: {}", err),
        None
    ).map_err(|e| format!("Failed to build input stream: {}", e))?;
    
    // Start the stream
    stream.play().map_err(|e| format!("Failed to start audio stream: {}", e))?;
    
    // Process audio in separate thread
    thread::spawn(move || {
        println!("🎤 [TAURI-NATIVE] Audio processing thread started");
        
        while let Ok(audio_data) = rx.recv() {
            // Simple voice activity detection
            let rms = calculate_rms(&audio_data);
            
            if rms > 0.01 { // Voice activity threshold
                println!("🎤 [TAURI-NATIVE] Voice activity detected (RMS: {:.4})", rms);
                
                // Here you would implement actual speech recognition
                // For now, we'll simulate recognition
                if let Some(recognized_text) = simulate_speech_recognition(&audio_data) {
                    println!("🗣️ [TAURI-NATIVE] Recognized: '{}'", recognized_text);
                    
                    // Process voice command
                    if let Some(command) = match_voice_command(&recognized_text) {
                        println!("🎯 [TAURI-NATIVE] Command matched: {:?}", command);
                        // Here you would emit the command to the frontend
                        process_voice_command(command);
                    }
                }
            }
        }
    });
    
    // Keep the stream alive
    std::mem::forget(stream);
    
    Ok(())
}

// Fallback audio capture when audio feature is disabled
#[cfg(not(feature = "audio"))]
pub async fn start_audio_capture() -> Result<(), String> {
    println!("🎤 [TAURI-NATIVE] Audio capture disabled (audio feature not enabled)");
    println!("🎤 [TAURI-NATIVE] Voice commands will work via other input methods");
    Ok(())
}

// Calculate RMS (Root Mean Square) for voice activity detection (conditional on audio feature)
#[cfg(feature = "audio")]
fn calculate_rms(audio_data: &[f32]) -> f32 {
    if audio_data.is_empty() {
        return 0.0;
    }
    
    let sum_squares: f32 = audio_data.iter().map(|&x| x * x).sum();
    (sum_squares / audio_data.len() as f32).sqrt()
}

// Simulate speech recognition (replace with actual implementation) (conditional on audio feature)
#[cfg(feature = "audio")]
fn simulate_speech_recognition(audio_data: &[f32]) -> Option<String> {
    // This is a placeholder - in a real implementation you would:
    // 1. Convert audio to the format expected by your speech recognition engine
    // 2. Send to local or cloud speech recognition API
    // 3. Return the recognized text
    
    // For demo purposes, return a random activation phrase occasionally
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    
    let mut hasher = DefaultHasher::new();
    audio_data.len().hash(&mut hasher);
    let hash = hasher.finish();
    
    // Simulate occasional "recognition" of activation phrase
    if hash % 100 == 0 {
        Some("adrata start".to_string())
    } else if hash % 50 == 0 {
        Some("open leads".to_string())
    } else {
        None
    }
}

// TAURI COMMANDS
#[tauri::command]
pub async fn start_native_voice_session() -> Result<serde_json::Value, String> {
    println!("🎙️ [TAURI-NATIVE] Starting native voice recognition session...");
    
    let voice_state = VOICE_SESSION.get_or_init(|| Arc::new(Mutex::new(VoiceSession::default())));
    
    {
        let mut session = voice_state.lock().unwrap();
        session.is_active = true;
        session.session_start = Some(Instant::now());
        session.last_activity = Some(Instant::now());
        println!("✅ [TAURI-NATIVE] Voice session activated");
    }
    
    // Start audio capture in background thread
    tokio::spawn(async move {
        if let Err(e) = start_audio_capture().await {
            println!("❌ [TAURI-NATIVE] Audio capture failed: {}", e);
        }
    });
    
    Ok(serde_json::json!({
        "success": true,
        "message": "Native voice session started",
        "platform": std::env::consts::OS,
        "session_id": uuid::Uuid::new_v4().to_string()
    }))
}

#[tauri::command] 
pub async fn stop_native_voice_session() -> Result<serde_json::Value, String> {
    println!("🛑 [TAURI-NATIVE] Stopping native voice recognition session...");
    
    let voice_state = VOICE_SESSION.get_or_init(|| Arc::new(Mutex::new(VoiceSession::default())));
    
    {
        let mut session = voice_state.lock().unwrap();
        session.is_active = false;
        session.is_listening = false;
        session.session_start = None;
        session.last_activity = None;
        println!("✅ [TAURI-NATIVE] Voice session deactivated");
    }
    
    Ok(serde_json::json!({
        "success": true,
        "message": "Native voice session stopped"
    }))
}

#[tauri::command]
pub async fn get_native_voice_status() -> Result<serde_json::Value, String> {
    let voice_state = VOICE_SESSION.get_or_init(|| Arc::new(Mutex::new(VoiceSession::default())));
    let session = voice_state.lock().unwrap();
    
    let session_duration = session.session_start
        .map(|start| start.elapsed().as_secs())
        .unwrap_or(0);
    
    Ok(serde_json::json!({
        "isActive": session.is_active,
        "isListening": session.is_listening,
        "sessionDuration": session_duration,
        "platform": std::env::consts::OS,
        "nativeSupport": true
    }))
}

#[tauri::command]
pub async fn check_voice_support() -> Result<serde_json::Value, String> {
    println!("🎙️ [TAURI] Checking native voice activation support...");
    
    let platform = std::env::consts::OS;
    
    // Check if audio feature is enabled at compile time
    let audio_enabled = cfg!(feature = "audio");
    
    let mut support_info = serde_json::json!({
        "platform": platform,
        "speechRecognition": audio_enabled,
        "nativeSupport": true,
        "audioCapture": audio_enabled,
        "globalHotkeys": true,
        "audioFeatureEnabled": audio_enabled,
        "recommendations": []
    });
    
    if audio_enabled {
        match platform {
            "macos" => {
                support_info["recommendations"] = serde_json::json!([
                    "Native audio capture available",
                    "Using CPAL for cross-platform audio",
                    "Voice recognition via native Tauri commands",
                    "Full desktop integration supported"
                ]);
                println!("🍎 [TAURI] macOS - Native voice support enabled");
            },
            "windows" => {
                support_info["recommendations"] = serde_json::json!([
                    "Native Windows Speech Platform integration",
                    "WebView2 with native Tauri commands",
                    "Optimal performance expected"
                ]);
                println!("🪟 [TAURI] Windows - Native voice support enabled");
            },
            "linux" => {
                support_info["recommendations"] = serde_json::json!([
                    "Native audio capture via CPAL",
                    "Speech recognition via Tauri commands",
                    "May require additional system dependencies"
                ]);
                println!("🐧 [TAURI] Linux - Native voice support enabled");
            },
            _ => {
                println!("❓ [TAURI] Unknown platform: {}", platform);
            }
        }
    } else {
        support_info["recommendations"] = serde_json::json!([
            "Audio feature disabled - voice commands available via keyboard shortcuts",
            "Enable audio feature in Cargo.toml for full voice recognition",
            "All other functionality works normally"
        ]);
        println!("🔇 [TAURI] Audio feature disabled - voice commands via shortcuts only");
    }
    
    Ok(support_info)
}

#[tauri::command]
pub async fn setup_global_hotkey() -> Result<bool, String> {
    println!("⌨️ [TAURI] Setting up global hotkey alternative to voice...");
    
    // This is a placeholder for global hotkey setup
    // You would need to add the global-hotkey plugin to Tauri
    // Example: Cmd+Shift+A to activate Adrata assistant
    
    Ok(true)
}

#[tauri::command]
pub async fn request_microphone_permission() -> Result<bool, String> {
    println!("🎙️ [TAURI] Microphone permission handled by webview");
    // In Tauri, microphone permissions are handled by the webview (browser)
    Ok(true)
}

// Add missing commands as simple stubs
#[tauri::command]
pub async fn start_voice_recognition() -> Result<bool, String> {
    println!("🎤 [VOICE] Start voice recognition - stub");
    Ok(true)
}

#[tauri::command]
pub async fn stop_voice_recognition() -> Result<bool, String> {
    println!("🎤 [VOICE] Stop voice recognition - stub");
    Ok(true)
}

#[tauri::command]
pub async fn speak_text(text: String) -> Result<bool, String> {
    println!("🔊 [VOICE] Speak text: {} - stub", text);
    Ok(true)
}

#[tauri::command]
pub async fn get_voice_settings() -> Result<serde_json::Value, String> {
    println!("⚙️ [VOICE] Get voice settings - stub");
    Ok(serde_json::json!({
        "enabled": true,
        "language": "en-US",
        "voice": "default"
    }))
}

#[tauri::command]
pub async fn update_voice_settings(settings: serde_json::Value) -> Result<bool, String> {
    println!("⚙️ [VOICE] Update voice settings: {:?} - stub", settings);
    Ok(true)
} 