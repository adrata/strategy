use serde::{Deserialize, Serialize};
use tauri::State;
use crate::database::HybridDatabaseManager;

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiRequest {
    pub endpoint: String,
    pub data: Option<serde_json::Value>,
    pub method: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiResponse {
    pub success: bool,
    pub data: Option<serde_json::Value>,
    pub error: Option<String>,
    pub message: Option<String>,
}

/// Generic API command that routes requests to appropriate handlers
#[tauri::command]
pub async fn generic_api_call(
    request: ApiRequest,
    db_manager: State<'_, std::sync::Arc<HybridDatabaseManager>>,
) -> Result<ApiResponse, String> {
    println!("🔄 [DESKTOP API] Handling request: {} {}", 
             request.method.as_deref().unwrap_or("GET"), 
             request.endpoint);

    let result = match request.endpoint.as_str() {
        // Companies API
        endpoint if endpoint.starts_with("/api/v1/companies") => {
            handle_companies_api(endpoint, request.data, &db_manager).await
        },
        
        // People API
        endpoint if endpoint.starts_with("/api/v1/people") => {
            handle_people_api(endpoint, request.data, &db_manager).await
        },
        
        // Actions API
        endpoint if endpoint.starts_with("/api/v1/actions") => {
            handle_actions_api(endpoint, request.data, &db_manager).await
        },
        
        // Speedrun API
        endpoint if endpoint.starts_with("/api/v1/speedrun") => {
            handle_speedrun_api(endpoint, request.data, &db_manager).await
        },
        
        // Chronicle API
        endpoint if endpoint.starts_with("/api/v1/chronicle") => {
            handle_chronicle_api(endpoint, request.data, &db_manager).await
        },
        
        // Intelligence API
        endpoint if endpoint.starts_with("/api/v1/intelligence") => {
            handle_intelligence_api(endpoint, request.data, &db_manager).await
        },
        
        // Auth API
        endpoint if endpoint.starts_with("/api/v1/auth") => {
            handle_auth_api(endpoint, request.data, &db_manager).await
        },
        
        // Data API
        endpoint if endpoint.starts_with("/api/v1/data") => {
            handle_data_api(endpoint, request.data, &db_manager).await
        },
        
        // Default case
        _ => {
            Ok(ApiResponse {
                success: false,
                data: None,
                error: Some(format!("Unknown endpoint: {}", request.endpoint)),
                message: Some("This API endpoint is not supported in desktop mode".to_string()),
            })
        }
    };

    match result {
        Ok(response) => {
            println!("✅ [DESKTOP API] Request completed successfully");
            Ok(response)
        },
        Err(error) => {
            println!("❌ [DESKTOP API] Request failed: {}", error);
            Ok(ApiResponse {
                success: false,
                data: None,
                error: Some(error),
                message: Some("Desktop API request failed".to_string()),
            })
        }
    }
}

/// Handle companies API requests
async fn handle_companies_api(
    endpoint: &str,
    data: Option<serde_json::Value>,
    db_manager: &State<'_, std::sync::Arc<HybridDatabaseManager>>,
) -> Result<ApiResponse, String> {
    if endpoint == "/api/v1/companies" {
        // Get companies list
        let filters = data.and_then(|d| serde_json::from_value(d).ok());
        let companies = crate::api::companies::get_companies(
            "default_workspace".to_string(),
            "default_user".to_string(),
            filters,
            db_manager.clone(),
        ).await?;
        
        Ok(ApiResponse {
            success: true,
            data: Some(serde_json::to_value(companies)?),
            error: None,
            message: Some("Companies retrieved successfully".to_string()),
        })
    } else {
        Ok(ApiResponse {
            success: false,
            data: None,
            error: Some("Company endpoint not implemented".to_string()),
            message: Some("This company endpoint is not yet implemented".to_string()),
        })
    }
}

/// Handle people API requests
async fn handle_people_api(
    endpoint: &str,
    data: Option<serde_json::Value>,
    db_manager: &State<'_, std::sync::Arc<HybridDatabaseManager>>,
) -> Result<ApiResponse, String> {
    if endpoint == "/api/v1/people" {
        // Get people list
        let filters = data.and_then(|d| serde_json::from_value(d).ok());
        let people = crate::api::people::get_people(
            "default_workspace".to_string(),
            "default_user".to_string(),
            filters,
            db_manager.clone(),
        ).await?;
        
        Ok(ApiResponse {
            success: true,
            data: Some(serde_json::to_value(people)?),
            error: None,
            message: Some("People retrieved successfully".to_string()),
        })
    } else {
        Ok(ApiResponse {
            success: false,
            data: None,
            error: Some("People endpoint not implemented".to_string()),
            message: Some("This people endpoint is not yet implemented".to_string()),
        })
    }
}

/// Handle actions API requests
async fn handle_actions_api(
    endpoint: &str,
    data: Option<serde_json::Value>,
    db_manager: &State<'_, std::sync::Arc<HybridDatabaseManager>>,
) -> Result<ApiResponse, String> {
    if endpoint == "/api/v1/actions" {
        // Get actions list
        let filters = data.and_then(|d| serde_json::from_value(d).ok());
        let actions = crate::api::actions::get_actions(
            "default_workspace".to_string(),
            "default_user".to_string(),
            filters,
            db_manager.clone(),
        ).await?;
        
        Ok(ApiResponse {
            success: true,
            data: Some(serde_json::to_value(actions)?),
            error: None,
            message: Some("Actions retrieved successfully".to_string()),
        })
    } else {
        Ok(ApiResponse {
            success: false,
            data: None,
            error: Some("Actions endpoint not implemented".to_string()),
            message: Some("This actions endpoint is not yet implemented".to_string()),
        })
    }
}

/// Handle speedrun API requests
async fn handle_speedrun_api(
    endpoint: &str,
    data: Option<serde_json::Value>,
    db_manager: &State<'_, std::sync::Arc<HybridDatabaseManager>>,
) -> Result<ApiResponse, String> {
    if endpoint == "/api/v1/speedrun" {
        // Get speedrun data
        let filters = data.and_then(|d| serde_json::from_value(d).ok());
        let speedrun_data = crate::api::speedrun::get_speedrun_data(
            "default_workspace".to_string(),
            "default_user".to_string(),
            filters,
            db_manager.clone(),
        ).await?;
        
        Ok(ApiResponse {
            success: true,
            data: Some(serde_json::to_value(speedrun_data)?),
            error: None,
            message: Some("Speedrun data retrieved successfully".to_string()),
        })
    } else {
        Ok(ApiResponse {
            success: false,
            data: None,
            error: Some("Speedrun endpoint not implemented".to_string()),
            message: Some("This speedrun endpoint is not yet implemented".to_string()),
        })
    }
}

/// Handle chronicle API requests
async fn handle_chronicle_api(
    endpoint: &str,
    data: Option<serde_json::Value>,
    db_manager: &State<'_, std::sync::Arc<HybridDatabaseManager>>,
) -> Result<ApiResponse, String> {
    if endpoint == "/api/v1/chronicle/generate" {
        // Generate chronicle report
        let report_data = data.ok_or("Report data is required")?;
        let report = crate::api::chronicle::generate_chronicle_report(
            "default_workspace".to_string(),
            "default_user".to_string(),
            report_data,
            db_manager.clone(),
        ).await?;
        
        Ok(ApiResponse {
            success: true,
            data: Some(serde_json::to_value(report)?),
            error: None,
            message: Some("Chronicle report generated successfully".to_string()),
        })
    } else {
        Ok(ApiResponse {
            success: false,
            data: None,
            error: Some("Chronicle endpoint not implemented".to_string()),
            message: Some("This chronicle endpoint is not yet implemented".to_string()),
        })
    }
}

/// Handle intelligence API requests
async fn handle_intelligence_api(
    endpoint: &str,
    data: Option<serde_json::Value>,
    db_manager: &State<'_, std::sync::Arc<HybridDatabaseManager>>,
) -> Result<ApiResponse, String> {
    Ok(ApiResponse {
        success: false,
        data: None,
        error: Some("Intelligence API not implemented".to_string()),
        message: Some("Intelligence API endpoints are not yet implemented in desktop mode".to_string()),
    })
}

/// Handle auth API requests
async fn handle_auth_api(
    endpoint: &str,
    data: Option<serde_json::Value>,
    db_manager: &State<'_, std::sync::Arc<HybridDatabaseManager>>,
) -> Result<ApiResponse, String> {
    if endpoint == "/api/v1/auth/sign-in" {
        // Handle sign in
        let credentials = data.ok_or("Credentials are required")?;
        // TODO: Implement actual authentication
        Ok(ApiResponse {
            success: true,
            data: Some(serde_json::json!({
                "user": {
                    "id": "desktop_user",
                    "email": "user@desktop.local",
                    "name": "Desktop User"
                },
                "workspace": {
                    "id": "desktop_workspace",
                    "name": "Desktop Workspace"
                }
            })),
            error: None,
            message: Some("Authentication successful (desktop mode)".to_string()),
        })
    } else if endpoint == "/api/v1/auth/status" {
        // Get auth status
        Ok(ApiResponse {
            success: true,
            data: Some(serde_json::json!({
                "authenticated": true,
                "user": {
                    "id": "desktop_user",
                    "email": "user@desktop.local",
                    "name": "Desktop User"
                }
            })),
            error: None,
            message: Some("Auth status retrieved".to_string()),
        })
    } else {
        Ok(ApiResponse {
            success: false,
            data: None,
            error: Some("Auth endpoint not implemented".to_string()),
            message: Some("This auth endpoint is not yet implemented".to_string()),
        })
    }
}

/// Handle data API requests
async fn handle_data_api(
    endpoint: &str,
    data: Option<serde_json::Value>,
    db_manager: &State<'_, std::sync::Arc<HybridDatabaseManager>>,
) -> Result<ApiResponse, String> {
    Ok(ApiResponse {
        success: false,
        data: None,
        error: Some("Data API not implemented".to_string()),
        message: Some("Data API endpoints are not yet implemented in desktop mode".to_string()),
    })
}
