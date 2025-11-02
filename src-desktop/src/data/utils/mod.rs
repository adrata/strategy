// UTILITY FUNCTIONS

pub fn infer_industry_from_company(company_name: &str) -> String {
    let company_lower = company_name.to_lowercase();
    
    if company_lower.contains("tech") || company_lower.contains("software") || company_lower.contains("digital") {
        "Technology".to_string()
    } else if company_lower.contains("bank") || company_lower.contains("financial") || company_lower.contains("capital") {
        "Financial Services".to_string()
    } else if company_lower.contains("health") || company_lower.contains("medical") || company_lower.contains("pharma") {
        "Healthcare".to_string()
    } else if company_lower.contains("retail") || company_lower.contains("store") || company_lower.contains("shop") {
        "Retail".to_string()
    } else if company_lower.contains("consulting") || company_lower.contains("advisory") {
        "Consulting".to_string()
    } else {
        "General Business".to_string()
    }
}

#[allow(dead_code)]
pub fn calculate_lead_score(lead_data: &serde_json::Value) -> i32 {
    let mut score = 50; // Base score
    
    // Company size indicators
    if let Some(company) = lead_data.get("company").and_then(|v| v.as_str()) {
        let company_lower = company.to_lowercase();
        if company_lower.contains("enterprise") || company_lower.contains("corp") || company_lower.contains("inc") {
            score += 20;
        }
        if company_lower.contains("startup") || company_lower.contains("llc") {
            score += 10;
        }
    }
    
    // Title indicators
    if let Some(title) = lead_data.get("title").and_then(|v| v.as_str()) {
        let title_lower = title.to_lowercase();
        if title_lower.contains("ceo") || title_lower.contains("founder") || title_lower.contains("president") {
            score += 25;
        } else if title_lower.contains("vp") || title_lower.contains("director") || title_lower.contains("head") {
            score += 20;
        } else if title_lower.contains("manager") || title_lower.contains("lead") {
            score += 15;
        }
    }
    
    // Email domain quality
    if let Some(email) = lead_data.get("email").and_then(|v| v.as_str()) {
        if !email.contains("gmail") && !email.contains("yahoo") && !email.contains("hotmail") {
            score += 15; // Business email
        }
        if email.contains("@") && email.split('@').count() == 2 {
            score += 5; // Valid email format
        }
    }
    
    // Phone presence
    if lead_data.get("phone").and_then(|v| v.as_str()).is_some() {
        score += 10;
    }
    
    // Industry scoring
    if let Some(company) = lead_data.get("company").and_then(|v| v.as_str()) {
        let industry = infer_industry_from_company(company);
        match industry.as_str() {
            "Technology" => score += 15,
            "Financial Services" => score += 20,
            "Healthcare" => score += 15,
            "Consulting" => score += 10,
            _ => score += 5,
        }
    }
    
    // Cap the score
    score.clamp(0, 100)
}

#[allow(dead_code)]
pub fn generate_ai_tags(lead_data: &serde_json::Value) -> Vec<String> {
    let mut tags = Vec::new();
    
    // Industry-based tags
    if let Some(company) = lead_data.get("company").and_then(|v| v.as_str()) {
        let industry = infer_industry_from_company(company);
        tags.push(industry.to_lowercase().replace(" ", "_"));
        
        let company_lower = company.to_lowercase();
        if company_lower.contains("startup") {
            tags.push("startup".to_string());
        }
        if company_lower.contains("enterprise") {
            tags.push("enterprise".to_string());
        }
    }
    
    // Role-based tags
    if let Some(title) = lead_data.get("title").and_then(|v| v.as_str()) {
        let title_lower = title.to_lowercase();
        if title_lower.contains("c-level") || title_lower.contains("ceo") || title_lower.contains("cto") || title_lower.contains("cfo") {
            tags.push("c_suite".to_string());
        }
        if title_lower.contains("vp") || title_lower.contains("vice president") {
            tags.push("vp_level".to_string());
        }
        if title_lower.contains("director") {
            tags.push("director_level".to_string());
        }
        if title_lower.contains("manager") {
            tags.push("manager_level".to_string());
        }
        if title_lower.contains("sales") {
            tags.push("sales_role".to_string());
        }
        if title_lower.contains("marketing") {
            tags.push("marketing_role".to_string());
        }
        if title_lower.contains("tech") || title_lower.contains("engineer") {
            tags.push("technical_role".to_string());
        }
    }
    
    // Engagement quality tags
    let score = calculate_lead_score(lead_data);
    if score >= 80 {
        tags.push("high_quality".to_string());
    } else if score >= 60 {
        tags.push("medium_quality".to_string());
    } else {
        tags.push("low_quality".to_string());
    }
    
    // Contact completeness
    let has_email = lead_data.get("email").and_then(|v| v.as_str()).is_some();
    let has_phone = lead_data.get("phone").and_then(|v| v.as_str()).is_some();
    
    if has_email && has_phone {
        tags.push("complete_contact".to_string());
    } else if has_email {
        tags.push("email_only".to_string());
    } else if has_phone {
        tags.push("phone_only".to_string());
    }
    
    tags
}

#[allow(dead_code)]
pub fn generate_ai_insights(lead_data: &serde_json::Value) -> Vec<String> {
    let mut insights = Vec::new();
    
    let score = calculate_lead_score(lead_data);
    let tags = generate_ai_tags(lead_data);
    
    // Score-based insights
    if score >= 80 {
        insights.push("This is a high-quality lead with strong potential for conversion".to_string());
        insights.push("Recommend prioritizing immediate follow-up within 24 hours".to_string());
    } else if score >= 60 {
        insights.push("Solid lead with good potential - worth pursuing with standard follow-up".to_string());
    } else {
        insights.push("Lower priority lead - consider nurturing campaign before direct outreach".to_string());
    }
    
    // Company-specific insights
    if let Some(company) = lead_data.get("company").and_then(|v| v.as_str()) {
        let industry = infer_industry_from_company(company);
        match industry.as_str() {
            "Technology" => {
                insights.push("Tech companies often have shorter sales cycles but require technical validation".to_string());
            },
            "Financial Services" => {
                insights.push("Financial sector leads typically have longer approval processes but higher deal values".to_string());
            },
            "Healthcare" => {
                insights.push("Healthcare organizations require compliance considerations in sales approach".to_string());
            },
            _ => {}
        }
    }
    
    // Role-specific insights
    if let Some(title) = lead_data.get("title").and_then(|v| v.as_str()) {
        let title_lower = title.to_lowercase();
        if title_lower.contains("ceo") || title_lower.contains("founder") {
            insights.push("C-suite contact - focus on strategic value and ROI in communications".to_string());
        } else if title_lower.contains("director") || title_lower.contains("vp") {
            insights.push("Decision-maker level - can likely move forward without additional approvals".to_string());
        } else if title_lower.contains("manager") {
            insights.push("May need to identify budget owner and final decision maker".to_string());
        }
    }
    
    // Contact strategy insights
    if tags.contains(&"complete_contact".to_string()) {
        insights.push("Multiple contact methods available - consider multi-channel outreach strategy".to_string());
    }
    
    if tags.contains(&"enterprise".to_string()) {
        insights.push("Enterprise prospect - prepare for longer sales cycle and multiple stakeholders".to_string());
    }
    
    if tags.contains(&"startup".to_string()) {
        insights.push("Startup prospect - likely to move quickly but may have budget constraints".to_string());
    }
    
    insights
}

#[allow(dead_code)]
pub fn generate_sample_calendar_events() -> Vec<serde_json::Value> {
    vec![
        serde_json::json!({
            "id": "cal-1",
            "title": "Team Standup",
            "start": "2024-07-01T09:00:00Z",
            "end": "2024-07-01T09:30:00Z",
            "type": "meeting"
        }),
        serde_json::json!({
            "id": "cal-2", 
            "title": "Client Demo",
            "start": "2024-07-01T14:00:00Z",
            "end": "2024-07-01T15:00:00Z",
            "type": "demo"
        }),
        serde_json::json!({
            "id": "cal-3",
            "title": "Sales Pipeline Review",
            "start": "2024-07-01T16:00:00Z", 
            "end": "2024-07-01T17:00:00Z",
            "type": "review"
        })
    ]
} 