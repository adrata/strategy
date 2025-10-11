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
    
    // Buyer Group Discovery Settings
    BUYER_GROUP: {
        MIN_SIZE: 8,                 // Minimum buyer group size
        MAX_SIZE: 12,                // Maximum buyer group size
        TARGET_SIZE: 10,             // Ideal buyer group size
        MIN_INFLUENCE_SCORE: 8,      // Minimum influence score for inclusion
        REQUIRE_DIRECTOR: false,     // Include managers and below
        ALLOW_IC: false,             // Include individual contributors
        EARLY_STOP_MODE: 'accuracy_first' // vs 'aggressive'
    },
    
    // Role Distribution Targets
    ROLE_TARGETS: {
        DECISION_MAKERS: { min: 1, max: 3, ideal: 2 },
        CHAMPIONS: { min: 2, max: 4, ideal: 3 },
        STAKEHOLDERS: { min: 3, max: 5, ideal: 4 },
        BLOCKERS: { min: 0, max: 2, ideal: 1 },
        INTRODUCERS: { min: 1, max: 3, ideal: 2 }
    },
    
    // Default Seller Profile Configuration
    DEFAULT_SELLER_PROFILE: {
        productName: "Buyer Group Intelligence Platform",
        sellerCompanyName: "Adrata",
        solutionCategory: "buyer_group_intelligence",
        targetMarket: "enterprise",
        dealSize: "enterprise",
        targetDepartments: ["sales", "revenue operations", "marketing", "finance"],
        mustHaveTitles: [
            "sales director", "vp sales", "revenue operations",
            "marketing director", "vp marketing", "finance director",
            "vp finance", "chief revenue officer", "chief sales officer"
        ],
        productPortfolio: [{
            productName: "Buyer Group Intelligence",
            productCategory: "sales_intelligence",
            buyingCommitteeRoles: [
                "CEO", "CTO", "CFO", "CRO", "VP Sales", "VP Marketing", 
                "VP Finance", "VP Engineering", "Director Sales", "Director Marketing"
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
