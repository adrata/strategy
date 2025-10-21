use crate::database::models::*;
use crate::database::HybridDatabaseManager;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct ChronicleFilters {
    pub limit: Option<i32>,
    pub workspace_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChronicleReport {
    pub id: String,
    pub workspace_id: String,
    pub title: String,
    pub report_date: String,
    pub report_type: String,
    pub content: String,
    pub created_by: String,
    pub created_at: String,
    pub updated_at: String,
    pub deleted_at: Option<String>,
    pub shares: Vec<ChronicleShare>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChronicleShare {
    pub id: String,
    pub report_id: String,
    pub shared_with: String,
    pub shared_at: String,
    pub expires_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateChronicleReportRequest {
    pub title: String,
    pub report_date: String,
    pub report_type: String,
    pub content: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChronicleResponse {
    pub success: bool,
    pub data: Option<ChronicleReport>,
    pub error: Option<String>,
    pub meta: Option<ChronicleMeta>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChronicleListResponse {
    pub success: bool,
    pub data: Option<ChronicleListData>,
    pub error: Option<String>,
    pub meta: Option<ChronicleMeta>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChronicleListData {
    pub reports: Vec<ChronicleReport>,
    pub total: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChronicleMeta {
    pub message: Option<String>,
    pub user_id: Option<String>,
    pub workspace_id: Option<String>,
}

/// Get chronicle reports
#[tauri::command]
pub async fn get_chronicle_reports(
    filters: ChronicleFilters,
    db_manager: State<'_, HybridDatabaseManager>,
) -> Result<ChronicleListResponse, String> {
    // Get database connections
    let sqlite_pool = db_manager.get_sqlite_pool().await
        .map_err(|e| format!("Failed to get SQLite connection: {}", e))?;

    // Extract filter parameters
    let limit = filters.limit.unwrap_or(20);
    let workspace_id = filters.workspace_id.unwrap_or_else(|| "default".to_string());

    // TODO: Get from auth context and validate access
    let user_id = "system".to_string();

    // Check if this is Ryan Serrato in Notary Everyday (access control)
    let is_notary_everyday = workspace_id == "01K1VBYmf75hgmvmz06psnc9ug" || 
                            workspace_id == "01K7DNYR5VZ7JY36KGKKN76XZ1" || 
                            workspace_id == "cmezxb1ez0001pc94yry3ntjk";
    let is_ryan_serrato = user_id == "cmf0kew2z0000pcsexylorpxp";
    
    if !(is_notary_everyday && is_ryan_serrato) {
        return Ok(ChronicleListResponse {
            success: false,
            data: None,
            error: Some("Access denied".to_string()),
            meta: None,
        });
    }

    // Query reports from database
    let reports_query = r#"
        SELECT 
            cr.id,
            cr.workspace_id,
            cr.title,
            cr.report_date,
            cr.report_type,
            cr.content,
            cr.created_by,
            cr.created_at,
            cr.updated_at,
            cr.deleted_at
        FROM chronicle_reports cr
        WHERE cr.workspace_id = ? 
        AND cr.deleted_at IS NULL
        ORDER BY cr.created_at DESC
        LIMIT ?
    "#;

    let report_rows = sqlx::query(reports_query)
        .bind(&workspace_id)
        .bind(limit)
        .fetch_all(&*sqlite_pool)
        .await
        .map_err(|e| format!("Failed to fetch chronicle reports: {}", e))?;

    let mut reports = Vec::new();
    for row in report_rows {
        let report_id: String = row.get("id");
        
        // Get shares for this report
        let shares_query = r#"
            SELECT 
                id,
                report_id,
                shared_with,
                shared_at,
                expires_at
            FROM chronicle_shares
            WHERE report_id = ?
        "#;
        
        let share_rows = sqlx::query(shares_query)
            .bind(&report_id)
            .fetch_all(&*sqlite_pool)
            .await
            .map_err(|e| format!("Failed to fetch chronicle shares: {}", e))?;

        let mut shares = Vec::new();
        for share_row in share_rows {
            shares.push(ChronicleShare {
                id: share_row.get("id"),
                report_id: share_row.get("report_id"),
                shared_with: share_row.get("shared_with"),
                shared_at: share_row.get("shared_at"),
                expires_at: share_row.get("expires_at"),
            });
        }

        let report = ChronicleReport {
            id: report_id,
            workspace_id: row.get("workspace_id"),
            title: row.get("title"),
            report_date: row.get("report_date"),
            report_type: row.get("report_type"),
            content: row.get("content"),
            created_by: row.get("created_by"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
            deleted_at: row.get("deleted_at"),
            shares,
        };

        reports.push(report);
    }

    // If no reports in database, return empty list
    // TODO: Consider falling back to sample data if needed

    Ok(ChronicleListResponse {
        success: true,
        data: Some(ChronicleListData {
            reports: reports.clone(),
            total: reports.len() as i32,
        }),
        error: None,
        meta: Some(ChronicleMeta {
            message: None,
            user_id: Some(user_id),
            workspace_id: Some(workspace_id),
        }),
    })
}

/// Create a new chronicle report
#[tauri::command]
pub async fn create_chronicle_report(
    request: CreateChronicleReportRequest,
    db_manager: State<'_, HybridDatabaseManager>,
) -> Result<ChronicleResponse, String> {
    // Get database connections
    let sqlite_pool = db_manager.get_sqlite_pool().await
        .map_err(|e| format!("Failed to get SQLite connection: {}", e))?;

    // TODO: Get from auth context
    let workspace_id = "default".to_string();
    let user_id = "system".to_string();

    // Validate required fields
    if request.title.is_empty() || request.report_type.is_empty() || request.content.is_empty() {
        return Ok(ChronicleResponse {
            success: false,
            data: None,
            error: Some("Title, report type, and content are required".to_string()),
            meta: None,
        });
    }

    // Generate new report ID
    let report_id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    
    // Parse report date
    let report_date = if let Ok(parsed_date) = chrono::DateTime::parse_from_rfc3339(&request.report_date) {
        parsed_date.to_rfc3339()
    } else {
        // If parsing fails, use current date
        now.clone()
    };

    // Insert chronicle report
    let insert_query = r#"
        INSERT INTO chronicle_reports (
            id, workspace_id, title, report_date, report_type, content,
            created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    "#;

    sqlx::query(insert_query)
        .bind(&report_id)
        .bind(&workspace_id)
        .bind(&request.title)
        .bind(&report_date)
        .bind(&request.report_type)
        .bind(&request.content)
        .bind(&user_id)
        .bind(&now)
        .bind(&now)
        .execute(&*sqlite_pool)
        .await
        .map_err(|e| format!("Failed to create chronicle report: {}", e))?;

    // Fetch the created report
    let report_row = sqlx::query("SELECT * FROM chronicle_reports WHERE id = ?")
        .bind(&report_id)
        .fetch_one(&*sqlite_pool)
        .await
        .map_err(|e| format!("Failed to fetch created chronicle report: {}", e))?;

    // Get shares for this report (will be empty for new reports)
    let shares_query = r#"
        SELECT 
            id,
            report_id,
            shared_with,
            shared_at,
            expires_at
        FROM chronicle_shares
        WHERE report_id = ?
    "#;
    
    let share_rows = sqlx::query(shares_query)
        .bind(&report_id)
        .fetch_all(&*sqlite_pool)
        .await
        .map_err(|e| format!("Failed to fetch chronicle shares: {}", e))?;

    let mut shares = Vec::new();
    for share_row in share_rows {
        shares.push(ChronicleShare {
            id: share_row.get("id"),
            report_id: share_row.get("report_id"),
            shared_with: share_row.get("shared_with"),
            shared_at: share_row.get("shared_at"),
            expires_at: share_row.get("expires_at"),
        });
    }

    let report = ChronicleReport {
        id: report_row.get("id"),
        workspace_id: report_row.get("workspace_id"),
        title: report_row.get("title"),
        report_date: report_row.get("report_date"),
        report_type: report_row.get("report_type"),
        content: report_row.get("content"),
        created_by: report_row.get("created_by"),
        created_at: report_row.get("created_at"),
        updated_at: report_row.get("updated_at"),
        deleted_at: report_row.get("deleted_at"),
        shares,
    };

    Ok(ChronicleResponse {
        success: true,
        data: Some(report),
        error: None,
        meta: Some(ChronicleMeta {
            message: Some("Chronicle report created successfully".to_string()),
            user_id: Some(user_id),
            workspace_id: Some(workspace_id),
        }),
    })
}

/// Get a specific chronicle report by ID
#[tauri::command]
pub async fn get_chronicle_report_by_id(
    report_id: String,
    db_manager: State<'_, HybridDatabaseManager>,
) -> Result<ChronicleResponse, String> {
    // Get database connections
    let sqlite_pool = db_manager.get_sqlite_pool().await
        .map_err(|e| format!("Failed to get SQLite connection: {}", e))?;

    let report_row = sqlx::query("SELECT * FROM chronicle_reports WHERE id = ? AND deleted_at IS NULL")
        .bind(&report_id)
        .fetch_optional(&*sqlite_pool)
        .await
        .map_err(|e| format!("Failed to fetch chronicle report: {}", e))?;

    match report_row {
        Some(row) => {
            // Get shares for this report
            let shares_query = r#"
                SELECT 
                    id,
                    report_id,
                    shared_with,
                    shared_at,
                    expires_at
                FROM chronicle_shares
                WHERE report_id = ?
            "#;
            
            let share_rows = sqlx::query(shares_query)
                .bind(&report_id)
                .fetch_all(&*sqlite_pool)
                .await
                .map_err(|e| format!("Failed to fetch chronicle shares: {}", e))?;

            let mut shares = Vec::new();
            for share_row in share_rows {
                shares.push(ChronicleShare {
                    id: share_row.get("id"),
                    report_id: share_row.get("report_id"),
                    shared_with: share_row.get("shared_with"),
                    shared_at: share_row.get("shared_at"),
                    expires_at: share_row.get("expires_at"),
                });
            }

            let report = ChronicleReport {
                id: row.get("id"),
                workspace_id: row.get("workspace_id"),
                title: row.get("title"),
                report_date: row.get("report_date"),
                report_type: row.get("report_type"),
                content: row.get("content"),
                created_by: row.get("created_by"),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
                deleted_at: row.get("deleted_at"),
                shares,
            };

            Ok(ChronicleResponse {
                success: true,
                data: Some(report),
                error: None,
                meta: None,
            })
        }
        None => {
            Ok(ChronicleResponse {
                success: false,
                data: None,
                error: Some("Chronicle report not found".to_string()),
                meta: None,
            })
        }
    }
}
