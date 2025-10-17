"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"
import { cn } from "@/lib/utils"

// Re-export all recharts primitives
export * from "recharts"

// Chart container component
const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: Record<string, any>
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <div
      data-chart={chartId}
      ref={ref}
      className={cn(
        "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
        className
      )}
      {...props}
    >
      <ChartStyle id={chartId} config={config} />
      {children}
    </div>
  )
})
ChartContainer.displayName = "Chart"

const ChartStyle = ({ id, config }: { id: string; config: Record<string, any> }) => {
  const colorConfig = Object.entries(config).reduce(
    (acc, [key, config]) => {
      acc[`--color-${key}`] = config.color
      return acc
    },
    {} as Record<string, string>
  )

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
:root {
  ${Object.entries(colorConfig)
    .map(([key, value]) => `${key}: ${value};`)
    .join("\n")}
}

[data-chart="${id}"] {
  ${Object.entries(config)
    .map(([key, config]) => `--color-${key}: ${config.color};`)
    .join("\n")}
}
        `,
      }}
    />
  )
}

// Chart legend component
const ChartLegend = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    payload: Record<string, any>[] | undefined
    config: Record<string, any>
  }
>(({ className, payload, config, ...props }, ref) => {
  const chart = React.useContext(ChartContext)

  if (!payload?.length) {
    return null
  }

  return (
    <div
      ref={ref}
      className={cn("flex flex-wrap justify-center gap-4", className)}
      {...props}
    >
      {payload.map((entry, index) => {
        const configEntry = config[entry.dataKey] || config[entry.value]
        if (!configEntry) return null

        return (
          <div
            key={`item-${index}`}
            className={cn(
              "flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground"
            )}
            style={
              {
                "--color": configEntry.color,
              } as React.CSSProperties
            }
          >
            <div
              className="h-2 w-2 shrink-0 rounded-[2px]"
              style={{
                backgroundColor: configEntry.color,
              }}
            />
            {configEntry.label}
          </div>
        )
      })}
    </div>
  )
})
ChartLegend.displayName = "ChartLegend"

// Chart tooltip component
const ChartTooltip = RechartsPrimitive.Tooltip

// Chart context for sharing data between components
const ChartContext = React.createContext<{
  config: Record<string, any>
} | null>(null)

const useChartContext = () => {
  const context = React.useContext(ChartContext)
  if (!context) {
    throw new Error("useChartContext must be used within a ChartProvider")
  }
  return context
}

// Chart provider component
const ChartProvider = ({ config, children }: { config: Record<string, any>; children: React.ReactNode }) => {
  return (
    <ChartContext.Provider value={{ config }}>
      {children}
    </ChartContext.Provider>
  )
}

export {
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  ChartProvider,
  useChartContext,
}
