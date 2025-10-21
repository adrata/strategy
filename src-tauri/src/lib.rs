// No global imports needed - using module references in invoke_handler

// App state for Tauri
#[derive(Default)]
pub struct AppState {
    // Add any global state here if needed
}

// Module declarations
mod voice;
mod database_init;
mod data;
mod speedrun;
mod ai;
mod calling;
mod platform;
mod monaco;
mod database;
mod human_capital;
mod dynamic_os;
mod config;
mod auth;
mod chat;
mod email;
mod webhooks;
mod email_scanning;
mod demo_scenarios;
mod encode;
mod sync;
mod api;
// mod entity; // Removed - entities table doesn't exist in streamlined schema

// Import modules for command generation
// (Commands are referenced as module::command in the invoke_handler)

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_websocket::init())
        .setup(|app| {
            println!("🚀 [TAURI] Starting Adrata Desktop Application");
            
            // Initialize database on app startup
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                if let Err(e) = database_init::init_database_manager(&app_handle).await {
                    println!("❌ [TAURI] Database initialization failed: {}", e);
                } else {
                    println!("✅ [TAURI] Database initialization completed successfully");
                }
            });
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Voice Commands (Native Audio Capture)
            voice::start_native_voice_session,
            voice::stop_native_voice_session,
            voice::get_native_voice_status,
            voice::check_voice_support,
            voice::request_microphone_permission,
            voice::setup_global_hotkey,
            // Legacy voice commands (stubs)
            voice::start_voice_recognition,
            voice::stop_voice_recognition,
            voice::speak_text,
            voice::get_voice_settings,
            voice::update_voice_settings,

            // Database Initialization
            database_init::initialize_database,
            database_init::test_database_connection,
            database_init::initialize_user_auth,
            database_init::authenticate_user_direct,

            // Data Access
            data::get_leads,
            data::add_lead,
            data::get_contacts,
            data::add_contact,
            data::get_companies,
            data::add_company,
            data::get_partnerships,
            data::get_buyer_groups,
            data::create_buyer_group,
            data::add_buyer_group_member,
            data::get_buyer_group_members,
            data::search_leads,
            data::get_lead_by_id,
            data::update_lead,
            data::delete_lead,
            data::get_opportunities,
            data::create_opportunity,
            data::convert_lead_to_opportunity,
            data::update_opportunity,
            data::update_lead_detailed,
            data::create_account_from_lead,
            data::create_contact_from_lead,
            data::convert_lead_to_opportunity_complete,
            
            // Unified Data & Sync
            data::get_unified_data,
            data::sync_workspace_data,

            // Speedrun Management
            speedrun::get_outbox_leads,
            speedrun::add_outbox_contact,
            speedrun::complete_outbox_lead,
            speedrun::get_outbox_settings,
            speedrun::update_outbox_settings,
            speedrun::get_outbox_count,
            speedrun::add_account,
            speedrun::call_brightdata_enrichment,

            // AI Analytics
            ai::analyze_lead_intelligence,
            ai::generate_smart_insights,
            ai::analyze_conversation,
            ai::get_lead_recommendations,
            ai::analyze_market_trends,

            // Calling System
            calling::make_twilio_call,
            calling::save_call_record,
            calling::get_twilio_call_status,
            calling::get_optimal_calling_number,
            calling::get_all_available_numbers,
            calling::handle_twilio_voice,
            calling::join_twilio_conference,

            // Platform Features
            platform::check_for_updates,
            platform::set_badge_count,
            platform::clear_badge,
            platform::test_dock_badge,
            platform::show_notification,
            platform::get_app_info,
            platform::initialize_ross_dan_chat,
            platform::send_ross_dan_message,
            platform::upload_ross_dan_image,
            platform::get_ross_conversations,
            platform::send_typing_indicator,
            platform::poll_ross_dan_messages,
            platform::check_pusher_connection,
            platform::open_url_in_browser,

            // Monaco Pipeline (Real BrightData Integration)
            monaco::run_monaco_pipeline,
            monaco::get_monaco_enrichment_status,
            monaco::search_companies_monaco,
            monaco::trigger_monaco_enrichment,
            monaco::get_monaco_company_details,
            monaco::test_brightdata_api,

            // Human Capital Management - FOS (Founder Operating System)
            human_capital::get_founder_business_plan,
            human_capital::get_essential_team,
            human_capital::assess_hiring_os_upgrade,
            human_capital::initiate_hos_upgrade,

            // Human Capital Management - HOS (Hiring Operating System)
            human_capital::get_recruitment_pipelines,
            human_capital::get_candidate_profiles,
            
            // Authentication
            auth::sign_in_desktop,
            auth::sign_out_desktop,
            auth::refresh_token_desktop,
            auth::get_current_user_desktop,
            auth::validate_access_token,
            auth::get_stored_credentials,
            
            // Chat System
            chat::send_message_desktop,
            chat::get_chat_sessions_desktop,
            chat::create_chat_session_desktop,
            chat::get_chat_messages_desktop,
            
            // Email System
            email::send_email_desktop,
            email::sync_emails_desktop,
            email::get_email_settings_desktop,
            email::update_email_settings_desktop,
            
            // Webhook Processing
            webhooks::process_zoho_webhook,
            webhooks::process_coresignal_webhook,
            webhooks::process_outlook_webhook,
            webhooks::validate_webhook_token,
            
            // Email Scanning & Advanced Email Features
            email_scanning::scan_emails_for_buying_signals,
            email_scanning::get_buying_signal_stats,
            email_scanning::sync_email_account,
            email_scanning::get_email_sync_status,
            email_scanning::send_email_advanced,
            
            // Demo Scenarios
            demo_scenarios::get_demo_scenarios,
            demo_scenarios::get_demo_scenario_by_slug,
            demo_scenarios::get_demo_prospects,
            demo_scenarios::get_demo_companies,
            demo_scenarios::get_demo_people,
            demo_scenarios::get_demo_sellers,
            
            // Additional Human Capital Commands
            human_capital::create_job_posting,
            human_capital::get_organizational_health,

            // Operating System Detection & Switching (Legacy)
            human_capital::get_active_operating_system,
            human_capital::switch_operating_system,

            // Dynamic Operating System Engine (Next-Gen)
            dynamic_os::create_client_os,
            dynamic_os::get_client_os_config,
            dynamic_os::update_client_os_modules,
            dynamic_os::get_available_modules,
            dynamic_os::switch_client_os,
            dynamic_os::get_client_os_analytics,

                // Encode Code Editor - File System Commands
                encode::encode_read_directory,
                encode::encode_read_file,
                encode::encode_write_file,
                encode::encode_create_directory,
                encode::encode_delete_path,
                encode::encode_rename_path,
                encode::encode_copy_path,
                encode::encode_get_file_info,
                encode::encode_path_exists,
                encode::encode_get_current_dir,
                encode::encode_set_current_dir,
                encode::encode_get_home_dir,
                encode::encode_get_documents_dir,
                encode::encode_get_desktop_dir,
                encode::encode_get_downloads_dir,
                encode::encode_watch_directory,
                encode::encode_unwatch_directory,

                // Sync Engine Commands
                sync::sync_workspace,
                sync::sync_table,
                sync::push_changes,
                sync::pull_changes,
                sync::resolve_conflict,
                sync::get_sync_status,
                sync::enable_background_sync,
                sync::disable_background_sync,
                sync::get_sync_queue_stats,
                sync::get_conflict_statistics,
                sync::retry_failed_syncs,
                sync::clear_failed_syncs,
                sync::get_sync_health,

                // API Commands - Matching V1 APIs
                api::get_people,
                api::create_person,
                api::update_person,
                api::delete_person,
                api::get_person_by_id_command,
                api::get_companies,
                api::create_company,
                api::update_company,
                api::delete_company,
                api::get_company_by_id_command,
                api::get_actions,
                api::create_action,
                api::update_action,
                api::delete_action,
                api::get_action_by_id,
                api::get_speedrun_data,
                api::invalidate_speedrun_cache,
                api::get_chronicle_reports,
                api::create_chronicle_report,
                api::get_chronicle_report_by_id
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
} 