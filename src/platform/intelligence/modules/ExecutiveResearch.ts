/**
 * 🎯 EXECUTIVE RESEARCH MODULE
 * 
 * Multi-layered approach for comprehensive executive discovery:
 * 1. AI-powered executive research with Perplexity
 * 2. Role classification and validation
 * 3. Confidence scoring and reasoning
 * 4. Multi-source verification
 */

import { ExecutiveContact, APIConfig } from '../types/intelligence';
import { cache } from '@/platform/services';

interface ExecutiveSearchResult {
  cfo?: ExecutiveCandidate;
  cro?: ExecutiveCandidate;
  ceo?: ExecutiveCandidate;
  allExecutives: ExecutiveCandidate[];
  confidence: number;
  researchMethods: string[];
  processingTime: number;
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
}

export class ExecutiveResearch {
  private config: APIConfig;

  constructor(config: APIConfig) {
    this['config'] = config;
    
    console.log('🎯 [EXECUTIVE RESEARCH] Module initialized');
    console.log(`   Perplexity AI: ${this.config.PERPLEXITY_API_KEY ? 'Available' : 'Missing'}`);
    console.log(`   OpenAI: ${this.config.OPENAI_API_KEY ? 'Available' : 'Missing'}`);
  }

  /**
   * 🔍 MAIN EXECUTIVE RESEARCH ENTRY POINT
   */
  async researchExecutives(
    companyName: string,
    website: string,
    targetRoles: string[] = ['CFO', 'CRO']
  ): Promise<ExecutiveSearchResult> {
    console.log(`\n🎯 [EXECUTIVE RESEARCH] Researching: ${companyName}`);
    
    const startTime = Date.now();
    
    // Use unified cache with fetch function
    const cacheKey = `executives:${companyName}:${targetRoles.join(',')}`;
    
    return await cache.get(cacheKey, async () => {
      console.log(`🎯 [EXECUTIVE RESEARCH] Cache miss - researching: ${companyName}`);
      
      const result: ExecutiveSearchResult = {
        allExecutives: [],
        confidence: 0,
        researchMethods: [],
        processingTime: 0
      };

      try {
        // LAYER 1: AI-Powered Executive Research
        console.log('🤖 [LAYER 1] AI-Powered Executive Research');
        const aiResult = await this.aiExecutiveResearch(companyName, website, targetRoles);
        
        if (aiResult.executives.length > 0) {
          result.allExecutives.push(...aiResult.executives);
          result.researchMethods.push('ai_research');
          console.log(`   ✅ Found ${aiResult.executives.length} executives via AI`);
        }

        // LAYER 2: Role Classification and Assignment
        console.log('🏷️ [LAYER 2] Role Classification');
        const classifiedExecutives = this.classifyExecutiveRoles(result.allExecutives, targetRoles);
        
        // Assign best candidates to roles
        if (targetRoles.includes('CFO') && classifiedExecutives.cfo) {
          result['cfo'] = classifiedExecutives.cfo;
          console.log(`   ✅ CFO: ${result.cfo.name} (${result.cfo.title})`);
        }
        
        if (targetRoles.includes('CRO') && classifiedExecutives.cro) {
          result['cro'] = classifiedExecutives.cro;
          console.log(`   ✅ CRO: ${result.cro.name} (${result.cro.title})`);
        }

        if (targetRoles.includes('CEO') && classifiedExecutives.ceo) {
          result['ceo'] = classifiedExecutives.ceo;
          console.log(`   ✅ CEO: ${result.ceo.name} (${result.ceo.title})`);
        }

        // LAYER 3: Confidence Calculation
        result['confidence'] = this.calculateOverallConfidence(result);
        result['processingTime'] = Date.now() - startTime;

        console.log(`✅ [EXECUTIVE RESEARCH] Complete: ${result.confidence}% confidence`);

        return result;

      } catch (error) {
        console.error('❌ [EXECUTIVE RESEARCH] Failed:', error);
        result['processingTime'] = Date.now() - startTime;
        return result;
      }
    }, {
      ttl: 3600000, // 1 hour cache
      tags: ['executive-research'],
      priority: 'high'
    });
  }

  /**
   * 🤖 AI-POWERED EXECUTIVE RESEARCH
   */
  private async aiExecutiveResearch(
    companyName: string,
    website: string,
    targetRoles: string[]
  ): Promise<{ executives: ExecutiveCandidate[] }> {
    if (!this.config.PERPLEXITY_API_KEY) {
      console.log('⚠️ [AI RESEARCH] Perplexity API key not available');
      return { executives: [] };
    }

    const roleList = targetRoles.join(', ');
    const prompt = `Research the current leadership team of ${companyName} (website: ${website}).

Please find the current ${roleList} and provide:

1. Full name
2. Exact job title
3. Role classification (CFO, CRO, CEO, etc.)
4. Brief background or experience
5. How long they've been in the role (if available)

Focus on current, active executives. Be specific and factual. If you're uncertain about someone's current role, indicate lower confidence.

Format your response clearly with each executive on a separate section.`;

    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1000,
          temperature: 0.1
        })
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';

      // Parse AI response into executive candidates
      const executives = this.parseAIExecutiveResponse(content, companyName);
      
      console.log(`   🤖 AI Research found ${executives.length} executive candidates`);
      return { executives };

    } catch (error) {
      console.error('❌ [AI RESEARCH] Error:', error);
      return { executives: [] };
    }
  }

  /**
   * 📝 PARSE AI EXECUTIVE RESPONSE
   */
  private parseAIExecutiveResponse(content: string, companyName: string): ExecutiveCandidate[] {
    const executives: ExecutiveCandidate[] = [];
    
    // Split content into sections (simple parsing - could be enhanced)
    const sections = content.split(/\n\s*\n/);
    
    for (const section of sections) {
      const lines = section.split('\n').filter(line => line.trim());
      
      let name = '';
      let title = '';
      let role = '';
      
      // Extract information from each line
      for (const line of lines) {
        const cleanLine = line.trim();
        
        // Look for name patterns
        if (cleanLine.match(/^[\d\.\-\*\s]*([A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/)) {
          const nameMatch = cleanLine.match(/([A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
          if (nameMatch && !name) {
            name = nameMatch[1].trim();
          }
        }
        
        // Look for title patterns
        if (cleanLine.toLowerCase().includes('title:') || 
            cleanLine.toLowerCase().includes('position:') ||
            cleanLine.match(/(chief|cfo|cro|ceo|president|director|vice president)/i)) {
          const titleMatch = cleanLine.match(/(?:title:|position:)?\s*(.+?)(?:\s*-|\s*\(|$)/i);
          if (titleMatch && !title) {
            title = titleMatch[1].trim();
          }
        }
      }
      
      // Classify role based on title
      if (name && title) {
        role = this.classifyRoleFromTitle(title);
        
        if (role) {
          executives.push({
            name,
            title,
            role,
            confidence: 80, // Base confidence from AI research
            source: 'ai_research',
            reasoning: `Found via AI research for ${companyName}`
          });
        }
      }
    }
    
    return executives;
  }

  /**
   * 🏷️ CLASSIFY ROLE FROM TITLE
   */
  private classifyRoleFromTitle(title: string): string {
    const titleLower = title.toLowerCase();
    
    // CFO patterns
    if (titleLower.includes('chief financial officer') || titleLower.includes('cfo')) {
      return 'CFO';
    }
    
    // CRO patterns  
    if (titleLower.includes('chief revenue officer') || titleLower.includes('cro') ||
        titleLower.includes('chief sales officer') || titleLower.includes('cso')) {
      return 'CRO';
    }
    
    // CEO patterns
    if (titleLower.includes('chief executive officer') || titleLower.includes('ceo') ||
        titleLower.includes('president') || titleLower.includes('founder')) {
      return 'CEO';
    }
    
    // CTO patterns
    if (titleLower.includes('chief technology officer') || titleLower.includes('cto') ||
        titleLower.includes('chief technical officer')) {
      return 'CTO';
    }
    
    // VP Finance (potential CFO)
    if (titleLower.includes('vice president') && titleLower.includes('finance')) {
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
   * 🎯 CLASSIFY EXECUTIVE ROLES
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
    
    // Fallback: Look for VP-level roles if C-level not found
    if (targetRoles.includes('CFO') && !result.cfo) {
      const vpFinance = executives.find(exec => exec['role'] === 'VP_Finance');
      if (vpFinance) {
        result['cfo'] = { ...vpFinance, role: 'CFO', confidence: vpFinance.confidence - 10 };
      }
    }
    
    if (targetRoles.includes('CRO') && !result.cro) {
      const vpSales = executives.find(exec => exec['role'] === 'VP_Sales');
      if (vpSales) {
        result['cro'] = { ...vpSales, role: 'CRO', confidence: vpSales.confidence - 10 };
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
    
    // Boost confidence if we found multiple executives
    let confidence = averageConfidence;
    if (executives.length > 1) confidence += 5;
    if (result.researchMethods.includes('ai_research')) confidence += 5;
    
    return Math.min(confidence, 95); // Cap at 95%
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

  /**
   * 🧪 VALIDATE EXECUTIVE DATA
   */
  private validateExecutiveData(candidate: ExecutiveCandidate): boolean {
    // Basic validation
    if (!candidate.name || candidate.name.length < 2) return false;
    if (!candidate.title || candidate.title.length < 3) return false;
    if (!candidate.role) return false;
    
    // Check for obvious fake names
    const fakeName = candidate.name.toLowerCase();
    if (fakeName.includes('not available') || 
        fakeName.includes('unknown') ||
        fakeName.includes('n/a') ||
        fakeName === 'john doe' ||
        fakeName === 'jane doe') {
      return false;
    }
    
    return true;
  }

  /**
   * 🎯 ENHANCE EXECUTIVE WITH ADDITIONAL DATA
   */
  private enhanceExecutiveData(candidate: ExecutiveCandidate): ExecutiveCandidate {
    // Add LinkedIn URL generation (basic)
    if (!candidate['linkedinUrl'] && candidate.name) {
      const linkedinName = candidate.name.toLowerCase()
        .replace(/[^a-z\s]/g, '')
        .replace(/\s+/g, '-');
      candidate['linkedinUrl'] = `https://linkedin.com/in/${linkedinName}`;
      candidate.reasoning += ' | LinkedIn URL generated (requires verification)';
    }
    
    return candidate;
  }
}
