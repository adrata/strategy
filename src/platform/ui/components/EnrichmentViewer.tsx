import { useEnrichment } from "@/platform/hooks/useEnrichment";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/platform/shared/components/ui/card";
import { Alert, AlertDescription } from "@/platform/shared/components/ui/alert";
import { Button } from "@/platform/shared/components/ui/button";

interface EnrichmentViewerProps {
  type: "company" | "contact";
  id: string;
}

export function EnrichmentViewer({ type, id }: EnrichmentViewerProps) {
  const { enrichSingleLead, isEnriching, error } = useEnrichment();

  const handleEnrich = async () => {
    if (type === "contact") {
      await enrichSingleLead({ leadId: id });
    }
    // For company type, we'd need a different enrichment function
  };

  if (isEnriching) {
    return <div>Loading enriched data...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error instanceof Error
            ? error.message
            : "Failed to load enriched data"}
        </AlertDescription>
      </Alert>
    );
  }

  // For now, we'll show a basic enrichment interface
  // In a full implementation, we'd fetch the enriched data from the API
  const data = null;

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Enriched Data Available</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Click the button below to enrich the data.</p>
          <Button onClick={handleEnrich} disabled={isEnriching}>
            {isEnriching ? "Enriching..." : "Enrich Data"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (type === "company") {
    const companyData = data as any; // Type assertion needed due to union type
    return (
      <Card>
        <CardHeader>
          <CardTitle>{companyData.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Engagement Metrics</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-[var(--panel-background)] rounded-lg">
                  <p className="text-sm text-[var(--muted)]">Total Emails</p>
                  <p className="text-2xl font-bold">
                    {companyData.engagementMetrics.totalEmails}
                  </p>
                </div>
                <div className="p-4 bg-[var(--panel-background)] rounded-lg">
                  <p className="text-sm text-[var(--muted)]">Total Meetings</p>
                  <p className="text-2xl font-bold">
                    {companyData.engagementMetrics.totalMeetings}
                  </p>
                </div>
                <div className="p-4 bg-[var(--panel-background)] rounded-lg">
                  <p className="text-sm text-[var(--muted)]">Total Events</p>
                  <p className="text-2xl font-bold">
                    {companyData.engagementMetrics.totalEvents}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Decision Maker Insights</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(companyData.decisionMakerInsights).map(
                  ([role, count]) => (
                    <div key={role} className="p-4 bg-[var(--panel-background)] rounded-lg">
                      <p className="text-sm text-[var(--muted)]">{role}</p>
                      <p className="text-2xl font-bold">{String(count)}</p>
                    </div>
                  ),
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Seller Profiles</h3>
              <div className="space-y-4">
                {companyData.sellerProfiles.map((profile: any) => (
                  <div key={profile.id} className="p-4 bg-[var(--panel-background)] rounded-lg">
                    <h4 className="font-medium">{profile.name}</h4>
                    <p className="text-sm text-[var(--muted)]">{profile.industry}</p>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      <p className="text-sm">Emails: {profile.emailCount}</p>
                      <p className="text-sm">
                        Meetings: {profile.meetingCount}
                      </p>
                      <p className="text-sm">Events: {profile.eventCount}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Buyer Profiles</h3>
              <div className="space-y-4">
                {companyData.buyerProfiles.map((profile: any) => (
                  <div key={profile.id} className="p-4 bg-[var(--panel-background)] rounded-lg">
                    <h4 className="font-medium">{profile.name}</h4>
                    <p className="text-sm text-[var(--muted)]">{profile.industry}</p>
                    <div className="mt-2 grid grid-cols-4 gap-2">
                      <p className="text-sm">Groups: {profile.groupCount}</p>
                      <p className="text-sm">Emails: {profile.emailCount}</p>
                      <p className="text-sm">
                        Meetings: {profile.meetingCount}
                      </p>
                      <p className="text-sm">Events: {profile.eventCount}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const contactData = data as any; // Type assertion needed due to union type
  return (
    <Card>
      <CardHeader>
        <CardTitle>{contactData.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Contact Information</h3>
            <div className="p-4 bg-[var(--panel-background)] rounded-lg">
              <p className="text-sm text-[var(--muted)]">Email</p>
              <p>{contactData.email || "N/A"}</p>
              <p className="text-sm text-[var(--muted)] mt-2">Title</p>
              <p>{contactData.title || "N/A"}</p>
              <p className="text-sm text-[var(--muted)] mt-2">Role</p>
              <p>{contactData.role || "N/A"}</p>
            </div>
          </div>

          {contactData['sellerProfile'] && (
            <div>
              <h3 className="font-semibold mb-2">Seller Profile</h3>
              <div className="p-4 bg-[var(--panel-background)] rounded-lg">
                <h4 className="font-medium">
                  {contactData.sellerProfile.name}
                </h4>
                <p className="text-sm text-[var(--muted)]">
                  {contactData.sellerProfile.company.name}
                </p>
              </div>
            </div>
          )}

          <div>
            <h3 className="font-semibold mb-2">Groups</h3>
            <div className="space-y-4">
              {contactData.groups.map((group: any) => (
                <div key={group.id} className="p-4 bg-[var(--panel-background)] rounded-lg">
                  <h4 className="font-medium">{group.name}</h4>
                  <p className="text-sm text-[var(--muted)]">{group.company.name}</p>
                  {group['description'] && (
                    <p className="text-sm mt-2">{group.description}</p>
                  )}
                  <div className="mt-2">
                    <p className="text-sm text-[var(--muted)]">
                      Decision Maker Roles:
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {group.decisionMakerRoles.map((role: string) => (
                        <span
                          key={role}
                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Engagement Metrics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-[var(--panel-background)] rounded-lg">
                <p className="text-sm text-[var(--muted)]">Total Groups</p>
                <p className="text-2xl font-bold">
                  {contactData.engagementMetrics.groupCount}
                </p>
              </div>
              <div className="p-4 bg-[var(--panel-background)] rounded-lg">
                <p className="text-sm text-[var(--muted)]">Decision Maker Roles</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {contactData.engagementMetrics.decisionMakerRoles.map(
                    (role: string) => (
                      <span
                        key={role}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                      >
                        {role}
                      </span>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
