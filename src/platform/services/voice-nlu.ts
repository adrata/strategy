"use client";

/**
 * Voice Natural Language Understanding (NLU) Engine
 * 
 * Provides fuzzy matching, synonym expansion, and entity extraction
 * for robust voice command recognition that handles natural speech variations.
 * 
 * Performance targets:
 * - Command match rate: >98%
 * - Processing latency: <10ms
 * - Entity extraction accuracy: >95%
 */

export interface MatchResult {
  pattern: string;
  confidence: number;
  normalizedInput: string;
  matchedSynonyms: string[];
}

export interface EntityMap {
  action?: string;
  target?: string;
  name?: string;
  time?: string;
  content?: string;
  [key: string]: string | undefined;
}

export interface NLUConfig {
  fuzzyThreshold: number;      // Minimum similarity for fuzzy match (0-1)
  enableStemming: boolean;     // Enable verb stemming
  enableSynonyms: boolean;     // Enable synonym expansion
  maxEditDistance: number;     // Maximum Levenshtein distance for fuzzy match
}

// Synonym mappings for common command words
const SYNONYMS: Record<string, string[]> = {
  // Navigation verbs
  'go': ['go', 'navigate', 'take', 'bring', 'head', 'move'],
  'open': ['open', 'show', 'display', 'view', 'see', 'pull up', 'bring up'],
  'close': ['close', 'hide', 'dismiss', 'exit', 'leave'],
  
  // Action verbs
  'create': ['create', 'add', 'new', 'make', 'start'],
  'delete': ['delete', 'remove', 'trash', 'erase'],
  'edit': ['edit', 'update', 'modify', 'change'],
  'save': ['save', 'submit', 'confirm', 'apply'],
  'cancel': ['cancel', 'stop', 'abort', 'nevermind', 'never mind'],
  
  // Communication verbs
  'call': ['call', 'dial', 'phone', 'ring'],
  'email': ['email', 'mail', 'message', 'send'],
  'schedule': ['schedule', 'book', 'set up', 'arrange', 'plan'],
  
  // Navigation targets
  'leads': ['leads', 'lead', 'prospects', 'prospect'],
  'people': ['people', 'person', 'contacts', 'contact', 'persons'],
  'companies': ['companies', 'company', 'accounts', 'account', 'organizations', 'organization'],
  'settings': ['settings', 'setting', 'preferences', 'config', 'configuration'],
  'dashboard': ['dashboard', 'home', 'main', 'overview'],
  
  // Tab names
  'notes': ['notes', 'note', 'comments', 'comment'],
  'timeline': ['timeline', 'history', 'activity', 'activities'],
  'intelligence': ['intelligence', 'insights', 'intel', 'analysis'],
  'reports': ['reports', 'report', 'analytics'],
};

// Filler words to remove from input
const FILLER_WORDS = new Set([
  'um', 'uh', 'er', 'ah', 'like', 'you know', 'i mean', 'basically',
  'actually', 'literally', 'just', 'really', 'very', 'so', 'well',
  'please', 'can you', 'could you', 'would you', 'will you',
  'the', 'a', 'an', 'to', 'for', 'of', 'in', 'on', 'at', 'by',
  'me', 'my', 'i', 'we', 'our'
]);

// Common verb stems for normalization
const VERB_STEMS: Record<string, string> = {
  'going': 'go',
  'goes': 'go',
  'went': 'go',
  'opening': 'open',
  'opens': 'open',
  'opened': 'open',
  'showing': 'show',
  'shows': 'show',
  'showed': 'show',
  'creating': 'create',
  'creates': 'create',
  'created': 'create',
  'adding': 'add',
  'adds': 'add',
  'added': 'add',
  'calling': 'call',
  'calls': 'call',
  'called': 'call',
  'emailing': 'email',
  'emails': 'email',
  'emailed': 'email',
  'scheduling': 'schedule',
  'schedules': 'schedule',
  'scheduled': 'schedule',
  'navigating': 'navigate',
  'navigates': 'navigate',
  'navigated': 'navigate',
};

// Entity extraction patterns
const ENTITY_PATTERNS = {
  name: /(?:(?:call|email|contact|find|search for|look up)\s+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
  time: /(?:in\s+)?(\d+)\s*(minute|hour|day|week|month)s?/i,
  content: /(?:note|add|write|say)\s*[:\-]?\s*["']?(.+?)["']?$/i,
  target: /(?:go to|open|show|navigate to)\s+(?:the\s+)?(\w+)/i,
};

export class VoiceNLU {
  private config: NLUConfig;
  private synonymCache: Map<string, string[]> = new Map();

  constructor(config: Partial<NLUConfig> = {}) {
    this.config = {
      fuzzyThreshold: 0.85,
      enableStemming: true,
      enableSynonyms: true,
      maxEditDistance: 2,
      ...config
    };
    
    // Pre-build synonym cache for fast lookup
    this.buildSynonymCache();
  }

  /**
   * Normalize input text for matching
   * - Lowercase
   * - Remove filler words
   * - Stem verbs
   * - Collapse whitespace
   */
  normalize(input: string): string {
    let normalized = input.toLowerCase().trim();
    
    // Remove punctuation except apostrophes
    normalized = normalized.replace(/[^\w\s']/g, ' ');
    
    // Split into words
    let words = normalized.split(/\s+/);
    
    // Remove filler words
    words = words.filter(word => !FILLER_WORDS.has(word));
    
    // Stem verbs if enabled
    if (this.config.enableStemming) {
      words = words.map(word => VERB_STEMS[word] || word);
    }
    
    // Collapse whitespace and rejoin
    return words.join(' ').trim();
  }

  /**
   * Fuzzy match input against a list of patterns
   * Returns the best match above threshold, or null
   */
  fuzzyMatch(input: string, patterns: string[]): MatchResult | null {
    const normalizedInput = this.normalize(input);
    let bestMatch: MatchResult | null = null;
    let bestConfidence = 0;

    for (const pattern of patterns) {
      const normalizedPattern = this.normalize(pattern);
      
      // Try exact match first (fastest)
      if (normalizedInput === normalizedPattern) {
        return {
          pattern,
          confidence: 1.0,
          normalizedInput,
          matchedSynonyms: []
        };
      }
      
      // Try synonym expansion
      if (this.config.enableSynonyms) {
        const synonymMatch = this.matchWithSynonyms(normalizedInput, normalizedPattern);
        if (synonymMatch && synonymMatch.confidence > bestConfidence) {
          bestConfidence = synonymMatch.confidence;
          bestMatch = { ...synonymMatch, pattern };
        }
      }
      
      // Try fuzzy match with Levenshtein distance
      const similarity = this.calculateSimilarity(normalizedInput, normalizedPattern);
      if (similarity > bestConfidence && similarity >= this.config.fuzzyThreshold) {
        bestConfidence = similarity;
        bestMatch = {
          pattern,
          confidence: similarity,
          normalizedInput,
          matchedSynonyms: []
        };
      }
    }

    return bestMatch;
  }

  /**
   * Expand a word to its synonyms
   */
  expandSynonyms(word: string): string[] {
    const normalized = word.toLowerCase();
    return this.synonymCache.get(normalized) || [normalized];
  }

  /**
   * Extract entities from input text
   * Returns a map of entity types to values
   */
  extractEntities(input: string): EntityMap {
    const entities: EntityMap = {};
    
    // Extract name (person/company being referenced)
    const nameMatch = input.match(ENTITY_PATTERNS.name);
    if (nameMatch) {
      entities.name = nameMatch[1].trim();
    }
    
    // Extract time duration
    const timeMatch = input.match(ENTITY_PATTERNS.time);
    if (timeMatch) {
      entities.time = `${timeMatch[1]} ${timeMatch[2]}`;
    }
    
    // Extract content (for notes, etc.)
    const contentMatch = input.match(ENTITY_PATTERNS.content);
    if (contentMatch) {
      entities.content = contentMatch[1].trim();
    }
    
    // Extract navigation target
    const targetMatch = input.match(ENTITY_PATTERNS.target);
    if (targetMatch) {
      entities.target = targetMatch[1].trim();
    }
    
    // Detect action from first verb
    const normalized = this.normalize(input);
    const firstWord = normalized.split(' ')[0];
    const actionSynonyms = ['go', 'open', 'show', 'create', 'add', 'call', 'email', 'schedule', 'close', 'save', 'cancel'];
    
    for (const action of actionSynonyms) {
      if (this.expandSynonyms(action).includes(firstWord)) {
        entities.action = action;
        break;
      }
    }

    return entities;
  }

  /**
   * Check if input matches a command intent
   * Faster than full fuzzy match for quick intent detection
   */
  detectIntent(input: string): string | null {
    const normalized = this.normalize(input);
    const words = normalized.split(' ');
    
    // Navigation intent
    if (words.some(w => this.expandSynonyms('go').includes(w) || this.expandSynonyms('open').includes(w))) {
      return 'navigation';
    }
    
    // Communication intent
    if (words.some(w => this.expandSynonyms('call').includes(w) || this.expandSynonyms('email').includes(w))) {
      return 'communication';
    }
    
    // Create intent
    if (words.some(w => this.expandSynonyms('create').includes(w))) {
      return 'create';
    }
    
    // Search intent
    if (words.includes('find') || words.includes('search') || words.includes('look')) {
      return 'search';
    }
    
    return null;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;
    
    // Early exit for identical strings
    if (str1 === str2) return 0;
    
    // Early exit if difference is too large
    if (Math.abs(m - n) > this.config.maxEditDistance) {
      return Math.max(m, n);
    }
    
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(
            dp[i - 1][j] + 1,     // deletion
            dp[i][j - 1] + 1,     // insertion
            dp[i - 1][j - 1] + 1  // substitution
          );
        }
      }
    }

    return dp[m][n];
  }

  /**
   * Calculate similarity score (0-1) between two strings
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const maxLen = Math.max(str1.length, str2.length);
    if (maxLen === 0) return 1;
    
    const distance = this.levenshteinDistance(str1, str2);
    return 1 - (distance / maxLen);
  }

  /**
   * Match input against pattern using synonym expansion
   */
  private matchWithSynonyms(input: string, pattern: string): MatchResult | null {
    const inputWords = input.split(' ');
    const patternWords = pattern.split(' ');
    
    let matchedCount = 0;
    const matchedSynonyms: string[] = [];
    
    for (const patternWord of patternWords) {
      const patternSynonyms = this.expandSynonyms(patternWord);
      
      for (const inputWord of inputWords) {
        const inputSynonyms = this.expandSynonyms(inputWord);
        
        // Check if any synonym matches
        const hasMatch = patternSynonyms.some(ps => 
          inputSynonyms.some(is => is === ps || this.calculateSimilarity(is, ps) > 0.9)
        );
        
        if (hasMatch) {
          matchedCount++;
          if (inputWord !== patternWord) {
            matchedSynonyms.push(`${inputWord} -> ${patternWord}`);
          }
          break;
        }
      }
    }
    
    const confidence = matchedCount / Math.max(patternWords.length, inputWords.length);
    
    if (confidence >= this.config.fuzzyThreshold) {
      return {
        pattern,
        confidence,
        normalizedInput: input,
        matchedSynonyms
      };
    }
    
    return null;
  }

  /**
   * Build synonym cache for fast lookup
   */
  private buildSynonymCache(): void {
    for (const [key, synonyms] of Object.entries(SYNONYMS)) {
      // Add all synonyms to cache, pointing to the same array
      for (const synonym of synonyms) {
        this.synonymCache.set(synonym, synonyms);
      }
      // Also add the key itself
      this.synonymCache.set(key, synonyms);
    }
  }

  /**
   * Get all registered synonyms for debugging
   */
  getSynonyms(): Record<string, string[]> {
    return { ...SYNONYMS };
  }

  /**
   * Add custom synonyms at runtime
   */
  addSynonyms(key: string, synonyms: string[]): void {
    const existing = SYNONYMS[key] || [key];
    const merged = [...new Set([...existing, ...synonyms])];
    SYNONYMS[key] = merged;
    
    // Update cache
    for (const synonym of merged) {
      this.synonymCache.set(synonym.toLowerCase(), merged);
    }
  }
}

// Export singleton instance with default config
export const voiceNLU = new VoiceNLU();

// Export for testing with custom config
export function createVoiceNLU(config?: Partial<NLUConfig>): VoiceNLU {
  return new VoiceNLU(config);
}

