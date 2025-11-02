import { useIntelligenceReports } from "@/platform/hooks/useIntelligenceReports";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/platform/shared/components/ui/card";
import { Alert, AlertDescription } from "@/platform/shared/components/ui/alert";
import { Button } from "@/platform/shared/components/ui/button";

interface ReportViewerProps {
  sellerProfileId: string;
  buyerCompanyId: string;
}

export function ReportViewer({
  sellerProfileId,
  buyerCompanyId,
}: ReportViewerProps) {
  const { report, isLoading, error, createReport } = useIntelligenceReports(
    sellerProfileId,
    buyerCompanyId,
  );

  if (isLoading) {
    return <div>Loading report...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error instanceof Error ? error.message : "Failed to load report"}
        </AlertDescription>
      </Alert>
    );
  }

  if (!report) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Report Available</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No intelligence report has been generated yet.</p>
          <Button
            onClick={() =>
              createReport.mutate({
                sellerProfileId,
                buyerCompanyId,
                title: "Initial Intelligence Report",
                content: "Generating initial intelligence report...",
              })
            }
            disabled={createReport.isPending}
          >
            {createReport.isPending ? "Generating..." : "Generate Report"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{report.content.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Seller Profile</h3>
            <p>{report.sellerProfile.company.name}</p>
          </div>
          <div>
            <h3 className="font-semibold">Buyer Company</h3>
            <p>{report.buyerCompany.company.name}</p>
          </div>
          <div>
            <h3 className="font-semibold">Report Content</h3>
            <p className="whitespace-pre-wrap">{report.content.content}</p>
          </div>
          <div className="text-sm text-muted">
            <p>Generated on: {new Date(report.createdAt).toLocaleString()}</p>
            <p>Last updated: {new Date(report.updatedAt).toLocaleString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
