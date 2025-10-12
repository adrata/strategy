use super::models::{DesktopLead, DesktopContact, DatabaseConnection, HybridDatabaseManager};
use sqlx::Row;

#[derive(Debug, Clone)]
pub struct LeadData {
    pub workspace_id: String,
    pub user_id: String,
    pub name: String,
    pub email: String,
    pub company: String,
    pub title: String,
    pub phone: String,
}

#[derive(Debug, Clone)]
pub struct CompanyData {
    pub workspace_id: String,
    pub user_id: String,
    pub name: String,
    pub domain: String,
    pub industry: String,
    pub employees: i32,
    pub revenue: String,
    pub location: String,
    pub status: String,
    pub source: String,
    pub notes: String,
    pub priority: String,
}

impl HybridDatabaseManager {
    /// Get leads for a specific workspace and user
    pub async fn get_leads(&self, workspace_id: &str, user_id_or_name: &str) -> Result<Vec<DesktopLead>, Box<dyn std::error::Error + Send + Sync>> {
        println!("📊 [CRM] Getting leads for workspace: {}, user: {}", workspace_id, user_id_or_name);
        
        let connection = self.connection.read().await;
        
        match &*connection {
            DatabaseConnection::Production { postgres, .. } => {
                let query_sql = r#"
                    SELECT l.id, l."fullName" as name, l."jobTitle" as title, l.email, l.phone, 
                           l.company, l.status, l.source, l.notes, l."createdAt", l."updatedAt",
                           l."assignedUserId", l."estimatedValue", l."customFields"
                    FROM leads l
                    WHERE l."workspaceId" = $1 
                    AND l."assignedUserId" = $2
                    ORDER BY l."createdAt" DESC
                    LIMIT 410
                "#;
                
                let rows = sqlx::query(query_sql)
                    .bind(workspace_id)
                    .bind(user_id_or_name)
                    .fetch_all(postgres)
                    .await?;
                
                let leads: Vec<DesktopLead> = rows.into_iter().enumerate().map(|(index, row)| {
                    // Extract Monaco enrichment data for buyer group role
                    let custom_fields: Option<serde_json::Value> = row.try_get::<Option<serde_json::Value>, _>("customFields").unwrap_or_default();
                    let buyer_group_role = custom_fields.as_ref()
                        .and_then(|cf| cf.get("monacoEnrichment"))
                        .and_then(|md| md.get("buyerGroupAnalysis"))
                        .and_then(|bga| bga.get("role"))
                        .and_then(|r| r.as_str())
                        .map(|s| s.to_string());
                    
                    DesktopLead {
                        id: row.try_get::<String, _>("id").unwrap_or_else(|_| format!("unknown-{}", index)),
                        name: row.try_get::<String, _>("name").unwrap_or_else(|_| "Unknown Name".to_string()),
                        title: row.try_get::<Option<String>, _>("title").unwrap_or_default(),
                        email: row.try_get::<Option<String>, _>("email").unwrap_or_default(),
                        phone: row.try_get::<Option<String>, _>("phone").unwrap_or_default(),
                        company: row.try_get::<Option<String>, _>("company").unwrap_or_default(),
                        status: row.try_get::<String, _>("status").unwrap_or_else(|_| "new".to_string()),
                        source: row.try_get::<Option<String>, _>("source").unwrap_or_default(),
                        notes: row.try_get::<Option<String>, _>("notes").unwrap_or_default(),
                        last_action_date: None,
                        next_action_date: None,
                        value: row.try_get::<Option<f64>, _>("estimatedValue")
                            .ok()
                            .flatten()
                            .map(|v| format!("${:.2}", v)),
                        probability: None,
                        assigned_to: row.try_get::<Option<String>, _>("assignedUserId").unwrap_or_default(),
                        created_at: row.try_get::<chrono::NaiveDateTime, _>("createdAt")
                            .map(|dt| dt.and_utc().to_rfc3339())
                            .unwrap_or_else(|_| chrono::Utc::now().to_rfc3339()),
                        updated_at: row.try_get::<chrono::NaiveDateTime, _>("updatedAt")
                            .map(|dt| dt.and_utc().to_rfc3339())
                            .unwrap_or_else(|_| chrono::Utc::now().to_rfc3339()),
                        needs_sync: false,
                        last_sync_at: Some(chrono::Utc::now().to_rfc3339()),
                        cloud_updated_at: None,
                        buyer_group_role,
                    }
                }).collect();
                
                println!("✅ [CRM] Found {} leads", leads.len());
                Ok(leads)
            },
            DatabaseConnection::_Hybrid { .. } => {
                Ok(vec![])
            }
        }
    }

    /// Get companies/accounts for a specific workspace and user
    #[allow(dead_code)]
    pub async fn get_companies(&self, workspace_id: &str, user_id_or_name: &str) -> Result<Vec<serde_json::Value>, Box<dyn std::error::Error + Send + Sync>> {
        println!("🏢 [CRM] Getting companies for workspace: {}, user: {}", workspace_id, user_id_or_name);
        
        let connection = self.connection.read().await;
        
        match &*connection {
            DatabaseConnection::Production { postgres, .. } => {
                let query_sql = r#"
                    SELECT a.id, a.name, a.website, a.industry, a.size, a.revenue,
                           a.address, a.city, a.state, a.country, a."createdAt", a."updatedAt",
                           a.description, a.email, a.phone, a."assignedUserId"
                    FROM accounts a
                    WHERE a."workspaceId" = $1 
                    AND a."assignedUserId" = $2
                    ORDER BY a."createdAt" DESC
                    LIMIT 100
                "#;
                
                let rows = sqlx::query(query_sql)
                    .bind(workspace_id)
                    .bind(user_id_or_name)
                    .fetch_all(postgres)
                    .await?;
                
                let companies: Vec<serde_json::Value> = rows.into_iter().map(|row| {
                    let city = row.try_get::<Option<String>, _>("city").unwrap_or_default().unwrap_or_default();
                    let state = row.try_get::<Option<String>, _>("state").unwrap_or_default().unwrap_or_default();
                    let location = if !city.is_empty() && !state.is_empty() {
                        format!("{}, {}", city, state)
                    } else if !city.is_empty() {
                        city
                    } else if !state.is_empty() {
                        state
                    } else {
                        "".to_string()
                    };

                    serde_json::json!({
                        "id": row.try_get::<String, _>("id").unwrap_or_default(),
                        "name": row.try_get::<String, _>("name").unwrap_or_default(),
                        "domain": row.try_get::<Option<String>, _>("website").unwrap_or_default(),
                        "industry": row.try_get::<Option<String>, _>("industry").unwrap_or_default(),
                        "size": row.try_get::<Option<String>, _>("size").unwrap_or_default(),
                        "revenue": row.try_get::<Option<f64>, _>("revenue").unwrap_or_default(),
                        "location": location,
                        "description": row.try_get::<Option<String>, _>("description").unwrap_or_default(),
                        "email": row.try_get::<Option<String>, _>("email").unwrap_or_default(),
                        "phone": row.try_get::<Option<String>, _>("phone").unwrap_or_default(),
                        "assignedUserId": row.try_get::<Option<String>, _>("assignedUserId").unwrap_or_default(),
                        "createdAt": row.try_get::<chrono::NaiveDateTime, _>("createdAt")
                            .map(|dt| dt.and_utc().to_rfc3339())
                            .unwrap_or_default(),
                        "updatedAt": row.try_get::<chrono::NaiveDateTime, _>("updatedAt")
                            .map(|dt| dt.and_utc().to_rfc3339())
                            .unwrap_or_default(),
                    })
                }).collect();
                
                println!("✅ [CRM] Found {} companies", companies.len());
                Ok(companies)
            },
            DatabaseConnection::_Hybrid { .. } => {
                Ok(vec![])
            }
        }
    }

    /// Get contacts for a specific workspace and user
    pub async fn get_contacts(&self, workspace_id: &str, user_id_or_name: &str) -> Result<Vec<DesktopContact>, Box<dyn std::error::Error + Send + Sync>> {
        println!("👥 [CRM] Getting contacts for workspace: {}, user: {}", workspace_id, user_id_or_name);
        
        let connection = self.connection.read().await;
        
        match &*connection {
            DatabaseConnection::Production { postgres, .. } => {
                let query_sql = r#"
                    SELECT c.id, c."fullName" as name, c."jobTitle" as title, c.email, c.phone, 
                           c.department, c.notes, c."linkedinUrl", c."createdAt", c."updatedAt", 
                           c."assignedUserId", c.seniority, c.status,
                           a.name as company_name
                    FROM contacts c
                    LEFT JOIN accounts a ON c."accountId" = a.id
                    WHERE c."workspaceId" = $1 
                    AND c."assignedUserId" = $2
                    ORDER BY c."createdAt" DESC
                    LIMIT 100
                "#;
                
                let rows = sqlx::query(query_sql)
                    .bind(workspace_id)
                    .bind(user_id_or_name)
                    .fetch_all(postgres)
                    .await?;
                
                let contacts: Vec<DesktopContact> = rows.into_iter().map(|row| {
                    DesktopContact {
                        id: row.try_get::<String, _>("id").unwrap_or_default(),
                        name: row.try_get::<String, _>("name").unwrap_or_default(),
                        title: row.try_get::<Option<String>, _>("title").unwrap_or_default(),
                        email: row.try_get::<Option<String>, _>("email").unwrap_or_default(),
                        phone: row.try_get::<Option<String>, _>("phone").unwrap_or_default(),
                        company: row.try_get::<Option<String>, _>("company_name").unwrap_or_default(),
                        department: row.try_get::<Option<String>, _>("department").unwrap_or_default(),
                        location: None,
                        notes: row.try_get::<Option<String>, _>("notes").unwrap_or_default(),
                        relationship: row.try_get::<Option<String>, _>("seniority").unwrap_or_default(),
                        linkedin_url: row.try_get::<Option<String>, _>("linkedinUrl").unwrap_or_default(),
                        account_id: None,
                        assigned_to: row.try_get::<Option<String>, _>("assignedUserId").unwrap_or_default(),
                        created_at: row.try_get::<chrono::NaiveDateTime, _>("createdAt")
                            .map(|dt| dt.and_utc().to_rfc3339())
                            .unwrap_or_else(|_| chrono::Utc::now().to_rfc3339()),
                        updated_at: row.try_get::<chrono::NaiveDateTime, _>("updatedAt")
                            .map(|dt| dt.and_utc().to_rfc3339())
                            .unwrap_or_else(|_| chrono::Utc::now().to_rfc3339()),
                        needs_sync: false,
                        last_sync_at: Some(chrono::Utc::now().to_rfc3339()),
                        cloud_updated_at: None,
                    }
                }).collect();
                
                println!("✅ [CRM] Found {} contacts", contacts.len());
                Ok(contacts)
            },
            DatabaseConnection::_Hybrid { .. } => {
                Ok(vec![])
            }
        }
    }

    /// Get opportunities for a specific workspace and user
    #[allow(dead_code)]
    pub async fn get_opportunities(&self, workspace_id: &str, user_id_or_name: &str) -> Result<Vec<serde_json::Value>, Box<dyn std::error::Error + Send + Sync>> {
        println!("💼 [CRM] Getting opportunities for workspace: {}, user: {}", workspace_id, user_id_or_name);
        
        let connection = self.connection.read().await;
        
        match &*connection {
            DatabaseConnection::Production { postgres, .. } => {
                let query_sql = r#"
                    SELECT o.id, o.name, o.description, o.amount, o."expectedCloseDate",
                           o.probability, o.stage, o."contactId", o."accountId", o."assignedUserId",
                           o."createdAt", o."updatedAt", o."engagementScore", o."riskScore",
                           a.name as account_name, c."fullName" as contact_name
                    FROM opportunities o
                    LEFT JOIN accounts a ON o."accountId" = a.id
                    LEFT JOIN contacts c ON o."contactId" = c.id
                    WHERE o."workspaceId" = $1 
                    AND o."assignedUserId" = $2
                    ORDER BY o."createdAt" DESC
                    LIMIT 100
                "#;
                
                let rows = sqlx::query(query_sql)
                    .bind(workspace_id)
                    .bind(user_id_or_name)
                    .fetch_all(postgres)
                    .await?;
                
                let opportunities: Vec<serde_json::Value> = rows.into_iter().map(|row| {
                    serde_json::json!({
                        "id": row.try_get::<String, _>("id").unwrap_or_default(),
                        "name": row.try_get::<String, _>("name").unwrap_or_default(),
                        "description": row.try_get::<Option<String>, _>("description").unwrap_or_default(),
                        "amount": row.try_get::<Option<f64>, _>("amount").unwrap_or_default(),
                        "expectedCloseDate": row.try_get::<Option<chrono::NaiveDateTime>, _>("expectedCloseDate")
                            .ok()
                            .flatten()
                            .map(|dt| dt.and_utc().to_rfc3339())
                            .unwrap_or_default(),
                        "probability": row.try_get::<i32, _>("probability").unwrap_or(0),
                        "stage": row.try_get::<String, _>("stage").unwrap_or_default(),
                        "contactId": row.try_get::<Option<String>, _>("contactId").unwrap_or_default(),
                        "accountId": row.try_get::<Option<String>, _>("accountId").unwrap_or_default(),
                        "assignedUserId": row.try_get::<Option<String>, _>("assignedUserId").unwrap_or_default(),
                        "accountName": row.try_get::<Option<String>, _>("account_name").unwrap_or_default(),
                        "contactName": row.try_get::<Option<String>, _>("contact_name").unwrap_or_default(),
                        "engagementScore": row.try_get::<Option<f64>, _>("engagementScore").unwrap_or_default(),
                        "riskScore": row.try_get::<Option<f64>, _>("riskScore").unwrap_or_default(),
                        "createdAt": row.try_get::<chrono::NaiveDateTime, _>("createdAt")
                            .map(|dt| dt.and_utc().to_rfc3339())
                            .unwrap_or_default(),
                        "updatedAt": row.try_get::<chrono::NaiveDateTime, _>("updatedAt")
                            .map(|dt| dt.and_utc().to_rfc3339())
                            .unwrap_or_default(),
                    })
                }).collect();
                
                println!("✅ [CRM] Found {} opportunities", opportunities.len());
                Ok(opportunities)
            },
            DatabaseConnection::_Hybrid { .. } => {
                Ok(vec![])
            }
        }
    }

    /// Add a new lead to the database
    pub async fn add_lead(&self, lead_data: &LeadData) -> Result<DesktopLead, Box<dyn std::error::Error + Send + Sync>> {
        println!("📝 [CRM] Adding lead: {} from {}", lead_data.name, lead_data.company);
        
        let connection = self.connection.read().await;
        
        match &*connection {
            DatabaseConnection::Production { postgres, .. } => {
                let lead_id = uuid::Uuid::new_v4().to_string();
                let now = chrono::Utc::now();
                
                // Create entity record first (2025 best practice)
                let entity_id = crate::entity::generate_entity_id();
                let entity_metadata = serde_json::json!({
                    "fullName": lead_data.name,
                    "company": lead_data.company,
                    "type": "lead"
                });
                
                let entity_insert_sql = r#"
                    INSERT INTO entities (id, type, workspace_id, created_at, updated_at, metadata)
                    VALUES ($1, 'lead', $2, $3, $4, $5)
                "#;
                
                sqlx::query(entity_insert_sql)
                    .bind(&entity_id)
                    .bind(&lead_data.workspace_id)
                    .bind(now)
                    .bind(now)
                    .bind(&entity_metadata)
                    .execute(postgres)
                    .await?;
                
                // Split name into first and last name
                let name_parts: Vec<&str> = lead_data.name.splitn(2, ' ').collect();
                let first_name = name_parts.get(0).unwrap_or(&"").to_string();
                let last_name = name_parts.get(1).unwrap_or(&"").to_string();
                
                let insert_sql = r#"
                    INSERT INTO people (id, "fullName", "firstName", "lastName", "jobTitle", company, email, phone, status, source, notes, priority, "workspaceId", "assignedUserId", "createdAt", "updatedAt")
                    VALUES ($1, $2, $3, $4, $5, $6, $7, 'LEAD', 'manual', '', 'MEDIUM', $8, $9, $10, $11)
                "#;
                
                sqlx::query(insert_sql)
                    .bind(&lead_id)
                    .bind(&lead_data.name) // fullName
                    .bind(&first_name) // firstName
                    .bind(&last_name) // lastName
                    .bind(&lead_data.title) // jobTitle
                    .bind(&lead_data.company)
                    .bind(&lead_data.email)
                    .bind(&lead_data.phone)
                    .bind(&lead_data.workspace_id)
                    .bind(&lead_data.user_id)
                    .bind(now)
                    .bind(now)
                    .execute(postgres)
                    .await?;
                
                let lead = DesktopLead {
                    id: lead_id,
                    name: lead_data.name.clone(),
                    title: Some(lead_data.title.clone()),
                    email: Some(lead_data.email.clone()),
                    phone: Some(lead_data.phone.clone()),
                    company: Some(lead_data.company.clone()),
                    status: "new".to_string(),
                    source: Some("manual".to_string()),
                    notes: Some("".to_string()),
                    last_action_date: None,
                    next_action_date: None,
                    value: None,
                    probability: None,
                    assigned_to: Some(lead_data.user_id.clone()),
                    created_at: now.to_rfc3339(),
                    updated_at: now.to_rfc3339(),
                    needs_sync: false,
                    last_sync_at: Some(now.to_rfc3339()),
                    cloud_updated_at: None,
                    buyer_group_role: None,
                };
                
                println!("✅ [CRM] Lead added successfully");
                Ok(lead)
            },
            DatabaseConnection::_Hybrid { .. } => {
                Err("Lead creation not supported in hybrid mode".into())
            }
        }
    }

    /// Update lead status
    pub async fn update_lead_status(&self, workspace_id: &str, user_id: &str, contact_id: &str, new_status: &str) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        println!("📝 [CRM] Updating lead status: {} -> {}", contact_id, new_status);
        
        let connection = self.connection.read().await;
        
        match &*connection {
            DatabaseConnection::Production { postgres, .. } => {
                let update_sql = r#"
                    UPDATE leads 
                    SET status = $1, "updatedAt" = NOW()
                    WHERE id = $2 AND "workspaceId" = $3 AND "assignedUserId" = $4
                "#;
                
                sqlx::query(update_sql)
                    .bind(new_status)
                    .bind(contact_id)
                    .bind(workspace_id)
                    .bind(user_id)
                    .execute(postgres)
                    .await?;
                
                println!("✅ [CRM] Lead status updated successfully");
                Ok(())
            },
            DatabaseConnection::_Hybrid { .. } => {
                Err("Lead update not supported in hybrid mode".into())
            }
        }
    }

    /// Save lead activity
    pub async fn save_lead_activity(&self, workspace_id: &str, user_id: &str, contact_id: &str, activity_record: &serde_json::Value) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        println!("📝 [CRM] Saving lead activity for: {}", contact_id);
        
        let connection = self.connection.read().await;
        
        match &*connection {
            DatabaseConnection::Production { postgres, .. } => {
                let activity_id = uuid::Uuid::new_v4().to_string();
                let activity_type = activity_record.get("type").and_then(|v| v.as_str()).unwrap_or("unknown");
                
                let insert_sql = r#"
                    INSERT INTO lead_activities (id, "leadId", "workspaceId", "userId", activity_type, activity_data, "createdAt")
                    VALUES ($1, $2, $3, $4, $5, $6, NOW())
                "#;
                
                sqlx::query(insert_sql)
                    .bind(&activity_id)
                    .bind(contact_id)
                    .bind(workspace_id)
                    .bind(user_id)
                    .bind(activity_type)
                    .bind(activity_record)
                    .execute(postgres)
                    .await?;
                
                println!("✅ [CRM] Lead activity saved successfully");
                Ok(())
            },
            DatabaseConnection::_Hybrid { .. } => {
                Err("Activity logging not supported in hybrid mode".into())
            }
        }
    }

    /// Save call activity
    pub async fn save_call_activity(&self, workspace_id: &str, user_id: &str, contact_id: &str, call_record: &serde_json::Value) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        println!("📞 [CRM] Saving call activity for: {}", contact_id);
        
        let connection = self.connection.read().await;
        
        match &*connection {
            DatabaseConnection::Production { postgres, .. } => {
                let call_id = uuid::Uuid::new_v4().to_string();
                
                let insert_sql = r#"
                    INSERT INTO call_activities (id, "leadId", "workspaceId", "userId", call_data, "createdAt")
                    VALUES ($1, $2, $3, $4, $5, NOW())
                "#;
                
                sqlx::query(insert_sql)
                    .bind(&call_id)
                    .bind(contact_id)
                    .bind(workspace_id)
                    .bind(user_id)
                    .bind(call_record)
                    .execute(postgres)
                    .await?;
                
                println!("✅ [CRM] Call activity saved successfully");
                Ok(())
            },
            DatabaseConnection::_Hybrid { .. } => {
                Err("Call activity logging not supported in hybrid mode".into())
            }
        }
    }

    /// Add a new company/account
    #[allow(dead_code)]
    pub async fn add_company(&self, company_data: &CompanyData) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        println!("🏢 [CRM] Adding company: {}", company_data.name);
        
        let connection = self.connection.read().await;
        
        match &*connection {
            DatabaseConnection::Production { postgres, .. } => {
                let company_id = uuid::Uuid::new_v4().to_string();
                let now = chrono::Utc::now();
                
                // Create entity record first (2025 best practice)
                let entity_id = crate::entity::generate_entity_id();
                let entity_metadata = serde_json::json!({
                    "name": company_data.name,
                    "industry": company_data.industry,
                    "type": "company"
                });
                
                let entity_insert_sql = r#"
                    INSERT INTO entities (id, type, workspace_id, created_at, updated_at, metadata)
                    VALUES ($1, 'company', $2, $3, $4, $5)
                "#;
                
                sqlx::query(entity_insert_sql)
                    .bind(&entity_id)
                    .bind(&company_data.workspace_id)
                    .bind(now)
                    .bind(now)
                    .bind(&entity_metadata)
                    .execute(postgres)
                    .await?;
                
                let insert_sql = r#"
                    INSERT INTO companies (id, name, website, industry, size, "employeeCount", revenue, address, status, source, notes, priority, "workspaceId", "assignedUserId", "createdAt", "updatedAt")
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                "#;
                
                sqlx::query(insert_sql)
                    .bind(&company_id)
                    .bind(&company_data.name)
                    .bind(&company_data.domain)
                    .bind(&company_data.industry)
                    .bind("unknown") // size
                    .bind(company_data.employees)
                    .bind(&company_data.revenue)
                    .bind(&company_data.location)
                    .bind(&company_data.status)
                    .bind(&company_data.source)
                    .bind(&company_data.notes)
                    .bind(&company_data.priority)
                    .bind(&company_data.workspace_id)
                    .bind(&company_data.user_id)
                    .bind(now)
                    .bind(now)
                    .execute(postgres)
                    .await?;
                
                println!("✅ [CRM] Company added successfully");
                Ok(company_id)
            },
            DatabaseConnection::_Hybrid { .. } => {
                Err("Company creation not supported in hybrid mode".into())
            }
        }
    }

    /// Update lead comprehensive
    #[allow(dead_code)]
    pub async fn update_lead_comprehensive(&self, workspace_id: &str, user_id: &str, lead_id: &str, updates: &serde_json::Value) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        println!("📝 [CRM] Updating lead comprehensively: {}", lead_id);
        
        let connection = self.connection.read().await;
        
        match &*connection {
            DatabaseConnection::Production { postgres, .. } => {
                let update_sql = r#"
                    UPDATE leads 
                    SET 
                        "fullName" = COALESCE($1, "fullName"),
                        "jobTitle" = COALESCE($2, "jobTitle"),
                        company = COALESCE($3, company),
                        email = COALESCE($4, email),
                        phone = COALESCE($5, phone),
                        status = COALESCE($6, status),
                        notes = COALESCE($7, notes),
                        "updatedAt" = NOW()
                    WHERE id = $8 AND "workspaceId" = $9 AND "assignedUserId" = $10
                "#;
                
                sqlx::query(update_sql)
                    .bind(updates.get("name").and_then(|v| v.as_str()))
                    .bind(updates.get("title").and_then(|v| v.as_str()))
                    .bind(updates.get("company").and_then(|v| v.as_str()))
                    .bind(updates.get("email").and_then(|v| v.as_str()))
                    .bind(updates.get("phone").and_then(|v| v.as_str()))
                    .bind(updates.get("status").and_then(|v| v.as_str()))
                    .bind(updates.get("notes").and_then(|v| v.as_str()))
                    .bind(lead_id)
                    .bind(workspace_id)
                    .bind(user_id)
                    .execute(postgres)
                    .await?;
                
                println!("✅ [CRM] Lead updated comprehensively");
                Ok(())
            },
            DatabaseConnection::_Hybrid { .. } => {
                Err("Lead update not supported in hybrid mode".into())
            }
        }
    }
} 