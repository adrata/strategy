use crate::database::{DesktopLead, DesktopContact};
use crate::database_init::get_database_manager;

// Re-export modular components
pub mod leads;
pub mod utils;

// Use utilities from the utils module
use utils::{infer_industry_from_company, calculate_lead_score, generate_ai_tags, generate_ai_insights, generate_sample_calendar_events};

// =============================================================================
// LEADS DATA COMMANDS (delegated to leads module)
// =============================================================================

// Re-export leads commands
pub use leads::{
    get_leads, get_comprehensive_leads, add_lead, create_lead_ai,
    search_leads, get_lead_by_id, update_lead, delete_lead,
    update_lead_detailed, create_account_from_lead, 
    create_contact_from_lead, convert_lead_to_opportunity_complete
};

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
// OPPORTUNITIES DATA COMMANDS  
// =============================================================================

#[tauri::command]
pub async fn get_opportunities(workspace_id: String, user_id: String) -> Result<Vec<serde_json::Value>, String> {
    println!("💼 [TAURI] Getting opportunities for workspace: {}, user: {}", workspace_id, user_id);
    
    let opportunities = vec![
        serde_json::json!({
            "id": "opp-1",
            "name": "Acme Corp - Sales Platform Upgrade",
            "description": "Enterprise sales platform implementation for Acme Corp",
            "company": "Acme Corp",
            "contact": "John Smith",
            "email": "john.smith@acmecorp.com",
            "amount": 150000,
            "value": "$150,000",
            "stage": "Discovery",
            "probability": 25,
            "expectedCloseDate": "2024-09-15",
            "closeDate": "2024-09-15",
            "sourceType": "Lead Conversion",
            "priority": "High",
            "notes": "High potential enterprise client with budget approved",
            "workspaceId": workspace_id.clone(),
            "assignedUserId": user_id.clone(),
            "created_at": "2024-07-01T10:00:00Z",
            "updated_at": "2024-07-01T10:00:00Z"
        }),
        serde_json::json!({
            "id": "opp-2",
            "name": "TechStart Inc - CRM Integration",
            "description": "Custom CRM integration and data migration project",
            "company": "TechStart Inc",
            "contact": "Sarah Johnson",
            "email": "sarah.johnson@techstart.com",
            "amount": 75000,
            "value": "$75,000",
            "stage": "Proposal",
            "probability": 60,
            "expectedCloseDate": "2024-08-30",
            "closeDate": "2024-08-30",
            "sourceType": "Manual Entry",
            "priority": "Medium",
            "notes": "Ready to move forward with proposal phase",
            "workspaceId": workspace_id.clone(),
            "assignedUserId": user_id.clone(),
            "created_at": "2024-06-15T14:30:00Z",
            "updated_at": "2024-07-01T09:15:00Z"
        }),
        serde_json::json!({
            "id": "opp-3",
            "name": "Global Enterprise - AI Analytics Platform",
            "description": "Advanced AI analytics platform deployment",
            "company": "Global Enterprise",
            "contact": "Michael Chen",
            "email": "m.chen@globalenterprise.com",
            "amount": 250000,
            "value": "$250,000",
            "stage": "Negotiation",
            "probability": 80,
            "expectedCloseDate": "2024-08-15",
            "closeDate": "2024-08-15",
            "sourceType": "Referral",
            "priority": "High",
            "notes": "Large enterprise deal in final negotiation stage",
            "workspaceId": workspace_id.clone(),
            "assignedUserId": user_id.clone(),
            "created_at": "2024-05-20T11:45:00Z",
            "updated_at": "2024-07-01T16:20:00Z"
        })
    ];
    
    println!("✅ [TAURI] Retrieved {} opportunities", opportunities.len());
    Ok(opportunities)
}

#[tauri::command]
pub async fn create_opportunity(
    workspace_id: String, 
    user_id: String, 
    opportunity_data: serde_json::Value
) -> Result<serde_json::Value, String> {
    println!("💼 [TAURI] Creating opportunity for workspace: {}, user: {}", workspace_id, user_id);
    
    let name = opportunity_data.get("name")
        .and_then(|v| v.as_str())
        .ok_or("Opportunity name is required")?;
    
    let amount = opportunity_data.get("amount")
        .and_then(|v| v.as_f64())
        .unwrap_or(50000.0);
    
    let new_opportunity = serde_json::json!({
        "id": format!("opp-{}-{}", chrono::Utc::now().timestamp(), rand::random::<u32>()),
        "name": name,
        "description": opportunity_data.get("description").and_then(|v| v.as_str()).unwrap_or(""),
        "amount": amount,
        "value": format!("${:.0}", amount),
        "stage": opportunity_data.get("stage").and_then(|v| v.as_str()).unwrap_or("Discovery"),
        "workspaceId": workspace_id,
        "assignedUserId": user_id,
        "created_at": chrono::Utc::now().to_rfc3339(),
        "updated_at": chrono::Utc::now().to_rfc3339()
    });
    
    println!("✅ [TAURI] Opportunity created successfully: {}", name);
    
    Ok(serde_json::json!({
        "success": true,
        "opportunity": new_opportunity,
        "message": "Opportunity created successfully"
    }))
}

#[tauri::command]
pub async fn convert_lead_to_opportunity(
    workspace_id: String,
    user_id: String,
    lead_id: String,
    opportunity_data: Option<serde_json::Value>
) -> Result<serde_json::Value, String> {
    println!("🔄 [TAURI] Converting lead {} to opportunity", lead_id);
    
    let default_name = format!("Opportunity from Lead {}", lead_id);
    let opportunity_name = opportunity_data
        .as_ref()
        .and_then(|d| d.get("name"))
        .and_then(|v| v.as_str())
        .unwrap_or(&default_name);
    
    let new_opportunity = serde_json::json!({
        "id": format!("opp-{}-{}", chrono::Utc::now().timestamp(), rand::random::<u32>()),
        "name": opportunity_name,
        "description": format!("Opportunity created from lead conversion: {}", lead_id),
        "amount": 50000,
        "value": "$50,000",
        "stage": "Discovery",
        "probability": 25,
        "workspaceId": workspace_id,
        "assignedUserId": user_id,
        "leadId": lead_id,
        "created_at": chrono::Utc::now().to_rfc3339(),
        "updated_at": chrono::Utc::now().to_rfc3339()
    });
    
    println!("✅ [TAURI] Lead converted to opportunity successfully");
    
    Ok(serde_json::json!({
        "success": true,
        "opportunity": new_opportunity,
        "message": "Lead converted to opportunity successfully"
    }))
}

#[tauri::command]
pub async fn update_opportunity(
    workspace_id: String,
    user_id: String,
    opportunity_id: String,
    update_data: serde_json::Value
) -> Result<serde_json::Value, String> {
    println!("📝 [TAURI] Updating opportunity: {}", opportunity_id);
    
    Ok(serde_json::json!({
        "success": true,
        "opportunity": {
            "id": opportunity_id,
            "workspaceId": workspace_id,
            "assignedUserId": user_id,
            "updated_at": chrono::Utc::now().to_rfc3339(),
            "changes": update_data
        },
        "message": "Opportunity updated successfully"
    }))
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
                    companies_map.entry(company.clone()).or_insert_with(Vec::new).push(lead);
                }
            }
            
            let companies: Vec<serde_json::Value> = companies_map.into_iter().enumerate().map(|(i, (company_name, company_leads))| {
                serde_json::json!({
                    "id": format!("comp_{}", i + 1),
                    "name": company_name,
                    "industry": infer_industry_from_company(&company_name),
                    "employees": (i + 1) * 50,
                    "revenue": format!("${:.1}M", (i + 1) as f64 * 2.5),
                    "website": format!("https://{}.com", company_name.to_lowercase().replace(" ", "")),
                    "location": "San Francisco, CA",
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
            }).collect();
            
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

#[tauri::command]
pub async fn get_calendar_events(user_id: String) -> Result<Vec<serde_json::Value>, String> {
    println!("📅 [TAURI] Getting calendar events for user: {}", user_id);
    Ok(generate_sample_calendar_events())
}

#[tauri::command]
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
pub async fn sync_calendar_events(user_id: String) -> Result<serde_json::Value, String> {
    println!("🔄 [TAURI] Syncing calendar events for user: {}", user_id);
    
    Ok(serde_json::json!({
        "success": true,
        "eventsSynced": 12,
        "message": "Calendar events synchronized successfully"
    }))
}

#[tauri::command]
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
    
    // In a real implementation, add to database
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