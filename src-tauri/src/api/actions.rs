use crate::database::models::*;
use crate::database::HybridDatabaseManager;
use serde::{Deserialize, Serialize};
use tauri::State;
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize)]
pub struct ActionFilters {
    pub page: Option<i32>,
    pub limit: Option<i32>,
    pub search: Option<String>,
    pub status: Option<String>,
    pub priority: Option<String>,
    pub action_type: Option<String>,
    pub company_id: Option<String>,
    pub person_id: Option<String>,
    pub sort_by: Option<String>,
    pub sort_order: Option<String>,
    pub counts_only: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateActionRequest {
    pub action_type: String,
    pub subject: String,
    pub description: Option<String>,
    pub outcome: Option<String>,
    pub scheduled_at: Option<String>,
    pub completed_at: Option<String>,
    pub status: Option<String>,
    pub priority: Option<String>,
    pub company_id: Option<String>,
    pub person_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateActionRequest {
    pub action_type: Option<String>,
    pub subject: Option<String>,
    pub description: Option<String>,
    pub outcome: Option<String>,
    pub scheduled_at: Option<String>,
    pub completed_at: Option<String>,
    pub status: Option<String>,
    pub priority: Option<String>,
    pub company_id: Option<String>,
    pub person_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ActionResponse {
    pub success: bool,
    pub data: Option<DesktopAction>,
    pub error: Option<String>,
    pub meta: Option<ActionMeta>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ActionListResponse {
    pub success: bool,
    pub data: Option<Vec<DesktopAction>>,
    pub error: Option<String>,
    pub meta: Option<ActionListMeta>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ActionMeta {
    pub message: Option<String>,
    pub user_id: Option<String>,
    pub workspace_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ActionListMeta {
    pub pagination: Option<PaginationMeta>,
    pub filters: Option<ActionFilters>,
    pub user_id: Option<String>,
    pub workspace_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PaginationMeta {
    pub page: i32,
    pub limit: i32,
    pub total_count: i32,
    pub total_pages: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ActionCounts {
    pub planned: i32,
    pub in_progress: i32,
    pub completed: i32,
    pub cancelled: i32,
}

/// Get actions with filtering and pagination
#[tauri::command]
pub async fn get_actions(
    filters: ActionFilters,
    db_manager: State<'_, HybridDatabaseManager>,
) -> Result<ActionListResponse, String> {
    let start_time = std::time::Instant::now();
    
    // Get database connections
    let sqlite_pool = db_manager.get_sqlite_pool().await
        .map_err(|e| format!("Failed to get SQLite connection: {}", e))?;
    
    let pg_pool = db_manager.get_pg_pool().await
        .map_err(|e| format!("Failed to get PostgreSQL connection: {}", e))?;

    // Extract filter parameters
    let page = filters.page.unwrap_or(1);
    let limit = filters.limit.unwrap_or(100).min(1000); // Cap at 1000
    let search = filters.search.unwrap_or_default();
    let status = filters.status.unwrap_or_default();
    let priority = filters.priority.unwrap_or_default();
    let action_type = filters.action_type.unwrap_or_default();
    let company_id = filters.company_id.unwrap_or_default();
    let person_id = filters.person_id.unwrap_or_default();
    let sort_by = filters.sort_by.unwrap_or_else(|| "created_at".to_string());
    let sort_order = filters.sort_order.unwrap_or_else(|| "desc".to_string());
    let counts_only = filters.counts_only.unwrap_or(false);
    
    let offset = (page - 1) * limit;

    // Build WHERE clause
    let mut where_clause = "WHERE deleted_at IS NULL".to_string();
    let mut params: Vec<Box<dyn sqlx::Encode<'_, sqlx::Sqlite> + Send + Sync>> = Vec::new();
    let mut param_count = 0;

    if !search.is_empty() {
        param_count += 1;
        where_clause.push_str(&format!(" AND (subject LIKE ?{} OR description LIKE ?{} OR outcome LIKE ?{})", 
            param_count, param_count, param_count));
        params.push(Box::new(format!("%{}%", search)));
    }

    if !status.is_empty() {
        param_count += 1;
        where_clause.push_str(&format!(" AND status = ?{}", param_count));
        params.push(Box::new(status));
    }

    if !priority.is_empty() {
        param_count += 1;
        where_clause.push_str(&format!(" AND priority = ?{}", param_count));
        params.push(Box::new(priority));
    }

    if !action_type.is_empty() {
        param_count += 1;
        where_clause.push_str(&format!(" AND type LIKE ?{}", param_count));
        params.push(Box::new(format!("%{}%", action_type)));
    }

    if !company_id.is_empty() {
        param_count += 1;
        where_clause.push_str(&format!(" AND company_id = ?{}", param_count));
        params.push(Box::new(company_id));
    }

    if !person_id.is_empty() {
        param_count += 1;
        where_clause.push_str(&format!(" AND person_id = ?{}", param_count));
        params.push(Box::new(person_id));
    }

    // Handle counts only request
    if counts_only {
        let counts_query = format!(
            "SELECT status, COUNT(*) as count FROM actions {} GROUP BY status",
            where_clause
        );
        
        let counts_rows = sqlx::query(&counts_query)
            .fetch_all(&*sqlite_pool)
            .await
            .map_err(|e| format!("Failed to fetch action counts: {}", e))?;

        let mut counts = ActionCounts {
            planned: 0,
            in_progress: 0,
            completed: 0,
            cancelled: 0,
        };

        for row in counts_rows {
            let status: String = row.get("status");
            let count: i32 = row.get("count");
            
            match status.as_str() {
                "PLANNED" => counts.planned = count,
                "IN_PROGRESS" => counts.in_progress = count,
                "COMPLETED" => counts.completed = count,
                "CANCELLED" => counts.cancelled = count,
                _ => {}
            }
        }

        return Ok(ActionListResponse {
            success: true,
            data: None,
            error: None,
            meta: Some(ActionListMeta {
                pagination: None,
                filters: Some(filters),
                user_id: None,
                workspace_id: None,
            }),
        });
    }

    // Build ORDER BY clause
    let valid_sort_fields = ["created_at", "updated_at", "subject", "status", "priority", "scheduled_at"];
    let sort_field = if valid_sort_fields.contains(&sort_by.as_str()) {
        sort_by
    } else {
        "created_at".to_string()
    };
    
    let order_clause = format!("ORDER BY {} {}", sort_field, 
        if sort_order.to_lowercase() == "asc" { "ASC" } else { "DESC" });

    // Get total count
    let count_query = format!("SELECT COUNT(*) as count FROM actions {}", where_clause);
    let total_count: i32 = sqlx::query_scalar(&count_query)
        .fetch_one(&*sqlite_pool)
        .await
        .map_err(|e| format!("Failed to count actions: {}", e))?;

    // Get actions with pagination
    let actions_query = format!(
        "SELECT * FROM actions {} {} LIMIT ? OFFSET ?",
        where_clause, order_clause
    );
    
    let actions_rows = sqlx::query(&actions_query)
        .bind(limit)
        .bind(offset)
        .fetch_all(&*sqlite_pool)
        .await
        .map_err(|e| format!("Failed to fetch actions: {}", e))?;

    let mut actions = Vec::new();
    for row in actions_rows {
        let action = DesktopAction {
            id: row.get("id"),
            action_type: row.get("type"),
            subject: row.get("subject"),
            description: row.get("description"),
            outcome: row.get("outcome"),
            scheduled_at: row.get("scheduled_at"),
            completed_at: row.get("completed_at"),
            status: row.get("status"),
            priority: row.get("priority"),
            company_id: row.get("company_id"),
            person_id: row.get("person_id"),
            user_id: row.get("user_id"),
            workspace_id: row.get("workspace_id"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
            deleted_at: row.get("deleted_at"),
            needs_sync: row.get("needs_sync"),
            last_sync_at: row.get("last_sync_at"),
        };
        actions.push(action);
    }

    let total_pages = (total_count as f64 / limit as f64).ceil() as i32;

    Ok(ActionListResponse {
        success: true,
        data: Some(actions),
        error: None,
        meta: Some(ActionListMeta {
            pagination: Some(PaginationMeta {
                page,
                limit,
                total_count,
                total_pages,
            }),
            filters: Some(filters),
            user_id: None,
            workspace_id: None,
        }),
    })
}

/// Create a new action
#[tauri::command]
pub async fn create_action(
    request: CreateActionRequest,
    db_manager: State<'_, HybridDatabaseManager>,
) -> Result<ActionResponse, String> {
    // Validate required fields
    if request.action_type.is_empty() || request.subject.is_empty() {
        return Ok(ActionResponse {
            success: false,
            data: None,
            error: Some("Type and subject are required".to_string()),
            meta: None,
        });
    }

    // Get database connections
    let sqlite_pool = db_manager.get_sqlite_pool().await
        .map_err(|e| format!("Failed to get SQLite connection: {}", e))?;

    // Validate foreign key references if provided
    if let Some(ref company_id) = request.company_id {
        if !company_id.is_empty() {
            let company_exists: bool = sqlx::query_scalar(
                "SELECT EXISTS(SELECT 1 FROM companies WHERE id = ? AND deleted_at IS NULL)"
            )
            .bind(company_id)
            .fetch_one(&*sqlite_pool)
            .await
            .map_err(|e| format!("Failed to validate company: {}", e))?;
            
            if !company_exists {
                return Ok(ActionResponse {
                    success: false,
                    data: None,
                    error: Some(format!("Company with ID {} not found or has been deleted", company_id)),
                    meta: None,
                });
            }
        }
    }

    if let Some(ref person_id) = request.person_id {
        if !person_id.is_empty() {
            let person_exists: bool = sqlx::query_scalar(
                "SELECT EXISTS(SELECT 1 FROM people WHERE id = ? AND deleted_at IS NULL)"
            )
            .bind(person_id)
            .fetch_one(&*sqlite_pool)
            .await
            .map_err(|e| format!("Failed to validate person: {}", e))?;
            
            if !person_exists {
                return Ok(ActionResponse {
                    success: false,
                    data: None,
                    error: Some(format!("Person with ID {} not found or has been deleted", person_id)),
                    meta: None,
                });
            }
        }
    }

    // Generate new action ID
    let action_id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    
    // Prepare action data
    let status = request.status.unwrap_or_else(|| "PLANNED".to_string()).to_uppercase();
    let priority = request.priority.unwrap_or_else(|| "NORMAL".to_string());

    // Insert action
    let insert_query = r#"
        INSERT INTO actions (
            id, type, subject, description, outcome, scheduled_at, completed_at,
            status, priority, company_id, person_id, user_id, workspace_id,
            created_at, updated_at, needs_sync
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    "#;

    sqlx::query(insert_query)
        .bind(&action_id)
        .bind(&request.action_type)
        .bind(&request.subject)
        .bind(&request.description)
        .bind(&request.outcome)
        .bind(&request.scheduled_at)
        .bind(&request.completed_at)
        .bind(&status)
        .bind(&priority)
        .bind(&request.company_id)
        .bind(&request.person_id)
        .bind("system") // TODO: Get from auth context
        .bind("default") // TODO: Get from auth context
        .bind(&now)
        .bind(&now)
        .bind(true) // needs_sync
        .execute(&*sqlite_pool)
        .await
        .map_err(|e| format!("Failed to create action: {}", e))?;

    // Fetch the created action
    let action_row = sqlx::query("SELECT * FROM actions WHERE id = ?")
        .bind(&action_id)
        .fetch_one(&*sqlite_pool)
        .await
        .map_err(|e| format!("Failed to fetch created action: {}", e))?;

    let action = DesktopAction {
        id: action_row.get("id"),
        action_type: action_row.get("type"),
        subject: action_row.get("subject"),
        description: action_row.get("description"),
        outcome: action_row.get("outcome"),
        scheduled_at: action_row.get("scheduled_at"),
        completed_at: action_row.get("completed_at"),
        status: action_row.get("status"),
        priority: action_row.get("priority"),
        company_id: action_row.get("company_id"),
        person_id: action_row.get("person_id"),
        user_id: action_row.get("user_id"),
        workspace_id: action_row.get("workspace_id"),
        created_at: action_row.get("created_at"),
        updated_at: action_row.get("updated_at"),
        deleted_at: action_row.get("deleted_at"),
        needs_sync: action_row.get("needs_sync"),
        last_sync_at: action_row.get("last_sync_at"),
    };

    Ok(ActionResponse {
        success: true,
        data: Some(action),
        error: None,
        meta: Some(ActionMeta {
            message: Some("Action created successfully".to_string()),
            user_id: Some("system".to_string()),
            workspace_id: Some("default".to_string()),
        }),
    })
}

/// Update an action
#[tauri::command]
pub async fn update_action(
    action_id: String,
    request: UpdateActionRequest,
    db_manager: State<'_, HybridDatabaseManager>,
) -> Result<ActionResponse, String> {
    // Get database connections
    let sqlite_pool = db_manager.get_sqlite_pool().await
        .map_err(|e| format!("Failed to get SQLite connection: {}", e))?;

    // Get existing action to check current values
    let existing_action_row = sqlx::query("SELECT * FROM actions WHERE id = ? AND deleted_at IS NULL")
        .bind(&action_id)
        .fetch_optional(&*sqlite_pool)
        .await
        .map_err(|e| format!("Failed to fetch existing action: {}", e))?;

    let existing_action = match existing_action_row {
        Some(row) => row,
        None => {
            return Ok(ActionResponse {
                success: false,
                data: None,
                error: Some("Action not found".to_string()),
                meta: None,
            });
        }
    };

    // Get current company_id from existing action
    let current_company_id: Option<String> = existing_action.get("company_id");

    // Validate foreign key references if provided AND being changed
    if let Some(ref company_id) = request.company_id {
        if !company_id.is_empty() && current_company_id.as_ref() != Some(company_id) {
            let company_exists: bool = sqlx::query_scalar(
                "SELECT EXISTS(SELECT 1 FROM companies WHERE id = ? AND deleted_at IS NULL)"
            )
            .bind(company_id)
            .fetch_one(&*sqlite_pool)
            .await
            .map_err(|e| format!("Failed to validate company: {}", e))?;
            
            if !company_exists {
                return Ok(ActionResponse {
                    success: false,
                    data: None,
                    error: Some(format!("Company with ID {} not found or has been deleted", company_id)),
                    meta: None,
                });
            }
        }
    }

    // Get current person_id from existing action
    let current_person_id: Option<String> = existing_action.get("person_id");

    if let Some(ref person_id) = request.person_id {
        if !person_id.is_empty() && current_person_id.as_ref() != Some(person_id) {
            let person_exists: bool = sqlx::query_scalar(
                "SELECT EXISTS(SELECT 1 FROM people WHERE id = ? AND deleted_at IS NULL)"
            )
            .bind(person_id)
            .fetch_one(&*sqlite_pool)
            .await
            .map_err(|e| format!("Failed to validate person: {}", e))?;
            
            if !person_exists {
                return Ok(ActionResponse {
                    success: false,
                    data: None,
                    error: Some(format!("Person with ID {} not found or has been deleted", person_id)),
                    meta: None,
                });
            }
        }
    }

    // Build update query dynamically
    let mut update_fields = Vec::new();
    let mut params: Vec<Box<dyn sqlx::Encode<'_, sqlx::Sqlite> + Send + Sync>> = Vec::new();

    if let Some(ref action_type) = request.action_type {
        update_fields.push("type = ?");
        params.push(Box::new(action_type.clone()));
    }
    if let Some(ref subject) = request.subject {
        update_fields.push("subject = ?");
        params.push(Box::new(subject.clone()));
    }
    if let Some(ref description) = request.description {
        update_fields.push("description = ?");
        params.push(Box::new(description.clone()));
    }
    if let Some(ref outcome) = request.outcome {
        update_fields.push("outcome = ?");
        params.push(Box::new(outcome.clone()));
    }
    if let Some(ref scheduled_at) = request.scheduled_at {
        update_fields.push("scheduled_at = ?");
        params.push(Box::new(scheduled_at.clone()));
    }
    if let Some(ref completed_at) = request.completed_at {
        update_fields.push("completed_at = ?");
        params.push(Box::new(completed_at.clone()));
    }
    if let Some(ref status) = request.status {
        update_fields.push("status = ?");
        params.push(Box::new(status.to_uppercase()));
    }
    if let Some(ref priority) = request.priority {
        update_fields.push("priority = ?");
        params.push(Box::new(priority.clone()));
    }
    if let Some(ref company_id) = request.company_id {
        update_fields.push("company_id = ?");
        params.push(Box::new(company_id.clone()));
    }
    if let Some(ref person_id) = request.person_id {
        update_fields.push("person_id = ?");
        params.push(Box::new(person_id.clone()));
    }

    if update_fields.is_empty() {
        return Ok(ActionResponse {
            success: false,
            data: None,
            error: Some("No fields to update".to_string()),
            meta: None,
        });
    }

    // Always update updated_at and needs_sync
    update_fields.push("updated_at = ?");
    params.push(Box::new(chrono::Utc::now().to_rfc3339()));
    update_fields.push("needs_sync = ?");
    params.push(Box::new(true));

    // Add action_id as the last parameter
    params.push(Box::new(action_id.clone()));

    let update_query = format!(
        "UPDATE actions SET {} WHERE id = ?",
        update_fields.join(", ")
    );

    sqlx::query(&update_query)
        .execute(&*sqlite_pool)
        .await
        .map_err(|e| format!("Failed to update action: {}", e))?;

    // Fetch the updated action
    let action_row = sqlx::query("SELECT * FROM actions WHERE id = ?")
        .bind(&action_id)
        .fetch_one(&*sqlite_pool)
        .await
        .map_err(|e| format!("Failed to fetch updated action: {}", e))?;

    let action = DesktopAction {
        id: action_row.get("id"),
        action_type: action_row.get("type"),
        subject: action_row.get("subject"),
        description: action_row.get("description"),
        outcome: action_row.get("outcome"),
        scheduled_at: action_row.get("scheduled_at"),
        completed_at: action_row.get("completed_at"),
        status: action_row.get("status"),
        priority: action_row.get("priority"),
        company_id: action_row.get("company_id"),
        person_id: action_row.get("person_id"),
        user_id: action_row.get("user_id"),
        workspace_id: action_row.get("workspace_id"),
        created_at: action_row.get("created_at"),
        updated_at: action_row.get("updated_at"),
        deleted_at: action_row.get("deleted_at"),
        needs_sync: action_row.get("needs_sync"),
        last_sync_at: action_row.get("last_sync_at"),
    };

    Ok(ActionResponse {
        success: true,
        data: Some(action),
        error: None,
        meta: Some(ActionMeta {
            message: Some("Action updated successfully".to_string()),
            user_id: Some("system".to_string()),
            workspace_id: Some("default".to_string()),
        }),
    })
}

/// Delete an action
#[tauri::command]
pub async fn delete_action(
    action_id: String,
    hard_delete: Option<bool>,
    db_manager: State<'_, HybridDatabaseManager>,
) -> Result<ActionResponse, String> {
    // Get database connections
    let sqlite_pool = db_manager.get_sqlite_pool().await
        .map_err(|e| format!("Failed to get SQLite connection: {}", e))?;

    // Check if action exists
    let action_exists: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM actions WHERE id = ? AND deleted_at IS NULL)"
    )
    .bind(&action_id)
    .fetch_one(&*sqlite_pool)
    .await
    .map_err(|e| format!("Failed to check action existence: {}", e))?;

    if !action_exists {
        return Ok(ActionResponse {
            success: false,
            data: None,
            error: Some("Action not found".to_string()),
            meta: None,
        });
    }

    let hard_delete = hard_delete.unwrap_or(false);

    if hard_delete {
        // Hard delete - permanently remove from database
        sqlx::query("DELETE FROM actions WHERE id = ?")
            .bind(&action_id)
            .execute(&*sqlite_pool)
            .await
            .map_err(|e| format!("Failed to delete action: {}", e))?;
    } else {
        // Soft delete - set deleted_at timestamp
        let now = chrono::Utc::now().to_rfc3339();
        sqlx::query("UPDATE actions SET deleted_at = ?, updated_at = ?, needs_sync = ? WHERE id = ?")
            .bind(&now)
            .bind(&now)
            .bind(true)
            .bind(&action_id)
            .execute(&*sqlite_pool)
            .await
            .map_err(|e| format!("Failed to delete action: {}", e))?;
    }

    Ok(ActionResponse {
        success: true,
        data: None,
        error: None,
        meta: Some(ActionMeta {
            message: Some(format!("Action {} successfully", 
                if hard_delete { "permanently deleted" } else { "deleted" })),
            user_id: Some("system".to_string()),
            workspace_id: Some("default".to_string()),
        }),
    })
}

/// Get a specific action by ID
#[tauri::command]
pub async fn get_action_by_id(
    action_id: String,
    db_manager: State<'_, HybridDatabaseManager>,
) -> Result<ActionResponse, String> {
    // Get database connections
    let sqlite_pool = db_manager.get_sqlite_pool().await
        .map_err(|e| format!("Failed to get SQLite connection: {}", e))?;

    let action_row = sqlx::query("SELECT * FROM actions WHERE id = ? AND deleted_at IS NULL")
        .bind(&action_id)
        .fetch_optional(&*sqlite_pool)
        .await
        .map_err(|e| format!("Failed to fetch action: {}", e))?;

    match action_row {
        Some(row) => {
            let action = DesktopAction {
                id: row.get("id"),
                action_type: row.get("type"),
                subject: row.get("subject"),
                description: row.get("description"),
                outcome: row.get("outcome"),
                scheduled_at: row.get("scheduled_at"),
                completed_at: row.get("completed_at"),
                status: row.get("status"),
                priority: row.get("priority"),
                company_id: row.get("company_id"),
                person_id: row.get("person_id"),
                user_id: row.get("user_id"),
                workspace_id: row.get("workspace_id"),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
                deleted_at: row.get("deleted_at"),
                needs_sync: row.get("needs_sync"),
                last_sync_at: row.get("last_sync_at"),
            };

            Ok(ActionResponse {
                success: true,
                data: Some(action),
                error: None,
                meta: None,
            })
        }
        None => {
            Ok(ActionResponse {
                success: false,
                data: None,
                error: Some("Action not found".to_string()),
                meta: None,
            })
        }
    }
}
