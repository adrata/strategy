/**
 * 🔗 RELATIONSHIP MAPPING MODULE
 * 
 * Maps corporate relationships and executive networks using Coresignal data:
 * 1. Corporate ownership hierarchies
 * 2. Executive movement patterns (who knows whom)
 * 3. Company-to-company talent flow
 * 4. Board connections and shared leadership
 * 5. PE/VC relationship networks
 */

const fetch = require('node-fetch');

class RelationshipMapping {
    constructor(config = {}) {
        this.config = {
            CORESIGNAL_API_KEY: config.CORESIGNAL_API_KEY || process.env.CORESIGNAL_API_KEY,
            CORESIGNAL_BASE_URL: 'https://api.coresignal.com/cdapi/v1',
            MAX_RETRIES: 3,
            RATE_LIMIT_DELAY: 1000,
            ...config
        };
        
        this.relationshipCache = new Map();
        this.executiveNetworkCache = new Map();
    }

    /**
     * 🎯 MAIN RELATIONSHIP ANALYSIS
     * 
     * Analyzes all relationship dimensions for a company
     */
    async analyzeCompanyRelationships(companyData) {
        console.log(`\n🔗 RELATIONSHIP INTELLIGENCE: ${companyData.companyName}`);
        console.log('=' .repeat(60));

        const relationships = {
            company: companyData,
            corporateHierarchy: {},
            executiveNetwork: {},
            talentFlow: {},
            boardConnections: {},
            investorNetwork: {},
            competitorConnections: {},
            confidence: 0,
            relationshipStrength: 'Unknown',
            networkInfluence: 'Low',
            timestamp: new Date().toISOString()
        };

        try {
            // STEP 1: Corporate Hierarchy Analysis
            console.log('🏢 STEP 1: Corporate Hierarchy Analysis');
            const hierarchyData = await this.analyzeCorporateHierarchy(companyData);
            relationships.corporateHierarchy = hierarchyData;

            // STEP 2: Executive Network Mapping
            console.log('👔 STEP 2: Executive Network Mapping');
            const executiveNetwork = await this.mapExecutiveNetwork(companyData);
            relationships.executiveNetwork = executiveNetwork;

            // STEP 3: Talent Flow Analysis
            console.log('🔄 STEP 3: Talent Flow Analysis');
            const talentFlow = await this.analyzeTalentFlow(companyData);
            relationships.talentFlow = talentFlow;

            // STEP 4: Board & Leadership Connections
            console.log('🎯 STEP 4: Board & Leadership Connections');
            const boardConnections = await this.mapBoardConnections(companyData);
            relationships.boardConnections = boardConnections;

            // STEP 5: Investor Network Analysis
            console.log('💰 STEP 5: Investor Network Analysis');
            const investorNetwork = await this.analyzeInvestorNetwork(companyData);
            relationships.investorNetwork = investorNetwork;

            // STEP 6: Competitor Connections
            console.log('⚔️ STEP 6: Competitor Connections');
            const competitorConnections = await this.analyzeCompetitorConnections(companyData);
            relationships.competitorConnections = competitorConnections;

            // STEP 7: Calculate Relationship Strength & Network Influence
            console.log('📊 STEP 7: Network Analysis');
            const networkAnalysis = this.calculateNetworkMetrics(relationships);
            relationships.confidence = networkAnalysis.confidence;
            relationships.relationshipStrength = networkAnalysis.strength;
            relationships.networkInfluence = networkAnalysis.influence;

            console.log(`✅ RELATIONSHIP ANALYSIS COMPLETE`);
            console.log(`   Corporate Connections: ${Object.keys(relationships.corporateHierarchy.connections || {}).length}`);
            console.log(`   Executive Network Size: ${relationships.executiveNetwork.networkSize || 0}`);
            console.log(`   Talent Flow Connections: ${relationships.talentFlow.connectionCount || 0}`);
            console.log(`   Network Influence: ${relationships.networkInfluence}`);
            console.log(`   Overall Confidence: ${relationships.confidence}%`);

            return relationships;

        } catch (error) {
            console.error(`❌ Relationship analysis failed: ${error.message}`);
            relationships.error = error.message;
            return relationships;
        }
    }

    /**
     * 🏢 CORPORATE HIERARCHY ANALYSIS
     * 
     * Maps parent companies, subsidiaries, and ownership structures
     */
    async analyzeCorporateHierarchy(companyData) {
        const hierarchy = {
            parentCompanies: [],
            subsidiaries: [],
            acquisitions: [],
            ownershipStructure: {},
            corporateFamily: [],
            connections: {}
        };

        try {
            // Get company data from Coresignal
            const companyInfo = await this.fetchCompanyData(companyData.website);
            
            if (companyInfo) {
                // Parent company information
                if (companyInfo.parent_company_information) {
                    hierarchy.parentCompanies.push({
                        name: companyInfo.parent_company_information.parent_company_name,
                        website: companyInfo.parent_company_information.parent_company_website,
                        relationshipDate: companyInfo.parent_company_information.date,
                        relationshipType: 'parent_company'
                    });
                }

                // Acquisition information
                if (companyInfo.acquired_by_summary) {
                    hierarchy.acquisitions.push({
                        acquirer: companyInfo.acquired_by_summary.acquirer_name,
                        date: companyInfo.acquired_by_summary.announced_date,
                        price: companyInfo.acquired_by_summary.price,
                        currency: companyInfo.acquired_by_summary.currency,
                        relationshipType: 'acquisition'
                    });
                }

                // Company's own acquisitions
                if (companyInfo.acquisition_list_source_1) {
                    companyInfo.acquisition_list_source_1.forEach(acquisition => {
                        hierarchy.subsidiaries.push({
                            name: acquisition.acquiree_name,
                            date: acquisition.announced_date,
                            price: acquisition.price,
                            currency: acquisition.currency,
                            relationshipType: 'subsidiary'
                        });
                    });
                }

                // Ownership status
                hierarchy.ownershipStructure = {
                    status: companyInfo.ownership_status,
                    isPublic: companyInfo.is_public,
                    stockTicker: companyInfo.stock_ticker?.[0]?.ticker,
                    exchange: companyInfo.stock_ticker?.[0]?.exchange
                };
            }

            return hierarchy;

        } catch (error) {
            console.error(`Error analyzing corporate hierarchy: ${error.message}`);
            return hierarchy;
        }
    }

    /**
     * 👔 EXECUTIVE NETWORK MAPPING
     * 
     * Maps executive connections through shared companies and roles
     */
    async mapExecutiveNetwork(companyData) {
        const network = {
            currentExecutives: [],
            executiveMovements: [],
            sharedExecutives: [],
            networkSize: 0,
            connectionStrength: 'Low',
            influentialConnections: []
        };

        try {
            const companyInfo = await this.fetchCompanyData(companyData.website);
            
            if (companyInfo) {
                // Current key executives
                if (companyInfo.key_executives) {
                    network.currentExecutives = companyInfo.key_executives.map(exec => ({
                        id: exec.parent_id,
                        name: exec.member_full_name,
                        title: exec.member_position_title,
                        status: 'current'
                    }));
                }

                // Executive arrivals (new connections)
                if (companyInfo.key_executive_arrivals) {
                    network.executiveMovements.push(...companyInfo.key_executive_arrivals.map(exec => ({
                        id: exec.parent_id,
                        name: exec.member_full_name,
                        title: exec.member_position_title,
                        date: exec.arrival_date,
                        type: 'arrival'
                    })));
                }

                // Executive departures (potential ongoing connections)
                if (companyInfo.key_executive_departures) {
                    network.executiveMovements.push(...companyInfo.key_executive_departures.map(exec => ({
                        id: exec.parent_id,
                        name: exec.member_full_name,
                        title: exec.member_position_title,
                        date: exec.departure_date,
                        type: 'departure'
                    })));
                }

                // For each executive, we could fetch their individual profile to see their full career history
                // This would reveal shared companies and potential "who knows whom" connections
                for (const executive of network.currentExecutives.slice(0, 3)) { // Limit to top 3 for API efficiency
                    try {
                        const executiveConnections = await this.analyzeExecutiveConnections(executive.id);
                        if (executiveConnections) {
                            network.sharedExecutives.push({
                                executive: executive.name,
                                connections: executiveConnections
                            });
                        }
                    } catch (error) {
                        console.error(`Error analyzing executive ${executive.name}: ${error.message}`);
                    }
                }

                network.networkSize = network.currentExecutives.length + network.executiveMovements.length;
                network.connectionStrength = this.calculateConnectionStrength(network);
            }

            return network;

        } catch (error) {
            console.error(`Error mapping executive network: ${error.message}`);
            return network;
        }
    }

    /**
     * 🔄 TALENT FLOW ANALYSIS
     * 
     * Analyzes where employees come from and where they go
     */
    async analyzeTalentFlow(companyData) {
        const talentFlow = {
            topSourceCompanies: [],
            topDestinationCompanies: [],
            connectionCount: 0,
            flowStrength: 'Low',
            competitorFlow: [],
            partnerFlow: []
        };

        try {
            const companyInfo = await this.fetchCompanyData(companyData.website);
            
            if (companyInfo) {
                // Companies that employees came from
                if (companyInfo.top_previous_companies) {
                    talentFlow.topSourceCompanies = companyInfo.top_previous_companies.map(company => ({
                        id: company.company_id,
                        name: company.company_name,
                        employeeCount: company.count,
                        relationshipType: 'talent_source'
                    }));
                }

                // Companies that employees likely go to
                if (companyInfo.top_next_companies) {
                    talentFlow.topDestinationCompanies = companyInfo.top_next_companies.map(company => ({
                        id: company.company_id,
                        name: company.company_name,
                        employeeCount: company.count,
                        relationshipType: 'talent_destination'
                    }));
                }

                // Calculate connection metrics
                const sourceCount = talentFlow.topSourceCompanies.reduce((sum, company) => sum + company.employeeCount, 0);
                const destinationCount = talentFlow.topDestinationCompanies.reduce((sum, company) => sum + company.employeeCount, 0);
                
                talentFlow.connectionCount = sourceCount + destinationCount;
                talentFlow.flowStrength = talentFlow.connectionCount > 20 ? 'High' : 
                                         talentFlow.connectionCount > 10 ? 'Medium' : 'Low';

                // Identify potential competitor relationships through talent flow
                talentFlow.competitorFlow = [...talentFlow.topSourceCompanies, ...talentFlow.topDestinationCompanies]
                    .filter(company => company.employeeCount >= 3) // Significant talent exchange
                    .map(company => ({
                        ...company,
                        relationshipType: 'potential_competitor'
                    }));
            }

            return talentFlow;

        } catch (error) {
            console.error(`Error analyzing talent flow: ${error.message}`);
            return talentFlow;
        }
    }

    /**
     * 🎯 BOARD & LEADERSHIP CONNECTIONS
     * 
     * Maps board members and senior leadership connections
     */
    async mapBoardConnections(companyData) {
        const boardConnections = {
            boardMembers: [],
            sharedBoardMembers: [],
            leadershipConnections: [],
            connectionStrength: 'Low'
        };

        try {
            // This would require individual executive profile lookups
            // For now, we use the key executives data as a proxy for board-level connections
            const companyInfo = await this.fetchCompanyData(companyData.website);
            
            if (companyInfo && companyInfo.key_executives) {
                // Identify C-level and board-level executives
                boardConnections.boardMembers = companyInfo.key_executives
                    .filter(exec => this.isBoardLevelExecutive(exec.member_position_title))
                    .map(exec => ({
                        id: exec.parent_id,
                        name: exec.member_full_name,
                        title: exec.member_position_title,
                        level: this.getExecutiveLevel(exec.member_position_title)
                    }));

                boardConnections.connectionStrength = boardConnections.boardMembers.length > 5 ? 'High' :
                                                     boardConnections.boardMembers.length > 2 ? 'Medium' : 'Low';
            }

            return boardConnections;

        } catch (error) {
            console.error(`Error mapping board connections: ${error.message}`);
            return boardConnections;
        }
    }

    /**
     * 💰 INVESTOR NETWORK ANALYSIS
     * 
     * Maps PE, VC, and investor relationships
     */
    async analyzeInvestorNetwork(companyData) {
        const investorNetwork = {
            fundingRounds: [],
            investors: [],
            peConnections: [],
            vcConnections: [],
            totalFunding: 0,
            networkValue: 'Low'
        };

        try {
            const companyInfo = await this.fetchCompanyData(companyData.website);
            
            if (companyInfo) {
                // Last funding round
                if (companyInfo.last_funding_round_name) {
                    investorNetwork.fundingRounds.push({
                        name: companyInfo.last_funding_round_name,
                        date: companyInfo.last_funding_round_announced_date,
                        amount: companyInfo.last_funding_round_amount_raised,
                        currency: companyInfo.last_funding_round_amount_raised_currency,
                        leadInvestors: companyInfo.last_funding_round_lead_investors,
                        numInvestors: companyInfo.last_funding_round_num_investors,
                        type: 'recent'
                    });
                }

                // All funding rounds
                if (companyInfo.funding_rounds) {
                    investorNetwork.fundingRounds.push(...companyInfo.funding_rounds.map(round => ({
                        name: round.name,
                        date: round.announced_date,
                        amount: round.amount_raised,
                        currency: round.amount_raised_currency,
                        leadInvestors: round.lead_investors,
                        numInvestors: round.num_investors,
                        type: 'historical'
                    })));
                }

                // Calculate total funding and extract investor relationships
                investorNetwork.totalFunding = investorNetwork.fundingRounds
                    .reduce((sum, round) => sum + (round.amount || 0), 0);

                // Extract unique investors
                const allInvestors = new Set();
                investorNetwork.fundingRounds.forEach(round => {
                    if (round.leadInvestors) {
                        round.leadInvestors.forEach(investor => allInvestors.add(investor));
                    }
                });

                investorNetwork.investors = Array.from(allInvestors).map(investor => ({
                    name: investor,
                    type: this.categorizeInvestor(investor),
                    relationshipStrength: 'Medium' // Could be enhanced with more data
                }));

                // Categorize by investor type
                investorNetwork.peConnections = investorNetwork.investors.filter(inv => inv.type === 'PE');
                investorNetwork.vcConnections = investorNetwork.investors.filter(inv => inv.type === 'VC');

                investorNetwork.networkValue = investorNetwork.totalFunding > 100000000 ? 'High' :
                                              investorNetwork.totalFunding > 10000000 ? 'Medium' : 'Low';
            }

            return investorNetwork;

        } catch (error) {
            console.error(`Error analyzing investor network: ${error.message}`);
            return investorNetwork;
        }
    }

    /**
     * ⚔️ COMPETITOR CONNECTIONS
     * 
     * Analyzes competitor relationships and market positioning
     */
    async analyzeCompetitorConnections(companyData) {
        const competitorConnections = {
            directCompetitors: [],
            marketPosition: 'Unknown',
            competitiveStrength: 'Low',
            sharedMarkets: []
        };

        try {
            const companyInfo = await this.fetchCompanyData(companyData.website);
            
            if (companyInfo && companyInfo.competitors) {
                competitorConnections.directCompetitors = companyInfo.competitors.map(competitor => ({
                    name: competitor.company_name,
                    similarityScore: competitor.similarity_score,
                    relationshipType: 'competitor'
                }));

                // Analyze competitive strength based on similarity scores
                const avgSimilarity = competitorConnections.directCompetitors
                    .reduce((sum, comp) => sum + comp.similarityScore, 0) / 
                    competitorConnections.directCompetitors.length;

                competitorConnections.competitiveStrength = avgSimilarity > 7000 ? 'High' :
                                                           avgSimilarity > 5000 ? 'Medium' : 'Low';
            }

            return competitorConnections;

        } catch (error) {
            console.error(`Error analyzing competitor connections: ${error.message}`);
            return competitorConnections;
        }
    }

    /**
     * 📊 CALCULATE NETWORK METRICS
     * 
     * Calculates overall relationship strength and network influence
     */
    calculateNetworkMetrics(relationships) {
        let confidence = 0;
        let strengthScore = 0;
        let influenceScore = 0;

        // Corporate hierarchy score (0-25 points)
        const hierarchyConnections = Object.keys(relationships.corporateHierarchy.connections || {}).length;
        confidence += Math.min(hierarchyConnections * 5, 25);
        strengthScore += hierarchyConnections;

        // Executive network score (0-25 points)
        const networkSize = relationships.executiveNetwork.networkSize || 0;
        confidence += Math.min(networkSize * 2, 25);
        strengthScore += networkSize;

        // Talent flow score (0-25 points)
        const flowConnections = relationships.talentFlow.connectionCount || 0;
        confidence += Math.min(flowConnections, 25);
        strengthScore += flowConnections;

        // Investor network score (0-25 points)
        const investorCount = relationships.investorNetwork.investors?.length || 0;
        confidence += Math.min(investorCount * 5, 25);
        influenceScore += investorCount;

        // Calculate final metrics
        const strength = strengthScore > 50 ? 'Very High' :
                        strengthScore > 30 ? 'High' :
                        strengthScore > 15 ? 'Medium' : 'Low';

        const influence = influenceScore > 10 ? 'High' :
                         influenceScore > 5 ? 'Medium' : 'Low';

        return {
            confidence: Math.min(confidence, 100),
            strength,
            influence
        };
    }

    /**
     * 🔧 UTILITY METHODS
     */

    async fetchCompanyData(website) {
        const cacheKey = website.toLowerCase();
        if (this.relationshipCache.has(cacheKey)) {
            return this.relationshipCache.get(cacheKey);
        }

        try {
            if (!this.config.CORESIGNAL_API_KEY) {
                console.log(`   ⚠️ No CoreSignal API key for relationship data`);
                return null;
            }

            console.log(`   📡 Fetching CoreSignal relationship data for: ${website}`);
            
            // Actual CoreSignal API call for company relationship data
            const response = await fetch('https://api.coresignal.com/cdapi/v1/company/search/filter', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.CORESIGNAL_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    website: website,
                    limit: 1
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.companies && data.companies.length > 0) {
                    const companyData = data.companies[0];
                    this.relationshipCache.set(cacheKey, companyData);
                    return companyData;
                }
            } else {
                console.log(`   ⚠️ CoreSignal API error: ${response.status}`);
            }
            
            return null;

        } catch (error) {
            console.error(`Error fetching company data: ${error.message}`);
            return null;
        }
    }

    async analyzeExecutiveConnections(executiveId) {
        try {
            if (!this.config.CORESIGNAL_API_KEY) {
                return null;
            }

            console.log(`   👔 Analyzing executive connections for ID: ${executiveId}`);
            
            // Fetch individual executive profile data
            const response = await fetch(`https://api.coresignal.com/cdapi/v1/employee/collect/${executiveId}`, {
                headers: {
                    'Authorization': `Bearer ${this.config.CORESIGNAL_API_KEY}`
                }
            });

            if (response.ok) {
                const executiveData = await response.json();
                
                // Extract career history and connections
                return {
                    careerHistory: executiveData.experience || [],
                    sharedCompanies: executiveData.previous_companies || [],
                    networkSize: executiveData.connections_count || 0,
                    lastUpdated: executiveData.last_updated
                };
            } else {
                console.log(`   ⚠️ Executive profile API error: ${response.status}`);
            }
        } catch (error) {
            console.error(`Error analyzing executive connections: ${error.message}`);
        }
        
        return null;
    }

    isBoardLevelExecutive(title) {
        const boardTitles = ['CEO', 'CFO', 'CTO', 'COO', 'Chairman', 'President', 'Director', 'Board'];
        return boardTitles.some(boardTitle => 
            title.toLowerCase().includes(boardTitle.toLowerCase())
        );
    }

    getExecutiveLevel(title) {
        if (title.toLowerCase().includes('chairman') || title.toLowerCase().includes('board')) {
            return 'Board';
        }
        if (title.toLowerCase().includes('ceo') || title.toLowerCase().includes('president')) {
            return 'C-Suite';
        }
        if (title.toLowerCase().includes('cfo') || title.toLowerCase().includes('cto') || title.toLowerCase().includes('coo')) {
            return 'C-Level';
        }
        if (title.toLowerCase().includes('vp') || title.toLowerCase().includes('vice president')) {
            return 'VP';
        }
        return 'Senior';
    }

    calculateConnectionStrength(network) {
        const totalConnections = network.networkSize || 0;
        const movementActivity = network.executiveMovements?.length || 0;
        
        if (totalConnections > 20 && movementActivity > 5) return 'Very High';
        if (totalConnections > 10 && movementActivity > 3) return 'High';
        if (totalConnections > 5) return 'Medium';
        return 'Low';
    }

    categorizeInvestor(investorName) {
        const name = investorName.toLowerCase();
        
        // PE patterns
        if (name.includes('capital') || name.includes('equity') || name.includes('partners')) {
            return 'PE';
        }
        
        // VC patterns
        if (name.includes('ventures') || name.includes('venture')) {
            return 'VC';
        }
        
        return 'Other';
    }
}

module.exports = { RelationshipMapping };
