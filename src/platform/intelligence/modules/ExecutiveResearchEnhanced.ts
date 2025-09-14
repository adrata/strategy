/**
 * 🎯 ENHANCED EXECUTIVE RESEARCH MODULE
 * 
 * Based on proven pipeline patterns with comprehensive auditing.
 * Multi-layered approach for 100% executive discovery rate.
 */

import { ExecutiveContact, APIConfig } from '../types/intelligence';
import { cache } from '@/platform/services';
import { PipelineAuditor } from '../services/PipelineAuditor';
import { RoleDetectionEngine } from './RoleDetectionEngine';

// Ensure fetch is available in Node.js environment
if (typeof fetch === 'undefined') {
  global['fetch'] = require('node-fetch');
}

interface ExecutiveSearchResult {
  executives: ExecutiveCandidate[];  // NEW: Main executives array for ResearchOrchestrator
  allExecutives: ExecutiveCandidate[];
  confidence: number;
  researchMethods: string[];
  processingTime: number;
  auditReport?: string;
  // Legacy fields (will be removed)
  cfo?: ExecutiveCandidate;
  cro?: ExecutiveCandidate;
  ceo?: ExecutiveCandidate;
}

interface ExecutiveCandidate {
  name: string;
  title: string;
  role: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  confidence: number;
  tier?: number;
  source: string;
  reasoning: string;
  appointmentDate?: string;
  roleValidation?: string;
}

export class ExecutiveResearchEnhanced {
  private config: APIConfig;
  private auditor: PipelineAuditor;
  private roleDetector: RoleDetectionEngine;

  constructor(config: APIConfig) {
    this['config'] = config;
    this['auditor'] = new PipelineAuditor();
    this['roleDetector'] = new RoleDetectionEngine();
    
    console.log('🎯 [EXECUTIVE RESEARCH ENHANCED] Module initialized');
    console.log(`   Perplexity AI: ${this.config.PERPLEXITY_API_KEY ? 'Available' : 'Missing'}`);
    console.log(`   OpenAI: ${this.config.OPENAI_API_KEY ? 'Available' : 'Missing'}`);
  }

  /**
   * 🔍 MAIN EXECUTIVE RESEARCH ENTRY POINT (DYNAMIC ROLES)
   */
  async researchExecutives(
    companyName: string,
    website: string,
    targetRoles: string[] = ['CFO', 'CRO'],
    sessionId: string = 'default',
    sellingContext?: any
  ): Promise<ExecutiveSearchResult> {
    console.log(`\n🎯 [EXECUTIVE RESEARCH] Enhanced research: ${companyName}`);
    
    const accountId = companyName.replace(/[^a-zA-Z0-9]/g, '_');
    this.auditor.startAudit(sessionId, accountId, companyName);
    
    const startTime = Date.now();
    
    // Check cache first
    const cacheStepId = this.auditor.logStep(accountId, 'cache_lookup', 'caching', { companyName, targetRoles });
    const cacheKey = `executives:${companyName}:${targetRoles.join(',')}`;
    const cached = await cache.get(cacheKey, async () => null, {
      tags: ['executive-research-enhanced']
    });
    
    if (cached) {
      this.auditor.completeStep(accountId, 'cache_lookup', true, cached, undefined, 0);
      console.log('💾 [EXECUTIVE RESEARCH] Using cached results');
      return { ...cached, auditReport: this.auditor.getAuditReport(accountId) };
    } else {
      this.auditor.completeStep(accountId, 'cache_lookup', true, null, 'Cache miss - proceeding with fresh research');
    }

    const result: ExecutiveSearchResult = {
      executives: [],  // NEW: Main array for ResearchOrchestrator
      allExecutives: [],
      confidence: 0,
      researchMethods: [],
      processingTime: 0
    };

    try {
      // LAYER 1: AI-Powered Executive Research (Primary)
      console.log('🤖 [LAYER 1] AI-Powered Executive Research');
      const aiStepId = this.auditor.logStep(accountId, 'ai_executive_research', 'api_call', { companyName, website, targetRoles });
      
      const aiResult = await this.intelligentExecutiveResearch(companyName, website, targetRoles, sellingContext);
      
      if (aiResult.executives.length > 0) {
        result.allExecutives.push(...aiResult.executives);
        result.executives.push(...aiResult.executives);  // CRITICAL: Populate both arrays
        result.researchMethods.push('ai_research');
        this.auditor.completeStep(accountId, 'ai_executive_research', true, 
          { executivesFound: aiResult.executives.length }, undefined, 0.02);
        console.log(`   ✅ Found ${aiResult.executives.length} executives via AI`);
      } else {
        this.auditor.completeStep(accountId, 'ai_executive_research', false, null, 'No executives found via AI research');
        console.log(`   ❌ No executives found via AI research`);
      }

      // LAYER 2: Dynamic Role Classification (NO MORE CFO/CRO HARDCODING)
      console.log('🏷️ [LAYER 2] Dynamic Role Classification');
      const classificationStepId = this.auditor.logStep(accountId, 'role_classification', 'data_processing', 
        { allExecutives: result.allExecutives.length });
      
      // Process ALL found executives dynamically
      const processedExecutives: ExecutiveCandidate[] = [];
      
      for (const executive of result.allExecutives) {
        // Validate the executive role against target roles
        if (targetRoles.includes(executive.role) || targetRoles['length'] === 0) {
          processedExecutives.push(executive);
          console.log(`   ✅ Executive: ${executive.name} (${executive.role}) - ${executive.confidence}% confidence`);
        } else {
          console.log(`   ⚠️ Executive ${executive.name} (${executive.role}) not in target roles: ${targetRoles.join(', ')}`);
        }
      }
      
      // Store all executives in the result (update both arrays)
      result['executives'] = processedExecutives;
      result['allExecutives'] = processedExecutives;
      
      this.auditor.completeStep(accountId, 'role_classification', processedExecutives.length > 0, 
        { executivesProcessed: processedExecutives.length, targetRoles: targetRoles.length });

      // LAYER 3: Confidence Calculation and Final Processing
      console.log('📊 [LAYER 3] Confidence Calculation');
      const confidenceStepId = this.auditor.logStep(accountId, 'confidence_calculation', 'data_processing', 
        { executivesFound: processedExecutives.length });
      
      result['confidence'] = this.calculateOverallConfidence(result);
      result['processingTime'] = Date.now() - startTime;

      this.auditor.completeStep(accountId, 'confidence_calculation', true, 
        { confidence: result.confidence, processingTime: result.processingTime });

      console.log(`✅ [EXECUTIVE RESEARCH] Complete: ${result.confidence}% confidence, ${result.processingTime}ms`);

      // Cache results if successful
      if (result.confidence > 50) {
        const cacheStoreStepId = this.auditor.logStep(accountId, 'cache_store', 'caching', result);
        await cache.set(cacheKey, result, {
          ttl: 3600000, // 1 hour cache
          tags: ['executive-research-enhanced'],
          priority: 'high'
        });
        this.auditor.completeStep(accountId, 'cache_store', true);
      }

      // Complete audit
      const auditResult = this.auditor.completeAudit(accountId, result, result.confidence);
      result['auditReport'] = this.auditor.getAuditReport(accountId);

      return result;

    } catch (error) {
      console.error('❌ [EXECUTIVE RESEARCH] CRITICAL ERROR:', error);
      console.error('❌ Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack');
      
      this.auditor.completeStep(accountId, 'executive_research_error', false, null, 
        error instanceof Error ? error.message : 'Unknown error');
      
      result['processingTime'] = Date.now() - startTime;
      result['executives'] = []; // Ensure executives array exists
      const auditResult = this.auditor.completeAudit(accountId, result, 0);
      result['auditReport'] = this.auditor.getAuditReport(accountId);
      
      return result;
    }
  }

  /**
   * 🧠 INTELLIGENT EXECUTIVE RESEARCH (Based on proven pipeline patterns)
   */
  private async intelligentExecutiveResearch(
    companyName: string,
    website: string,
    targetRoles: string[],
    sellingContext?: any
  ): Promise<{ executives: ExecutiveCandidate[] }> {
    if (!this.config.PERPLEXITY_API_KEY) {
      console.log('⚠️ [AI RESEARCH] Perplexity API key not available');
      return { executives: [] };
    }

    // Dynamic prompt based on selling context
    const roleList = targetRoles.join(', ');
    const productContext = sellingContext?.productCategory || 'business software';
    const dealSize = sellingContext?.averageDealSize || 100000;
    
    const prompt = `Find the current senior executives and decision makers at ${companyName} (${website}) who would be involved in purchasing ${productContext} solutions.

Company website: ${website}
Deal size context: $${dealSize.toLocaleString()}

DYNAMIC REQUIREMENTS BASED ON PRODUCT:
${this.generateDynamicRequirements(targetRoles, productContext, dealSize)}

CRITICAL VALIDATION:
1. ONLY return executives you can verify currently work at ${companyName}
2. Match roles to the specific product being sold (${productContext})
3. Consider deal size ($${dealSize.toLocaleString()}) for authority level
4. Include confidence level (0.0-1.0) based on source reliability

Please provide a JSON response with ALL current senior executives and decision makers:
{
  "executives": [
    {
      "name": "Full Name",
      "title": "Exact current title",
      "role": "CEO/CFO/COO/General_Counsel/President/VP_Operations/etc",
      "confidence": 0.95,
      "source": "company_website/LinkedIn/press_release",
      "appointmentDate": "2024-01-01 or null",
      "roleValidation": "why this person is a decision maker for ${productContext}"
    }
  ]
}

Find ALL decision makers who would be involved in ${productContext} purchasing decisions, including:
- Chief Executive Officer (CEO) / President
- Chief Financial Officer (CFO) 
- Chief Operating Officer (COO)
- General Counsel / Chief Legal Officer
- VP Operations / VP Finance / VP Legal
- Other senior decision makers

Return 3-7 executives total to build a complete buyer group.`;

    try {
      console.log(`   🔍 Making Perplexity API call for ${companyName}...`);
      
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'sonar-pro',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1500,
          temperature: 0.1
        })
      });

      console.log(`   📡 Perplexity API response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`   ❌ Perplexity API error: ${response.status} - ${errorText}`);
        throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      
      console.log(`   📝 AI Response received (${content.length} characters)`);
      console.log(`   📄 Response preview: ${content.substring(0, 200)}...`);

      // Parse AI response as JSON (using proven working method)
      const executives = this.parseJSONResponse(content, companyName);
      
      console.log(`   🎯 Parsed ${executives.length} executive candidates`);
      return { executives };

    } catch (error) {
      console.error('❌ [AI RESEARCH] Error:', error);
      return { executives: [] };
    }
  }

  /**
   * 📝 PARSE ENHANCED AI RESPONSE (JSON format)
   */
  private parseEnhancedAIResponse(content: string, companyName: string): ExecutiveCandidate[] {
    const executives: ExecutiveCandidate[] = [];
    
    try {
      // Try to extract JSON from the response
      let jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.log('   ⚠️ No JSON found in AI response, trying text parsing...');
        return this.parseTextResponse(content, companyName);
      }

      const jsonStr = jsonMatch[0];
      const parsed = JSON.parse(jsonStr);
      
      console.log(`   📊 Parsed JSON response:`, JSON.stringify(parsed, null, 2));

      // Extract CFO
      if (parsed['cfo'] && parsed['cfo']['name'] && parsed.cfo.name !== 'null') {
        executives.push({
          name: parsed.cfo.name,
          title: parsed.cfo.title || 'Chief Financial Officer',
          role: 'CFO',
          confidence: Math.round((parsed.cfo.confidence || 0.8) * 100),
          source: parsed.cfo.source || 'ai_research',
          reasoning: `CFO found via AI research: ${parsed.cfo.roleValidation || 'Finance role confirmed'}`,
          appointmentDate: parsed.cfo.appointmentDate
        });
        console.log(`   ✅ CFO extracted: ${parsed.cfo.name} (${parsed.cfo.title})`);
      }

      // Extract CRO
      if (parsed['cro'] && parsed['cro']['name'] && parsed.cro.name !== 'null') {
        executives.push({
          name: parsed.cro.name,
          title: parsed.cro.title || 'Chief Revenue Officer',
          role: 'CRO',
          confidence: Math.round((parsed.cro.confidence || 0.8) * 100),
          source: parsed.cro.source || 'ai_research',
          reasoning: `CRO found via AI research: ${parsed.cro.roleValidation || 'Revenue role confirmed'}`,
          appointmentDate: parsed.cro.appointmentDate
        });
        console.log(`   ✅ CRO extracted: ${parsed.cro.name} (${parsed.cro.title})`);
      }

    } catch (parseError) {
      console.log(`   ⚠️ JSON parsing failed: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      console.log(`   📝 Falling back to text parsing...`);
      return this.parseTextResponse(content, companyName);
    }

    return executives;
  }

  /**
   * 📊 PARSE JSON RESPONSE (PROVEN WORKING METHOD FROM OLD PIPELINE)
   */
  private parseJSONResponse(content: string, companyName: string): ExecutiveCandidate[] {
    const executives: ExecutiveCandidate[] = [];
    
    try {
      console.log(`   📊 [JSON PARSER] Parsing response for ${companyName}`);
      
      // Use exact working pattern from old ExecutiveResearch.js lines 692-694
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log(`   📋 Parsed JSON:`, JSON.stringify(parsed, null, 2));

        // Extract executives from array format
        if (parsed['executives'] && Array.isArray(parsed.executives)) {
          console.log(`   📋 Found ${parsed.executives.length} executives in JSON response`);
          
          for (const execData of parsed.executives) {
            if (execData['name'] && execData.name !== 'null') {
              const roleDetection = this.roleDetector.detectRole(execData.title);
              
              executives.push({
                name: execData.name,
                title: execData.title,
                role: execData.role || roleDetection?.role || 'Executive',
                confidence: Math.round((execData.confidence || 0.8) * 100),
                tier: roleDetection?.tier || 1,
                source: execData.source || 'ai_json_research',
                reasoning: `${execData.role || 'Executive'} found via AI JSON research: ${execData.roleValidation || 'Role confirmed'}`,
                appointmentDate: execData.appointmentDate
              });
              
              console.log(`   ✅ Executive extracted: ${execData.name} (${execData.role || execData.title})`);
            }
          }
        } else {
          console.log(`   ⚠️ No executives array found in JSON response`);
        }

      } else {
        console.log(`   ⚠️ No JSON found, falling back to text parsing`);
        return this.parseTextResponse(content, companyName);
      }

    } catch (parseError) {
      console.log(`   ⚠️ JSON parsing failed: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      console.log(`   📝 Falling back to text parsing...`);
      return this.parseTextResponse(content, companyName);
    }

    return executives;
  }

  /**
   * 📝 SIMPLE TEXT PARSING (FALLBACK FOR NON-JSON RESPONSES)
   */
  private parseTextResponse(content: string, companyName: string): ExecutiveCandidate[] {
    const executives: ExecutiveCandidate[] = [];
    
    console.log(`   📝 [TEXT PARSER] Parsing: "${content}"`);
    
    // Handle simple responses like "David Hisey, Chief Financial Officer[1][3]."
    // Pattern: "Name, Title" or "Name - Title" or "Name: Title"
    const executivePatterns = [
      // "David Hisey, Chief Financial Officer"
      /([A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([^,\[\]\(\)\.]+)/g,
      // "David Hisey - Chief Financial Officer"  
      /([A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*[-–]\s*([^,\[\]\(\)\.]+)/g,
      // "David Hisey: Chief Financial Officer"
      /([A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*:\s*([^,\[\]\(\)\.]+)/g,
      // "Chief Financial Officer: David Hisey"
      /([^:,\[\]]+):\s*([A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g
    ];
    
    for (const pattern of executivePatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        let name = match[1]?.trim();
        let title = match[2]?.trim();
        
        // Handle reversed pattern (title: name)
        if (title && name && title.match(/^[A-Z][a-z]+ [A-Z][a-z]+/) && name.match(/(chief|officer|president|director|manager)/i)) {
          [name, title] = [title, name]; // Swap them
        }
        
        if (name && title && name.length > 3 && title.length > 3) {
          // Use role detector to classify the role
          const roleDetection = this.roleDetector.detectRole(title);
          
          if (roleDetection) {
            executives.push({
              name: name,
              title: title,
              role: roleDetection.role,
              confidence: roleDetection.confidence,
              tier: roleDetection.tier,
              source: 'ai_text_parsing',
              reasoning: `${roleDetection.reasoning} | Found via AI research for ${companyName}`
            });
            
            console.log(`   ✅ Parsed: ${name} (${title}) → ${roleDetection.role}`);
          }
        }
      }
    }
    
    // Also try simple line-by-line parsing for other formats
    const lines = content.split(/[\n,;]/);
    for (const line of lines) {
      const cleanLine = line.trim().replace(/\[\d+\]/g, '').replace(/[\.]+$/, '');
      
      // Look for "Name is Title" or "Name serves as Title"
      const roleMatch = cleanLine.match(/([A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:is|serves as|holds the position of)\s+([^,\.]+)/i);
      if (roleMatch) {
        const name = roleMatch[1].trim();
        const title = roleMatch[2].trim();
        
        const roleDetection = this.roleDetector.detectRole(title);
        if (roleDetection && !executives.some(e => e['name'] === name)) {
          executives.push({
            name,
            title,
            role: roleDetection.role,
            confidence: roleDetection.confidence,
            tier: roleDetection.tier,
            source: 'ai_text_parsing',
            reasoning: `${roleDetection.reasoning} | Found via AI research for ${companyName}`
          });
          
          console.log(`   ✅ Parsed (pattern 2): ${name} (${title}) → ${roleDetection.role}`);
        }
      }
    }
    
    console.log(`   📝 Text parsing found ${executives.length} executives`);
    return executives;
  }

  /**
   * 🏷️ ENHANCED ROLE CLASSIFICATION
   */
  private classifyRoleFromTitle(title: string): string {
    if (!title) return '';
    
    const titleLower = title.toLowerCase();
    
    // CFO patterns (strict)
    if (titleLower.includes('chief financial officer') || 
        titleLower.includes('cfo') ||
        (titleLower.includes('finance') && titleLower.includes('chief'))) {
      return 'CFO';
    }
    
    // CRO patterns (strict)
    if (titleLower.includes('chief revenue officer') || 
        titleLower.includes('cro') ||
        titleLower.includes('chief sales officer') || 
        titleLower.includes('cso')) {
      return 'CRO';
    }
    
    // CEO patterns
    if (titleLower.includes('chief executive officer') || 
        titleLower.includes('ceo') ||
        (titleLower.includes('president') && !titleLower.includes('vice')) ||
        titleLower.includes('founder')) {
      return 'CEO';
    }
    
    // VP Finance (potential CFO)
    if (titleLower.includes('vice president') && 
        (titleLower.includes('finance') || titleLower.includes('financial'))) {
      return 'VP_Finance';
    }
    
    // VP Sales (potential CRO)
    if (titleLower.includes('vice president') && 
        (titleLower.includes('sales') || titleLower.includes('revenue'))) {
      return 'VP_Sales';
    }
    
    return '';
  }

  /**
   * 🎯 CLASSIFY EXECUTIVE ROLES WITH CONFLICT RESOLUTION
   */
  private classifyExecutiveRoles(
    executives: ExecutiveCandidate[],
    targetRoles: string[]
  ): { cfo?: ExecutiveCandidate; cro?: ExecutiveCandidate; ceo?: ExecutiveCandidate } {
    const result: { cfo?: ExecutiveCandidate; cro?: ExecutiveCandidate; ceo?: ExecutiveCandidate } = {};
    
    // Find best candidate for each role
    for (const role of targetRoles) {
      const candidates = executives.filter(exec => exec['role'] === role);
      
      if (candidates.length > 0) {
        // Sort by confidence and pick the best
        const bestCandidate = candidates.sort((a, b) => b.confidence - a.confidence)[0];
        
        switch (role) {
          case 'CFO':
            result['cfo'] = bestCandidate;
            break;
          case 'CRO':
            result['cro'] = bestCandidate;
            break;
          case 'CEO':
            result['ceo'] = bestCandidate;
            break;
        }
      }
    }
    
    // CRITICAL: Prevent same person CFO/CRO assignment
    if (result['cfo'] && result['cro'] && result['cfo']['name'] === result.cro.name) {
      console.log(`🚨 [ROLE CLASSIFICATION] Same person detected for CFO/CRO: ${result.cfo.name}`);
      
      // Priority logic based on title
      const titleLower = result.cfo.title.toLowerCase();
      if (titleLower.includes('financial') || titleLower.includes('cfo')) {
        console.log(`   🔧 Keeping CFO (finance title), removing CRO assignment`);
        result['cro'] = undefined;
      } else if (titleLower.includes('revenue') || titleLower.includes('sales') || titleLower.includes('cro')) {
        console.log(`   🔧 Keeping CRO (revenue title), removing CFO assignment`);
        result['cfo'] = undefined;
      } else {
        console.log(`   🔧 Ambiguous title - keeping CFO, removing CRO (CFO priority)`);
        result['cro'] = undefined;
      }
    }
    
    // Fallback: Look for VP-level roles if C-level not found
    if (targetRoles.includes('CFO') && !result.cfo) {
      const vpFinance = executives.find(exec => exec['role'] === 'VP_Finance');
      if (vpFinance) {
        result['cfo'] = { 
          ...vpFinance, 
          role: 'CFO', 
          confidence: vpFinance.confidence - 10,
          reasoning: vpFinance.reasoning + ' | Promoted from VP Finance to CFO role'
        };
        console.log(`   🔄 VP Finance promoted to CFO: ${result.cfo.name}`);
      }
    }
    
    if (targetRoles.includes('CRO') && !result.cro) {
      const vpSales = executives.find(exec => exec['role'] === 'VP_Sales');
      if (vpSales) {
        result['cro'] = { 
          ...vpSales, 
          role: 'CRO', 
          confidence: vpSales.confidence - 10,
          reasoning: vpSales.reasoning + ' | Promoted from VP Sales to CRO role'
        };
        console.log(`   🔄 VP Sales promoted to CRO: ${result.cro.name}`);
      }
    }
    
    return result;
  }

  /**
   * 📊 CALCULATE OVERALL CONFIDENCE
   */
  private calculateOverallConfidence(result: ExecutiveSearchResult): number {
    const executives = [result.cfo, result.cro, result.ceo].filter(Boolean) as ExecutiveCandidate[];
    
    if (executives['length'] === 0) return 0;
    
    const totalConfidence = executives.reduce((sum, exec) => sum + exec.confidence, 0);
    const averageConfidence = totalConfidence / executives.length;
    
    // Boost confidence based on research quality
    let confidence = averageConfidence;
    if (executives.length > 1) confidence += 5; // Multiple executives found
    if (result.researchMethods.includes('ai_research')) confidence += 5; // AI research successful
    
    return Math.min(confidence, 95); // Cap at 95%
  }

  /**
   * 🎯 GENERATE DYNAMIC REQUIREMENTS BASED ON PRODUCT
   */
  private generateDynamicRequirements(targetRoles: string[], productCategory: string, dealSize: number): string {
    let requirements = '';
    
    // Legal Technology (Notary Everyday)
    if (productCategory.toLowerCase().includes('legal')) {
      requirements = `
For LEGAL TECHNOLOGY (${productCategory}):
- COO/Operations leaders are PRIMARY decision makers (process improvement)
- General Counsel/Legal leaders are CRITICAL for compliance
- CFO involved for budget approval ($${dealSize.toLocaleString()} deals)
- Compliance Officers are key stakeholders
- Look for: COO, General Counsel, VP Operations, Compliance Manager`;
    }
    // Security Software
    else if (productCategory.toLowerCase().includes('security')) {
      requirements = `
For SECURITY SOFTWARE (${productCategory}):
- CISO/Security leaders are PRIMARY decision makers
- IT Directors are key champions for implementation  
- CFO involved for budget approval ($${dealSize.toLocaleString()} deals)
- Compliance Officers are stakeholders
- Look for: CISO, IT Director, Security Manager, Compliance Officer`;
    }
    // HR Technology
    else if (productCategory.toLowerCase().includes('hr') || productCategory.toLowerCase().includes('people')) {
      requirements = `
For HR TECHNOLOGY (${productCategory}):
- CHRO/HR leaders are PRIMARY decision makers
- COO involved for operational impact
- CFO involved for budget approval ($${dealSize.toLocaleString()} deals)
- IT Director for technical integration
- Look for: CHRO, VP People, HR Director, Operations Leader`;
    }
    // Sales Technology
    else if (productCategory.toLowerCase().includes('sales') || productCategory.toLowerCase().includes('revenue')) {
      requirements = `
For SALES TECHNOLOGY (${productCategory}):
- CRO/Sales leaders are PRIMARY decision makers
- Sales Operations are key champions
- CFO involved for budget approval ($${dealSize.toLocaleString()} deals)
- IT Director for technical integration
- Look for: CRO, VP Sales, Sales Operations, Revenue Operations`;
    }
    // Default Business Software
    else {
      requirements = `
For BUSINESS SOFTWARE (${productCategory}):
- CFO/CTO are typical decision makers
- Operations leaders are champions
- Deal size ($${dealSize.toLocaleString()}) determines authority level
- Look for appropriate business leaders based on function`;
    }
    
    return requirements;
  }

  /**
   * 🔄 CONVERT TO EXECUTIVE CONTACT
   */
  convertToExecutiveContact(
    candidate: ExecutiveCandidate,
    accountId: string,
    workspaceId: string
  ): ExecutiveContact {
    return {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      accountId,
      name: candidate.name,
      title: candidate.title,
      role: candidate.role as any,
      email: candidate.email,
      phone: candidate.phone,
      linkedinUrl: candidate.linkedinUrl,
      confidenceScore: candidate.confidence,
      researchMethods: [candidate.source],
      lastVerified: new Date(),
      isCurrent: true,
      selectionReasoning: candidate.reasoning
    };
  }
}
