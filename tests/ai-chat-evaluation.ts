/**
 * AI CHAT EVALUATION FRAMEWORK
 * 
 * Automated testing and quality assurance for the AI right panel.
 * Tests context understanding, response quality, speed, and error handling.
 */

export interface EvaluationResult {
  testName: string;
  category: 'context' | 'quality' | 'speed' | 'reliability';
  passed: boolean;
  score: number;
  details: string;
  duration: number;
  timestamp: Date;
}

export interface EvaluationReport {
  totalTests: number;
  passed: number;
  failed: number;
  overallScore: number;
  categoryScores: {
    context: number;
    quality: number;
    speed: number;
    reliability: number;
  };
  results: EvaluationResult[];
  timestamp: Date;
}

// Test scenarios for different screens/contexts
export const TEST_SCENARIOS = {
  personDetail: {
    context: {
      recordType: 'person',
      currentRecord: {
        id: 'test-person-1',
        fullName: 'John Smith',
        jobTitle: 'VP of Engineering',
        company: 'Acme Corp',
        email: 'john@acme.com',
        industry: 'Technology'
      },
      pageContext: { section: 'people', view: 'detail', url: '/people/test-person-1' }
    },
    expectedBehaviors: ['Should know person name', 'Should know job title', 'Should know company']
  },
  
  companyDetail: {
    context: {
      recordType: 'company',
      currentRecord: {
        id: 'test-company-1',
        name: 'TechStart Inc',
        industry: 'SaaS',
        employeeCount: 150,
        website: 'https://techstart.com'
      },
      pageContext: { section: 'companies', view: 'detail', url: '/companies/test-company-1' }
    },
    expectedBehaviors: ['Should know company name', 'Should know industry']
  },
  
  leadList: {
    context: {
      recordType: 'lead',
      listViewContext: {
        activeSection: 'leads',
        visibleRecords: [{ id: '1', fullName: 'Lead One' }, { id: '2', fullName: 'Lead Two' }],
        totalCount: 50,
        appliedFilters: { statusFilter: 'NEW' }
      },
      pageContext: { section: 'leads', view: 'list', url: '/leads' }
    },
    expectedBehaviors: ['Should know user is viewing a list', 'Should know record count']
  }
};

export const EVALUATION_PROMPTS = {
  contextAwareness: [
    { prompt: 'What record am I looking at?', expectedContains: ['name', 'record'], category: 'context' as const },
    { prompt: 'What page am I on?', expectedContains: ['page', 'section'], category: 'context' as const }
  ],
  
  responseQuality: [
    { prompt: 'How should I approach this lead?', minLength: 100, shouldBeActionable: true, category: 'quality' as const },
    { prompt: 'What questions should I ask?', minLength: 100, shouldContainList: true, category: 'quality' as const }
  ],
  
  speed: [
    { prompt: 'Hi', maxResponseTime: 3000, category: 'speed' as const },
    { prompt: 'Give me a detailed analysis', maxResponseTime: 10000, category: 'speed' as const }
  ]
};

export function evaluateContextAwareness(
  response: string,
  context: typeof TEST_SCENARIOS.personDetail.context
): EvaluationResult {
  let score = 0;
  const checks: string[] = [];
  
  if (context.currentRecord?.fullName && response.toLowerCase().includes(context.currentRecord.fullName.toLowerCase())) {
    score += 40;
    checks.push('✓ Knows record name');
  }
  
  if (context.currentRecord?.company && response.toLowerCase().includes(context.currentRecord.company.toLowerCase())) {
    score += 30;
    checks.push('✓ Knows company');
  }
  
  if (context.currentRecord?.jobTitle && response.toLowerCase().includes(context.currentRecord.jobTitle.toLowerCase())) {
    score += 30;
    checks.push('✓ Knows job title');
  }
  
  return {
    testName: 'Context Awareness',
    category: 'context',
    passed: score >= 50,
    score,
    details: checks.join('\n'),
    duration: 0,
    timestamp: new Date()
  };
}

export function evaluateResponseQuality(
  response: string,
  config: { minLength?: number; shouldBeActionable?: boolean; shouldContainList?: boolean }
): EvaluationResult {
  let score = 0;
  const checks: string[] = [];
  
  if (config.minLength && response.length >= config.minLength) {
    score += 30;
    checks.push(`✓ Length >= ${config.minLength}`);
  }
  
  if (config.shouldBeActionable) {
    const actionVerbs = ['should', 'try', 'consider', 'recommend', 'suggest', 'start', 'focus'];
    if (actionVerbs.some(verb => response.toLowerCase().includes(verb))) {
      score += 35;
      checks.push('✓ Contains actionable language');
    }
  }
  
  if (config.shouldContainList) {
    if (/\d+\.\s/.test(response) || /[-•]\s/.test(response)) {
      score += 35;
      checks.push('✓ Contains list');
    }
  }
  
  return {
    testName: 'Response Quality',
    category: 'quality',
    passed: score >= 50,
    score,
    details: checks.join('\n'),
    duration: 0,
    timestamp: new Date()
  };
}

export function evaluateSpeed(responseTime: number, maxTime: number): EvaluationResult {
  const passed = responseTime <= maxTime;
  const score = passed ? Math.max(0, 100 - Math.floor((responseTime / maxTime) * 50)) : 0;
  
  return {
    testName: 'Response Speed',
    category: 'speed',
    passed,
    score,
    details: `Response time: ${responseTime}ms (max: ${maxTime}ms)`,
    duration: responseTime,
    timestamp: new Date()
  };
}

export function generateReport(results: EvaluationResult[]): EvaluationReport {
  const categoryResults = {
    context: results.filter(r => r.category === 'context'),
    quality: results.filter(r => r.category === 'quality'),
    speed: results.filter(r => r.category === 'speed'),
    reliability: results.filter(r => r.category === 'reliability')
  };
  
  const avgScore = (arr: EvaluationResult[]) => 
    arr.length > 0 ? arr.reduce((sum, r) => sum + r.score, 0) / arr.length : 0;
  
  const categoryScores = {
    context: Math.round(avgScore(categoryResults.context)),
    quality: Math.round(avgScore(categoryResults.quality)),
    speed: Math.round(avgScore(categoryResults.speed)),
    reliability: Math.round(avgScore(categoryResults.reliability))
  };
  
  const passed = results.filter(r => r.passed).length;
  const overallScore = Math.round(
    (categoryScores.context * 0.3) + (categoryScores.quality * 0.3) +
    (categoryScores.speed * 0.2) + (categoryScores.reliability * 0.2)
  );
  
  return {
    totalTests: results.length,
    passed,
    failed: results.length - passed,
    overallScore,
    categoryScores,
    results,
    timestamp: new Date()
  };
}

export function printReport(report: EvaluationReport): void {
  console.log('\n========================================');
  console.log('       AI CHAT EVALUATION REPORT        ');
  console.log('========================================\n');
  console.log(`Overall Score: ${report.overallScore}/100`);
  console.log(`Tests: ${report.passed}/${report.totalTests} passed\n`);
  console.log('Category Scores:');
  console.log(`  Context:     ${report.categoryScores.context}/100`);
  console.log(`  Quality:     ${report.categoryScores.quality}/100`);
  console.log(`  Speed:       ${report.categoryScores.speed}/100`);
  console.log(`  Reliability: ${report.categoryScores.reliability}/100`);
  console.log('\n========================================\n');
}

export default {
  TEST_SCENARIOS,
  EVALUATION_PROMPTS,
  evaluateContextAwareness,
  evaluateResponseQuality,
  evaluateSpeed,
  generateReport,
  printReport
};

