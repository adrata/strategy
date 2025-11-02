import React from "react";
import { SparklesIcon } from "@heroicons/react/24/outline";
import { SearchResults } from "../types";

interface SearchResultsIndicatorProps {
  currentSearchResults: SearchResults | null;
  onClearSearch: () => void;
}

export const SearchResultsIndicator: React.FC<SearchResultsIndicatorProps> = ({
  currentSearchResults,
  onClearSearch,
}) => {
  if (!currentSearchResults) return null;

  return (
    <div className="mt-2 flex items-center gap-2">
      <SparklesIcon className="w-4 h-4 text-[#9B59B6]" />
      <span className="text-sm text-muted">
        Showing AI search results for: {currentSearchResults.query}
      </span>
      <button
        onClick={onClearSearch}
        className="text-xs text-[#9B59B6] hover:underline"
      >
        Clear filters
      </button>
    </div>
  );
};
