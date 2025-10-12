use sqlx::{PgPool, SqlitePool};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;

// Authentication Models
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AuthWorkspace {
    pub id: String,
    pub name: String,
    pub role: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AuthUser {
    pub id: String,
    pub name: String,
    pub email: String,
    pub workspaces: Vec<AuthWorkspace>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AuthUserRow {
    pub id: String,
    pub name: String,
    pub email: String,
    pub password: Option<String>,
    pub workspace_id: Option<String>,
    pub workspace_name: Option<String>,
    pub workspace_role: Option<String>,
}

// CRM Models - Updated for streamlined schema
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DesktopUser {
    pub id: String,
    pub name: String,
    pub email: String,
    pub workspace_id: String,
    pub workspace_name: String,
    pub is_active: bool,
    pub created_at: String,
    pub updated_at: String,
    pub last_sync_at: Option<String>,
}

// Updated to match people table in streamlined schema
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DesktopLead {
    pub id: String,
    pub full_name: String,
    pub first_name: String,
    pub last_name: String,
    pub job_title: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub company: Option<String>,
    pub company_id: Option<String>,
    pub status: String, // PersonStatus enum
    pub priority: Option<String>, // PersonPriority enum
    pub source: Option<String>,
    pub notes: Option<String>,
    pub last_action_date: Option<String>,
    pub next_action_date: Option<String>,
    pub assigned_user_id: Option<String>,
    pub workspace_id: String,
    pub created_at: String,
    pub updated_at: String,
    pub needs_sync: bool,
    pub last_sync_at: Option<String>,
    pub cloud_updated_at: Option<String>,
    pub buyer_group_role: Option<String>,
    pub buyer_group_confidence: Option<f64>,
    pub influence_score: Option<f64>,
}

// DesktopContact is now the same as DesktopLead (both map to people table)
pub type DesktopContact = DesktopLead;

// Updated to match companies table in streamlined schema
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DesktopAccount {
    pub id: String,
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
    pub status: Option<String>, // CompanyStatus enum
    pub priority: Option<String>, // CompanyPriority enum
    pub assigned_user_id: Option<String>,
    pub workspace_id: String,
    pub created_at: String,
    pub updated_at: String,
    pub needs_sync: bool,
    pub last_sync_at: Option<String>,
}

// DesktopOpportunity maps to actions table in streamlined schema
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DesktopOpportunity {
    pub id: String,
    pub subject: String,
    pub description: Option<String>,
    pub outcome: Option<String>,
    pub scheduled_at: Option<String>,
    pub completed_at: Option<String>,
    pub status: String, // ActionStatus enum
    pub priority: String, // ActionPriority enum
    pub person_id: Option<String>,
    pub company_id: Option<String>,
    pub user_id: String,
    pub workspace_id: String,
    pub created_at: String,
    pub updated_at: String,
    pub needs_sync: bool,
    pub last_sync_at: Option<String>,
}

// DesktopPerson is now the same as DesktopLead (both map to people table)
pub type DesktopPerson = DesktopLead;

// Speedrun Models - Removed DesktopSpeedrunSettings as OutboxSettings table doesn't exist in streamlined schema
// Speedrun functionality will be handled through the people and actions tables

// Enrichment Models
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DesktopEnrichmentExecution {
    pub id: String,
    pub execution_id: String,
    pub trigger_type: String,
    pub status: String,
    pub current_step: i32,
    pub total_steps: i32,
    pub completed_companies: i32,
    pub total_companies: i32,
    pub start_time: String,
    pub end_time: Option<String>,
    pub workspace_id: String,
    pub user_id: String,
    pub results: String, // JSON
    pub created_at: String,
    pub updated_at: String,
}

// External API Models
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OpenAIResult {
    pub request_id: String,
    pub prompt: String,
    pub response: String,
    pub model_used: String,
    pub tokens_used: i32,
    pub cost: f64,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BrightDataResult {
    pub request_id: String,
    pub query_type: String,
    pub query_params: String,
    pub result_count: i32,
    pub data: String, // JSON
    pub cost: f64,
    pub created_at: String,
}

// Database Connection Types
pub enum DatabaseConnection {
    Production { postgres: PgPool, sqlite: Option<SqlitePool> },
    _Hybrid { sqlite: SqlitePool },
}

#[derive(Clone)]
pub struct HybridDatabaseManager {
    pub connection: Arc<RwLock<DatabaseConnection>>,
}

pub type DatabaseState = Arc<std::sync::Mutex<Option<HybridDatabaseManager>>>; 