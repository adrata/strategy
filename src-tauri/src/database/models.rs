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

// CRM Models
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

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DesktopLead {
    pub id: String,
    pub name: String,
    pub title: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub company: Option<String>,
    pub status: String,
    pub source: Option<String>,
    pub notes: Option<String>,
    pub last_action_date: Option<String>,
    pub next_action_date: Option<String>,
    pub value: Option<String>,
    pub probability: Option<i32>,
    pub assigned_to: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub needs_sync: bool,
    pub last_sync_at: Option<String>,
    pub cloud_updated_at: Option<String>,
    #[serde(rename = "buyerGroupRole")]
    pub buyer_group_role: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DesktopContact {
    pub id: String,
    pub name: String,
    pub title: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub company: Option<String>,
    pub department: Option<String>,
    pub location: Option<String>,
    pub notes: Option<String>,
    pub relationship: Option<String>,
    pub linkedin_url: Option<String>,
    pub account_id: Option<String>,
    pub assigned_to: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub needs_sync: bool,
    pub last_sync_at: Option<String>,
    pub cloud_updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DesktopAccount {
    pub id: String,
    pub name: String,
    pub website: Option<String>,
    pub industry: Option<String>,
    pub size: Option<String>,
    pub revenue: Option<String>,
    pub employees: Option<i32>,
    pub description: Option<String>,
    pub headquarters: Option<String>,
    pub account_status: String,
    pub primary_contact_id: Option<String>,
    pub owner_id: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub needs_sync: bool,
    pub last_sync_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DesktopOpportunity {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub amount: Option<f64>,
    pub expected_close_date: Option<String>,
    pub probability: i32,
    pub stage: String,
    pub primary_contact_id: Option<String>,
    pub account_id: Option<String>,
    pub owner_id: Option<String>,
    pub engagement_score: f64,
    pub risk_score: f64,
    pub next_best_action: Option<String>,
    pub action_priority: String,
    pub created_at: String,
    pub updated_at: String,
    pub needs_sync: bool,
    pub last_sync_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DesktopPerson {
    pub id: String,
    pub full_name: String,
    pub first_name: String,
    pub last_name: String,
    pub email: Option<String>,
    pub title: Option<String>,
    pub company: Option<String>,
    pub department: Option<String>,
    pub linkedin_url: Option<String>,
    pub phone: Option<String>,
    pub location: Option<String>,
    pub seniority: Option<String>,
    pub is_verified: bool,
    pub created_at: String,
    pub updated_at: String,
    pub needs_sync: bool,
    pub last_sync_at: Option<String>,
}

// Speedrun Models
#[derive(Debug, Clone)]
pub struct DesktopSpeedrunSettings {
    pub id: String,
    pub user_id: String,
    pub weekly_target: i32,
    pub strategy: String,
    pub role: String,
    pub quota: Option<i32>,
    pub pipeline_health: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub needs_sync: bool,
}

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