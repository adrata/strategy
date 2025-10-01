import React from "react";
import { Person } from "../../types";

interface PersonDetailIntelligenceProps {
  person: Person;
}

export function PersonDetailIntelligence({ person }: PersonDetailIntelligenceProps) {
  // Extract enriched data from customFields
  const customFields = (person as any).customFields || {};
  const coresignalData = customFields.coresignalData || customFields.coresignal || {};
  const buyerGroupRole = customFields.buyerGroupRole || 'Stakeholder';
  const influenceLevel = customFields.influenceLevel || 'Medium';
  const engagementPriority = customFields.engagementPriority || 'Medium';
  
  // Get strategic intelligence data
  const situationAnalysis = customFields.situationAnalysis;
  const complications = customFields.complications;
  const strategicIntelligence = customFields.strategicIntelligence;
  const painPoints = customFields.painPoints || [];
  const goals = customFields.goals || [];
  const decisionFactors = customFields.decisionFactors || [];
  
  // Get CoreSignal insights - use the correct field names
  const experience = coresignalData.experience || [];
  const skills = coresignalData.inferred_skills || coresignalData.skills || [];
  const education = coresignalData.education || [];
  
  // Generate AI insights based on available data
  const generateInsights = () => {
    const insights = [];
    
    // Role-based insights
    if (buyerGroupRole === 'Decision Maker') {
      insights.push({
        type: 'decision_maker',
        title: 'Decision Maker Profile',
        content: 'This person has direct authority to make purchasing decisions and should be the primary focus for sales efforts.',
        priority: 'high'
      });
    } else if (buyerGroupRole === 'Champion') {
      insights.push({
        type: 'champion',
        title: 'Internal Champion',
        content: 'This person can advocate for your solution internally and help navigate the decision-making process.',
        priority: 'high'
      });
    }
    
    // Influence-based insights
    if (influenceLevel === 'High') {
      insights.push({
        type: 'influence',
        title: 'High Influence',
        content: 'This person has significant influence over the decision-making process and should be prioritized.',
        priority: 'high'
      });
    }
    
    // Experience-based insights
    if (experience.length > 0) {
      const currentRole = experience.find(exp => exp.active_experience === 1);
      if (currentRole) {
        insights.push({
          type: 'experience',
          title: 'Current Role Analysis',
          content: `Currently serving as ${currentRole.title} at ${currentRole.company_name}, bringing ${Math.floor((new Date().getTime() - new Date(currentRole.start_date).getTime()) / (1000 * 60 * 60 * 24 * 365))} years of experience in this role.`,
          priority: 'medium'
        });
      }
    }
    
    // Skills-based insights
    if (skills.length > 0) {
      const technicalSkills = skills.filter(skill => 
        ['Python', 'JavaScript', 'Java', 'C++', 'React', 'Angular', 'Node.js', 'AWS', 'Azure', 'Docker'].some(tech => 
          skill.toLowerCase().includes(tech.toLowerCase())
        )
      );
      
      if (technicalSkills.length > 0) {
        insights.push({
          type: 'technical',
          title: 'Technical Expertise',
          content: `Strong technical background in ${technicalSkills.slice(0, 3).join(', ')}. This suggests they value technical solutions and detailed product demonstrations.`,
          priority: 'medium'
        });
      }
    }
    
    return insights;
  };
  
  const insights = generateInsights();
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'decision_maker': return '👑';
      case 'champion': return '🏆';
      case 'influence': return '💪';
      case 'experience': return '💼';
      case 'technical': return '⚙️';
      default: return '💡';
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Intelligence & Insights</h3>
      
      {/* AI-Generated Insights */}
      {insights.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h4 className="text-md font-semibold mb-4">AI-Generated Insights</h4>
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div key={index} className={`p-4 rounded-lg border ${getPriorityColor(insight.priority)}`}>
                <div className="flex items-start space-x-3">
                  <span className="text-lg">{getTypeIcon(insight.type)}</span>
                  <div className="flex-1">
                    <h5 className="font-medium">{insight.title}</h5>
                    <p className="text-sm mt-1">{insight.content}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(insight.priority)}`}>
                    {insight.priority.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Strategic Intelligence */}
      {(situationAnalysis || complications || strategicIntelligence) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h4 className="text-md font-semibold mb-4">Strategic Intelligence</h4>
          <div className="space-y-4">
            {situationAnalysis && (
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Situation Analysis</h5>
                <p className="text-sm text-gray-600">{situationAnalysis}</p>
              </div>
            )}
            {complications && (
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Complications</h5>
                <p className="text-sm text-gray-600">{complications}</p>
              </div>
            )}
            {strategicIntelligence && (
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Strategic Intelligence</h5>
                <p className="text-sm text-gray-600">{strategicIntelligence}</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Pain Points & Goals */}
      {(painPoints.length > 0 || goals.length > 0) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h4 className="text-md font-semibold mb-4">Pain Points & Goals</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {painPoints.length > 0 && (
              <div>
                <h5 className="font-medium text-red-700 mb-2">Pain Points</h5>
                <ul className="space-y-1">
                  {painPoints.map((pain: string, index: number) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                      <span className="text-red-500 mr-2">•</span>
                      {pain}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {goals.length > 0 && (
              <div>
                <h5 className="font-medium text-green-700 mb-2">Goals</h5>
                <ul className="space-y-1">
                  {goals.map((goal: string, index: number) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                      <span className="text-green-500 mr-2">•</span>
                      {goal}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Decision Factors */}
      {decisionFactors.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h4 className="text-md font-semibold mb-4">Decision Factors</h4>
          <div className="space-y-2">
            {decisionFactors.map((factor: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <span className="text-blue-500">✓</span>
                <span className="text-sm text-gray-600">{factor}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Professional Background */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h4 className="text-md font-semibold mb-4">Professional Background</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h5 className="font-medium text-gray-700 mb-2">Buyer Group Role</h5>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor('high')}`}>
              {buyerGroupRole}
            </span>
          </div>
          <div>
            <h5 className="font-medium text-gray-700 mb-2">Influence Level</h5>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor('medium')}`}>
              {influenceLevel}
            </span>
          </div>
          <div>
            <h5 className="font-medium text-gray-700 mb-2">Engagement Priority</h5>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor('medium')}`}>
              {engagementPriority}
            </span>
          </div>
          <div>
            <h5 className="font-medium text-gray-700 mb-2">Data Quality</h5>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${coresignalData.full_name ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {coresignalData.full_name ? 'High' : 'Basic'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Skills & Expertise */}
      {skills.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h4 className="text-md font-semibold mb-4">Skills & Expertise</h4>
          <div className="flex flex-wrap gap-2">
            {skills.slice(0, 15).map((skill: string, index: number) => (
              <span 
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
              >
                {skill}
              </span>
            ))}
            {skills.length > 15 && (
              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                +{skills.length - 15} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


