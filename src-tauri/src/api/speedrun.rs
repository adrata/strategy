use crate::database::models::*;
use crate::database::HybridDatabaseManager;
use serde::{Deserialize, Serialize};
use tauri::State;
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize)]
pub struct SpeedrunFilters {
    pub limit: Option<i32>,
    pub force_refresh: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SpeedrunPerson {
    pub id: String,
    pub rank: i32,
    pub name: String,
    pub title: String,
    pub email: String,
    pub phone: String,
    pub linkedin: String,
    pub status: String,
    pub global_rank: Option<i32>,
    pub last_action: String,
    pub last_action_date: Option<String>,
    pub last_action_time: String,
    pub next_action: String,
    pub next_action_date: Option<String>,
    pub next_action_timing: String,
    pub main_seller_id: Option<String>,
    pub workspace_id: String,
    pub created_at: String,
    pub updated_at: String,
    pub company: Option<SpeedrunCompany>,
    pub tags: Vec<String>,
    pub main_seller: String,
    pub co_sellers: String,
    pub main_seller_data: Option<SpeedrunUser>,
    pub co_sellers_data: Vec<SpeedrunCoSeller>,
    pub current_user_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SpeedrunCompany {
    pub id: String,
    pub name: String,
    pub industry: Option<String>,
    pub size: Option<String>,
    pub global_rank: Option<i32>,
    pub hq_state: Option<String>,
    pub state: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SpeedrunUser {
    pub id: String,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub name: Option<String>,
    pub email: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SpeedrunCoSeller {
    pub id: String,
    pub user: SpeedrunUser,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SpeedrunResponse {
    pub success: bool,
    pub data: Vec<SpeedrunPerson>,
    pub error: Option<String>,
    pub meta: SpeedrunMeta,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SpeedrunMeta {
    pub count: i32,
    pub total_count: i32,
    pub limit: i32,
    pub workspace_id: String,
    pub user_id: String,
    pub response_time: i64,
    pub cached: bool,
}

/// Get speedrun data - top prospects for quick action
#[tauri::command]
pub async fn get_speedrun_data(
    filters: SpeedrunFilters,
    db_manager: State<'_, HybridDatabaseManager>,
) -> Result<SpeedrunResponse, String> {
    let start_time = std::time::Instant::now();
    
    // Get database connections
    let sqlite_pool = db_manager.get_sqlite_pool().await
        .map_err(|e| format!("Failed to get SQLite connection: {}", e))?;

    // Extract filter parameters
    let limit = filters.limit.unwrap_or(50).min(100); // Cap at 100, default 50
    let force_refresh = filters.force_refresh.unwrap_or(false);

    // TODO: Get from auth context
    let workspace_id = "default".to_string();
    let user_id = "system".to_string();

    // Check if this is demo mode
    let is_demo_mode = workspace_id == "01K1VBYX2YERMXBFJ60RC6J194" || 
                      workspace_id == "01K7DNYR5VZ7JY36KGKKN76XZ1" ||
                      user_id == "demo-user-2025";

    // Get speedrun people with optimized query
    let speedrun_query = r#"
        SELECT 
            p.id,
            p.first_name,
            p.last_name,
            p.full_name,
            p.email,
            p.job_title,
            p.phone,
            p.linkedin_url,
            p.status,
            p.global_rank,
            p.last_action,
            p.last_action_date,
            p.next_action,
            p.next_action_date,
            p.main_seller_id,
            p.workspace_id,
            p.created_at,
            p.updated_at,
            c.id as company_id,
            c.name as company_name,
            c.industry as company_industry,
            c.size as company_size,
            c.global_rank as company_global_rank,
            c.hq_state as company_hq_state,
            c.state as company_state,
            u.id as seller_id,
            u.first_name as seller_first_name,
            u.last_name as seller_last_name,
            u.name as seller_name,
            u.email as seller_email
        FROM people p
        LEFT JOIN companies c ON p.company_id = c.id AND c.deleted_at IS NULL
        LEFT JOIN users u ON p.main_seller_id = u.id
        WHERE p.workspace_id = ? 
        AND p.deleted_at IS NULL
        ORDER BY 
            CASE WHEN p.global_rank IS NOT NULL THEN p.global_rank ELSE 999999 END ASC,
            p.created_at DESC
        LIMIT ?
    "#;

    let speedrun_rows = sqlx::query(speedrun_query)
        .bind(&workspace_id)
        .bind(limit)
        .fetch_all(&*sqlite_pool)
        .await
        .map_err(|e| format!("Failed to fetch speedrun data: {}", e))?;

    let mut speedrun_data = Vec::new();
    for (index, row) in speedrun_rows.iter().enumerate() {
        let person_id: String = row.get("id");
        
        // Get co-sellers for this person
        let co_sellers_query = r#"
            SELECT 
                cs.id,
                u.id as user_id,
                u.first_name,
                u.last_name,
                u.name,
                u.email
            FROM co_sellers cs
            JOIN users u ON cs.user_id = u.id
            WHERE cs.person_id = ? AND u.id != ?
        "#;
        
        let co_sellers_rows = sqlx::query(co_sellers_query)
            .bind(&person_id)
            .bind(&user_id)
            .fetch_all(&*sqlite_pool)
            .await
            .map_err(|e| format!("Failed to fetch co-sellers: {}", e))?;

        let mut co_sellers_data = Vec::new();
        for cs_row in co_sellers_rows {
            co_sellers_data.push(SpeedrunCoSeller {
                id: cs_row.get("id"),
                user: SpeedrunUser {
                    id: cs_row.get("user_id"),
                    first_name: cs_row.get("first_name"),
                    last_name: cs_row.get("last_name"),
                    name: cs_row.get("name"),
                    email: cs_row.get("email"),
                },
            });
        }

        // Format owner name - show "Me" for current user
        let seller_id: Option<String> = row.get("seller_id");
        let owner_name = if let Some(ref id) = seller_id {
            if id == &user_id {
                "Me".to_string()
            } else {
                let first_name: Option<String> = row.get("seller_first_name");
                let last_name: Option<String> = row.get("seller_last_name");
                let name: Option<String> = row.get("seller_name");
                let email: String = row.get("seller_email");
                
                if let (Some(first), Some(last)) = (first_name, last_name) {
                    format!("{} {}", first, last).trim().to_string()
                } else {
                    name.unwrap_or(email)
                }
            }
        } else {
            "-".to_string()
        };

        // Format co-sellers names
        let co_sellers_names = if !co_sellers_data.is_empty() {
            co_sellers_data.iter()
                .map(|cs| {
                    if let (Some(ref first), Some(ref last)) = (&cs.user.first_name, &cs.user.last_name) {
                        format!("{} {}", first, last).trim().to_string()
                    } else {
                        cs.user.name.clone().unwrap_or(cs.user.email.clone())
                    }
                })
                .collect::<Vec<_>>()
                .join(", ")
        } else {
            "-".to_string()
        };

        // Calculate lastActionTime
        let last_action_date: Option<String> = row.get("last_action_date");
        let updated_at: String = row.get("updated_at");
        let last_action: Option<String> = row.get("last_action");
        
        let mut last_action_time = "Never".to_string();
        if let Some(ref date) = last_action_date {
            if let Ok(parsed_date) = chrono::DateTime::parse_from_rfc3339(date) {
                let days_since = (chrono::Utc::now() - parsed_date).num_days();
                last_action_time = match days_since {
                    0 => "Today".to_string(),
                    1 => "Yesterday".to_string(),
                    d if d <= 7 => format!("{} days ago", d),
                    d if d <= 30 => format!("{} weeks ago", d / 7),
                    d => format!("{} months ago", d / 30),
                };
            }
        } else if let Some(ref action) = last_action {
            if action != "No action taken" {
                // Use updated_at as fallback
                if let Ok(parsed_date) = chrono::DateTime::parse_from_rfc3339(&updated_at) {
                    let days_since = (chrono::Utc::now() - parsed_date).num_days();
                    last_action_time = match days_since {
                        0 => "Today".to_string(),
                        1 => "Yesterday".to_string(),
                        d if d <= 7 => format!("{} days ago", d),
                        d if d <= 30 => format!("{} weeks ago", d / 7),
                        d => format!("{} months ago", d / 30),
                    };
                }
            }
        }

        // Calculate nextActionTiming
        let next_action_date: Option<String> = row.get("next_action_date");
        let mut next_action_timing = "No date set".to_string();
        
        if let Some(ref date) = next_action_date {
            if let Ok(parsed_date) = chrono::DateTime::parse_from_rfc3339(date) {
                let now = chrono::Utc::now();
                let diff_days = (parsed_date - now).num_days();
                
                next_action_timing = match diff_days {
                    d if d < 0 => "Overdue".to_string(),
                    0 => "Today".to_string(),
                    1 => "Tomorrow".to_string(),
                    d if d <= 7 => "This week".to_string(),
                    d if d <= 14 => "Next week".to_string(),
                    d if d <= 30 => "This month".to_string(),
                    _ => "Future".to_string(),
                };
            }
        }

        // Build company data
        let company = if let Some(company_id): Option<String> = row.get("company_id") {
            Some(SpeedrunCompany {
                id: company_id,
                name: row.get("company_name"),
                industry: row.get("company_industry"),
                size: row.get("company_size"),
                global_rank: row.get("company_global_rank"),
                hq_state: row.get("company_hq_state"),
                state: row.get("company_state"),
            })
        } else {
            None
        };

        // Build main seller data
        let main_seller_data = if let Some(ref id) = seller_id {
            Some(SpeedrunUser {
                id: id.clone(),
                first_name: row.get("seller_first_name"),
                last_name: row.get("seller_last_name"),
                name: row.get("seller_name"),
                email: row.get("seller_email"),
            })
        } else {
            None
        };

        let first_name: Option<String> = row.get("first_name");
        let last_name: Option<String> = row.get("last_name");
        let full_name: Option<String> = row.get("full_name");
        
        let name = full_name.unwrap_or_else(|| {
            format!("{} {}", 
                first_name.unwrap_or_default(), 
                last_name.unwrap_or_default()
            ).trim().to_string()
        });

        let speedrun_person = SpeedrunPerson {
            id: person_id,
            rank: (index + 1) as i32,
            name: if name.is_empty() { "Unknown".to_string() } else { name },
            title: row.get("job_title").unwrap_or_else(|| "Unknown Title".to_string()),
            email: row.get("email").unwrap_or_default(),
            phone: row.get("phone").unwrap_or_default(),
            linkedin: row.get("linkedin_url").unwrap_or_default(),
            status: row.get("status").unwrap_or_else(|| "Unknown".to_string()),
            global_rank: row.get("global_rank"),
            last_action: row.get("last_action").unwrap_or_else(|| "No action taken".to_string()),
            last_action_date,
            last_action_time,
            next_action: row.get("next_action").unwrap_or_else(|| "No next action".to_string()),
            next_action_date,
            next_action_timing,
            main_seller_id: row.get("main_seller_id"),
            workspace_id: row.get("workspace_id"),
            created_at: row.get("created_at"),
            updated_at,
            company,
            tags: vec!["speedrun".to_string()],
            main_seller: owner_name,
            co_sellers: co_sellers_names,
            main_seller_data,
            co_sellers_data,
            current_user_id: user_id.clone(),
        };

        speedrun_data.push(speedrun_person);
    }

    let response_time = start_time.elapsed().as_millis() as i64;

    Ok(SpeedrunResponse {
        success: true,
        data: speedrun_data,
        error: None,
        meta: SpeedrunMeta {
            count: speedrun_data.len() as i32,
            total_count: speedrun_data.len() as i32,
            limit,
            workspace_id,
            user_id,
            response_time,
            cached: false, // TODO: Implement caching
        },
    })
}

/// Invalidate speedrun cache
#[tauri::command]
pub async fn invalidate_speedrun_cache(
    db_manager: State<'_, HybridDatabaseManager>,
) -> Result<SpeedrunResponse, String> {
    // TODO: Implement cache invalidation
    // For now, just return success
    
    Ok(SpeedrunResponse {
        success: true,
        data: vec![],
        error: None,
        meta: SpeedrunMeta {
            count: 0,
            total_count: 0,
            limit: 0,
            workspace_id: "default".to_string(),
            user_id: "system".to_string(),
            response_time: 0,
            cached: false,
        },
    })
}
