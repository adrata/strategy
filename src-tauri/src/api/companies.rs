// ====================================================================
// COMPANIES API COMMANDS - MATCHING V1 API STRUCTURE
// ====================================================================
//
// This module provides Tauri commands that match the /api/v1/companies
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
pub struct CompaniesApiResponse {
    pub success: bool,
    pub data: Option<Vec<Company>>,
    pub pagination: Option<PaginationInfo>,
    pub counts: Option<CompanyCounts>,
    pub error: Option<String>,
    pub code: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CompanyCounts {
    pub total: i32,
    pub active: i32,
    pub inactive: i32,
    pub prospects: i32,
    pub clients: i32,
    pub opportunities: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CompanyFilters {
    pub search: Option<String>,
    pub status: Option<String>,
    pub priority: Option<String>,
    pub industry: Option<String>,
    pub size: Option<String>,
    pub revenue: Option<String>,
    pub sort_by: Option<String>,
    pub sort_order: Option<String>,
    pub section: Option<String>,
    pub cursor: Option<String>,
    pub force_refresh: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CreateCompanyRequest {
    pub name: String,
    pub legal_name: Option<String>,
    pub trading_name: Option<String>,
    pub website: Option<String>,
    pub industry: Option<String>,
    pub size: Option<String>,
    pub revenue: Option<f64>,
    pub employee_count: Option<i32>,
    pub description: Option<String>,
    pub address: Option<String>,
    pub city: Option<String>,
    pub state: Option<String>,
    pub country: Option<String>,
    pub postal_code: Option<String>,
    pub status: Option<String>,
    pub priority: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UpdateCompanyRequest {
    pub name: Option<String>,
    pub legal_name: Option<String>,
    pub trading_name: Option<String>,
    pub website: Option<String>,
    pub industry: Option<String>,
    pub size: Option<String>,
    pub revenue: Option<f64>,
    pub employee_count: Option<i32>,
    pub description: Option<String>,
    pub address: Option<String>,
    pub city: Option<String>,
    pub state: Option<String>,
    pub country: Option<String>,
    pub postal_code: Option<String>,
    pub status: Option<String>,
    pub priority: Option<String>,
    pub notes: Option<String>,
}

// ====================================================================
// UTILITY FUNCTIONS
// ====================================================================

fn clean_website_url(url: Option<String>) -> Option<String> {
    let url = url?;
    if url.trim().is_empty() {
        return None;
    }
    
    let mut cleaned = url.trim().to_string();
    
    // Remove common typos in protocol
    let protocol_regex = regex::Regex::new(r"^https?/?/?\??").unwrap();
    cleaned = protocol_regex.replace_all(&cleaned, "").to_string();
    
    // Remove leading www. if present
    let www_regex = regex::Regex::new(r"^www\.").unwrap();
    cleaned = www_regex.replace_all(&cleaned, "").to_string();
    
    // If no protocol exists, prepend https://
    let has_protocol = regex::Regex::new(r"^https?://").unwrap();
    if !has_protocol.is_match(&cleaned) {
        cleaned = format!("https://{}", cleaned);
    }
    
    Some(cleaned)
}

// ====================================================================
// GET COMPANIES COMMAND
// ====================================================================

#[tauri::command]
pub async fn get_companies(
    workspace_id: String,
    user_id: String,
    page: Option<i32>,
    limit: Option<i32>,
    filters: Option<CompanyFilters>,
) -> Result<CompaniesApiResponse, String> {
    println!("🔍 [COMPANIES API] Getting companies for workspace: {}, user: {}", workspace_id, user_id);
    
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
                    name LIKE ? OR 
                    legal_name LIKE ? OR 
                    trading_name LIKE ? OR 
                    website LIKE ? OR 
                    industry LIKE ? OR 
                    description LIKE ?
                )".to_string());
                
                let search_pattern = format!("%{}%", search);
                for _ in 0..6 {
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
        
        if let Some(industry) = &filters.industry {
            where_conditions.push("industry = ?".to_string());
            bind_values.push(Box::new(industry.clone()));
        }
        
        if let Some(size) = &filters.size {
            where_conditions.push("size = ?".to_string());
            bind_values.push(Box::new(size.clone()));
        }
        
        if let Some(revenue) = &filters.revenue {
            where_conditions.push("revenue = ?".to_string());
            bind_values.push(Box::new(revenue.clone()));
        }
        
        // Apply section filter
        if let Some(section) = &filters.section {
            match section.as_str() {
                "prospects" => {
                    where_conditions.push("status = 'PROSPECT'".to_string());
                }
                "clients" => {
                    where_conditions.push("status = 'CLIENT'".to_string());
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
    let count_query = format!("SELECT COUNT(*) as count FROM companies WHERE {}", where_clause);
    let count_row = sqlx::query(&count_query)
        .bind_all(&bind_values)
        .fetch_one(&sqlite_pool)
        .await
        .map_err(|e| format!("Failed to count companies: {}", e))?;
    
    let total_count = count_row.get::<i64, _>("count") as i32;
    
    // Get companies data
    let sort_by = filters.as_ref()
        .and_then(|f| f.sort_by.as_ref())
        .map(|s| match s.as_str() {
            "name" => "name",
            "industry" => "industry",
            "size" => "employee_count",
            "revenue" => "revenue",
            "created" => "created_at",
            _ => s,
        })
        .unwrap_or("created_at");
    
    let sort_order = filters.as_ref()
        .and_then(|f| f.sort_order.as_ref())
        .map(|s| s.as_str())
        .unwrap_or("desc");
    
    let query = format!(
        "SELECT * FROM companies WHERE {} ORDER BY {} {} LIMIT ? OFFSET ?",
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
        .map_err(|e| format!("Failed to fetch companies: {}", e))?;
    
    let companies: Vec<Company> = rows.into_iter()
        .map(|row| Company {
            id: row.get("id"),
            workspace_id: row.get("workspace_id"),
            name: row.get("name"),
            legal_name: row.get("legal_name"),
            trading_name: row.get("trading_name"),
            local_name: row.get("local_name"),
            description: row.get("description"),
            website: row.get("website"),
            email: row.get("email"),
            phone: row.get("phone"),
            fax: row.get("fax"),
            address: row.get("address"),
            city: row.get("city"),
            state: row.get("state"),
            country: row.get("country"),
            postal_code: row.get("postal_code"),
            industry: row.get("industry"),
            sector: row.get("sector"),
            size: row.get("size"),
            revenue: row.get("revenue"),
            currency: row.get("currency"),
            employee_count: row.get("employee_count"),
            founded_year: row.get("founded_year"),
            registration_number: row.get("registration_number"),
            tax_id: row.get("tax_id"),
            vat_number: row.get("vat_number"),
            domain: row.get("domain"),
            logo_url: row.get("logo_url"),
            status: row.get("status"),
            priority: row.get("priority"),
            tags: row.get("tags"),
            custom_fields: row.get("custom_fields"),
            notes: row.get("notes"),
            last_action: row.get("last_action"),
            last_action_date: row.get("last_action_date"),
            next_action: row.get("next_action"),
            next_action_date: row.get("next_action_date"),
            action_status: row.get("action_status"),
            global_rank: row.get("global_rank"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
            entity_id: row.get("entity_id"),
            deleted_at: row.get("deleted_at"),
            main_seller_id: row.get("main_seller_id"),
            // Opportunity fields
            actual_close_date: row.get("actual_close_date"),
            expected_close_date: row.get("expected_close_date"),
            opportunity_amount: row.get("opportunity_amount"),
            opportunity_probability: row.get("opportunity_probability"),
            opportunity_stage: row.get("opportunity_stage"),
            // Intelligence fields
            acquisition_date: row.get("acquisition_date"),
            active_job_postings: row.get("active_job_postings"),
            business_challenges: row.get("business_challenges"),
            business_priorities: row.get("business_priorities"),
            company_intelligence: row.get("company_intelligence"),
            company_updates: row.get("company_updates"),
            competitive_advantages: row.get("competitive_advantages"),
            competitors: row.get("competitors"),
            confidence: row.get("confidence"),
            decision_timeline: row.get("decision_timeline"),
            digital_maturity: row.get("digital_maturity"),
            facebook_url: row.get("facebook_url"),
            github_url: row.get("github_url"),
            growth_opportunities: row.get("growth_opportunities"),
            hq_city: row.get("hq_city"),
            hq_country_iso2: row.get("hq_country_iso2"),
            hq_country_iso3: row.get("hq_country_iso3"),
            hq_full_address: row.get("hq_full_address"),
            hq_location: row.get("hq_location"),
            hq_region: row.get("hq_region"),
            hq_state: row.get("hq_state"),
            hq_street: row.get("hq_street"),
            hq_zipcode: row.get("hq_zipcode"),
            instagram_url: row.get("instagram_url"),
            is_public: row.get("is_public"),
            key_influencers: row.get("key_influencers"),
            last_funding_amount: row.get("last_funding_amount"),
            last_funding_date: row.get("last_funding_date"),
            last_verified: row.get("last_verified"),
            linkedin_followers: row.get("linkedin_followers"),
            linkedin_url: row.get("linkedin_url"),
            market_position: row.get("market_position"),
            market_threats: row.get("market_threats"),
            naics_codes: row.get("naics_codes"),
            num_technologies_used: row.get("num_technologies_used"),
            parent_company_domain: row.get("parent_company_domain"),
            parent_company_name: row.get("parent_company_name"),
            sic_codes: row.get("sic_codes"),
            sources: row.get("sources"),
            stock_symbol: row.get("stock_symbol"),
            strategic_initiatives: row.get("strategic_initiatives"),
            success_metrics: row.get("success_metrics"),
            tech_stack: row.get("tech_stack"),
            technologies_used: row.get("technologies_used"),
            twitter_followers: row.get("twitter_followers"),
            twitter_url: row.get("twitter_url"),
            youtube_url: row.get("youtube_url"),
            next_action_reasoning: row.get("next_action_reasoning"),
            next_action_priority: row.get("next_action_priority"),
            next_action_type: row.get("next_action_type"),
            next_action_updated_at: row.get("next_action_updated_at"),
            // AI/Data Quality fields
            acquisition_history: row.get("acquisition_history"),
            ai_confidence: row.get("ai_confidence"),
            ai_intelligence: row.get("ai_intelligence"),
            ai_last_updated: row.get("ai_last_updated"),
            data_last_verified: row.get("data_last_verified"),
            data_quality_breakdown: row.get("data_quality_breakdown"),
            data_quality_score: row.get("data_quality_score"),
            data_sources: row.get("data_sources"),
            employee_count_change: row.get("employee_count_change"),
            employee_reviews_score: row.get("employee_reviews_score"),
            executive_arrivals: row.get("executive_arrivals"),
            executive_departures: row.get("executive_departures"),
            funding_rounds: row.get("funding_rounds"),
            job_postings_change: row.get("job_postings_change"),
            product_reviews_score: row.get("product_reviews_score"),
            revenue_range: row.get("revenue_range"),
            // Sync metadata
            last_synced_at: row.get("last_synced_at"),
            sync_version: row.get("sync_version"),
            is_dirty: row.get("is_dirty"),
        })
        .collect();
    
    // Get counts by status
    let counts = get_company_counts(&sqlite_pool, &workspace_id, &user_id, is_demo_mode).await?;
    
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
    
    println!("✅ [COMPANIES API] Retrieved {} companies (page {}/{})", companies.len(), page, total_pages);
    
    Ok(CompaniesApiResponse {
        success: true,
        data: Some(companies),
        pagination: Some(pagination),
        counts: Some(counts),
        error: None,
        code: None,
    })
}

// ====================================================================
// CREATE COMPANY COMMAND
// ====================================================================

#[tauri::command]
pub async fn create_company(
    workspace_id: String,
    user_id: String,
    request: CreateCompanyRequest,
) -> Result<CompaniesApiResponse, String> {
    println!("➕ [COMPANIES API] Creating company: {}", request.name);
    
    // Get database manager
    let db_manager = get_database_manager()?;
    let sqlite_pool = db_manager.get_sqlite_pool().await?;
    
    // Generate ULID
    let company_id = ulid::Ulid::new().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    
    // Clean website URL
    let website = clean_website_url(request.website);
    
    // Insert company
    let query = r#"
        INSERT INTO companies (
            id, workspace_id, name, legal_name, trading_name, website, industry,
            size, revenue, employee_count, description, address, city, state,
            country, postal_code, status, priority, notes, main_seller_id,
            created_at, updated_at, sync_version, is_dirty
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
    "#;
    
    sqlx::query(query)
        .bind(&company_id)
        .bind(&workspace_id)
        .bind(&request.name)
        .bind(&request.legal_name)
        .bind(&request.trading_name)
        .bind(&website)
        .bind(&request.industry)
        .bind(&request.size)
        .bind(&request.revenue)
        .bind(&request.employee_count)
        .bind(&request.description)
        .bind(&request.address)
        .bind(&request.city)
        .bind(&request.state)
        .bind(&request.country)
        .bind(&request.postal_code)
        .bind(&request.status.unwrap_or_else(|| "ACTIVE".to_string()))
        .bind(&request.priority.unwrap_or_else(|| "MEDIUM".to_string()))
        .bind(&request.notes)
        .bind(&user_id)
        .bind(&now)
        .bind(&now)
        .execute(&sqlite_pool)
        .await
        .map_err(|e| format!("Failed to create company: {}", e))?;
    
    // Add to sync queue
    let sync_queue = SyncQueue::new(sqlite_pool.clone());
    sync_queue.enqueue_change(
        "companies",
        &company_id,
        crate::sync::models::SyncOperation::Insert,
        Some(serde_json::to_string(&request).unwrap_or_default()),
    ).await.map_err(|e| format!("Failed to queue sync: {}", e))?;
    
    // Fetch the created company
    let company = get_company_by_id(&sqlite_pool, &company_id).await?;
    
    println!("✅ [COMPANIES API] Created company: {}", company_id);
    
    Ok(CompaniesApiResponse {
        success: true,
        data: Some(vec![company]),
        pagination: None,
        counts: None,
        error: None,
        code: None,
    })
}

// ====================================================================
// UPDATE COMPANY COMMAND
// ====================================================================

#[tauri::command]
pub async fn update_company(
    company_id: String,
    request: UpdateCompanyRequest,
) -> Result<CompaniesApiResponse, String> {
    println!("✏️ [COMPANIES API] Updating company: {}", company_id);
    
    // Get database manager
    let db_manager = get_database_manager()?;
    let sqlite_pool = db_manager.get_sqlite_pool().await?;
    
    // Build update query dynamically
    let mut update_fields = Vec::new();
    let mut bind_values: Vec<Box<dyn sqlx::Encode<'_, sqlx::Sqlite> + Send + Sync>> = vec![];
    
    if let Some(name) = &request.name {
        update_fields.push("name = ?");
        bind_values.push(Box::new(name.clone()));
    }
    
    if let Some(legal_name) = &request.legal_name {
        update_fields.push("legal_name = ?");
        bind_values.push(Box::new(legal_name.clone()));
    }
    
    if let Some(trading_name) = &request.trading_name {
        update_fields.push("trading_name = ?");
        bind_values.push(Box::new(trading_name.clone()));
    }
    
    if let Some(website) = &request.website {
        let cleaned_website = clean_website_url(Some(website.clone()));
        update_fields.push("website = ?");
        bind_values.push(Box::new(cleaned_website));
    }
    
    if let Some(industry) = &request.industry {
        update_fields.push("industry = ?");
        bind_values.push(Box::new(industry.clone()));
    }
    
    if let Some(size) = &request.size {
        update_fields.push("size = ?");
        bind_values.push(Box::new(size.clone()));
    }
    
    if let Some(revenue) = &request.revenue {
        update_fields.push("revenue = ?");
        bind_values.push(Box::new(revenue.clone()));
    }
    
    if let Some(employee_count) = &request.employee_count {
        update_fields.push("employee_count = ?");
        bind_values.push(Box::new(employee_count.clone()));
    }
    
    if let Some(description) = &request.description {
        update_fields.push("description = ?");
        bind_values.push(Box::new(description.clone()));
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
    
    if update_fields.is_empty() {
        return Err("No fields to update".to_string());
    }
    
    update_fields.push("updated_at = ?");
    update_fields.push("sync_version = sync_version + 1");
    update_fields.push("is_dirty = 1");
    
    bind_values.push(Box::new(chrono::Utc::now().to_rfc3339()));
    bind_values.push(Box::new(company_id.clone()));
    
    let query = format!(
        "UPDATE companies SET {} WHERE id = ?",
        update_fields.join(", ")
    );
    
    let mut query_builder = sqlx::query(&query);
    for value in bind_values {
        query_builder = query_builder.bind(value);
    }
    
    let result = query_builder
        .execute(&sqlite_pool)
        .await
        .map_err(|e| format!("Failed to update company: {}", e))?;
    
    if result.rows_affected() == 0 {
        return Err("Company not found".to_string());
    }
    
    // Add to sync queue
    let sync_queue = SyncQueue::new(sqlite_pool.clone());
    sync_queue.enqueue_change(
        "companies",
        &company_id,
        crate::sync::models::SyncOperation::Update,
        Some(serde_json::to_string(&request).unwrap_or_default()),
    ).await.map_err(|e| format!("Failed to queue sync: {}", e))?;
    
    // Fetch the updated company
    let company = get_company_by_id(&sqlite_pool, &company_id).await?;
    
    println!("✅ [COMPANIES API] Updated company: {}", company_id);
    
    Ok(CompaniesApiResponse {
        success: true,
        data: Some(vec![company]),
        pagination: None,
        counts: None,
        error: None,
        code: None,
    })
}

// ====================================================================
// DELETE COMPANY COMMAND
// ====================================================================

#[tauri::command]
pub async fn delete_company(company_id: String) -> Result<CompaniesApiResponse, String> {
    println!("🗑️ [COMPANIES API] Deleting company: {}", company_id);
    
    // Get database manager
    let db_manager = get_database_manager()?;
    let sqlite_pool = db_manager.get_sqlite_pool().await?;
    
    // Soft delete (set deleted_at)
    let now = chrono::Utc::now().to_rfc3339();
    let query = r#"
        UPDATE companies 
        SET deleted_at = ?, updated_at = ?, sync_version = sync_version + 1, is_dirty = 1
        WHERE id = ?
    "#;
    
    let result = sqlx::query(query)
        .bind(&now)
        .bind(&now)
        .bind(&company_id)
        .execute(&sqlite_pool)
        .await
        .map_err(|e| format!("Failed to delete company: {}", e))?;
    
    if result.rows_affected() == 0 {
        return Err("Company not found".to_string());
    }
    
    // Add to sync queue
    let sync_queue = SyncQueue::new(sqlite_pool);
    sync_queue.enqueue_change(
        "companies",
        &company_id,
        crate::sync::models::SyncOperation::Delete,
        None,
    ).await.map_err(|e| format!("Failed to queue sync: {}", e))?;
    
    println!("✅ [COMPANIES API] Deleted company: {}", company_id);
    
    Ok(CompaniesApiResponse {
        success: true,
        data: None,
        pagination: None,
        counts: None,
        error: None,
        code: None,
    })
}

// ====================================================================
// GET COMPANY BY ID COMMAND
// ====================================================================

#[tauri::command]
pub async fn get_company_by_id_command(company_id: String) -> Result<CompaniesApiResponse, String> {
    println!("🔍 [COMPANIES API] Getting company by ID: {}", company_id);
    
    // Get database manager
    let db_manager = get_database_manager()?;
    let sqlite_pool = db_manager.get_sqlite_pool().await?;
    
    // Fetch company
    let company = get_company_by_id(&sqlite_pool, &company_id).await?;
    
    Ok(CompaniesApiResponse {
        success: true,
        data: Some(vec![company]),
        pagination: None,
        counts: None,
        error: None,
        code: None,
    })
}

// ====================================================================
// HELPER FUNCTIONS
// ====================================================================

async fn get_company_counts(
    pool: &sqlx::SqlitePool,
    workspace_id: &str,
    user_id: &str,
    is_demo_mode: bool,
) -> Result<CompanyCounts, String> {
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
            SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active,
            SUM(CASE WHEN status = 'INACTIVE' THEN 1 ELSE 0 END) as inactive,
            SUM(CASE WHEN status = 'PROSPECT' THEN 1 ELSE 0 END) as prospects,
            SUM(CASE WHEN status = 'CLIENT' THEN 1 ELSE 0 END) as clients,
            SUM(CASE WHEN status = 'OPPORTUNITY' THEN 1 ELSE 0 END) as opportunities
        FROM companies WHERE {}",
        where_clause
    );
    
    let mut query_builder = sqlx::query(&query);
    for value in bind_values {
        query_builder = query_builder.bind(value);
    }
    
    let row = query_builder
        .fetch_one(pool)
        .await
        .map_err(|e| format!("Failed to get company counts: {}", e))?;
    
    Ok(CompanyCounts {
        total: row.get::<i64, _>("total") as i32,
        active: row.get::<i64, _>("active") as i32,
        inactive: row.get::<i64, _>("inactive") as i32,
        prospects: row.get::<i64, _>("prospects") as i32,
        clients: row.get::<i64, _>("clients") as i32,
        opportunities: row.get::<i64, _>("opportunities") as i32,
    })
}

async fn get_company_by_id(pool: &sqlx::SqlitePool, company_id: &str) -> Result<Company, String> {
    let query = "SELECT * FROM companies WHERE id = ? AND deleted_at IS NULL";
    
    let row = sqlx::query(query)
        .bind(company_id)
        .fetch_one(pool)
        .await
        .map_err(|e| format!("Failed to fetch company: {}", e))?;
    
    Ok(Company {
        id: row.get("id"),
        workspace_id: row.get("workspace_id"),
        name: row.get("name"),
        legal_name: row.get("legal_name"),
        trading_name: row.get("trading_name"),
        local_name: row.get("local_name"),
        description: row.get("description"),
        website: row.get("website"),
        email: row.get("email"),
        phone: row.get("phone"),
        fax: row.get("fax"),
        address: row.get("address"),
        city: row.get("city"),
        state: row.get("state"),
        country: row.get("country"),
        postal_code: row.get("postal_code"),
        industry: row.get("industry"),
        sector: row.get("sector"),
        size: row.get("size"),
        revenue: row.get("revenue"),
        currency: row.get("currency"),
        employee_count: row.get("employee_count"),
        founded_year: row.get("founded_year"),
        registration_number: row.get("registration_number"),
        tax_id: row.get("tax_id"),
        vat_number: row.get("vat_number"),
        domain: row.get("domain"),
        logo_url: row.get("logo_url"),
        status: row.get("status"),
        priority: row.get("priority"),
        tags: row.get("tags"),
        custom_fields: row.get("custom_fields"),
        notes: row.get("notes"),
        last_action: row.get("last_action"),
        last_action_date: row.get("last_action_date"),
        next_action: row.get("next_action"),
        next_action_date: row.get("next_action_date"),
        action_status: row.get("action_status"),
        global_rank: row.get("global_rank"),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
        entity_id: row.get("entity_id"),
        deleted_at: row.get("deleted_at"),
        main_seller_id: row.get("main_seller_id"),
        // Opportunity fields
        actual_close_date: row.get("actual_close_date"),
        expected_close_date: row.get("expected_close_date"),
        opportunity_amount: row.get("opportunity_amount"),
        opportunity_probability: row.get("opportunity_probability"),
        opportunity_stage: row.get("opportunity_stage"),
        // Intelligence fields
        acquisition_date: row.get("acquisition_date"),
        active_job_postings: row.get("active_job_postings"),
        business_challenges: row.get("business_challenges"),
        business_priorities: row.get("business_priorities"),
        company_intelligence: row.get("company_intelligence"),
        company_updates: row.get("company_updates"),
        competitive_advantages: row.get("competitive_advantages"),
        competitors: row.get("competitors"),
        confidence: row.get("confidence"),
        decision_timeline: row.get("decision_timeline"),
        digital_maturity: row.get("digital_maturity"),
        facebook_url: row.get("facebook_url"),
        github_url: row.get("github_url"),
        growth_opportunities: row.get("growth_opportunities"),
        hq_city: row.get("hq_city"),
        hq_country_iso2: row.get("hq_country_iso2"),
        hq_country_iso3: row.get("hq_country_iso3"),
        hq_full_address: row.get("hq_full_address"),
        hq_location: row.get("hq_location"),
        hq_region: row.get("hq_region"),
        hq_state: row.get("hq_state"),
        hq_street: row.get("hq_street"),
        hq_zipcode: row.get("hq_zipcode"),
        instagram_url: row.get("instagram_url"),
        is_public: row.get("is_public"),
        key_influencers: row.get("key_influencers"),
        last_funding_amount: row.get("last_funding_amount"),
        last_funding_date: row.get("last_funding_date"),
        last_verified: row.get("last_verified"),
        linkedin_followers: row.get("linkedin_followers"),
        linkedin_url: row.get("linkedin_url"),
        market_position: row.get("market_position"),
        market_threats: row.get("market_threats"),
        naics_codes: row.get("naics_codes"),
        num_technologies_used: row.get("num_technologies_used"),
        parent_company_domain: row.get("parent_company_domain"),
        parent_company_name: row.get("parent_company_name"),
        sic_codes: row.get("sic_codes"),
        sources: row.get("sources"),
        stock_symbol: row.get("stock_symbol"),
        strategic_initiatives: row.get("strategic_initiatives"),
        success_metrics: row.get("success_metrics"),
        tech_stack: row.get("tech_stack"),
        technologies_used: row.get("technologies_used"),
        twitter_followers: row.get("twitter_followers"),
        twitter_url: row.get("twitter_url"),
        youtube_url: row.get("youtube_url"),
        next_action_reasoning: row.get("next_action_reasoning"),
        next_action_priority: row.get("next_action_priority"),
        next_action_type: row.get("next_action_type"),
        next_action_updated_at: row.get("next_action_updated_at"),
        // AI/Data Quality fields
        acquisition_history: row.get("acquisition_history"),
        ai_confidence: row.get("ai_confidence"),
        ai_intelligence: row.get("ai_intelligence"),
        ai_last_updated: row.get("ai_last_updated"),
        data_last_verified: row.get("data_last_verified"),
        data_quality_breakdown: row.get("data_quality_breakdown"),
        data_quality_score: row.get("data_quality_score"),
        data_sources: row.get("data_sources"),
        employee_count_change: row.get("employee_count_change"),
        employee_reviews_score: row.get("employee_reviews_score"),
        executive_arrivals: row.get("executive_arrivals"),
        executive_departures: row.get("executive_departures"),
        funding_rounds: row.get("funding_rounds"),
        job_postings_change: row.get("job_postings_change"),
        product_reviews_score: row.get("product_reviews_score"),
        revenue_range: row.get("revenue_range"),
        // Sync metadata
        last_synced_at: row.get("last_synced_at"),
        sync_version: row.get("sync_version"),
        is_dirty: row.get("is_dirty"),
    })
}
