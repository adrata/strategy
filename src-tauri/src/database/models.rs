use sqlx::{PgPool, SqlitePool, FromRow};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;
use chrono::{DateTime, Utc};

// ====================================================================
// CORE AUTHENTICATION & WORKSPACE MODELS
// ====================================================================

#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct Workspace {
    pub id: String,
    pub name: String,
    pub slug: String,
    pub timezone: String,
    pub description: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub is_active: bool,
    pub deleted_at: Option<String>,
    pub business_model: Option<String>,
    pub competitive_advantages: Option<String>, // JSON array
    pub ideal_customer_profile: Option<String>,
    pub industry: Option<String>,
    pub product_portfolio: Option<String>, // JSON array
    pub sales_methodology: Option<String>,
    pub service_offerings: Option<String>, // JSON array
    pub target_company_size: Option<String>, // JSON array
    pub target_industries: Option<String>, // JSON array
    pub value_propositions: Option<String>, // JSON array
    pub speedrun_daily_target: Option<i32>,
    pub speedrun_weekly_target: Option<i32>,
    pub news_enabled: Option<bool>,
    pub news_industries: Option<String>, // JSON array
    pub news_sources: Option<String>, // JSON array
    // Sync metadata
    pub last_synced_at: Option<String>,
    pub sync_version: i32,
    pub is_dirty: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct User {
    pub id: String,
    pub email: String,
    pub password: Option<String>,
    pub name: String,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub timezone: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub last_login_at: Option<String>,
    pub is_active: bool,
    pub active_workspace_id: Option<String>,
    pub username: Option<String>,
    pub speedrun_ranking_mode: Option<String>,
    // Sync metadata
    pub last_synced_at: Option<String>,
    pub sync_version: i32,
    pub is_dirty: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct WorkspaceUser {
    pub id: String,
    pub workspace_id: String,
    pub user_id: String,
    pub role: String, // SUPER_ADMIN, WORKSPACE_ADMIN, MANAGER, SELLER, VIEWER
    pub created_at: String,
    pub updated_at: String,
    pub is_active: bool,
    pub joined_at: String,
    // Sync metadata
    pub last_synced_at: Option<String>,
    pub sync_version: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct AuthSession {
    pub id: String,
    pub user_id: String,
    pub workspace_id: String,
    pub token: String,
    pub refresh_token: String,
    pub expires_at: String,
    pub created_at: String,
    pub last_accessed_at: String,
    pub is_active: bool,
}

// ====================================================================
// RBAC MODELS
// ====================================================================

#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct Role {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub is_active: bool,
    pub created_at: String,
    pub updated_at: String,
    // Sync metadata
    pub last_synced_at: Option<String>,
    pub sync_version: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct Permission {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub resource: String,
    pub action: String,
    pub is_active: bool,
    pub created_at: String,
    pub updated_at: String,
    // Sync metadata
    pub last_synced_at: Option<String>,
    pub sync_version: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct RolePermission {
    pub id: String,
    pub role_id: String,
    pub permission_id: String,
    pub created_at: String,
    // Sync metadata
    pub last_synced_at: Option<String>,
    pub sync_version: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct UserRole {
    pub id: String,
    pub user_id: String,
    pub role_id: String,
    pub workspace_id: Option<String>,
    pub is_active: bool,
    pub assigned_at: String,
    pub assigned_by: Option<String>,
    pub expires_at: Option<String>,
    // Sync metadata
    pub last_synced_at: Option<String>,
    pub sync_version: i32,
}

// ====================================================================
// CORE CRM MODELS
// ====================================================================

#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct Company {
    pub id: String,
    pub workspace_id: String,
    pub name: String,
    pub legal_name: Option<String>,
    pub trading_name: Option<String>,
    pub local_name: Option<String>,
    pub description: Option<String>,
    pub website: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub fax: Option<String>,
    pub address: Option<String>,
    pub city: Option<String>,
    pub state: Option<String>,
    pub country: Option<String>,
    pub postal_code: Option<String>,
    pub industry: Option<String>,
    pub sector: Option<String>,
    pub size: Option<String>,
    pub revenue: Option<f64>,
    pub currency: Option<String>,
    pub employee_count: Option<i32>,
    pub founded_year: Option<i32>,
    pub registration_number: Option<String>,
    pub tax_id: Option<String>,
    pub vat_number: Option<String>,
    pub domain: Option<String>,
    pub logo_url: Option<String>,
    pub status: Option<String>, // ACTIVE, INACTIVE, PROSPECT, CLIENT, OPPORTUNITY
    pub priority: Option<String>, // LOW, MEDIUM, HIGH
    pub tags: Option<String>, // JSON array
    pub custom_fields: Option<String>, // JSON object
    pub notes: Option<String>,
    pub last_action: Option<String>,
    pub last_action_date: Option<String>,
    pub next_action: Option<String>,
    pub next_action_date: Option<String>,
    pub action_status: Option<String>,
    pub global_rank: Option<i32>,
    pub created_at: String,
    pub updated_at: String,
    pub entity_id: Option<String>,
    pub deleted_at: Option<String>,
    pub main_seller_id: Option<String>,
    // Opportunity fields (embedded)
    pub actual_close_date: Option<String>,
    pub expected_close_date: Option<String>,
    pub opportunity_amount: Option<f64>,
    pub opportunity_probability: Option<f64>,
    pub opportunity_stage: Option<String>,
    // Intelligence fields
    pub acquisition_date: Option<String>,
    pub active_job_postings: Option<i32>,
    pub business_challenges: Option<String>, // JSON array
    pub business_priorities: Option<String>, // JSON array
    pub company_intelligence: Option<String>, // JSON object
    pub company_updates: Option<String>, // JSON object
    pub competitive_advantages: Option<String>, // JSON array
    pub competitors: Option<String>, // JSON array
    pub confidence: Option<f64>,
    pub decision_timeline: Option<String>,
    pub digital_maturity: Option<i32>,
    pub facebook_url: Option<String>,
    pub github_url: Option<String>,
    pub growth_opportunities: Option<String>, // JSON array
    pub hq_city: Option<String>,
    pub hq_country_iso2: Option<String>,
    pub hq_country_iso3: Option<String>,
    pub hq_full_address: Option<String>,
    pub hq_location: Option<String>,
    pub hq_region: Option<String>, // JSON array
    pub hq_state: Option<String>,
    pub hq_street: Option<String>,
    pub hq_zipcode: Option<String>,
    pub instagram_url: Option<String>,
    pub is_public: Option<bool>,
    pub key_influencers: Option<String>,
    pub last_funding_amount: Option<i64>,
    pub last_funding_date: Option<String>,
    pub last_verified: Option<String>,
    pub linkedin_followers: Option<i32>,
    pub linkedin_url: Option<String>,
    pub market_position: Option<String>,
    pub market_threats: Option<String>, // JSON array
    pub naics_codes: Option<String>, // JSON array
    pub num_technologies_used: Option<i32>,
    pub parent_company_domain: Option<String>,
    pub parent_company_name: Option<String>,
    pub sic_codes: Option<String>, // JSON array
    pub sources: Option<String>, // JSON array
    pub stock_symbol: Option<String>,
    pub strategic_initiatives: Option<String>, // JSON array
    pub success_metrics: Option<String>, // JSON array
    pub tech_stack: Option<String>, // JSON array
    pub technologies_used: Option<String>, // JSON array
    pub twitter_followers: Option<i32>,
    pub twitter_url: Option<String>,
    pub youtube_url: Option<String>,
    pub next_action_reasoning: Option<String>,
    pub next_action_priority: Option<String>,
    pub next_action_type: Option<String>,
    pub next_action_updated_at: Option<String>,
    // AI/Data Quality fields
    pub acquisition_history: Option<String>, // JSON object
    pub ai_confidence: Option<f64>,
    pub ai_intelligence: Option<String>, // JSON object
    pub ai_last_updated: Option<String>,
    pub data_last_verified: Option<String>,
    pub data_quality_breakdown: Option<String>, // JSON object
    pub data_quality_score: Option<f64>,
    pub data_sources: Option<String>, // JSON array
    pub employee_count_change: Option<String>, // JSON object
    pub employee_reviews_score: Option<String>, // JSON object
    pub executive_arrivals: Option<String>, // JSON object
    pub executive_departures: Option<String>, // JSON object
    pub funding_rounds: Option<String>, // JSON object
    pub job_postings_change: Option<String>, // JSON object
    pub product_reviews_score: Option<String>, // JSON object
    pub revenue_range: Option<String>, // JSON object
    // Sync metadata
    pub last_synced_at: Option<String>,
    pub sync_version: i32,
    pub is_dirty: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct Person {
    pub id: String,
    pub workspace_id: String,
    pub company_id: Option<String>,
    pub first_name: String,
    pub last_name: String,
    pub full_name: String,
    pub display_name: Option<String>,
    pub salutation: Option<String>,
    pub suffix: Option<String>,
    pub job_title: Option<String>,
    pub title: Option<String>,
    pub department: Option<String>,
    pub seniority: Option<String>,
    pub email: Option<String>,
    pub work_email: Option<String>,
    pub personal_email: Option<String>,
    pub phone: Option<String>,
    pub mobile_phone: Option<String>,
    pub work_phone: Option<String>,
    pub linkedin_url: Option<String>,
    pub address: Option<String>,
    pub city: Option<String>,
    pub state: Option<String>,
    pub country: Option<String>,
    pub postal_code: Option<String>,
    pub date_of_birth: Option<String>,
    pub gender: Option<String>,
    pub bio: Option<String>,
    pub profile_picture_url: Option<String>,
    pub status: Option<String>, // LEAD, PROSPECT, OPPORTUNITY, CLIENT, SUPERFAN
    pub priority: Option<String>, // LOW, MEDIUM, HIGH
    pub source: Option<String>,
    pub tags: Option<String>, // JSON array
    pub custom_fields: Option<String>, // JSON object
    pub notes: Option<String>,
    pub preferred_language: Option<String>,
    pub timezone: Option<String>,
    pub email_verified: Option<bool>,
    pub phone_verified: Option<bool>,
    pub last_action: Option<String>,
    pub last_action_date: Option<String>,
    pub next_action: Option<String>,
    pub next_action_date: Option<String>,
    pub action_status: Option<String>,
    pub engagement_score: Option<f64>,
    pub global_rank: Option<i32>,
    pub company_rank: Option<i32>,
    pub created_at: String,
    pub updated_at: String,
    pub entity_id: Option<String>,
    pub deleted_at: Option<String>,
    pub main_seller_id: Option<String>,
    pub vertical: Option<String>,
    // Enrichment fields
    pub achievements: Option<String>, // JSON array
    pub budget_responsibility: Option<String>,
    pub buyer_group_optimized: Option<bool>,
    pub buyer_group_role: Option<String>,
    pub buyer_group_status: Option<String>,
    pub career_timeline: Option<String>, // JSON object
    pub certifications: Option<String>, // JSON array
    pub communication_style: Option<String>,
    pub coresignal_data: Option<String>, // JSON object
    pub current_company: Option<String>,
    pub current_role: Option<String>,
    pub data_completeness: Option<f64>,
    pub decision_making: Option<String>,
    pub decision_power: Option<i32>,
    pub degrees: Option<String>, // JSON object
    pub email_confidence: Option<f64>,
    pub engagement_level: Option<String>,
    pub engagement_strategy: Option<String>,
    pub enriched_data: Option<String>, // JSON object
    pub enrichment_score: Option<f64>,
    pub enrichment_sources: Option<String>, // JSON array
    pub enrichment_version: Option<String>,
    pub fields_of_study: Option<String>, // JSON array
    pub graduation_years: Option<String>, // JSON array
    pub hidden_from_sections: Option<String>, // JSON array
    pub industry_experience: Option<String>,
    pub industry_skills: Option<String>, // JSON array
    pub influence_level: Option<String>,
    pub influence_score: Option<f64>,
    pub institutions: Option<String>, // JSON array
    pub is_buyer_group_member: Option<bool>,
    pub languages: Option<String>, // JSON array
    pub last_enriched: Option<String>,
    pub leadership_experience: Option<String>,
    pub mobile_verified: Option<bool>,
    pub phone_confidence: Option<f64>,
    pub preferred_contact: Option<String>,
    pub previous_roles: Option<String>, // JSON object
    pub publications: Option<String>, // JSON array
    pub response_time: Option<String>,
    pub role_history: Option<String>, // JSON object
    pub role_promoted: Option<String>, // JSON object
    pub soft_skills: Option<String>, // JSON array
    pub speaking_engagements: Option<String>, // JSON array
    pub status_reason: Option<String>,
    pub status_update_date: Option<String>,
    pub team_size: Option<String>,
    pub technical_skills: Option<String>, // JSON array
    pub total_experience: Option<i32>,
    pub years_at_company: Option<i32>,
    pub years_in_role: Option<i32>,
    pub next_action_priority: Option<String>,
    pub next_action_reasoning: Option<String>,
    pub next_action_type: Option<String>,
    pub next_action_updated_at: Option<String>,
    pub linkedin_connection_date: Option<String>,
    pub linkedin_navigator_url: Option<String>,
    pub decision_power_score: Option<i32>,
    pub years_experience: Option<i32>,
    // AI/Data Quality fields
    pub ai_confidence: Option<f64>,
    pub ai_intelligence: Option<String>, // JSON object
    pub ai_last_updated: Option<String>,
    pub data_last_verified: Option<String>,
    pub data_quality_breakdown: Option<String>, // JSON object
    pub data_quality_score: Option<f64>,
    pub data_sources: Option<String>, // JSON array
    pub email_quality_grade: Option<String>,
    pub linkedin_connections: Option<i32>,
    pub linkedin_followers: Option<i32>,
    pub phone_quality_score: Option<f64>,
    pub salary_projections: Option<String>, // JSON object
    pub total_experience_months: Option<i32>,
    // Sync metadata
    pub last_synced_at: Option<String>,
    pub sync_version: i32,
    pub is_dirty: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct PersonCoSeller {
    pub id: String,
    pub person_id: String,
    pub user_id: String,
    pub created_at: String,
    // Sync metadata
    pub last_synced_at: Option<String>,
    pub sync_version: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct Action {
    pub id: String,
    pub workspace_id: String,
    pub user_id: String,
    pub company_id: Option<String>,
    pub person_id: Option<String>,
    pub type_: String, // CALL, EMAIL, MEETING, TASK, NOTE, etc.
    pub subject: String,
    pub description: Option<String>,
    pub outcome: Option<String>,
    pub scheduled_at: Option<String>,
    pub completed_at: Option<String>,
    pub status: String, // PLANNED, IN_PROGRESS, COMPLETED, CANCELLED
    pub priority: String, // LOW, NORMAL, HIGH, URGENT
    pub created_at: String,
    pub updated_at: String,
    pub deleted_at: Option<String>,
    // Sync metadata
    pub last_synced_at: Option<String>,
    pub sync_version: i32,
    pub is_dirty: bool,
}

// ====================================================================
// INTELLIGENCE & ENRICHMENT MODELS
// ====================================================================

#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct ResearchData {
    pub id: String,
    pub workspace_id: String,
    pub entity_type: String, // COMPANY, PERSON, etc.
    pub entity_id: String,
    pub research_type: String,
    pub content: Option<String>,
    pub sources: Option<String>, // JSON object
    pub extracted_data: Option<String>, // JSON object
    pub confidence: Option<f64>,
    pub model: Option<String>,
    pub tokens_used: Option<i32>,
    pub processing_time: Option<i32>,
    pub cost: Option<f64>,
    pub created_at: String,
    pub updated_at: String,
    pub expires_at: Option<String>,
    // Sync metadata
    pub last_synced_at: Option<String>,
    pub sync_version: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct ApiCostTracking {
    pub id: String,
    pub workspace_id: String,
    pub user_id: Option<String>,
    pub api_provider: String,
    pub endpoint: Option<String>,
    pub operation: Option<String>,
    pub cost: f64,
    pub tokens_used: Option<i32>,
    pub entity_type: Option<String>,
    pub entity_id: Option<String>,
    pub request_data: Option<String>, // JSON object
    pub success: bool,
    pub error_message: Option<String>,
    pub created_at: String,
    // Sync metadata
    pub last_synced_at: Option<String>,
    pub sync_version: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct AiConversation {
    pub id: String,
    pub workspace_id: String,
    pub user_id: String,
    pub title: String,
    pub last_activity: String,
    pub is_active: bool,
    pub welcome_message: Option<String>,
    pub metadata: Option<String>, // JSON object
    pub created_at: String,
    pub updated_at: String,
    pub deleted_at: Option<String>,
    // Sync metadata
    pub last_synced_at: Option<String>,
    pub sync_version: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct AiMessage {
    pub id: String,
    pub conversation_id: String,
    pub type_: String, // USER, ASSISTANT
    pub content: String,
    pub metadata: Option<String>, // JSON object
    pub created_at: String,
    // Sync metadata
    pub last_synced_at: Option<String>,
    pub sync_version: i32,
}

// ====================================================================
// CHRONICLE & METRICS MODELS
// ====================================================================

#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct ChronicleReport {
    pub id: String,
    pub workspace_id: String,
    pub title: String,
    pub report_date: String,
    pub report_type: String, // MONDAY_PREP, FRIDAY_RECAP
    pub content: String, // JSON object
    pub created_at: String,
    pub updated_at: String,
    pub created_by: String,
    pub deleted_at: Option<String>,
    // Sync metadata
    pub last_synced_at: Option<String>,
    pub sync_version: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct ChronicleShare {
    pub id: String,
    pub report_id: String,
    pub share_token: String,
    pub share_url: String,
    pub view_count: i32,
    pub created_at: String,
    pub expires_at: Option<String>,
    pub allowed_emails: Option<String>, // JSON array
    // Sync metadata
    pub last_synced_at: Option<String>,
    pub sync_version: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct BuyerGroup {
    pub id: String,
    pub company_name: String,
    pub website: Option<String>,
    pub industry: Option<String>,
    pub company_size: Option<String>,
    pub workspace_id: Option<String>,
    pub cohesion_score: Option<f64>,
    pub overall_confidence: Option<f64>,
    pub total_members: i32,
    pub processing_time: i32,
    pub metadata: Option<String>, // JSON object
    pub created_at: String,
    pub updated_at: String,
    // Sync metadata
    pub last_synced_at: Option<String>,
    pub sync_version: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct BuyerGroupMember {
    pub id: String,
    pub buyer_group_id: String,
    pub name: String,
    pub title: Option<String>,
    pub role: String, // decision, champion, stakeholder, blocker, introducer
    pub email: Option<String>,
    pub phone: Option<String>,
    pub linkedin: Option<String>,
    pub confidence: Option<f64>,
    pub influence_score: Option<f64>,
    pub created_at: String,
    pub updated_at: String,
    // Sync metadata
    pub last_synced_at: Option<String>,
    pub sync_version: i32,
}

// ====================================================================
// AUDIT & COMPLIANCE MODELS
// ====================================================================

#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct AuditLog {
    pub id: String,
    pub workspace_id: String,
    pub user_id: String,
    pub entity_type: String,
    pub entity_id: String,
    pub action: String,
    pub old_values: Option<String>, // JSON object
    pub new_values: Option<String>, // JSON object
    pub timestamp: String,
    pub success: bool,
    // Sync metadata
    pub last_synced_at: Option<String>,
    pub sync_version: i32,
}

// ====================================================================
// EMAIL & COMMUNICATION MODELS
// ====================================================================

#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct EmailMessage {
    pub id: String,
    pub workspace_id: String,
    pub provider: String,
    pub message_id: String,
    pub thread_id: Option<String>,
    pub subject: String,
    pub body: String,
    pub body_html: Option<String>,
    pub from_address: String,
    pub to_addresses: Option<String>, // JSON array
    pub cc_addresses: Option<String>, // JSON array
    pub bcc_addresses: Option<String>, // JSON array
    pub sent_at: String,
    pub received_at: String,
    pub is_read: bool,
    pub is_important: bool,
    pub attachments: Option<String>, // JSON object
    pub labels: Option<String>, // JSON array
    pub company_id: Option<String>,
    pub person_id: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    // Sync metadata
    pub last_synced_at: Option<String>,
    pub sync_version: i32,
}

// ====================================================================
// SYNC ENGINE MODELS
// ====================================================================

#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct SyncQueue {
    pub id: i64,
    pub table_name: String,
    pub record_id: String,
    pub operation: String, // INSERT, UPDATE, DELETE
    pub data: Option<String>, // JSON object with change data
    pub created_at: String,
    pub synced_at: Option<String>,
    pub error_message: Option<String>,
    pub retry_count: i32,
    pub status: String, // PENDING, IN_PROGRESS, COMPLETED, FAILED
}

#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct SyncStatus {
    pub id: i64,
    pub table_name: String,
    pub last_full_sync: Option<String>,
    pub last_incremental_sync: Option<String>,
    pub last_push_sync: Option<String>,
    pub total_records: i32,
    pub synced_records: i32,
    pub pending_records: i32,
    pub failed_records: i32,
    pub sync_version: i32,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct SyncConflict {
    pub id: i64,
    pub table_name: String,
    pub record_id: String,
    pub local_version: i32,
    pub remote_version: i32,
    pub local_data: Option<String>, // JSON object
    pub remote_data: Option<String>, // JSON object
    pub resolution: Option<String>, // LOCAL_WINS, REMOTE_WINS, MANUAL, MERGE
    pub resolved_data: Option<String>, // JSON object
    pub created_at: String,
    pub resolved_at: Option<String>,
    pub resolved_by: Option<String>,
}

// ====================================================================
// REQUEST/RESPONSE MODELS FOR API COMPATIBILITY
// ====================================================================

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PaginationParams {
    pub page: Option<i32>,
    pub limit: Option<i32>,
    pub cursor: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PaginatedResponse<T> {
    pub data: Vec<T>,
    pub pagination: PaginationInfo,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PaginationInfo {
    pub page: i32,
    pub limit: i32,
    pub total: i32,
    pub total_pages: i32,
    pub has_next: bool,
    pub has_prev: bool,
    pub next_cursor: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PeopleFilters {
    pub search: Option<String>,
    pub status: Option<String>,
    pub priority: Option<String>,
    pub company_id: Option<String>,
    pub vertical: Option<String>,
    pub main_seller_id: Option<String>,
    pub sort_by: Option<String>,
    pub sort_order: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CompanyFilters {
    pub search: Option<String>,
    pub status: Option<String>,
    pub priority: Option<String>,
    pub industry: Option<String>,
    pub main_seller_id: Option<String>,
    pub sort_by: Option<String>,
    pub sort_order: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ActionFilters {
    pub status: Option<String>,
    pub priority: Option<String>,
    pub type_: Option<String>,
    pub user_id: Option<String>,
    pub company_id: Option<String>,
    pub person_id: Option<String>,
    pub scheduled_after: Option<String>,
    pub scheduled_before: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CreatePersonInput {
    pub first_name: String,
    pub last_name: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub job_title: Option<String>,
    pub company_id: Option<String>,
    pub status: Option<String>,
    pub priority: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UpdatePersonInput {
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub job_title: Option<String>,
    pub company_id: Option<String>,
    pub status: Option<String>,
    pub priority: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CreateCompanyInput {
    pub name: String,
    pub website: Option<String>,
    pub industry: Option<String>,
    pub size: Option<String>,
    pub description: Option<String>,
    pub status: Option<String>,
    pub priority: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UpdateCompanyInput {
    pub name: Option<String>,
    pub website: Option<String>,
    pub industry: Option<String>,
    pub size: Option<String>,
    pub description: Option<String>,
    pub status: Option<String>,
    pub priority: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CreateActionInput {
    pub type_: String,
    pub subject: String,
    pub description: Option<String>,
    pub scheduled_at: Option<String>,
    pub priority: Option<String>,
    pub company_id: Option<String>,
    pub person_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UpdateActionInput {
    pub type_: Option<String>,
    pub subject: Option<String>,
    pub description: Option<String>,
    pub scheduled_at: Option<String>,
    pub completed_at: Option<String>,
    pub status: Option<String>,
    pub priority: Option<String>,
    pub outcome: Option<String>,
}

// ====================================================================
// SYNC ENGINE MODELS
// ====================================================================

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SyncReport {
    pub success: bool,
    pub tables_synced: Vec<String>,
    pub records_processed: i32,
    pub records_created: i32,
    pub records_updated: i32,
    pub records_deleted: i32,
    pub conflicts_found: i32,
    pub errors: Vec<String>,
    pub duration_ms: i64,
    pub timestamp: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SyncStatusResponse {
    pub is_online: bool,
    pub last_sync: Option<String>,
    pub tables: Vec<TableSyncStatus>,
    pub pending_changes: i32,
    pub conflicts: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TableSyncStatus {
    pub table_name: String,
    pub last_sync: Option<String>,
    pub total_records: i32,
    pub synced_records: i32,
    pub pending_records: i32,
    pub failed_records: i32,
    pub status: String, // SYNCED, PENDING, ERROR
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ConflictResolution {
    pub conflict_id: i64,
    pub resolution: String, // LOCAL_WINS, REMOTE_WINS, MANUAL, MERGE
    pub resolved_data: Option<String>, // JSON object for manual/merge
}

// ====================================================================
// LEGACY COMPATIBILITY MODELS (for backward compatibility)
// ====================================================================

// Legacy models for backward compatibility with existing code
pub type DesktopUser = User;
pub type DesktopLead = Person;
pub type DesktopContact = Person;
pub type DesktopAccount = Company;
pub type DesktopOpportunity = Action;
pub type DesktopPerson = Person;

// Legacy authentication models
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

// ====================================================================
// DATABASE CONNECTION TYPES
// ====================================================================

pub enum DatabaseConnection {
    Production { postgres: PgPool, sqlite: Option<SqlitePool> },
    _Hybrid { sqlite: SqlitePool },
}

#[derive(Clone)]
pub struct HybridDatabaseManager {
    pub connection: Arc<RwLock<DatabaseConnection>>,
}

pub type DatabaseState = Arc<std::sync::Mutex<Option<HybridDatabaseManager>>>; 

// ====================================================================
// UTILITY FUNCTIONS
// ====================================================================

impl Person {
    pub fn full_name(&self) -> String {
        format!("{} {}", self.first_name, self.last_name)
    }
    
    pub fn display_name(&self) -> String {
        self.display_name.clone().unwrap_or_else(|| self.full_name())
    }
}

impl Company {
    pub fn display_name(&self) -> String {
        self.legal_name.clone()
            .or(self.trading_name.clone())
            .unwrap_or(self.name.clone())
    }
}

impl Action {
    pub fn is_completed(&self) -> bool {
        self.status == "COMPLETED"
    }
    
    pub fn is_overdue(&self) -> bool {
        if let Some(scheduled_at) = &self.scheduled_at {
            if let Ok(scheduled) = chrono::DateTime::parse_from_rfc3339(scheduled_at) {
                return scheduled < Utc::now();
            }
        }
        false
    }
}