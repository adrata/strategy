"use client";

import React, { useState, useEffect, useMemo } from "react";

interface EngagementDay {
  date: string;
  level: 0 | 1 | 2 | 3 | 4 | 5; // 0 = no activity, 1-5 = increasing engagement (5 LEVELS!)
  count: number;
  activities: string[];
}

interface EngagementGridProps {
  userId?: string | undefined;
  className?: string;
  showTooltips?: boolean;
  showStats?: boolean;
}

// Service to track and calculate engagement
export class EngagementTracker {
  private static readonly STORAGE_KEY = "adrata_user_engagement";

  static trackActivity(type: string, details?: any) {
    const today = new Date().toISOString().split("T")[0];
    const engagement = this.getEngagementData();

    if (today && !engagement[today]) {
      engagement[today] = {
        count: 0,
        activities: [],
        types: {},
      };
    }

    if (today) {
      const todayData = engagement[today];
      if (todayData) {
        todayData.count++;
        todayData.activities.push({
          type,
          details,
          timestamp: new Date().toISOString(),
        });

        if (!todayData['types'][type]) {
          todayData['types'][type] = 0;
        }
        todayData['types'][type]++;
      }
    }

    this.saveEngagementData(engagement);
  }

  static getEngagementData(): Record<string, any> {
    if (typeof window === "undefined") return {};
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  static saveEngagementData(data: Record<string, any>) {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn("Failed to save engagement data:", error);
    }
  }

  static calculateLevel(count: number): 0 | 1 | 2 | 3 | 4 | 5 {
    if (count === 0) return 0;
    if (count <= 2) return 1; // Light activity (1-2 actions)
    if (count <= 5) return 2; // Moderate activity (3-5 actions)
    if (count <= 10) return 3; // Good activity (6-10 actions)
    if (count <= 20) return 4; // High activity (11-20 actions)
    return 5; // Power user activity (21+ actions)
  }

  static getYearData(year: number = new Date().getFullYear()): EngagementDay[] {
    const engagement = this.getEngagementData();
    const days: EngagementDay[] = [];
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const dateStr = d.toISOString().split("T")[0];

      if (dateStr) {
        const dayData = engagement[dateStr];
        days.push({
          date: dateStr,
          level: dayData ? this.calculateLevel(dayData.count) : 0,
          count: dayData ? dayData.count : 0,
          activities: dayData?.activities
            ? dayData.activities.map((a: any) => a.type)
            : [],
        });
      }
    }

    return days;
  }
}

export function EngagementGrid({
  userId,
  className = "",
  showTooltips = true,
  showStats = true,
}: EngagementGridProps) {
  const [yearData, setYearData] = useState<EngagementDay[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [hoveredDay, setHoveredDay] = useState<EngagementDay | null>(null);

  useEffect(() => {
    const data = EngagementTracker.getYearData(selectedYear);
    setYearData(data);

    // Listen for engagement updates
    const handleStorageChange = () => {
      const updatedData = EngagementTracker.getYearData(selectedYear);
      setYearData(updatedData);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("engagement-updated", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("engagement-updated", handleStorageChange);
    };
  }, [selectedYear]);

  const stats = useMemo(() => {
    const totalDays = yearData.filter((d) => d.level > 0).length;
    const totalActivities = yearData.reduce((sum, d) => sum + d.count, 0);
    const currentStreak = calculateCurrentStreak(yearData);
    const longestStreak = calculateLongestStreak(yearData);

    return {
      totalDays,
      totalActivities,
      currentStreak,
      longestStreak,
    };
  }, [yearData]);

  const weeks = useMemo(() => {
    const weeks: EngagementDay[][] = [];
    let currentWeek: EngagementDay[] = [];

    // Start from the first day of the year
    const firstDay = new Date(selectedYear, 0, 1);
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday

    // Add empty days at the beginning if needed
    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push({
        date: "",
        level: 0,
        count: 0,
        activities: [],
      });
    }

    yearData.forEach((day, index) => {
      currentWeek.push(day);

      if (currentWeek['length'] === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    // Add remaining days to the last week
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({
          date: "",
          level: 0,
          count: 0,
          activities: [],
        });
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }, [yearData, selectedYear]);

  const getLevelColor = (level: 0 | 1 | 2 | 3 | 4 | 5): string => {
    switch (level) {
      case 0:
        return "bg-hover"; // No activity
      case 1:
        return "bg-blue-100 dark:bg-blue-900"; // Light
      case 2:
        return "bg-blue-300 dark:bg-blue-700"; // Moderate
      case 3:
        return "bg-blue-500 dark:bg-blue-500"; // Good
      case 4:
        return "bg-blue-700 dark:bg-blue-400"; // High
      case 5:
        return "bg-gradient-to-r from-blue-800 to-purple-800 dark:from-blue-300 dark:to-purple-300"; // Power user!
      default:
        return "bg-hover";
    }
  };

  const formatTooltipDate = (date: string): string => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className={`engagement-grid ${className}`}>
      {showStats && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              Platform Engagement
            </h3>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-1 border border-border rounded-lg bg-background text-foreground"
            >
              {[2024, 2023, 2022].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {stats.totalActivities}
              </div>
              <div className="text-sm text-muted">Total Actions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {stats.totalDays}
              </div>
              <div className="text-sm text-muted">Active Days</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {stats.currentStreak}
              </div>
              <div className="text-sm text-muted">Current Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {stats.longestStreak}
              </div>
              <div className="text-sm text-muted">Longest Streak</div>
            </div>
          </div>
        </div>
      )}

      <div className="engagement-calendar">
        {/* Month labels */}
        <div className="flex mb-2">
          <div className="w-8"></div> {/* Space for day labels */}
          {[
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ].map((month, index) => (
            <div
              key={month}
              className="flex-1 text-xs text-muted text-center"
            >
              {index % 2 === 0 ? month : ""}
            </div>
          ))}
        </div>

        <div className="flex">
          {/* Day labels */}
          <div className="flex flex-col mr-2">
            {["", "Mon", "", "Wed", "", "Fri", ""].map((day, index) => (
              <div
                key={index}
                className="h-3 text-xs text-muted leading-3"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="flex gap-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) => (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    className={`w-3 h-3 rounded-sm ${getLevelColor(day.level)} ${
                      day.date
                        ? "cursor-pointer hover:ring-2 hover:ring-blue-300"
                        : ""
                    }`}
                    onMouseEnter={() => day['date'] && setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    title={
                      showTooltips && day.date
                        ? `${formatTooltipDate(day.date)}\n${day.count} activities`
                        : undefined
                    }
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-xs text-muted">Less</div>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4, 5].map((level) => (
              <div
                key={level}
                className={`w-3 h-3 rounded-sm ${getLevelColor(level as any)}`}
              />
            ))}
          </div>
          <div className="text-xs text-muted">More</div>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredDay && (
        <div className="mt-4 p-3 bg-hover rounded-lg border border-border">
          <div className="font-medium text-foreground">
            {formatTooltipDate(hoveredDay.date)}
          </div>
          <div className="text-sm text-muted">
            {hoveredDay.count} activities
          </div>
          {hoveredDay.activities.length > 0 && (
            <div className="text-xs text-muted mt-1">
              {hoveredDay.activities.slice(0, 3).join(", ")}
              {hoveredDay.activities.length > 3 &&
                ` +${hoveredDay.activities.length - 3} more`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function calculateCurrentStreak(yearData: EngagementDay[]): number {
  let streak = 0;
  const today = new Date().toISOString().split("T")[0];

  if (!today) return 0;

  for (let i = yearData.length - 1; i >= 0; i--) {
    const day = yearData[i];
    if (!day || !day.date) continue;
    if (day.date > today) continue;

    if (day.level > 0) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function calculateLongestStreak(yearData: EngagementDay[]): number {
  let longestStreak = 0;
  let currentStreak = 0;

  yearData.forEach((day) => {
    if (day.level > 0) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  });

  return longestStreak;
}

// Hook to easily track engagement from components
export function useEngagementTracking() {
  const trackActivity = (type: string, details?: any) => {
    EngagementTracker.trackActivity(type, details);

    // Dispatch event to update UI
    window.dispatchEvent(new CustomEvent("engagement-updated"));
  };

  return { trackActivity };
}
