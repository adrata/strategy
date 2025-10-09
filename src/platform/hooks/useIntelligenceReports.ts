import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { safeApiFetch } from "@/platform/api-fetch";
import { isDesktop } from "@/platform/platform-detection";

interface IntelligenceReport {
  id: string;
  content: {
    title: string;
    content: string;
  };
  sellerProfile: {
    id: string;
    company: {
      id: string;
      name: string;
    };
  };
  buyerCompany: {
    id: string;
    company: {
      id: string;
      name: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

interface CreateReportData {
  sellerProfileId: string;
  buyerCompanyId: string;
  title: string;
  content: string;
}

export function useIntelligenceReports(
  sellerProfileId?: string,
  buyerCompanyId?: string,
) {
  const queryClient = useQueryClient();

  const {
    data: report,
    isLoading,
    error,
  } = useQuery<IntelligenceReport>({
    queryKey: ["intelligenceReport", sellerProfileId, buyerCompanyId],
    queryFn: async () => {
      if (!sellerProfileId || !buyerCompanyId) {
        throw new Error("Missing required parameters");
      }

      // Desktop mode: Return mock report
      if (isDesktop()) {
        return {
          id: "mock-report-1",
          content: {
            title: "Intelligence Report",
            content: "Mock intelligence report content for desktop mode.",
          },
          sellerProfile: {
            id: sellerProfileId,
            company: { id: "1", name: "Seller Company" },
          },
          buyerCompany: {
            id: buyerCompanyId,
            company: { id: "2", name: "Buyer Company" },
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      const response = await safeApiFetch(
        `/api/intelligence/reports?sellerProfileId=${sellerProfileId}&buyerCompanyId=${buyerCompanyId}`,
      );
      return response;
    },
    enabled: !!sellerProfileId && !!buyerCompanyId,
  });

  const createReport = useMutation({
    mutationFn: async (data: CreateReportData) => {
      // Desktop mode: Return mock created report
      if (isDesktop()) {
        return {
          id: "mock-created-report",
          content: {
            title: data.title,
            content: data.content,
          },
          sellerProfile: {
            id: data.sellerProfileId,
            company: { id: "1", name: "Seller Company" },
          },
          buyerCompany: {
            id: data.buyerCompanyId,
            company: { id: "2", name: "Buyer Company" },
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      const response = await safeApiFetch("/api/intelligence/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["intelligenceReport"] });
    },
  });

  return {
    report,
    isLoading,
    error,
    createReport,
  };
}
