/**
 * EXECUTIVE ROLE DEFINITIONS
 * 
 * Comprehensive definitions for CFO and CRO roles with all variations
 * Based on analysis of the old pipeline and industry standards
 */

class ExecutiveRoleDefinitions {
    constructor() {
        this.cfoRoles = this.initializeCFORoles();
        this.croRoles = this.initializeCRORoles();
    }

    /**
     * Initialize comprehensive CFO role definitions
     */
    initializeCFORoles() {
        return {
            // Primary CFO titles
            primary: [
                'Chief Financial Officer',
                'CFO',
                'Chief Finance Officer',
                'Chief Financial',
                'Chief Financial Executive'
            ],
            
            // Senior Finance Leadership
            senior: [
                'Chief Accounting Officer',
                'CAO',
                'Chief Accounting Executive',
                'Controller',
                'Chief Controller',
                'Chief Treasury Officer',
                'Chief Investment Officer',
                'Chief Risk Officer',
                'Chief Audit Executive',
                'Chief Compliance Officer'
            ],
            
            // VP Finance Level
            vp: [
                'VP Finance',
                'Vice President Finance',
                'SVP Finance',
                'Senior Vice President Finance',
                'EVP Finance',
                'Executive Vice President Finance',
                'Finance Director',
                'Financial Director',
                'Director of Finance',
                'Director of Financial Planning',
                'Director of Financial Analysis'
            ],
            
            // Treasurer & Finance Manager
            treasurer: [
                'Treasurer',
                'Chief Treasurer',
                'Finance Manager',
                'Financial Manager',
                'Accounting Director',
                'Head of Finance',
                'Head of Financial',
                'Head of Accounting',
                'Head of Treasury',
                'Head of Financial Planning',
                'Head of Financial Analysis'
            ],
            
            // Other Finance Roles
            other: [
                'Finance',
                'Financial',
                'Accounting',
                'Treasury',
                'Financial Planning',
                'Financial Analysis',
                'Corporate Finance',
                'Business Finance',
                'Strategic Finance',
                'Financial Operations',
                'Finance Operations',
                'Financial Management',
                'Finance Management'
            ],
            
            // Startup/Modern Finance Roles
            startup: [
                'Head of Financial Operations',
                'Head of Finance Operations',
                'Finance Lead',
                'Financial Lead',
                'Finance Manager',
                'Financial Manager',
                'VP Financial Operations',
                'VP Finance Operations',
                'Director of Financial Operations',
                'Director of Finance Operations',
                'Chief Financial Operations Officer',
                'CFOO'
            ],
            
            // Cross-Department Finance (Operations, Strategy)
            crossDepartment: [
                'Chief Operating Officer',
                'COO',
                'Chief Strategy Officer',
                'CSO',
                'VP Operations',
                'Head of Operations',
                'Chief Administrative Officer',
                'CAO',
                'Chief Business Officer',
                'CBO'
            ]
        };
    }

    /**
     * Initialize comprehensive CRO role definitions
     */
    initializeCRORoles() {
        return {
            // Primary CRO titles
            primary: [
                'Chief Revenue Officer',
                'CRO',
                'Chief Revenue Executive',
                'Chief Sales Officer',
                'CSO',
                'Chief Sales Executive',
                'Chief Commercial Officer',
                'CCO',
                'Chief Commercial Executive'
            ],
            
            // Senior Sales Leadership
            senior: [
                'VP Sales',
                'Vice President Sales',
                'SVP Sales',
                'Senior Vice President Sales',
                'EVP Sales',
                'Executive Vice President Sales',
                'VP Revenue',
                'Vice President Revenue',
                'SVP Revenue',
                'Senior Vice President Revenue',
                'EVP Revenue',
                'Executive Vice President Revenue',
                'VP Commercial',
                'Vice President Commercial',
                'Head of Sales',
                'Head of Revenue',
                'Head of Commercial',
                'Head of Business Development'
            ],
            
            // Sales Director Level
            director: [
                'Sales Director',
                'Revenue Director',
                'Commercial Director',
                'Business Development Director',
                'Regional Sales Director',
                'Area Sales Director',
                'National Sales Director',
                'Global Sales Director',
                'Enterprise Sales Director',
                'Corporate Sales Director',
                'Strategic Sales Director'
            ],
            
            // Sales Manager Level
            manager: [
                'Sales Manager',
                'Revenue Manager',
                'Commercial Manager',
                'Business Development Manager',
                'Account Manager',
                'Key Account Manager',
                'Enterprise Account Manager',
                'Corporate Account Manager',
                'Strategic Account Manager'
            ],
            
            // Other Sales/Revenue Roles
            other: [
                'Sales',
                'Revenue',
                'Commercial',
                'Business Development',
                'Account Management',
                'Customer Success',
                'Partnerships',
                'Alliances',
                'Channel Sales',
                'Inside Sales',
                'Outside Sales',
                'Revenue Operations',
                'Sales Operations',
                'Revenue Management',
                'Sales Management'
            ],
            
            // Startup/Modern Revenue Roles
            startup: [
                'Head of Revenue Operations',
                'Head of Sales Operations',
                'Revenue Lead',
                'Sales Lead',
                'Revenue Manager',
                'Sales Manager',
                'VP Revenue Operations',
                'VP Sales Operations',
                'Director of Revenue Operations',
                'Director of Sales Operations',
                'Chief Revenue Operations Officer',
                'CROO',
                'Head of Growth',
                'Growth Lead',
                'VP Growth',
                'Director of Growth'
            ],
            
            // Cross-Department Revenue (Marketing, Operations)
            crossDepartment: [
                'Chief Marketing Officer',
                'CMO',
                'VP Marketing',
                'Head of Marketing',
                'Chief Growth Officer',
                'CGO',
                'VP Growth',
                'Head of Growth',
                'Chief Customer Officer',
                'CCO',
                'VP Customer Success',
                'Head of Customer Success'
            ]
        };
    }

    /**
     * Get all CFO role variations as a flat array
     */
    getAllCFORoles() {
        return [
            ...this.cfoRoles.primary,
            ...this.cfoRoles.senior,
            ...this.cfoRoles.vp,
            ...this.cfoRoles.treasurer,
            ...this.cfoRoles.other,
            ...this.cfoRoles.startup,
            ...this.cfoRoles.crossDepartment
        ];
    }

    /**
     * Get all CRO role variations as a flat array
     */
    getAllCRORoles() {
        return [
            ...this.croRoles.primary,
            ...this.croRoles.senior,
            ...this.croRoles.director,
            ...this.croRoles.manager,
            ...this.croRoles.other,
            ...this.croRoles.startup,
            ...this.croRoles.crossDepartment
        ];
    }

    /**
     * Get CFO roles by tier (for waterfall search)
     */
    getCFORolesByTier() {
        return [
            {
                tier: 1,
                name: 'Primary CFO',
                roles: this.cfoRoles.primary,
                priority: 1000
            },
            {
                tier: 2,
                name: 'Senior Finance Leadership',
                roles: this.cfoRoles.senior,
                priority: 800
            },
            {
                tier: 3,
                name: 'VP Finance Level',
                roles: this.cfoRoles.vp,
                priority: 600
            },
            {
                tier: 4,
                name: 'Treasurer & Finance Manager',
                roles: this.cfoRoles.treasurer,
                priority: 400
            },
            {
                tier: 5,
                name: 'Startup/Modern Finance Roles',
                roles: this.cfoRoles.startup,
                priority: 300
            },
            {
                tier: 6,
                name: 'Other Finance Roles',
                roles: this.cfoRoles.other,
                priority: 200
            },
            {
                tier: 7,
                name: 'Cross-Department Finance',
                roles: this.cfoRoles.crossDepartment,
                priority: 100
            }
        ];
    }

    /**
     * Get CRO roles by tier (for waterfall search)
     */
    getCRORolesByTier() {
        return [
            {
                tier: 1,
                name: 'Primary CRO',
                roles: this.croRoles.primary,
                priority: 1000
            },
            {
                tier: 2,
                name: 'Senior Sales Leadership',
                roles: this.croRoles.senior,
                priority: 800
            },
            {
                tier: 3,
                name: 'Sales Director Level',
                roles: this.croRoles.director,
                priority: 600
            },
            {
                tier: 4,
                name: 'Sales Manager Level',
                roles: this.croRoles.manager,
                priority: 400
            },
            {
                tier: 5,
                name: 'Startup/Modern Revenue Roles',
                roles: this.croRoles.startup,
                priority: 300
            },
            {
                tier: 6,
                name: 'Other Sales/Revenue Roles',
                roles: this.croRoles.other,
                priority: 200
            },
            {
                tier: 7,
                name: 'Cross-Department Revenue',
                roles: this.croRoles.crossDepartment,
                priority: 100
            }
        ];
    }

    /**
     * Check if a title matches CFO roles
     */
    isCFORole(title) {
        if (!title) return false;
        const titleLower = title.toLowerCase();
        return this.getAllCFORoles().some(role => 
            titleLower.includes(role.toLowerCase())
        );
    }

    /**
     * Check if a title matches CRO roles
     */
    isCRORole(title) {
        if (!title) return false;
        const titleLower = title.toLowerCase();
        return this.getAllCRORoles().some(role => 
            titleLower.includes(role.toLowerCase())
        );
    }

    /**
     * Get the tier and priority for a CFO role
     */
    getCFOTierAndPriority(title) {
        if (!title) return { tier: 0, priority: 0 };
        
        const titleLower = title.toLowerCase();
        const tiers = this.getCFORolesByTier();
        
        for (const tier of tiers) {
            if (tier.roles.some(role => titleLower.includes(role.toLowerCase()))) {
                return { tier: tier.tier, priority: tier.priority };
            }
        }
        
        return { tier: 0, priority: 0 };
    }

    /**
     * Get the tier and priority for a CRO role
     */
    getCROTierAndPriority(title) {
        if (!title) return { tier: 0, priority: 0 };
        
        const titleLower = title.toLowerCase();
        const tiers = this.getCRORolesByTier();
        
        for (const tier of tiers) {
            if (tier.roles.some(role => titleLower.includes(role.toLowerCase()))) {
                return { tier: tier.tier, priority: tier.priority };
            }
        }
        
        return { tier: 0, priority: 0 };
    }

    /**
     * Get search terms for CoreSignal Search Preview
     */
    getSearchTerms(roleType) {
        if (roleType === 'cfo') {
            return this.getAllCFORoles();
        } else if (roleType === 'cro') {
            return this.getAllCRORoles();
        }
        return [];
    }

    /**
     * Get tier-based search terms for waterfall approach
     */
    getTierBasedSearchTerms(roleType) {
        if (roleType === 'cfo') {
            return this.getCFORolesByTier();
        } else if (roleType === 'cro') {
            return this.getCRORolesByTier();
        }
        return [];
    }
}

module.exports = { ExecutiveRoleDefinitions };
