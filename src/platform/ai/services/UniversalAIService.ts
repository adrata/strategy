/**
 * 🌐 UNIVERSAL AI SERVICE
 * 
 * Master service that enables AI to speak to any data piece in the system
 * Handles dynamic model access, relationships, and complex queries
 */

import { PrismaClient } from '@prisma/client';
import { AIDataService, DataQuery, DataResult } from './AIDataService';
import { AIActionsService, ActionRequest } from './AIActionsService';

const prisma = new PrismaClient();

export interface UniversalQuery {
  intent: string;
  entities: string[];
  relationships?: string[];
  filters?: Record<string, any>;
  operations?: string[];
  context?: any;
}

export interface ModelSchema {
  name: string;
  fields: Record<string, any>;
  relationships: Record<string, any>;
  operations: string[];
}

export class UniversalAIService {
  
  // Cache for model schemas
  private static schemaCache: Map<string, ModelSchema> = new Map();
  
  /**
   * Process any natural language query about data
   */
  static async processQuery(
    query: string, 
    workspaceId: string, 
    userId: string, 
    context?: any
  ): Promise<DataResult> {
    try {
      // Parse natural language query
      const parsedQuery = this.parseNaturalLanguageQuery(query);
      
      // Determine the appropriate data operation
      const operation = await this.determineOperation(parsedQuery, context);
      
      // Execute the operation
      return await this.executeUniversalOperation(operation, workspaceId, userId);
      
    } catch (error) {
      console.error('Universal AI Service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get comprehensive information about any model
   */
  static async getModelInfo(modelName: string): Promise<ModelSchema | null> {
    try {
      // Check cache first
      if (this.schemaCache.has(modelName)) {
        return this.schemaCache.get(modelName)!;
      }

      // Get model schema from Prisma
      const schema = await this.extractModelSchema(modelName);
      
      if (schema) {
        this.schemaCache.set(modelName, schema);
      }
      
      return schema;
    } catch (error) {
      console.error(`Error getting model info for ${modelName}:`, error);
      return null;
    }
  }

  /**
   * Execute complex cross-model queries
   */
  static async executeComplexQuery(
    models: string[],
    relationships: string[],
    filters: Record<string, any>,
    workspaceId: string
  ): Promise<DataResult> {
    try {
      const results: Record<string, any> = {};
      
      // Execute queries for each model
      for (const model of models) {
        const query: DataQuery = {
          model,
          operation: 'read',
          where: { ...filters, workspaceId },
          include: this.buildIncludeFromRelationships(relationships, model)
        };
        
        const result = await AIDataService.executeQuery(query, workspaceId, 'system');
        
        if (result.success) {
          results[model] = result.data;
        }
      }
      
      // Analyze relationships and provide insights
      const insights = this.analyzeRelationships(results, relationships);
      
      return {
        success: true,
        data: {
          results,
          insights,
          relationships: this.mapRelationships(results)
        }
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Complex query failed'
      };
    }
  }

  /**
   * Get all available models and their capabilities
   */
  static getAvailableModels(): Record<string, any> {
    return {
      lead: {
        description: 'Sales leads and prospects',
        fields: ['fullName', 'email', 'company', 'jobTitle', 'status', 'priority'],
        relationships: ['opportunities', 'leadNotes', 'activities'],
        operations: ['create', 'read', 'update', 'delete'],
        searchable: ['fullName', 'email', 'company', 'jobTitle']
      },
      opportunity: {
        description: 'Sales opportunities and deals',
        fields: ['name', 'description', 'stage', 'value', 'closeDate'],
        relationships: ['lead', 'activities'],
        operations: ['create', 'read', 'update', 'delete'],
        searchable: ['name', 'description']
      },
      leadNote: {
        description: 'Notes and comments on leads',
        fields: ['content', 'type', 'leadId'],
        relationships: ['lead'],
        operations: ['create', 'read', 'update', 'delete'],
        searchable: ['content']
      },
      activity: {
        description: 'Activities and tasks',
        fields: ['type', 'title', 'description', 'dueDate'],
        relationships: ['lead', 'opportunity'],
        operations: ['create', 'read', 'update', 'delete'],
        searchable: ['title', 'description']
      },
      user: {
        description: 'System users',
        fields: ['name', 'email', 'role'],
        relationships: ['workspaces', 'leads'],
        operations: ['read'],
        searchable: ['name', 'email']
      },
      workspace: {
        description: 'Workspaces and organizations',
        fields: ['name', 'description'],
        relationships: ['users', 'leads', 'opportunities'],
        operations: ['read'],
        searchable: ['name']
      }
    };
  }

  /**
   * Parse natural language query into structured format
   */
  private static parseNaturalLanguageQuery(query: string): UniversalQuery {
    const lowerQuery = query.toLowerCase();
    
    // Extract entities (models)
    const entities = [];
    const models = this.getAvailableModels();
    
    for (const [modelName, modelInfo] of Object.entries(models)) {
      if (lowerQuery.includes(modelName) || 
          lowerQuery.includes(modelInfo.description.toLowerCase())) {
        entities.push(modelName);
      }
    }
    
    // Extract intent
    let intent = 'read'; // default
    if (lowerQuery.includes('create') || lowerQuery.includes('add') || lowerQuery.includes('new')) {
      intent = 'create';
    } else if (lowerQuery.includes('update') || lowerQuery.includes('change') || lowerQuery.includes('modify')) {
      intent = 'update';
    } else if (lowerQuery.includes('delete') || lowerQuery.includes('remove') || lowerQuery.includes('archive')) {
      intent = 'delete';
    } else if (lowerQuery.includes('analyze') || lowerQuery.includes('report') || lowerQuery.includes('insights')) {
      intent = 'analyze';
    }
    
    // Extract relationships
    const relationships = [];
    if (lowerQuery.includes('with') || lowerQuery.includes('including') || lowerQuery.includes('related')) {
      // This would be enhanced with proper NLP
      relationships.push('related_data');
    }
    
    return {
      intent,
      entities: entities.length > 0 ? entities : ['lead'], // default to leads
      relationships,
      filters: this.extractFilters(query)
    };
  }

  /**
   * Extract filters from natural language
   */
  private static extractFilters(query: string): Record<string, any> {
    const filters: Record<string, any> = {};
    const lowerQuery = query.toLowerCase();
    
    // Status filters
    if (lowerQuery.includes('qualified')) filters['status'] = 'qualified';
    if (lowerQuery.includes('new')) filters['status'] = 'new';
    if (lowerQuery.includes('contacted')) filters['status'] = 'contacted';
    
    // Priority filters
    if (lowerQuery.includes('high priority')) filters['priority'] = 'high';
    if (lowerQuery.includes('low priority')) filters['priority'] = 'low';
    
    // Company filters
    const companyMatch = query.match(/at\s+([A-Za-z\s]+)/i);
    if (companyMatch) {
      filters['company'] = { contains: companyMatch[1].trim(), mode: 'insensitive' };
    }
    
    // Date filters
    if (lowerQuery.includes('today')) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filters['createdAt'] = { gte: today };
    }
    
    if (lowerQuery.includes('this week')) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      filters['createdAt'] = { gte: weekStart };
    }
    
    return filters;
  }

  /**
   * Determine the appropriate operation based on parsed query
   */
  private static async determineOperation(
    parsedQuery: UniversalQuery, 
    context?: any
  ): Promise<DataQuery | ActionRequest> {
    const { intent, entities, filters } = parsedQuery;
    
    if (intent === 'create') {
      return {
        type: `create_${entities[0]}`,
        parameters: filters,
        workspaceId: '',
        userId: ''
      } as ActionRequest;
    }
    
    if (intent === 'update' && context?.id) {
      return {
        type: `update_${entities[0]}`,
        parameters: { id: context.id, ...filters },
        workspaceId: '',
        userId: ''
      } as ActionRequest;
    }
    
    // Default to read operation
    return {
      model: entities[0],
      operation: 'read',
      where: filters,
      include: this.buildIncludeFromEntities(entities)
    } as DataQuery;
  }

  /**
   * Execute universal operation
   */
  private static async executeUniversalOperation(
    operation: DataQuery | ActionRequest,
    workspaceId: string,
    userId: string
  ): Promise<DataResult> {
    if ('type' in operation) {
      // This is an action request
      const actionResult = await AIActionsService.executeAction({
        ...operation,
        workspaceId,
        userId
      });
      
      return {
        success: actionResult.success,
        data: actionResult.data,
        error: actionResult.error,
        metadata: { type: 'action', action: operation.type }
      };
    } else {
      // This is a data query
      return await AIDataService.executeQuery(operation, workspaceId, userId);
    }
  }

  /**
   * Extract model schema information
   */
  private static async extractModelSchema(modelName: string): Promise<ModelSchema | null> {
    const models = this.getAvailableModels();
    const modelInfo = models[modelName];
    
    if (!modelInfo) {
      return null;
    }
    
    return {
      name: modelName,
      fields: modelInfo.fields.reduce((acc: Record<string, any>, field: string) => {
        acc[field] = { type: 'string', required: false }; // Simplified
        return acc;
      }, {}),
      relationships: modelInfo.relationships.reduce((acc: Record<string, any>, rel: string) => {
        acc[rel] = { type: 'relation', model: rel };
        return acc;
      }, {}),
      operations: modelInfo.operations
    };
  }

  /**
   * Build include object from relationships
   */
  private static buildIncludeFromRelationships(
    relationships: string[], 
    model: string
  ): Record<string, any> {
    const include: Record<string, any> = {};
    const modelInfo = this.getAvailableModels()[model];
    
    if (modelInfo && relationships.length > 0) {
      for (const rel of modelInfo.relationships) {
        if (relationships.includes(rel) || relationships.includes('related_data')) {
          include[rel] = true;
        }
      }
    }
    
    return include;
  }

  /**
   * Build include object from entities
   */
  private static buildIncludeFromEntities(entities: string[]): Record<string, any> {
    const include: Record<string, any> = {};
    
    if (entities.includes('lead')) {
      include['opportunities'] = true;
      include['leadNotes'] = { take: 5, orderBy: { createdAt: 'desc' } };
    }
    
    if (entities.includes('opportunity')) {
      include['lead'] = true;
    }
    
    return include;
  }

  /**
   * Analyze relationships between data
   */
  private static analyzeRelationships(
    results: Record<string, any>, 
    relationships: string[]
  ): string[] {
    const insights = [];
    
    if (results['lead'] && results['opportunity']) {
      const leads = Array.isArray(results['lead']) ? results['lead'] : [results['lead']];
      const opportunities = Array.isArray(results['opportunity']) ? results['opportunity'] : [results['opportunity']];
      
      const leadsWithOpportunities = leads.filter((lead: any) => 
        opportunities.some((opp: any) => opp['leadId'] === lead.id)
      );
      
      if (leadsWithOpportunities.length > 0) {
        insights.push(`${leadsWithOpportunities.length} leads have associated opportunities`);
      }
    }
    
    return insights;
  }

  /**
   * Map relationships in results
   */
  private static mapRelationships(results: Record<string, any>): Record<string, any> {
    const relationships: Record<string, any> = {};
    
    // This would build a comprehensive relationship map
    // For now, return basic structure
    Object.keys(results).forEach(model => {
      relationships[model] = {
        count: Array.isArray(results[model]) ? results[model].length : 1,
        hasRelations: true
      };
    });
    
    return relationships;
  }

  /**
   * Get intelligent suggestions based on query
   */
  static getSuggestions(query: string, context?: any): string[] {
    const lowerQuery = query.toLowerCase();
    const suggestions = [];
    
    if (lowerQuery.includes('lead')) {
      suggestions.push('Show me qualified leads');
      suggestions.push('Create a new lead');
      suggestions.push('Update lead status');
      suggestions.push('Find leads by company');
    }
    
    if (lowerQuery.includes('opportunity')) {
      suggestions.push('Show active opportunities');
      suggestions.push('Create opportunity from lead');
      suggestions.push('Update opportunity stage');
      suggestions.push('Analyze opportunity pipeline');
    }
    
    if (context?.id) {
      suggestions.push(`Update this ${context.type || 'record'}`);
      suggestions.push(`Add note to this ${context.type || 'record'}`);
      suggestions.push(`Create opportunity for this lead`);
    }
    
    return suggestions.slice(0, 5); // Return top 5 suggestions
  }

  /**
   * Cleanup and disconnect
   */
  static async cleanup() {
    }
}
