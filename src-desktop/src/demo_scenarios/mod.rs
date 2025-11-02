use serde_json::Value;

/// Demo scenarios commands for desktop application
/// These mirror the demo scenarios API endpoints for complete parity

#[tauri::command]
pub async fn get_demo_scenarios() -> Result<Value, String> {
    println!("📊 [TAURI DEMO] Loading demo scenarios...");
    
    // Mock demo scenarios - in real implementation, query database
    let scenarios = vec![
        serde_json::json!({
            "id": "zeropoint-cyber",
            "name": "ZeroPoint Cybersecurity",
            "slug": "zeropoint-cyber",
            "description": "Quantum-resistant cybersecurity solutions",
            "industry": "Cybersecurity",
            "target_audience": "Enterprise IT Security",
            "config": {
                "company_size": "500-1000",
                "revenue_range": "$50M-$100M",
                "growth_stage": "Series B"
            },
            "branding": {
                "primary_color": "#1a365d",
                "logo_url": "/logos/zeropoint.png"
            },
            "features": ["quantum_encryption", "threat_detection", "compliance_automation"]
        }),
        serde_json::json!({
            "id": "retail-solutions",
            "name": "Retail Product Solutions",
            "slug": "retail-solutions",
            "description": "AI-powered retail optimization platform",
            "industry": "Retail Technology",
            "target_audience": "Retail Operations",
            "config": {
                "company_size": "100-500",
                "revenue_range": "$10M-$50M",
                "growth_stage": "Series A"
            },
            "branding": {
                "primary_color": "#2d3748",
                "logo_url": "/logos/retail-solutions.png"
            },
            "features": ["inventory_optimization", "demand_forecasting", "customer_analytics"]
        })
    ];
    
    println!("✅ [TAURI DEMO] Loaded {} scenarios", scenarios.len());
    
    Ok(serde_json::json!({
        "success": true,
        "scenarios": scenarios
    }))
}

#[tauri::command]
pub async fn get_demo_scenario_by_slug(slug: String) -> Result<Value, String> {
    println!("📊 [TAURI DEMO] Loading scenario: {}", slug);
    
    // Mock scenario lookup - in real implementation, query database
    let scenario = match slug.as_str() {
        "zeropoint-cyber" => Some(serde_json::json!({
            "id": "zeropoint-cyber",
            "name": "ZeroPoint Cybersecurity",
            "slug": "zeropoint-cyber",
            "description": "Quantum-resistant cybersecurity solutions for enterprise protection against future quantum computing threats",
            "industry": "Cybersecurity",
            "target_audience": "Enterprise IT Security Teams",
            "config": {
                "company_size": "500-1000",
                "revenue_range": "$50M-$100M",
                "growth_stage": "Series B",
                "funding_raised": "$25M",
                "headquarters": "San Francisco, CA"
            },
            "branding": {
                "primary_color": "#1a365d",
                "secondary_color": "#2b6cb0",
                "logo_url": "/logos/zeropoint.png"
            },
            "features": ["quantum_encryption", "threat_detection", "compliance_automation", "zero_trust_architecture"],
            "demo_user": {
                "name": "Dan Mirolli",
                "role": "VP of Sales",
                "email": "dan@zeropoint.com"
            }
        })),
        "retail-solutions" => Some(serde_json::json!({
            "id": "retail-solutions",
            "name": "Retail Product Solutions",
            "slug": "retail-solutions",
            "description": "AI-powered retail optimization platform for inventory and customer experience",
            "industry": "Retail Technology",
            "target_audience": "Retail Operations Teams",
            "config": {
                "company_size": "100-500",
                "revenue_range": "$10M-$50M",
                "growth_stage": "Series A",
                "funding_raised": "$8M",
                "headquarters": "Austin, TX"
            },
            "branding": {
                "primary_color": "#2d3748",
                "secondary_color": "#4a5568",
                "logo_url": "/logos/retail-solutions.png"
            },
            "features": ["inventory_optimization", "demand_forecasting", "customer_analytics", "supply_chain_automation"],
            "demo_user": {
                "name": "Sarah Chen",
                "role": "Head of Sales",
                "email": "sarah@retailsolutions.com"
            }
        })),
        _ => None
    };
    
    match scenario {
        Some(s) => {
            println!("✅ [TAURI DEMO] Loaded scenario: {}", s["name"]);
            Ok(serde_json::json!({
                "success": true,
                "scenario": s
            }))
        },
        None => {
            println!("❌ [TAURI DEMO] Scenario not found: {}", slug);
            Ok(serde_json::json!({
                "success": false,
                "error": "Scenario not found",
                "scenario": null
            }))
        }
    }
}

#[tauri::command]
pub async fn get_demo_prospects(scenario: Option<String>, limit: Option<i32>) -> Result<Value, String> {
    let scenario_name = scenario.unwrap_or_else(|| "default".to_string());
    let prospect_limit = limit.unwrap_or(20);
    
    println!("📊 [TAURI DEMO] Loading prospects for scenario: {}, limit: {}", scenario_name, prospect_limit);
    
    // Mock prospects data based on scenario
    let prospects = match scenario_name.as_str() {
        "zeropoint-cyber" => generate_cybersecurity_prospects(prospect_limit),
        "retail-solutions" => generate_retail_prospects(prospect_limit),
        _ => generate_default_prospects(prospect_limit)
    };
    
    println!("✅ [TAURI DEMO] Loaded {} prospects", prospects.len());
    
    Ok(serde_json::json!({
        "success": true,
        "prospects": prospects
    }))
}

#[tauri::command]
pub async fn get_demo_companies(scenario: Option<String>) -> Result<Value, String> {
    let scenario_name = scenario.unwrap_or_else(|| "default".to_string());
    
    println!("📊 [TAURI DEMO] Loading companies for scenario: {}", scenario_name);
    
    // Mock companies data
    let companies = vec![
        serde_json::json!({
            "id": "comp_1",
            "name": "TechCorp Industries",
            "domain": "techcorp.com",
            "industry": "Technology",
            "size": "1000-5000",
            "revenue": "$100M-$500M",
            "location": "San Francisco, CA"
        }),
        serde_json::json!({
            "id": "comp_2",
            "name": "Global Retail Inc",
            "domain": "globalretail.com",
            "industry": "Retail",
            "size": "5000+",
            "revenue": "$1B+",
            "location": "New York, NY"
        })
    ];
    
    println!("✅ [TAURI DEMO] Loaded {} companies", companies.len());
    
    Ok(serde_json::json!({
        "success": true,
        "companies": companies
    }))
}

#[tauri::command]
pub async fn get_demo_people(scenario: Option<String>) -> Result<Value, String> {
    let scenario_name = scenario.unwrap_or_else(|| "default".to_string());
    
    println!("📊 [TAURI DEMO] Loading people for scenario: {}", scenario_name);
    
    // Mock people data
    let people = vec![
        serde_json::json!({
            "id": "person_1",
            "name": "John Smith",
            "title": "CTO",
            "company": "TechCorp Industries",
            "email": "john.smith@techcorp.com",
            "linkedin": "linkedin.com/in/johnsmith"
        }),
        serde_json::json!({
            "id": "person_2",
            "name": "Sarah Johnson",
            "title": "VP of Operations",
            "company": "Global Retail Inc",
            "email": "sarah.johnson@globalretail.com",
            "linkedin": "linkedin.com/in/sarahjohnson"
        })
    ];
    
    println!("✅ [TAURI DEMO] Loaded {} people", people.len());
    
    Ok(serde_json::json!({
        "success": true,
        "people": people
    }))
}

#[tauri::command]
pub async fn get_demo_sellers(scenario: Option<String>) -> Result<Value, String> {
    let scenario_name = scenario.unwrap_or_else(|| "default".to_string());
    
    println!("📊 [TAURI DEMO] Loading sellers for scenario: {}", scenario_name);
    
    // Mock sellers data
    let sellers = vec![
        serde_json::json!({
            "id": "seller_1",
            "name": "Dan Mirolli",
            "role": "VP of Sales",
            "email": "dan@adrata.com",
            "quota": "$1M",
            "performance": "125%"
        }),
        serde_json::json!({
            "id": "seller_2",
            "name": "Ross Sylvester",
            "role": "Sales Director",
            "email": "ross@adrata.com",
            "quota": "$750K",
            "performance": "110%"
        })
    ];
    
    println!("✅ [TAURI DEMO] Loaded {} sellers", sellers.len());
    
    Ok(serde_json::json!({
        "success": true,
        "sellers": sellers
    }))
}

// Helper functions to generate scenario-specific data

fn generate_cybersecurity_prospects(limit: i32) -> Vec<Value> {
    (0..limit).map(|i| {
        serde_json::json!({
            "id": format!("cyber_prospect_{}", i),
            "name": format!("Security Lead {}", i + 1),
            "company": format!("SecureTech {}", i + 1),
            "title": "CISO",
            "industry": "Cybersecurity",
            "buying_signals": ["budget_approved", "security_incident", "compliance_deadline"],
            "score": 85 + (i % 15)
        })
    }).collect()
}

fn generate_retail_prospects(limit: i32) -> Vec<Value> {
    (0..limit).map(|i| {
        serde_json::json!({
            "id": format!("retail_prospect_{}", i),
            "name": format!("Retail Manager {}", i + 1),
            "company": format!("RetailCorp {}", i + 1),
            "title": "VP of Operations",
            "industry": "Retail",
            "buying_signals": ["inventory_issues", "seasonal_planning", "cost_reduction"],
            "score": 75 + (i % 20)
        })
    }).collect()
}

fn generate_default_prospects(limit: i32) -> Vec<Value> {
    (0..limit).map(|i| {
        serde_json::json!({
            "id": format!("prospect_{}", i),
            "name": format!("Business Lead {}", i + 1),
            "company": format!("Company {}", i + 1),
            "title": "Director",
            "industry": "Technology",
            "buying_signals": ["growth_phase", "funding_raised"],
            "score": 70 + (i % 25)
        })
    }).collect()
}
