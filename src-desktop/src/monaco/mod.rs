use serde_json::{json, Value};

// Monaco Pipeline Configuration
// Note: BrightData integration has been removed - using alternative data sources

// Generate mock company data for Monaco pipeline
async fn generate_mock_company_data(company_name: &str) -> Result<Value, String> {
    println!("🏢 [Monaco] Generating mock data for company: {}", company_name);
    
    // Create realistic mock data based on company name
    let mock_data = json!({
        "records": [
            {
                "company_id": format!("comp_{}", chrono::Utc::now().timestamp_millis()),
                "name": company_name,
                "website": format!("{}.com", company_name.to_lowercase().replace(" ", "")),
                "website_simplified": format!("{}.com", company_name.to_lowercase().replace(" ", "")),
                "industries": "Technology",
                "company_size": "1001-5000 employees",
                "employees_in_linkedin": 2500,
                "headquarters": "San Francisco, CA",
                "country_code": "US",
                "founded": "2015",
                "description": format!("{} is a leading technology company focused on innovation and growth.", company_name),
                "logo": "",
                "specialties": ["Technology", "Software", "Innovation"],
                "followers": 15000,
                "url": format!("https://linkedin.com/company/{}", company_name.to_lowercase().replace(" ", "-")),
                "funding": "Series C",
                "crunchbase_url": format!("https://crunchbase.com/organization/{}", company_name.to_lowercase().replace(" ", "-"))
            }
        ],
        "total_records": 1
    });
    
    println!("✅ [Monaco] Generated mock data for: {}", company_name);
    Ok(mock_data)
}

// Mock data request function (replaces BrightData API)
async fn make_mock_data_request(query: &str, _filter: &Value) -> Result<Value, String> {
    println!("🚀 [Monaco] Generating mock data for query: {}", query);
    
    // Simulate processing delay
    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
    
    let mock_data = generate_mock_company_data(query).await?;
    
    println!("🎉 [Monaco] Mock data generation completed successfully!");
    Ok(mock_data)
}

// MONACO PIPELINE COMMANDS WITH MOCK DATA
#[tauri::command]
pub async fn run_monaco_pipeline(
    company_name: String,
    domain: Option<String>
) -> Result<serde_json::Value, String> {
    println!("🚀 [Monaco] Running Monaco pipeline for company: {}", company_name);
    
    // Use mock data generation instead of BrightData
    let filter = json!({
        "company_name": company_name.to_lowercase()
    });
    
    match make_mock_data_request(&company_name, &filter).await {
        Ok(response) => {
            let pipeline_id = format!("monaco_mock_{}", chrono::Utc::now().timestamp());
            
            Ok(json!({
                "success": true,
                "pipelineId": pipeline_id,
                "company": company_name,
                "domain": domain,
                "status": "completed",
                "dataSource": "Mock Data Generator",
                "records": response.get("records").unwrap_or(&json!([])),
                "totalRecords": response.get("total_records").unwrap_or(&json!(0)),
                "costOptimized": true,
                "cacheEnabled": true
            }))
        },
        Err(e) => {
            println!("❌ [Monaco] Mock data generation failed: {}", e);
            Ok(json!({
                "success": false,
                "error": e,
                "fallback": true,
                "company": company_name,
                "domain": domain
            }))
        }
    }
}

#[tauri::command]
pub async fn get_monaco_enrichment_status(
    _workspace_id: String,
    company_domain: String
) -> Result<serde_json::Value, String> {
    println!("📊 [Monaco] Getting enrichment status for domain: {}", company_domain);
    
    // Simulate checking for enrichment data
    let filter = json!({
        "domain": company_domain.to_lowercase()
    });
    
    match make_mock_data_request(&company_domain, &filter).await {
        Ok(response) => {
            let has_data = response.get("records")
                .and_then(|r| r.as_array())
                .map(|arr| !arr.is_empty())
                .unwrap_or(false);
            
            Ok(json!({
                "domain": company_domain,
                "enrichmentStatus": if has_data { "completed" } else { "not_found" },
                "dataSource": "Mock Data Generator",
                "hasData": has_data,
                "lastUpdated": chrono::Utc::now().to_rfc3339()
            }))
        },
        Err(e) => {
            println!("❌ [Monaco] Enrichment status check failed: {}", e);
            Ok(json!({
                "domain": company_domain,
                "enrichmentStatus": "error",
                "error": e
            }))
        }
    }
}

#[tauri::command]
pub async fn search_companies_monaco(
    _workspace_id: String,
    _user_id: String,
    query: String,
    _search_filters: Option<serde_json::Value>
) -> Result<serde_json::Value, String> {
    println!("🔍 [Monaco] Company search for: '{}' (workspace: {}, user: {})", query, _workspace_id, _user_id);
    
    let search_query = if !query.is_empty() {
        query.clone()
    } else {
        "Technology Company".to_string()
    };
    
    let filter = json!({
        "query": search_query.to_lowercase()
    });
    
    println!("🔍 [Monaco] Filter: {}", filter);
    
    match make_mock_data_request(&search_query, &filter).await {
        Ok(mock_response) => {
            let empty_array = json!([]);
            let records = mock_response.get("records").unwrap_or(&empty_array);
            
            if let Some(records_array) = records.as_array() {
                println!("✅ [Monaco] Generated {} company records", records_array.len());
                
                // Transform company records to Monaco format
                let companies_array: Vec<Value> = records_array.iter()
                    .map(|company| {
                        json!({
                            "id": company.get("company_id").unwrap_or(&json!(format!("comp_{}", chrono::Utc::now().timestamp_millis()))),
                            "name": company.get("name").unwrap_or(&json!("Unknown Company")),
                            "website": company.get("website").unwrap_or(&json!("unknown.com")),
                            "domain": company.get("website_simplified").unwrap_or(&json!("unknown.com")),
                            "industry": company.get("industries").unwrap_or(&json!("Technology")),
                            "size": company.get("company_size").unwrap_or(&json!("Unknown")),
                            "employees": company.get("employees_in_linkedin").unwrap_or(&json!(0)),
                            "location": company.get("headquarters").unwrap_or(&json!("Unknown")),
                            "country": company.get("country_code").unwrap_or(&json!("US")),
                            "founded": company.get("founded").unwrap_or(&json!("")),
                            "description": company.get("description").unwrap_or(&json!("")),
                            "logo": company.get("logo").unwrap_or(&json!("")),
                            "specialties": company.get("specialties").unwrap_or(&json!([])),
                            "followers": company.get("followers").unwrap_or(&json!(0)),
                            "linkedinUrl": company.get("url").unwrap_or(&json!("")),
                            "funding": company.get("funding").unwrap_or(&json!("")),
                            "crunchbaseUrl": company.get("crunchbase_url").unwrap_or(&json!("")),
                            "enrichmentScore": 85, // Good score for mock data
                            "monacoEnriched": true,
                            "dataSource": "Mock Data Generator",
                            "lastUpdated": chrono::Utc::now().to_rfc3339()
                        })
                    })
                    .collect();
                
                println!("✅ [Monaco] Processed {} companies with mock data", companies_array.len());
                
                Ok(json!({
                    "success": true,
                    "companies": companies_array,
                    "count": companies_array.len(),
                    "source": "Mock_Data_Generator"
                }))
            } else {
                println!("⚠️ [Monaco] No mock data generated");
                Ok(json!({
                    "success": true,
                    "companies": [],
                    "count": 0,
                    "source": "Mock_Data_Empty"
                }))
            }
        },
        Err(e) => {
            println!("❌ [Monaco] Mock data generation failed: {}", e);
            
            Ok(json!({
                "success": false,
                "companies": [],
                "count": 0,
                "error": e,
                "query": query,
                "fallback": "Mock data generation unavailable",
                "dataSource": "Error - using fallback"
            }))
        }
    }
}

#[tauri::command]
pub async fn trigger_monaco_enrichment(
    _workspace_id: String,
    _user_id: String,
    company_data: serde_json::Value
) -> Result<serde_json::Value, String> {
    let company_name = company_data.get("name").and_then(|v| v.as_str()).unwrap_or("Unknown");
    let domain = company_data.get("domain").and_then(|v| v.as_str()).unwrap_or("");
    
    println!("🎯 [Monaco] Triggering enrichment for: {} ({})", company_name, domain);
    
    // Use mock data generation for enrichment
    let mut enrichment_results = json!({
        "companyName": company_name,
        "domain": domain,
        "enrichmentId": format!("enrich_mock_{}", chrono::Utc::now().timestamp()),
        "status": "processing",
        "dataSource": "Mock Data Generator",
        "datasets": []
    });
    
    // Generate mock B2B enrichment data
    let b2b_filter = json!({
        "company_name": company_name.to_lowercase()
    });
    
    if let Ok(b2b_data) = make_mock_data_request(company_name, &b2b_filter).await {
        enrichment_results["datasets"].as_array_mut().unwrap().push(json!({
            "dataset": "Mock B2B Enrichment",
            "status": "completed",
            "records": b2b_data.get("records").unwrap_or(&json!([])),
            "datasetId": "mock_b2b_enrichment"
        }));
    }
    
    // Generate mock LinkedIn data
    let linkedin_filter = json!({
        "company_name": company_name.to_lowercase()
    });
    
    if let Ok(linkedin_data) = make_mock_data_request(company_name, &linkedin_filter).await {
        enrichment_results["datasets"].as_array_mut().unwrap().push(json!({
            "dataset": "Mock LinkedIn Companies",
            "status": "completed", 
            "records": linkedin_data.get("records").unwrap_or(&json!([])),
            "datasetId": "mock_linkedin_companies"
        }));
    }
    
    enrichment_results["status"] = json!("completed");
    enrichment_results["completedAt"] = json!(chrono::Utc::now().to_rfc3339());
    
    println!("✅ [Monaco] Mock enrichment completed for: {}", company_name);
    
    Ok(enrichment_results)
}

#[tauri::command]
pub async fn get_monaco_company_details(
    workspace_id: String,
    company_id: String
) -> Result<serde_json::Value, String> {
    println!("🏢 [Monaco] Getting company details for: {} (workspace: {})", company_id, workspace_id);
    
    // Generate mock company details
    let filter = json!({
        "company_id": company_id.to_lowercase()
    });
    
    match make_mock_data_request(&company_id, &filter).await {
        Ok(response) => {
            if let Some(records) = response.get("records").and_then(|r| r.as_array()) {
                if let Some(company_record) = records.first() {
                    Ok(json!({
                        "success": true,
                        "company": {
                            "id": company_id,
                            "name": company_record.get("name").unwrap_or(&json!("Unknown Company")),
                            "domain": company_record.get("website").unwrap_or(&json!("unknown.com")),
                            "industry": company_record.get("industries").unwrap_or(&json!("Technology")),
                            "employees": company_record.get("employees_in_linkedin").unwrap_or(&json!(100)),
                            "revenue": "$10M-$50M",
                            "location": company_record.get("headquarters").unwrap_or(&json!("United States")),
                            "description": company_record.get("description").unwrap_or(&json!("")),
                            "technologies": ["SaaS", "Cloud", "Technology"],
                            "linkedinUrl": company_record.get("url").unwrap_or(&json!("")),
                            "monacoEnrichment": {
                                "basicInfo": {
                                    "founded": company_record.get("founded").unwrap_or(&json!("2020")),
                                    "funding": company_record.get("funding").unwrap_or(&json!("Private"))
                                },
                                "techStack": ["SaaS", "Cloud", "Technology"],
                                "dataSource": "Mock Data Generator",
                                "lastEnriched": chrono::Utc::now().to_rfc3339()
                            }
                        },
                        "dataSource": "Mock Data Generator",
                        "lastUpdated": chrono::Utc::now().to_rfc3339()
                    }))
                } else {
                    Ok(json!({
                        "success": false,
                        "error": "Company not found in mock data",
                        "companyId": company_id
                    }))
                }
            } else {
                Ok(json!({
                    "success": false,
                    "error": "No records returned from mock data generator",
                    "companyId": company_id
                }))
            }
        },
        Err(e) => {
            println!("❌ [Monaco] Failed to get company details: {}", e);
            Ok(json!({
                "success": false,
                "error": e,
                "companyId": company_id,
                "fallback": true
            }))
        }
    }
}

// TEST COMMAND: Mock data generation test
#[tauri::command]
pub async fn test_mock_data_api() -> Result<serde_json::Value, String> {
    println!("🧪 [Monaco] Testing mock data generation...");
    
    // Simple test for mock data generation
    let test_filter = json!({
        "test": "large_companies"
    });
    
    match make_mock_data_request("Test Company", &test_filter).await {
        Ok(result) => {
            println!("✅ [Monaco] Test successful! Got result: {}", result);
            Ok(json!({
                "success": true,
                "message": "Mock data generation test successful",
                "data": result
            }))
        },
        Err(e) => {
            println!("❌ [Monaco] Test failed: {}", e);
            Ok(json!({
                "success": false,
                "error": e,
                "message": "Mock data generation test failed"
            }))
        }
    }
} 