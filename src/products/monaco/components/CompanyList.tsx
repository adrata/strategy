import React from "react";
import { Company } from "../types";

interface CompanyListProps {
  companies: Company[];
  highlightedRecords: string[];
  people: any[]; // For finding decision makers
  onCompanyClick: (company: Company, decisionMaker?: any) => void;
  getStatusColor: (status: string) => string;
  getIcpScoreColor: (score: number) => string;
  getRankNumber: (record: any) => number;
  getRankingDescription: (record: any) => string;
}

export const CompanyList: React.FC<CompanyListProps> = ({
  companies,
  highlightedRecords,
  people,
  onCompanyClick,
  getStatusColor,
  getIcpScoreColor,
  getRankNumber,
  getRankingDescription,
}) => {
  // Helper function to get engineering headcount for a company
  const getEngineeringHeadcount = (company: any): number => {
    // Use real company engineering headcount if available, otherwise fallback to counting demo leads
    if (company['engineeringHeadcount'] && typeof company['engineeringHeadcount'] === 'number') {
      return company.engineeringHeadcount;
    }
    
    // Fallback: count engineering leads in demo data
    const engineeringDepartments = ['Engineering', 'Technology', 'Security'];
    return (people || []).filter(person => 
      person['company'] === company['name'] && 
      engineeringDepartments.includes(person.department)
    ).length || 100; // Default fallback
  };
  return (
    <div className="space-y-4">
      {/* Sort companies by ICP score for ranking */}
      {[...companies]
        .sort((a, b) => b.icpScore - a.icpScore)
        .map((company, index) => {
          const isHighlighted = highlightedRecords.includes(company.id);

          const handleClick = () => {
            // REMOVED: Page navigation that was causing reloads
            // TODO: Could show company detail modal or navigate with state
            console.log("⚡ Instant company view for:", company.name);
          };

          return (
            <div
              key={company.id}
              className={`border rounded-xl p-6 bg-background hover:border-gray-400 transition-all cursor-pointer ${
                isHighlighted
                  ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-200 dark:ring-blue-700"
                  : "border-border"
              }`}
              onClick={handleClick}
              onMouseEnter={(e) => {
                if (!isHighlighted) {
                  e.currentTarget['style']['borderColor'] = "#9B59B6";
                }
              }}
              onMouseLeave={(e) => {
                if (!isHighlighted) {
                  e.currentTarget['style']['borderColor'] = "";
                }
              }}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-8 h-8 bg-hover rounded-lg flex items-center justify-center text-foreground font-medium text-sm">
                    {getRankNumber(company)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      {company.name}
                    </h3>
                    <p className="text-sm text-muted mb-2">
                      {company.domain}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted">
                      <span>
                        Industry:{" "}
                        <span className="font-medium text-foreground">
                          {company.industry}
                        </span>
                      </span>
                      <span>•</span>
                      <span>
                        Size:{" "}
                        <span className="font-medium text-foreground">
                          {company.employeeCount} employees
                        </span>
                      </span>

                      <span>•</span>
                      <span>
                        Revenue:{" "}
                        <span className="font-medium text-foreground">
                          {company.revenue}
                        </span>
                      </span>
                    </div>
                    <p className="text-sm text-muted mt-2 italic">
                      {getRankingDescription(company).split(": ")[1]}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-muted">
                      ICP Score:
                    </span>
                    <span
                      className={`text-lg font-bold ${getIcpScoreColor(company.icpScore)}`}
                    >
                      {company.icpScore}%
                    </span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(company.status)}`}
                  >
                    {company.status}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-muted">
                <div className="flex items-center gap-1">
                  <span>📍</span>
                  <span>{company.location}</span>
                </div>
                <span>
                  Last updated:{" "}
                  {new Date(company.lastUpdated).toLocaleDateString()}
                </span>
              </div>
            </div>
          );
        })}
    </div>
  );
};
