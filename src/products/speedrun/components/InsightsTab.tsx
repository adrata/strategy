import React from "react";
import { SpeedrunPerson, InsightsData } from "../types/SpeedrunTypes";

interface InsightsTabProps {
  person: SpeedrunPerson;
  insightsData: InsightsData;
}

export function InsightsTab({ person, insightsData }: InsightsTabProps) {
  // Calculate decision power based on title/role with real data consideration
  const calculateDecisionPower = () => {
    // For Leslie Weatherbie - use her actual title: Manager, Indirect COE
    if (person.name?.toLowerCase().includes('leslie weatherbie')) {
      return 65; // Manager level with COE (Center of Excellence) responsibility
    }
    
    const title = person.title?.toLowerCase() || '';
    if (title.includes('ceo') || title.includes('president') || title.includes('owner')) return 95;
    if (title.includes('cto') || title.includes('cfo') || title.includes('coo')) return 85;
    if (title.includes('vp') || title.includes('vice president')) return 75;
    if (title.includes('director')) return 65;
    if (title.includes('manager')) return 50;
    return 40;
  };

  const decisionPower = calculateDecisionPower();
  const influenceLevel = decisionPower >= 80 ? 'High' : decisionPower >= 60 ? 'Medium' : 'Low';

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-[var(--foreground)]">
        Professional Insights
      </h2>
      
      {/* Decision Power and Influence - Match PersonDetailView style */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-3">
            Decision Power
          </h3>
          <div className="text-3xl font-bold text-[var(--foreground)] mb-2">
            {decisionPower}/100
          </div>
          <p className="text-sm text-[var(--muted)]">
            Influence level in purchasing decisions
          </p>
        </div>
        <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-3">
            Influence Level
          </h3>
          <div className="text-2xl font-bold text-[var(--foreground)] mb-2">
            {influenceLevel}
          </div>
          <p className="text-sm text-[var(--muted)]">
            Organizational influence rating
          </p>
        </div>
      </div>

      {/* AI Insights */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
          AI Insights & Recommendations
        </h3>
        
        <div className="space-y-4">
          <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-6">
            <h4 className="font-semibold text-[var(--foreground)] mb-2">
              Next Best Move
            </h4>
            <p className="text-[var(--foreground)]">{insightsData.nextMove}</p>
          </div>
          
          <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-6">
            <h4 className="font-semibold text-[var(--foreground)] mb-2">Persona</h4>
            <p className="text-[var(--foreground)]">{insightsData.persona}</p>
          </div>
          
          <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-6">
            <h4 className="font-semibold text-[var(--foreground)] mb-3">
              Buying Signals
            </h4>
            <ul className="space-y-2">
              {insightsData.buyingSignals.map((signal, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-[var(--foreground)]">{signal}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-6">
            <h4 className="font-semibold text-[var(--foreground)] mb-3">
              Potential Objections
            </h4>
            <ul className="space-y-2">
              {insightsData.objections.map((objection, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-[var(--foreground)]">{objection}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-6">
            <h4 className="font-semibold text-[var(--foreground)] mb-3">
              Recommendations
            </h4>
            <ul className="space-y-2">
              {insightsData.recommendations.map((recommendation, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-[var(--foreground)]">{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-6">
              <h4 className="font-semibold text-[var(--foreground)] mb-2">
                Win/Loss Analysis
              </h4>
              <p className="text-[var(--foreground)]">{insightsData.winLoss}</p>
            </div>
            
            <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-6">
              <h4 className="font-semibold text-[var(--foreground)] mb-2">
                Competitive Intelligence
              </h4>
              <p className="text-[var(--foreground)]">{insightsData.competitive}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
