#!/usr/bin/env node

/**
 * 🧠 PREVIEW ROLE SCORING ENGINE
 * 
 * Advanced role scoring algorithms for buyer group discovery
 * Scores candidates for all 5 buyer group roles based on:
 * - Title analysis
 * - Department alignment
 * - Seniority level
 * - Network influence
 * - Career patterns
 */

class PreviewRoleScoringEngine {
    constructor(config = {}) {
        this.config = {
            MIN_SCORE_THRESHOLD: config.MIN_SCORE_THRESHOLD || 0.3,
            SCORE_WEIGHTS: {
                title: 0.4,
                department: 0.3,
                seniority: 0.2,
                network: 0.1
            },
            ...config
        };
        
        this.stats = {
            candidatesScored: 0,
            roleAssignments: 0,
            averageScores: {
                decision: 0,
                champion: 0,
                stakeholder: 0,
                blocker: 0,
                introducer: 0
            }
        };
    }

    /**
     * 🎯 SCORE ALL ROLES FOR CANDIDATE
     * 
     * Score a single candidate for all buyer group roles
     */
    scoreCandidate(employee) {
        const scores = {
            decision: this.scoreAsDecisionMaker(employee),
            champion: this.scoreAsChampion(employee),
            stakeholder: this.scoreAsStakeholder(employee),
            blocker: this.scoreAsBlocker(employee),
            introducer: this.scoreAsIntroducer(employee)
        };

        // Find best-fit role
        const bestRole = this.findBestRole(scores);
        const bestScore = scores[bestRole];

        this.stats.candidatesScored++;
        this.updateAverageScores(scores);

        return {
            ...scores,
            bestRole,
            bestScore,
            meetsThreshold: bestScore >= this.config.MIN_SCORE_THRESHOLD
        };
    }

    /**
     * 🎯 DECISION MAKER SCORING
     * 
     * Score for decision maker role (C-level, VPs with budget authority)
     */
    scoreAsDecisionMaker(employee) {
        const title = this.normalizeTitle(employee.active_experience_title);
        const department = this.normalizeDepartment(employee.active_experience_department);
        const managementLevel = this.normalizeManagementLevel(employee.active_experience_management_level);
        const connectionsCount = employee.connections_count || 0;

        let score = 0;

        // Title-based scoring (40% weight)
        const titleScore = this.scoreDecisionMakerTitle(title);
        score += titleScore * this.config.SCORE_WEIGHTS.title;

        // Department-based scoring (30% weight)
        const departmentScore = this.scoreDecisionMakerDepartment(department);
        score += departmentScore * this.config.SCORE_WEIGHTS.department;

        // Seniority-based scoring (20% weight)
        const seniorityScore = this.scoreDecisionMakerSeniority(managementLevel);
        score += seniorityScore * this.config.SCORE_WEIGHTS.seniority;

        // Network influence (10% weight)
        const networkScore = this.scoreNetworkInfluence(connectionsCount);
        score += networkScore * this.config.SCORE_WEIGHTS.network;

        return Math.min(1.0, score);
    }

    /**
     * 🏆 CHAMPION SCORING
     * 
     * Score for champion role (Sales, Marketing, Operations leaders)
     */
    scoreAsChampion(employee) {
        const title = this.normalizeTitle(employee.active_experience_title);
        const department = this.normalizeDepartment(employee.active_experience_department);
        const managementLevel = this.normalizeManagementLevel(employee.active_experience_management_level);
        const connectionsCount = employee.connections_count || 0;

        let score = 0;

        // Title-based scoring
        const titleScore = this.scoreChampionTitle(title);
        score += titleScore * this.config.SCORE_WEIGHTS.title;

        // Department-based scoring
        const departmentScore = this.scoreChampionDepartment(department);
        score += departmentScore * this.config.SCORE_WEIGHTS.department;

        // Seniority-based scoring
        const seniorityScore = this.scoreChampionSeniority(managementLevel);
        score += seniorityScore * this.config.SCORE_WEIGHTS.seniority;

        // Network influence
        const networkScore = this.scoreNetworkInfluence(connectionsCount);
        score += networkScore * this.config.SCORE_WEIGHTS.network;

        return Math.min(1.0, score);
    }

    /**
     * 👥 STAKEHOLDER SCORING
     * 
     * Score for stakeholder role (Directors, Managers, key contributors)
     */
    scoreAsStakeholder(employee) {
        const title = this.normalizeTitle(employee.active_experience_title);
        const department = this.normalizeDepartment(employee.active_experience_department);
        const managementLevel = this.normalizeManagementLevel(employee.active_experience_management_level);
        const connectionsCount = employee.connections_count || 0;

        let score = 0;

        // Title-based scoring
        const titleScore = this.scoreStakeholderTitle(title);
        score += titleScore * this.config.SCORE_WEIGHTS.title;

        // Department-based scoring
        const departmentScore = this.scoreStakeholderDepartment(department);
        score += departmentScore * this.config.SCORE_WEIGHTS.department;

        // Seniority-based scoring
        const seniorityScore = this.scoreStakeholderSeniority(managementLevel);
        score += seniorityScore * this.config.SCORE_WEIGHTS.seniority;

        // Network influence
        const networkScore = this.scoreNetworkInfluence(connectionsCount);
        score += networkScore * this.config.SCORE_WEIGHTS.network;

        return Math.min(1.0, score);
    }

    /**
     * 🚫 BLOCKER SCORING
     * 
     * Score for blocker role (Legal, Compliance, Security, Procurement)
     */
    scoreAsBlocker(employee) {
        const title = this.normalizeTitle(employee.active_experience_title);
        const department = this.normalizeDepartment(employee.active_experience_department);
        const managementLevel = this.normalizeManagementLevel(employee.active_experience_management_level);
        const connectionsCount = employee.connections_count || 0;

        let score = 0;

        // Title-based scoring
        const titleScore = this.scoreBlockerTitle(title);
        score += titleScore * this.config.SCORE_WEIGHTS.title;

        // Department-based scoring
        const departmentScore = this.scoreBlockerDepartment(department);
        score += departmentScore * this.config.SCORE_WEIGHTS.department;

        // Seniority-based scoring
        const seniorityScore = this.scoreBlockerSeniority(managementLevel);
        score += seniorityScore * this.config.SCORE_WEIGHTS.seniority;

        // Network influence
        const networkScore = this.scoreNetworkInfluence(connectionsCount);
        score += networkScore * this.config.SCORE_WEIGHTS.network;

        return Math.min(1.0, score);
    }

    /**
     * 🤝 INTRODUCER SCORING
     * 
     * Score for introducer role (Board, Advisors, Network connectors)
     */
    scoreAsIntroducer(employee) {
        const title = this.normalizeTitle(employee.active_experience_title);
        const department = this.normalizeDepartment(employee.active_experience_department);
        const managementLevel = this.normalizeManagementLevel(employee.active_experience_management_level);
        const connectionsCount = employee.connections_count || 0;

        let score = 0;

        // Title-based scoring
        const titleScore = this.scoreIntroducerTitle(title);
        score += titleScore * this.config.SCORE_WEIGHTS.title;

        // Department-based scoring
        const departmentScore = this.scoreIntroducerDepartment(department);
        score += departmentScore * this.config.SCORE_WEIGHTS.department;

        // Seniority-based scoring
        const seniorityScore = this.scoreIntroducerSeniority(managementLevel);
        score += seniorityScore * this.config.SCORE_WEIGHTS.seniority;

        // Network influence (higher weight for introducers)
        const networkScore = this.scoreNetworkInfluence(connectionsCount, true);
        score += networkScore * (this.config.SCORE_WEIGHTS.network * 2);

        return Math.min(1.0, score);
    }

    /**
     * 🎯 TITLE SCORING FUNCTIONS
     */
    
    scoreDecisionMakerTitle(title) {
        const decisionMakerPatterns = [
            // C-level
            { pattern: /chief|ceo|cfo|cto|cmo|coo|president/i, score: 1.0 },
            { pattern: /executive|vp|vice president/i, score: 0.8 },
            { pattern: /director|head of|lead/i, score: 0.6 },
            { pattern: /manager|senior/i, score: 0.4 }
        ];

        return this.scoreByPatterns(title, decisionMakerPatterns);
    }

    scoreChampionTitle(title) {
        const championPatterns = [
            { pattern: /sales|revenue|growth|business development/i, score: 1.0 },
            { pattern: /marketing|brand|digital|content/i, score: 0.9 },
            { pattern: /operations|process|efficiency/i, score: 0.8 },
            { pattern: /product|strategy|innovation/i, score: 0.7 },
            { pattern: /partnership|alliance|ecosystem/i, score: 0.6 }
        ];

        return this.scoreByPatterns(title, championPatterns);
    }

    scoreStakeholderTitle(title) {
        const stakeholderPatterns = [
            { pattern: /director|head of|lead/i, score: 0.9 },
            { pattern: /manager|senior|principal/i, score: 0.8 },
            { pattern: /engineer|developer|architect/i, score: 0.7 },
            { pattern: /analyst|specialist|coordinator/i, score: 0.6 },
            { pattern: /consultant|advisor/i, score: 0.5 }
        ];

        return this.scoreByPatterns(title, stakeholderPatterns);
    }

    scoreBlockerTitle(title) {
        const blockerPatterns = [
            { pattern: /legal|compliance|regulatory/i, score: 1.0 },
            { pattern: /security|risk|audit/i, score: 0.9 },
            { pattern: /procurement|vendor|supplier/i, score: 0.8 },
            { pattern: /finance|controller|accounting/i, score: 0.6 },
            { pattern: /governance|policy/i, score: 0.7 }
        ];

        return this.scoreByPatterns(title, blockerPatterns);
    }

    scoreIntroducerTitle(title) {
        const introducerPatterns = [
            { pattern: /board|advisor|consultant/i, score: 1.0 },
            { pattern: /partnership|alliance|ecosystem/i, score: 0.9 },
            { pattern: /business development|external/i, score: 0.8 },
            { pattern: /community|industry|network/i, score: 0.7 },
            { pattern: /investor|stakeholder/i, score: 0.6 }
        ];

        return this.scoreByPatterns(title, introducerPatterns);
    }

    /**
     * 🏢 DEPARTMENT SCORING FUNCTIONS
     */
    
    scoreDecisionMakerDepartment(department) {
        const decisionMakerDepartments = {
            'finance': 1.0,
            'operations': 0.9,
            'strategy': 0.9,
            'executive': 1.0,
            'business': 0.8
        };

        return decisionMakerDepartments[department] || 0.3;
    }

    scoreChampionDepartment(department) {
        const championDepartments = {
            'sales': 1.0,
            'marketing': 1.0,
            'operations': 0.9,
            'product': 0.8,
            'business development': 0.9,
            'growth': 1.0
        };

        return championDepartments[department] || 0.3;
    }

    scoreStakeholderDepartment(department) {
        const stakeholderDepartments = {
            'product': 1.0,
            'engineering': 0.9,
            'operations': 0.8,
            'it': 0.8,
            'marketing': 0.7,
            'sales': 0.7,
            'customer success': 0.8
        };

        return stakeholderDepartments[department] || 0.4;
    }

    scoreBlockerDepartment(department) {
        const blockerDepartments = {
            'legal': 1.0,
            'compliance': 1.0,
            'security': 0.9,
            'procurement': 0.8,
            'finance': 0.6,
            'risk': 0.9
        };

        return blockerDepartments[department] || 0.2;
    }

    scoreIntroducerDepartment(department) {
        const introducerDepartments = {
            'business development': 1.0,
            'partnerships': 1.0,
            'ecosystem': 1.0,
            'external relations': 0.9,
            'community': 0.8,
            'industry relations': 0.9
        };

        return introducerDepartments[department] || 0.3;
    }

    /**
     * 📊 SENIORITY SCORING FUNCTIONS
     */
    
    scoreDecisionMakerSeniority(managementLevel) {
        const seniorityScores = {
            'c-level': 1.0,
            'vp-level': 0.9,
            'director': 0.7,
            'manager': 0.5,
            'specialist': 0.3
        };

        return seniorityScores[managementLevel] || 0.4;
    }

    scoreChampionSeniority(managementLevel) {
        const seniorityScores = {
            'c-level': 0.8,
            'vp-level': 0.9,
            'director': 0.8,
            'manager': 0.7,
            'specialist': 0.5
        };

        return seniorityScores[managementLevel] || 0.4;
    }

    scoreStakeholderSeniority(managementLevel) {
        const seniorityScores = {
            'c-level': 0.6,
            'vp-level': 0.7,
            'director': 0.9,
            'manager': 0.8,
            'specialist': 0.6
        };

        return seniorityScores[managementLevel] || 0.5;
    }

    scoreBlockerSeniority(managementLevel) {
        const seniorityScores = {
            'c-level': 0.7,
            'vp-level': 0.8,
            'director': 0.9,
            'manager': 0.8,
            'specialist': 0.6
        };

        return seniorityScores[managementLevel] || 0.5;
    }

    scoreIntroducerSeniority(managementLevel) {
        const seniorityScores = {
            'c-level': 0.9,
            'vp-level': 0.8,
            'director': 0.7,
            'manager': 0.6,
            'specialist': 0.5
        };

        return seniorityScores[managementLevel] || 0.4;
    }

    /**
     * 🌐 NETWORK INFLUENCE SCORING
     */
    
    scoreNetworkInfluence(connectionsCount, isIntroducer = false) {
        if (connectionsCount === 0) return 0.1;

        // Higher threshold for introducers
        const threshold = isIntroducer ? 500 : 200;
        const maxConnections = isIntroducer ? 2000 : 1000;

        if (connectionsCount >= maxConnections) return 1.0;
        if (connectionsCount >= threshold) return 0.8;
        if (connectionsCount >= threshold / 2) return 0.6;
        if (connectionsCount >= threshold / 4) return 0.4;
        
        return 0.2;
    }

    /**
     * 🔧 UTILITY FUNCTIONS
     */
    
    normalizeTitle(title) {
        return (title || '').toLowerCase().trim();
    }

    normalizeDepartment(department) {
        return (department || '').toLowerCase().trim();
    }

    normalizeManagementLevel(level) {
        return (level || '').toLowerCase().trim();
    }

    scoreByPatterns(text, patterns) {
        for (const { pattern, score } of patterns) {
            if (pattern.test(text)) {
                return score;
            }
        }
        return 0.1; // Default low score
    }

    findBestRole(scores) {
        return Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
    }

    updateAverageScores(scores) {
        for (const [role, score] of Object.entries(scores)) {
            const current = this.stats.averageScores[role];
            const count = this.stats.candidatesScored;
            this.stats.averageScores[role] = ((current * (count - 1)) + score) / count;
        }
    }

    /**
     * 📊 GET STATISTICS
     */
    getStats() {
        return {
            ...this.stats,
            averageScores: { ...this.stats.averageScores }
        };
    }
}

module.exports = PreviewRoleScoringEngine;
