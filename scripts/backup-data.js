#!/usr/bin/env node

/**
 * Data Backup Script
 * Exports all critical data tables to CSV files before migration
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Create backup directory with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const backupDir = path.join(__dirname, '..', 'data-backup', timestamp);

// Ensure backup directory exists
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

console.log(`📁 Creating backup in: ${backupDir}`);

// Function to convert data to CSV
function arrayToCSV(data, headers) {
  if (!data || data.length === 0) {
    return headers.join(',') + '\n';
  }
  
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) {
        return '';
      }
      if (typeof value === 'object') {
        return JSON.stringify(value).replace(/"/g, '""');
      }
      return String(value).replace(/"/g, '""');
    });
    csvRows.push(values.map(v => `"${v}"`).join(','));
  }
  
  return csvRows.join('\n');
}

// Function to export table to CSV
async function exportTableToCSV(tableName, query, headers) {
  try {
    console.log(`📊 Exporting ${tableName}...`);
    
    const data = await query();
    const csv = arrayToCSV(data, headers);
    
    const filePath = path.join(backupDir, `${tableName}.csv`);
    fs.writeFileSync(filePath, csv);
    
    console.log(`✅ Exported ${data.length} records to ${filePath}`);
    return data.length;
  } catch (error) {
    console.error(`❌ Error exporting ${tableName}:`, error.message);
    return 0;
  }
}

async function backupAllData() {
  console.log('🚀 Starting data backup...');
  
  try {
    // Export Person table
    await exportTableToCSV('Person', 
      () => prisma.person.findMany(),
      ['id', 'name', 'email', 'title', 'role', 'sellerProfileId', 'createdAt', 'updatedAt', 'bio', 'createdBy', 'dataSource', 'department', 'doNotCall', 'emailOptOut', 'firstName', 'fullName', 'gdprConsent', 'githubUsername', 'isVerified', 'lastEnriched', 'lastName', 'linkedinUrl', 'location', 'mobile', 'personalEmail', 'personalWebsite', 'phone', 'photoUrl', 'previousCompanies', 'seniority', 'timezone', 'twitterHandle', 'workspaceId', 'demoScenarioId', 'isDemoData', 'externalId', 'assignedUserId', 'company', 'companyDomain', 'industry', 'isActive', 'jobTitle', 'lastEngagementDate', 'lastEngagementType', 'mobilePhone', 'notes', 'priority', 'speedrunRank', 'status', 'tags', 'workEmail']
    );

    // Export Company table
    await exportTableToCSV('Company',
      () => prisma.company.findMany(),
      ['id', 'name', 'workspaceId', 'createdAt', 'updatedAt', 'demoScenarioId', 'isDemoData']
    );

    // Export contacts table
    await exportTableToCSV('contacts',
      () => prisma.contacts.findMany(),
      ['id', 'workspaceId', 'accountId', 'assignedUserId', 'firstName', 'lastName', 'middleName', 'fullName', 'displayName', 'salutation', 'suffix', 'jobTitle', 'department', 'seniority', 'email', 'workEmail', 'personalEmail', 'secondaryEmail', 'phone', 'mobilePhone', 'workPhone', 'linkedinUrl', 'twitterHandle', 'address', 'city', 'state', 'country', 'postalCode', 'dateOfBirth', 'gender', 'notes', 'bio', 'tags', 'customFields', 'preferredLanguage', 'timezone', 'status', 'lastEnriched', 'enrichmentSources', 'emailVerified', 'phoneVerified', 'mobileVerified', 'enrichmentScore', 'emailConfidence', 'phoneConfidence', 'dataCompleteness', 'createdAt', 'updatedAt', 'personId', 'deletedAt', 'externalId', 'vertical', 'zohoId', 'communicationStyle', 'decisionMakingStyle', 'hobbies', 'interests', 'personalGoals', 'professionalGoals', 'workAnniversary', 'buyerGroupRole', 'coresignalCompanyId', 'coresignalEmployeeId', 'decisionMakingPower', 'discoverySource', 'efficiencyFocus', 'seniorityScore', 'targetPriority', 'directDialPhone', 'mobilePhoneVerified', 'phone1', 'phone1Extension', 'phone1Type', 'phone1Verified', 'phone2', 'phone2Extension', 'phone2Type', 'phone2Verified', 'phoneDataQuality', 'phoneEnrichmentDate', 'phoneEnrichmentSource', 'workPhoneVerified', 'source']
    );

    // Export leads table
    await exportTableToCSV('leads',
      () => prisma.leads.findMany(),
      ['id', 'workspaceId', 'assignedUserId', 'firstName', 'lastName', 'fullName', 'displayName', 'email', 'workEmail', 'personalEmail', 'phone', 'mobilePhone', 'workPhone', 'company', 'companyDomain', 'industry', 'companySize', 'jobTitle', 'title', 'department', 'linkedinUrl', 'address', 'city', 'state', 'country', 'postalCode', 'status', 'priority', 'source', 'estimatedValue', 'currency', 'notes', 'description', 'tags', 'customFields', 'preferredLanguage', 'timezone', 'lastEnriched', 'enrichmentSources', 'emailVerified', 'phoneVerified', 'mobileVerified', 'enrichmentScore', 'emailConfidence', 'phoneConfidence', 'dataCompleteness', 'engagementLevel', 'lastContactDate', 'nextFollowUpDate', 'touchPointsCount', 'responseRate', 'avgResponseTime', 'buyingSignals', 'painPoints', 'interests', 'budget', 'authority', 'needUrgency', 'timeline', 'competitorMentions', 'marketingQualified', 'salesQualified', 'createdAt', 'updatedAt', 'workspaceId', 'assignedUserId', 'lastActionDate', 'nextAction', 'currentStage', 'relationship', 'buyerGroupRole', 'personId', 'deletedAt']
    );

    // Export prospects table
    await exportTableToCSV('prospects',
      () => prisma.prospects.findMany(),
      ['id', 'workspaceId', 'assignedUserId', 'zohoId', 'firstName', 'lastName', 'fullName', 'displayName', 'email', 'workEmail', 'personalEmail', 'phone', 'mobilePhone', 'workPhone', 'company', 'companyDomain', 'industry', 'vertical', 'companySize', 'jobTitle', 'title', 'department', 'linkedinUrl', 'address', 'city', 'state', 'country', 'postalCode', 'status', 'priority', 'source', 'estimatedValue', 'currency', 'notes', 'description', 'tags', 'customFields', 'preferredLanguage', 'timezone', 'lastEnriched', 'enrichmentSources', 'emailVerified', 'phoneVerified', 'mobileVerified', 'enrichmentScore', 'emailConfidence', 'phoneConfidence', 'dataCompleteness', 'engagementLevel', 'lastContactDate', 'nextFollowUpDate', 'touchPointsCount', 'responseRate', 'avgResponseTime', 'buyingSignals', 'painPoints', 'interests', 'budget', 'authority', 'needUrgency', 'timeline', 'competitorMentions', 'marketingQualified', 'salesQualified', 'createdAt', 'updatedAt', 'personId', 'deletedAt']
    );

    // Export accounts table
    await exportTableToCSV('accounts',
      () => prisma.accounts.findMany(),
      ['id', 'workspaceId', 'assignedUserId', 'name', 'website', 'industry', 'size', 'email', 'phone', 'address', 'city', 'state', 'country', 'postalCode', 'accountType', 'description', 'notes', 'tags', 'customFields', 'preferredLanguage', 'timezone', 'status', 'lastEnriched', 'enrichmentSources', 'emailVerified', 'phoneVerified', 'mobileVerified', 'enrichmentScore', 'emailConfidence', 'phoneConfidence', 'dataCompleteness', 'engagementLevel', 'lastContactDate', 'nextFollowUpDate', 'touchPointsCount', 'responseRate', 'avgResponseTime', 'buyingSignals', 'painPoints', 'interests', 'budget', 'authority', 'needUrgency', 'timeline', 'competitorMentions', 'marketingQualified', 'salesQualified', 'createdAt', 'updatedAt', 'deletedAt', 'externalId', 'vertical', 'zohoId', 'communicationStyle', 'decisionMakingStyle', 'hobbies', 'interests', 'personalGoals', 'professionalGoals', 'workAnniversary', 'buyerGroupRole', 'coresignalCompanyId', 'coresignalEmployeeId', 'decisionMakingPower', 'discoverySource', 'efficiencyFocus', 'seniorityScore', 'targetPriority', 'directDialPhone', 'mobilePhoneVerified', 'phone1', 'phone1Extension', 'phone1Type', 'phone1Verified', 'phone2', 'phone2Extension', 'phone2Type', 'phone2Verified', 'phoneDataQuality', 'phoneEnrichmentDate', 'phoneEnrichmentSource', 'workPhoneVerified', 'source', 'revenue', 'contractValue', 'currency', 'tier']
    );

    // Export clients table
    await exportTableToCSV('clients',
      () => prisma.clients.findMany(),
      ['id', 'workspaceId', 'accountId', 'customerSince', 'customerStatus', 'tier', 'segment', 'totalLifetimeValue', 'avgDealSize', 'dealCount', 'lastDealValue', 'annualRecurringRevenue', 'projectedAnnualValue', 'contactCount', 'activityCount', 'emailCount', 'meetingCount', 'callCount', 'lastEngagementDate', 'lastDealDate', 'healthScore', 'expansionProbability', 'churnRisk', 'loyaltyScore', 'engagementScore', 'avgDealCycle', 'preferredProducts', 'seasonalPatterns', 'communicationPreferences', 'buyingPatterns', 'growthTrend', 'retentionProbability', 'upsellPotential', 'crossSellOpportunities', 'nextBestAction', 'nextBestActionScore', 'nextBestActionDate', 'renewalDate', 'expansionOpportunity', 'onboardingDate', 'firstPurchaseDate', 'lastPurchaseDate', 'nextExpectedPurchase', 'contractEndDate', 'customerType', 'riskLevel', 'priority', 'tags', 'satisfactionScore', 'createdAt', 'updatedAt', 'deletedAt', 'assignedUserId']
    );

    // Export opportunities table
    await exportTableToCSV('opportunities',
      () => prisma.opportunities.findMany(),
      ['id', 'workspaceId', 'leadId', 'accountId', 'assignedUserId', 'name', 'description', 'amount', 'currency', 'probability', 'stage', 'priority', 'source', 'expectedCloseDate', 'actualCloseDate', 'notes', 'nextSteps', 'tags', 'customFields', 'riskScore', 'createdAt', 'updatedAt', 'deletedAt', 'buyingCommittee', 'competitionData', 'dealAnalysis', 'lastActivityDate', 'nextActivityDate', 'stageEntryDate', 'demoScenarioId', 'isDemoData', 'externalId', 'zohoId', 'accelerationOpportunities', 'champion', 'championCoalition', 'closePredictionConfidence', 'closePredictionReasoning', 'competitiveThreats', 'decisionCriteria', 'decisionProcess', 'economicBuyer', 'economicImpact', 'implementation', 'intelligence', 'lastPrecisionUpdate', 'nextActions', 'outcomePredict', 'painPriority', 'politicalMap', 'precisionData', 'precisionScore', 'predictedCloseDate', 'realityCheck', 'riskFactors', 'solutionFit', 'todayVsReality', 'urgencyFactors']
    );

    // Export workspaces table
    await exportTableToCSV('workspaces',
      () => prisma.workspaces.findMany(),
      ['id', 'name', 'slug', 'description', 'logo', 'website', 'industry', 'size', 'location', 'timezone', 'currency', 'language', 'settings', 'subscription', 'billing', 'features', 'limits', 'usage', 'status', 'createdAt', 'updatedAt', 'deletedAt', 'ownerId', 'plan', 'trialEndsAt', 'billingEmail', 'billingAddress', 'taxId', 'invoicePrefix', 'invoiceNumber', 'invoiceFooter', 'invoiceTerms', 'invoiceNotes', 'paymentMethod', 'paymentStatus', 'lastPaymentDate', 'nextPaymentDate', 'paymentAmount', 'paymentCurrency', 'paymentInterval', 'paymentRetries', 'paymentFailureReason', 'cancellationDate', 'cancellationReason', 'reactivationDate', 'reactivationReason', 'migrationDate', 'migrationSource', 'migrationStatus', 'migrationNotes', 'onboardingCompleted', 'onboardingDate', 'onboardingSteps', 'onboardingProgress', 'onboardingNotes', 'supportTier', 'supportContact', 'supportNotes', 'customFields', 'integrations', 'apiKeys', 'webhooks', 'notifications', 'alerts', 'reports', 'dashboards', 'permissions', 'roles', 'users', 'teams', 'departments', 'locations', 'timezones', 'currencies', 'languages', 'industries', 'sizes', 'statuses', 'priorities', 'sources', 'stages', 'types', 'categories', 'tags', 'fields', 'workflows', 'automations', 'templates', 'forms', 'campaigns', 'sequences', 'tasks', 'activities', 'events', 'meetings', 'calls', 'emails', 'messages', 'documents', 'files', 'attachments', 'notes', 'comments', 'reviews', 'ratings', 'feedback', 'surveys', 'polls', 'quizzes', 'assessments', 'certifications', 'training', 'education', 'skills', 'competencies', 'goals', 'objectives', 'kpis', 'metrics', 'analytics', 'insights', 'recommendations', 'suggestions', 'tips', 'bestPractices', 'caseStudies', 'successStories', 'testimonials', 'reviews', 'ratings', 'feedback', 'surveys', 'polls', 'quizzes', 'assessments', 'certifications', 'training', 'education', 'skills', 'competencies', 'goals', 'objectives', 'kpis', 'metrics', 'analytics', 'insights', 'recommendations', 'suggestions', 'tips', 'bestPractices', 'caseStudies', 'successStories', 'testimonials']
    );

    // Export users table
    await exportTableToCSV('users',
      () => prisma.users.findMany(),
      ['id', 'email', 'firstName', 'lastName', 'fullName', 'avatar', 'role', 'permissions', 'settings', 'preferences', 'notifications', 'alerts', 'reports', 'dashboards', 'lastLogin', 'lastActivity', 'loginCount', 'sessionCount', 'ipAddress', 'userAgent', 'location', 'timezone', 'language', 'currency', 'status', 'verified', 'verificationToken', 'verificationDate', 'passwordResetToken', 'passwordResetExpires', 'passwordResetDate', 'twoFactorEnabled', 'twoFactorSecret', 'twoFactorBackupCodes', 'apiKey', 'apiSecret', 'webhookUrl', 'webhookSecret', 'createdAt', 'updatedAt', 'deletedAt', 'workspaceId', 'activeWorkspaceId', 'invitationToken', 'invitationExpires', 'invitationDate', 'invitationAccepted', 'invitationAcceptedDate', 'invitationAcceptedBy', 'invitationAcceptedIp', 'invitationAcceptedUserAgent', 'invitationAcceptedLocation', 'invitationAcceptedTimezone', 'invitationAcceptedLanguage', 'invitationAcceptedCurrency', 'invitationAcceptedStatus', 'invitationAcceptedVerified', 'invitationAcceptedVerificationToken', 'invitationAcceptedVerificationDate', 'invitationAcceptedPasswordResetToken', 'invitationAcceptedPasswordResetExpires', 'invitationAcceptedPasswordResetDate', 'invitationAcceptedTwoFactorEnabled', 'invitationAcceptedTwoFactorSecret', 'invitationAcceptedTwoFactorBackupCodes', 'invitationAcceptedApiKey', 'invitationAcceptedApiSecret', 'invitationAcceptedWebhookUrl', 'invitationAcceptedWebhookSecret']
    );

    console.log('✅ Data backup completed successfully!');
    console.log(`📁 Backup location: ${backupDir}`);
    
  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the backup
backupAllData().catch(console.error);
