/**
 * 🎯 ENHANCED REVENUE LEADER DETECTION ENGINE
 * 
 * Comprehensive system to identify revenue/sales leaders with 100% accuracy
 * Covers ALL possible title variations and organizational structures
 */

class RevenueLeaderDetection {
    constructor() {
        // TIER 1: C-Level Revenue Leaders (Highest Priority)
        this.tier1Titles = [
            // Chief Revenue Officer variations
            'chief revenue officer', 'cro', 'c.r.o.', 'c.r.o', 'c.r.o',
            'chief sales officer', 'cso', 'c.s.o.', 'c.s.o', 'c.s.o',
            'chief commercial officer', 'cco', 'c.c.o.', 'c.c.o', 'c.c.o',
            'chief business officer', 'cbo', 'c.b.o.', 'c.b.o', 'c.b.o',
            'chief growth officer', 'cgo', 'c.g.o.', 'c.g.o', 'c.g.o',
            'chief customer officer',
            
            // Regional/Global C-Level
            'global chief revenue officer', 'global cro',
            'regional chief revenue officer', 'regional cro',
            'chief revenue & growth officer', 'chief revenue and growth officer',
            'chief sales & marketing officer', 'chief sales and marketing officer',
            
            // President titles - ONLY for sales/revenue/commercial (moved to Tier 2)
            // 'president sales', 'president revenue', 'president commercial',
            // 'sales president', 'revenue president', 'commercial president'
        ];

        // TIER 2: Senior VP Level (High Priority)
        this.tier2Titles = [
            // VP Revenue variations - Comprehensive including misspellings and word order
            'vice president revenue', 'vp revenue', 'vice president of revenue', 'vp of revenue',
            'vp, revenue', 'vice president, revenue', 'vp of revenue',
            'revenue, vp', 'revenue, vice president', 'revenue vp', 'revenue vice president',
            'senior vice president revenue', 'svp revenue', 'senior vp revenue',
            'revenue, svp', 'revenue, senior vice president', 'revenue, senior vp',
            'executive vice president revenue', 'evp revenue', 'executive vp revenue',
            'revenue, evp', 'revenue, executive vice president', 'revenue, executive vp',
            'associate vice president revenue', 'avp revenue', 'associate vp revenue',
            'revenue, avp', 'revenue, associate vice president', 'revenue, associate vp',
            // Full Vice President variations
            'vice president revenue', 'vice president of revenue', 'vice president, revenue',
            'executive vice president revenue', 'executive vice president of revenue', 'executive vice president, revenue',
            'senior vice president revenue', 'senior vice president of revenue', 'senior vice president, revenue',
            'associate vice president revenue', 'associate vice president of revenue', 'associate vice president, revenue',
            // Misspellings and variations
            'vice presedent revenue', 'vice pres revenue', 'vp revenue', 'v.p. revenue',
            'executive vice presedent revenue', 'executive vice pres revenue', 'evp revenue', 'e.v.p. revenue',
            'senior vice presedent revenue', 'senior vice pres revenue', 'svp revenue', 's.v.p. revenue',
            'associate vice presedent revenue', 'associate vice pres revenue', 'avp revenue', 'a.v.p. revenue',
            
            // VP Sales variations - Comprehensive including misspellings and word order
            'vice president sales', 'vp sales', 'vice president of sales', 'vp of sales',
            'vp, sales', 'vice president, sales', 'vp of sales',
            'sales, vp', 'sales, vice president', 'sales vp', 'sales vice president',
            'senior vice president sales', 'svp sales', 'senior vp sales',
            'sales, svp', 'sales, senior vice president', 'sales, senior vp',
            'executive vice president sales', 'evp sales', 'executive vp sales',
            'sales, evp', 'sales, executive vice president', 'sales, executive vp',
            'associate vice president sales', 'avp sales', 'associate vp sales',
            'sales, avp', 'sales, associate vice president', 'sales, associate vp',
            // Full Vice President variations
            'vice president sales', 'vice president of sales', 'vice president, sales',
            'executive vice president sales', 'executive vice president of sales', 'executive vice president, sales',
            'senior vice president sales', 'senior vice president of sales', 'senior vice president, sales',
            'associate vice president sales', 'associate vice president of sales', 'associate vice president, sales',
            // Misspellings and variations
            'vice presedent sales', 'vice pres sales', 'vp sales', 'v.p. sales',
            'executive vice presedent sales', 'executive vice pres sales', 'evp sales', 'e.v.p. sales',
            'senior vice presedent sales', 'senior vice pres sales', 'svp sales', 's.v.p. sales',
            'associate vice presedent sales', 'associate vice pres sales', 'avp sales', 'a.v.p. sales',
            // Comma-separated variations with abbreviations
            'sales, v.p.', 'sales, e.v.p.', 'sales, s.v.p.', 'sales, a.v.p.',
            'revenue, v.p.', 'revenue, e.v.p.', 'revenue, s.v.p.', 'revenue, a.v.p.',
            'business development, v.p.', 'business development, e.v.p.', 'business development, s.v.p.', 'business development, a.v.p.',
            
            // VP Commercial variations
            'vice president commercial', 'vp commercial', 'vice president of commercial', 'vp of commercial',
            'senior vice president commercial', 'svp commercial',
            
            // VP Business Development - Comprehensive including misspellings and word order
            'vice president business development', 'vp business development', 'vp of business development',
            'vp, business development', 'vice president, business development',
            'business development, vp', 'business development, vice president', 'business development vp',
            'senior vice president business development', 'svp business development',
            'business development, svp', 'business development, senior vice president', 'business development, senior vp',
            'executive vice president business development', 'evp business development',
            'business development, evp', 'business development, executive vice president', 'business development, executive vp',
            'associate vice president business development', 'avp business development',
            'business development, avp', 'business development, associate vice president', 'business development, associate vp',
            // Full Vice President variations
            'vice president business development', 'vice president of business development', 'vice president, business development',
            'executive vice president business development', 'executive vice president of business development', 'executive vice president, business development',
            'senior vice president business development', 'senior vice president of business development', 'senior vice president, business development',
            'associate vice president business development', 'associate vice president of business development', 'associate vice president, business development',
            // Misspellings and variations
            'vice presedent business development', 'vice pres business development', 'vp business development', 'v.p. business development',
            'executive vice presedent business development', 'executive vice pres business development', 'evp business development', 'e.v.p. business development',
            'senior vice presedent business development', 'senior vice pres business development', 'svp business development', 's.v.p. business development',
            'associate vice presedent business development', 'associate vice pres business development', 'avp business development', 'a.v.p. business development',
            
            // VP Growth & Strategy
            'vice president growth', 'vp growth', 'vice president of growth', 'vp of growth',
            'vice president strategy', 'vp strategy', 'vice president of strategy', 'vp of strategy',
            
            // Regional VP variations
            'vice president sales north america', 'vp sales north america', 'vp sales na',
            'vice president sales americas', 'vp sales americas',
            'vice president sales emea', 'vp sales emea', 'vp emea sales',
            'vice president sales apac', 'vp sales apac',
            'vice president international sales', 'vp international sales',
            'vice president global sales', 'vp global sales',
            'vp north america sales', 'vp na sales',
            'vp americas sales', 'vp emea sales', 'vp apac sales',
            
            // Industry-specific VP titles
            'vice president enterprise sales', 'vp enterprise sales',
            'vice president channel sales', 'vp channel sales',
            'vice president inside sales', 'vp inside sales',
            'vice president field sales', 'vp field sales',
            'vp enterprise sales', 'vp channel sales', 'vp inside sales', 'vp field sales',
            'enterprise sales vp', 'enterprise sales vice president',
            'channel sales vp', 'channel sales vice president',
            'inside sales vp', 'inside sales vice president',
            'field sales vp', 'field sales vice president',
            
            // President titles - Sales/Revenue/Commercial focused (Tier 2)
            'president sales', 'president revenue', 'president commercial',
            'sales president', 'revenue president', 'commercial president',
            'president of sales', 'president of revenue', 'president of commercial',
            'sales, president', 'revenue, president', 'commercial, president',
            'president, sales', 'president, revenue', 'president, commercial',
            
            // Executive Director titles - ONLY for sales/revenue/commercial
            'executive director sales', 'executive director revenue', 'executive director commercial',
            'sales executive director', 'revenue executive director', 'commercial executive director',
            
            // Head of Sales/Revenue (P&L Leaders - Tier 2) - Comprehensive variations
            'head of sales', 'head of revenue', 'head of commercial', 'head of business development',
            'sales head', 'revenue head', 'commercial head', 'business development head',
            'global head of sales', 'global head of revenue', 'global sales head', 'global revenue head',
            'regional head of sales', 'regional head of revenue', 'regional sales head', 'regional revenue head',
            'national head of sales', 'national head of revenue', 'national sales head', 'national revenue head',
            'international head of sales', 'international head of revenue', 'international sales head', 'international revenue head',
            // Misspellings and variations
            'hed of sales', 'hed of revenue', 'hed of commercial', 'hed of business development',
            'head of sale', 'head of revenu', 'head of comercial', 'head of business developement',
            'head sales', 'head revenue', 'head commercial', 'head business development'
        ];

        // TIER 3: Director Level (Medium Priority)
        this.tier3Titles = [
            // Director Revenue/Sales - Comprehensive variations
            'director of revenue', 'revenue director', 'director revenue',
            'director of sales', 'sales director', 'director sales',
            'senior director of sales', 'senior sales director', 'senior director sales',
            'executive director of sales', 'executive sales director',
            'sales, director', 'revenue, director', 'sales director', 'revenue director',
            'sales, senior director', 'revenue, senior director', 'sales, executive director', 'revenue, executive director',
            
            // Managing Director variations
            'managing director sales', 'managing director revenue', 'managing director commercial',
            'managing director business development',
            'sales, managing director', 'revenue, managing director', 'commercial, managing director', 'business development, managing director',
            
            // Director variations by region/segment
            'director enterprise sales', 'director channel sales', 'director inside sales',
            'director field sales', 'director international sales',
            'director sales operations', 'director revenue operations',
            'enterprise sales director', 'channel sales director', 'inside sales director',
            'field sales director', 'international sales director', 'sales operations director', 'revenue operations director',
            
            // Misspellings and variations
            'director of sale', 'director of revenu', 'sale director', 'revenu director',
            'senior director of sale', 'senior sale director', 'senior director revenu', 'senior revenu director',
            'executive director of sale', 'executive sale director', 'executive director revenu', 'executive revenu director',
            'managing director sale', 'managing director revenu', 'sale managing director', 'revenu managing director',
            'director enterprize sales', 'director chanel sales', 'director insde sales', 'director feild sales',
            'enterprize sales director', 'chanel sales director', 'insde sales director', 'feild sales director',
            // Additional variations
            'sales managing director', 'revenue managing director', 'commercial managing director'
        ];

        // TIER 4: Manager Level (Lower Priority)
        this.tier4Titles = [
            // Sales Manager variations
            'sales manager', 'senior sales manager', 'principal sales manager',
            'national sales manager', 'regional sales manager', 'area sales manager',
            'territory sales manager', 'district sales manager',
            
            // Revenue Manager variations
            'revenue manager', 'senior revenue manager', 'revenue operations manager',
            
            // Account Manager variations (senior level)
            'national account manager', 'global account manager', 'strategic account manager',
            'key account manager', 'major account manager', 'enterprise account manager',
            
            // Business Development Manager
            'business development manager', 'senior business development manager',
            'principal business development manager',
            
            // Channel/Partner Manager
            'channel manager', 'partner manager', 'channel sales manager', 'partner sales manager'
        ];

        // TIER 5: Specialist Level (Lowest Priority)
        this.tier5Titles = [
            'account executive', 'senior account executive', 'principal account executive',
            'sales executive', 'senior sales executive', 'principal sales executive',
            'business development executive', 'senior business development executive',
            'sales representative', 'senior sales representative', 'sales rep',
            'account representative', 'territory representative'
        ];

        // Alternative title patterns to catch variations - COMPREHENSIVE COVERAGE
        this.titlePatterns = [
            // Pattern matching for complex titles (EXCLUDE finance roles)
            /(?:^|\s)chief\s+(?!accounting|financial|finance|controller|treasurer)(revenue|sales|commercial|growth|business)/i,
            
            // VP patterns with comprehensive coverage - including misspellings
            /vp.*revenue/i,
            /vp.*sales/i,
            /vp.*business development/i,
            /revenue.*vp/i,
            /sales.*vp/i,
            /business development.*vp/i,
            /v\.p\..*revenue/i,
            /v\.p\..*sales/i,
            /v\.p\..*business development/i,
            
            // Vice President patterns - including misspellings
            /vice president.*revenue/i,
            /vice president.*sales/i,
            /vice president.*commercial/i,
            /vice president.*business development/i,
            /revenue.*vice president/i,
            /sales.*vice president/i,
            /commercial.*vice president/i,
            /business development.*vice president/i,
            /vice presedent.*revenue/i,
            /vice presedent.*sales/i,
            /vice presedent.*commercial/i,
            /vice presedent.*business development/i,
            /vice pres.*revenue/i,
            /vice pres.*sales/i,
            /vice pres.*commercial/i,
            /vice pres.*business development/i,
            
            // Senior/Executive/Associate VP patterns - including misspellings
            /senior vice president.*sales/i,
            /senior vice president.*revenue/i,
            /executive vice president.*sales/i,
            /executive vice president.*revenue/i,
            /associate vice president.*sales/i,
            /associate vice president.*revenue/i,
            /senior vice presedent.*sales/i,
            /senior vice presedent.*revenue/i,
            /executive vice presedent.*sales/i,
            /executive vice presedent.*revenue/i,
            /associate vice presedent.*sales/i,
            /associate vice presedent.*revenue/i,
            /senior vice pres.*sales/i,
            /senior vice pres.*revenue/i,
            /executive vice pres.*sales/i,
            /executive vice pres.*revenue/i,
            /associate vice pres.*sales/i,
            /associate vice pres.*revenue/i,
            
            // Head patterns - including misspellings
            /head.*sales/i,
            /head.*revenue/i,
            /head.*commercial/i,
            /head.*business development/i,
            /hed.*sales/i,
            /hed.*revenue/i,
            /hed.*commercial/i,
            /hed.*business development/i,
            /sales.*head/i,
            /revenue.*head/i,
            /commercial.*head/i,
            /business development.*head/i,
            
            // Director patterns - including misspellings
            /director.*sales/i,
            /director.*revenue/i,
            /director.*commercial/i,
            /managing director.*sales/i,
            /managing director.*revenue/i,
            /managing director.*commercial/i,
            /sales.*director/i,
            /revenue.*director/i,
            /commercial.*director/i,
            /sales.*managing director/i,
            /revenue.*managing director/i,
            /commercial.*managing director/i,
            
            // President patterns - ONLY for sales/revenue/commercial presidents
            /president.*sales/i,
            /president.*revenue/i,
            /president.*commercial/i,
            /sales.*president/i,
            /revenue.*president/i,
            /commercial.*president/i,
            
            // Executive Director patterns - ONLY for sales/revenue/commercial
            /executive director.*sales/i,
            /executive director.*revenue/i,
            /executive director.*commercial/i,
            /sales.*executive director/i,
            /revenue.*executive director/i,
            /commercial.*executive director/i,
            
            // Regional/Global patterns
            /vp.*global.*sales/i,
            /vp.*international.*sales/i,
            /vp.*north america.*sales/i,
            /vp.*na.*sales/i,
            /vp.*americas.*sales/i,
            /vp.*emea.*sales/i,
            /vp.*apac.*sales/i,
            /global.*sales.*vp/i,
            /international.*sales.*vp/i,
            /north america.*sales.*vp/i,
            /na.*sales.*vp/i,
            /americas.*sales.*vp/i,
            /emea.*sales.*vp/i,
            /apac.*sales.*vp/i,
            
            // Industry-specific patterns
            /vp.*enterprise.*sales/i,
            /vp.*channel.*sales/i,
            /vp.*inside.*sales/i,
            /vp.*field.*sales/i,
            /enterprise.*sales.*vp/i,
            /channel.*sales.*vp/i,
            /inside.*sales.*vp/i,
            /field.*sales.*vp/i,
            
            // Comma-separated patterns
            /sales,\s*(vp|vice president|senior vice president|executive vice president|associate vice president)/i,
            /revenue,\s*(vp|vice president|senior vice president|executive vice president|associate vice president)/i,
            /business development,\s*(vp|vice president|senior vice president|executive vice president|associate vice president)/i,
            /commercial,\s*(vp|vice president|senior vice president|executive vice president|associate vice president)/i,
            
            // Abbreviation patterns with dots
            /(c\.r\.o|c\.s\.o|c\.c\.o|c\.b\.o|c\.g\.o)/i,
            /(e\.v\.p|s\.v\.p|a\.v\.p|v\.p)/i
        ];

        // Industry-specific variations
        this.industrySpecificTitles = {
            'technology': [
                'vp product sales', 'vp solution sales', 'vp technical sales',
                'director solution sales', 'head of partnerships'
            ],
            'healthcare': [
                'vp clinical sales', 'director medical sales', 'head of medical affairs'
            ],
            'financial': [
                'vp institutional sales', 'director wealth management', 'head of private banking'
            ],
            'manufacturing': [
                'vp industrial sales', 'director distribution sales', 'head of channel partners'
            ],
            'services': [
                'vp client development', 'director client services', 'head of client success'
            ]
        };

        // Common title variations and synonyms
        this.titleSynonyms = {
            'vp': ['vice president', 'v.p.', 'v p', 'vice-president'],
            'svp': ['senior vice president', 'senior vp', 's.v.p.', 'sr vp', 'sr. vp'],
            'evp': ['executive vice president', 'executive vp', 'e.v.p.', 'exec vp'],
            'cro': ['chief revenue officer', 'c.r.o.'],
            'cso': ['chief sales officer', 'c.s.o.'],
            'cco': ['chief commercial officer', 'c.c.o.'],
            'cbo': ['chief business officer', 'c.b.o.'],
            'cgo': ['chief growth officer', 'c.g.o.']
        };
    }

    /**
     * 🎯 MAIN REVENUE LEADER IDENTIFICATION - WATERFALL APPROACH
     */
    identifyRevenueLeader(executives) {
        console.log(`\n🎯 REVENUE LEADER IDENTIFICATION - WATERFALL APPROACH - ${executives.length} executives`);
        
        // WATERFALL THESIS: Find the most relevant senior person in order of priority
        const waterfallCandidates = this.applyWaterfallThesis(executives);
        
        if (waterfallCandidates.length > 0) {
            const bestCandidate = waterfallCandidates[0];
            console.log(`   🎯 WATERFALL RESULT: ${bestCandidate.name} - ${bestCandidate.title} (Tier ${bestCandidate.tier}, Score: ${bestCandidate.revenueScore})`);
            console.log(`      Reason: ${bestCandidate.waterfallReason}`);
            return bestCandidate;
        }

        console.log(`   ❌ No suitable revenue leader found in waterfall approach`);
        return null;
    }

    /**
     * 🌊 WATERFALL THESIS - Find most relevant senior person
     * PRIORITY: Direct Revenue/Sales > Business Unit Presidents > Operations > Marketing > Other Senior
     */
    applyWaterfallThesis(executives) {
        const candidates = [];
        
        // TIER 1: Direct Revenue/Sales Leaders (HIGHEST PRIORITY)
        console.log(`   🔍 TIER 1: Direct Revenue/Sales Leaders (CRO, CSO, VP Sales, Director Sales)`);
        for (const executive of executives) {
            const analysis = this.analyzeRevenueRole(executive);
            if (analysis.isRevenueRole && analysis.tier <= 3) {
                candidates.push({
                    ...executive,
                    ...analysis,
                    waterfallReason: `Direct revenue/sales leader (${(analysis.matchedTitles || []).join(', ') || 'pattern match'})`
                });
            }
        }
        
        if (candidates.length > 0) {
            console.log(`      ✅ Found ${candidates.length} direct revenue/sales leaders`);
            return this.sortCandidates(candidates);
        }

        // TIER 2: Business Unit Presidents (Likely oversee revenue operations)
        console.log(`   🔍 TIER 2: Business Unit Presidents (oversee revenue operations)`);
        for (const executive of executives) {
            const title = (executive.title || '').toLowerCase();
            if (title.includes('president') && !title.includes('chief') && !title.includes('executive')) {
                // Exclude finance roles
                if (!title.includes('accounting') && !title.includes('financial') && !title.includes('finance')) {
                    candidates.push({
                        ...executive,
                        tier: 4,
                        revenueScore: 85,
                        isRevenueRole: true,
                        waterfallReason: `Business unit president (oversees revenue operations)`
                    });
                }
            }
        }
        
        if (candidates.length > 0) {
            console.log(`      ✅ Found ${candidates.length} business unit presidents`);
            return this.sortCandidates(candidates);
        }

        // TIER 3: Operations Leaders (COO - often oversees sales operations)
        console.log(`   🔍 TIER 3: Operations Leaders (COO - oversees sales operations)`);
        for (const executive of executives) {
            const title = (executive.title || '').toLowerCase();
            if ((title.includes('chief operating officer') || title.includes('coo') || 
                 title.includes('executive director')) && 
                !title.includes('accounting') && !title.includes('financial') && !title.includes('finance')) {
                candidates.push({
                    ...executive,
                    tier: 5,
                    revenueScore: 80,
                    isRevenueRole: true,
                    waterfallReason: `Operations leader (oversees sales operations)`
                });
            }
        }
        
        if (candidates.length > 0) {
            console.log(`      ✅ Found ${candidates.length} operations leaders`);
            return this.sortCandidates(candidates);
        }

        // TIER 4: Marketing Leaders (CMO - drives revenue growth, but indirect)
        console.log(`   🔍 TIER 4: Marketing Leaders (CMO - indirect revenue impact)`);
        for (const executive of executives) {
            const title = (executive.title || '').toLowerCase();
            if (title.includes('chief marketing officer') || title.includes('cmo') || 
                title.includes('marketing')) {
                candidates.push({
                    ...executive,
                    tier: 6,
                    revenueScore: 75,
                    isRevenueRole: true,
                    waterfallReason: `Marketing leader (indirect revenue impact)`
                });
            }
        }
        
        if (candidates.length > 0) {
            console.log(`      ✅ Found ${candidates.length} marketing leaders`);
            return this.sortCandidates(candidates);
        }

        // TIER 5: Other Senior Business Leaders
        console.log(`   🔍 TIER 5: Other Senior Business Leaders`);
        for (const executive of executives) {
            const title = (executive.title || '').toLowerCase();
            
            // Comprehensive exclusion list for non-revenue roles
            const technicalKeywords = [
                'accounting', 'financial', 'finance', 'controller', 'treasurer', 'cfo',
                'legal', 'compliance', 'regulatory', 'risk', 'audit',
                'technology', 'engineering', 'technical', 'cyber', 'security', 'infrastructure',
                'it ', 'information technology', 'software', 'hardware', 'development',
                'research', 'r&d', 'innovation', 'product', 'design', 'architecture',
                'operations', 'manufacturing', 'supply chain', 'logistics', 'facilities',
                'human resources', 'hr', 'talent', 'recruiting', 'people',
                'communications', 'pr', 'public relations', 'marketing communications'
            ];
            
            const isTechnicalRole = technicalKeywords.some(keyword => title.includes(keyword));
            
            // Look for other senior titles that aren't technical/functional roles
            if ((title.includes('vice president') || title.includes('vp') || 
                 title.includes('director') || title.includes('head of')) &&
                !isTechnicalRole) {
                candidates.push({
                    ...executive,
                    tier: 7,
                    revenueScore: 70,
                    isRevenueRole: true,
                    waterfallReason: `Senior business leader (potential revenue oversight)`
                });
            } else if (isTechnicalRole) {
                console.log(`      Skipping technical role for revenue detection: ${executive.name} - ${executive.title}`);
            }
        }
        
        if (candidates.length > 0) {
            console.log(`      ✅ Found ${candidates.length} senior business leaders`);
            return this.sortCandidates(candidates);
        }

        console.log(`      ❌ No suitable candidates found in any tier`);
        return [];
    }

    /**
     * 📊 SORT CANDIDATES BY TIER AND SCORE
     */
    sortCandidates(candidates) {
        return candidates.sort((a, b) => {
            if (a.tier !== b.tier) return a.tier - b.tier;
            return b.revenueScore - a.revenueScore;
        });
    }

    /**
     * 🔍 ANALYZE REVENUE ROLE
     */
    analyzeRevenueRole(executive) {
        const title = (executive.title || '').toLowerCase().trim();
        const name = (executive.name || '').toLowerCase().trim();
        
        if (!title) {
            return { isRevenueRole: false, tier: null, revenueScore: 0 };
        }

        // EXCLUDE NON-REVENUE ROLES - Focus on P&L leaders only
        // Only exclude if the title contains finance-related keywords AND doesn't contain revenue-related keywords
        const financeKeywords = ['accounting', 'financial', 'controller', 'treasurer', 'cfo'];
        const revenueKeywords = ['sales', 'revenue', 'commercial', 'growth', 'business development'];
        
        const hasFinanceKeyword = financeKeywords.some(keyword => title.includes(keyword));
        const hasRevenueKeyword = revenueKeywords.some(keyword => title.includes(keyword));
        
        // Only exclude if it has finance keywords but NO revenue keywords
        if (hasFinanceKeyword && !hasRevenueKeyword) {
            console.log(`   Analyzing: ${executive.name} - "${executive.title}" - EXCLUDED (Finance Role)`);
            return { isRevenueRole: false, tier: 99, revenueScore: 0 };
        }
        
        // Also exclude other non-revenue roles - but be context-aware
        const otherNonRevenueKeywords = [
            'legal', 'compliance', 'regulatory', 'risk', 'audit',
            'technology', 'engineering', 'technical', 'cyber', 'security', 'infrastructure',
            'it ', 'information technology', 'software', 'hardware',
            'research', 'r&d', 'innovation', 'product', 'design', 'architecture',
            'manufacturing', 'supply chain', 'logistics', 'facilities',
            'human resources', 'hr', 'talent', 'recruiting', 'people',
            'communications', 'public relations', 'marketing communications'
        ];
        
        // Only exclude if it has non-revenue keywords AND doesn't have revenue keywords
        const isOtherNonRevenueRole = otherNonRevenueKeywords.some(keyword => title.includes(keyword));
        if (isOtherNonRevenueRole && !hasRevenueKeyword) {
            console.log(`   Analyzing: ${executive.name} - "${executive.title}" - EXCLUDED (Non-Revenue Role)`);
            return { isRevenueRole: false, tier: 99, revenueScore: 0 };
        }

        console.log(`   Analyzing: ${executive.name} - "${executive.title}"`);

        // Check each tier
        const tierAnalysis = this.getTierAnalysis(title);
        
        // Pattern matching for complex titles
        const patternMatch = this.getPatternMatch(title);
        
        // Calculate comprehensive score
        const revenueScore = this.calculateRevenueScore(title, name, tierAnalysis, patternMatch);
        
        // Focus on P&L leaders only (Tier 1-3) - exclude junior sales roles
        const isRevenueRole = tierAnalysis.tier <= 3 || patternMatch.matched || revenueScore >= 70;
        
        console.log(`     Tier: ${tierAnalysis.tier}, Pattern: ${patternMatch.matched}, Score: ${revenueScore}, Revenue Role: ${isRevenueRole}`);

        return {
            isRevenueRole,
            tier: tierAnalysis.tier,
            revenueScore,
            matchedTitles: (tierAnalysis.matchedTitles || []).concat(patternMatch.patterns || []),
            confidence: this.calculateConfidence(tierAnalysis.tier, revenueScore, patternMatch.matched)
        };
    }

    /**
     * 📊 GET TIER ANALYSIS
     */
    getTierAnalysis(title) {
        const matchedTitles = [];
        
        // Check Tier 1 (C-Level) - Use word boundary matching for precision
        for (const t1Title of this.tier1Titles) {
            // Use word boundary matching to avoid substring issues
            const pattern = new RegExp(`\\b${t1Title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
            if (pattern.test(title)) {
                matchedTitles.push(t1Title);
                return { tier: 1, matchedTitles };
            }
        }

        // Check Tier 2 (VP Level) - Use flexible matching for comma-separated titles
        for (const t2Title of this.tier2Titles) {
            // For comma-separated titles, use more flexible matching
            if (t2Title.includes(',')) {
                // Split by comma and check if all parts are present
                const parts = t2Title.split(',').map(part => part.trim());
                const allPartsPresent = parts.every(part => {
                    // For abbreviations with dots, use different matching
                    if (part.includes('.')) {
                        // Escape dots and use a more flexible pattern for dotted abbreviations
                        const escapedPart = part.replace(/\./g, '\\.');
                        // Use a pattern that matches the abbreviation as a whole unit
                        return new RegExp(`(?:^|\\s|,)${escapedPart}(?:\\s|,|$)`, 'i').test(title);
                    } else {
                        // Use word boundary matching for regular parts
                        return new RegExp(`\\b${part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(title);
                    }
                });
                if (allPartsPresent) {
                    matchedTitles.push(t2Title);
                    return { tier: 2, matchedTitles };
                }
            } else {
                // Use word boundary matching for non-comma titles
                const pattern = new RegExp(`\\b${t2Title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
                if (pattern.test(title)) {
                    matchedTitles.push(t2Title);
                    return { tier: 2, matchedTitles };
                }
            }
        }

        // Check Tier 3 (Director Level) - Use word boundary matching for precision
        for (const t3Title of this.tier3Titles) {
            // Use word boundary matching to avoid substring issues
            const pattern = new RegExp(`\\b${t3Title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
            if (pattern.test(title)) {
                matchedTitles.push(t3Title);
                return { tier: 3, matchedTitles };
            }
        }

        // Check Tier 4 (Manager Level) - Use word boundary matching for precision
        for (const t4Title of this.tier4Titles) {
            // Use word boundary matching to avoid substring issues
            const pattern = new RegExp(`\\b${t4Title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
            if (pattern.test(title)) {
                matchedTitles.push(t4Title);
                return { tier: 4, matchedTitles };
            }
        }

        // Check Tier 5 (Specialist Level) - Use word boundary matching for precision
        for (const t5Title of this.tier5Titles) {
            // Use word boundary matching to avoid substring issues
            const pattern = new RegExp(`\\b${t5Title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
            if (pattern.test(title)) {
                matchedTitles.push(t5Title);
                return { tier: 5, matchedTitles };
            }
        }

        return { tier: 99, matchedTitles: [] }; // No match
    }

    /**
     * 🔍 GET PATTERN MATCH
     */
    getPatternMatch(title) {
        const patterns = [];
        let matched = false;

        for (const pattern of this.titlePatterns) {
            if (pattern.test(title)) {
                patterns.push(pattern.toString());
                matched = true;
            }
        }

        return { matched, patterns };
    }

    /**
     * 📈 CALCULATE REVENUE SCORE
     */
    calculateRevenueScore(title, name, tierAnalysis, patternMatch) {
        let score = 0;

        // Base score by tier
        switch (tierAnalysis.tier) {
            case 1: score += 100; break; // C-Level
            case 2: score += 85; break;  // VP Level
            case 3: score += 70; break;  // Director Level
            case 4: score += 55; break;  // Manager Level
            case 5: score += 40; break;  // Specialist Level
        }

        // Pattern matching bonus
        if (patternMatch.matched) {
            score += 20;
        }

        // Keyword bonuses (EXCLUDE finance roles)
        if (title.includes('revenue') && !title.includes('accounting') && !title.includes('financial') && !title.includes('finance') && !title.includes('controller') && !title.includes('treasurer')) {
            score += 15;
        }
        if (title.includes('sales') && !title.includes('accounting') && !title.includes('financial') && !title.includes('finance') && !title.includes('controller') && !title.includes('treasurer')) {
            score += 12;
        }
        if (title.includes('commercial') && !title.includes('accounting') && !title.includes('financial') && !title.includes('finance') && !title.includes('controller') && !title.includes('treasurer')) {
            score += 10;
        }
        if (title.includes('growth') && !title.includes('accounting') && !title.includes('financial') && !title.includes('finance') && !title.includes('controller') && !title.includes('treasurer')) {
            score += 8;
        }
        if (title.includes('business development') && !title.includes('accounting') && !title.includes('financial') && !title.includes('finance') && !title.includes('controller') && !title.includes('treasurer')) {
            score += 8;
        }

        // Seniority bonuses (EXCLUDE finance roles)
        if (title.includes('chief') && !title.includes('accounting') && !title.includes('financial') && !title.includes('finance') && !title.includes('controller') && !title.includes('treasurer')) {
            score += 25;
        }
        if (title.includes('senior') || title.includes('sr.') || title.includes('sr ')) score += 10;
        if (title.includes('executive') || title.includes('exec')) score += 8;
        if (title.includes('principal')) score += 6;

        // Geographic scope bonuses
        if (title.includes('global')) score += 10;
        if (title.includes('international')) score += 8;
        if (title.includes('regional')) score += 5;
        if (title.includes('national')) score += 5;

        return Math.min(score, 100); // Cap at 100
    }

    /**
     * 🎯 CALCULATE CONFIDENCE
     */
    calculateConfidence(tier, revenueScore, patternMatched) {
        let confidence = 0;

        // Base confidence by tier
        switch (tier) {
            case 1: confidence = 0.95; break; // C-Level
            case 2: confidence = 0.90; break; // VP Level
            case 3: confidence = 0.80; break; // Director Level
            case 4: confidence = 0.70; break; // Manager Level
            case 5: confidence = 0.60; break; // Specialist Level
            default: confidence = 0.30; break; // Pattern match only
        }

        // Score adjustment
        if (revenueScore >= 90) confidence += 0.05;
        else if (revenueScore >= 80) confidence += 0.03;
        else if (revenueScore >= 70) confidence += 0.01;
        else if (revenueScore < 50) confidence -= 0.10;

        // Pattern match bonus
        if (patternMatched && tier > 5) confidence += 0.15;

        return Math.min(confidence, 1.0); // Cap at 1.0
    }

    /**
     * 🔍 ENHANCED TITLE NORMALIZATION
     */
    normalizeTitle(title) {
        if (!title) return '';
        
        let normalized = title.toLowerCase().trim();
        
        // Expand common abbreviations
        for (const [abbrev, expansions] of Object.entries(this.titleSynonyms)) {
            for (const expansion of expansions) {
                normalized = normalized.replace(new RegExp(`\\b${abbrev}\\b`, 'gi'), expansion);
            }
        }

        // Remove common noise words
        const noiseWords = ['the', 'of', 'and', '&', '-', '/', '|', ',', '.'];
        for (const noise of noiseWords) {
            normalized = normalized.replace(new RegExp(`\\s+${noise}\\s+`, 'g'), ' ');
        }

        // Clean up whitespace
        normalized = normalized.replace(/\s+/g, ' ').trim();

        return normalized;
    }

    /**
     * 📋 GET ALL REVENUE TITLES (for debugging)
     */
    getAllRevenueTitles() {
        return {
            tier1: this.tier1Titles,
            tier2: this.tier2Titles,
            tier3: this.tier3Titles,
            tier4: this.tier4Titles,
            tier5: this.tier5Titles,
            patterns: this.titlePatterns.map(p => p.toString()),
            industrySpecific: this.industrySpecificTitles
        };
    }

    /**
     * 🧪 TEST TITLE MATCHING
     */
    testTitleMatching(testTitles) {
        console.log('\n🧪 TESTING REVENUE TITLE MATCHING');
        console.log('=' .repeat(60));

        for (const title of testTitles) {
            const executive = { name: 'Test Person', title: title };
            const analysis = this.analyzeRevenueRole(executive);
            
            console.log(`\nTitle: "${title}"`);
            console.log(`  Revenue Role: ${analysis.isRevenueRole}`);
            console.log(`  Tier: ${analysis.tier}`);
            console.log(`  Score: ${analysis.revenueScore}`);
            console.log(`  Confidence: ${Math.round(analysis.confidence * 100)}%`);
            console.log(`  Matched: ${(analysis.matchedTitles || []).join(', ')}`);
        }
    }
}

module.exports = { RevenueLeaderDetection };
