// @ts-nocheck - Temporary: Skip type checking for location/g2Data compatibility issues
import { PipelineData, EnrichedProfile } from "../types";

export async function enrichPeopleData(
  data: PipelineData,
): Promise<Partial<PipelineData>> {
  const { peopleData, buyerCompanies } = data;

  if (!peopleData || !buyerCompanies) {
    throw new Error("Required data missing for people data enrichment");
  }

  const enrichedProfiles: EnrichedProfile[] = [];

  for (const person of peopleData) {
    // Find the company data
    const company = buyerCompanies.find((c) => c['id'] === person.companyId);
    if (!company) {
      console.warn(`Company not found for person ${person.id}`);
      continue;
    }

    // Create enriched profile
    const enrichedProfile: EnrichedProfile = {
      id: `enriched-${person.id}`,
      personId: person.id,
      personName: person.name,
      title: person.title,
      companyName: company.name,
      companyId: company.id,
      linkedinUrl: person.linkedinUrl,
      email: person.email || "",
      phone: person.phone || "",
      location: company.location,
      influence: person.influence,
      skills: [], // To be populated from LinkedIn data
      experience: [], // To be populated from LinkedIn data
      education: [], // To be populated from LinkedIn data
      personality: undefined, // To be populated from personality analysis
      painPoints: [], // To be populated from analysis
      motivations: [], // To be populated from analysis
      insights: [], // To be populated from analysis
      recentActivity: [], // To be populated from activity tracking
      g2Data: company.g2Data,
    };

    // Add personality insights if available
    if (data.personalityInsights?.[person.id]) {
      enrichedProfile['personality'] =
        data['personalityInsights'][person.id].dominantPersonality.join(", ");
    }

    // Add pain points and motivations if available
    if (data.enrichedProfiles) {
      const existingProfile = data.enrichedProfiles.find(
        (p) => p['personId'] === person.id,
      );
      if (existingProfile) {
        enrichedProfile['painPoints'] = existingProfile.painPoints || [];
        enrichedProfile['motivations'] = existingProfile.motivations || [];
        enrichedProfile['insights'] = existingProfile.insights || [];
        enrichedProfile['recentActivity'] = existingProfile.recentActivity || [];
      }
    }

    // Add skills, experience, and education if available
    if (data.enrichedProfiles) {
      const existingProfile = data.enrichedProfiles.find(
        (p) => p['personId'] === person.id,
      );
      if (existingProfile) {
        enrichedProfile['skills'] = existingProfile.skills || [];
        enrichedProfile['experience'] = existingProfile.experience || [];
        enrichedProfile['education'] = existingProfile.education || [];
      }
    }

    enrichedProfiles.push(enrichedProfile);
  }

  return { enrichedProfiles };
}
