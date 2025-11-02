import React, { useState, useEffect } from 'react';
import { Loader } from '@/platform/ui/components/Loader';
import { InlineEditField } from '@/frontend/components/pipeline/InlineEditField';
import { SuccessMessage } from '@/platform/ui/components/SuccessMessage';
import { useInlineEdit } from '@/platform/hooks/useInlineEdit';

export interface Partner {
  id: string;
  name: string;
  type: string;
  industry: string;
  partnershipType: string;
  status: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  address: string;
  city: string;
  state: string;
  country: string;
  revenue: string;
  employees: number;
  notes: string;
  lastContact: string;
  nextAction: string;
  lastContactDate: string;
  nextActionDate: string;
}

interface PartnerDetailsProps {
  partner: Partner;
  onBack: () => void;
  hideHeader?: boolean;
  onEditPartner?: (partner: Partner) => void;
  onDeletePartner?: (partner: Partner) => void;
}

export const PartnerDetails: React.FC<PartnerDetailsProps> = ({
  partner,
  onBack,
  hideHeader = false,
  onEditPartner,
  onDeletePartner,
}) => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [isLoading, setIsLoading] = useState(false);
  
  // Use universal inline edit hook
  const {
    showSuccessMessage,
    successMessage,
    messageType,
    handleEditSave,
    closeMessage,
  } = useInlineEdit();

  const tabs = ['Overview', 'Engagement', 'Opportunities', 'Activity'];

  const formatRelativeDate = (dateString: string) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  // Handle inline editing with universal hook
  const handleFieldEdit = async (field: string, value: string) => {
    const success = await handleEditSave('partner', partner.id, field, value);
    if (success) {
      // Update local state - this would need to be handled by parent component
      // For now, we'll just show the success message
    }
  };

  return (
    <div className="p-4">
      {/* Success Message */}
      <SuccessMessage
        message={successMessage}
        isVisible={showSuccessMessage}
        onClose={closeMessage}
        type={messageType}
      />
      <div className="w-full px-0">
        {!hideHeader && (
          <div className="flex items-center justify-between mt-2 mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="text-muted hover:text-foreground transition-colors"
              >
                ← Back
              </button>
              <h1 className="text-3xl font-bold text-foreground">
                Partner Detail
              </h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onEditPartner?.(partner)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit Partner
              </button>
              <button
                onClick={() => onDeletePartner?.(partner)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <Loader 
            type="skeleton" 
            size="md"
            message="Loading partner details..."
            className="bg-background"
          />
        )}

        {/* Content - only show when not loading */}
        {!isLoading && (
          <>
            {/* Tabs */}
            <div
              className="flex gap-2 mb-0 pb-2 border-b border-border"
              style={{
                borderColor: "var(--border)",
                marginTop: "-18px",
                borderBottomWidth: "1px",
              }}
            >
              {tabs.map((tab) => (
                <button
                  key={tab}
                  className={`px-5 py-2 text-base font-semibold rounded-t-lg transition-colors focus:outline-none
                    ${
                      activeTab === tab
                        ? "bg-background border-x border-t border-border text-foreground z-10"
                        : "text-[var(--muted,#888)] hover:text-primary border border-transparent"
                    }
                  `}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="bg-background rounded-b-xl border-b border-border shadow-sm pt-0 px-6 pb-6 w-full min-h-[400px] -mt-2">
              <div className="pt-6">
                {activeTab === "Overview" && (
                  <>
                    {/* At a Glance */}
                    <div className="mb-8">
                      <h2 className="text-xl font-semibold text-foreground mb-4">
                        At a Glance
                      </h2>
                      <div className="flex flex-wrap gap-4">
                        <div className="bg-background border border-border rounded-lg p-4 min-w-[180px]">
                          <div className="font-semibold text-muted mb-1">
                            Partnership Type
                          </div>
                          <div className="text-lg text-foreground">
                            {partner.partnershipType}
                          </div>
                        </div>
                        <div className="bg-background border border-border rounded-lg p-4 min-w-[180px]">
                          <div className="font-semibold text-muted mb-1">
                            Status
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              partner['status'] === "Active"
                                ? "bg-[#10b981] text-white"
                                : partner['status'] === "Prospect"
                                  ? "bg-[#2563EB] text-white"
                                  : "bg-[#6b7280] text-white"
                            }`}
                          >
                            {partner.status}
                          </span>
                        </div>
                        <div className="bg-background border border-border rounded-lg p-4 min-w-[180px]">
                          <div className="font-semibold text-muted mb-1">
                            Industry
                          </div>
                          <div className="text-lg text-foreground">
                            {partner.industry}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Main info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h2 className="text-xl font-semibold text-foreground mb-4">
                          Partner Information
                        </h2>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-muted">
                              Partner Name
                            </label>
                            <p className="mt-1 text-lg text-foreground">
                              {partner.name}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-muted">
                              Partnership Type
                            </label>
                            <p className="mt-1 text-lg text-foreground">
                              {partner.partnershipType}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-muted">
                              Website
                            </label>
                            <p className="mt-1 text-lg text-foreground">
                              {partner.website || 'No website provided'}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-muted">
                              Location
                            </label>
                            <p className="mt-1 text-lg text-foreground">
                              {partner.city}, {partner.state}, {partner.country}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h2 className="text-xl font-semibold text-foreground mb-4">
                          Contact Information
                        </h2>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-muted">
                              Contact Person
                            </label>
                            <p className="mt-1 text-lg text-foreground">
                              {partner.contactPerson}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-muted">
                              Email
                            </label>
                            <p className="mt-1 text-lg text-foreground">
                              {partner.contactEmail}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-muted">
                              Phone
                            </label>
                            <p className="mt-1 text-lg text-foreground">
                              {partner.contactPhone}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8">
                      <h2 className="text-xl font-semibold text-foreground mb-4">
                        Notes
                      </h2>
                      <div className="bg-background border border-border rounded-lg p-4">
                        <p className="text-foreground">
                          {partner.notes || "No notes available for this partner."}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === "Engagement" && (
                  <>
                    <h2 className="text-xl font-semibold text-foreground mb-4">
                      Engagement
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-muted">
                          Last Contact
                        </label>
                        <p className="mt-1 text-lg text-foreground">
                          {partner.lastContact}
                        </p>
                        <p className="text-sm text-muted">
                          {formatRelativeDate(partner.lastContactDate)}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-muted">
                          Next Action
                        </label>
                        <p className="mt-1 text-lg text-foreground">
                          {partner.nextAction}
                        </p>
                        <p className="text-sm text-muted">
                          {formatRelativeDate(partner.nextActionDate)}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === "Opportunities" && (
                  <>
                    <h2 className="text-xl font-semibold text-foreground mb-4">
                      Joint Opportunities
                    </h2>
                    <div className="bg-background border border-border rounded-lg p-4">
                      <p className="text-muted">No joint opportunities found with this partner.</p>
                    </div>
                  </>
                )}

                {activeTab === "Activity" && (
                  <>
                    <h2 className="text-xl font-semibold text-foreground mb-4">
                      Activity Summary
                    </h2>
                    <div className="grid grid-cols-3 gap-6 mb-6">
                      <div className="bg-background border border-border rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-foreground">
                          0
                        </div>
                        <div className="text-sm text-muted">
                          Joint Deals
                        </div>
                      </div>
                      <div className="bg-background border border-border rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-foreground">
                          0
                        </div>
                        <div className="text-sm text-muted">Meetings</div>
                      </div>
                      <div className="bg-background border border-border rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-foreground">
                          0
                        </div>
                        <div className="text-sm text-muted">Emails</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}; 