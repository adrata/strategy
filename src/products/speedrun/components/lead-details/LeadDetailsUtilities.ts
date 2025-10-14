import { SpeedrunPerson } from "../../types/SpeedrunTypes";

export class LeadDetailsUtilities {
  static getInitials(name: string): string {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 3);
  }

  static getRoleColor(role: string): string {
    switch (role) {
      case "Champion":
        return "bg-green-100 text-green-800 border-green-200";
      case "Decision Maker":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Stakeholder":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-[var(--hover)] text-gray-800 border-[var(--border)]";
    }
  }

  static formatTimestamp(timestamp: string): string {
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
  }

  static canNavigatePrevious(personIndex: number): boolean {
    return personIndex > 0;
  }

  static canNavigateNext(personIndex: number, totalPersons: number): boolean {
    return personIndex < totalPersons - 1;
  }

  static getCallableContacts(allPeople: SpeedrunPerson[]): SpeedrunPerson[] {
    return allPeople.filter((p) => p['phone'] && p.phone.trim() !== "");
  }

  static transformPersonToContact(person: SpeedrunPerson) {
    return {
      id: person.id,
      name: person.name,
      phone: person.phone,
      company: typeof person.company === 'object' ? person.company?.name : person.company,
      title: person.title,
      nextAction: person.nextAction,
      priority: person.priority,
    };
  }

  static generateReportsForRole(role: string, person: SpeedrunPerson): string {
    const reportsMap = {
      "Decision Maker": "strategic",
      Champion: "technical",
      Stakeholder: "general",
    };

    return reportsMap[role as keyof typeof reportsMap] || "general";
  }

  static extractDataFromPerson(person: SpeedrunPerson) {
    return {
      profile: this.extractProfileData(person),
      insights: this.extractInsightsData(person),
      career: this.extractCareerData(person),
      workspace: this.extractWorkspaceData(person),
      history: this.extractHistoryData(person),
    };
  }

  private static extractProfileData(person: SpeedrunPerson) {
    return {
      name: person.name,
      title: person.title,
      company: person.company,
      email: person.email,
      phone: person.phone,
      location: person.location,
      linkedinUrl: person.linkedinUrl,
    };
  }

  private static extractInsightsData(person: SpeedrunPerson) {
    return {
      relationship: person.relationship,
      priority: person.priority,
      nextAction: person.nextAction,
      monacoEnrichment: person.customFields?.monacoEnrichment,
    };
  }

  private static extractCareerData(person: SpeedrunPerson) {
    return {
      currentRole: person.title,
      company: person.company,
      experience: person.customFields?.experience,
      skills: person.customFields?.skills,
    };
  }

  private static extractWorkspaceData(person: SpeedrunPerson) {
    return {
      department: person.customFields?.department,
      teamSize: person.customFields?.teamSize,
      budget: person.customFields?.budget,
      technologies: person.customFields?.technologies,
    };
  }

  private static extractHistoryData(person: SpeedrunPerson) {
    return {
      lastContact: person.lastContact,
      interactions: person.customFields?.interactions,
      timeline: person.customFields?.timeline,
    };
  }

  static setupKeyboardShortcuts(
    onComplete: (personId: number) => void,
    onOpenDialer: () => void,
    personId: number,
  ): () => void {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event['key'] === "Enter") {
        event.preventDefault();
        
        // Call the speedrun completion handler
        onComplete(personId);
        
        // Also dispatch event to update card status in Monaco
        const completeEvent = new CustomEvent('completeSpeedrunCard');
        document.dispatchEvent(completeEvent);
        console.log('🎯 Dispatched completeSpeedrunCard event for card status update');
      }
      // DIALER SHORTCUT TEMPORARILY DISABLED
      /*
      if ((event.metaKey || event.ctrlKey) && event['key'] === "h") {
        event.preventDefault();
        onOpenDialer();
      }
      */
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }

  static validatePhoneNumber(phone: string): boolean {
    // Basic phone number validation
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone?.trim() || "");
  }

  static sanitizeInput(input: string): string {
    return input.trim().replace(/[<>]/g, "");
  }

  static debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number,
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }

  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email?.trim() || "");
  }

  static generatePersonSummary(person: SpeedrunPerson): string {
    const parts = [
      person.name,
      person.title,
      person.company,
      person.relationship,
    ].filter(Boolean);

    return parts.join(" • ");
  }

  static getPersonInitials(person: SpeedrunPerson): string {
    return this.getInitials(person.name);
  }

  static getPriorityColor(priority: string): string {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-[var(--hover)] text-gray-800 border-[var(--border)]";
    }
  }

  static getRelationshipColor(relationship: string): string {
    switch (relationship?.toLowerCase()) {
      case "champion":
        return "bg-green-100 text-green-800 border-green-200";
      case "decision maker":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "stakeholder":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "influencer":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-[var(--hover)] text-gray-800 border-[var(--border)]";
    }
  }
}
