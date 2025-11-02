/**
 * Human Capital Management Module
 * Backend support for FOS (Founder Operating System) and HOS (Hiring Operating System)
 * 
 * FOS = One-person business OS (sales, marketing, product, operations, basic hiring)
 * HOS = Specialized hiring/recruitment OS (advanced HR, recruiting, team management)
 */

use serde_json::json;
use chrono::Utc;

// =============================================================================
// FOS (FOUNDER OPERATING SYSTEM) COMMANDS
// One-person business OS covering sales, marketing, product, operations & basic hiring
// =============================================================================

#[tauri::command]
pub async fn get_founder_business_plan(
    founder_id: String,
    company_stage: String
) -> Result<serde_json::Value, String> {
    println!("👨‍💼 [FOS] Getting comprehensive business plan for founder: {}, stage: {}", founder_id, company_stage);
    
    // Generate comprehensive one-person business plan
    let business_plan = match company_stage.as_str() {
        "idea" => json!({
            "sales": {
                "priority": "immediate",
                "activities": ["Validate problem", "Find first 10 customers", "Get letters of intent"],
                "tools": ["Cold outreach", "LinkedIn", "Industry forums"],
                "timeline": "Next 30 days"
            },
            "product": {
                "priority": "immediate", 
                "activities": ["Build MVP", "Get user feedback", "Iterate quickly"],
                "tools": ["No-code tools", "Simple tech stack", "User testing"],
                "timeline": "Next 60 days"
            },
            "marketing": {
                "priority": "medium",
                "activities": ["Build landing page", "Start content creation", "Network"],
                "tools": ["Website", "Social media", "Founder story"],
                "timeline": "Next 90 days"
            },
            "operations": {
                "priority": "low",
                "activities": ["Set up basic accounting", "Legal structure", "Banking"],
                "tools": ["QuickBooks", "Legal Zoom", "Business bank"],
                "timeline": "Next 90 days"
            },
            "hiring": {
                "priority": "future",
                "activities": ["Consider co-founder", "Plan first hire"],
                "timeline": "3-6 months"
            }
        }),
        "mvp" => json!({
            "sales": {
                "priority": "immediate",
                "activities": ["Convert early users", "Build sales process", "Get paying customers"],
                "tools": ["CRM setup", "Sales scripts", "Pricing strategy"],
                "timeline": "Next 30 days"
            },
            "product": {
                "priority": "immediate",
                "activities": ["Improve based on feedback", "Add key features", "Fix bugs"],
                "tools": ["User analytics", "Feature roadmap", "Bug tracking"],
                "timeline": "Ongoing"
            },
            "marketing": {
                "priority": "high",
                "activities": ["Content marketing", "SEO", "Paid ads testing"],
                "tools": ["Blog", "Google Ads", "Social proof"],
                "timeline": "Next 60 days"
            },
            "operations": {
                "priority": "medium",
                "activities": ["Customer support", "Billing system", "Operations"],
                "tools": ["Support desk", "Stripe", "Process docs"],
                "timeline": "Next 60 days"
            },
            "hiring": {
                "priority": "planning",
                "activities": ["Plan first engineer hire", "Consider virtual assistant"],
                "budget": 80000,
                "timeline": "Next 90 days"
            }
        }),
        "early" => json!({
            "sales": {
                "priority": "high",
                "activities": ["Scale sales process", "Hire sales help", "Enterprise deals"],
                "tools": ["Advanced CRM", "Sales automation", "Account management"],
                "timeline": "Ongoing"
            },
            "product": {
                "priority": "high",
                "activities": ["Product roadmap", "Feature planning", "Quality focus"],
                "tools": ["Product management", "Development team", "QA process"],
                "timeline": "Ongoing"
            },
            "marketing": {
                "priority": "high",
                "activities": ["Demand generation", "Brand building", "PR"],
                "tools": ["Marketing automation", "Brand guidelines", "Media relations"],
                "timeline": "Ongoing"
            },
            "operations": {
                "priority": "medium",
                "activities": ["Scale operations", "Automate processes", "Compliance"],
                "tools": ["ERP systems", "Automation tools", "Legal support"],
                "timeline": "Next 6 months"
            },
            "hiring": {
                "priority": "immediate",
                "activities": ["Hire key team members", "Build hiring process"],
                "budget": 300000,
                "timeline": "Next 60 days"
            }
        }),
        _ => json!({})
    };
    
    Ok(json!({
        "founderId": founder_id,
        "companyStage": company_stage,
        "businessPlan": business_plan,
        "currentFocus": match company_stage.as_str() {
            "idea" => "Product validation and customer discovery",
            "mvp" => "Converting users to paying customers",
            "early" => "Scaling team and operations",
            _ => "Business planning"
        },
        "keyActivities": match company_stage.as_str() {
            "idea" => vec!["Validate problem", "Build MVP", "Find customers"],
            "mvp" => vec!["Get paying customers", "Improve product", "Build marketing"],
            "early" => vec!["Scale sales", "Hire team", "Optimize operations"],
            _ => vec!["Plan next steps"]
        }
    }))
}

#[tauri::command]
pub async fn get_essential_team(founder_id: String) -> Result<serde_json::Value, String> {
    println!("👥 [FOS] Getting essential team for founder: {}", founder_id);
    
    // Mock essential team data - in real implementation, this would come from database
    let team_members = json!([
        {
            "memberId": "tm_001",
            "name": "Alex Johnson",
            "role": "Co-founder & CTO", 
            "joinedDate": "2024-01-15",
            "contribution": "Technical leadership and product development",
            "foundingTeam": true,
            "equity": 25.0,
            "currentStage": "core-team"
        },
        {
            "memberId": "tm_002", 
            "name": "Sarah Chen",
            "role": "Senior Engineer",
            "joinedDate": "2024-03-01",
            "contribution": "Full-stack development and architecture",
            "foundingTeam": false,
            "equity": 2.0,
            "currentStage": "core-team"
        }
    ]);
    
    Ok(json!({
        "founderId": founder_id,
        "teamMembers": team_members,
        "teamSize": team_members.as_array().unwrap().len(),
        "foundingTeamCount": team_members.as_array().unwrap()
            .iter()
            .filter(|member| member.get("foundingTeam").and_then(|f| f.as_bool()).unwrap_or(false))
            .count()
    }))
}

#[tauri::command]
pub async fn assess_hiring_os_upgrade(
    founder_id: String,
    team_size: i32,
    monthly_hires: i32,
    hiring_complexity: String
) -> Result<serde_json::Value, String> {
    println!("🚀 [FOS] Assessing Hiring OS upgrade for founder: {} (current team: {})", founder_id, team_size);
    
    let mut reasons = vec![];
    let mut score = 0;
    
    // Hiring volume assessment
    if monthly_hires >= 5 {
        reasons.push("High hiring volume (5+ hires/month)".to_string());
        score += 40;
    } else if monthly_hires >= 2 {
        reasons.push("Moderate hiring activity (2+ hires/month)".to_string());
        score += 20;
    } else {
        reasons.push(format!("Monthly hires: {} (consider Hiring OS at 2+ hires/month)", monthly_hires));
    }
    
    // Team size and hiring needs
    if team_size >= 20 {
        reasons.push("Large team requiring structured hiring".to_string());
        score += 30;
    } else if team_size >= 10 {
        reasons.push("Growing team - hiring processes becoming important".to_string());
        score += 15;
    } else {
        reasons.push(format!("Team size: {} (Hiring OS most valuable at 10+ people)", team_size));
    }
    
    // Hiring complexity assessment
    match hiring_complexity.as_str() {
        "complex" => {
            reasons.push("Complex hiring needs (multiple roles, departments)".to_string());
            score += 30;
        },
        "moderate" => {
            reasons.push("Moderate hiring complexity".to_string());
            score += 15;
        },
        _ => {
            reasons.push("Simple hiring needs - FOS sufficient for now".to_string());
        }
    }
    
    let ready = score >= 60;
    let recommendation = if ready {
        "Ready to upgrade to Hiring OS for specialized recruitment tools!"
    } else {
        "Continue with FOS hiring features. Upgrade to Hiring OS when you have 2+ hires/month or complex recruiting needs"
    };
    
    Ok(json!({
        "founderId": founder_id,
        "ready": ready,
        "score": score,
        "reasons": reasons,
        "recommendation": recommendation,
        "upgradeThresholds": {
            "monthlyHires": 2,
            "teamSize": 10,
            "hiringComplexity": "moderate"
        },
        "currentMetrics": {
            "teamSize": team_size,
            "monthlyHires": monthly_hires,
            "hiringComplexity": hiring_complexity
        }
    }))
}

#[tauri::command]
pub async fn initiate_hos_upgrade(founder_id: String) -> Result<serde_json::Value, String> {
    println!("⬆️ [FOS] Initiating HOS upgrade for founder: {}", founder_id);
    
    let migration_plan = vec![
        "Migrate team data to HOS",
        "Set up advanced recruitment pipeline", 
        "Enable performance management system",
        "Configure career pathing workflows",
        "Activate retention analytics",
        "Set up departmental hiring workflows",
        "Enable HR compliance features",
        "Migrate founder hiring plan to enterprise templates"
    ];
    
    Ok(json!({
        "founderId": founder_id,
        "success": true,
        "migrationPlan": migration_plan,
        "timeline": "2-3 business days",
        "migrationId": format!("migration_{}", Utc::now().timestamp()),
        "estimatedDowntime": "< 1 hour",
        "dataPreservation": "100% - no data loss during upgrade"
    }))
}

// =============================================================================
// HOS (HIRING OPERATING SYSTEM) COMMANDS  
// Specialized recruitment and hiring management for any company size
// =============================================================================

#[tauri::command]
pub async fn get_recruitment_pipelines(
    organization_id: String,
    user_id: String
) -> Result<serde_json::Value, String> {
    println!("🏢 [HOS] Getting recruitment pipelines for org: {}", organization_id);
    
    // Mock recruitment pipeline data
    let pipelines = json!([
        {
            "jobId": "job_001",
            "jobTitle": "Senior Software Engineer",
            "department": "Engineering",
            "priority": "high",
            "status": "active",
            "candidatesInPipeline": 12,
            "stageDistribution": {
                "applied": 5,
                "screening": 3,
                "interview": 3,
                "offer": 1
            },
            "timeToFillTarget": 30,
            "actualTimeToFill": 18,
            "posted": "2024-07-01",
            "budget": "$120,000 - $150,000"
        },
        {
            "jobId": "job_002", 
            "jobTitle": "Product Manager",
            "department": "Product",
            "priority": "medium",
            "status": "active",
            "candidatesInPipeline": 8,
            "stageDistribution": {
                "applied": 3,
                "screening": 2,
                "interview": 2,
                "offer": 1
            },
            "timeToFillTarget": 45,
            "actualTimeToFill": null,
            "posted": "2024-07-15",
            "budget": "$100,000 - $130,000"
        }
    ]);
    
    Ok(json!({
        "organizationId": organization_id,
        "userId": user_id,
        "pipelines": pipelines,
        "totalJobs": pipelines.as_array().unwrap().len(),
        "totalCandidates": pipelines.as_array().unwrap()
            .iter()
            .filter_map(|job| job.get("candidatesInPipeline").and_then(|c| c.as_u64()))
            .sum::<u64>()
    }))
}

#[tauri::command]
pub async fn get_candidate_profiles(
    organization_id: String,
    job_id: String
) -> Result<serde_json::Value, String> {
    println!("👥 [HOS] Getting candidate profiles for job: {}", job_id);
    
    // Mock candidate data
    let candidates = json!([
        {
            "candidateId": "cand_001",
            "name": "Emily Rodriguez",
            "email": "emily.rodriguez@email.com",
            "phone": "+1-555-0123",
            "currentStage": "interview",
            "source": "LinkedIn",
            "qualificationScore": 85,
            "culturalFitScore": 78,
            "skillsMatch": 92,
            "interviewFeedback": [
                {
                    "interviewer": "Tech Lead",
                    "rating": 4,
                    "notes": "Strong technical skills, good communication"
                }
            ],
            "expectedSalary": 140000,
            "noticePeriod": 30,
            "applied": "2024-07-10"
        },
        {
            "candidateId": "cand_002",
            "name": "Michael Chen", 
            "email": "michael.chen@email.com",
            "phone": "+1-555-0124",
            "currentStage": "screening",
            "source": "Referral",
            "qualificationScore": 78,
            "culturalFitScore": 88,
            "skillsMatch": 82,
            "interviewFeedback": [],
            "expectedSalary": 135000,
            "noticePeriod": 15,
            "applied": "2024-07-12"
        }
    ]);
    
    Ok(json!({
        "organizationId": organization_id,
        "jobId": job_id,
        "candidates": candidates,
        "totalCandidates": candidates.as_array().unwrap().len(),
        "averageQualificationScore": candidates.as_array().unwrap()
            .iter()
            .filter_map(|c| c.get("qualificationScore").and_then(|s| s.as_f64()))
            .sum::<f64>() / candidates.as_array().unwrap().len() as f64
    }))
}

#[tauri::command]
pub async fn create_job_posting(
    organization_id: String,
    user_id: String,
    job_data: serde_json::Value
) -> Result<serde_json::Value, String> {
    println!("📝 [HOS] Creating job posting for org: {}", organization_id);
    
    let job_id = format!("job_{}", Utc::now().timestamp());
    let title = job_data.get("title").and_then(|t| t.as_str()).unwrap_or("Untitled Position");
    let department = job_data.get("department").and_then(|d| d.as_str()).unwrap_or("General");
    
    Ok(json!({
        "success": true,
        "jobPosting": {
            "jobId": job_id,
            "title": title,
            "department": department,
            "organizationId": organization_id,
            "createdBy": user_id,
            "status": "draft",
            "created": Utc::now().to_rfc3339(),
            "postedChannels": []
        }
    }))
}

#[tauri::command]
pub async fn get_organizational_health(
    organization_id: String,
    user_id: String
) -> Result<serde_json::Value, String> {
    println!("💪 [HOS] Getting organizational health for org: {}", organization_id);
    
    Ok(json!({
        "organizationId": organization_id,
        "userId": user_id,
        "metrics": {
            "totalEmployees": 45,
            "activeRequisitions": 3,
            "avgTimeToHire": 25,
            "turnoverRate": 8.5,
            "engagementScore": 78,
            "diversityMetrics": {
                "genderBalance": 52,
                "ethnicDiversity": 34,
                "ageDistribution": "Balanced"
            },
            "skillsCoverage": 82,
            "successionReadiness": 65
        },
        "trends": {
            "employeeGrowth": "+15% YoY",
            "retentionImprovement": "+12% vs last year",
            "satisfactionTrend": "Improving"
        },
        "alerts": [
            {
                "type": "warning",
                "message": "Engineering department approaching capacity",
                "action": "Consider hiring 2-3 additional engineers"
            }
        ]
    }))
}

// =============================================================================
// OPERATING SYSTEM DETECTION & SWITCHING
// =============================================================================

#[tauri::command]
pub async fn get_active_operating_system(
    user_id: String,
    workspace_id: String
) -> Result<serde_json::Value, String> {
    println!("🎯 [OS] Getting active operating system for user: {}, workspace: {}", user_id, workspace_id);
    
    // In real implementation, this would check user preferences and company size
    // For now, return mock data based on workspace pattern
    let (operating_system, reason) = if workspace_id.contains("founder") || workspace_id.contains("startup") {
        ("FOS", "Founder/startup workspace detected")
    } else if workspace_id.contains("enterprise") || workspace_id.contains("corp") {
        ("HOS", "Enterprise workspace detected") 
    } else {
        ("AOS", "Default to Acquisition Operating System")
    };
    
    Ok(json!({
        "userId": user_id,
        "workspaceId": workspace_id,
        "activeOS": operating_system,
        "reason": reason,
        "availableOS": ["AOS", "ROS", "EOS", "HOS", "FOS", "AREOS"],
        "canSwitch": true
    }))
}

#[tauri::command]
pub async fn switch_operating_system(
    user_id: String,
    workspace_id: String,
    target_os: String
) -> Result<serde_json::Value, String> {
    println!("🔄 [OS] Switching to {} for user: {}, workspace: {}", target_os, user_id, workspace_id);
    
    // Validate operating system
    let valid_systems = ["AOS", "ROS", "EOS", "HOS", "FOS", "AREOS"];
    if !valid_systems.contains(&target_os.as_str()) {
        return Err(format!("Invalid operating system: {}. Valid options: {:?}", target_os, valid_systems));
    }
    
    // Check availability (in real implementation, check permissions and company stage)
    let available = match target_os.as_str() {
        "AOS" => true,
        "FOS" => true, // Always available for founders
        "HOS" => true, // Available if company has 15+ employees  
        _ => false // ROS, EOS, AREOS coming soon
    };
    
    if !available {
        return Ok(json!({
            "success": false,
            "error": format!("{} is not yet available. Coming soon!", target_os),
            "availableNow": ["AOS", "FOS", "HOS"]
        }));
    }
    
    Ok(json!({
        "success": true,
        "previousOS": "AOS", // Would track actual previous state
        "newOS": target_os,
        "userId": user_id,
        "workspaceId": workspace_id,
        "switchedAt": Utc::now().to_rfc3339(),
        "message": format!("Successfully switched to {}", target_os)
    }))
} 