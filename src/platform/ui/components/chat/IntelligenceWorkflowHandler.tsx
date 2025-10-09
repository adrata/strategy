/**
 * 🧠 INTELLIGENCE WORKFLOW HANDLER
 * 
 * Integrates sales intelligence and recruiting workflows with AI chat
 * Handles natural language requests through the AI right panel
 */

"use client";

import React from 'react';
import { useUnifiedAuth } from '@/platform/auth';
import { IntelligentSignalSystem } from '@/platform/services/intelligent-signal-system';
import { SalesIntelligenceWorkflows } from '@/platform/services/sales-intelligence-workflows';
import { RecruitingIntelligenceWorkflows } from '@/platform/services/recruiting-intelligence-workflows';

interface IntelligenceWorkflowHandlerProps {
  onWorkflowResult: (result: any) => void;
  onSignalCreated: (signal: any) => void;
}

export function IntelligenceWorkflowHandler({ 
  onWorkflowResult, 
  onSignalCreated 
}: IntelligenceWorkflowHandlerProps) {
  const { user } = useUnifiedAuth();
  
  const workspaceId = user?.activeWorkspaceId || user?.workspaces?.[0]?.id;
  const userId = user?.id;

  /**
   * Process natural language intelligence requests
   */
  const processIntelligenceRequest = async (input: string, context?: any): Promise<any> => {
    if (!userId || !workspaceId) {
      throw new Error('User authentication required');
    }

    console.log('🧠 Processing intelligence request:', input);

    try {
      // Initialize intelligent signal system
      const signalSystem = new IntelligentSignalSystem({
        userId,
        workspaceId,
        signalTypes: {
          executiveChanges: true,
          fundingRounds: true,
          hiringSignals: true,
          employeeGrowth: true,
          talentMovement: true,
          competitorActivity: true,
          technographicChanges: true
        },
        targetCompanies: [],
        targetRoles: [],
        priority: 'all',
        frequency: 'real_time',
        channels: ['in_app'],
        aiProcessing: {
          enableNaturalLanguage: true,
          confidenceThreshold: 70,
          autoProcessRequests: true
        }
      });

      // Process the natural language request
      const processed = await signalSystem.processNaturalLanguageRequest({
        input,
        context,
        userId,
        workspaceId
      });

      console.log('🎯 Processed request:', processed);

      // Execute based on intent
      switch (processed.intent) {
        case 'create_signal':
          return await handleCreateSignal(processed, signalSystem);
        
        case 'find_people':
          return await handleFindPeople(processed);
        
        case 'analyze_company':
          return await handleAnalyzeCompany(processed);
        
        case 'search_data':
          return await handleSearchData(processed);
        
        case 'generate_report':
          return await handleGenerateReport(processed);
        
        default:
          return {
            type: 'clarification',
            message: `I understand you want to ${processed.intent}, but I need more information.`,
            clarificationNeeded: processed.clarificationNeeded,
            suggestedAction: processed.suggestedAction
          };
      }

    } catch (error) {
      console.error('Failed to process intelligence request:', error);
      throw error;
    }
  };

  /**
   * Handle signal creation requests
   */
  const handleCreateSignal = async (processed: any, signalSystem: IntelligentSignalSystem) => {
    const signalConfig = {
      name: processed.suggestedAction,
      description: `Monitor ${processed.parameters.companies?.join(', ') || 'companies'} for ${processed.parameters.signalTypes?.join(', ') || 'changes'}`,
      config: {
        companies: processed.parameters.companies || [],
        roles: processed.parameters.roles || [],
        signalTypes: processed.parameters.signalTypes || ['executive_changes'],
        priority: 'medium' as const,
        frequency: processed.parameters.timeframe || 'real_time' as const
      }
    };

    // Create the signal rule
    const response = await fetch('/api/signals/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...signalConfig,
        userId,
        workspaceId,
        isActive: true
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create signal rule');
    }

    const result = await response.json();
    
    // Notify parent component
    onSignalCreated(result.rule);

    return {
      type: 'signal_created',
      message: `✅ Created signal: "${signalConfig.name}"`,
      details: {
        companies: signalConfig.config.companies.length,
        roles: signalConfig.config.roles.length,
        signalTypes: signalConfig.config.signalTypes.length,
        frequency: signalConfig.config.frequency
      },
      rule: result.rule
    };
  };

  /**
   * Handle people search requests
   */
  const handleFindPeople = async (processed: any) => {
    const searchRequest = {
      inputType: 'list' as const,
      companies: processed.parameters.companies?.map((name: string) => ({ name })) || [],
      roles: processed.parameters.roles || ['VP_SALES'],
      workspaceId: workspaceId!,
      userId: userId!,
      config: {
        maxResultsPerCompany: 3,
        minConfidenceScore: 75,
        outputFormat: processed.parameters.outputFormat || 'json',
        geography: processed.parameters.geography
      }
    };

    const response = await fetch('/api/role-finder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(searchRequest)
    });

    if (!response.ok) {
      throw new Error('Failed to search for people');
    }

    const result = await response.json();
    
    if (result.success) {
      onWorkflowResult({
        type: 'people_search',
        results: result.report.results,
        summary: result.report.summary
      });

      return {
        type: 'people_found',
        message: `🎯 Found ${result.report.summary.totalRolesFound} people matching your criteria`,
        summary: result.report.summary,
        results: result.report.results.slice(0, 5), // Show first 5 in chat
        totalResults: result.report.results.length
      };
    }

    throw new Error('People search failed');
  };

  /**
   * Handle company analysis requests
   */
  const handleAnalyzeCompany = async (processed: any) => {
    // Initialize sales intelligence workflows
    const salesWorkflows = new SalesIntelligenceWorkflows({
      coreSignal: {
        apiKey: process['env']['CORESIGNAL_API_KEY']!,
        baseUrl: process['env']['CORESIGNAL_BASE_URL'] || 'https://api.coresignal.com'
      },
      alerts: {
        enableRealTimeAlerts: true,
        checkIntervalHours: 24
      },
      scoring: {
        enableAccountScoring: true,
        scoringWeights: {
          growth: 0.3,
          funding: 0.25,
          executiveTurnover: 0.15,
          employeeSatisfaction: 0.15,
          technographics: 0.15
        }
      }
    });

    const companies = processed.parameters.companies || [];
    if (companies['length'] === 0) {
      return {
        type: 'clarification',
        message: 'Which company would you like me to analyze?',
        clarificationNeeded: ['Company name']
      };
    }

    // For now, return a placeholder response
    return {
      type: 'company_analysis',
      message: `🏢 Company analysis for ${companies.join(', ')} is being prepared...`,
      details: {
        companies: companies.length,
        analysisType: 'competitive_landscape'
      }
    };
  };

  /**
   * Handle data search requests
   */
  const handleSearchData = async (processed: any) => {
    return {
      type: 'data_search',
      message: `🔍 Searching for data based on your criteria...`,
      parameters: processed.parameters
    };
  };

  /**
   * Handle report generation requests
   */
  const handleGenerateReport = async (processed: any) => {
    return {
      type: 'report_generation',
      message: `📊 Generating ${processed.parameters.outputFormat || 'JSON'} report...`,
      parameters: processed.parameters
    };
  };

  // Return the processing function for use by AI chat
  return { processIntelligenceRequest };
}

/**
 * Hook for using intelligence workflows in AI chat
 */
export function useIntelligenceWorkflows() {
  const { user } = useUnifiedAuth();
  const workspaceId = user?.activeWorkspaceId || user?.workspaces?.[0]?.id;
  const userId = user?.id;

  const processRequest = async (input: string, context?: any) => {
    if (!userId || !workspaceId) {
      throw new Error('Authentication required');
    }

    // Create a temporary handler to process the request
    const handler = new IntelligenceWorkflowHandler({
      onWorkflowResult: () => {},
      onSignalCreated: () => {}
    });

    return await handler.processIntelligenceRequest(input, context);
  };

  return { processRequest, isReady: !!(userId && workspaceId) };
}
