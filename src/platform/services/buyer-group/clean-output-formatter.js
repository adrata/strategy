#!/usr/bin/env node

/**
 * 🎯 CLEAN BUYER GROUP OUTPUT FORMATTER
 * 
 * Formats buyer group analysis into clean, human-readable format:
 * 1. Title, Name (Lead) 
 * 2. Pain/Challenges (top 3)
 * 3. Reasoning: Human-readable selection rationale
 * 4. Confidence: Math score
 */

const fs = require('fs');
const path = require('path');

class CleanOutputFormatter {
  
  /**
   * Format buyer group into clean stakeholder format
   */
  formatBuyerGroup(buyerGroupReport, profiles) {
    const { buyerGroup } = buyerGroupReport;
    
    if (!buyerGroup || !buyerGroup.roles) {
      return { error: 'No buyer group data found' };
    }
    
    const formatted = {
      company: buyerGroup.companyName,
      totalMembers: buyerGroup.totalMembers,
      generatedAt: new Date().toISOString(),
      roles: {}
    };
    
    // Process each role type
    Object.entries(buyerGroup.roles).forEach(([roleType, members]) => {
      if (members && members.length > 0) {
        formatted.roles[roleType] = this.formatRole(roleType, members, profiles);
      }
    });
    
    return formatted;
  }
  
  /**
   * Format a single role with clean output
   */
  formatRole(roleType, members, profiles) {
    const roleData = {
      count: members.length,
      members: []
    };
    
    members.forEach((member, index) => {
      const profile = profiles?.find(p => p.id === member.personId);
      const cleanMember = this.formatMember(member, profile, index + 1);
      roleData.members.push(cleanMember);
    });
    
    return roleData;
  }
  
  /**
   * Format individual member with clean, human-readable format
   */
  formatMember(member, profile, position) {
    const isLead = member.isLead || member.rank === 1;
    
    // 1. Title, Name (Lead)
    const nameDisplay = this.formatNameDisplay(member, profile, isLead);
    
    // 2. Pain/Challenges (top 3)
    const painChallenges = this.formatPainChallenges(member);
    
    // 3. Reasoning: Human-readable selection rationale
    const reasoning = this.formatHumanReasoning(member, profile);
    
    // 4. Confidence (math score)
    const confidence = this.formatConfidence(member);
    
    return {
      position,
      nameDisplay,
      painChallenges,
      reasoning,
      confidence,
      // Raw data for reference
      rawData: {
        personId: member.personId,
        role: member.role,
        score: member.score,
        rank: member.rank || position
      }
    };
  }
  
  /**
   * Format name display: Title, Name (Lead)
   */
  formatNameDisplay(member, profile, isLead) {
    const title = profile?.title || 'Unknown Title';
    const name = profile?.name || 'Unknown Name';
    const leadTag = isLead ? ' (Lead)' : '';
    
    return `${title}, ${name}${leadTag}`;
  }
  
  /**
   * Format pain/challenges (top 3)
   */
  formatPainChallenges(member) {
    const painIntelligence = member.painIntelligence;
    
    if (!painIntelligence || !painIntelligence.primaryChallenges) {
      return ['No specific pain points identified'];
    }
    
    // Get top 3 challenges by urgency/confidence
    const topChallenges = painIntelligence.primaryChallenges
      .sort((a, b) => (b.urgency * b.confidence) - (a.urgency * a.confidence))
      .slice(0, 3)
      .map(challenge => challenge.description);
    
    return topChallenges.length > 0 ? topChallenges : ['General operational efficiency needs'];
  }
  
  /**
   * Format human-readable reasoning (no math scores)
   */
  formatHumanReasoning(member, profile) {
    const rationale = member.rationale || [];
    const humanReasons = [];
    
    // Extract human-readable reasons from rationale
    rationale.forEach(reason => {
      if (typeof reason === 'string') {
        // Skip technical/mathematical reasons
        if (reason.includes('score:') || reason.includes('Score:') || 
            reason.includes('influence_score') || reason.includes('Above the line:')) {
          return;
        }
        
        // Convert technical reasons to human language
        const humanReason = this.convertToHumanLanguage(reason, profile);
        if (humanReason) {
          humanReasons.push(humanReason);
        }
      }
    });
    
    // Add role-specific reasoning
    const roleReasoning = this.getRoleSpecificReasoning(member, profile);
    if (roleReasoning) {
      humanReasons.unshift(roleReasoning);
    }
    
    return humanReasons.length > 0 ? humanReasons.join('. ') : 'Selected based on title match and organizational relevance.';
  }
  
  /**
   * Convert technical rationale to human language
   */
  convertToHumanLanguage(reason, profile) {
    // Map technical reasons to human explanations
    const mappings = {
      'Default stakeholder classification': 'Identified as a key stakeholder in the buying process',
      'Authority level: High': 'Has significant decision-making authority',
      'Authority level: Medium': 'Has moderate influence on decisions', 
      'Budget authority indicators present': 'Likely controls or influences budget decisions',
      'Sales function alignment': 'Works directly in sales organization, understands revenue challenges',
      'Revenue operations focus': 'Responsible for sales efficiency and process optimization',
      'Customer-facing role': 'Regular interaction with customers provides valuable market insights',
      'Analytics/data focus': 'Data-driven role suggests need for better business intelligence',
      'Technology leadership': 'Technical authority for evaluating and implementing new solutions',
      'Enterprise scope': 'Manages enterprise-level initiatives and strategic programs',
      
      // Enhanced reasoning mappings
      'DECISION MAKER:': 'Primary decision maker with final approval authority',
      'CHAMPION:': 'Internal advocate who will promote the solution',
      'STAKEHOLDER:': 'Key influencer who provides input to the decision',
      'BLOCKER:': 'Can prevent or delay the purchase decision',
      'INTRODUCER:': 'Can facilitate access to other decision makers',
      'Authority Analysis:': 'Decision-making authority assessment:',
      'Budget Authority:': 'Budget control and influence:',
      'Deal Size Match:': 'Authority level appropriate for deal size:',
      'Functional Scope:': 'Functional responsibility and influence:',
      'Champion Qualities:': 'Key champion characteristics:',
      'Operational Impact:': 'Direct operational influence:',
      'Internal Influence:': 'Organizational influence level:',
      'Advocacy Potential:': 'Likelihood to advocate for solution:',
      'Stakeholder Impact:': 'How this person is affected by the decision:',
      'Influence Level:': 'Level of influence on the decision:',
      'Decision Input:': 'Type of input provided to decision makers:',
      'Blocking Authority:': 'Authority to block or delay decisions:',
      'Risk Factors:': 'Potential concerns or risks:',
      'Mitigation Strategy:': 'Recommended approach to address concerns:',
      'Access Value:': 'Value in providing access to others:',
      'Relationship Network:': 'Network of relationships:',
      'Introduction Potential:': 'Ability to facilitate introductions:'
    };
    
    // Check for direct mappings
    for (const [technical, human] of Object.entries(mappings)) {
      if (reason.includes(technical)) {
        return human;
      }
    }
    
    // Dynamic reasoning based on title
    if (profile?.title) {
      const title = profile.title.toLowerCase();
      
      if (title.includes('director') && title.includes('sales')) {
        return 'Senior sales leadership position with operational responsibility';
      }
      if (title.includes('vp') && (title.includes('sales') || title.includes('revenue'))) {
        return 'Executive-level decision maker for sales and revenue initiatives';
      }
      if (title.includes('operations')) {
        return 'Operations focus suggests strong interest in efficiency and process improvements';
      }
      if (title.includes('customer success')) {
        return 'Customer success role indicates focus on customer outcomes and satisfaction';
      }
      if (title.includes('analytics') || title.includes('data')) {
        return 'Data and analytics responsibility suggests need for better business intelligence';
      }
    }
    
    return null;
  }
  
  /**
   * Get role-specific reasoning
   */
  getRoleSpecificReasoning(member, profile) {
    const role = member.role;
    const title = profile?.title?.toLowerCase() || '';
    
    switch (role) {
      case 'decision':
        return `Senior executive with budget authority for enterprise technology purchases`;
      case 'champion':
        return `Operations leader who would directly benefit from improved sales intelligence and efficiency`;
      case 'stakeholder':
        return `Key influencer whose function would be impacted by sales technology changes`;
      case 'blocker':
        return `Risk and compliance role that must approve new technology implementations`;
      case 'introducer':
        return `Customer-facing role with relationships across the organization who can facilitate introductions`;
      default:
        return null;
    }
  }
  
  /**
   * Format confidence score
   */
  formatConfidence(member) {
    const confidence = member.confidence || 0;
    const percentage = Math.round(confidence * 100);
    
    let level = 'Low';
    if (percentage >= 80) level = 'High';
    else if (percentage >= 60) level = 'Medium-High';
    else if (percentage >= 40) level = 'Medium';
    else if (percentage >= 20) level = 'Medium-Low';
    
    return {
      percentage: percentage,
      level: level,
      score: confidence
    };
  }
  
  /**
   * Generate summary statistics
   */
  generateSummary(formattedData) {
    const summary = {
      totalMembers: formattedData.totalMembers,
      roleDistribution: {},
      leadersIdentified: [],
      coverageAnalysis: {
        hasDecisionMaker: false,
        hasChampion: false,
        hasIntroducer: false,
        hasBlocker: false,
        overallCoverage: 'Poor'
      }
    };
    
    // Role distribution
    Object.entries(formattedData.roles).forEach(([role, data]) => {
      summary.roleDistribution[role] = data.count;
      
      // Track coverage
      if (role === 'decision' && data.count > 0) summary.coverageAnalysis.hasDecisionMaker = true;
      if (role === 'champion' && data.count > 0) summary.coverageAnalysis.hasChampion = true;
      if (role === 'introducer' && data.count > 0) summary.coverageAnalysis.hasIntroducer = true;
      if (role === 'blocker' && data.count > 0) summary.coverageAnalysis.hasBlocker = true;
      
      // Find lead for each role
      const leadMember = data.members.find(m => m.nameDisplay.includes('(Lead)'));
      if (leadMember) {
        summary.leadersIdentified.push({
          role: role,
          leader: leadMember.nameDisplay
        });
      }
    });
    
    // Overall coverage assessment
    const roleCount = Object.keys(formattedData.roles).length;
    const hasEssentials = summary.coverageAnalysis.hasDecisionMaker && summary.coverageAnalysis.hasChampion;
    
    if (roleCount >= 4 && hasEssentials) summary.coverageAnalysis.overallCoverage = 'Excellent';
    else if (roleCount >= 3 && hasEssentials) summary.coverageAnalysis.overallCoverage = 'Good';
    else if (hasEssentials) summary.coverageAnalysis.overallCoverage = 'Acceptable';
    else summary.coverageAnalysis.overallCoverage = 'Poor';
    
    return summary;
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('Usage: node clean-output-formatter.js <buyer-group-report.json>');
    process.exit(1);
  }
  
  const inputFile = args[0];
  if (!fs.existsSync(inputFile)) {
    console.error(`Error: File ${inputFile} not found`);
    process.exit(1);
  }
  
  try {
    const report = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
    const formatter = new CleanOutputFormatter();
    const formatted = formatter.formatBuyerGroup(report, report.profiles);
    const summary = formatter.generateSummary(formatted);
    
    console.log('\n🎯 CLEAN BUYER GROUP ANALYSIS');
    console.log('==============================');
    console.log(`Company: ${formatted.company}`);
    console.log(`Total Members: ${formatted.totalMembers}`);
    console.log(`Generated: ${formatted.generatedAt}`);
    
    // Print each role
    Object.entries(formatted.roles).forEach(([roleType, roleData]) => {
      console.log(`\n📋 ${roleType.toUpperCase()} (${roleData.count})`);
      console.log('='.repeat(30));
      
      roleData.members.forEach((member) => {
        console.log(`\n${member.position}. ${member.nameDisplay}`);
        console.log(`   Pain/Challenges: ${member.painChallenges.join('; ')}`);
        console.log(`   Reasoning: ${member.reasoning}`);
        console.log(`   Confidence: ${member.confidence.percentage}% (${member.confidence.level})`);
      });
    });
    
    // Print summary
    console.log('\n📊 SUMMARY');
    console.log('==========');
    console.log(`Coverage: ${summary.coverageAnalysis.overallCoverage}`);
    console.log(`Leaders: ${summary.leadersIdentified.map(l => `${l.role}: ${l.leader}`).join(', ')}`);
    
    // Save formatted output
    const outputFile = inputFile.replace('.json', '-CLEAN-FORMAT.json');
    fs.writeFileSync(outputFile, JSON.stringify({ formatted, summary }, null, 2));
    console.log(`\n✅ Clean format saved: ${outputFile}`);
    
  } catch (error) {
    console.error('Error processing file:', error.message);
    process.exit(1);
  }
}

module.exports = { CleanOutputFormatter };
