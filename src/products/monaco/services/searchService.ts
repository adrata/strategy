import { SearchPill, SearchResults, Company, Partner, Person } from "../types";
import { searchAlternatives } from "../data/mockData";

export class MonacoSearchService {
  // Parse natural language queries into search pills
  parseNaturalLanguageQuery(query: string): SearchPill[] {
    const pills: SearchPill[] = [];
    const lowerQuery = query.toLowerCase();

    // Location extraction
    for (const [location, alternatives] of Object.entries(
      searchAlternatives.location,
    )) {
      if (
        lowerQuery.includes(location.toLowerCase()) ||
        alternatives.some((alt) => lowerQuery.includes(alt.toLowerCase()))
      ) {
        pills.push({
          id: `location-${location}`,
          type: "location",
          value: location,
          alternatives: alternatives,
          isActive: true,
        });
        break;
      }
    }

    // Enhanced Industry extraction with word boundary detection
    for (const [industry, alternatives] of Object.entries(
      searchAlternatives.industry,
    )) {
      const industryPattern = new RegExp(
        `\\b${industry.toLowerCase()}\\b`,
        "i",
      );
      const alternativePatterns = alternatives.map(
        (alt) => new RegExp(`\\b${alt.toLowerCase()}\\b`, "i"),
      );

      if (
        industryPattern.test(lowerQuery) ||
        alternativePatterns.some((pattern) => pattern.test(lowerQuery))
      ) {
        pills.push({
          id: `industry-${industry}`,
          type: "industry",
          value: industry,
          alternatives: alternatives,
          isActive: true,
        });
        break;
      }
    }

    // Developer Type Intelligence
    for (const [devType, alternatives] of Object.entries(
      searchAlternatives.developerType,
    )) {
      const devPattern = new RegExp(`\\b${devType.toLowerCase()}\\b`, "i");
      const devAlternativePatterns = alternatives.map(
        (alt) => new RegExp(`\\b${alt.toLowerCase()}\\b`, "i"),
      );

      if (
        devPattern.test(lowerQuery) ||
        devAlternativePatterns.some((pattern) => pattern.test(lowerQuery))
      ) {
        pills.push({
          id: `developer-${devType}`,
          type: "developer_type",
          value: devType,
          alternatives: alternatives,
          isActive: true,
        });
        break;
      }
    }

    // Technology Stack Intelligence
    for (const [tech, alternatives] of Object.entries(
      searchAlternatives.techStack,
    )) {
      const techPattern = new RegExp(`\\b${tech.toLowerCase()}\\b`, "i");
      const techAlternativePatterns = alternatives.map(
        (alt) => new RegExp(`\\b${alt.toLowerCase()}\\b`, "i"),
      );

      if (
        techPattern.test(lowerQuery) ||
        techAlternativePatterns.some((pattern) => pattern.test(lowerQuery))
      ) {
        pills.push({
          id: `tech-${tech}`,
          type: "tech_stack",
          value: tech,
          alternatives: alternatives,
          isActive: true,
        });
        break;
      }
    }

    // Seniority Level Intelligence
    for (const [level, alternatives] of Object.entries(
      searchAlternatives.seniority,
    )) {
      const levelPattern = new RegExp(`\\b${level.toLowerCase()}\\b`, "i");
      const levelAlternativePatterns = alternatives.map(
        (alt) => new RegExp(`\\b${alt.toLowerCase()}\\b`, "i"),
      );

      if (
        levelPattern.test(lowerQuery) ||
        levelAlternativePatterns.some((pattern) => pattern.test(lowerQuery))
      ) {
        pills.push({
          id: `seniority-${level}`,
          type: "role_level",
          value: level,
          alternatives: alternatives,
          isActive: true,
        });
        break;
      }
    }

    // Department Intelligence
    for (const [dept, alternatives] of Object.entries(
      searchAlternatives.department,
    )) {
      const deptPattern = new RegExp(`\\b${dept.toLowerCase()}\\b`, "i");
      const deptAlternativePatterns = alternatives.map(
        (alt) => new RegExp(`\\b${alt.toLowerCase()}\\b`, "i"),
      );

      if (
        deptPattern.test(lowerQuery) ||
        deptAlternativePatterns.some((pattern) => pattern.test(lowerQuery))
      ) {
        pills.push({
          id: `department-${dept}`,
          type: "department",
          value: dept,
          alternatives: alternatives,
          isActive: true,
        });
        break;
      }
    }

    // Size/employee count extraction
    if (lowerQuery.includes("small") || lowerQuery.includes("startup")) {
      pills.push({
        id: "size-small",
        type: "size",
        value: "Small (1-50)",
        alternatives: [
          "Startup",
          "Small Business",
          "1-50 employees",
          "< 100 employees",
        ],
        isActive: true,
      });
    } else if (
      lowerQuery.includes("medium") ||
      lowerQuery.includes("mid-size")
    ) {
      pills.push({
        id: "size-medium",
        type: "size",
        value: "Medium (51-200)",
        alternatives: ["Mid-size", "51-200 employees", "100-500 employees"],
        isActive: true,
      });
    } else if (
      lowerQuery.includes("large") ||
      lowerQuery.includes("enterprise")
    ) {
      pills.push({
        id: "size-large",
        type: "size",
        value: "Large (200+)",
        alternatives: [
          "Enterprise",
          "200+ employees",
          "500+ employees",
          "Large Corp",
        ],
        isActive: true,
      });
    }

    return pills;
  }

  // Create dynamic pills as user types
  createDynamicPillsFromInput(input: string): SearchPill[] {
    if (!input.trim()) return [];

    const pills: SearchPill[] = [];
    const lowerInput = input.toLowerCase();

    // Location detection
    for (const [location, alternatives] of Object.entries(
      searchAlternatives.location,
    )) {
      if (
        lowerInput.includes(location.toLowerCase()) ||
        alternatives.some((alt) => lowerInput.includes(alt.toLowerCase()))
      ) {
        pills.push({
          id: `dynamic-location-${location}`,
          type: "location",
          value: location,
          alternatives: alternatives,
          isActive: false, // Dynamic pills start inactive
        });
        break;
      }
    }

    // Industry detection
    for (const [industry, alternatives] of Object.entries(
      searchAlternatives.industry,
    )) {
      const industryPattern = new RegExp(
        `\\b${industry.toLowerCase()}\\b`,
        "i",
      );
      const alternativePatterns = alternatives.map(
        (alt) => new RegExp(`\\b${alt.toLowerCase()}\\b`, "i"),
      );

      if (
        industryPattern.test(lowerInput) ||
        alternativePatterns.some((pattern) => pattern.test(lowerInput))
      ) {
        pills.push({
          id: `dynamic-industry-${industry}`,
          type: "industry",
          value: industry,
          alternatives: alternatives,
          isActive: false,
        });
        break;
      }
    }

    // Size detection
    if (lowerInput.includes("small") || lowerInput.includes("startup")) {
      pills.push({
        id: "dynamic-size-small",
        type: "size",
        value: "Small (1-50)",
        alternatives: [
          "Startup",
          "Small Business",
          "1-50 employees",
          "< 100 employees",
        ],
        isActive: false,
      });
    } else if (
      lowerInput.includes("medium") ||
      lowerInput.includes("mid-size")
    ) {
      pills.push({
        id: "dynamic-size-medium",
        type: "size",
        value: "Medium (51-200)",
        alternatives: ["Mid-size", "51-200 employees", "100-500 employees"],
        isActive: false,
      });
    } else if (
      lowerInput.includes("large") ||
      lowerInput.includes("enterprise")
    ) {
      pills.push({
        id: "dynamic-size-large",
        type: "size",
        value: "Large (200+)",
        alternatives: [
          "Enterprise",
          "200+ employees",
          "500+ employees",
          "Large Corp",
        ],
        isActive: false,
      });
    }

    return pills;
  }

  // Execute intelligent search based on pills
  executeIntelligentSearch(
    pills: SearchPill[],
    companies: Company[],
    partners: Partner[],
    people: Person[],
  ): SearchResults {
    const activePills = pills.filter((pill) => pill.isActive);

    // If no active pills, return all data
    if ((activePills?.length || 0) === 0) {
      return {
        companies: (companies || []).slice(0, 10),
        partners: (partners || []).slice(0, 10),
        people: (people || []).slice(0, 10),
        query: "",
        pills: [],
        totalResults: (companies?.length || 0) + (partners?.length || 0) + (people?.length || 0),
      };
    }

    let filteredCompanies = [...(companies || [])];
    let filteredPartners = [...(partners || [])];
    let filteredPeople = [...(people || [])];

    // Apply filters based on active pills
    activePills.forEach((pill) => {
      switch (pill.type) {
        case "location":
          filteredCompanies = filteredCompanies.filter(
            (company) =>
              company.location
                .toLowerCase()
                .includes(pill.value.toLowerCase()) ||
              pill.alternatives.some((alt) =>
                company.location.toLowerCase().includes(alt.toLowerCase()),
              ),
          );
          filteredPeople = filteredPeople.filter(
            (person) =>
              person.location
                .toLowerCase()
                .includes(pill.value.toLowerCase()) ||
              pill.alternatives.some((alt) =>
                person.location.toLowerCase().includes(alt.toLowerCase()),
              ),
          );
          break;

        case "industry":
          filteredCompanies = filteredCompanies.filter(
            (company) =>
              company.industry
                .toLowerCase()
                .includes(pill.value.toLowerCase()) ||
              pill.alternatives.some((alt) =>
                company.industry.toLowerCase().includes(alt.toLowerCase()),
              ),
          );
          break;

        case "size":
          filteredCompanies = filteredCompanies.filter((company) => {
            if (pill.value.includes("Small")) {
              return company.employeeCount <= 50;
            } else if (pill.value.includes("Medium")) {
              return company.employeeCount > 50 && company.employeeCount <= 200;
            } else if (pill.value.includes("Large")) {
              return company.employeeCount > 200;
            }
            return true;
          });
          break;

        case "department":
          filteredPeople = filteredPeople.filter(
            (person) =>
              person.department
                .toLowerCase()
                .includes(pill.value.toLowerCase()) ||
              pill.alternatives.some((alt) =>
                person.department.toLowerCase().includes(alt.toLowerCase()),
              ),
          );
          break;

        case "seniority":
        case "role_level":
          filteredPeople = filteredPeople.filter(
            (person) =>
              person.seniority
                .toLowerCase()
                .includes(pill.value.toLowerCase()) ||
              pill.alternatives.some((alt) =>
                person.seniority.toLowerCase().includes(alt.toLowerCase()),
              ),
          );
          break;

        case "status":
          filteredCompanies = filteredCompanies.filter(
            (company) =>
              company.status.toLowerCase() === pill.value.toLowerCase(),
          );
          filteredPeople = filteredPeople.filter(
            (person) =>
              person.status.toLowerCase() === pill.value.toLowerCase(),
          );
          break;

        case "developer_type":
          // Filter people by developer type in title
          filteredPeople = filteredPeople.filter(
            (person) =>
              person.title.toLowerCase().includes(pill.value.toLowerCase()) ||
              pill.alternatives.some((alt) =>
                person.title.toLowerCase().includes(alt.toLowerCase()),
              ),
          );
          break;

        case "tech_stack":
          // Filter companies by tech stack (if company intelligence is available)
          filteredCompanies = filteredCompanies.filter((company) => {
            if (company.companyIntelligence?.techStack) {
              return company.companyIntelligence.techStack.some(
                (tech) =>
                  tech.toLowerCase().includes(pill.value.toLowerCase()) ||
                  pill.alternatives.some((alt) =>
                    tech.toLowerCase().includes(alt.toLowerCase()),
                  ),
              );
            }
            return false;
          });
          break;
      }
    });

    // Sort results by relevance (ICP score for companies, status priority for people)
    filteredCompanies.sort((a, b) => b.icpScore - a.icpScore);
    filteredPeople.sort((a, b) => {
      const statusPriority = {
        qualified: 4,
        contacted: 3,
        prospect: 2,
        customer: 1,
      };
      return (
        (statusPriority[b.status as keyof typeof statusPriority] || 0) -
        (statusPriority[a.status as keyof typeof statusPriority] || 0)
      );
    });

    const query = activePills.map((pill) => pill.value).join(", ");
    const totalResults =
      (filteredCompanies?.length || 0) +
      (filteredPartners?.length || 0) +
      (filteredPeople?.length || 0);

    return {
      companies: filteredCompanies.slice(0, 10),
      partners: filteredPartners.slice(0, 10),
      people: filteredPeople.slice(0, 10),
      query,
      pills: activePills,
      totalResults,
    };
  }

  // Get statistics for sections
  getStatsForSection(
    section: string,
    companies: Company[],
    partners: Partner[],
    people: Person[],
  ) {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    switch (section) {
      case "companies":
        const allCompanies = companies?.length || 0;
        const weekCompanies = (companies || []).filter(
          (c) => new Date(c.lastUpdated) >= weekAgo,
        ).length;
        return {
          all: allCompanies,
          week: weekCompanies,
          change:
            weekCompanies > 0
              ? Math.round((weekCompanies / allCompanies) * 100)
              : 0,
        };

      case "partners":
        const allPartners = partners?.length || 0;
        const weekPartners = (partners || []).filter(
          (p) => new Date(p.lastContact) >= weekAgo,
        ).length;
        return {
          all: allPartners,
          week: weekPartners,
          change:
            weekPartners > 0
              ? Math.round((weekPartners / allPartners) * 100)
              : 0,
        };

      case "people":
        const allPeople = people?.length || 0;
        const weekPeople = (people || []).filter(
          (p) => new Date(p.lastContact) >= weekAgo,
        ).length;
        return {
          all: allPeople,
          week: weekPeople,
          change:
            weekPeople > 0 ? Math.round((weekPeople / allPeople) * 100) : 0,
        };

      default:
        return { all: 0, week: 0, change: 0 };
    }
  }

  // Get Best 100 companies (top-performing companies)
  getBest100Companies(companies: Company[]): Company[] {
    return companies
      .filter((company) => company.icpScore >= 80)
      .sort((a, b) => b.icpScore - a.icpScore);
  }

  // Get ranking description for records
  getRankingDescription(record: Company | Partner | Person): string {
    if ("icpScore" in record) {
      // Company ranking
      const company = record as Company;
      if (company.icpScore >= 95) return "Top 1% ICP Match";
      if (company.icpScore >= 90) return "Top 5% ICP Match";
      if (company.icpScore >= 85) return "Top 15% ICP Match";
      if (company.icpScore >= 80) return "Top 25% ICP Match";
      return "Below Average Match";
    } else if ("partnershipType" in record) {
      // Partner ranking
      const partner = record as Partner;
      const revenue = parseFloat(partner.revenue.replace(/[$M,K]/g, ""));
      if (revenue >= 3) return "Top Tier Partner";
      if (revenue >= 2) return "High Value Partner";
      if (revenue >= 1) return "Growing Partner";
      return "New Partner";
    } else {
      // Person ranking
      const person = record as Person;
      const seniorityLevel = person.seniority.toLowerCase();
      if (
        seniorityLevel.includes("c-level") ||
        seniorityLevel.includes("ceo") ||
        seniorityLevel.includes("cto")
      ) {
        return "Executive Level";
      }
      if (
        seniorityLevel.includes("vp") ||
        seniorityLevel.includes("vice president")
      ) {
        return "VP Level";
      }
      if (seniorityLevel.includes("director")) {
        return "Director Level";
      }
      if (seniorityLevel.includes("manager")) {
        return "Manager Level";
      }
      return "Individual Contributor";
    }
  }

  // Get rank number for records
  getRankNumber(
    record: Company | Partner | Person,
    allRecords: (Company | Partner | Person)[],
  ): number {
    if ("icpScore" in record) {
      // Company ranking by ICP score
      const companies = (allRecords || []).filter((r) => "icpScore" in r) as Company[];
      const sortedCompanies = companies.sort((a, b) => b.icpScore - a.icpScore);
      return sortedCompanies.findIndex((c) => c['id'] === record.id) + 1;
    } else if ("revenue" in record && "partnershipType" in record) {
      // Partner ranking by revenue
      const partners = (allRecords || []).filter(
        (r) => "partnershipType" in r,
      ) as Partner[];
      const sortedPartners = partners.sort((a, b) => {
        const aRevenue = parseFloat(a.revenue.replace(/[$M,K]/g, ""));
        const bRevenue = parseFloat(b.revenue.replace(/[$M,K]/g, ""));
        return bRevenue - aRevenue;
      });
      return sortedPartners.findIndex((p) => p['id'] === record.id) + 1;
    } else {
      // Person ranking by seniority/status
      const people = (allRecords || []).filter(
        (r) => "title" in r && "company" in r,
      ) as Person[];
      const seniorityPriority = {
        "C-Level": 5,
        VP: 4,
        Director: 3,
        Manager: 2,
        Senior: 1,
      };
      const statusPriority = {
        qualified: 4,
        contacted: 3,
        prospect: 2,
        customer: 1,
      };

      const sortedPeople = people.sort((a, b) => {
        const aSeniority =
          seniorityPriority[a.seniority as keyof typeof seniorityPriority] || 0;
        const bSeniority =
          seniorityPriority[b.seniority as keyof typeof seniorityPriority] || 0;
        const aStatus =
          statusPriority[a.status as keyof typeof statusPriority] || 0;
        const bStatus =
          statusPriority[b.status as keyof typeof statusPriority] || 0;

        if (aSeniority !== bSeniority) return bSeniority - aSeniority;
        return bStatus - aStatus;
      });

      return sortedPeople.findIndex((p) => p['id'] === record.id) + 1;
    }
  }
}
