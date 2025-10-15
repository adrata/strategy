/**
 * State-Based Ranking Types
 * 
 * Types for managing state-based hierarchical ranking in Speedrun
 */

export interface StateRankingPreference {
  mode: 'global' | 'state-based';
  stateOrder: string[]; // Ordered array of state codes
}

export interface StateRankingData {
  state: string;
  companyCount: number;
  peopleCount: number;
  rank: number;
  companies: Array<{
    id: string;
    name: string;
    peopleCount: number;
  }>;
}

export interface StateRankingValidation {
  isValid: boolean;
  hasStateData: boolean;
  stateDataPercentage: number;
  missingStates: string[];
  totalCompanies: number;
  companiesWithState: number;
}

export interface StateRankingResult {
  stateRankings: StateRankingData[];
  validation: StateRankingValidation;
  defaultOrder: string[];
}

export interface StateRankingSettings {
  mode: 'global' | 'state-based';
  stateOrder: string[];
  lastUpdated: Date;
  userId: string;
  workspaceId: string;
}
