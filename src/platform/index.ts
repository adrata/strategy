/**
 * Adrata Operating Systems
 * Enterprise-grade business lifecycle management
 */

// Export available operating systems
// Note: AOS is imported from its specific files when needed
// Coming soon operating systems (not yet implemented):
// export * from "./ros";
// export * from "./eos";
// export * from "./hos";
// export * from "./fos";
// export * from "./areos";

// Operating system registry
export const OPERATING_SYSTEMS = {
  AOS: "Acquisition Operating System",
  ROS: "Retention Operating System",
  EOS: "Expansion Operating System",
  HOS: "Human Capital Operating System",
  FOS: "Founder Operating System",
  AREOS: "Full Lifecycle Operating System",
} as const;

export type OperatingSystemType = keyof typeof OPERATING_SYSTEMS;

// Availability status
export const OS_AVAILABILITY = {
  AOS: true, // Currently available
  ROS: false, // Coming soon
  EOS: false, // Coming soon
  HOS: false, // Coming soon - enterprise recruitment
  FOS: false, // Coming soon - founder client priority
  AREOS: false, // Coming soon
} as const;

// Get available operating systems
export function getAvailableOperatingSystems(): OperatingSystemType[] {
  return Object.entries(OS_AVAILABILITY)
    .filter(([, available]) => available)
    .map(([os]) => os as OperatingSystemType);
}

// Get operating system description
export function getOperatingSystemDescription(os: OperatingSystemType): string {
  return OPERATING_SYSTEMS[os];
}

// Founder-specific utilities
export function getFounderOperatingSystem(): "FOS" {
  return "FOS";
}

export function shouldUpgradeToHOS(
  teamSize: number,
  monthlyHires: number = 0,
): {
  shouldUpgrade: boolean;
  reason: string;
} {
  if (teamSize >= 15) {
    return {
      shouldUpgrade: true,
      reason: "Team size exceeded 15 members - ready for HOS advanced features",
    };
  }

  if (monthlyHires >= 3) {
    return {
      shouldUpgrade: true,
      reason:
        "High hiring velocity - HOS will streamline your recruitment process",
    };
  }

  return {
    shouldUpgrade: false,
    reason:
      "Continue with FOS - upgrade when you reach 15+ employees or 3+ hires/month",
  };
}
