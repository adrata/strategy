// Timing & Time Zone Optimization - Extracted from 1,958-line monolithic SpeedrunRanking.ts

import type { CRMRecord } from "../types";
import type { TimingInfo } from "./types";
import { TIMEZONE_CALLING_PRIORITY } from "./constants";

/**
 * Calculate optimal contact time for a lead based on timezone and patterns
 */
export function calculateOptimalContactTime(record: CRMRecord): TimingInfo {
  // Detect timezone from various sources
  const timeZone = detectTimeZone(record);

  // Calculate calling priority (1-5, 5 = call first, 1 = call later in day)
  const callingPriority =
    TIMEZONE_CALLING_PRIORITY[
      timeZone as keyof typeof TIMEZONE_CALLING_PRIORITY
    ] || TIMEZONE_CALLING_PRIORITY.default;

  // Generate optimal time window
  const optimalTime = generateOptimalTimeWindow(timeZone, callingPriority);

  // Generate calling window description
  const callingWindow = generateCallingWindow(timeZone, callingPriority);

  return {
    timeZone,
    optimalTime,
    callingPriority,
    callingWindow,
  };
}

/**
 * Detect timezone from record data
 */
function detectTimeZone(record: CRMRecord): string {
  // Try to extract timezone from various fields
  const locationData = [
    record.location,
    record.address,
    record.city,
    record.state,
    record.country,
    record.notes,
  ]
    .join(" ")
    .toLowerCase();

  // US Time Zones
  if (
    locationData.includes("new york") ||
    locationData.includes("nyc") ||
    locationData.includes("boston") ||
    locationData.includes("miami") ||
    locationData.includes("atlanta") ||
    locationData.includes("eastern")
  ) {
    return "America/New_York";
  }

  if (
    locationData.includes("chicago") ||
    locationData.includes("dallas") ||
    locationData.includes("houston") ||
    locationData.includes("central")
  ) {
    return "America/Chicago";
  }

  if (locationData.includes("denver") || locationData.includes("mountain")) {
    return "America/Denver";
  }

  if (
    locationData.includes("los angeles") ||
    locationData.includes("san francisco") ||
    locationData.includes("seattle") ||
    locationData.includes("pacific") ||
    locationData.includes("california") ||
    locationData.includes("oregon") ||
    locationData.includes("washington")
  ) {
    return "America/Los_Angeles";
  }

  // International
  if (
    locationData.includes("london") ||
    locationData.includes("uk") ||
    locationData.includes("england") ||
    locationData.includes("britain")
  ) {
    return "Europe/London";
  }

  if (
    locationData.includes("paris") ||
    locationData.includes("berlin") ||
    locationData.includes("madrid") ||
    locationData.includes("amsterdam") ||
    locationData.includes("europe")
  ) {
    return "Europe/Paris";
  }

  if (locationData.includes("tokyo") || locationData.includes("japan")) {
    return "Asia/Tokyo";
  }

  if (
    locationData.includes("singapore") ||
    locationData.includes("hong kong") ||
    locationData.includes("asia")
  ) {
    return "Asia/Singapore";
  }

  if (
    locationData.includes("sydney") ||
    locationData.includes("melbourne") ||
    locationData.includes("australia")
  ) {
    return "Australia/Sydney";
  }

  // Default to Eastern Time if unknown
  return "America/New_York";
}

/**
 * Generate optimal time window description
 */
function generateOptimalTimeWindow(
  timeZone: string,
  callingPriority: number,
): string {
  const now = new Date();
  const timeInZone = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(now);

  if (callingPriority >= 4) {
    return `9:00 AM - 5:00 PM (${timeZone.split("/")[1]?.replace("_", " ")}) - Prime calling window`;
  } else if (callingPriority === 3) {
    return `12:00 PM - 4:00 PM (${timeZone.split("/")[1]?.replace("_", " ")}) - Good overlap`;
  } else {
    return `Early morning or late evening ET (${timeZone.split("/")[1]?.replace("_", " ")}) - Limited window`;
  }
}

/**
 * Generate calling window description for ET perspective
 */
function generateCallingWindow(
  timeZone: string,
  callingPriority: number,
): string {
  switch (timeZone) {
    case "America/New_York":
      return "9:00 AM - 5:00 PM ET (Same timezone)";
    case "America/Chicago":
      return "10:00 AM - 6:00 PM ET (Central Time)";
    case "America/Denver":
      return "11:00 AM - 7:00 PM ET (Mountain Time)";
    case "America/Los_Angeles":
      return "12:00 PM - 8:00 PM ET (Pacific Time)";
    case "Europe/London":
      return "7:00 AM - 12:00 PM ET (UK morning)";
    case "Europe/Paris":
      return "6:00 AM - 11:00 AM ET (EU morning)";
    case "Asia/Tokyo":
      return "6:00 PM - 11:00 PM ET (Asia evening)";
    case "Asia/Singapore":
      return "9:00 PM - 2:00 AM ET (Asia late night)";
    case "Australia/Sydney":
      return "5:00 PM - 11:00 PM ET (Australia evening)";
    default:
      return "9:00 AM - 5:00 PM ET (Assumed Eastern)";
  }
}

/**
 * Check if it's currently a good time to call based on timezone
 */
export function isGoodTimeToCall(timeZone: string): boolean {
  const now = new Date();

  // Get current hour in target timezone
  const targetTime = new Date(now.toLocaleString("en-US", { timeZone }));
  const targetHour = targetTime.getHours();

  // Business hours: 9 AM to 5 PM in target timezone
  return targetHour >= 9 && targetHour <= 17;
}

/**
 * Get next best calling time for a timezone
 */
export function getNextBestCallingTime(timeZone: string): string {
  const now = new Date();
  const targetTime = new Date(now.toLocaleString("en-US", { timeZone }));
  const targetHour = targetTime.getHours();

  if (targetHour < 9) {
    // Before business hours - suggest 9 AM
    const nextCall = new Date(targetTime);
    nextCall.setHours(9, 0, 0, 0);
    return nextCall.toLocaleTimeString("en-US", {
      timeZone,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } else if (targetHour >= 17) {
    // After business hours - suggest 9 AM next day
    const nextCall = new Date(targetTime);
    nextCall.setDate(nextCall.getDate() + 1);
    nextCall.setHours(9, 0, 0, 0);
    return `Tomorrow at ${nextCall.toLocaleTimeString("en-US", {
      timeZone,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })}`;
  } else {
    // During business hours
    return "Now is a good time to call";
  }
}

/**
 * Sort contacts by optimal calling order based on time zones
 */
export function sortByCallingOrder(contacts: any[]): any[] {
  return contacts.sort((a, b) => {
    // First sort by calling priority (higher first)
    const priorityDiff = (b.callingPriority || 0) - (a.callingPriority || 0);
    if (priorityDiff !== 0) return priorityDiff;

    // Then by whether it's currently a good time to call
    const aGoodTime = isGoodTimeToCall(a.timeZone || "America/New_York");
    const bGoodTime = isGoodTimeToCall(b.timeZone || "America/New_York");

    if (aGoodTime && !bGoodTime) return -1;
    if (!aGoodTime && bGoodTime) return 1;

    // Finally by ranking score
    return (b.rankingScore || 0) - (a.rankingScore || 0);
  });
}

/**
 * Get timezone distribution for a list of contacts
 */
export function getTimezoneDistribution(
  contacts: any[],
): Record<string, number> {
  const distribution: Record<string, number> = {};

  contacts.forEach((contact) => {
    const tz = contact.timeZone || "Unknown";
    distribution[tz] = (distribution[tz] || 0) + 1;
  });

  return distribution;
}

/**
 * Generate timezone-optimized calling schedule
 */
export function generateCallingSchedule(contacts: any[]): {
  morning: any[];
  afternoon: any[];
  evening: any[];
  international: any[];
} {
  const schedule = {
    morning: [] as any[],
    afternoon: [] as any[],
    evening: [] as any[],
    international: [] as any[],
  };

  contacts.forEach((contact) => {
    const priority = contact.callingPriority || 3;
    const timeZone = contact.timeZone || "America/New_York";

    if (priority >= 4) {
      // Same/similar timezone - can call during normal hours
      schedule.afternoon.push(contact);
    } else if (priority === 3) {
      // West coast - afternoon is best
      schedule.afternoon.push(contact);
    } else if (timeZone.includes("Europe")) {
      // European contacts - morning calls
      schedule.morning.push(contact);
    } else if (timeZone.includes("Asia") || timeZone.includes("Australia")) {
      // Asian/Australian contacts - evening calls
      schedule.evening.push(contact);
    } else {
      schedule.international.push(contact);
    }
  });

  return schedule;
}
