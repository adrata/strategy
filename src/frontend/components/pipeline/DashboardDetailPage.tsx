"use client";

import React, { useState, useEffect } from 'react';
import { authFetch } from '@/platform/api-fetch';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeftIcon, 
  PhoneIcon, 
  EnvelopeIcon, 
  CalendarDaysIcon, 
  ChartBarIcon, 
  CalendarIcon, 
  ClockIcon, 
  CurrencyDollarIcon,
  UserIcon,
  BuildingOfficeIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useUnifiedAuth } from '@/platform/auth';
import { useRevenueOS } from '@/platform/ui/context/RevenueOSProvider';
import { PanelLayout } from '@/platform/ui/components/layout/PanelLayout';
import { LeftPanel } from '@/products/pipeline/components/LeftPanel';
import { RightPanel } from '@/platform/ui/components/chat/RightPanel';
import { useZoom } from '@/platform/ui/components/ZoomProvider';

interface DashboardDetailPageProps {
  statType: 'calls' | 'emails' | 'meetings' | 'deals' | 'new-opportunities' | 'total-pipeline' | 'lead-conversion' | 'deals-closed' | 'weekly-revenue' | 'avg-deal-size' | 'pipeline-value-added' | 'sales-cycle' | 'top-performer' | 'team-calls' | 'team-meetings' | 'new-leads';
}

interface Activity {
  id: string;
  type: string;
  subject: string;
  createdAt: string;
  description?: string;
  contactName?: string;
  opportunityName?: string;
  status?: string;
  value?: number;
}

interface DealActivity {
  id: string;
  name: string;
  stage: string;
  value: number;
  createdAt: string;
  assignedUserId?: string;
  accountName?: string;
  contactName?: string;
}

export function DashboardDetailPage({ statType }: DashboardDetailPageProps) {
  const router = useRouter();
  const { user } = useUnifiedAuth();
  const { data: acquisitionData } = useRevenueOS();
  const { zoom } = useZoom();
  const [activities, setActivities] = useState<Activity[] | DealActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const workspaceId = acquisitionData?.auth?.authUser?.activeWorkspaceId || user?.activeWorkspaceId;
  const userId = user?.id;

  const statConfig = {
    calls: {
      title: 'Calls Made',
      icon: PhoneIcon,
      apiEndpoint: '/api/activities/calls',
      emptyMessage: 'No calls made this week',
      emptyDescription: 'Start making calls to engage with your prospects and move deals forward.',
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200'
    },
    emails: {
      title: 'Emails Sent',
      icon: EnvelopeIcon,
      apiEndpoint: '/api/activities/emails',
      emptyMessage: 'No emails sent this week',
      emptyDescription: 'Send personalized emails to nurture relationships and drive engagement.',
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200'
    },
    meetings: {
      title: 'Meetings Scheduled',
      icon: CalendarDaysIcon,
      apiEndpoint: '/api/activities/meetings',
      emptyMessage: 'No meetings scheduled this week',
      emptyDescription: 'Schedule meetings to have deeper conversations with prospects.',
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-200'
    },
    deals: {
      title: 'Opportunities Advanced',
      icon: ChartBarIcon,
      apiEndpoint: '/api/opportunities/advanced',
      emptyMessage: 'No deals advanced this week',
      emptyDescription: 'Focus on moving opportunities through your sales pipeline.',
      color: 'orange',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      borderColor: 'border-orange-200'
    },
    'new-opportunities': {
      title: 'New Clients',
      icon: ArrowTrendingUpIcon,
      apiEndpoint: '/api/opportunities/new',
      emptyMessage: 'No new opportunities this week',
      emptyDescription: 'Focus on converting leads into opportunities to grow your pipeline.',
      color: 'emerald',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      borderColor: 'border-emerald-200'
    },
    'total-pipeline': {
      title: 'Total Pipeline',
      icon: CurrencyDollarIcon,
      apiEndpoint: '/api/opportunities/pipeline',
      emptyMessage: 'No pipeline data available',
      emptyDescription: 'Your pipeline will appear here as you create and manage opportunities.',
      color: 'indigo',
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      borderColor: 'border-indigo-200'
    },
    'lead-conversion': {
      title: 'Lead Conversion',
      icon: CheckCircleIcon,
      apiEndpoint: '/api/leads/converted',
      emptyMessage: 'No lead conversions this week',
      emptyDescription: 'Track how many leads are converting to opportunities.',
      color: 'teal',
      bgColor: 'bg-teal-50',
      iconColor: 'text-teal-600',
      borderColor: 'border-teal-200'
    },
    'deals-closed': {
      title: 'Opportunities Closed',
      icon: CheckCircleIcon,
      apiEndpoint: '/api/opportunities/closed',
      emptyMessage: 'No deals closed this week',
      emptyDescription: 'Celebrate your wins! Closed deals will appear here.',
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200'
    },
    'weekly-revenue': {
      title: 'Weekly Revenue',
      icon: CurrencyDollarIcon,
      apiEndpoint: '/api/revenue/weekly',
      emptyMessage: 'No revenue this week',
      emptyDescription: 'Revenue from closed deals will be tracked here.',
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      borderColor: 'border-yellow-200'
    },
    'avg-deal-size': {
      title: 'Average Deal Size',
      icon: CurrencyDollarIcon,
      apiEndpoint: '/api/opportunities/avg-deal-size',
      emptyMessage: 'No deal size data available',
      emptyDescription: 'Average deal size will be calculated from your opportunities.',
      color: 'amber',
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-600',
      borderColor: 'border-amber-200'
    },
    'pipeline-value-added': {
      title: 'Pipeline Value Added',
      icon: ArrowTrendingUpIcon,
      apiEndpoint: '/api/opportunities/value-added',
      emptyMessage: 'No pipeline value added this week',
      emptyDescription: 'Track the value added to your pipeline this week.',
      color: 'cyan',
      bgColor: 'bg-cyan-50',
      iconColor: 'text-cyan-600',
      borderColor: 'border-cyan-200'
    },
    'sales-cycle': {
      title: 'Sales Cycle',
      icon: ClockIcon,
      apiEndpoint: '/api/opportunities/sales-cycle',
      emptyMessage: 'No sales cycle data available',
      emptyDescription: 'Average sales cycle length will be calculated from closed deals.',
      color: 'slate',
      bgColor: 'bg-slate-50',
      iconColor: 'text-slate-600',
      borderColor: 'border-slate-200'
    },
    'top-performer': {
      title: 'Top Performer',
      icon: UserIcon,
      apiEndpoint: '/api/team/top-performer',
      emptyMessage: 'No performance data available',
      emptyDescription: 'Team performance metrics will be displayed here.',
      color: 'rose',
      bgColor: 'bg-rose-50',
      iconColor: 'text-rose-600',
      borderColor: 'border-rose-200'
    },
    'team-calls': {
      title: 'Team Calls',
      icon: PhoneIcon,
      apiEndpoint: '/api/activities/team-calls',
      emptyMessage: 'No team calls this week',
      emptyDescription: 'Track all calls made by your team this week.',
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200'
    },
    'team-meetings': {
      title: 'Team Meetings',
      icon: CalendarDaysIcon,
      apiEndpoint: '/api/activities/team-meetings',
      emptyMessage: 'No team meetings this week',
      emptyDescription: 'Track all meetings scheduled by your team this week.',
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-200'
    },
    'new-leads': {
      title: 'New Leads',
      icon: UserIcon,
      apiEndpoint: '/api/leads/new',
      emptyMessage: 'No new leads this week',
      emptyDescription: 'New leads generated this week will appear here.',
      color: 'emerald',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      borderColor: 'border-emerald-200'
    }
  };

  const config = statConfig[statType];

  useEffect(() => {
    const loadActivities = async () => {
      try {
        if (!workspaceId || !userId) {
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);

        // Use the unified dashboard API instead of individual endpoints
        const response = await authFetch(`/api/pipeline/dashboard`);
        const data = await response.json();

        if (data.success) {
          // Extract relevant data based on statType
          const dashboardData = data.data;
          let extractedActivities: Activity[] = [];
          
          switch (statType) {
            case 'calls':
              extractedActivities = [{
                id: '1',
                type: 'call',
                subject: `Calls Made: ${dashboardData.callsMade}`,
                createdAt: new Date().toISOString(),
                description: `Total calls made this week: ${dashboardData.callsMade}`
              }];
              break;
            case 'emails':
              extractedActivities = [{
                id: '1',
                type: 'email',
                subject: `Emails Sent: ${dashboardData.emailsSent}`,
                createdAt: new Date().toISOString(),
                description: `Total emails sent this week: ${dashboardData.emailsSent}`
              }];
              break;
            case 'meetings':
              extractedActivities = [{
                id: '1',
                type: 'meeting',
                subject: `Meetings Scheduled: ${dashboardData.meetingsScheduled}`,
                createdAt: new Date().toISOString(),
                description: `Total meetings scheduled this week: ${dashboardData.meetingsScheduled}`
              }];
              break;
            case 'deals':
            case 'new-opportunities':
              extractedActivities = [{
                id: '1',
                type: 'opportunity',
                subject: `New Clients: ${dashboardData.newOpportunities}`,
                createdAt: new Date().toISOString(),
                description: `New opportunities created this week: ${dashboardData.newOpportunities}`
              }];
              break;
            case 'deals-closed':
              extractedActivities = [{
                id: '1',
                type: 'deal',
                subject: `Deals Closed: ${dashboardData.closedWonDeals}`,
                createdAt: new Date().toISOString(),
                description: `Deals closed this week: ${dashboardData.closedWonDeals}`
              }];
              break;
            case 'total-pipeline':
              extractedActivities = [{
                id: '1',
                type: 'pipeline',
                subject: `Total Pipeline: $${dashboardData.totalPipelineValue}M`,
                createdAt: new Date().toISOString(),
                description: `Total pipeline value: $${dashboardData.totalPipelineValue}M`
              }];
              break;
            case 'weekly-revenue':
              extractedActivities = [{
                id: '1',
                type: 'revenue',
                subject: `Weekly Revenue: $${dashboardData.weeklyRevenue}`,
                createdAt: new Date().toISOString(),
                description: `Revenue generated this week: $${dashboardData.weeklyRevenue}`
              }];
              break;
            case 'avg-deal-size':
              extractedActivities = [{
                id: '1',
                type: 'deal',
                subject: `Avg Deal Size: $${dashboardData.avgDealSizeThisWeek}`,
                createdAt: new Date().toISOString(),
                description: `Average deal size this week: $${dashboardData.avgDealSizeThisWeek}`
              }];
              break;
            case 'sales-cycle':
              extractedActivities = [{
                id: '1',
                type: 'cycle',
                subject: `Sales Cycle: ${dashboardData.avgSalesCycleLength} days`,
                createdAt: new Date().toISOString(),
                description: `Average sales cycle: ${dashboardData.avgSalesCycleLength} days`
              }];
              break;
            case 'top-performer':
              extractedActivities = [{
                id: '1',
                type: 'performance',
                subject: `Top Performer: ${dashboardData.topPerformer}`,
                createdAt: new Date().toISOString(),
                description: `Top performer this week: ${dashboardData.topPerformer}`
              }];
              break;
            case 'team-calls':
              extractedActivities = [{
                id: '1',
                type: 'call',
                subject: `Team Calls: ${dashboardData.teamCallsTotal}`,
                createdAt: new Date().toISOString(),
                description: `Total team calls this week: ${dashboardData.teamCallsTotal}`
              }];
              break;
            case 'team-meetings':
              extractedActivities = [{
                id: '1',
                type: 'meeting',
                subject: `Team Meetings: ${dashboardData.teamMeetingsTotal}`,
                createdAt: new Date().toISOString(),
                description: `Total team meetings this week: ${dashboardData.teamMeetingsTotal}`
              }];
              break;
            case 'new-leads':
              extractedActivities = [{
                id: '1',
                type: 'lead',
                subject: `New Leads: ${dashboardData.newLeadsGenerated}`,
                createdAt: new Date().toISOString(),
                description: `New leads generated this week: ${dashboardData.newLeadsGenerated}`
              }];
              break;
            default:
              extractedActivities = [];
          }
          
          setActivities(extractedActivities);
        } else {
          setError(data.error || 'Failed to load activities');
        }
      } catch (err) {
        console.error(`Error loading ${statType} activities:`, err);
        setError('Failed to load activities');
      } finally {
        setLoading(false);
      }
    };

    loadActivities();
  }, [workspaceId, userId, statType]);

  const handleBack = () => {
    router.push('../dashboard');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const renderActivityItem = (activity: Activity | DealActivity, index: number) => {
    const Icon = config.icon;
    
    if (statType === 'deals' || statType === 'total-pipeline' || statType === 'deals-closed' || statType === 'avg-deal-size' || statType === 'pipeline-value-added') {
      const deal = activity as DealActivity;
      return (
        <div key={deal.id} className={`group p-6 rounded-xl border ${config.borderColor} bg-background hover:shadow-md transition-all duration-200 hover:scale-[1.02]`}>
          <div className="flex items-start space-x-4">
            <div className={`flex-shrink-0 w-12 h-12 ${config.bgColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
              <Icon className={`w-6 h-6 ${config.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-gray-700 transition-colors">
                    {deal.name}
                  </h3>
                  <div className="mt-2 flex items-center space-x-4 text-sm text-muted">
                    <span className="flex items-center space-x-1">
                      <CalendarIcon className="w-4 h-4" />
                      <span>{formatDate(deal.createdAt)}</span>
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-hover text-gray-800`}>
                      {deal.stage}
                    </span>
                  </div>
                  {(deal.accountName || deal.contactName) && (
                    <div className="mt-2 flex items-center space-x-4 text-sm text-muted">
                      {deal['accountName'] && (
                        <span className="flex items-center space-x-1">
                          <BuildingOfficeIcon className="w-4 h-4" />
                          <span>{deal.accountName}</span>
                        </span>
                      )}
                      {deal['contactName'] && (
                        <span className="flex items-center space-x-1">
                          <UserIcon className="w-4 h-4" />
                          <span>{deal.contactName}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="ml-4 text-right">
                  <div className="text-xl font-bold text-foreground">
                    {formatCurrency(deal.value)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      const act = activity as Activity;
      return (
        <div key={act.id} className={`group p-6 rounded-xl border ${config.borderColor} bg-background hover:shadow-md transition-all duration-200 hover:scale-[1.02]`}>
          <div className="flex items-start space-x-4">
            <div className={`flex-shrink-0 w-12 h-12 ${config.bgColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
              <Icon className={`w-6 h-6 ${config.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-foreground group-hover:text-gray-700 transition-colors">
                {act.subject || `${config.title} Activity`}
              </h3>
              <div className="mt-2 flex items-center space-x-4 text-sm text-muted">
                <span className="flex items-center space-x-1">
                  <CalendarIcon className="w-4 h-4" />
                  <span>{formatDate(act.createdAt)}</span>
                </span>
                {act['status'] && (
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    act['status'] === 'completed' ? 'bg-green-100 text-green-800' :
                    act['status'] === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-hover text-gray-800'
                  }`}>
                    {act.status}
                  </span>
                )}
              </div>
              {(act.contactName || act.opportunityName) && (
                <div className="mt-2 flex items-center space-x-4 text-sm text-muted">
                  {act['contactName'] && (
                    <span className="flex items-center space-x-1">
                      <UserIcon className="w-4 h-4" />
                      <span>{act.contactName}</span>
                    </span>
                  )}
                  {act['opportunityName'] && (
                    <span className="flex items-center space-x-1">
                      <ChartBarIcon className="w-4 h-4" />
                      <span>{act.opportunityName}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <PanelLayout
      thinLeftPanel={null}
      leftPanel={
        <LeftPanel 
          activeSection="dashboard"
          onSectionChange={() => {}}
          isSpeedrunVisible={true}
          setIsSpeedrunVisible={() => {}}
          isOpportunitiesVisible={true}
          setIsOpportunitiesVisible={() => {}}
        />
      }
      middlePanel={
        <div className="h-full bg-panel-background">
          {/* Modern Header */}
          <div className="bg-background border-b border-border">
            <div className="px-8 py-6">
              <div className="flex items-center space-x-4 mb-6">
                <button
                  onClick={handleBack}
                  className="flex items-center space-x-2 text-muted hover:text-foreground transition-colors group"
                >
                  <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                  <span className="text-sm font-medium">Back to Dashboard</span>
                </button>
              </div>
              <div className="flex items-center space-x-4">
                <div className={`w-16 h-16 ${config.bgColor} rounded-2xl flex items-center justify-center`}>
                  <config.icon className={`w-8 h-8 ${config.iconColor}`} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">{config.title}</h1>
                  <p className="text-muted mt-1">
                    {statType === 'deals' || statType === 'total-pipeline' || statType === 'deals-closed' || statType === 'avg-deal-size' || statType === 'pipeline-value-added' 
                      ? 'Opportunities and deals from the last week' 
                      : 'Activities from the last week'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-muted mt-4">Loading {config.title.toLowerCase()}...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center max-w-md">
                  <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Error Loading Data</h3>
                  <p className="text-muted">{error}</p>
                </div>
              </div>
            ) : activities['length'] === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center max-w-md">
                  <div className={`w-16 h-16 ${config.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                    <config.icon className={`w-8 h-8 ${config.iconColor}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{config.emptyMessage}</h3>
                  <p className="text-muted">{config.emptyDescription}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-foreground">
                    {activities.length} {activities['length'] === 1 ? 'Item' : 'Items'}
                  </h2>
                </div>
                <div className="grid gap-4">
                  {activities.map((activity, index) => renderActivityItem(activity, index))}
                </div>
              </div>
            )}
          </div>
        </div>
      }
      rightPanel={<RightPanel />}
      zoom={zoom}
      isLeftPanelVisible={true}
      isRightPanelVisible={true}
      onToggleLeftPanel={() => {}}
      onToggleRightPanel={() => {}}
    />
  );
}