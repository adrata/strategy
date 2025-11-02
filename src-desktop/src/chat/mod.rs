use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatMessage {
    pub id: String,
    pub content: String,
    pub role: String, // "user" or "assistant"
    pub timestamp: String,
    pub session_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatSession {
    pub id: String,
    pub title: String,
    pub created_at: String,
    pub updated_at: String,
    pub workspace_id: String,
    pub user_id: String,
    pub app_type: String,
}

#[tauri::command]
pub async fn send_message_desktop(
    _workspace_id: String,
    _user_id: String,
    session_id: String,
    message: String,
    app_type: Option<String>
) -> Result<ChatMessage, String> {
    println!("💬 [TAURI] Sending desktop chat message: session={}, app={:?}", session_id, app_type);
    
    let chat_message = ChatMessage {
        id: format!("msg_{}", chrono::Utc::now().timestamp_nanos_opt().unwrap_or(0)),
        content: message,
        role: "user".to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
        session_id: session_id.clone(),
    };
    
    // In production, this would:
    // 1. Save message to database
    // 2. Send to AI service
    // 3. Return AI response
    
    println!("✅ [TAURI] Desktop chat message sent successfully");
    Ok(chat_message)
}

#[tauri::command]
pub async fn get_chat_sessions_desktop(
    workspace_id: String,
    user_id: String,
    app_type: Option<String>
) -> Result<Vec<ChatSession>, String> {
    println!("💬 [TAURI] Getting desktop chat sessions for workspace: {}, user: {}", workspace_id, user_id);
    
    // In production, this would retrieve from database
    let sessions = vec![
        ChatSession {
            id: "main-chat".to_string(),
            title: "Main Chat".to_string(),
            created_at: chrono::Utc::now().to_rfc3339(),
            updated_at: chrono::Utc::now().to_rfc3339(),
            workspace_id: workspace_id.clone(),
            user_id: user_id.clone(),
            app_type: app_type.unwrap_or_else(|| "Speedrun".to_string()),
        }
    ];
    
    println!("✅ [TAURI] Found {} desktop chat sessions", sessions.len());
    Ok(sessions)
}

#[tauri::command]
pub async fn create_chat_session_desktop(
    workspace_id: String,
    user_id: String,
    title: String,
    app_type: Option<String>
) -> Result<ChatSession, String> {
    println!("💬 [TAURI] Creating desktop chat session: {}", title);
    
    let session = ChatSession {
        id: format!("session_{}", chrono::Utc::now().timestamp_nanos_opt().unwrap_or(0)),
        title,
        created_at: chrono::Utc::now().to_rfc3339(),
        updated_at: chrono::Utc::now().to_rfc3339(),
        workspace_id,
        user_id,
        app_type: app_type.unwrap_or_else(|| "Speedrun".to_string()),
    };
    
    // In production, this would save to database
    
    println!("✅ [TAURI] Desktop chat session created: {}", session.id);
    Ok(session)
}

#[tauri::command]
pub async fn get_chat_messages_desktop(
    session_id: String,
    _limit: Option<i32>
) -> Result<Vec<ChatMessage>, String> {
    println!("💬 [TAURI] Getting desktop chat messages for session: {}", session_id);
    
    // In production, this would retrieve from database
    let messages = vec![];
    
    println!("✅ [TAURI] Found {} desktop chat messages", messages.len());
    Ok(messages)
}
