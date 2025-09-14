import React from "react";
import { Partner } from "../types";
import CountryFlag from "@/platform/ui/components/monaco/CountryFlag";

interface PartnersListProps {
  partners: Partner[];
  onPartnerClick: (partner: Partner) => void;
  getStatusColor: (status: string) => string;
  getRankNumber: (record: any) => number;
  getRankingDescription: (record: any) => string;
}

export const PartnersList: React.FC<PartnersListProps> = ({
  partners,
  onPartnerClick,
  getStatusColor,
  getRankNumber,
  getRankingDescription,
}) => {
  return (
    <div className="space-y-4">
      {/* Sort partners by priority */}
      {[...partners]
        .sort((a, b) => getRankNumber(a) - getRankNumber(b))
        .map((partner, index) => (
          <div
            key={partner.id}
            className="border border-[var(--border)] rounded-xl p-6 bg-[var(--background)] hover:border-gray-400 transition-colors cursor-pointer"
            onClick={() => onPartnerClick(partner)}
            onMouseEnter={(e) => {
              e.currentTarget['style']['borderColor'] = "#9B59B6";
            }}
            onMouseLeave={(e) => {
              e.currentTarget['style']['borderColor'] = "";
            }}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-8 h-8 bg-[var(--hover-bg)] rounded-lg flex items-center justify-center text-[var(--foreground)] font-medium text-sm">
                  {getRankNumber(partner)}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[var(--foreground)] mb-1">
                    {partner.name}
                  </h3>
                  <p className="text-sm text-[var(--muted)] mb-2">
                    {partner.domain}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-[var(--muted)]">
                    <span>
                      Type:{" "}
                      <span className="font-medium text-[var(--foreground)]">
                        {partner.partnershipType}
                      </span>
                    </span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <span>Region:</span>
                      <CountryFlag location={partner.region} />
                      <span className="font-medium text-[var(--foreground)]">
                        {partner.region}
                      </span>
                    </div>
                    <span>•</span>
                    <span>
                      Revenue:{" "}
                      <span className="font-medium text-[var(--foreground)]">
                        {partner.revenue}
                      </span>
                    </span>
                  </div>
                  <p className="text-sm text-[var(--muted)] mt-2 italic">
                    {getRankingDescription(partner).split(": ")[1]}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(partner.status)}`}
                >
                  {partner.status}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm text-[var(--muted)]">
              <span>🤝 {partner.partnershipType}</span>
              <span>
                Last contact:{" "}
                {new Date(partner.lastContact).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
    </div>
  );
};
