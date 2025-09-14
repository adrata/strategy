use super::models::{HybridDatabaseManager, DatabaseConnection};
use sqlx::Row;
use std::time::{Instant, Duration};
use rayon::prelude::*;
use serde_json;
use dashmap::DashMap;
use once_cell::sync::Lazy;

#[derive(Debug, Clone)]
pub struct SpeedrunContactData {
    pub workspace_id: String,
    pub user_id: String,
    pub name: String,
    pub title: String,
    pub company: String,
    pub email: String,
    pub phone: String,
    pub status: String,
    pub source: String,
    pub priority: String,
    #[allow(dead_code)]
    pub segment: String,
}

// Ultra-fast caching system
static MARK_I_CACHE: Lazy<DashMap<String, (Vec<serde_json::Value>, Instant)>> = Lazy::new(DashMap::new);
const CACHE_TTL_MARK_I: Duration = Duration::from_secs(60);

impl HybridDatabaseManager {
    /// Get Speedrun leads with ultra-fast caching
    pub async fn get_outbox_leads(&self, workspace_id: &str, user_id: &str, limit: i32) -> Result<Vec<serde_json::Value>, Box<dyn std::error::Error + Send + Sync>> {
        let start_time = Instant::now();
        println!("⚡ [SPEEDRUN] Fetching Speedrun leads for workspace: {}, user: {}, limit: {}", workspace_id, user_id, limit);
        
        // Cache lookup
        let cache_key = format!("mark_i_leads:{}:{}:{}", workspace_id, user_id, limit);
        
        if let Some(cached_entry) = MARK_I_CACHE.get(&cache_key) {
            let (cached_data, timestamp) = cached_entry.value();
            if timestamp.elapsed() < CACHE_TTL_MARK_I {
                println!("⚡ [MARK I] Cache HIT! Returning {} leads in {}μs", cached_data.len(), start_time.elapsed().as_micros());
                return Ok(cached_data.clone());
            } else {
                drop(cached_entry);
                MARK_I_CACHE.remove(&cache_key);
            }
        }
        
        let connection = self.connection.read().await;
        
        match &*connection {
            DatabaseConnection::Production { postgres, .. } => {
                let query_sql = r#"
                    SELECT l.id, l."fullName" as name, l."jobTitle" as title, l.company, 
                           l.email, l.phone, l."mobilePhone", l.status, l.priority,
                           l."createdAt", l."updatedAt", l."workspaceId", l."assignedUserId",
                           l.notes, l."estimatedValue", l."customFields", l."linkedinUrl", 
                           l.description, l.tags, l.source, l.industry, l.department
                    FROM leads l
                    WHERE l."workspaceId" = $1 
                    AND l."assignedUserId" = $2
                    AND l.status NOT IN ('completed', 'closed', 'won', 'lost', 'archived', 'deleted')
                    AND (l.email IS NOT NULL OR l.phone IS NOT NULL OR l."mobilePhone" IS NOT NULL)
                    ORDER BY 
                        CASE l.priority 
                            WHEN 'high' THEN 1 
                            WHEN 'medium' THEN 2 
                            WHEN 'low' THEN 3 
                            ELSE 4 
                        END,
                        l."updatedAt" DESC,
                        l."createdAt" DESC
                    LIMIT $3
                "#;
                
                let rows = sqlx::query(query_sql)
                    .bind(workspace_id)
                    .bind(user_id)
                    .bind(limit as i64)
                    .fetch_all(postgres)
                    .await?;
                
                let processed_leads: Vec<serde_json::Value> = rows
                    .into_par_iter()
                    .map(|row| self.convert_mark_i_row_to_json(&row))
                    .collect();
                
                MARK_I_CACHE.insert(cache_key, (processed_leads.clone(), Instant::now()));
                
                println!("✅ [MARK I] Fetched {} leads in {}ms", processed_leads.len(), start_time.elapsed().as_millis());
                Ok(processed_leads)
            },
            DatabaseConnection::_Hybrid { .. } => {
                Ok(vec![])
            }
        }
    }

    /// Get Speedrun settings
    #[allow(dead_code)]
    pub async fn get_outbox_settings(&self, workspace_id: &str, user_id: &str) -> Result<serde_json::Value, Box<dyn std::error::Error + Send + Sync>> {
        println!("⚙️ [MARK I] Getting settings for workspace: {}, user: {}", workspace_id, user_id);
        
        let connection = self.connection.read().await;
        
        match &*connection {
            DatabaseConnection::Production { postgres, .. } => {
                let query_sql = r#"
                    SELECT os."weeklyTarget", os.strategy, os.role, os.quota, os."pipelineHealth"
                    FROM "OutboxSettings" os
                    JOIN users u ON (os."userId" = u.id OR os."userId" = u.name OR os."userId" = u.email)
                    WHERE os."workspaceId" = $1 
                    AND (u.id = $2 OR u.name = $2 OR u.email = $2)
                    LIMIT 1
                "#;
                
                if let Some(row) = sqlx::query(query_sql).bind(workspace_id).bind(user_id).fetch_optional(postgres).await? {
                    Ok(serde_json::json!({
                        "userId": user_id,
                        "workspaceId": workspace_id,
                        "weeklyTarget": row.try_get::<i32, _>("weeklyTarget").unwrap_or(15),
                        "strategy": row.try_get::<String, _>("strategy").unwrap_or("optimal".to_string()),
                        "role": row.try_get::<String, _>("role").unwrap_or("AE".to_string()),
                        "quota": row.try_get::<Option<i32>, _>("quota").unwrap_or_default(),
                        "pipelineHealth": row.try_get::<Option<String>, _>("pipelineHealth").unwrap_or_default()
                    }))
                } else {
                    Ok(serde_json::json!({
                        "userId": user_id,
                        "workspaceId": workspace_id,
                        "weeklyTarget": 15,
                        "strategy": "optimal",
                        "role": "AE",
                        "quota": 500000,
                        "pipelineHealth": "healthy"
                    }))
                }
            },
            DatabaseConnection::_Hybrid { .. } => {
                Ok(serde_json::json!({
                    "userId": user_id,
                    "workspaceId": workspace_id,
                    "weeklyTarget": 15,
                    "strategy": "optimal",
                    "role": "AE",
                    "quota": 500000,
                    "pipelineHealth": "healthy"
                }))
            }
        }
    }

    /// Update Speedrun settings
    #[allow(dead_code)]
    pub async fn update_outbox_settings(&self, workspace_id: &str, user_id: &str, settings: serde_json::Value) -> Result<bool, Box<dyn std::error::Error + Send + Sync>> {
        println!("⚙️ [MARK I] Updating settings for workspace: {}, user: {}", workspace_id, user_id);
        
        let connection = self.connection.read().await;
        
        match &*connection {
            DatabaseConnection::Production { postgres, .. } => {
                let weekly_target = settings.get("weeklyTarget").and_then(|v| v.as_i64()).unwrap_or(15) as i32;
                let strategy = settings.get("strategy").and_then(|v| v.as_str()).unwrap_or("optimal");
                let role = settings.get("role").and_then(|v| v.as_str()).unwrap_or("AE");
                let quota = settings.get("quota").and_then(|v| v.as_i64()).map(|v| v as i32);
                let pipeline_health = settings.get("pipelineHealth").and_then(|v| v.as_str());
                
                let upsert_sql = r#"
                    INSERT INTO "OutboxSettings" ("userId", "workspaceId", "weeklyTarget", strategy, role, quota, "pipelineHealth")
                    SELECT u.id, $1, $3, $4, $5, $6, $7
                    FROM users u 
                    WHERE u.id = $2 OR u.name = $2 OR u.email = $2
                    ON CONFLICT ("userId", "workspaceId") 
                    DO UPDATE SET 
                        "weeklyTarget" = EXCLUDED."weeklyTarget",
                        strategy = EXCLUDED.strategy,
                        role = EXCLUDED.role,
                        quota = EXCLUDED.quota,
                        "pipelineHealth" = EXCLUDED."pipelineHealth",
                        "updatedAt" = NOW()
                "#;
                
                let result = sqlx::query(upsert_sql)
                    .bind(workspace_id)
                    .bind(user_id)
                    .bind(weekly_target)
                    .bind(strategy)
                    .bind(role)
                    .bind(quota)
                    .bind(pipeline_health)
                    .execute(postgres)
                    .await?;
                
                Ok(result.rows_affected() > 0)
            },
            DatabaseConnection::_Hybrid { .. } => {
                Ok(false)
            }
        }
    }

    /// Get Speedrun count
    #[allow(dead_code)]
    pub async fn get_outbox_count(&self, workspace_id: &str, user_id: &str) -> Result<i32, Box<dyn std::error::Error + Send + Sync>> {
        println!("📤 [MARK I] Getting count for workspace: {}, user: {}", workspace_id, user_id);
        
        let connection = self.connection.read().await;
        
        match &*connection {
            DatabaseConnection::Production { postgres, .. } => {
                let query_sql = r#"
                    SELECT COUNT(*) as count
                    FROM leads l
                    WHERE l."workspaceId" = $1 
                    AND l."assignedUserId" = $2
                    AND l.status IN ('new', 'contacted', 'qualified')
                "#;
                
                let row = sqlx::query(query_sql)
                    .bind(workspace_id)
                    .bind(user_id)
                    .fetch_one(postgres)
                    .await?;
                
                let count: i64 = row.try_get::<i64, _>("count").unwrap_or(0);
                Ok(count as i32)
            },
            DatabaseConnection::_Hybrid { .. } => {
                Ok(0)
            }
        }
    }

    /// Add Speedrun contact
    #[allow(dead_code)]
    pub async fn add_outbox_contact(&self, contact_data: &SpeedrunContactData) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        println!("📝 [MARK I] Adding contact: {} from {}", contact_data.name, contact_data.company);
        
        let connection = self.connection.read().await;
        
        match &*connection {
            DatabaseConnection::Production { postgres, .. } => {
                let contact_id = uuid::Uuid::new_v4().to_string();
                let now = chrono::Utc::now();
                
                let insert_sql = r#"
                    INSERT INTO leads (id, "fullName", "jobTitle", company, email, phone, status, source, priority, "workspaceId", "assignedUserId", "createdAt", "updatedAt")
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                "#;
                
                sqlx::query(insert_sql)
                    .bind(&contact_id)
                    .bind(&contact_data.name)
                    .bind(&contact_data.title)
                    .bind(&contact_data.company)
                    .bind(&contact_data.email)
                    .bind(&contact_data.phone)
                    .bind(&contact_data.status)
                    .bind(&contact_data.source)
                    .bind(&contact_data.priority)
                    .bind(&contact_data.workspace_id)
                    .bind(&contact_data.user_id)
                    .bind(now)
                    .bind(now)
                    .execute(postgres)
                    .await?;
                
                // Clear cache to force refresh
                let cache_pattern = format!("mark_i_leads:{}:{}:", contact_data.workspace_id, contact_data.user_id);
                MARK_I_CACHE.retain(|key, _| !key.starts_with(&cache_pattern));
                
                Ok(contact_id)
            },
            DatabaseConnection::_Hybrid { .. } => {
                Err("Speedrun contact creation not supported in hybrid mode".into())
            }
        }
    }

    // Helper method to convert row to JSON for Speedrun
    fn convert_mark_i_row_to_json(&self, row: &sqlx::postgres::PgRow) -> serde_json::Value {
        let name = row.try_get::<String, _>("name").unwrap_or_default();
        let company = row.try_get::<String, _>("company").unwrap_or_default();
        let status = row.try_get::<String, _>("status").unwrap_or_default();
        let priority = row.try_get::<String, _>("priority").unwrap_or_default();
        
        let custom_fields: Option<serde_json::Value> = row.try_get::<Option<serde_json::Value>, _>("customFields").unwrap_or_default();
        let monaco_data = custom_fields.as_ref().and_then(|cf| cf.get("monacoEnrichment"));
        
        let relationship = monaco_data
            .and_then(|md| md.get("buyerGroupAnalysis"))
            .and_then(|bga| bga.get("role"))
            .and_then(|r| r.as_str())
            .unwrap_or({
                match (priority.as_str(), status.as_str()) {
                    ("high", _) => "Champion",
                    (_, "demo-scheduled") => "Decision Maker", 
                    (_, "qualified") => "Stakeholder",
                    _ => "Influencer"
                }
            })
            .to_string();
        
        let next_action = match status.as_str() {
            "new" => "Initial outreach",
            "contacted" => "Follow up on initial contact",
            "qualified" => "Schedule discovery call",
            "demo-scheduled" => "Prepare for product demo",
            "follow-up" => "Continue nurturing relationship",
            _ => "Follow up"
        };
        
        serde_json::json!({
            "id": row.try_get::<String, _>("id").unwrap_or_default(),
            "name": name,
            "title": row.try_get::<String, _>("title").unwrap_or_default(),
            "company": company,
            "email": row.try_get::<String, _>("email").unwrap_or_default(),
            "phone": row.try_get::<Option<String>, _>("phone").unwrap_or_default().unwrap_or_default(),
            "mobilePhone": row.try_get::<Option<String>, _>("mobilePhone").unwrap_or_default().unwrap_or_default(),
            "linkedin": row.try_get::<Option<String>, _>("linkedinUrl").unwrap_or_default()
                .unwrap_or_else(|| format!("linkedin.com/in/{}", name.to_lowercase().replace(' ', "-"))),
            "priority": priority,
            "status": status,
            "nextAction": next_action,
            "buyerGroupRole": relationship,
            "relationship": relationship,
            "commission": row.try_get::<Option<f64>, _>("estimatedValue")
                .unwrap_or_default()
                .map(|v| format!("{}K", (v / 1000.0) as i32))
                .unwrap_or_else(|| "25K".to_string()),
            "source": row.try_get::<Option<String>, _>("source").unwrap_or_default()
                .unwrap_or_else(|| "Production Database".to_string()),
            "industry": row.try_get::<Option<String>, _>("industry").unwrap_or_default(),
            "department": row.try_get::<Option<String>, _>("department").unwrap_or_default(),
            "tags": row.try_get::<Option<Vec<String>>, _>("tags").unwrap_or_default().unwrap_or_default(),
            "workspaceId": row.try_get::<String, _>("workspaceId").unwrap_or_default(),
            "assignedUserId": row.try_get::<String, _>("assignedUserId").unwrap_or_default(),
            "createdAt": row.try_get::<chrono::NaiveDateTime, _>("createdAt")
                .map(|dt| dt.and_utc().to_rfc3339())
                .unwrap_or_default(),
            "updatedAt": row.try_get::<chrono::NaiveDateTime, _>("updatedAt")
                .map(|dt| dt.and_utc().to_rfc3339())
                .unwrap_or_default(),
            "customFields": custom_fields.clone().unwrap_or_default(),
            "monacoEnrichment": monaco_data.cloned()
        })
    }
} 