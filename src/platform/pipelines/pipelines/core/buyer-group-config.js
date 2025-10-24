#!/usr/bin/env node

/**
 * BUYER GROUP PIPELINE CONFIGURATION
 * 
 * Configuration for buyer group discovery pipeline
 * Mirrors core-pipeline.js structure but optimized for buyer group discovery
 */

module.exports = {
    // Pipeline Performance Settings
    PARALLEL_PROCESSING: true,
    MAX_PARALLEL_COMPANIES: 5, // Conservative for buyer group discovery (more API calls per company)
    REDUCED_DELAYS: true,
    CACHE_ENABLED: true,
    
    // API Rate Limiting
    API_DELAYS: {
        CORESIGNAL_SEARCH: 200,      // 200ms between searches
        CORESIGNAL_COLLECT: 100,     // 100ms between profile collections
        CONTACT_ENRICHMENT: 150,     // 150ms between contact enrichment calls
        VERIFICATION: 300            // 300ms between verification calls
    },
    
    // Cache Settings
    CACHE_TTL_DAYS: 30,
    COMPANY_RESOLUTION_TTL: 7,       // 7 days for company resolution
    BUYER_GROUP_DISCOVERY_TTL: 3,    // 3 days for buyer group discovery
    CONTACT_ENRICHMENT_TTL: 1,       // 1 day for contact enrichment
    
    // Buyer Group Discovery Settings - Optimized for $100K Snowflake Product
    BUYER_GROUP: {
        MIN_SIZE: 4,                 // Focused buying committee for $100K deals
        MAX_SIZE: 14,                // Maximum for mid-market $100K+ contracts
        TARGET_SIZE: 8,              // Ideal size for executive-focused deals
        MIN_INFLUENCE_SCORE: 8.5,    // C-level and VPs only for $100K+ deals
        REQUIRE_DIRECTOR: true,      // Director-level minimum for executive focus
        ALLOW_IC: false,             // No individual contributors for $100K deals
        EARLY_STOP_MODE: 'accuracy_first' // Quality over quantity
    },
    
    // Role Distribution Targets - Optimized for AI/ML ROI Platform
    ROLE_TARGETS: {
        DECISION_MAKERS: { min: 1, max: 3, ideal: 2 },  // CFO, CTO, CPO with budget authority
        CHAMPIONS: { min: 2, max: 5, ideal: 3 },        // VP Data Science, VP Engineering
        STAKEHOLDERS: { min: 1, max: 4, ideal: 3 },     // Director Analytics, BI Leads
        BLOCKERS: { min: 0, max: 1, ideal: 0 },         // Minimize blockers for $100K deals
        INTRODUCERS: { min: 0, max: 2, ideal: 1 }       // RevOps who can introduce to CFO
    },
    
    // Default Seller Profile Configuration - Winning Variant AI Impact Visibility
    DEFAULT_SELLER_PROFILE: {
        productName: "AI Impact Visibility Platform",
        sellerCompanyName: "Winning Variant",
        solutionCategory: "ai_ml_roi_analytics",
        targetMarket: "mid_market",
        dealSize: "$100K+ annually",
        valueProposition: "Close the AI Impact Gap - Measure business ROI of AI initiatives",
        keyMessage: "95% of generative AI pilots are failures - prove your AI ROI",
        deploymentModel: "Snowflake-native (100% inside customer Snowflake account)",
        targetDepartments: ["data science", "product", "engineering", "analytics", "finance"],
        mustHaveTitles: [
            "chief financial officer", "cfo", "chief technology officer", "cto",
            "chief product officer", "cpo", "vp data science", "vp engineering",
            "vp product", "director analytics", "director data science",
            "director engineering", "director product", "vp finance"
        ],
        productPortfolio: [{
            productName: "AI Impact Visibility Platform",
            productCategory: "ai_ml_roi_analytics",
            buyingCommitteeRoles: [
                "CFO", "CTO", "CPO", "VP Data Science", "VP Engineering", 
                "VP Product", "Director Analytics", "Director Data Science",
                "Director Engineering", "Director Product", "VP Finance"
            ]
        }]
    },
    
    // CoreSignal API Configuration
    CORESIGNAL: {
        PREVIEW_LIMIT: 100,          // Preview 100 employees per company
        MAX_COLLECTS: 150,           // Maximum profiles to collect per company
        BATCH_SIZE: 50,              // Batch size for API calls
        USE_CACHE: true,
        CACHE_TTL: 24,               // 24 hours cache TTL
        DRY_RUN: false
    },
    
    // Contact Enrichment Settings
    CONTACT_ENRICHMENT: {
        ENABLE_EMAIL_VERIFICATION: true,
        ENABLE_PHONE_VERIFICATION: true,
        ENABLE_LINKEDIN_ENRICHMENT: true,
        MIN_EMAIL_CONFIDENCE: 70,    // Minimum email confidence score
        MIN_PHONE_CONFIDENCE: 60,    // Minimum phone confidence score
        VERIFICATION_SOURCES: ['lusha', 'zerobounce', 'myemailverifier']
    },
    
    // Output Configuration
    OUTPUT: {
        GENERATE_CSV: true,
        GENERATE_JSON: true,
        SPLIT_BY_ROLE: true,         // Create separate CSV files by role type
        INCLUDE_CONFIDENCE_SCORES: true,
        INCLUDE_REASONING: true,
        INCLUDE_PAIN_SIGNALS: true,
        INCLUDE_OPPORTUNITY_SIGNALS: true
    },
    
    // Quality Thresholds
    QUALITY: {
        MIN_COHESION_SCORE: 60,      // Minimum buyer group cohesion score
        MIN_OVERALL_CONFIDENCE: 70,  // Minimum overall confidence score
        MAX_PROCESSING_TIME: 120000, // 2 minutes max per company
        ENABLE_QUALITY_WARNINGS: true
    },
    
    // Error Handling
    ERROR_HANDLING: {
        MAX_RETRIES: 3,
        RETRY_DELAY: 2000,           // 2 seconds between retries
        GRACEFUL_DEGRADATION: true,  // Continue with partial results
        LOG_ERRORS: true,
        SAVE_FAILED_COMPANIES: true
    },
    
    // Progress Monitoring
    PROGRESS: {
        LOG_INTERVAL: 10,            // Log progress every 10 companies
        SAVE_CHECKPOINTS: true,      // Save progress checkpoints
        CHECKPOINT_INTERVAL: 50,     // Save checkpoint every 50 companies
        ENABLE_REAL_TIME_STATS: true
    }
};
