// AI Twin Simulation Types - Breakthrough Innovation

// AI Twin Persona Types
export interface AITwinPersona {
  id: string;
  personId: string;
  name: string;
  title: string;
  department: string;

  // AI-Generated Personality Profile
  personalityTraits: {
    decisionMakingStyle:
      | "analytical"
      | "intuitive"
      | "consensus-builder"
      | "risk-averse"
      | "aggressive";
    communicationPreference:
      | "data-driven"
      | "relationship-focused"
      | "results-oriented"
      | "detail-oriented";
    influenceStyle: "direct" | "collaborative" | "persuasive" | "authoritative";
    riskTolerance: "high" | "medium" | "low";
    timeOrientation: "urgent" | "deliberate" | "patient";
    stakeholderPriorities: string[];
    emotionalDrivers: string[];
    logicalDrivers: string[];
  };

  // Behavioral Patterns (AI-Learned)
  behaviorProfile: {
    typicalObjections: Array<{
      objection: string;
      likelihood: number; // 0-1
      context: string;
      counterStrategy: string;
    }>;
    motivationTriggers: Array<{
      trigger: string;
      effectiveness: number; // 0-1
      timing: "early" | "middle" | "late";
    }>;
    decisionCriteria: Array<{
      criterion: string;
      weight: number; // 0-1
      type:
        | "financial"
        | "technical"
        | "strategic"
        | "operational"
        | "compliance";
    }>;
    influenceMap: Array<{
      personId: string;
      relationshipType:
        | "reports-to"
        | "peer"
        | "manages"
        | "advises"
        | "vendor";
      influenceLevel: number; // 0-1
    }>;
  };

  // Contextual State
  currentState: {
    engagement:
      | "cold"
      | "aware"
      | "interested"
      | "evaluating"
      | "committed"
      | "champion";
    sentiment: "negative" | "neutral" | "positive" | "enthusiastic";
    urgency: "low" | "medium" | "high";
    budget_authority: "none" | "influence" | "approve" | "decide";
    last_interaction: Date;
    confidence_level: number; // 0-1
  };

  // AI Capabilities
  ai_capabilities: {
    response_model: "gpt-4" | "claude-3" | "hybrid";
    context_window: string; // All their enriched data for prompt context
    memory_embeddings: number[]; // Vector representation of their knowledge/preferences
    learning_rate: number; // How quickly they adapt based on interactions
  };
}

// Simulation Scenario Types
export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  type:
    | "cold_outreach"
    | "warm_intro"
    | "demo_request"
    | "pricing_discussion"
    | "objection_handling"
    | "close_attempt";

  // Scenario Parameters
  context: {
    timing: string; // e.g., "Q4 budget season", "Post-earnings call"
    market_conditions: string;
    company_state: string; // e.g., "Growth mode", "Cost-cutting"
    competitive_pressure: "none" | "low" | "medium" | "high";
    urgency_factors: string[];
  };

  // Input Actions
  seller_actions: Array<{
    action_type:
      | "email"
      | "call"
      | "demo"
      | "proposal"
      | "social_touch"
      | "content_share";
    content: string;
    timing: string;
    channel: string;
    personalization_level: "none" | "basic" | "high" | "ultra";
  }>;
}

// Simulation Results Types
export interface SimulationResult {
  scenario_id: string;
  company_id: string;
  buyer_group_id: string;

  // Individual AI Twin Responses
  ai_twin_responses: Array<{
    persona_id: string;
    persona_name: string;
    response: string;
    sentiment_change: number; // -1 to 1
    engagement_change: number; // -1 to 1
    objections_raised: string[];
    questions_asked: string[];
    next_actions_suggested: string[];
    influence_on_others: Array<{
      target_persona_id: string;
      influence_type: "positive" | "negative" | "neutral";
      strength: number; // 0-1
    }>;
  }>;

  // Group Dynamics Simulation
  group_dynamics: {
    consensus_level: number; // 0-1
    resistance_level: number; // 0-1
    momentum: number; // -1 to 1
    coalition_formation: Array<{
      members: string[];
      stance: "supporter" | "neutral" | "opposed";
      strength: number;
    }>;
    key_influencer_positions: Array<{
      persona_id: string;
      position: "champion" | "blocker" | "neutral";
      influence_radius: string[];
    }>;
  };

  // Optimization Insights
  optimization_insights: {
    fastest_path_to_close: Array<{
      step: number;
      action: string;
      target_personas: string[];
      expected_outcome: string;
      success_probability: number;
      timing: string;
    }>;
    biggest_risks: Array<{
      risk: string;
      probability: number;
      impact: "high" | "medium" | "low";
      mitigation_strategy: string;
    }>;
    optimal_messaging: Array<{
      persona_id: string;
      message_type: string;
      content_themes: string[];
      timing_preference: string;
      channel_preference: string;
    }>;
    resource_allocation: Array<{
      persona_id: string;
      time_investment: "high" | "medium" | "low";
      effort_type: "technical" | "relationship" | "financial" | "strategic";
      expected_roi: number;
    }>;
  };

  // Predictive Analytics
  predictions: {
    deal_probability: number; // 0-1
    expected_timeline: string;
    likely_deal_size: number;
    confidence_interval: [number, number];
    key_success_factors: string[];
    alternative_outcomes: Array<{
      outcome: string;
      probability: number;
      triggers: string[];
    }>;
  };

  // Learning Data for Strategic Memory Engine
  learning_data: {
    successful_strategies: string[];
    failed_strategies: string[];
    persona_behavior_updates: Array<{
      persona_id: string;
      behavior_change: string;
      confidence: number;
    }>;
    group_dynamic_patterns: string[];
  };

  simulation_timestamp: Date;
  simulation_duration_ms: number;
  simulation_quality_score: number; // 0-1
}

// Strategic Intelligence Types
export interface NextBestAction {
  persona_id: string;
  persona_name: string;
  action_type:
    | "EMAIL"
    | "CALL"
    | "MEETING"
    | "SHARE_CONTENT"
    | "INTRODUCTION"
    | "DEMO"
    | "PROPOSAL";
  subject?: string; // For email
  key_talking_points: string[];
  suggested_script_preview: string;
  predicted_outcome: string;
  success_probability: number;
  reasoning: string;
  timing_recommendation:
    | "IMMEDIATE"
    | "NEXT_BUSINESS_DAY"
    | "WITHIN_3_DAYS"
    | "NEXT_WEEK";
  channel_preference:
    | "email"
    | "phone"
    | "linkedin"
    | "video_call"
    | "in_person";
  personalization_context: {
    recent_activity?: string;
    shared_connections?: string[];
    content_interests?: string[];
    communication_style:
      | "formal"
      | "casual"
      | "data_driven"
      | "relationship_focused";
  };
}

export interface DealHealthMetrics {
  overall_score: number; // 0-100
  momentum: "accelerating" | "steady" | "stalling" | "declining";
  risk_level: "low" | "medium" | "high" | "critical";
  engagement_quality: number; // 0-100
  stakeholder_coverage: number; // 0-100
  competitive_pressure: "none" | "low" | "medium" | "high";
  timeline_health: "on_track" | "ahead" | "behind" | "stalled";
  key_risks: Array<{
    risk: string;
    probability: number;
    impact: "low" | "medium" | "high";
    mitigation: string;
  }>;
  success_indicators: string[];
}

export interface ManagerInsights {
  team_performance: {
    deal_velocity_trends: Array<{
      rep_name: string;
      avg_days_to_close: number;
      trend: "improving" | "stable" | "declining";
    }>;
    win_rate_patterns: Array<{
      rep_name: string;
      win_rate: number;
      best_practices: string[];
    }>;
    coaching_opportunities: Array<{
      rep_name: string;
      skill_gap: string;
      recommended_action: string;
      priority: "high" | "medium" | "low";
    }>;
  };
  pipeline_health: {
    deals_at_risk: number;
    deals_accelerating: number;
    total_pipeline_value: number;
    forecast_accuracy: number;
  };
  resource_optimization: Array<{
    recommendation: string;
    impact: "high" | "medium" | "low";
    effort: "low" | "medium" | "high";
    timeline: string;
  }>;
}

export interface CROStrategicIntelligence {
  market_positioning: {
    competitive_win_rate: Record<string, number>;
    market_penetration: number;
    growth_opportunities: Array<{
      market_segment: string;
      opportunity_size: number;
      win_probability: number;
      required_investment: string;
    }>;
  };
  gtm_optimization: {
    optimal_sales_motions: Array<{
      target_segment: string;
      recommended_approach: string;
      expected_results: string;
    }>;
    territory_efficiency: Array<{
      territory: string;
      efficiency_score: number;
      optimization_potential: number;
    }>;
  };
  strategic_recommendations: Array<{
    category: "product" | "pricing" | "positioning" | "process" | "people";
    recommendation: string;
    business_impact: string;
    implementation_timeline: string;
    confidence: number;
  }>;
  predictive_analytics: {
    quarterly_forecast: {
      predicted_revenue: number;
      confidence_interval: [number, number];
      key_assumptions: string[];
    };
    market_trends: Array<{
      trend: string;
      impact_on_business: string;
      recommended_response: string;
    }>;
  };
}

// Comprehensive Simulation Intelligence
export interface SimulationIntelligence {
  company_id: string;
  buyer_group_id: string;

  // Vectorized Environment (User's Go Board Concept)
  vectorized_environment: {
    environment_embedding: number[]; // Vector representation of entire buying environment
    persona_positions: Array<{
      persona_id: string;
      position_vector: number[]; // Their position in the decision space
      movement_velocity: number[]; // Direction they're moving
      influence_field: number[]; // Their influence on the space
    }>;
    decision_pathways: Array<{
      pathway_id: string;
      vector_path: number[][]; // Vector path through decision space
      probability: number;
      resistance: number;
    }>;
    optimal_navigation: {
      current_position: number[];
      target_position: number[];
      optimal_path: number[][];
      navigation_strategy: string;
    };
  };

  // Multi-Scenario Analysis
  scenario_matrix: Array<{
    scenario_type: string;
    outcomes: SimulationResult[];
    patterns_detected: string[];
    success_rate: number;
    recommended_approach: string;
  }>;

  // Seller Intelligence - Actionable insights for AEs and SDRs
  next_best_action?: NextBestAction;
  deal_health: DealHealthMetrics;
  objection_preparation: Array<{
    likely_objection: string;
    persona_id: string;
    probability: number;
    recommended_response: string;
    supporting_evidence: string[];
  }>;

  // Manager Intelligence - Team optimization insights
  manager_insights: ManagerInsights;

  // CRO Intelligence - Strategic business insights
  cro_intelligence: CROStrategicIntelligence;

  // Strategic Recommendations
  strategic_recommendations: Array<{
    priority: "critical" | "high" | "medium" | "low";
    recommendation: string;
    target_audience: "seller" | "manager" | "cro" | "all";
    expected_impact: string;
    timeline: string;
    resources_required: string[];
    success_metrics: string[];
  }>;

  // Enhanced Analytics
  win_probability: number;
  predicted_sales_cycle_days: number;
  key_decision_factors: string[];
  risk_factors: string[];
  fastest_path_to_close: Array<{
    step: number;
    action: string;
    target_personas: string[];
    expected_outcome: string;
    success_probability: number;
    timing: string;
  }>;

  last_updated: Date;
  intelligence_version: string;
  simulation_confidence: number; // 0-1
}
