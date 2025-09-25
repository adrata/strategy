"use client";

import React from 'react';
import { useRecordContext } from '@/platform/ui/context/RecordContextProvider';
import { CompanyDetailSkeleton } from '@/platform/ui/components/Loader';
import { InlineEditField } from '../InlineEditField';

interface UniversalRoleTabProps {
  recordType: string;
  record?: any;
  onSave?: (field: string, value: any, recordId: string) => Promise<void>;
}

export function UniversalRoleTab({ recordType, record: recordProp, onSave }: UniversalRoleTabProps) {
  const { currentRecord: contextRecord } = useRecordContext();
  const record = recordProp || contextRecord;

  // Show skeleton loader while data is loading
  if (!record) {
    return <CompanyDetailSkeleton message="Loading role information..." />;
  }

  // Debug: Log the record structure to see what's available
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 [Role Tab Debug] Record structure:', {
      record: record,
      customFields: record?.customFields,
      buyerGroupRole: record?.customFields?.buyerGroupRole,
      influenceLevel: record?.customFields?.influenceLevel
    });
  }

  // Handle inline field save
  const handleInlineSave = async (field: string, value: any) => {
    if (onSave) {
      await onSave(field, value, record.id);
    }
  };

  // Extract role-related data
  const roleData = {
    jobTitle: record.jobTitle || record.title || 'Unknown Title',
    department: record.department || 'Unknown Department',
    seniority: record.seniority || 'Unknown',
    buyerGroupRole: record?.buyerGroupRole || record?.customFields?.buyerGroupRole || record?.customFields?.enrichedData?.overview?.buyerGroupRole || 'Stakeholder',
    influenceLevel: record?.customFields?.influenceLevel || record?.customFields?.enrichedData?.overview?.influenceLevel || record?.influenceLevel || 'Medium',
    engagementPriority: record?.customFields?.engagementPriority || record?.customFields?.enrichedData?.overview?.engagementPriority || record?.engagementPriority || 'Medium',
    decisionMakingAuthority: record?.customFields?.decisionMakingAuthority || record?.decisionMakingAuthority || 'Unknown',
    budgetAuthority: record?.customFields?.budgetAuthority || record?.budgetAuthority || 'Unknown',
    technicalInfluence: record?.customFields?.technicalInfluence || record?.technicalInfluence || 'Unknown',
    procurementRole: record?.customFields?.procurementRole || record?.procurementRole || 'Unknown',
    reportingStructure: record?.customFields?.reportingStructure || record?.reportingStructure || 'Unknown',
    teamSize: record?.customFields?.teamSize || record?.teamSize || 'Unknown',
    yearsInRole: record?.customFields?.yearsInRole || record?.yearsInRole || 'Unknown',
    yearsAtCompany: record?.customFields?.yearsAtCompany || record?.yearsAtCompany || 'Unknown'
  };

  // Generate dynamic role summary
  const generateRoleSummary = () => {
    const jobTitle = roleData.jobTitle.toLowerCase();
    const department = roleData.department.toLowerCase();
    const seniority = roleData.seniority.toLowerCase();
    const buyerGroupRole = roleData.buyerGroupRole.toLowerCase();
    const influenceLevel = roleData.influenceLevel.toLowerCase();
    
    // Generate contextual summary based on role data
    if (jobTitle.includes('ceo') || jobTitle.includes('chief executive')) {
      return 'Strategic CEO with executive leadership';
    } else if (jobTitle.includes('cro') || jobTitle.includes('chief revenue')) {
      return 'New CRO with deep industry experience';
    } else if (jobTitle.includes('cto') || jobTitle.includes('chief technology')) {
      return 'Technical CTO driving innovation strategy';
    } else if (jobTitle.includes('cfo') || jobTitle.includes('chief financial')) {
      return 'Financial CFO with strategic oversight';
    } else if (jobTitle.includes('vp') || jobTitle.includes('vice president')) {
      return 'Senior VP with operational expertise';
    } else if (jobTitle.includes('director')) {
      return 'Director with team leadership experience';
    } else if (jobTitle.includes('manager')) {
      return 'Manager with tactical execution focus';
    } else if (buyerGroupRole.includes('decision maker')) {
      return 'Decision maker with high influence';
    } else if (buyerGroupRole.includes('champion')) {
      return 'Internal champion driving change';
    } else if (seniority.includes('senior') || seniority.includes('sr')) {
      return 'Senior professional with deep expertise';
    } else if (seniority.includes('junior') || seniority.includes('jr')) {
      return 'Junior professional with growth potential';
    } else if (department.includes('sales')) {
      return 'Sales professional with revenue focus';
    } else if (department.includes('marketing')) {
      return 'Marketing professional with brand expertise';
    } else if (department.includes('engineering') || department.includes('technology')) {
      return 'Technical professional with solution expertise';
    } else if (department.includes('finance')) {
      return 'Finance professional with analytical skills';
    } else if (department.includes('hr') || department.includes('human resources')) {
      return 'HR professional with people expertise';
    } else {
      return 'Professional with specialized expertise';
    }
  };

  return (
    <div className="space-y-8">
      {/* Role Summary */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Role Summary</h3>
        <div>
          <div className="block text-sm font-medium text-gray-600 mb-2">Professional Summary</div>
          <div className="text-lg font-semibold text-blue-600 mb-3">{generateRoleSummary()}</div>
          <div className="block text-sm font-medium text-gray-600 mb-2">Current Position</div>
          <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap font-medium">
            {roleData.jobTitle} in {roleData.department} with {roleData.seniority} seniority level. 
            Acts as a {roleData.buyerGroupRole} with {roleData.influenceLevel.toLowerCase()} influence in decision-making processes.
          </div>
        </div>
      </div>

      {/* Role Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Role Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Job Title</label>
            <InlineEditField
              value={roleData.jobTitle}
              field="jobTitle"
              recordId={record.id}
              recordType="universal"
              placeholder="Enter job title"
              onSave={handleInlineSave}
              className="text-sm text-gray-800 font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Department</label>
            <InlineEditField
              value={roleData.department}
              field="department"
              recordId={record.id}
              recordType="universal"
              placeholder="Enter department"
              onSave={handleInlineSave}
              className="text-sm text-gray-800 font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Seniority Level</label>
            <InlineEditField
              value={roleData.seniority}
              field="seniority"
              recordId={record.id}
              recordType="universal"
              placeholder="Enter seniority level"
              onSave={handleInlineSave}
              className="text-sm text-gray-800 font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Buyer Group Role</label>
            <InlineEditField
              value={roleData.buyerGroupRole}
              field="buyerGroupRole"
              recordId={record.id}
              recordType="universal"
              placeholder="Enter buyer group role"
              onSave={handleInlineSave}
              className="text-sm text-gray-800 font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Influence Level</label>
            <InlineEditField
              value={roleData.influenceLevel}
              field="influenceLevel"
              recordId={record.id}
              recordType="universal"
              placeholder="Enter influence level"
              onSave={handleInlineSave}
              className="text-sm text-gray-800 font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Engagement Priority</label>
            <InlineEditField
              value={roleData.engagementPriority}
              field="engagementPriority"
              recordId={record.id}
              recordType="universal"
              placeholder="Enter engagement priority"
              onSave={handleInlineSave}
              className="text-sm text-gray-800 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Authority & Decision Making */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Authority & Decision Making</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Decision Making Authority</label>
            <InlineEditField
              value={roleData.decisionMakingAuthority}
              field="decisionMakingAuthority"
              recordId={record.id}
              recordType="universal"
              placeholder="Enter decision making authority"
              onSave={handleInlineSave}
              className="text-sm text-gray-800 font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Budget Authority</label>
            <InlineEditField
              value={roleData.budgetAuthority}
              field="budgetAuthority"
              recordId={record.id}
              recordType="universal"
              placeholder="Enter budget authority"
              onSave={handleInlineSave}
              className="text-sm text-gray-800 font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Technical Influence</label>
            <InlineEditField
              value={roleData.technicalInfluence}
              field="technicalInfluence"
              recordId={record.id}
              recordType="universal"
              placeholder="Enter technical influence"
              onSave={handleInlineSave}
              className="text-sm text-gray-800 font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Procurement Role</label>
            <InlineEditField
              value={roleData.procurementRole}
              field="procurementRole"
              recordId={record.id}
              recordType="universal"
              placeholder="Enter procurement role"
              onSave={handleInlineSave}
              className="text-sm text-gray-800 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Organizational Context */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Organizational Context</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Reporting Structure</label>
            <InlineEditField
              value={roleData.reportingStructure}
              field="reportingStructure"
              recordId={record.id}
              recordType="universal"
              placeholder="Enter reporting structure"
              onSave={handleInlineSave}
              className="text-sm text-gray-800 font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Team Size</label>
            <InlineEditField
              value={roleData.teamSize}
              field="teamSize"
              recordId={record.id}
              recordType="universal"
              placeholder="Enter team size"
              onSave={handleInlineSave}
              className="text-sm text-gray-800 font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Years in Role</label>
            <InlineEditField
              value={roleData.yearsInRole}
              field="yearsInRole"
              recordId={record.id}
              recordType="universal"
              placeholder="Enter years in role"
              onSave={handleInlineSave}
              className="text-sm text-gray-800 font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Years at Company</label>
            <InlineEditField
              value={roleData.yearsAtCompany}
              field="yearsAtCompany"
              recordId={record.id}
              recordType="universal"
              placeholder="Enter years at company"
              onSave={handleInlineSave}
              className="text-sm text-gray-800 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Role Insights */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Role Insights</h3>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-blue-800 font-medium mb-2">Key Insights</h4>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• {roleData.buyerGroupRole} with {roleData.influenceLevel.toLowerCase()} influence level</li>
            <li>• {roleData.decisionMakingAuthority} decision-making authority</li>
            <li>• {roleData.budgetAuthority} budget authority</li>
            <li>• {roleData.technicalInfluence} technical influence in procurement</li>
            <li>• {roleData.engagementPriority} priority for engagement</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
