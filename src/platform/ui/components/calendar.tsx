"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-2", className)}
      classNames={{
        months: "flex flex-col space-y-2",
        month: "space-y-2",
        caption: "flex justify-center pt-1 relative items-center mb-2",
        caption_label: "text-sm font-medium text-[var(--foreground)]",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          "h-6 w-6 bg-transparent p-0 opacity-50 hover:opacity-100 rounded-sm hover:bg-[var(--hover)]"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse",
        head_row: "flex",
        head_cell:
          "text-[var(--muted)] rounded-md w-8 h-8 flex items-center justify-center font-normal text-xs",
        row: "flex w-full",
        cell: "h-8 w-8 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-blue-500 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          "h-8 w-8 p-0 font-normal aria-selected:opacity-100 rounded-md hover:bg-[var(--hover)] flex items-center justify-center"
        ),
        day_selected:
          "bg-blue-500 text-white hover:bg-blue-600 focus:bg-blue-500 focus:text-white",
        day_today: "bg-[var(--accent)] text-[var(--accent-foreground)] font-semibold",
        day_outside:
          "text-[var(--muted)] opacity-50 aria-selected:bg-blue-100 aria-selected:text-blue-900 aria-selected:opacity-100",
        day_disabled: "text-[var(--muted)] opacity-50 cursor-not-allowed",
        day_range_middle:
          "aria-selected:bg-blue-100 aria-selected:text-blue-900",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-3 w-3" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-3 w-3" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
