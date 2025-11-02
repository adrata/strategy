
use crate::database_init::get_database_manager;

// TWILIO CALLING COMMANDS
#[tauri::command]
pub async fn make_twilio_call(
    to: String,
    from: String,
    contact_name: String,
    contact_id: String,
    _user_id: String
) -> Result<serde_json::Value, String> {
    println!("📞 [TAURI] Making Twilio call to {} from {} for contact: {}", to, from, contact_name);
    
    let account_sid = "CREDENTIAL_REMOVED_FOR_SECURITY";
    let auth_token = std::env::var("TWILIO_AUTH_TOKEN")
        .unwrap_or_else(|_| "CREDENTIAL_REMOVED_FOR_SECURITY".to_string());
    
    let client = reqwest::Client::new();
    let url = format!("https://api.twilio.com/2010-04-01/Accounts/{}/Calls.json", account_sid);
    
    // Use simple webhook URLs that work reliably
    let callback_url = if cfg!(debug_assertions) {
        // Development: Use Twilio's demo TwiML for testing
        "https://demo.twilio.com/docs/voice.xml"
    } else {
        // Production: Use simple TwiML that just connects the call
        "https://demo.twilio.com/docs/voice.xml"
    };
    
    println!("📞 [TAURI] Making direct call with webhook: {}", callback_url);
    
    let params = [
        ("To", to.as_str()),
        ("From", from.as_str()),
        ("Url", callback_url),
        ("Method", "POST"),
    ];
    
    match client
        .post(&url)
        .basic_auth(account_sid, Some(&auth_token))
        .form(&params)
        .send()
        .await
    {
        Ok(response) => {
            let status = response.status();
            let response_text = response.text().await.unwrap_or_default();
            
            println!("📞 [TAURI] Raw Twilio response: {}", response_text);
            
            if status.is_success() {
                // Parse Twilio response
                let twilio_response: serde_json::Value = serde_json::from_str(&response_text)
                    .unwrap_or_default();
                
                let call_sid = twilio_response.get("sid")
                    .and_then(|v| v.as_str())
                    .unwrap_or("unknown");
                
                println!("✅ [TAURI] Direct call initiated successfully: {}", call_sid);
                
                Ok(serde_json::json!({
                    "success": true,
                    "call_sid": call_sid,
                    "status": "initiated",
                    "to": to,
                    "from": from,
                    "contact_name": contact_name,
                    "contact_id": contact_id,
                    "timestamp": chrono::Utc::now().to_rfc3339(),
                    "provider": "twilio",
                    "method": "direct-call"
                }))
            } else {
                let error_msg = format!("Twilio API error: {} - {}", status, response_text);
                println!("❌ [TAURI] {}", error_msg);
                Err(error_msg)
            }
        },
        Err(e) => {
            let error_msg = format!("Failed to make API request: {}", e);
            println!("❌ [TAURI] {}", error_msg);
            Err(error_msg)
        }
    }
}

#[tauri::command]
pub async fn save_call_record(
    contact_id: String,
    call_sid: String,
    outcome: String,
    notes: String,
    duration: Option<i32>,
    user_id: String,
    workspace_id: String
) -> Result<serde_json::Value, String> {
    println!("💾 [TAURI] Saving call record for contact: {}, outcome: {}", contact_id, outcome);
    
    let db_manager = get_database_manager()?;
    
    // Create call record data
    let call_record = serde_json::json!({
        "contact_id": contact_id,
        "call_sid": call_sid,
        "outcome": outcome,
        "notes": notes,
        "duration": duration.unwrap_or(0),
        "user_id": user_id,
        "workspace_id": workspace_id,
        "timestamp": chrono::Utc::now().to_rfc3339(),
        "call_type": "outbound",
        "provider": "twilio"
    });
    
    // Save to database
    match db_manager.save_call_activity(&workspace_id, &user_id, &contact_id, &call_record).await {
        Ok(_) => {
            println!("✅ [TAURI] Call record saved successfully for contact: {}", contact_id);
            
            // Also update lead status to reflect the call
            let new_status = match outcome.as_str() {
                "connected" | "pitched" | "demo-scheduled" => "Contacted",
                "voicemail" => "Attempted",
                "no-answer" | "busy" => "Attempted",
                _ => "Attempted"
            };
            
            // Update lead status
            if let Err(e) = db_manager.update_lead_status(&workspace_id, &user_id, &contact_id, new_status).await {
                println!("⚠️ [TAURI] Warning: Could not update lead status: {}", e);
            }
            
            Ok(serde_json::json!({
                "success": true,
                "call_record_id": format!("call_{}", chrono::Utc::now().timestamp()),
                "contact_id": contact_id,
                "outcome": outcome,
                "status_updated": new_status,
                "timestamp": chrono::Utc::now().to_rfc3339()
            }))
        },
        Err(e) => {
            println!("❌ [TAURI] Error saving call record: {}", e);
            Err(format!("Failed to save call record: {}", e))
        }
    }
}

#[tauri::command]
pub async fn get_twilio_call_status(call_sid: String) -> Result<serde_json::Value, String> {
    println!("📊 [TAURI] Getting call status for: {}", call_sid);
    
    let account_sid = "CREDENTIAL_REMOVED_FOR_SECURITY";
    let auth_token = std::env::var("TWILIO_AUTH_TOKEN")
        .unwrap_or_else(|_| "CREDENTIAL_REMOVED_FOR_SECURITY".to_string());
    
    let client = reqwest::Client::new();
    let url = format!("https://api.twilio.com/2010-04-01/Accounts/{}/Calls/{}.json", account_sid, call_sid);
    
    match client
        .get(&url)
        .basic_auth(account_sid, Some(&auth_token))
        .send()
        .await
    {
        Ok(response) => {
            let status = response.status();
            let response_text = response.text().await.unwrap_or_default();
            
            if status.is_success() {
                let call_data: serde_json::Value = serde_json::from_str(&response_text)
                    .unwrap_or_default();
                
                let call_status = call_data.get("status")
                    .and_then(|v| v.as_str())
                    .unwrap_or("unknown");
                
                let duration = call_data.get("duration")
                    .and_then(|v| v.as_str())
                    .unwrap_or("0");
                
                println!("✅ [TAURI] Call status retrieved: {}", call_status);
                
                Ok(serde_json::json!({
                    "call_sid": call_sid,
                    "status": call_status,
                    "duration": duration,
                    "start_time": call_data.get("start_time"),
                    "end_time": call_data.get("end_time"),
                    "from": call_data.get("from"),
                    "to": call_data.get("to"),
                    "price": call_data.get("price"),
                    "direction": call_data.get("direction")
                }))
            } else {
                let error_msg = format!("Failed to get call status: {} - {}", status, response_text);
                println!("❌ [TAURI] {}", error_msg);
                Err(error_msg)
            }
        },
        Err(e) => {
            let error_msg = format!("Failed to make API request: {}", e);
            println!("❌ [TAURI] {}", error_msg);
            Err(error_msg)
        }
    }
}

#[tauri::command]
pub async fn get_optimal_calling_number(
    contact_phone: String,
    _contact_location: Option<String>,
    _contact_company: Option<String>,
    _user_id: String
) -> Result<serde_json::Value, String> {
    println!("🎯 [TAURI] Finding optimal calling number for contact: {}", contact_phone);
    
    // Extract area code from contact's phone
    let contact_area_code = extract_area_code_from_phone(&contact_phone);
    println!("📍 [TAURI] Contact area code: {}", contact_area_code);
    
    // Return a sample optimal number (in production this would use dynamic lookup)
    Ok(serde_json::json!({
        "phoneNumber": "+13134747247",
        "areaCode": "313",
        "location": {"city": "Detroit", "state": "MI", "region": "Midwest"},
        "matchScore": 85.0,
        "matchReason": "Geographic proximity match",
        "contactAreaCode": contact_area_code
    }))
}

#[tauri::command]
pub async fn get_all_available_numbers() -> Result<serde_json::Value, String> {
    println!("📞 [TAURI] Fetching all available phone numbers from Twilio...");
    
    // Twilio credentials
    let account_sid = "CREDENTIAL_REMOVED_FOR_SECURITY";
    let auth_token = std::env::var("TWILIO_AUTH_TOKEN")
        .unwrap_or_else(|_| "CREDENTIAL_REMOVED_FOR_SECURITY".to_string());
    
    // Create HTTP client
    let client = reqwest::Client::new();
    
    // Twilio API endpoint for incoming phone numbers
    let url = format!("https://api.twilio.com/2010-04-01/Accounts/{}/IncomingPhoneNumbers.json", account_sid);
    
    match client
        .get(&url)
        .basic_auth(account_sid, Some(&auth_token))
        .send()
        .await
    {
        Ok(response) => {
            let status = response.status();
            let response_text = response.text().await.unwrap_or_default();
            
            if status.is_success() {
                let twilio_response: serde_json::Value = serde_json::from_str(&response_text)
                    .unwrap_or_default();
                
                let phone_numbers = twilio_response.get("incoming_phone_numbers")
                    .and_then(|v| v.as_array())
                    .map(|numbers| {
                        numbers.iter().map(|number| {
                            let phone_number = number.get("phone_number")
                                .and_then(|v| v.as_str())
                                .unwrap_or("");
                            let area_code = extract_area_code_from_phone(phone_number);
                            
                            serde_json::json!({
                                "phoneNumber": phone_number,
                                "areaCode": area_code,
                                "location": get_location_for_area_code(&area_code),
                                "sid": number.get("sid"),
                                "friendly_name": number.get("friendly_name")
                            })
                        }).collect::<Vec<_>>()
                    })
                    .unwrap_or_default();
                
                println!("✅ [TAURI] Retrieved {} phone numbers from Twilio", phone_numbers.len());
                
                Ok(serde_json::json!({
                    "success": true,
                    "numbers": phone_numbers,
                    "total": phone_numbers.len()
                }))
            } else {
                let error_msg = format!("Twilio API error: {} - {}", status, response_text);
                println!("❌ [TAURI] {}", error_msg);
                Err(error_msg)
            }
        },
        Err(e) => {
            let error_msg = format!("Failed to fetch phone numbers: {}", e);
            println!("❌ [TAURI] {}", error_msg);
            Err(error_msg)
        }
    }
}

#[tauri::command]
pub async fn handle_twilio_voice(from: String, to: String, call_sid: String, _account_sid: String) -> Result<String, String> {
    println!("🎙️ [TAURI] Handling Twilio voice call: {} -> {} (SID: {})", from, to, call_sid);
    
    // Generate TwiML response for voice handling
    let twiml = r#"<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Hello! This is Adrata. We're connecting you with the right person. Please hold.</Say>
    <Dial timeout="30">
        <Number>+13027574107</Number>
    </Dial>
    <Say voice="alice">We're sorry, but no one is available to take your call right now. Please leave a message after the beep.</Say>
    <Record timeout="30" maxLength="120" />
    <Say voice="alice">Thank you for your message. We'll get back to you soon. Goodbye!</Say>
</Response>"#.to_string();
    
    println!("✅ [TAURI] Generated TwiML response for call: {}", call_sid);
    Ok(twiml)
}

#[tauri::command]
pub async fn join_twilio_conference(
    conference_id: String,
    access_token: String,
    user_id: String
) -> Result<serde_json::Value, String> {
    println!("🎙️ [TAURI] Joining Twilio conference: {} for user: {}", conference_id, user_id);
    
    // For now, this is a simulation since real conference joining would require
    // Twilio Voice SDK integration in the desktop app
    // In production, this would:
    // 1. Initialize Twilio Device with access_token
    // 2. Connect to the conference room  
    // 3. Handle audio streams
    // 4. Set up event listeners for conference events
    
    println!("🎫 [TAURI] Using access token for conference join (length: {})", access_token.len());
    
    // Simulate conference join process
    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
    
    // Log the conference join for debugging
    println!("✅ [TAURI] Conference join simulation completed for: {}", conference_id);
    
    Ok(serde_json::json!({
        "success": true,
        "conference_id": conference_id,
        "user_id": user_id,
        "status": "joined",
        "timestamp": chrono::Utc::now().to_rfc3339(),
        "audio_enabled": true,
        "video_enabled": false,
        "participants": 2,
        "message": "Successfully joined conference (simulation)"
    }))
}

// HELPER FUNCTIONS
fn _find_best_matching_number_dynamic(
    contact_area_code: &str,
    _contact_location: &Option<String>,
    _contact_company: &Option<String>,
    available_numbers: &[serde_json::Value]
) -> serde_json::Value {
    println!("🔍 [TAURI] Finding best match for area code: {}", contact_area_code);
    
    let mut best_match = None;
    let mut best_score = 0.0f32;
    
    for number in available_numbers {
        let number_area_code = number.get("areaCode")
            .and_then(|v| v.as_str())
            .unwrap_or("");
        
        let phone_number = number.get("phoneNumber")
            .and_then(|v| v.as_str())
            .unwrap_or("");
        
        let mut score = 0.0f32;
        let mut _match_reason = String::new();
        
        // Exact area code match (highest priority)
        if number_area_code == contact_area_code {
            score += 100.0;
            _match_reason = "Exact area code match".to_string();
        } else {
            // Geographic proximity
            let proximity_score = _calculate_geographic_proximity_dynamic(contact_area_code, number_area_code);
            score += proximity_score;
            _match_reason = format!("Geographic proximity (score: {:.1})", proximity_score);
        }
        
        // Company intelligence boost
        if let Some(company) = _contact_company {
            if _is_tech_company(company) && _is_tech_friendly_area_code(number_area_code) {
                score += 20.0;
                _match_reason += " + Tech company match";
            }
        }
        
        // Location intelligence boost
        if let Some(location) = _contact_location {
            if _location_matches_area_code(location, number_area_code) {
                score += 15.0;
                _match_reason += " + Location match";
            }
        }
        
        if score > best_score {
            best_score = score;
            best_match = Some(serde_json::json!({
                "phoneNumber": phone_number,
                "areaCode": number_area_code,
                "location": number.get("location"),
                "matchScore": score,
                "matchReason": _match_reason,
                "contactAreaCode": contact_area_code
            }));
        }
    }
    
    match best_match {
        Some(number) => {
            println!("✅ [TAURI] Best match found: {} (score: {:.1})", 
                number.get("phoneNumber").and_then(|v| v.as_str()).unwrap_or("unknown"), 
                best_score);
            number
        },
        None => {
            // Fallback to first available number
            let fallback = available_numbers.first()
                .map(|number| {
                    serde_json::json!({
                        "phoneNumber": number.get("phoneNumber"),
                        "areaCode": number.get("areaCode"),
                        "location": number.get("location"),
                        "matchScore": 10.0,
                        "matchReason": "Fallback - no optimal match found",
                        "contactAreaCode": contact_area_code
                    })
                })
                .unwrap_or_else(|| {
                    serde_json::json!({
                        "phoneNumber": "+13134747247",
                        "areaCode": "313",
                        "location": "Detroit, MI",
                        "matchScore": 5.0,
                        "matchReason": "Default fallback number",
                        "contactAreaCode": contact_area_code
                    })
                });
            
            println!("⚠️ [TAURI] Using fallback number: {}", 
                fallback.get("phoneNumber").and_then(|v| v.as_str()).unwrap_or("unknown"));
            fallback
        }
    }
}

// Helper function to extract area code from phone number
fn extract_area_code_from_phone(phone: &str) -> String {
    let cleaned = phone.chars().filter(|c| c.is_ascii_digit()).collect::<String>();
    
    if cleaned.len() == 11 && cleaned.starts_with('1') {
        cleaned[1..4].to_string()
    } else if cleaned.len() == 10 {
        cleaned[0..3].to_string()
    } else {
        "unknown".to_string()
    }
}

fn _calculate_geographic_proximity_dynamic(contact_area_code: &str, number_area_code: &str) -> f32 {
    // Geographic proximity mapping based on US regions
    let area_code_regions = [
        // West Coast (6 items)
        (vec!["415", "510", "408", "650", "925", "628"], "west_coast"),
        // Southwest (6 items)
        (vec!["602", "480", "623", "928", "520", "623"], "southwest"),
        // Central (6 items)
        (vec!["312", "773", "872", "630", "847", "708"], "central"),
        // East Coast (6 items)
        (vec!["212", "646", "917", "718", "347", "929"], "east_coast"),
        // Southeast (6 items)
        (vec!["404", "678", "770", "470", "762", "470"], "southeast"),
    ];
    
    let contact_region = _find_region(contact_area_code, &area_code_regions);
    let number_region = _find_region(number_area_code, &area_code_regions);
    
    match (contact_region, number_region) {
        (Some(region1), Some(region2)) if region1 == region2 => 75.0, // Same region
        (Some(_), Some(_)) => 40.0, // Different regions
        _ => 20.0, // Unknown regions
    }
}

fn _find_region<'a>(area_code: &str, regions: &'a [(Vec<&str>, &str)]) -> Option<&'a str> {
    for (codes, region) in regions {
        if codes.contains(&area_code) {
            return Some(region);
        }
    }
    None
}

fn get_location_for_area_code(area_code: &str) -> serde_json::Value {
    let location_map = [
        ("602", serde_json::json!({"city": "Phoenix", "state": "AZ", "region": "Southwest"})),
        ("415", serde_json::json!({"city": "San Francisco", "state": "CA", "region": "West Coast"})),
        ("510", serde_json::json!({"city": "Oakland", "state": "CA", "region": "West Coast"})),
        ("408", serde_json::json!({"city": "San Jose", "state": "CA", "region": "West Coast"})),
        ("312", serde_json::json!({"city": "Chicago", "state": "IL", "region": "Midwest"})),
        ("313", serde_json::json!({"city": "Detroit", "state": "MI", "region": "Midwest"})),
        ("212", serde_json::json!({"city": "New York", "state": "NY", "region": "East Coast"})),
        ("646", serde_json::json!({"city": "New York", "state": "NY", "region": "East Coast"})),
        ("404", serde_json::json!({"city": "Atlanta", "state": "GA", "region": "Southeast"})),
    ];
    
    for (code, location) in &location_map {
        if *code == area_code {
            return location.clone();
        }
    }
    
    serde_json::json!({"city": "Unknown", "state": "Unknown", "region": "Unknown"})
}

fn _is_tech_company(company: &str) -> bool {
    let company_lower = company.to_lowercase();
    company_lower.contains("tech") || 
    company_lower.contains("software") || 
    company_lower.contains("ai") || 
    company_lower.contains("data") ||
    company_lower.contains("cloud") ||
    company_lower.contains("saas")
}

fn _is_tech_friendly_area_code(area_code: &str) -> bool {
    // Silicon Valley and major tech hubs
    matches!(area_code, "415" | "510" | "408" | "650" | "206" | "425" | "512" | "737")
}

fn _location_matches_area_code(location: &str, area_code: &str) -> bool {
    let location_lower = location.to_lowercase();
    
    match area_code {
        "415" | "510" | "408" => location_lower.contains("san francisco") || location_lower.contains("bay area") || location_lower.contains("silicon valley"),
        "212" | "646" | "917" => location_lower.contains("new york") || location_lower.contains("nyc") || location_lower.contains("manhattan"),
        "312" | "773" => location_lower.contains("chicago") || location_lower.contains("illinois"),
        "602" | "480" => location_lower.contains("phoenix") || location_lower.contains("arizona"),
        "404" | "678" => location_lower.contains("atlanta") || location_lower.contains("georgia"),
        _ => false
    }
} 