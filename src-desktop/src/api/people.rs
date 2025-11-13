// ====================================================================
// PEOPLE API COMMANDS - MATCHING V1 API STRUCTURE
// ====================================================================
//
// This module provides Tauri commands that match the /api/v1/people
// Next.js API routes, ensuring 100% compatibility with the frontend.
// ====================================================================

use crate::database::models::*;
use crate::database_init::get_database_manager;
use crate::sync::SyncQueue;
use serde::{Deserialize, Serialize};
use sqlx::Row;

// ====================================================================
// REQUEST/RESPONSE MODELS
// ====================================================================

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PeopleApiResponse {
    pub success: bool,
    pub data: Option<Vec<Person>>,
    pub pagination: Option<PaginationInfo>,
    pub counts: Option<PeopleCounts>,
    pub error: Option<String>,
    pub code: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PeopleCounts {
    pub total: i32,
    pub leads: i32,
    pub prospects: i32,
    pub opportunities: i32,
    pub clients: i32,
    pub superfans: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PeopleFilters {
    pub search: Option<String>,
    pub status: Option<String>,
    pub priority: Option<String>,
    pub company_id: Option<String>,
    pub vertical: Option<String>,
    pub revenue: Option<String>,
    pub timezone: Option<String>,
    pub sort_by: Option<String>,
    pub sort_order: Option<String>,
    pub section: Option<String>,
    pub cursor: Option<String>,
    pub force_refresh: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CreatePersonRequest {
    pub first_name: String,
    pub last_name: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub job_title: Option<String>,
    pub company_id: Option<String>,
    pub status: Option<String>,
    pub priority: Option<String>,
    pub notes: Option<String>,
    pub department: Option<String>,
    pub seniority: Option<String>,
    pub linkedin_url: Option<String>,
    pub address: Option<String>,
    pub city: Option<String>,
    pub state: Option<String>,
    pub country: Option<String>,
    pub postal_code: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UpdatePersonRequest {
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub job_title: Option<String>,
    pub company_id: Option<String>,
    pub status: Option<String>,
    pub priority: Option<String>,
    pub notes: Option<String>,
    pub department: Option<String>,
    pub seniority: Option<String>,
    pub linkedin_url: Option<String>,
    pub address: Option<String>,
    pub city: Option<String>,
    pub state: Option<String>,
    pub country: Option<String>,
    pub postal_code: Option<String>,
}

// ====================================================================
// GET PEOPLE COMMAND
// ====================================================================

#[tauri::command]
pub async fn get_people(
    workspace_id: String,
    user_id: String,
    page: Option<i32>,
    limit: Option<i32>,
    filters: Option<PeopleFilters>,
) -> Result<PeopleApiResponse, String> {
    println!("🔍 [PEOPLE API] Getting people for workspace: {}, user: {}", workspace_id, user_id);
    
    let page = page.unwrap_or(1);
    let limit = limit.unwrap_or(100).min(1000); // Cap at 1000
    let offset = (page - 1) * limit;
    
    // Get database manager
    let db_manager = get_database_manager()?;
    let sqlite_pool = db_manager.get_sqlite_pool().await?;
    
    // Build where clause
    let mut where_conditions = vec![
        "workspace_id = ?".to_string(),
        "deleted_at IS NULL".to_string(),
    ];
    let mut bind_values: Vec<Box<dyn sqlx::Encode<'_, sqlx::Sqlite> + Send + Sync>> = vec![
        Box::new(workspace_id.clone()),
    ];
    
    // Apply filters
    if let Some(filters) = filters {
        if let Some(search) = &filters.search {
            if search.len() >= 2 {
                where_conditions.push("(
                    full_name LIKE ? OR 
                    first_name LIKE ? OR 
                    last_name LIKE ? OR 
                    email LIKE ? OR 
                    work_email LIKE ? OR 
                    job_title LIKE ? OR 
                    department LIKE ?
                )".to_string());
                
                let search_pattern = format!("%{}%", search);
                for _ in 0..7 {
                    bind_values.push(Box::new(search_pattern.clone()));
                }
            }
        }
        
        if let Some(status) = &filters.status {
            where_conditions.push("status = ?".to_string());
            bind_values.push(Box::new(status.clone()));
        }
        
        if let Some(priority) = &filters.priority {
            where_conditions.push("priority = ?".to_string());
            bind_values.push(Box::new(priority.clone()));
        }
        
        if let Some(company_id) = &filters.company_id {
            where_conditions.push("company_id = ?".to_string());
            bind_values.push(Box::new(company_id.clone()));
        }
        
        if let Some(vertical) = &filters.vertical {
            where_conditions.push("vertical = ?".to_string());
            bind_values.push(Box::new(vertical.clone()));
        }
        
        // Apply section filter
        if let Some(section) = &filters.section {
            match section.as_str() {
                "leads" => {
                    where_conditions.push("status = 'LEAD'".to_string());
                }
                "prospects" => {
                    where_conditions.push("status = 'PROSPECT'".to_string());
                }
                "opportunities" => {
                    where_conditions.push("status = 'OPPORTUNITY'".to_string());
                }
                _ => {}
            }
        }
    }
    
    // Add user assignment filter (unless demo mode)
    let is_demo_mode = workspace_id == "01K1VBYX2YERMXBFJ60RC6J194" || 
                      workspace_id == "01K7DNYR5VZ7JY36KGKKN76XZ1";
    
    if !is_demo_mode {
        where_conditions.push("(main_seller_id = ? OR main_seller_id IS NULL)".to_string());
        bind_values.push(Box::new(user_id.clone()));
    }
    
    let where_clause = where_conditions.join(" AND ");
    
    // Get total count
    let count_query = format!("SELECT COUNT(*) as count FROM people WHERE {}", where_clause);
    let count_row = sqlx::query(&count_query)
        .bind_all(&bind_values)
        .fetch_one(&sqlite_pool)
        .await
        .map_err(|e| format!("Failed to count people: {}", e))?;
    
    let total_count = count_row.get::<i64, _>("count") as i32;
    
    // Get people data
    let sort_by = filters.as_ref()
        .and_then(|f| f.sort_by.as_ref())
        .map(|s| match s.as_str() {
            "rank" => "global_rank",
            "name" => "full_name",
            "title" => "job_title",
            "lastAction" => "last_action_date",
            _ => s,
        })
        .unwrap_or("created_at");
    
    let sort_order = filters.as_ref()
        .and_then(|f| f.sort_order.as_ref())
        .map(|s| s.as_str())
        .unwrap_or("desc");
    
    let query = format!(
        "SELECT * FROM people WHERE {} ORDER BY {} {} LIMIT ? OFFSET ?",
        where_clause, sort_by, sort_order
    );
    
    let mut query_builder = sqlx::query(&query);
    for value in bind_values {
        query_builder = query_builder.bind(value);
    }
    query_builder = query_builder.bind(limit).bind(offset);
    
    let rows = query_builder
        .fetch_all(&sqlite_pool)
        .await
        .map_err(|e| format!("Failed to fetch people: {}", e))?;
    
    let people: Vec<Person> = rows.into_iter()
        .map(|row| Person {
            id: row.get("id"),
            workspace_id: row.get("workspace_id"),
            company_id: row.get("company_id"),
            first_name: row.get("first_name"),
            last_name: row.get("last_name"),
            full_name: row.get("full_name"),
            display_name: row.get("display_name"),
            salutation: row.get("salutation"),
            suffix: row.get("suffix"),
            job_title: row.get("job_title"),
            department: row.get("department"),
            seniority: row.get("seniority"),
            email: row.get("email"),
            work_email: row.get("work_email"),
            personal_email: row.get("personal_email"),
            phone: row.get("phone"),
            mobile_phone: row.get("mobile_phone"),
            work_phone: row.get("work_phone"),
            linkedin_url: row.get("linkedin_url"),
            address: row.get("address"),
            city: row.get("city"),
            state: row.get("state"),
            country: row.get("country"),
            postal_code: row.get("postal_code"),
            date_of_birth: row.get("date_of_birth"),
            gender: row.get("gender"),
            bio: row.get("bio"),
            profile_picture_url: row.get("profile_picture_url"),
            status: row.get("status"),
            priority: row.get("priority"),
            source: row.get("source"),
            tags: row.get("tags"),
            custom_fields: row.get("custom_fields"),
            notes: row.get("notes"),
            preferred_language: row.get("preferred_language"),
            timezone: row.get("timezone"),
            email_verified: row.get("email_verified"),
            phone_verified: row.get("phone_verified"),
            last_action: row.get("last_action"),
            last_action_date: row.get("last_action_date"),
            next_action: row.get("next_action"),
            next_action_date: row.get("next_action_date"),
            action_status: row.get("action_status"),
            engagement_score: row.get("engagement_score"),
            global_rank: row.get("global_rank"),
            company_rank: row.get("company_rank"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
            entity_id: row.get("entity_id"),
            deleted_at: row.get("deleted_at"),
            main_seller_id: row.get("main_seller_id"),
            vertical: row.get("vertical"),
            // Enrichment fields
            achievements: row.get("achievements"),
            budget_responsibility: row.get("budget_responsibility"),
            buyer_group_optimized: row.get("buyer_group_optimized"),
            buyer_group_role: row.get("buyer_group_role"),
            buyer_group_status: row.get("buyer_group_status"),
            career_timeline: row.get("career_timeline"),
            certifications: row.get("certifications"),
            communication_style: row.get("communication_style"),
            coresignal_data: row.get("coresignal_data"),
            current_company: row.get("current_company"),
            current_role: row.get("current_role"),
            data_completeness: row.get("data_completeness"),
            decision_making: row.get("decision_making"),
            decision_power: row.get("decision_power"),
            degrees: row.get("degrees"),
            email_confidence: row.get("email_confidence"),
            engagement_level: row.get("engagement_level"),
            engagement_strategy: row.get("engagement_strategy"),
            enriched_data: row.get("enriched_data"),
            enrichment_score: row.get("enrichment_score"),
            enrichment_sources: row.get("enrichment_sources"),
            enrichment_version: row.get("enrichment_version"),
            fields_of_study: row.get("fields_of_study"),
            graduation_years: row.get("graduation_years"),
            hidden_from_sections: row.get("hidden_from_sections"),
            industry_experience: row.get("industry_experience"),
            industry_skills: row.get("industry_skills"),
            influence_level: row.get("influence_level"),
            influence_score: row.get("influence_score"),
            institutions: row.get("institutions"),
            is_buyer_group_member: row.get("is_buyer_group_member"),
            languages: row.get("languages"),
            last_enriched: row.get("last_enriched"),
            leadership_experience: row.get("leadership_experience"),
            mobile_verified: row.get("mobile_verified"),
            phone_confidence: row.get("phone_confidence"),
            preferred_contact: row.get("preferred_contact"),
            previous_roles: row.get("previous_roles"),
            publications: row.get("publications"),
            response_time: row.get("response_time"),
            role_history: row.get("role_history"),
            role_promoted: row.get("role_promoted"),
            soft_skills: row.get("soft_skills"),
            speaking_engagements: row.get("speaking_engagements"),
            status_reason: row.get("status_reason"),
            status_update_date: row.get("status_update_date"),
            team_size: row.get("team_size"),
            technical_skills: row.get("technical_skills"),
            total_experience: row.get("total_experience"),
            years_at_company: row.get("years_at_company"),
            years_in_role: row.get("years_in_role"),
            next_action_priority: row.get("next_action_priority"),
            next_action_reasoning: row.get("next_action_reasoning"),
            next_action_type: row.get("next_action_type"),
            next_action_updated_at: row.get("next_action_updated_at"),
            linkedin_connection_date: row.get("linkedin_connection_date"),
            linkedin_navigator_url: row.get("linkedin_navigator_url"),
            decision_power_score: row.get("decision_power_score"),
            years_experience: row.get("years_experience"),
            // AI/Data Quality fields
            ai_confidence: row.get("ai_confidence"),
            ai_intelligence: row.get("ai_intelligence"),
            ai_last_updated: row.get("ai_last_updated"),
            data_last_verified: row.get("data_last_verified"),
            data_quality_breakdown: row.get("data_quality_breakdown"),
            data_quality_score: row.get("data_quality_score"),
            data_sources: row.get("data_sources"),
            email_quality_grade: row.get("email_quality_grade"),
            linkedin_connections: row.get("linkedin_connections"),
            linkedin_followers: row.get("linkedin_followers"),
            phone_quality_score: row.get("phone_quality_score"),
            salary_projections: row.get("salary_projections"),
            total_experience_months: row.get("total_experience_months"),
            // Sync metadata
            last_synced_at: row.get("last_synced_at"),
            sync_version: row.get("sync_version"),
            is_dirty: row.get("is_dirty"),
        })
        .collect();
    
    // Get counts by status
    let counts = get_people_counts(&sqlite_pool, &workspace_id, &user_id, is_demo_mode).await?;
    
    // Create pagination info
    let total_pages = (total_count as f64 / limit as f64).ceil() as i32;
    let pagination = PaginationInfo {
        page,
        limit,
        total: total_count,
        total_pages,
        has_next: page < total_pages,
        has_prev: page > 1,
        next_cursor: None, // TODO: Implement cursor-based pagination
    };
    
    println!("✅ [PEOPLE API] Retrieved {} people (page {}/{})", people.len(), page, total_pages);
    
    Ok(PeopleApiResponse {
        success: true,
        data: Some(people),
        pagination: Some(pagination),
        counts: Some(counts),
        error: None,
        code: None,
    })
}

// ====================================================================
// CREATE PERSON COMMAND
// ====================================================================

#[tauri::command]
pub async fn create_person(
    workspace_id: String,
    user_id: String,
    request: CreatePersonRequest,
) -> Result<PeopleApiResponse, String> {
    println!("➕ [PEOPLE API] Creating person: {} {}", request.first_name, request.last_name);
    
    // Get database manager
    let db_manager = get_database_manager()?;
    let sqlite_pool = db_manager.get_sqlite_pool().await?;
    
    // Generate ULID
    let person_id = ulid::Ulid::new().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    let full_name = format!("{} {}", request.first_name, request.last_name);
    
    // Insert person
    let query = r#"
        INSERT INTO people (
            id, workspace_id, first_name, last_name, full_name, email, phone,
            job_title, company_id, status, priority, notes, department, seniority,
            linkedin_url, address, city, state, country, postal_code,
            main_seller_id, created_at, updated_at, sync_version, is_dirty
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
    "#;
    
    sqlx::query(query)
        .bind(&person_id)
        .bind(&workspace_id)
        .bind(&request.first_name)
        .bind(&request.last_name)
        .bind(&full_name)
        .bind(&request.email)
        .bind(&request.phone)
        .bind(&request.job_title)
        .bind(&request.company_id)
        .bind(&request.status.unwrap_or_else(|| "LEAD".to_string()))
        .bind(&request.priority.unwrap_or_else(|| "MEDIUM".to_string()))
        .bind(&request.notes)
        .bind(&request.department)
        .bind(&request.seniority)
        .bind(&request.linkedin_url)
        .bind(&request.address)
        .bind(&request.city)
        .bind(&request.state)
        .bind(&request.country)
        .bind(&request.postal_code)
        .bind(&user_id)
        .bind(&now)
        .bind(&now)
        .execute(&sqlite_pool)
        .await
        .map_err(|e| format!("Failed to create person: {}", e))?;
    
    // Add to sync queue
    let sync_queue = SyncQueue::new(sqlite_pool.clone());
    sync_queue.enqueue_change(
        "people",
        &person_id,
        crate::sync::models::SyncOperation::Insert,
        Some(serde_json::to_string(&request).unwrap_or_default()),
    ).await.map_err(|e| format!("Failed to queue sync: {}", e))?;
    
    // Fetch the created person
    let person = get_person_by_id(&sqlite_pool, &person_id).await?;
    
    println!("✅ [PEOPLE API] Created person: {}", person_id);
    
    Ok(PeopleApiResponse {
        success: true,
        data: Some(vec![person]),
        pagination: None,
        counts: None,
        error: None,
        code: None,
    })
}

// ====================================================================
// UPDATE PERSON COMMAND
// ====================================================================

#[tauri::command]
pub async fn update_person(
    person_id: String,
    request: UpdatePersonRequest,
) -> Result<PeopleApiResponse, String> {
    println!("✏️ [PEOPLE API] Updating person: {}", person_id);
    
    // Get database manager
    let db_manager = get_database_manager()?;
    let sqlite_pool = db_manager.get_sqlite_pool().await?;
    
    // Build update query dynamically
    let mut update_fields = Vec::new();
    let mut bind_values: Vec<Box<dyn sqlx::Encode<'_, sqlx::Sqlite> + Send + Sync>> = vec![];
    
    if let Some(first_name) = &request.first_name {
        update_fields.push("first_name = ?");
        bind_values.push(Box::new(first_name.clone()));
    }
    
    if let Some(last_name) = &request.last_name {
        update_fields.push("last_name = ?");
        bind_values.push(Box::new(last_name.clone()));
    }
    
    if let Some(email) = &request.email {
        update_fields.push("email = ?");
        bind_values.push(Box::new(email.clone()));
    }
    
    if let Some(phone) = &request.phone {
        update_fields.push("phone = ?");
        bind_values.push(Box::new(phone.clone()));
    }
    
    if let Some(job_title) = &request.job_title {
        update_fields.push("job_title = ?");
        bind_values.push(Box::new(job_title.clone()));
    }
    
    if let Some(company_id) = &request.company_id {
        update_fields.push("company_id = ?");
        bind_values.push(Box::new(company_id.clone()));
    }
    
    if let Some(status) = &request.status {
        update_fields.push("status = ?");
        bind_values.push(Box::new(status.clone()));
    }
    
    if let Some(priority) = &request.priority {
        update_fields.push("priority = ?");
        bind_values.push(Box::new(priority.clone()));
    }
    
    if let Some(notes) = &request.notes {
        update_fields.push("notes = ?");
        bind_values.push(Box::new(notes.clone()));
    }
    
    if let Some(department) = &request.department {
        update_fields.push("department = ?");
        bind_values.push(Box::new(department.clone()));
    }
    
    if let Some(seniority) = &request.seniority {
        update_fields.push("seniority = ?");
        bind_values.push(Box::new(seniority.clone()));
    }
    
    if let Some(linkedin_url) = &request.linkedin_url {
        update_fields.push("linkedin_url = ?");
        bind_values.push(Box::new(linkedin_url.clone()));
    }
    
    if let Some(address) = &request.address {
        update_fields.push("address = ?");
        bind_values.push(Box::new(address.clone()));
    }
    
    if let Some(city) = &request.city {
        update_fields.push("city = ?");
        bind_values.push(Box::new(city.clone()));
    }
    
    if let Some(state) = &request.state {
        update_fields.push("state = ?");
        bind_values.push(Box::new(state.clone()));
    }
    
    if let Some(country) = &request.country {
        update_fields.push("country = ?");
        bind_values.push(Box::new(country.clone()));
    }
    
    if let Some(postal_code) = &request.postal_code {
        update_fields.push("postal_code = ?");
        bind_values.push(Box::new(postal_code.clone()));
    }
    
    if update_fields.is_empty() {
        return Err("No fields to update".to_string());
    }
    
    // Update full_name if first_name or last_name changed
    if request.first_name.is_some() || request.last_name.is_some() {
        update_fields.push("full_name = first_name || ' ' || last_name");
    }
    
    update_fields.push("updated_at = ?");
    update_fields.push("sync_version = sync_version + 1");
    update_fields.push("is_dirty = 1");
    
    bind_values.push(Box::new(chrono::Utc::now().to_rfc3339()));
    bind_values.push(Box::new(person_id.clone()));
    
    let query = format!(
        "UPDATE people SET {} WHERE id = ?",
        update_fields.join(", ")
    );
    
    let mut query_builder = sqlx::query(&query);
    for value in bind_values {
        query_builder = query_builder.bind(value);
    }
    
    let result = query_builder
        .execute(&sqlite_pool)
        .await
        .map_err(|e| format!("Failed to update person: {}", e))?;
    
    if result.rows_affected() == 0 {
        return Err("Person not found".to_string());
    }
    
    // Add to sync queue
    let sync_queue = SyncQueue::new(sqlite_pool.clone());
    sync_queue.enqueue_change(
        "people",
        &person_id,
        crate::sync::models::SyncOperation::Update,
        Some(serde_json::to_string(&request).unwrap_or_default()),
    ).await.map_err(|e| format!("Failed to queue sync: {}", e))?;
    
    // Fetch the updated person
    let person = get_person_by_id(&sqlite_pool, &person_id).await?;
    
    println!("✅ [PEOPLE API] Updated person: {}", person_id);
    
    Ok(PeopleApiResponse {
        success: true,
        data: Some(vec![person]),
        pagination: None,
        counts: None,
        error: None,
        code: None,
    })
}

// ====================================================================
// DELETE PERSON COMMAND
// ====================================================================

#[tauri::command]
pub async fn delete_person(person_id: String) -> Result<PeopleApiResponse, String> {
    println!("🗑️ [PEOPLE API] Deleting person: {}", person_id);
    
    // Get database manager
    let db_manager = get_database_manager()?;
    let sqlite_pool = db_manager.get_sqlite_pool().await?;
    
    // Soft delete (set deleted_at)
    let now = chrono::Utc::now().to_rfc3339();
    let query = r#"
        UPDATE people 
        SET deleted_at = ?, updated_at = ?, sync_version = sync_version + 1, is_dirty = 1
        WHERE id = ?
    "#;
    
    let result = sqlx::query(query)
        .bind(&now)
        .bind(&now)
        .bind(&person_id)
        .execute(&sqlite_pool)
        .await
        .map_err(|e| format!("Failed to delete person: {}", e))?;
    
    if result.rows_affected() == 0 {
        return Err("Person not found".to_string());
    }
    
    // Add to sync queue
    let sync_queue = SyncQueue::new(sqlite_pool);
    sync_queue.enqueue_change(
        "people",
        &person_id,
        crate::sync::models::SyncOperation::Delete,
        None,
    ).await.map_err(|e| format!("Failed to queue sync: {}", e))?;
    
    println!("✅ [PEOPLE API] Deleted person: {}", person_id);
    
    Ok(PeopleApiResponse {
        success: true,
        data: None,
        pagination: None,
        counts: None,
        error: None,
        code: None,
    })
}

// ====================================================================
// GET PERSON BY ID COMMAND
// ====================================================================

#[tauri::command]
pub async fn get_person_by_id_command(person_id: String) -> Result<PeopleApiResponse, String> {
    println!("🔍 [PEOPLE API] Getting person by ID: {}", person_id);
    
    // Get database manager
    let db_manager = get_database_manager()?;
    let sqlite_pool = db_manager.get_sqlite_pool().await?;
    
    // Fetch person
    let person = get_person_by_id(&sqlite_pool, &person_id).await?;
    
    Ok(PeopleApiResponse {
        success: true,
        data: Some(vec![person]),
        pagination: None,
        counts: None,
        error: None,
        code: None,
    })
}

// ====================================================================
// HELPER FUNCTIONS
// ====================================================================

async fn get_people_counts(
    pool: &sqlx::SqlitePool,
    workspace_id: &str,
    user_id: &str,
    is_demo_mode: bool,
) -> Result<PeopleCounts, String> {
    let mut where_conditions = vec![
        "workspace_id = ?".to_string(),
        "deleted_at IS NULL".to_string(),
    ];
    let mut bind_values: Vec<Box<dyn sqlx::Encode<'_, sqlx::Sqlite> + Send + Sync>> = vec![
        Box::new(workspace_id.to_string()),
    ];
    
    if !is_demo_mode {
        where_conditions.push("(main_seller_id = ? OR main_seller_id IS NULL)".to_string());
        bind_values.push(Box::new(user_id.to_string()));
    }
    
    let where_clause = where_conditions.join(" AND ");
    
    let query = format!(
        "SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'LEAD' THEN 1 ELSE 0 END) as leads,
            SUM(CASE WHEN status = 'PROSPECT' THEN 1 ELSE 0 END) as prospects,
            SUM(CASE WHEN status = 'OPPORTUNITY' THEN 1 ELSE 0 END) as opportunities,
            SUM(CASE WHEN status = 'CLIENT' THEN 1 ELSE 0 END) as clients,
            SUM(CASE WHEN status = 'SUPERFAN' THEN 1 ELSE 0 END) as superfans
        FROM people WHERE {}",
        where_clause
    );
    
    let mut query_builder = sqlx::query(&query);
    for value in bind_values {
        query_builder = query_builder.bind(value);
    }
    
    let row = query_builder
        .fetch_one(pool)
        .await
        .map_err(|e| format!("Failed to get people counts: {}", e))?;
    
    Ok(PeopleCounts {
        total: row.get::<i64, _>("total") as i32,
        leads: row.get::<i64, _>("leads") as i32,
        prospects: row.get::<i64, _>("prospects") as i32,
        opportunities: row.get::<i64, _>("opportunities") as i32,
        clients: row.get::<i64, _>("clients") as i32,
        superfans: row.get::<i64, _>("superfans") as i32,
    })
}

async fn get_person_by_id(pool: &sqlx::SqlitePool, person_id: &str) -> Result<Person, String> {
    let query = "SELECT * FROM people WHERE id = ? AND deleted_at IS NULL";
    
    let row = sqlx::query(query)
        .bind(person_id)
        .fetch_one(pool)
        .await
        .map_err(|e| format!("Failed to fetch person: {}", e))?;
    
    Ok(Person {
        id: row.get("id"),
        workspace_id: row.get("workspace_id"),
        company_id: row.get("company_id"),
        first_name: row.get("first_name"),
        last_name: row.get("last_name"),
        full_name: row.get("full_name"),
        display_name: row.get("display_name"),
        salutation: row.get("salutation"),
        suffix: row.get("suffix"),
        job_title: row.get("job_title"),
        department: row.get("department"),
        seniority: row.get("seniority"),
        email: row.get("email"),
        work_email: row.get("work_email"),
        personal_email: row.get("personal_email"),
        phone: row.get("phone"),
        mobile_phone: row.get("mobile_phone"),
        work_phone: row.get("work_phone"),
        linkedin_url: row.get("linkedin_url"),
        address: row.get("address"),
        city: row.get("city"),
        state: row.get("state"),
        country: row.get("country"),
        postal_code: row.get("postal_code"),
        date_of_birth: row.get("date_of_birth"),
        gender: row.get("gender"),
        bio: row.get("bio"),
        profile_picture_url: row.get("profile_picture_url"),
        status: row.get("status"),
        priority: row.get("priority"),
        source: row.get("source"),
        tags: row.get("tags"),
        custom_fields: row.get("custom_fields"),
        notes: row.get("notes"),
        preferred_language: row.get("preferred_language"),
        timezone: row.get("timezone"),
        email_verified: row.get("email_verified"),
        phone_verified: row.get("phone_verified"),
        last_action: row.get("last_action"),
        last_action_date: row.get("last_action_date"),
        next_action: row.get("next_action"),
        next_action_date: row.get("next_action_date"),
        action_status: row.get("action_status"),
        engagement_score: row.get("engagement_score"),
        global_rank: row.get("global_rank"),
        company_rank: row.get("company_rank"),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
        entity_id: row.get("entity_id"),
        deleted_at: row.get("deleted_at"),
        main_seller_id: row.get("main_seller_id"),
        vertical: row.get("vertical"),
        // Enrichment fields
        achievements: row.get("achievements"),
        budget_responsibility: row.get("budget_responsibility"),
        buyer_group_optimized: row.get("buyer_group_optimized"),
        buyer_group_role: row.get("buyer_group_role"),
        buyer_group_status: row.get("buyer_group_status"),
        career_timeline: row.get("career_timeline"),
        certifications: row.get("certifications"),
        communication_style: row.get("communication_style"),
        coresignal_data: row.get("coresignal_data"),
        current_company: row.get("current_company"),
        current_role: row.get("current_role"),
        data_completeness: row.get("data_completeness"),
        decision_making: row.get("decision_making"),
        decision_power: row.get("decision_power"),
        degrees: row.get("degrees"),
        email_confidence: row.get("email_confidence"),
        engagement_level: row.get("engagement_level"),
        engagement_strategy: row.get("engagement_strategy"),
        enriched_data: row.get("enriched_data"),
        enrichment_score: row.get("enrichment_score"),
        enrichment_sources: row.get("enrichment_sources"),
        enrichment_version: row.get("enrichment_version"),
        fields_of_study: row.get("fields_of_study"),
        graduation_years: row.get("graduation_years"),
        hidden_from_sections: row.get("hidden_from_sections"),
        industry_experience: row.get("industry_experience"),
        industry_skills: row.get("industry_skills"),
        influence_level: row.get("influence_level"),
        influence_score: row.get("influence_score"),
        institutions: row.get("institutions"),
        is_buyer_group_member: row.get("is_buyer_group_member"),
        languages: row.get("languages"),
        last_enriched: row.get("last_enriched"),
        leadership_experience: row.get("leadership_experience"),
        mobile_verified: row.get("mobile_verified"),
        phone_confidence: row.get("phone_confidence"),
        preferred_contact: row.get("preferred_contact"),
        previous_roles: row.get("previous_roles"),
        publications: row.get("publications"),
        response_time: row.get("response_time"),
        role_history: row.get("role_history"),
        role_promoted: row.get("role_promoted"),
        soft_skills: row.get("soft_skills"),
        speaking_engagements: row.get("speaking_engagements"),
        status_reason: row.get("status_reason"),
        status_update_date: row.get("status_update_date"),
        team_size: row.get("team_size"),
        technical_skills: row.get("technical_skills"),
        total_experience: row.get("total_experience"),
        years_at_company: row.get("years_at_company"),
        years_in_role: row.get("years_in_role"),
        next_action_priority: row.get("next_action_priority"),
        next_action_reasoning: row.get("next_action_reasoning"),
        next_action_type: row.get("next_action_type"),
        next_action_updated_at: row.get("next_action_updated_at"),
        linkedin_connection_date: row.get("linkedin_connection_date"),
        linkedin_navigator_url: row.get("linkedin_navigator_url"),
        decision_power_score: row.get("decision_power_score"),
        years_experience: row.get("years_experience"),
        // AI/Data Quality fields
        ai_confidence: row.get("ai_confidence"),
        ai_intelligence: row.get("ai_intelligence"),
        ai_last_updated: row.get("ai_last_updated"),
        data_last_verified: row.get("data_last_verified"),
        data_quality_breakdown: row.get("data_quality_breakdown"),
        data_quality_score: row.get("data_quality_score"),
        data_sources: row.get("data_sources"),
        email_quality_grade: row.get("email_quality_grade"),
        linkedin_connections: row.get("linkedin_connections"),
        linkedin_followers: row.get("linkedin_followers"),
        phone_quality_score: row.get("phone_quality_score"),
        salary_projections: row.get("salary_projections"),
        total_experience_months: row.get("total_experience_months"),
        // Sync metadata
        last_synced_at: row.get("last_synced_at"),
        sync_version: row.get("sync_version"),
        is_dirty: row.get("is_dirty"),
    })
}
