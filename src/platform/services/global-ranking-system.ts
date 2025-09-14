// Global Ranking System for Contacts and Accounts
// Contacts/Accounts are the primary rank, others are tied to it
// Company-centric prospecting: prioritize leads at companies, then prospects

export interface GlobalRankRecord {
  id: string;
  globalRank: number; // Global rank across all contacts/accounts
  sectionRank: number; // Rank within their specific section (leads, prospects, etc.)
  section: 'contacts' | 'accounts' | 'leads' | 'prospects' | 'opportunities';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  status: string;
  lastContactDate?: string;
  title?: string;
  company?: string;
  amount?: number;
}

// Company-centric ranking: prioritize leads at companies over prospects
export function calculateCompanyCentricScore(record: any, allContacts: any[] = []): number {
  let score = 0;
  
  // Priority scoring
  const priority = record.priority?.toLowerCase() || 'medium';
  if (priority === 'urgent') score += 100;
  else if (priority === 'high') score += 50;
  else if (priority === 'medium') score += 25;
  
  // Status scoring with company-centric logic
  const status = record.status?.toLowerCase() || '';
  
  // LEADS get higher priority than prospects (finding the right person is more valuable)
  if (status === 'new' || status === 'uncontacted') {
    score += 80; // High priority for new leads
  } else if (status === 'contacted') {
    score += 60; // Medium-high for contacted leads
  } else if (status === 'responded' || status === 'engaged') {
    score += 40; // Lower priority for prospects (already engaged)
  } else if (status === 'qualified') {
    score += 30; // Even lower for qualified prospects
  }
  
  // Title/role scoring (decision makers get higher priority)
  const title = record.title || record.jobTitle || '';
  if (title.toLowerCase().includes('ceo') || title.toLowerCase().includes('president')) score += 60;
  else if (title.toLowerCase().includes('vp') || title.toLowerCase().includes('director')) score += 40;
  else if (title.toLowerCase().includes('manager')) score += 20;
  
  // Company activity scoring - check if this company has other contacts
  const company = record.company || record.account?.name || '';
  if (company && allContacts.length > 0) {
    const companyContacts = allContacts.filter(c => 
      (c.company || c.account?.name) === company
    );
    
    // If this is the ONLY contact at this company, give it higher priority
    if (companyContacts['length'] === 1) {
      score += 30; // New company opportunity
    } else {
      // If company has multiple contacts, prioritize leads over prospects
      const companyLeads = companyContacts.filter(c => 
        ['new', 'uncontacted', 'contacted'].includes(c.status?.toLowerCase() || '')
      );
      const companyProspects = companyContacts.filter(c => 
        ['responded', 'engaged', 'qualified'].includes(c.status?.toLowerCase() || '')
      );
      
      // If this is a lead and company has prospects, lower priority (focus on prospects first)
      if (['new', 'uncontacted', 'contacted'].includes(status) && companyProspects.length > 0) {
        score -= 20;
      }
      // If this is a prospect and company has other leads, higher priority (right person found)
      else if (['responded', 'engaged', 'qualified'].includes(status) && companyLeads.length > 0) {
        score += 25;
      }
    }
  }
  
  // Recent activity scoring
  const lastContactDate = record.lastContactDate || record.lastEmailDate || record.lastActivity;
  if (lastContactDate) {
    const daysSinceContact = Math.floor((new Date().getTime() - new Date(lastContactDate).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceContact <= 3) score += 20;
    else if (daysSinceContact <= 7) score += 15;
    else if (daysSinceContact <= 14) score += 10;
    else if (daysSinceContact >= 30) score += 25; // Old contacts get attention
  }
  
  // Amount scoring for opportunities
  if (record.amount) {
    const amount = parseFloat(record.amount);
    if (amount > 100000) score += 50;
    else if (amount > 50000) score += 30;
    else if (amount > 25000) score += 20;
  }
  
  return score;
}

// Calculate global ranking score for proper distribution
export function calculateGlobalRankScore(record: any): number {
  let score = 0;
  
  // Priority scoring
  const priority = record.priority?.toLowerCase() || 'medium';
  if (priority === 'urgent') score += 100;
  else if (priority === 'high') score += 50;
  else if (priority === 'medium') score += 25;
  
  // Status scoring
  const status = record.status?.toLowerCase() || '';
  if (status === 'responded' || status === 'engaged') score += 75;
  else if (status === 'contacted') score += 40;
  else if (status === 'new' || status === 'uncontacted') score += 30;
  
  // Title/role scoring (decision makers get higher priority)
  const title = record.title || record.jobTitle || '';
  if (title.toLowerCase().includes('ceo') || title.toLowerCase().includes('president')) score += 60;
  else if (title.toLowerCase().includes('vp') || title.toLowerCase().includes('director')) score += 40;
  else if (title.toLowerCase().includes('manager')) score += 20;
  
  // Recent activity scoring
  const lastContactDate = record.lastContactDate || record.lastEmailDate || record.lastActivity;
  if (lastContactDate) {
    const daysSinceContact = Math.floor((new Date().getTime() - new Date(lastContactDate).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceContact <= 3) score += 20;
    else if (daysSinceContact <= 7) score += 15;
    else if (daysSinceContact <= 14) score += 10;
    else if (daysSinceContact >= 30) score += 25; // Old contacts get attention
  }
  
  // Amount scoring for opportunities
  if (record.amount) {
    const amount = parseFloat(record.amount);
    if (amount > 100000) score += 50;
    else if (amount > 50000) score += 30;
    else if (amount > 25000) score += 20;
  }
  
  return score;
}

// Get timing based on global rank (50/day system)
export function getGlobalRankTiming(globalRank: number, isWeekend: boolean = false): { timing: string; color: string } {
  // Check for federal holidays
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const isHolidayTomorrow = isFederalHoliday(tomorrow);
  
  // Calculate weeks based on 250 contacts per week (50/day * 5 days)
  const contactsPerWeek = 250;
  const weekNumber = Math.ceil(globalRank / contactsPerWeek);
  
  // Top 50 contacts = Speedrun (Today/Now)
  if (globalRank <= 50) {
    if (isWeekend || isHolidayTomorrow) {
      return { timing: 'Tuesday', color: 'bg-red-100 text-red-800' };
    }
    return { timing: 'Today', color: 'bg-red-100 text-red-800' };
  }
  
  // Ranks 51-100 = This Week
  if (globalRank <= 100) {
    if (isWeekend || isHolidayTomorrow) {
      return { timing: 'Tuesday', color: 'bg-blue-100 text-blue-800' };
    }
    return { timing: 'This Week', color: 'bg-blue-100 text-blue-800' };
  }
  
  // Ranks 101-200 = Next Week
  if (globalRank <= 200) {
    return { timing: 'Next Week', color: 'bg-indigo-100 text-indigo-800' };
  }
  
  // Ranks 201-500 = Week 2 (Two Weeks)
  if (globalRank <= 500) {
    return { timing: 'Two Weeks', color: 'bg-purple-100 text-purple-800' };
  }
  
  // Ranks 501-750 = Week 3 (Three Weeks)
  if (globalRank <= 750) {
    return { timing: 'Three Weeks', color: 'bg-orange-100 text-orange-800' };
  }
  
  // Ranks 751-1000 = Week 4 (Four Weeks)
  if (globalRank <= 1000) {
    return { timing: 'Four Weeks', color: 'bg-yellow-100 text-yellow-800' };
  }
  
  // Ranks 1001+ = Next Month
  return { timing: 'Next Month', color: 'bg-gray-100 text-gray-600' };
}

// Account ranking tied to most recent contact activity
export function calculateAccountRank(account: any, allContacts: any[] = []): number {
  let score = 0;
  
  // Get all contacts for this account
  const accountContacts = allContacts.filter(c => 
    (c.company || c.account?.name) === account.name
  );
  
  if (accountContacts['length'] === 0) {
    // No contacts - base score on account properties
    score += 25;
  } else {
    // Account score based on most recent contact activity
    const mostRecentContact = accountContacts
      .filter(c => c.lastContactDate || c.lastEmailDate || c.lastActivity)
      .sort((a, b) => {
        const dateA = new Date(a.lastContactDate || a.lastEmailDate || a.lastActivity || 0);
        const dateB = new Date(b.lastContactDate || b.lastEmailDate || b.lastActivity || 0);
        return dateB.getTime() - dateA.getTime();
      })[0];
    
    if (mostRecentContact) {
      // Use the contact's score as the account score
      score = calculateCompanyCentricScore(mostRecentContact, allContacts);
    }
    
    // Bonus for accounts with multiple contacts
    if (accountContacts.length > 1) {
      score += 10;
    }
    
    // Bonus for accounts with active opportunities
    if (account.openOpportunities > 0) {
      score += 30;
    }
  }
  
  return score;
}

// Get account next action based on most recent contact activity
export function getAccountNextAction(account: any, allContacts: any[] = []): { timing: string; timingColor: string; action: string } {
  // Get all contacts for this account
  const accountContacts = allContacts.filter(c => 
    (c.company || c.account?.name) === account.name
  );
  
  if (accountContacts['length'] === 0) {
    // No contacts - default account action
    return {
      timing: 'Next Week',
      timingColor: 'bg-gray-100 text-gray-800',
      action: `Initial outreach to ${account.name}`
    };
  }
  
  // Find the contact with the most recent activity
  const mostRecentContact = accountContacts
    .filter(c => c.lastContactDate || c.lastEmailDate || c.lastActivity)
    .sort((a, b) => {
      const dateA = new Date(a.lastContactDate || a.lastEmailDate || a.lastActivity || 0);
      const dateB = new Date(b.lastContactDate || b.lastEmailDate || b.lastActivity || 0);
      return dateB.getTime() - dateA.getTime();
    })[0];
  
  if (mostRecentContact) {
    // Use the contact's next action as the account next action
    return getContactNextAction(mostRecentContact);
  }
  
  // Fallback to first contact
  const firstContact = accountContacts[0];
  return getContactNextAction(firstContact);
}

// Contact Next Action using Company-Centric Ranking
export function getContactNextAction(contact: any): { timing: string; timingColor: string; action: string } {
  // Calculate company-centric score
  const score = calculateCompanyCentricScore(contact);
  
  // Determine timing based on score
  let timing: string;
  let timingColor: string;
  
  if (score >= 150) {
    timing = 'Today';
    timingColor = 'bg-red-100 text-red-800';
  } else if (score >= 100) {
    timing = 'This Week';
    timingColor = 'bg-blue-100 text-blue-800';
  } else if (score >= 50) {
    timing = 'Next Week';
    timingColor = 'bg-indigo-100 text-indigo-800';
  } else if (score >= 25) {
    timing = 'Two Weeks';
    timingColor = 'bg-purple-100 text-purple-800';
  } else {
    timing = 'Next Month';
    timingColor = 'bg-gray-100 text-gray-600';
  }
  
  // Get action based on status
  const status = contact.status?.toLowerCase() || '';
  const name = contact.fullName || contact.firstName || contact.name || 'contact';
  
  let action = '';
  switch (status) {
    case 'new':
    case 'uncontacted':
      action = `Initial outreach to ${name}`;
      break;
    case 'contacted':
      action = `Follow up on initial conversation`;
      break;
    case 'engaged':
    case 'responded':
      action = `Schedule discovery call`;
      break;
    case 'qualified':
      action = `Present solution and next steps`;
      break;
    default:
      action = `Continue nurturing ${name}`;
  }
  
  return {
    timing,
    timingColor,
    action
  };
}

// Federal Holiday Detection
const FEDERAL_HOLIDAYS_2025 = [
  '2025-01-01', // New Year's Day
  '2025-01-20', // Martin Luther King Jr. Day
  '2025-02-17', // Presidents' Day
  '2025-05-26', // Memorial Day
  '2025-07-04', // Independence Day
  '2025-09-01', // Labor Day
  '2025-10-13', // Columbus Day
  '2025-11-11', // Veterans Day
  '2025-11-27', // Thanksgiving Day
  '2025-12-25', // Christmas Day
];

function isFederalHoliday(date: Date): boolean {
  const dateString = date.toISOString().split('T')[0];
  return FEDERAL_HOLIDAYS_2025.includes(dateString);
}

// Calculate working days in a week (Monday to Friday, excluding holidays)
export function getWorkingDaysInWeek(startDate: Date): number {
  let workingDays = 0;
  const weekStart = new Date(startDate);
  
  // Find Monday of the current week
  const dayOfWeek = weekStart.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, Monday = 1
  weekStart.setDate(weekStart.getDate() - daysToMonday);
  
  // Check each day from Monday to Friday
  for (let i = 0; i < 5; i++) {
    const checkDate = new Date(weekStart);
    checkDate.setDate(weekStart.getDate() + i);
    
    const isWeekend = checkDate.getDay() === 0 || checkDate.getDay() === 6;
    const isHoliday = isFederalHoliday(checkDate);
    
    if (!isWeekend && !isHoliday) {
      workingDays++;
    }
  }
  
  return workingDays;
}

// Calculate dynamic goals based on working days
export function getDynamicGoals(): { daily: number; weekly: number; weeklyWorkingDays: number } {
  const today = new Date();
  const workingDaysThisWeek = getWorkingDaysInWeek(today);
  
  // Base goal is 50 per day, 250 per week (5 days)
  const baseDailyGoal = 50;
  const baseWeeklyGoal = 250;
  
  // Adjust weekly goal based on working days
  const adjustedWeeklyGoal = Math.round((baseWeeklyGoal / 5) * workingDaysThisWeek);
  
  return {
    daily: baseDailyGoal,
    weekly: adjustedWeeklyGoal,
    weeklyWorkingDays: workingDaysThisWeek
  };
}
