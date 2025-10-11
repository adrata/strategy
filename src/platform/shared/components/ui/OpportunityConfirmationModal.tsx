import React, { useState } from "react";

interface OpportunityData {
  name: string;
  description: string;
  amount: number;
  expectedCloseDate: string;
  stage: string;
  probability: number;
  productCategory: string;
  useCase: string;
  nextBestAction: string;
  actionPriority: string;
  reasoning?: string;
  recommendedActions?: string[];
}

interface OpportunityConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (opportunityData: OpportunityData) => void;
  initialData: OpportunityData;
  aiInsights?: {
    confidence: number;
    reasoning: string;
    recommendedActions: string[];
  };
}

export const OpportunityConfirmationModal: React.FC<
  OpportunityConfirmationModalProps
> = ({ isOpen, onClose, onConfirm, initialData, aiInsights }) => {
  const [opportunityData, setOpportunityData] =
    useState<OpportunityData>(initialData);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const handleFieldChange = (field: keyof OpportunityData, value: any) => {
    setOpportunityData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleConfirm = async () => {
    setIsCreating(true);
    await onConfirm(opportunityData);
    setIsCreating(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600 bg-green-100";
    if (confidence >= 0.6) return "text-blue-600 bg-blue-100";
    if (confidence >= 0.4) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "bg-red-500 text-white";
      case "High":
        return "bg-orange-500 text-white";
      case "Medium":
        return "bg-blue-500 text-white";
      case "Low":
        return "bg-[var(--panel-background)]0 text-white";
      default:
        return "bg-blue-500 text-white";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--background)] rounded-2xl shadow-2xl border border-[var(--border)] w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-[var(--background)] bg-opacity-20 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  AI-Generated Opportunity
                </h2>
                <p className="text-blue-100">
                  Review and customize before creating
                </p>
              </div>
            </div>
            {aiInsights && (
              <div
                className={`px-3 py-1 rounded-full text-sm font-semibold ${getConfidenceColor(aiInsights.confidence)}`}
              >
                {Math.round(aiInsights.confidence * 100)}% AI Confidence
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-[var(--border)]">
          <nav className="flex space-x-8 px-6">
            {["overview", "details", "insights"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 border-b-2 font-medium text-sm capitalize transition-colors ${
                  activeTab === tab
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-[var(--muted)] hover:text-gray-700 hover:border-[var(--border)]"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Opportunity Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opportunity Name
                </label>
                <input
                  type="text"
                  value={opportunityData.name}
                  onChange={(e) => handleFieldChange("name", e.target.value)}
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter opportunity name"
                />
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Deal Amount */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deal Amount
                  </label>
                  <input
                    type="number"
                    value={opportunityData.amount}
                    onChange={(e) =>
                      handleFieldChange("amount", parseInt(e.target.value) || 0)
                    }
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="0"
                  />
                  <p className="text-xs text-[var(--muted)] mt-1">
                    {formatCurrency(opportunityData.amount)}
                  </p>
                </div>

                {/* Expected Close Date */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Close Date
                  </label>
                  <input
                    type="date"
                    value={opportunityData.expectedCloseDate}
                    onChange={(e) =>
                      handleFieldChange("expectedCloseDate", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-[var(--muted)] mt-1">
                    {formatDate(opportunityData.expectedCloseDate)}
                  </p>
                </div>

                {/* Probability */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Win Probability
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={opportunityData.probability}
                      onChange={(e) =>
                        handleFieldChange(
                          "probability",
                          parseInt(e.target.value),
                        )
                      }
                      className="flex-1 h-2 bg-[var(--loading-bg)] rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-sm font-semibold text-purple-600">
                      {opportunityData.probability}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={opportunityData.description}
                  onChange={(e) =>
                    handleFieldChange("description", e.target.value)
                  }
                  rows={3}
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief description of the opportunity"
                />
              </div>
            </div>
          )}

          {activeTab === "details" && (
            <div className="space-y-6">
              {/* Sales Process Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Stage */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Stage
                  </label>
                  <select
                    value={opportunityData.stage}
                    onChange={(e) => handleFieldChange("stage", e.target.value)}
                    className="w-full px-4 py-3 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Discovery">Discovery</option>
                    <option value="Solution Validation">
                      Solution Validation
                    </option>
                    <option value="Stakeholder Alignment">
                      Stakeholder Alignment
                    </option>
                    <option value="Business Case Development">
                      Business Case Development
                    </option>
                    <option value="Technical Validation">
                      Technical Validation
                    </option>
                    <option value="Contract Negotiation">
                      Contract Negotiation
                    </option>
                  </select>
                </div>

                {/* Product Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Category
                  </label>
                  <input
                    type="text"
                    value={opportunityData.productCategory}
                    onChange={(e) =>
                      handleFieldChange("productCategory", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Pipeline Software, Sales Tools"
                  />
                </div>

                {/* Use Case */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Use Case
                  </label>
                  <input
                    type="text"
                    value={opportunityData.useCase}
                    onChange={(e) =>
                      handleFieldChange("useCase", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Sales Forecasting, Lead Management"
                  />
                </div>

                {/* Action Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Action Priority
                  </label>
                  <select
                    value={opportunityData.actionPriority}
                    onChange={(e) =>
                      handleFieldChange("actionPriority", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              {/* Next Best Action */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Next Best Action
                </label>
                <textarea
                  value={opportunityData.nextBestAction}
                  onChange={(e) =>
                    handleFieldChange("nextBestAction", e.target.value)
                  }
                  rows={2}
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="What should be done next to advance this opportunity?"
                />
              </div>
            </div>
          )}

          {activeTab === "insights" && aiInsights && (
            <div className="space-y-6">
              {/* AI Confidence */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                  AI Analysis
                </h3>
                <div className="flex items-center space-x-4 mb-4">
                  <div
                    className={`px-4 py-2 rounded-full font-semibold ${getConfidenceColor(aiInsights.confidence)}`}
                  >
                    {Math.round(aiInsights.confidence * 100)}% Confidence
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${getPriorityColor(opportunityData.actionPriority)}`}
                  >
                    {opportunityData.actionPriority} Priority
                  </div>
                </div>
                <p className="text-gray-700">{aiInsights.reasoning}</p>
              </div>

              {/* Recommended Actions */}
              <div>
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                  Recommended Actions
                </h3>
                <div className="space-y-3">
                  {aiInsights.recommendedActions.map((action, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-3 p-4 bg-[var(--panel-background)] rounded-lg"
                    >
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </div>
                      <p className="text-gray-700">{action}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Success Metrics */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-3">
                  Success Indicators
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <svg
                      className="w-5 h-5 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-700">
                      Strong product-market fit
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg
                      className="w-5 h-5 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-700">
                      Clear business value proposition
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg
                      className="w-5 h-5 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-700">
                      Realistic timeline and budget
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg
                      className="w-5 h-5 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-700">
                      AI-optimized sales strategy
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[var(--panel-background)] border-t border-[var(--border)] flex justify-between items-center">
          <button
            onClick={onClose}
            disabled={isCreating}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-[var(--background)] border border-[var(--border)] rounded-lg hover:bg-[var(--panel-background)] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center space-x-4">
            <div className="text-sm text-[var(--muted)]">
              Creating a {formatCurrency(opportunityData.amount)} opportunity
            </div>
            <button
              onClick={handleConfirm}
              disabled={isCreating}
              className="px-8 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 flex items-center space-x-2"
            >
              {isCreating ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Creating Opportunity...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <span>Create Opportunity</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
