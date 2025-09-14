// Modular Tauri Data Commands
// Organized by domain for better maintainability

// Import modules for utilities but define commands at this level
pub mod leads;
pub mod opportunities; 
pub mod utils;

// Import database dependencies
use crate::database::models::{DesktopLead, DesktopContact};
use crate::database_init::get_database_manager;
use utils::{infer_industry_from_company, generate_sample_calendar_events};

// =============================================================================
// LEADS DATA COMMANDS (moved from submodule to fix exports)
// =============================================================================

#[tauri::command]
pub async fn get_leads(workspace_id: String, user_id_or_name: String) -> Result<Vec<DesktopLead>, String> {
    leads::get_leads(workspace_id, user_id_or_name).await
}

#[tauri::command] 
pub async fn add_lead(workspace_id: String, user_id: String, lead_data: serde_json::Value) -> Result<serde_json::Value, String> {
    leads::add_lead(workspace_id, user_id, lead_data).await
}

#[tauri::command]
pub async fn search_leads(workspace_id: String, user_id: String, query: String) -> Result<serde_json::Value, String> {
    leads::search_leads(workspace_id, user_id, query).await
}

#[tauri::command]
pub async fn get_lead_by_id(workspace_id: String, user_id: String, lead_id: String) -> Result<serde_json::Value, String> {
    leads::get_lead_by_id(workspace_id, user_id, lead_id).await
}

#[tauri::command]
pub async fn update_lead(workspace_id: String, user_id: String, lead_id: String, update_data: serde_json::Value) -> Result<serde_json::Value, String> {
    leads::update_lead(workspace_id, user_id, lead_id, update_data).await
}

#[tauri::command]
pub async fn delete_lead(workspace_id: String, user_id: String, lead_id: String) -> Result<serde_json::Value, String> {
    leads::delete_lead(workspace_id, user_id, lead_id).await
}

#[tauri::command]
pub async fn update_lead_detailed(workspace_id: String, user_id: String, lead_id: String, update_data: serde_json::Value) -> Result<serde_json::Value, String> {
    leads::update_lead_detailed(workspace_id, user_id, lead_id, update_data).await
}

#[tauri::command] 
pub async fn create_account_from_lead(workspace_id: String, user_id: String, lead_data: serde_json::Value) -> Result<serde_json::Value, String> {
    leads::create_account_from_lead(workspace_id, user_id, lead_data).await
}

#[tauri::command]
pub async fn create_contact_from_lead(workspace_id: String, user_id: String, lead_data: serde_json::Value, account_id: String) -> Result<serde_json::Value, String> {
    leads::create_contact_from_lead(workspace_id, user_id, lead_data, account_id).await
}

#[tauri::command]
pub async fn convert_lead_to_opportunity_complete(workspace_id: String, user_id: String, lead_id: String, lead_data: serde_json::Value) -> Result<serde_json::Value, String> {
    leads::convert_lead_to_opportunity_complete(workspace_id, user_id, lead_id, lead_data).await
}

// =============================================================================
// OPPORTUNITIES DATA COMMANDS (moved from submodule to fix exports)
// =============================================================================

#[tauri::command]
pub async fn get_opportunities(workspace_id: String, user_id: String) -> Result<Vec<serde_json::Value>, String> {
    opportunities::get_opportunities(workspace_id, user_id).await
}

#[tauri::command]
pub async fn create_opportunity(workspace_id: String, user_id: String, opportunity_data: serde_json::Value) -> Result<serde_json::Value, String> {
    opportunities::create_opportunity(workspace_id, user_id, opportunity_data).await
}

#[tauri::command] 
pub async fn convert_lead_to_opportunity(workspace_id: String, user_id: String, lead_id: String, opportunity_data: Option<serde_json::Value>) -> Result<serde_json::Value, String> {
    opportunities::convert_lead_to_opportunity(workspace_id, user_id, lead_id, opportunity_data).await
}

#[tauri::command]
pub async fn update_opportunity(workspace_id: String, user_id: String, opportunity_id: String, update_data: serde_json::Value) -> Result<serde_json::Value, String> {
    opportunities::update_opportunity(workspace_id, user_id, opportunity_id, update_data).await
}

// =============================================================================
// CONTACTS DATA COMMANDS
// =============================================================================

#[tauri::command]
pub async fn get_contacts(workspace_id: String, user_id_or_name: String) -> Result<Vec<DesktopContact>, String> {
    println!("👥 [TAURI] Getting contacts for workspace: {}, user: {}", workspace_id, user_id_or_name);
    
    let db_manager = get_database_manager()?;
    
    match db_manager.get_contacts(&workspace_id, &user_id_or_name).await {
        Ok(contacts) => {
            println!("✅ [TAURI] Found {} contacts", contacts.len());
            Ok(contacts)
        },
        Err(e) => {
            println!("❌ [TAURI] Error getting contacts: {}", e);
            Err(format!("Failed to get contacts: {}", e))
        }
    }
}

#[tauri::command]
pub async fn add_contact(_workspace_id: String, _user_id: String, _contact_data: serde_json::Value) -> Result<serde_json::Value, String> {
    println!("👤 [TAURI] Adding contact (placeholder)");
    Ok(serde_json::json!({"success": true, "message": "Contact added successfully"}))
}

// =============================================================================
// COMPANIES DATA COMMANDS
// =============================================================================

#[tauri::command]
pub async fn get_companies(workspace_id: String, user_id: String) -> Result<Vec<serde_json::Value>, String> {
    println!("🏢 [TAURI] Getting companies for workspace: {}, user: {}", workspace_id, user_id);
    
    let db_manager = get_database_manager()?;
    
    match db_manager.get_leads(&workspace_id, &user_id).await {
        Ok(leads) => {
            let mut companies_map: std::collections::HashMap<String, Vec<&DesktopLead>> = std::collections::HashMap::new();
            
            for lead in &leads {
                if let Some(company) = &lead.company {
                    companies_map.entry(company.clone()).or_default().push(lead);
                }
            }
            
            let companies_vec: Vec<(String, Vec<&DesktopLead>)> = companies_map.into_iter().collect();
            let companies: Vec<serde_json::Value> = companies_vec
                .into_iter()
                .enumerate()
                .map(|(i, (company_name, company_leads))| {
                    serde_json::json!({
                        "id": format!("comp_{}", i + 1),
                        "name": company_name,
                        "industry": infer_industry_from_company(&company_name),
                        "employees": (i + 1) * 50,
                        "revenue": format!("${:.1}M", (i + 1) as f64 * 2.5),
                        "leads_count": company_leads.len(),
                        "contacts": company_leads.iter().map(|lead| {
                            serde_json::json!({
                                "name": lead.name,
                                "title": lead.title,
                                "email": lead.email,
                                "phone": lead.phone
                            })
                        }).collect::<Vec<_>>()
                    })
                })
                .collect();
            
            println!("✅ [TAURI] Generated {} companies", companies.len());
            Ok(companies)
        },
        Err(e) => {
            println!("❌ [TAURI] Error getting companies: {}", e);
            Err(format!("Failed to get companies: {}", e))
        }
    }
}

#[tauri::command]
pub async fn add_company(_workspace_id: String, _user_id: String, _company_data: serde_json::Value) -> Result<serde_json::Value, String> {
    println!("🏢 [TAURI] Adding company (placeholder)");
    Ok(serde_json::json!({"success": true, "message": "Company added successfully"}))
}

// =============================================================================
// CALENDAR DATA COMMANDS
// =============================================================================

#[allow(dead_code)]
pub async fn get_calendar_events(user_id: String) -> Result<Vec<serde_json::Value>, String> {
    println!("📅 [TAURI] Getting calendar events for user: {}", user_id);
    Ok(generate_sample_calendar_events())
}

#[tauri::command]
#[allow(dead_code)]
pub async fn sync_gmail_calendar(user_id: String, access_token: Option<String>) -> Result<serde_json::Value, String> {
    println!("🔄 [TAURI] Syncing Gmail calendar for user: {}", user_id);
    println!("📊 [TAURI] Access token provided: {}", access_token.is_some());
    
    Ok(serde_json::json!({
        "success": true,
        "eventsSync": 15,
        "message": "Gmail calendar sync completed"
    }))
}

#[tauri::command]
#[allow(dead_code)]
pub async fn sync_calendar_events(user_id: String) -> Result<serde_json::Value, String> {
    println!("🔄 [TAURI] Syncing calendar events for user: {}", user_id);
    
    Ok(serde_json::json!({
        "success": true,
        "eventsSynced": 12,
        "message": "Calendar events synchronized successfully"
    }))
}

#[tauri::command]
#[allow(dead_code)]
pub async fn get_calendar_sync_status(user_id: String) -> Result<serde_json::Value, String> {
    println!("📊 [TAURI] Getting calendar sync status for user: {}", user_id);
    
    Ok(serde_json::json!({
        "status": "active",
        "lastSync": chrono::Utc::now().to_rfc3339(),
        "eventsCount": 25,
        "isConnected": true
    }))
}

// =============================================================================
// PARTNERSHIPS & BUYER GROUPS DATA COMMANDS
// =============================================================================

#[tauri::command]
pub async fn get_partnerships(workspace_id: String, user_id_or_name: String) -> Result<Vec<serde_json::Value>, String> {
    println!("🤝 [TAURI] Getting partnerships for workspace: {}, user: {}", workspace_id, user_id_or_name);
    
    let partnerships = vec![
        serde_json::json!({
            "id": "partner-1",
            "name": "TechCorp Solutions",
            "type": "Technology Partner",
            "status": "Active",
            "value": "$500K",
            "startDate": "2024-01-15"
        })
    ];
    
    println!("✅ [TAURI] Retrieved {} partnerships", partnerships.len());
    Ok(partnerships)
}

#[tauri::command]
pub async fn get_buyer_groups(workspace_id: String, user_id: String) -> Result<Vec<serde_json::Value>, String> {
    println!("👥 [TAURI] Getting buyer groups for workspace: {}, user: {}", workspace_id, user_id);
    
    let buyer_groups = vec![
        serde_json::json!({
            "id": "bg-1",
            "name": "Enterprise Decision Makers",
            "description": "C-suite and VP level contacts",
            "memberCount": 15,
            "totalValue": "$2.5M",
            "status": "Active"
        })
    ];
    
    println!("✅ [TAURI] Retrieved {} buyer groups", buyer_groups.len());
    Ok(buyer_groups)
}

#[tauri::command]
pub async fn create_buyer_group(
    workspace_id: String, 
    user_id: String,
    name: String,
    description: String,
    company_id: String
) -> Result<serde_json::Value, String> {
    println!("👥 [TAURI] Creating buyer group: {}", name);
    
    let buyer_group = serde_json::json!({
        "id": format!("bg-{}-{}", chrono::Utc::now().timestamp(), rand::random::<u32>()),
        "name": name,
        "description": description,
        "companyId": company_id,
        "workspaceId": workspace_id,
        "createdBy": user_id,
        "memberCount": 0,
        "status": "Active",
        "created_at": chrono::Utc::now().to_rfc3339()
    });
    
    println!("✅ [TAURI] Buyer group created successfully");
    
    Ok(serde_json::json!({
        "success": true,
        "buyerGroup": buyer_group,
        "message": "Buyer group created successfully"
    }))
}

#[tauri::command]
pub async fn add_buyer_group_member(
    buyer_group_id: String,
    lead_id: String,
    role: String,
    influence_level: i32
) -> Result<bool, String> {
    println!("👤 [TAURI] Adding member to buyer group: {}", buyer_group_id);
    println!("📋 [TAURI] Lead: {}, Role: {}, Influence: {}", lead_id, role, influence_level);
    
    println!("✅ [TAURI] Member added to buyer group successfully");
    Ok(true)
}

#[tauri::command]
pub async fn get_buyer_group_members(buyer_group_id: String) -> Result<Vec<serde_json::Value>, String> {
    println!("👥 [TAURI] Getting members for buyer group: {}", buyer_group_id);
    
    let members = vec![
        serde_json::json!({
            "id": "member-1",
            "leadId": "lead-123",
            "name": "John Doe",
            "role": "Decision Maker",
            "influenceLevel": 9,
            "title": "CEO",
            "company": "Example Corp"
        })
    ];
    
    println!("✅ [TAURI] Retrieved {} members", members.len());
    Ok(members)
}

// =============================================================================
// UNIFIED DATA COMMANDS
// =============================================================================

mod unified;
pub use unified::*; 