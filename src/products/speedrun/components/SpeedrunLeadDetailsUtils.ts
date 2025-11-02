import { SpeedrunPerson, ValueIdea } from "../types/SpeedrunTypes";

export const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export const getRoleColor = (role: string): string => {
  switch (role) {
    case "Champion":
      return "bg-green-100 text-green-800 border-green-200";
    case "Decision Maker":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "Stakeholder":
      return "bg-purple-100 text-purple-800 border-purple-200";
    default:
      return "bg-hover text-gray-800 border-border";
  }
};

export const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Vercel-style precise time calculation
  if (diffSeconds < 60) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
};

export const getFallbackReports = (role: string): ValueIdea[] => {
  const reportMap = {
    "Decision Maker": [
      {
        title: "Competitive Threat Assessment: Q2 2025",
        description:
          "Strategic positioning analysis revealing competitor vulnerabilities and market opportunities.",
        urgency: "high" as const,
        type: "competitive-mini",
      },
      {
        title: "Revenue Acceleration Opportunities",
        description:
          "Untapped market segments and expansion strategies based on industry analysis.",
        urgency: "high" as const,
        type: "growth-mini",
      },
      {
        title: "Stakeholder Influence Strategy",
        description:
          "Strategic stakeholder mapping and influence framework for decision acceleration.",
        urgency: "medium" as const,
        type: "stakeholder-mini",
      },
      {
        title: "Technology Modernization Roadmap",
        description:
          "Platform upgrade strategy and digital transformation framework.",
        urgency: "medium" as const,
        type: "competitive-mini",
      },
    ],
    Champion: [
      {
        title: "Technology Stack Assessment",
        description:
          "Infrastructure evaluation and platform upgrade strategy for 2025-2026.",
        urgency: "high" as const,
        type: "competitive-mini",
      },
      {
        title: "Platform Vendor Comparison",
        description:
          "Detailed analysis of leading platforms with implementation and ROI projections.",
        urgency: "high" as const,
        type: "growth-mini",
      },
      {
        title: "Digital Transformation Strategy",
        description:
          "Technology adoption framework aligned with business objectives and market trends.",
        urgency: "medium" as const,
        type: "stakeholder-mini",
      },
      {
        title: "Growth Acceleration Plan",
        description:
          "Strategic growth opportunities and competitive positioning framework.",
        urgency: "medium" as const,
        type: "growth-mini",
      },
    ],
    Stakeholder: [
      {
        title: "Industry Trends Analysis",
        description:
          "Market disruption patterns and strategic response recommendations.",
        urgency: "medium" as const,
        type: "stakeholder-mini",
      },
      {
        title: "Market Expansion Strategy",
        description:
          "Growth opportunity analysis and competitive positioning framework.",
        urgency: "medium" as const,
        type: "growth-mini",
      },
      {
        title: "Competitive Intelligence Brief",
        description:
          "Strategic competitive analysis and market positioning insights.",
        urgency: "low" as const,
        type: "competitive-mini",
      },
      {
        title: "Growth Opportunities Report",
        description:
          "Revenue expansion and market development opportunity analysis.",
        urgency: "low" as const,
        type: "growth-mini",
      },
    ],
  };

  return reportMap[role as keyof typeof reportMap] || reportMap["Stakeholder"];
};

export const transformToDialerContacts = (allPeople: SpeedrunPerson[]): any[] => {
  const callableContacts = allPeople.filter(
    (p) => p['phone'] && p.phone.trim() !== "",
  );
  return callableContacts.map((p) => ({
    id: p.id,
    name: p.name,
    phone: p.phone,
    company: p.company,
    title: p.title,
    nextAction: p.nextAction,
    priority: p.priority,
  }));
};

export const transformToSingleDialerContact = (person: SpeedrunPerson): any[] => {
  return [
    {
      id: person.id,
      name: person.name,
      phone: person.phone,
      company: person.company,
      title: person.title,
      nextAction: person.nextAction,
      priority: person.priority,
    },
  ];
};
