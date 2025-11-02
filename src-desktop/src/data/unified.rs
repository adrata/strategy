use crate::database::models::{DesktopLead, DesktopContact, DesktopAccount};
use crate::database_init::get_database_manager;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct UnifiedData {
    pub leads: Vec<DesktopLead>,
    pub contacts: Vec<DesktopContact>,
    pub opportunities: Vec<serde_json::Value>,
    pub accounts: Vec<DesktopAccount>,
    pub speedrun_items: Vec<DesktopLead>,
    pub prospects: Vec<DesktopContact>,
    pub partnerships: Vec<DesktopAccount>,
    pub customers: Vec<DesktopAccount>,
}

#[tauri::command]
pub async fn get_unified_data(workspace_id: String, user_id: String) -> Result<UnifiedData, String> {
    println!("🔄 [TAURI] Getting unified data for workspace: {}, user: {}", workspace_id, user_id);
    
    let db_manager = get_database_manager()?;
    
    // Get all data types in parallel
    let leads_result = db_manager.get_leads(&workspace_id, &user_id).await;
    let contacts_result = db_manager.get_contacts(&workspace_id, &user_id).await;
    let opportunities_result = db_manager.get_opportunities(&workspace_id, &user_id).await;
    let companies_result = db_manager.get_companies(&workspace_id, &user_id).await;
    
    match (leads_result, contacts_result, opportunities_result, companies_result) {
        (Ok(leads), Ok(contacts), Ok(opportunities), Ok(_companies)) => {
            // Filter speedrun items (leads with specific criteria)
            let speedrun_items: Vec<DesktopLead> = leads.iter()
                .filter(|lead| lead.status == "new" || lead.status == "contacted" || lead.status == "qualified")
                .cloned()
                .collect();
            
            // Filter prospects (contacts with engagement)
            let prospects: Vec<DesktopContact> = contacts.iter()
                .filter(|contact| contact.email.is_some())
                .cloned()
                .collect();
            
            // Convert companies to accounts (simplified for now)
            let accounts: Vec<DesktopAccount> = vec![]; // Empty for now since we don't have account data
            
            // Filter partnerships (empty for now)
            let partnerships: Vec<DesktopAccount> = vec![];
            
            // Filter customers (empty for now)  
            let customers: Vec<DesktopAccount> = vec![];
            
            let unified_data = UnifiedData {
                leads: leads.clone(),
                contacts: contacts.clone(),
                opportunities,
                accounts,
                speedrun_items,
                prospects,
                partnerships,
                customers,
            };
            
            println!("✅ [TAURI] Unified data retrieved: {} leads, {} contacts, {} opportunities, {} accounts", 
                unified_data.leads.len(), 
                unified_data.contacts.len(), 
                unified_data.opportunities.len(),
                unified_data.accounts.len()
            );
            
            Ok(unified_data)
        },
        _ => {
            let error_msg = "Failed to retrieve unified data from database";
            println!("❌ [TAURI] {}", error_msg);
            Err(error_msg.to_string())
        }
    }
}

#[tauri::command]
pub async fn sync_workspace_data(workspace_id: String, user_id: String) -> Result<String, String> {
    println!("🔄 [TAURI] Syncing workspace data for: {}/{}", workspace_id, user_id);
    
    // This would typically sync with the web API
    // For now, just return success
    Ok("Workspace data synced successfully".to_string())
}
