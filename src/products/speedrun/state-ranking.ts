/**
 * State Ranking Service
 * 
 * Handles state-based ranking logic for Speedrun prospects
 */

import { prisma } from '@/lib/prisma';
import type { 
  StateRankingData, 
  StateRankingValidation, 
  StateRankingResult,
  StateRankingSettings 
} from './types/StateRankingTypes';

export class StateRankingService {
  private workspaceId: string;
  private userId: string;

  constructor(workspaceId: string, userId: string) {
    this.workspaceId = workspaceId;
    this.userId = userId;
  }

  /**
   * Get all unique states from workspace companies
   */
  async getStatesFromWorkspace(): Promise<StateRankingResult> {
    try {
      console.log(`🗺️ [STATE_RANKING] Getting states for workspace: ${this.workspaceId}`);

      // Get all companies with state data
      const companies = await prisma.companies.findMany({
        where: {
          workspaceId: this.workspaceId,
          deletedAt: null,
          hqState: { not: null }
        },
        select: {
          id: true,
          name: true,
          hqState: true,
        _count: {
          select: {
            people: {
              where: {
                deletedAt: null
              }
            }
          }
        }
        }
      });

      // Get total company count for validation
      const totalCompanies = await prisma.companies.count({
        where: {
          workspaceId: this.workspaceId,
          deletedAt: null
        }
      });

      // Group by state
      const stateMap = new Map<string, StateRankingData>();
      
      companies.forEach(company => {
        const state = company.hqState!;
        
        if (!stateMap.has(state)) {
          stateMap.set(state, {
            state,
            companyCount: 0,
            peopleCount: 0,
            rank: 0,
            companies: []
          });
        }
        
        const stateData = stateMap.get(state)!;
        stateData.companyCount++;
        stateData.peopleCount += company._count.people;
        stateData.companies.push({
          id: company.id,
          name: company.name,
          peopleCount: company._count.people
        });
      });

      const stateRankings = Array.from(stateMap.values());
      const companiesWithState = companies.length;
      const stateDataPercentage = totalCompanies > 0 ? (companiesWithState / totalCompanies) * 100 : 0;

      // Validation
      const validation: StateRankingValidation = {
        isValid: stateDataPercentage >= 70, // Require 70% state data coverage
        hasStateData: companiesWithState > 0,
        stateDataPercentage,
        missingStates: [],
        totalCompanies,
        companiesWithState
      };

      // Default ordering: by company count (descending), then alphabetically
      const defaultOrder = stateRankings
        .sort((a, b) => {
          if (b.companyCount !== a.companyCount) {
            return b.companyCount - a.companyCount;
          }
          return a.state.localeCompare(b.state);
        })
        .map(s => s.state);

      console.log(`✅ [STATE_RANKING] Found ${stateRankings.length} states with ${companiesWithState}/${totalCompanies} companies (${stateDataPercentage.toFixed(1)}% coverage)`);

      return {
        stateRankings,
        validation,
        defaultOrder
      };

    } catch (error) {
      console.error('❌ [STATE_RANKING] Error getting states:', error);
      throw error;
    }
  }

  /**
   * Validate state data availability
   */
  async validateStateData(): Promise<StateRankingValidation> {
    const result = await this.getStatesFromWorkspace();
    return result.validation;
  }

  /**
   * Get user's state ranking preferences
   */
  async getUserStatePreferences(): Promise<StateRankingSettings | null> {
    try {
      const user = await prisma.users.findUnique({
        where: { id: this.userId },
        select: {
          id: true,
          // Note: These fields will be available after schema migration
          // speedrunRankingMode: true,
          // stateRankingOrder: true
        }
      });

      if (!user) {
        return null;
      }

      // For now, return default values until schema is migrated
      return {
        mode: 'global', // (user.speedrunRankingMode as 'global' | 'state-based') || 'global',
        stateOrder: [], // (user.stateRankingOrder as string[]) || [],
        lastUpdated: new Date(),
        userId: this.userId,
        workspaceId: this.workspaceId
      };

    } catch (error) {
      console.error('❌ [STATE_RANKING] Error getting user preferences:', error);
      return null;
    }
  }

  /**
   * Save user's state ranking preferences
   */
  async saveUserStatePreferences(settings: Partial<StateRankingSettings>): Promise<boolean> {
    try {
      // For now, just log the settings until schema is migrated
      console.log('State ranking settings to save:', settings);
      
      // TODO: Uncomment after schema migration
      // await prisma.users.update({
      //   where: { id: this.userId },
      //   data: {
      //     speedrunRankingMode: settings.mode || 'global',
      //     stateRankingOrder: settings.stateOrder || [],
      //     updatedAt: new Date()
      //   }
      // });

      console.log(`✅ [STATE_RANKING] Saved preferences for user: ${this.userId}`);
      return true;

    } catch (error) {
      console.error('❌ [STATE_RANKING] Error saving preferences:', error);
      return false;
    }
  }

  /**
   * Apply custom state ordering from user preferences
   */
  async getOrderedStates(): Promise<string[]> {
    try {
      const preferences = await this.getUserStatePreferences();
      const { defaultOrder } = await this.getStatesFromWorkspace();

      if (!preferences || preferences.mode !== 'state-based' || !preferences.stateOrder.length) {
        return defaultOrder;
      }

      // Validate that all states in preferences exist in workspace
      const { stateRankings } = await this.getStatesFromWorkspace();
      const existingStates = new Set(stateRankings.map(s => s.state));
      
      // Filter preferences to only include existing states
      const validStateOrder = preferences.stateOrder.filter(state => existingStates.has(state));
      
      // Add any missing states to the end
      const missingStates = defaultOrder.filter(state => !validStateOrder.includes(state));
      
      return [...validStateOrder, ...missingStates];

    } catch (error) {
      console.error('❌ [STATE_RANKING] Error getting ordered states:', error);
      const { defaultOrder } = await this.getStatesFromWorkspace();
      return defaultOrder;
    }
  }

  /**
   * Get state ranking data with custom ordering applied
   */
  async getStateRankingData(): Promise<StateRankingData[]> {
    try {
      const { stateRankings } = await this.getStatesFromWorkspace();
      const orderedStates = await this.getOrderedStates();

      // Create a map for quick lookup
      const stateMap = new Map(stateRankings.map(s => [s.state, s]));

      // Apply ordering and assign ranks
      const orderedRankings = orderedStates
        .map((state, index) => {
          const stateData = stateMap.get(state);
          if (stateData) {
            return {
              ...stateData,
              rank: index + 1
            };
          }
          return null;
        })
        .filter((item): item is StateRankingData => item !== null);

      return orderedRankings;

    } catch (error) {
      console.error('❌ [STATE_RANKING] Error getting state ranking data:', error);
      return [];
    }
  }

  /**
   * Check if state-based ranking is available for this workspace
   */
  async isStateBasedRankingAvailable(): Promise<boolean> {
    try {
      const validation = await this.validateStateData();
      return validation.isValid && validation.hasStateData;
    } catch (error) {
      console.error('❌ [STATE_RANKING] Error checking availability:', error);
      return false;
    }
  }
}
