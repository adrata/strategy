import React from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title,
  description,
  actionText,
  onAction,
  className = ""
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-8 text-center ${className}`}>
      {/* Clean geometric icon */}
      <div className="w-16 h-16 mb-6 rounded-full border-2 border-gray-300 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-400 rounded"></div>
      </div>
      
      {/* Title */}
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {title}
      </h3>
      
      {/* Description */}
      <p className="text-gray-600 mb-6 max-w-md">
        {description}
      </p>
      
      {/* Action button (optional) */}
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors duration-200 font-medium"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}

// Specific empty states for different sections
export function EmptyCompaniesState() {
  return (
    <EmptyState
      title="No companies found"
      description="Start by adding companies to your workspace or adjust your search criteria."
    />
  );
}

export function EmptyPeopleState() {
  return (
    <EmptyState
      title="No people found"
      description="Add contacts to your workspace or refine your search to find people."
    />
  );
}

export function EmptySellersState() {
  return (
    <EmptyState
      title="No sellers assigned"
      description="Sellers will appear here when they are added to your workspace."
    />
  );
}

export function EmptyRTPState() {
  return (
    <EmptyState
      title="No priority prospects"
      description="Real-time priority prospects will appear here when available."
    />
  );
}
