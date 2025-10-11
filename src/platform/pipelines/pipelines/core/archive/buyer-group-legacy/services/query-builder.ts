/**
 * 🔍 QUERY BUILDER
 * 
 * Builds optimized Elasticsearch DSL queries for CoreSignal search
 */

import { SellerProfile } from './types';

export class QueryBuilder {

  /**
   * Build CoreSignal search query using company IDs (preferred) or names
   * ENHANCED: Added company ID filtering for maximum precision
   */
  buildSearchQuery(companyName: string, sellerProfile: SellerProfile, companyAliases: string[] = [], enforceExact = true, companyIds: number[] = []) {
    const aliases = [companyName, ...companyAliases];
    
    // ACCURACY-FIRST: Multi-tier approach for maximum precision
    // Use primary company name with strategic aliases - adaptive to any company
    const primaryAlias = companyName;
    const strategicAliases = aliases.slice(0, 3); // Limit to top 3 aliases to prevent query complexity
    const companyVariations = this.generateCompanyVariations(companyName, strategicAliases);
    
    // PRECISION-ENHANCED: Company filter prioritizes exact ID matching
    const companyFilter: any = companyIds.length > 0 
      ? { 
          // PRECISION MODE: Use exact company IDs only
          terms: { 'active_experience_company_id': companyIds }
        }
      : {
          // FALLBACK MODE: Name-based matching with strict filtering
          nested: {
            path: 'experience',
            query: {
              bool: {
                must: [
                  {
                    bool: {
                      should: companyVariations.map(variation => ({
                        match_phrase: { 'experience.company_name': variation }
                      }))
                    }
                  },
                  { term: { 'experience.active_experience': 1 } } // CRITICAL: Only current employees
                ],
                // ENHANCED: Additional precision filters
                must_not: [
                  // Block non-corporate Dell entities
                  { match: { 'experience.company_name': 'dell medical' } },
                  { match: { 'experience.company_name': 'dell foods' } },
                  { match: { 'experience.company_name': 'dell carpentry' } },
                  { match: { 'experience.company_name': 'dell university' } },
                  { match: { 'experience.company_name': 'dell school' } },
                  { match: { 'experience.company_name': 'dell hospital' } },
                  { match: { 'experience.company_name': 'dell valley' } },
                  { match: { 'experience.company_name': 'dell flowers' } },
                  { match: { 'experience.company_name': 'dell store' } }
                ]
              }
            }
          }
        };
    
    const baseQuery = {
      query: {
        bool: {
          must: [
            // PRECISION FIRST: Company filter (ID-based or name-based)
            companyFilter
          ],
          must_not: [
            // CRITICAL: Exclude non-employees
            { match: { headline: 'former' } },
            { match: { headline: 'ex-' } },
            { match: { headline: 'retired' } },
            { match: { headline: 'intern' } },
            // ENHANCED: Exclude non-corporate entities
            { match: { 'experience.company_name': 'police' } },
            { match: { 'experience.company_name': 'university' } },
            { match: { 'experience.company_name': 'hospital' } },
            { match: { 'experience.company_name': 'school' } },
            { match: { 'experience.company_name': 'government' } },
            { match: { 'experience.company_name': 'college' } },
            { match: { 'experience.company_name': 'department of' } }
          ]
        }
      }
    };

    // ENHANCED: Add department filtering for revenue_technology solutions
    // FIXED: Include corporate functions for comprehensive buyer group discovery
    if (sellerProfile['solutionCategory'] === 'revenue_technology') {
      baseQuery.query.bool.must.push({
        bool: {
          should: [
            // Sales Organization (Primary)
            { match: { 'experience.department': 'sales' } },
            { match: { 'experience.department': 'revenue operations' } },
            { match: { 'experience.department': 'business development' } },
            { match: { 'experience.department': 'commercial' } },
            { match: { 'experience.department': 'commercial operations' } },
            { match: { 'experience.department': 'sales operations' } },
            { match: { 'experience.department': 'revenue' } },
            // Corporate Functions (Blockers & Stakeholders)
            { match: { 'experience.department': 'procurement' } },
            { match: { 'experience.department': 'sourcing' } },
            { match: { 'experience.department': 'legal' } },
            { match: { 'experience.department': 'compliance' } },
            { match: { 'experience.department': 'security' } },
            { match: { 'experience.department': 'finance' } },
            { match: { 'experience.department': 'risk management' } },
            { match: { 'experience.department': 'information technology' } },
            { match: { 'experience.department': 'it' } }
          ],
          minimum_should_match: 1
        }
      });
    }

    return baseQuery;
  }

  /**
   * Build segmented queries for large enterprises to improve precision without extra cost
   */
  buildSegmentedQueries(companyName: string, sellerProfile: SellerProfile): any[] {
    const segments = [
      // Function-focused
      this.buildRoleSpecificQuery(companyName, sellerProfile.rolePriorities.decision),
      this.buildRoleSpecificQuery(companyName, sellerProfile.rolePriorities.champion),
      // Department clusters
      this.buildRoleSpecificQuery(companyName, sellerProfile.mustHaveTitles),
      this.buildRoleSpecificQuery(companyName, sellerProfile.adjacentFunctions)
    ];
    return segments;
  }

  /**
   * 🚀 PRECISION-ENHANCED: Build micro-targeted search queries with company ID support
   * FIXED: Now supports company ID filtering for exact targeting
   */
  buildMicroTargetedQueries(companyName: string, sellerProfile: SellerProfile, companyIds: number[] = []): any[] {
    if (companyIds.length > 0) {
      console.log('Using company IDs: ' + companyIds.slice(0, 5).join(', ') + (companyIds.length > 5 ? '...' : ''));
    } else {
      console.log('Using company name search');
    }
    const companyVariations = this.generateCompanyVariations(companyName, [companyName]);
    const queries: any[] = [];
    
    // PRECISION-ENHANCED: Company targeting with ID support
    const companyFilter = companyIds.length > 0 
      ? { 
          // PRECISION MODE: Use exact company IDs only
          terms: { 'active_experience_company_id': companyIds }
        }
      : {
          // FALLBACK MODE: Name-based matching  
          nested: {
            path: 'experience',
            query: {
              bool: {
                must: [
                  {
                    bool: {
                      should: companyVariations.map(variation => ({
                        match_phrase: { 'experience.company_name': variation }
                      }))
                    }
                  },
                  { term: { 'experience.active_experience': 1 } }
                ]
              }
            }
          }
        };

    // Core company + role targeting (now with ID support)
    const baseQuery = {
      query: {
        bool: {
          must: [
            // PRECISION: Use company filter (ID or name-based)
            companyFilter
          ],
          must_not: [
            { match: { headline: 'former' } },
            { match: { headline: 'ex-' } },
            { match: { headline: 'retired' } },
            { match: { headline: 'intern' } }
          ]
        }
      }
    };
    
    // Generate role-specific queries using the working approach
    const roleQueries = [
      // Decision makers
      { ...baseQuery, roleFilter: { match: { active_experience_title: 'vice president' } } },
      { ...baseQuery, roleFilter: { match: { active_experience_title: 'director' } } },
      { ...baseQuery, roleFilter: { match: { active_experience_title: 'vp sales' } } },
      
      // Champions  
      { ...baseQuery, roleFilter: { match: { active_experience_title: 'sales director' } } },
      { ...baseQuery, roleFilter: { match: { active_experience_title: 'sales manager' } } },
      
      // Stakeholders
      { ...baseQuery, roleFilter: { match: { active_experience_title: 'marketing' } } },
      { ...baseQuery, roleFilter: { match: { active_experience_title: 'operations' } } },
      
      // Blockers
      { ...baseQuery, roleFilter: { match: { active_experience_title: 'procurement' } } },
      { ...baseQuery, roleFilter: { match: { active_experience_title: 'legal' } } },
      
      // Introducers  
      { ...baseQuery, roleFilter: { match: { active_experience_title: 'account executive' } } },
      { ...baseQuery, roleFilter: { match: { active_experience_title: 'sales representative' } } }
    ];
    
    // Apply role filters to base queries
    roleQueries.forEach(rq => {
      if (rq.roleFilter) {
        const query = JSON.parse(JSON.stringify(baseQuery));
        query.query.bool.must.push(rq.roleFilter);
        queries.push(query);
      }
    });
    
    return queries;
  }

  /**
   * Get seniority-specific query boosts with PRECISE MATCHING
   * FIXED: Replaced fuzzy 'match' with exact 'match_phrase' for accuracy
   */
  private getSeniorityQueries(decisionLevel: string) {
    const seniorityQueries = [];

    switch (decisionLevel) {
      case 'c_suite':
        seniorityQueries.push(
          // PRECISE: Exact phrase matching for C-level titles
          { match_phrase: { 'experience.title': 'Chief Executive Officer' } },
          { match_phrase: { 'experience.title': 'Chief Financial Officer' } },
          { match_phrase: { 'experience.title': 'Chief Revenue Officer' } },
          { match_phrase: { 'experience.title': 'Chief Operating Officer' } },
          { match_phrase: { 'experience.title': 'CEO' } },
          { match_phrase: { 'experience.title': 'CFO' } },
          { match_phrase: { 'experience.title': 'CRO' } },
          { match_phrase: { 'experience.title': 'COO' } }
        );
        break;
      case 'vp':
        seniorityQueries.push(
          // PRECISE: Exact phrase matching for VP titles
          { match_phrase: { 'experience.title': 'Vice President' } },
          { match_phrase: { 'experience.title': 'Senior Vice President' } },
          { match_phrase: { 'experience.title': 'Executive Vice President' } },
          { match_phrase: { 'experience.title': 'VP' } },
          { match_phrase: { 'experience.title': 'SVP' } },
          { match_phrase: { 'experience.title': 'EVP' } }
        );
        break;
      case 'director':
        seniorityQueries.push(
          // PRECISE: Exact phrase matching for Director titles
          { match_phrase: { 'experience.title': 'Director' } },
          { match_phrase: { 'experience.title': 'Senior Director' } }
        );
        break;
      case 'manager':
        seniorityQueries.push(
          // PRECISE: Exact phrase matching for Manager titles
          { match_phrase: { 'experience.title': 'Manager' } },
          { match_phrase: { 'experience.title': 'Senior Manager' } },
          { match_phrase: { 'experience.title': 'Head of' } },
          { match_phrase: { 'experience.title': 'Lead' } }
        );
        break;
    }

    return seniorityQueries;
  }

  /**
   * PRECISION-ENHANCED: Build role-specific queries with exact company ID filtering
   */
  buildPrecisionRoleQuery(companyIds: number[], roleConfig: any, additionalFilters: any = {}) {
    return {
      query: {
        bool: {
          must: [
            // PRECISION: Exact company ID filtering
            { terms: { 'active_experience_company_id': companyIds } },
            
            // ROLE-SPECIFIC: Title targeting
            {
              bool: {
                should: roleConfig.titles.map((title: string) => [
                  { match_phrase: { 'active_experience_title': title } },
                  { match_phrase: { headline: title } },
                  { match: { 'active_experience_title': { query: title, fuzziness: '1' } } }
                ]).flat(),
                minimum_should_match: 1
              }
            },
            
            // DEPARTMENT: Functional alignment
            ...(roleConfig.departments ? [{
              bool: {
                should: roleConfig.departments.map((dept: string) => [
                  { match: { 'active_experience_title': dept } },
                  { match: { headline: dept } }
                ]).flat(),
                minimum_should_match: 1
              }
            }] : []),
            
            // ADDITIONAL: Custom filters
            ...Object.entries(additionalFilters).map(([field, value]) => ({
              match: { [field]: value }
            }))
          ],
          must_not: [
            // EXCLUSIONS: Non-employees and irrelevant titles
            { match: { headline: 'former' } },
            { match: { headline: 'ex-' } },
            { match: { headline: 'retired' } },
            { match: { headline: 'intern' } },
            { match: { headline: 'consultant' } },
            
            // ROLE-SPECIFIC EXCLUSIONS
            ...(roleConfig['priority'] === 'critical' ? [
              // Decision makers: exclude low authority
              { match: { 'active_experience_title': 'coordinator' } },
              { match: { 'active_experience_title': 'specialist' } },
              { match: { 'active_experience_title': 'analyst' } }
            ] : []),
            
            ...(roleConfig['priority'] === 'introducer' ? [
              // Introducers: exclude executives
              { match: { 'active_experience_title': 'ceo' } },
              { match: { 'active_experience_title': 'president' } },
              { match: { 'active_experience_title': 'chief' } }
            ] : [])
          ],
          filter: [
            // GEOGRAPHY: US focus
            {
              bool: {
                should: [
                  { match: { location: 'United States' } },
                  { match: { location: 'USA' } },
                  { match: { location: 'US' } },
                  { regexp: { location: '.*\\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\\b.*' } }
                ]
              }
            },
            
            // RECENCY: Active within last 2 years
            {
              range: {
                'active_experience_start_date': {
                  gte: 'now-2y'
                }
              }
            }
          ]
        }
      },
      size: roleConfig.maxCollects || 10,
      sort: [
        { _score: { order: 'desc' } },
        { 'influence_score': { order: 'desc' } },
        { 'active_experience_start_date': { order: 'desc' } }
      ]
    };
  }

  /**
   * Build query for specific role targeting (legacy method)
   */
  buildRoleSpecificQuery(companyName: string, roleTargets: string[], excludeTerms: string[] = []) {
    // ACCURACY ENHANCEMENT: Use broader company matching with precise role filtering
    const companyVariants = [companyName];
    if (companyName.includes('Technologies')) {
      companyVariants.push(companyName.replace(' Technologies', ''));
    }
    
    return {
      query: {
        bool: {
          must: [
            // ENHANCED: Multiple company matching strategies
            {
              bool: {
                should: [
                  // Exact keyword match for current company
                  ...companyVariants.map(variant => ({
                    term: { 'active_experience_company_name.keyword': variant }
                  })),
                  // Experience-based matching with fuzzy tolerance
                  ...companyVariants.map(variant => ({
                    nested: {
                      path: 'experience',
                      query: {
                        bool: {
                          must: [
                            {
                              bool: {
                                should: [
                                  { match: { 'experience.company_name': { query: variant, fuzziness: '1' } } },
                                  { match_phrase: { 'experience.company_name': variant } }
                                ]
                              }
                            },
                            { term: { 'experience.is_current': true } }
                          ]
                        }
                      }
                    }
                  })),
                  // LinkedIn URL verification for accuracy
                  {
                    wildcard: { linkedin_url: '*' + companyName.toLowerCase().replace(/\s+/g, '') + '*' }
                  }
                ],
                minimum_should_match: 1
              }
            },
            // ROLE TARGETING: Enhanced precision
            {
              bool: {
                should: roleTargets.map(role => ({
                  bool: {
                    should: [
                      // Primary title match
                      { match: { headline: { query: role, boost: 3.0 } } },
                      // Experience title match
                      {
                        nested: {
                          path: 'experience',
                          query: {
                            bool: {
                              must: [
                                { match: { 'experience.title': { query: role, boost: 2.5 } } },
                                { term: { 'experience.is_current': true } }
                              ]
                            }
                          }
                        }
                      },
                      // Department signal
                      { match: { 'experience.department': { query: role, boost: 1.5 } } }
                    ]
                  }
                })),
                minimum_should_match: 1
              }
            }
          ],
          must_not: excludeTerms.map(term => ({
            multi_match: {
              query: term,
              fields: ['headline', 'experience.title'],
              type: 'phrase'
            }
          }))
        }
      }
    };
  }

  /**
   * Build highly targeted query specifically for introducer roles
   * Cost-optimized for gap-fill scenarios
   */
  buildIntroducerSpecificQuery(companyName: string, introducerRoles: string[]) {
    const companyVariants = [companyName];
    if (companyName.includes('Technologies')) {
      companyVariants.push(companyName.replace(' Technologies', ''));
    }
    
    // Highly targeted introducer role patterns
    const introducerPatterns = [
      'account executive',
      'sales representative',
      'account manager',
      'key account manager',
      'territory manager',
      'business development representative',
      'sales development representative',
      'customer success manager',
      'sales manager',
      'business development manager'
    ];

    return {
      query: {
        bool: {
          must: [
            // Company matching
            {
              bool: {
                should: [
                  ...companyVariants.map(variant => ({
                    term: { 'active_experience_company_name.keyword': variant }
                  })),
                  ...companyVariants.map(variant => ({
                    nested: {
                      path: 'experience',
                      query: {
                        bool: {
                          must: [
                            { match: { 'experience.company_name': variant } },
                            { term: { 'experience.is_current': true } }
                          ]
                        }
                      }
                    }
                  }))
                ],
                minimum_should_match: 1
              }
            },
            // Highly targeted introducer role matching
            {
              bool: {
                should: [
                  ...introducerPatterns.map(pattern => ({
                    match: { headline: { query: pattern, boost: 2.0 } }
                  })),
                  ...introducerPatterns.map(pattern => ({
                    match: { 'active_experience_title': { query: pattern, boost: 1.5 } }
                  }))
                ],
                minimum_should_match: 1
              }
            }
          ],
          // COST CONTROL: Exclude senior executives to focus on ICs and front-line managers
          must_not: [
            { match: { headline: 'chief' } },
            { match: { headline: 'president' } },
            { match: { headline: 'founder' } },
            { match: { 'active_experience_title': 'chief' } },
            { match: { 'active_experience_title': 'president' } },
            { match: { 'active_experience_title': 'founder' } }
          ],
          // PRIORITY: Recent sales experience
          should: [
            { range: { 'active_experience_duration_in_days': { gte: 90 } } }, // Tenure filter
            { match: { description: 'sales' } },
            { match: { description: 'account' } },
            { match: { description: 'business development' } }
          ]
        }
      }
      // Note: CoreSignal API doesn't support size/sort parameters in query body
      // Will be controlled by maxCollects parameter in API call
    };
  }

  /**
   * 🎯 Build Decision Maker Queries (VP+ Authority)
   * ENHANCED: Precise matching and North America Enterprise focus
   */
  private buildDecisionMakerQueries(companyVariations: string[], sellerProfile: SellerProfile): any[] {
    const decisionTitles = [
      "Chief Revenue Officer",
      "VP Sales", "Vice President Sales", 
      "SVP Sales", "Senior Vice President Sales",
      "VP Enterprise Sales", "Vice President Enterprise Sales",
      "VP North America Sales", "Vice President North America Sales",
      "VP Commercial Operations", "Vice President Commercial Operations",
      "VP Revenue Operations", "Vice President Revenue Operations",
      "VP Business Development", "Vice President Business Development"
    ];

    return decisionTitles.map(title => ({
      query: {
        bool: {
          must: [
            this.buildCompanyMatchClause(companyVariations),
            {
              bool: {
                should: [
                  // PRECISE: Use match_phrase for exact title matching
                  { match_phrase: { headline: title } },
                  { match_phrase: { 'active_experience_title': title } }
                ],
                minimum_should_match: 1
              }
            }
          ],
          // ENHANCED: North America Enterprise Sales focus
          should: [
            { match: { headline: "North America" } },
            { match: { headline: "Enterprise Sales" } },
            { match: { headline: "budget" } },
            { match: { headline: "P&L" } },
            { match: { headline: "revenue responsibility" } },
            { match: { 'active_experience_title': "North America" } },
            { match: { 'active_experience_title': "Enterprise" } }
          ]
        }
      }
    }));
  }

  /**
   * 🎯 Build Champion Queries (Department Leaders)
   */
  private buildChampionQueries(companyVariations: string[], sellerProfile: SellerProfile): any[] {
    const championTitles = [
      "Director Sales Operations",
      "Director Revenue Operations", 
      "Manager Sales Enablement",
      "Principal Sales Engineer",
      "Sales Strategy Manager",
      "Director Sales Development",
      "Manager Revenue Operations"
    ];

    return championTitles.map(title => ({
      query: {
        bool: {
          must: [
            this.buildCompanyMatchClause(companyVariations),
            {
              bool: {
                should: [
                  { match: { headline: { query: title, boost: 2.5 } } },
                  { match: { 'active_experience_title': { query: title, boost: 3.0 } } }
                ],
                minimum_should_match: 1
              }
            }
          ],
          should: [
            { range: { 'active_experience_duration_in_days': { gte: 365 } } }, // 1+ years tenure
            { match: { description: "sales operations" } },
            { match: { description: "revenue operations" } }
          ]
        }
      }
    }));
  }

  /**
   * 🎯 Build Stakeholder Queries (Influencers)
   */
  private buildStakeholderQueries(companyVariations: string[], sellerProfile: SellerProfile): any[] {
    const stakeholderTitles = [
      "Senior Sales Manager",
      "Account Executive", 
      "Sales Engineer",
      "Product Manager",
      "Business Analyst",
      "Data Analyst"
    ];

    return stakeholderTitles.map(title => ({
      query: {
        bool: {
          must: [
            this.buildCompanyMatchClause(companyVariations),
            {
              bool: {
                should: [
                  { match: { headline: { query: title, boost: 2.0 } } },
                  { match: { 'active_experience_title': { query: title, boost: 2.5 } } }
                ],
                minimum_should_match: 1
              }
            }
          ],
          should: [
            { match: { description: "enterprise" } },
            { match: { description: "strategic" } },
            { match: { description: "senior" } }
          ]
        }
      }
    }));
  }

  /**
   * 🚨 Build Blocker Queries (Gatekeepers) - CRITICAL!
   */
  private buildBlockerQueries(companyVariations: string[], sellerProfile: SellerProfile): any[] {
    const blockerTitles = [
      "Director Procurement",
      "CISO", "Chief Information Security Officer",
      "VP IT", "Vice President IT",
      "CFO", "Chief Financial Officer", 
      "Legal Counsel",
      "Compliance Manager"
    ];

    return blockerTitles.map(title => ({
      query: {
        bool: {
          must: [
            this.buildCompanyMatchClause(companyVariations),
            {
              bool: {
                should: [
                  { match: { headline: { query: title, boost: 3.5 } } },
                  { match: { 'active_experience_title': { query: title, boost: 4.0 } } }
                ],
                minimum_should_match: 1
              }
            }
          ],
          should: [
            { match: { description: "procurement" } },
            { match: { description: "security" } },
            { match: { description: "compliance" } },
            { match: { description: "legal" } },
            { match: { description: "budget approval" } }
          ]
        }
      }
    }));
  }

  /**
   * 🎯 Build Introducer Queries (Access Providers)
   */
  private buildIntroducerQueries(companyVariations: string[], sellerProfile: SellerProfile): any[] {
    const introducerTitles = [
      "Enterprise Account Executive",
      "Channel Manager",
      "Business Development Representative",
      "Account Manager",
      "Customer Success Manager"
    ];

    return introducerTitles.map(title => ({
      query: {
        bool: {
          must: [
            this.buildCompanyMatchClause(companyVariations),
            {
              bool: {
                should: [
                  { match: { headline: { query: title, boost: 2.0 } } },
                  { match: { 'active_experience_title': { query: title, boost: 2.5 } } }
                ],
                minimum_should_match: 1
              }
            }
          ],
          should: [
            { match: { description: "enterprise" } },
            { match: { description: "key accounts" } },
            { match: { description: "partnerships" } }
          ]
        }
      }
    }));
  }

  /**
   * 🎯 Build Tenure-Filtered Queries (Stability)
   */
  private buildTenureFilteredQueries(companyVariations: string[], sellerProfile: SellerProfile): any[] {
    const tenureTitles = [
      "Sales Director 2+ years",
      "Revenue Manager 1+ years"
    ];

    return tenureTitles.map(title => ({
      query: {
        bool: {
          must: [
            this.buildCompanyMatchClause(companyVariations),
            {
              bool: {
                should: [
                  { match: { headline: { query: title.split(' ')[0] + ' ' + title.split(' ')[1], boost: 2.0 } } }
                ],
                minimum_should_match: 1
              }
            }
          ],
          filter: [
            { range: { 'active_experience_duration_in_days': { gte: 365 } } } // 1+ years minimum
          ]
        }
      }
    }));
  }

  /**
   * 🔧 Helper: Build company matching clause
   */
  private buildCompanyMatchClause(companyVariations: string[]): any {
    return {
      nested: {
        path: 'experience',
        query: {
          bool: {
            must: [
              {
                bool: {
                  should: companyVariations.map(variation => ({
                    match_phrase: { 'experience.company_name': variation }
                  }))
                }
              },
              { term: { 'experience.active_experience': 1 } }
            ]
          }
        }
      }
    };
  }

  /**
   * Generate common company name variations for better matching
   */
  private generateCompanyVariations(companyName: string, aliases: string[] = []): string[] {
    const variations = new Set<string>();
    
    // Add the primary company name
    variations.add(companyName);
    
    // Add provided aliases
    aliases.forEach(alias => variations.add(alias));
    
    // Generate common corporate suffixes and variations
    const baseName = companyName
      .replace(/\s+(inc|incorporated|corp|corporation|llc|ltd|limited|company|co\.?|group|enterprises|systems|solutions|technologies|tech)\.?$/i, '')
      .trim();
    
    if (baseName !== companyName) {
      // Add variations with common suffixes
      variations.add(baseName);
      variations.add(baseName + ' Inc');
      variations.add(baseName + ' Corp');
      variations.add(baseName + ' Corporation');
      variations.add(baseName + ' LLC');
      variations.add(baseName + ' Ltd');
      variations.add(baseName + ' Limited');
      variations.add(baseName + ' Company');
      variations.add(baseName + ' Group');
      variations.add(baseName + ' Technologies');
      variations.add(baseName + ' Systems');
      variations.add(baseName + ' Solutions');
    }
    
    // Add variations without suffixes if original has them
    if (companyName !== baseName) {
      variations.add(baseName);
    }
    
    // Generate acronyms for multi-word companies
    const words = baseName.split(/\s+/).filter(word => word.length > 2);
    if (words.length > 1 && words.length <= 4) {
      const acronym = words.map(word => word.charAt(0).toUpperCase()).join('');
      if (acronym.length >= 2) {
        variations.add(acronym);
      }
    }
    
    // Limit to prevent overly complex queries
    return Array.from(variations).slice(0, 8);
  }

  buildDiscoveryQuery(companyName: string, departmentFilter?: string) {
    const baseQuery = {
      query: {
        bool: {
          must: [
            {
              nested: {
                path: 'experience',
                query: {
                  bool: {
                    must: [
                      { match: { 'experience.company_name': companyName } },
                      { term: { 'experience.is_current': true } }
                    ]
                  }
                }
              }
            }
          ]
        }
      },
      aggs: {
        departments: {
          nested: { path: 'experience' },
          aggs: {
            current_departments: {
              filter: { term: { 'experience.is_current': true } },
              aggs: {
                dept_names: {
                  terms: { 
                    field: 'experience.department.keyword', 
                    size: 50 
                  }
                }
              }
            }
          }
        },
        seniority_levels: {
          nested: { path: 'experience' },
          aggs: {
            current_levels: {
              filter: { term: { 'experience.is_current': true } },
              aggs: {
                management_levels: {
                  terms: { 
                    field: 'experience.management_level.keyword', 
                    size: 20 
                  }
                }
              }
            }
          }
        }
      }
    };

    // Add department filter if specified
    if (departmentFilter) {
      (baseQuery.query.bool['must'][0] as any).nested.query.bool.must.push({
        match: { 'experience.department': departmentFilter }
      });
    }

    return baseQuery;
  }

  /**
   * 🎯 ENHANCED BLOCKER QUERIES
   * Industry-specific patterns for procurement, finance, security, legal
   */
  private buildEnhancedBlockerQueries(companyVariations: string[], sellerProfile: SellerProfile): any[] {
    const queries: any[] = [];
    
    // Enterprise Procurement Patterns (Dell-specific insights + aggressive discovery)
    const procurementPatterns = [
      'Global Procurement Director',
      'Senior Procurement Manager', 
      'Strategic Sourcing Director',
      'Vendor Management Director',
      'Supplier Relations Manager',
      'Category Manager Technology',
      'IT Procurement Specialist',
      'Chief Procurement Officer',
      'VP Procurement',
      'Director of Procurement',
      'Global Sourcing Director',
      'Strategic Procurement Director',
      'Technology Procurement Manager',
      'Software Procurement Specialist',
      'Vendor Relationship Manager',
      'Contract Management Director',
      'Procurement Category Manager',
      'IT Sourcing Manager'
    ];
    
    // Finance Gate Patterns (aggressive discovery)
    const financeGatePatterns = [
      'Finance Director',
      'Financial Controller', 
      'VP Finance Operations',
      'Budget Director',
      'Cost Management Director',
      'Financial Planning Director',
      'Chief Financial Officer',
      'VP Finance',
      'Senior Finance Director',
      'Finance Operations Director',
      'Financial Operations Manager',
      'Budget Manager',
      'Financial Planning Manager',
      'Treasury Director',
      'Cost Center Manager',
      'Financial Analyst Director',
      'Business Finance Director',
      'Finance Business Partner'
    ];
    
    // Security/Compliance/Legal Patterns (aggressive discovery)
    const securityPatterns = [
      'Chief Security Officer',
      'VP Security',
      'Director Security Operations',
      'Compliance Director',
      'Risk Management Director',
      'Data Privacy Officer',
      'Information Security Director',
      'Cybersecurity Director',
      'Chief Information Security Officer',
      'VP Risk Management',
      'Director of Compliance',
      'Legal Director',
      'General Counsel',
      'VP Legal',
      'Chief Legal Officer',
      'Contract Legal Director',
      'Technology Legal Counsel',
      'Privacy Director',
      'Governance Director'
    ];
    
    // Build targeted queries for each pattern
    [...procurementPatterns, ...financeGatePatterns, ...securityPatterns].forEach(pattern => {
      queries.push({
        query: {
          bool: {
            must: [
              this.buildCompanyMatchClause(companyVariations),
              { match_phrase: { active_experience_title: pattern } }
            ],
            filter: [
              { range: { connections_count: { gte: 50 } } },
              { term: { is_working: 1 } }
            ]
          }
        }
      });
    });
    
    return queries;
  }

  /**
   * 🎯 ENHANCED INTRODUCER QUERIES  
   * Executive access and front-line sales patterns
   */
  private buildEnhancedIntroducerQueries(companyVariations: string[], sellerProfile: SellerProfile): any[] {
    const queries: any[] = [];
    
    // Executive Access Patterns
    const executiveAccessPatterns = [
      'Executive Assistant to CEO',
      'Executive Assistant to CRO', 
      'Executive Assistant to VP',
      'Chief of Staff',
      'Executive Coordinator',
      'Senior Executive Assistant'
    ];
    
    // Front-line Sales Patterns (Dell-specific)
    const frontlineSalesPatterns = [
      'Account Executive',
      'Senior Account Executive',
      'Territory Sales Manager',
      'Key Account Manager', 
      'Business Development Representative',
      'Sales Development Representative',
      'Inside Sales Representative'
    ];
    
    // Build targeted queries
    [...executiveAccessPatterns, ...frontlineSalesPatterns].forEach(pattern => {
      queries.push({
        query: {
          bool: {
            must: [
              this.buildCompanyMatchClause(companyVariations),
              { match_phrase: { active_experience_title: pattern } }
            ],
            filter: [
              { range: { connections_count: { gte: 100 } } }, // Higher bar for introducers
              { term: { is_working: 1 } }
            ]
          }
        }
      });
    });
    
    return queries;
  }

  /**
   * 🌍 REGIONAL DECISION MAKER QUERIES
   * Global scope decision makers who might have cross-regional authority
   */
  private buildRegionalDecisionQueries(companyVariations: string[], sellerProfile: SellerProfile): any[] {
    const queries: any[] = [];
    
    const globalDecisionPatterns = [
      'Global VP Sales',
      'Worldwide Sales Director', 
      'International VP',
      'Global Head of Sales',
      'Worldwide Director',
      'International Sales Director',
      'Global Sales Operations VP'
    ];
    
    globalDecisionPatterns.forEach(pattern => {
      queries.push({
        query: {
          bool: {
            must: [
              this.buildCompanyMatchClause(companyVariations),
              { match_phrase: { active_experience_title: pattern } }
            ],
            filter: [
              { range: { connections_count: { gte: 300 } } }, // High authority bar
              { term: { is_working: 1 } }
            ]
          }
        }
      });
    });
    
    return queries;
  }
}
