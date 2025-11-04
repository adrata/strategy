/**
 * Workbench Document Analysis Service
 * 
 * Integrates with Claude AI for document analysis, summarization,
 * entity extraction, and smart classification.
 */

import { ClaudeAIService } from '@/platform/services/ClaudeAIService';

export interface DocumentAnalysis {
  summary: string;
  keyPoints: string[];
  entities: {
    people: string[];
    organizations: string[];
    locations: string[];
    dates: string[];
    technologies: string[];
    concepts: string[];
  };
  sentiment: {
    score: number; // -1 to 1
    label: 'positive' | 'negative' | 'neutral';
    confidence: number;
  };
  readingTime: number; // in minutes
  complexity: {
    score: number; // 1 to 10
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    factors: string[];
  };
  topics: string[];
  language: string;
  wordCount: number;
  characterCount: number;
}

export interface ClassificationSuggestion {
  classification: 'public' | 'internal' | 'confidential' | 'restricted';
  confidence: number;
  reasoning: string;
  sensitiveData: {
    pii: boolean;
    financial: boolean;
    passwords: boolean;
    apiKeys: boolean;
    other: string[];
  };
  compliance: {
    gdpr: boolean;
    soc2: boolean;
    hipaa: boolean;
    pci: boolean;
  };
}

export interface TagSuggestion {
  tag: string;
  confidence: number;
  category: 'topic' | 'technology' | 'department' | 'project' | 'status';
}

export class DocumentAnalyzer {
  private static instance: DocumentAnalyzer;
  private claudeService: ClaudeAIService;

  private constructor() {
    this.claudeService = new ClaudeAIService();
  }

  public static getInstance(): DocumentAnalyzer {
    if (!DocumentAnalyzer.instance) {
      DocumentAnalyzer.instance = new DocumentAnalyzer();
    }
    return DocumentAnalyzer.instance;
  }

  /**
   * Analyze document content and extract insights
   */
  public async analyzeDocument(
    content: any,
    documentType: string,
    title?: string
  ): Promise<DocumentAnalysis> {
    try {
      const textContent = this.extractTextContent(content, documentType);
      
      if (!textContent || textContent.trim().length === 0) {
        throw new Error('No text content found in document');
      }

      const analysisPrompt = this.buildAnalysisPrompt(textContent, documentType, title);
      const response = await this.claudeService.generateResponse(analysisPrompt);

      return this.parseAnalysisResponse(response, textContent);
    } catch (error) {
      console.error('Error analyzing document:', error);
      throw new Error('Failed to analyze document');
    }
  }

  /**
   * Suggest document classification
   */
  public async suggestClassification(
    content: any,
    documentType: string,
    title?: string
  ): Promise<ClassificationSuggestion> {
    try {
      const textContent = this.extractTextContent(content, documentType);
      
      if (!textContent || textContent.trim().length === 0) {
        return {
          classification: 'internal',
          confidence: 0.5,
          reasoning: 'No content to analyze',
          sensitiveData: {
            pii: false,
            financial: false,
            passwords: false,
            apiKeys: false,
            other: [],
          },
          compliance: {
            gdpr: false,
            soc2: false,
            hipaa: false,
            pci: false,
          },
        };
      }

      const classificationPrompt = this.buildClassificationPrompt(textContent, documentType, title);
      const response = await this.claudeService.generateResponse(classificationPrompt);

      return this.parseClassificationResponse(response);
    } catch (error) {
      console.error('Error suggesting classification:', error);
      return {
        classification: 'internal',
        confidence: 0.5,
        reasoning: 'Error analyzing content',
        sensitiveData: {
          pii: false,
          financial: false,
          passwords: false,
          apiKeys: false,
          other: [],
        },
        compliance: {
          gdpr: false,
          soc2: false,
          hipaa: false,
          pci: false,
        },
      };
    }
  }

  /**
   * Suggest tags for the document
   */
  public async suggestTags(
    content: any,
    documentType: string,
    title?: string
  ): Promise<TagSuggestion[]> {
    try {
      const textContent = this.extractTextContent(content, documentType);
      
      if (!textContent || textContent.trim().length === 0) {
        return [];
      }

      const tagPrompt = this.buildTagPrompt(textContent, documentType, title);
      const response = await this.claudeService.generateResponse(tagPrompt);

      return this.parseTagResponse(response);
    } catch (error) {
      console.error('Error suggesting tags:', error);
      return [];
    }
  }

  /**
   * Generate document summary
   */
  public async generateSummary(
    content: any,
    documentType: string,
    maxLength: number = 200
  ): Promise<string> {
    try {
      const textContent = this.extractTextContent(content, documentType);
      
      if (!textContent || textContent.trim().length === 0) {
        return 'No content to summarize';
      }

      const summaryPrompt = this.buildSummaryPrompt(textContent, maxLength);
      const response = await this.claudeService.generateResponse(summaryPrompt);

      return response.trim();
    } catch (error) {
      console.error('Error generating summary:', error);
      return 'Failed to generate summary';
    }
  }

  /**
   * Extract text content from different document types
   */
  private extractTextContent(content: any, documentType: string): string {
    if (typeof content === 'string') {
      return content;
    }

    if (typeof content === 'object' && content !== null) {
      switch (documentType) {
        case 'paper':
          // Lexical editor content
          if (content.root && content.root.children) {
            return this.extractTextFromLexical(content.root);
          }
          break;
        
        case 'code':
          // Code editor content
          if (content.content) {
            return content.content;
          }
          break;
        
        case 'matrix':
          // Matrix editor content
          if (content.charts && Array.isArray(content.charts)) {
            return content.charts.map((chart: any) => 
              `${chart.title}: ${chart.type} chart with ${chart.data?.length || 0} data points`
            ).join('\n');
          }
          break;
        
        case 'pitch':
          // Presentation content
          if (content.slides && Array.isArray(content.slides)) {
            return content.slides.map((slide: any, index: number) => 
              `Slide ${index + 1}: ${slide.title || 'Untitled'}\n${slide.content || ''}`
            ).join('\n\n');
          }
          break;
        
        case 'grid':
          // Spreadsheet content
          if (content.data && Array.isArray(content.data)) {
            return content.data.map((row: any, index: number) => 
              `Row ${index + 1}: ${Object.values(row).join(', ')}`
            ).join('\n');
          }
          break;
      }
    }

    return JSON.stringify(content, null, 2);
  }

  /**
   * Extract text from Lexical editor content
   */
  private extractTextFromLexical(node: any): string {
    if (!node) return '';

    if (node.type === 'text') {
      return node.text || '';
    }

    if (node.children && Array.isArray(node.children)) {
      return node.children.map((child: any) => this.extractTextFromLexical(child)).join('');
    }

    return '';
  }

  /**
   * Build analysis prompt for Claude
   */
  private buildAnalysisPrompt(textContent: string, documentType: string, title?: string): string {
    return `Analyze the following ${documentType} document and provide a comprehensive analysis.

${title ? `Title: ${title}\n` : ''}

Content:
${textContent}

Please provide a JSON response with the following structure:
{
  "summary": "A concise 2-3 sentence summary of the document",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
  "entities": {
    "people": ["Person 1", "Person 2"],
    "organizations": ["Organization 1", "Organization 2"],
    "locations": ["Location 1", "Location 2"],
    "dates": ["Date 1", "Date 2"],
    "technologies": ["Technology 1", "Technology 2"],
    "concepts": ["Concept 1", "Concept 2"]
  },
  "sentiment": {
    "score": 0.5,
    "label": "positive|negative|neutral",
    "confidence": 0.8
  },
  "readingTime": 5,
  "complexity": {
    "score": 7,
    "level": "beginner|intermediate|advanced|expert",
    "factors": ["Factor 1", "Factor 2"]
  },
  "topics": ["Topic 1", "Topic 2", "Topic 3"],
  "language": "en",
  "wordCount": 500,
  "characterCount": 2500
}

Focus on accuracy and relevance. For sentiment, use -1 (very negative) to 1 (very positive). For complexity, use 1 (very simple) to 10 (very complex).`;
  }

  /**
   * Build classification prompt for Claude
   */
  private buildClassificationPrompt(textContent: string, documentType: string, title?: string): string {
    return `Analyze the following ${documentType} document and suggest an appropriate security classification.

${title ? `Title: ${title}\n` : ''}

Content:
${textContent}

Classify as one of: public, internal, confidential, restricted

Consider:
- Public: No sensitive information, safe for public sharing
- Internal: Company information, not for external sharing
- Confidential: Sensitive business information, limited access
- Restricted: Highly sensitive, requires special authorization

Also identify any sensitive data types present.

Please provide a JSON response:
{
  "classification": "internal",
  "confidence": 0.8,
  "reasoning": "Explanation for the classification",
  "sensitiveData": {
    "pii": false,
    "financial": false,
    "passwords": false,
    "apiKeys": false,
    "other": ["Other sensitive data types"]
  },
  "compliance": {
    "gdpr": false,
    "soc2": false,
    "hipaa": false,
    "pci": false
  }
}`;
  }

  /**
   * Build tag suggestion prompt for Claude
   */
  private buildTagPrompt(textContent: string, documentType: string, title?: string): string {
    return `Analyze the following ${documentType} document and suggest relevant tags.

${title ? `Title: ${title}\n` : ''}

Content:
${textContent}

Suggest 5-10 relevant tags with categories and confidence scores.

Please provide a JSON response:
[
  {
    "tag": "Tag Name",
    "confidence": 0.8,
    "category": "topic|technology|department|project|status"
  }
]

Categories:
- topic: Subject matter tags
- technology: Technical terms and tools
- department: Business departments
- project: Project-related tags
- status: Document status tags`;
  }

  /**
   * Build summary prompt for Claude
   */
  private buildSummaryPrompt(textContent: string, maxLength: number): string {
    return `Summarize the following document in ${maxLength} characters or less:

${textContent}

Provide a concise, informative summary that captures the main points and key information.`;
  }

  /**
   * Parse analysis response from Claude
   */
  private parseAnalysisResponse(response: string, textContent: string): DocumentAnalysis {
    try {
      const parsed = JSON.parse(response);
      
      // Calculate basic metrics
      const wordCount = textContent.split(/\s+/).length;
      const characterCount = textContent.length;
      const readingTime = Math.ceil(wordCount / 200); // 200 words per minute

      return {
        summary: parsed.summary || 'No summary available',
        keyPoints: parsed.keyPoints || [],
        entities: parsed.entities || {
          people: [],
          organizations: [],
          locations: [],
          dates: [],
          technologies: [],
          concepts: [],
        },
        sentiment: parsed.sentiment || {
          score: 0,
          label: 'neutral',
          confidence: 0.5,
        },
        readingTime: parsed.readingTime || readingTime,
        complexity: parsed.complexity || {
          score: 5,
          level: 'intermediate',
          factors: [],
        },
        topics: parsed.topics || [],
        language: parsed.language || 'en',
        wordCount: parsed.wordCount || wordCount,
        characterCount: parsed.characterCount || characterCount,
      };
    } catch (error) {
      console.error('Error parsing analysis response:', error);
      
      // Return basic analysis
      const wordCount = textContent.split(/\s+/).length;
      const characterCount = textContent.length;
      const readingTime = Math.ceil(wordCount / 200);

      return {
        summary: 'Analysis failed - please try again',
        keyPoints: [],
        entities: {
          people: [],
          organizations: [],
          locations: [],
          dates: [],
          technologies: [],
          concepts: [],
        },
        sentiment: {
          score: 0,
          label: 'neutral',
          confidence: 0.5,
        },
        readingTime,
        complexity: {
          score: 5,
          level: 'intermediate',
          factors: [],
        },
        topics: [],
        language: 'en',
        wordCount,
        characterCount,
      };
    }
  }

  /**
   * Parse classification response from Claude
   */
  private parseClassificationResponse(response: string): ClassificationSuggestion {
    try {
      const parsed = JSON.parse(response);
      return {
        classification: parsed.classification || 'internal',
        confidence: parsed.confidence || 0.5,
        reasoning: parsed.reasoning || 'No reasoning provided',
        sensitiveData: parsed.sensitiveData || {
          pii: false,
          financial: false,
          passwords: false,
          apiKeys: false,
          other: [],
        },
        compliance: parsed.compliance || {
          gdpr: false,
          soc2: false,
          hipaa: false,
          pci: false,
        },
      };
    } catch (error) {
      console.error('Error parsing classification response:', error);
      return {
        classification: 'internal',
        confidence: 0.5,
        reasoning: 'Error parsing classification',
        sensitiveData: {
          pii: false,
          financial: false,
          passwords: false,
          apiKeys: false,
          other: [],
        },
        compliance: {
          gdpr: false,
          soc2: false,
          hipaa: false,
          pci: false,
        },
      };
    }
  }

  /**
   * Parse tag response from Claude
   */
  private parseTagResponse(response: string): TagSuggestion[] {
    try {
      const parsed = JSON.parse(response);
      if (Array.isArray(parsed)) {
        return parsed.map(tag => ({
          tag: tag.tag || '',
          confidence: tag.confidence || 0.5,
          category: tag.category || 'topic',
        }));
      }
      return [];
    } catch (error) {
      console.error('Error parsing tag response:', error);
      return [];
    }
  }
}

// Export singleton instance
export const documentAnalyzer = DocumentAnalyzer.getInstance();
